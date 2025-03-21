
import { z } from "zod";
import { pgTable, serial, integer, timestamp, numeric, text } from 'drizzle-orm/pg-core';

// Define database tables
export const salaries = pgTable('salaries', {
  id: serial('id').primaryKey(),
  amount: numeric('amount').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  amount: numeric('amount').notNull(),
  category: text('category').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Types derived from the tables
export type Salary = {
  id: number;
  amount: number;
  month: number;
  year: number;
  createdAt: Date;
};

export type Expense = {
  id: number;
  amount: number;
  category: string;
  month: number;
  year: number;
  createdAt: Date;
};

// Zod schemas for validation
export const insertSalarySchema = z.object({
  amount: z.number(),
  month: z.number(),
  year: z.number(),
});

export const updateSalarySchema = insertSalarySchema.extend({
  id: z.number(),
});

export const insertExpenseSchema = z.object({
  amount: z.number(),
  category: z.string(),
  date: z.string(),
  month: z.number(),
  year: z.number(),
});

export const updateExpenseSchema = insertExpenseSchema.extend({
  id: z.number(),
});

export const categories = [
  "Rent",
  "School Fees",
  "City Transport",
  "Vacation",
  "Shopping",
  "Food",
  "Grocery",
] as const;

export type Category = typeof categories[number];
export type InsertSalary = z.infer<typeof insertSalarySchema>;
export type UpdateSalary = z.infer<typeof updateSalarySchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;
