import { pgTable, text, timestamp, uuid, integer, real, boolean, jsonb, varchar } from "drizzle-orm/pg-core";

/**
 * Users table - Almacena información de usuarios verificados con World ID
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  worldIdHash: text("world_id_hash").notNull().unique(), // Hash único de World ID
  
  // Balances
  balanceNuma: real("balance_numa").notNull().default(0),
  balanceWld: real("balance_wld").notNull().default(0),
  
  // Membresía
  membershipTier: varchar("membership_tier", { length: 20 }).notNull().default("free"), // 'free' | 'plus' | 'vip'
  membershipStartedAt: timestamp("membership_started_at"),
  membershipExpiresAt: timestamp("membership_expires_at"),
  membershipMonthsPaid: integer("membership_months_paid").notNull().default(0),
  membershipConsecutiveMonths: integer("membership_consecutive_months").notNull().default(0),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
});

/**
 * Positions table - Posiciones de trading (NUMA/WLD y WLD/USDT)
 */
export const positions = pgTable("positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  
  // Detalles de la posición
  symbol: varchar("symbol", { length: 20 }).notNull(), // 'NUMA/WLD' | 'WLD/USDT'
  side: varchar("side", { length: 10 }).notNull(), // 'long' | 'short'
  amount: real("amount").notNull(), // Cantidad en el token base
  leverage: integer("leverage").notNull(), // 1-500x
  entryPrice: real("entry_price").notNull(),
  liquidationPrice: real("liquidation_price").notNull(),
  
  // Estado
  status: varchar("status", { length: 20 }).notNull().default("open"), // 'open' | 'closed' | 'liquidated'
  currentPrice: real("current_price").notNull(),
  pnl: real("pnl").notNull().default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

/**
 * Pioneers table - Sistema de Pioneros (staking)
 */
export const pioneers = pgTable("pioneers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  
  // Capital y ranking
  capitalLocked: real("capital_locked").notNull(), // WLD bloqueado
  rank: integer("rank").notNull(), // Posición en el ranking
  
  // Recompensas
  totalRewardsEarned: real("total_rewards_earned").notNull().default(0),
  claimableProfits: real("claimable_profits").notNull().default(0),
  
  // Timestamps
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lockEndsAt: timestamp("lock_ends_at").notNull(), // 1 año después de joinedAt
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Transactions table - Historial de transacciones
 */
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  
  // Tipo y detalles
  type: varchar("type", { length: 50 }).notNull(), // 'trade' | 'deposit' | 'withdrawal' | 'membership' | 'staking' | 'reward'
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  token: varchar("token", { length: 10 }).notNull(), // 'NUMA' | 'WLD'
  
  // Balances después de la transacción
  balanceAfterNuma: real("balance_after_numa").notNull(),
  balanceAfterWld: real("balance_after_wld").notNull(),
  
  // Metadata
  metadata: jsonb("metadata"), // Datos adicionales específicos del tipo de transacción
  
  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Achievements table - Sistema de logros y gamificación
 */
export const achievements = pgTable("achievements", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  
  // Detalles del logro
  achievementType: varchar("achievement_type", { length: 50 }).notNull(), // 'first_trade' | 'first_win' | '10_trades' | 'pioneer' | etc
  title: text("title").notNull(),
  description: text("description").notNull(),
  reward: real("reward").notNull().default(0), // NUMA como recompensa
  
  // Estado
  isCompleted: boolean("is_completed").notNull().default(false),
  isClaimed: boolean("is_claimed").notNull().default(false),
  
  // Timestamps
  completedAt: timestamp("completed_at"),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Daily Rewards table - Recompensas diarias por membresía
 */
export const dailyRewards = pgTable("daily_rewards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  
  // Detalles de la recompensa
  amount: real("amount").notNull(), // Cantidad de NUMA recibida
  membershipTier: varchar("membership_tier", { length: 20 }).notNull(),
  
  // Timestamps
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  date: timestamp("date").notNull(), // Día para el que se reclama (00:00:00)
});

/**
 * Referrals table - Sistema de referencias
 */
export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Usuario que refiere
  referrerId: uuid("referrer_id").references(() => users.id).notNull(),
  
  // Usuario referido
  referredId: uuid("referred_id").references(() => users.id).notNull().unique(),
  
  // Recompensas
  rewardPaid: boolean("reward_paid").notNull().default(false),
  rewardAmount: real("reward_amount").notNull().default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  rewardPaidAt: timestamp("reward_paid_at"),
});

/**
 * Analytics Events table - Tracking de eventos para análisis
 */
export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  
  // Evento
  eventName: varchar("event_name", { length: 100 }).notNull(), // 'page_view' | 'trade_opened' | 'membership_purchased' | etc
  eventData: jsonb("event_data"), // Datos adicionales del evento
  
  // Context
  sessionId: text("session_id"),
  userAgent: text("user_agent"),
  
  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tipos TypeScript inferidos del esquema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Position = typeof positions.$inferSelect;
export type NewPosition = typeof positions.$inferInsert;

export type Pioneer = typeof pioneers.$inferSelect;
export type NewPioneer = typeof pioneers.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

export type DailyReward = typeof dailyRewards.$inferSelect;
export type NewDailyReward = typeof dailyRewards.$inferInsert;

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
