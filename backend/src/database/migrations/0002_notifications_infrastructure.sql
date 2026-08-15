DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('WEB_PUSH', 'EXPO', 'FCM', 'APNS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_platform AS ENUM ('WEB', 'ANDROID', 'IOS', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('TEST', 'WEATHER_INFO', 'OFFICIAL_ALERT', 'EARTHQUAKE', 'FIRE', 'CYCLONE', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_delivery_status AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'EXPIRED', 'SKIPPED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notification_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_identity_hash text NOT NULL,
  channel notification_channel NOT NULL,
  endpoint_hash text NOT NULL,
  encrypted_subscription text NOT NULL,
  platform notification_platform NOT NULL DEFAULT 'WEB',
  user_agent_hash text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  CONSTRAINT notification_endpoints_unique_endpoint UNIQUE (channel, endpoint_hash)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_identity_hash text NOT NULL UNIQUE,
  notifications_enabled boolean NOT NULL DEFAULT false,
  weather_notifications boolean NOT NULL DEFAULT false,
  official_alerts boolean NOT NULL DEFAULT true,
  earthquakes boolean NOT NULL DEFAULT false,
  fires boolean NOT NULL DEFAULT false,
  cyclones boolean NOT NULL DEFAULT false,
  minimum_severity alert_severity NOT NULL DEFAULT 'MODERATE',
  quiet_hours_enabled boolean NOT NULL DEFAULT true,
  quiet_hours_start varchar(5) NOT NULL DEFAULT '22:00',
  quiet_hours_end varchar(5) NOT NULL DEFAULT '07:00',
  radius_km double precision NOT NULL DEFAULT 25,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_radius_check CHECK (radius_km BETWEEN 1 AND 500),
  CONSTRAINT notification_preferences_quiet_start_check CHECK (quiet_hours_start ~ '^[0-2][0-9]:[0-5][0-9]$'),
  CONSTRAINT notification_preferences_quiet_end_check CHECK (quiet_hours_end ~ '^[0-2][0-9]:[0-5][0-9]$')
);

CREATE TABLE IF NOT EXISTS notification_monitored_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_identity_hash text NOT NULL,
  label text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  point jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  CONSTRAINT notification_monitored_locations_latitude_check CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT notification_monitored_locations_longitude_check CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS notification_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  severity alert_severity NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  source text NOT NULL,
  event_id text,
  location_id uuid,
  idempotency_key text NOT NULL UNIQUE,
  deduplication_key text NOT NULL,
  version text NOT NULL DEFAULT '1',
  deep_link text NOT NULL DEFAULT '/',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notification_messages(id),
  endpoint_id uuid NOT NULL REFERENCES notification_endpoints(id),
  status notification_delivery_status NOT NULL DEFAULT 'PENDING',
  attempts integer NOT NULL DEFAULT 0,
  provider text NOT NULL,
  provider_message_id text,
  idempotency_key text NOT NULL UNIQUE,
  sent_at timestamptz,
  failed_at timestamptz,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_endpoints_identity_idx ON notification_endpoints (anonymous_identity_hash);
CREATE INDEX IF NOT EXISTS notification_endpoints_active_idx ON notification_endpoints (is_active);
CREATE INDEX IF NOT EXISTS notification_monitored_locations_identity_idx ON notification_monitored_locations (anonymous_identity_hash);
CREATE INDEX IF NOT EXISTS notification_monitored_locations_coordinates_idx ON notification_monitored_locations (latitude, longitude);
CREATE INDEX IF NOT EXISTS notification_messages_deduplication_idx ON notification_messages (deduplication_key, created_at);
CREATE INDEX IF NOT EXISTS notification_deliveries_endpoint_idx ON notification_deliveries (endpoint_id, created_at);
CREATE INDEX IF NOT EXISTS notification_deliveries_status_idx ON notification_deliveries (status, created_at);
