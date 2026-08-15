import {
  boolean,
  doublePrecision,
  index,
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

export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type WeatherSnapshot = typeof weatherSnapshots.$inferSelect;
export type NaturalEvent = typeof naturalEvents.$inferSelect;
export type OfficialAlert = typeof officialAlerts.$inferSelect;
