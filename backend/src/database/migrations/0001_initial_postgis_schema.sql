CREATE EXTENSION IF NOT EXISTS postgis;

DO $$ BEGIN
  CREATE TYPE data_source_type AS ENUM ('WEATHER', 'OFFICIAL_ALERT', 'EARTHQUAKE', 'FIRE', 'AIR_QUALITY', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('INFO', 'MINOR', 'MODERATE', 'SEVERE', 'EXTREME');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('EARTHQUAKE', 'CYCLONE', 'FLOOD', 'FIRE', 'VOLCANO', 'TSUNAMI', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'OBSERVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type data_source_type NOT NULL,
  base_url text,
  is_official boolean NOT NULL DEFAULT false,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  point geometry(Point, 4326) NOT NULL,
  country_code char(2),
  state text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT locations_latitude_check CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT locations_longitude_check CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS weather_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES data_sources(id),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  point geometry(Point, 4326) NOT NULL,
  temperature double precision,
  apparent_temperature double precision,
  humidity double precision,
  wind_speed double precision,
  wind_gust double precision,
  precipitation double precision,
  observed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT weather_snapshots_latitude_check CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT weather_snapshots_longitude_check CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS natural_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  source_id uuid NOT NULL REFERENCES data_sources(id),
  type event_type NOT NULL,
  title text NOT NULL,
  description text,
  severity alert_severity NOT NULL,
  status event_status NOT NULL,
  occurred_at timestamptz,
  updated_at_source timestamptz,
  expires_at timestamptz,
  latitude double precision,
  longitude double precision,
  geometry geometry(Geometry, 4326),
  raw_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT natural_events_unique_source_external UNIQUE (source_id, external_id)
);

CREATE TABLE IF NOT EXISTS official_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  source_id uuid NOT NULL REFERENCES data_sources(id),
  event_type text NOT NULL,
  severity alert_severity NOT NULL,
  status alert_status NOT NULL,
  headline text NOT NULL,
  description text,
  instruction text,
  effective_at timestamptz NOT NULL,
  expires_at timestamptz,
  geometry geometry(Geometry, 4326),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT official_alerts_unique_source_external UNIQUE (source_id, external_id)
);

CREATE INDEX IF NOT EXISTS data_sources_code_idx ON data_sources (code);
CREATE INDEX IF NOT EXISTS natural_events_source_id_idx ON natural_events (source_id);
CREATE INDEX IF NOT EXISTS natural_events_external_id_idx ON natural_events (external_id);
CREATE INDEX IF NOT EXISTS natural_events_occurred_at_idx ON natural_events (occurred_at);
CREATE INDEX IF NOT EXISTS natural_events_expires_at_idx ON natural_events (expires_at);
CREATE INDEX IF NOT EXISTS natural_events_geometry_gix ON natural_events USING gist (geometry);
CREATE INDEX IF NOT EXISTS official_alerts_source_id_idx ON official_alerts (source_id);
CREATE INDEX IF NOT EXISTS official_alerts_external_id_idx ON official_alerts (external_id);
CREATE INDEX IF NOT EXISTS official_alerts_expires_at_idx ON official_alerts (expires_at);
CREATE INDEX IF NOT EXISTS official_alerts_geometry_gix ON official_alerts USING gist (geometry);
CREATE INDEX IF NOT EXISTS locations_point_gix ON locations USING gist (point);
CREATE INDEX IF NOT EXISTS weather_snapshots_source_observed_idx ON weather_snapshots (source_id, observed_at);
