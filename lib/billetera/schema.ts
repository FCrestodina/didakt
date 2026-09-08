import { pgTable, uuid, text, integer, timestamp, boolean, unique } from "drizzle-orm/pg-core";

export const classrooms = pgTable("classrooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  initialBalance: integer("initial_balance").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
});

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    avatar: text("avatar").notNull(),
    balance: integer("balance").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.classroomId, t.username)]
);

export const movements = pgTable("movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  comercio: text("comercio").notNull(),
  producto: text("producto").notNull(),
  precioBase: integer("precio_base").notNull(),
  descuento: integer("descuento").default(0).notNull(),
  reintegro: integer("reintegro").default(0).notNull(),
  total: integer("total").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  promoKey: text("promo_key"),
});

export const promoUsages = pgTable(
  "promo_usages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").references(() => students.id).notNull(),
    promoKey: text("promo_key").notNull(),
    usesCount: integer("uses_count").default(1).notNull(),
  },
  (t) => [unique().on(t.studentId, t.promoKey)]
);
