import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { geometry } from "drizzle-orm/pg-core";
import {
  alertSeverityEnum,
  alertStatusEnum,
  dataSourceTypeEnum,
  eventStatusEnum,
  eventTypeEnum,
  notificationChannelEnum,
  notificationDeliveryStatusEnum,
  notificationPlatformEnum,
  notificationTypeEnum,
} from "./enums";

export const dataSources = pgTable(
  "data_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: dataSourceTypeEnum("type").notNull(),
    baseUrl: text("base_url"),
    isOfficial: boolean("is_official").notNull().default(false),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("data_sources_code_idx").on(table.code)],
);

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    point: geometry("point", { type: "point", mode: "xy", srid: 4326 }).notNull(),
    countryCode: varchar("country_code", { length: 2 }),
    state: text("state"),
    city: text("city"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("locations_point_gix").using("gist", table.point)],
);

export const weatherSnapshots = pgTable(
  "weather_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => dataSources.id),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    point: geometry("point", { type: "point", mode: "xy", srid: 4326 }).notNull(),
    temperature: doublePrecision("temperature"),
    apparentTemperature: doublePrecision("apparent_temperature"),
    humidity: doublePrecision("humidity"),
    windSpeed: doublePrecision("wind_speed"),
    windGust: doublePrecision("wind_gust"),
    precipitation: doublePrecision("precipitation"),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("weather_snapshots_source_observed_idx").on(
      table.sourceId,
      table.observedAt,
    ),
  ],
);

export const naturalEvents = pgTable(
  "natural_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalId: text("external_id").notNull(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => dataSources.id),
    type: eventTypeEnum("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    severity: alertSeverityEnum("severity").notNull(),
    status: eventStatusEnum("status").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    updatedAtSource: timestamp("updated_at_source", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    geometry: geometry("geometry", { type: "geometry", srid: 4326 }),
    rawMetadata: jsonb("raw_metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("natural_events_unique_source_external").on(
      table.sourceId,
      table.externalId,
    ),
    index("natural_events_source_id_idx").on(table.sourceId),
    index("natural_events_external_id_idx").on(table.externalId),
    index("natural_events_occurred_at_idx").on(table.occurredAt),
    index("natural_events_expires_at_idx").on(table.expiresAt),
    index("natural_events_geometry_gix").using("gist", table.geometry),
  ],
);

export const officialAlerts = pgTable(
  "official_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalId: text("external_id").notNull(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => dataSources.id),
    eventType: text("event_type").notNull(),
    severity: alertSeverityEnum("severity").notNull(),
    status: alertStatusEnum("status").notNull(),
    headline: text("headline").notNull(),
    description: text("description"),
    instruction: text("instruction"),
    effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    geometry: geometry("geometry", { type: "geometry", srid: 4326 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("official_alerts_unique_source_external").on(
      table.sourceId,
      table.externalId,
    ),
    index("official_alerts_source_id_idx").on(table.sourceId),
    index("official_alerts_external_id_idx").on(table.externalId),
    index("official_alerts_expires_at_idx").on(table.expiresAt),
    index("official_alerts_geometry_gix").using("gist", table.geometry),
  ],
);

export const notificationEndpoints = pgTable(
  "notification_endpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    anonymousIdentityHash: text("anonymous_identity_hash").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    endpointHash: text("endpoint_hash").notNull(),
    encryptedSubscription: text("encrypted_subscription").notNull(),
    platform: notificationPlatformEnum("platform").notNull().default("WEB"),
    userAgentHash: text("user_agent_hash"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("notification_endpoints_unique_endpoint").on(
      table.channel,
      table.endpointHash,
    ),
    index("notification_endpoints_identity_idx").on(table.anonymousIdentityHash),
    index("notification_endpoints_active_idx").on(table.isActive),
  ],
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    anonymousIdentityHash: text("anonymous_identity_hash").notNull(),
    notificationsEnabled: boolean("notifications_enabled").notNull().default(false),
    weatherNotifications: boolean("weather_notifications").notNull().default(false),
    officialAlerts: boolean("official_alerts").notNull().default(true),
    earthquakes: boolean("earthquakes").notNull().default(false),
    fires: boolean("fires").notNull().default(false),
    cyclones: boolean("cyclones").notNull().default(false),
    minimumSeverity: alertSeverityEnum("minimum_severity").notNull().default("MODERATE"),
    quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(true),
    quietHoursStart: varchar("quiet_hours_start", { length: 5 }).notNull().default("22:00"),
    quietHoursEnd: varchar("quiet_hours_end", { length: 5 }).notNull().default("07:00"),
    radiusKm: doublePrecision("radius_km").notNull().default(25),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("notification_preferences_identity_idx").on(
      table.anonymousIdentityHash,
    ),
  ],
);

export const notificationMonitoredLocations = pgTable(
  "notification_monitored_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    anonymousIdentityHash: text("anonymous_identity_hash").notNull(),
    label: text("label").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    point: geometry("point", { type: "point", mode: "xy", srid: 4326 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
  },
  (table) => [
    index("notification_monitored_locations_identity_idx").on(
      table.anonymousIdentityHash,
    ),
    index("notification_monitored_locations_point_gix").using("gist", table.point),
  ],
);

export const notificationMessages = pgTable(
  "notification_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: notificationTypeEnum("type").notNull(),
    severity: alertSeverityEnum("severity").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    source: text("source").notNull(),
    eventId: text("event_id"),
    locationId: uuid("location_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    deduplicationKey: text("deduplication_key").notNull(),
    version: text("version").notNull().default("1"),
    deepLink: text("deep_link").notNull().default("/"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("notification_messages_idempotency_idx").on(table.idempotencyKey),
    index("notification_messages_deduplication_idx").on(
      table.deduplicationKey,
      table.createdAt,
    ),
  ],
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notificationMessages.id),
    endpointId: uuid("endpoint_id")
      .notNull()
      .references(() => notificationEndpoints.id),
    status: notificationDeliveryStatusEnum("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    provider: text("provider").notNull(),
    providerMessageId: text("provider_message_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("notification_deliveries_idempotency_idx").on(
      table.idempotencyKey,
    ),
    index("notification_deliveries_endpoint_idx").on(
      table.endpointId,
      table.createdAt,
    ),
    index("notification_deliveries_status_idx").on(table.status, table.createdAt),
  ],
);

export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type WeatherSnapshot = typeof weatherSnapshots.$inferSelect;
export type NaturalEvent = typeof naturalEvents.$inferSelect;
export type OfficialAlert = typeof officialAlerts.$inferSelect;
export type NotificationEndpoint = typeof notificationEndpoints.$inferSelect;
export type NewNotificationEndpoint = typeof notificationEndpoints.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;
export type NotificationMessage = typeof notificationMessages.$inferSelect;
export type NewNotificationMessage = typeof notificationMessages.$inferInsert;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type NewNotificationDelivery = typeof notificationDeliveries.$inferInsert;
