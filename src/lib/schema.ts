import { pgTable, serial, text, varchar, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  password: text('password'),
  role: varchar('role', { length: 20 }).default('STUDENT'),
  createdAt: timestamp('created_at').defaultNow(),
})