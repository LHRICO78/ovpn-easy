import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * OpenVPN server interface configuration
 */
export const interfaces = mysqlTable("interfaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().default("server"),
  port: int("port").notNull().default(1194),
  protocol: mysqlEnum("protocol", ["udp", "tcp"]).default("udp").notNull(),
  network: varchar("network", { length: 64 }).notNull().default("10.8.0.0"),
  netmask: varchar("netmask", { length: 64 }).notNull().default("255.255.255.0"),
  dns1: varchar("dns1", { length: 64 }).default("1.1.1.1"),
  dns2: varchar("dns2", { length: 64 }).default("1.0.0.1"),
  compression: boolean("compression").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Interface = typeof interfaces.$inferSelect;
export type InsertInterface = typeof interfaces.$inferInsert;

/**
 * VPN clients
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  enabled: boolean("enabled").default(true).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }).notNull(),
  certificateData: text("certificateData"),
  privateKeyData: text("privateKeyData"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Server configuration and hooks
 */
export const serverConfig = mysqlTable("serverConfig", {
  id: int("id").autoincrement().primaryKey(),
  publicHost: varchar("publicHost", { length: 255 }).notNull(),
  publicPort: int("publicPort").notNull().default(1194),
  preUp: text("preUp"),
  postUp: text("postUp"),
  preDown: text("preDown"),
  postDown: text("postDown"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServerConfig = typeof serverConfig.$inferSelect;
export type InsertServerConfig = typeof serverConfig.$inferInsert;

/**
 * Connection statistics
 */
export const connectionStats = mysqlTable("connectionStats", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  connectedAt: timestamp("connectedAt").notNull(),
  disconnectedAt: timestamp("disconnectedAt"),
  bytesReceived: int("bytesReceived").default(0),
  bytesSent: int("bytesSent").default(0),
  realAddress: varchar("realAddress", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConnectionStat = typeof connectionStats.$inferSelect;
export type InsertConnectionStat = typeof connectionStats.$inferInsert;

