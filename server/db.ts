import { eq, desc, and, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  interfaces, 
  clients, 
  serverConfig, 
  connectionStats,
  InsertClient,
  InsertInterface,
  InsertServerConfig,
  InsertConnectionStat
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Interface queries
export async function getInterface() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(interfaces).limit(1);
  
  if (result.length === 0) {
    // Create default interface
    await db.insert(interfaces).values({});
    return (await db.select().from(interfaces).limit(1))[0];
  }
  
  return result[0];
}

export async function updateInterface(id: number, data: Partial<InsertInterface>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(interfaces).set(data).where(eq(interfaces.id, id));
}

// Client queries
export async function getClients(userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (userId) {
    return await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
  }
  
  return await db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(clients).values(data);
  return result;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(clients).where(eq(clients.id, id));
}

export async function toggleClient(id: number, enabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(clients).set({ enabled }).where(eq(clients.id, id));
}

// Server config queries
export async function getServerConfig() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(serverConfig).limit(1);
  
  if (result.length === 0) {
    // Create default config
    await db.insert(serverConfig).values({
      publicHost: "vpn.example.com",
      publicPort: 1194,
    });
    return (await db.select().from(serverConfig).limit(1))[0];
  }
  
  return result[0];
}

export async function updateServerConfig(id: number, data: Partial<InsertServerConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(serverConfig).set(data).where(eq(serverConfig.id, id));
}

// Connection stats queries
export async function getClientStats(clientId: number, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(connectionStats)
    .where(eq(connectionStats.clientId, clientId))
    .orderBy(desc(connectionStats.connectedAt))
    .limit(limit);
}

export async function createConnectionStat(data: InsertConnectionStat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(connectionStats).values(data);
}

export async function getActiveConnections() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(connectionStats)
    .where(isNull(connectionStats.disconnectedAt))
    .orderBy(desc(connectionStats.connectedAt));
}

