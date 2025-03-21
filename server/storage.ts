import { type Salary, type InsertSalary, type UpdateSalary, type Expense, type InsertExpense, type UpdateExpense } from "@shared/schema";
import { db } from './db';
import { eq } from 'drizzle-orm';
import { salaries, expenses } from '../shared/schema';

export interface IStorage {
  getSalaries(): Promise<Salary[]>;
  createSalary(salary: InsertSalary): Promise<Salary>;
  updateSalary(salary: UpdateSalary): Promise<Salary>;
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(updateExpense: UpdateExpense): Promise<Expense>;
}

export class PostgresStorage implements IStorage {
  async getSalaries(): Promise<Salary[]> {
    return await db.select().from(salaries).orderBy(salaries.createdAt);
  }

  async createSalary(insertSalary: InsertSalary): Promise<Salary> {
    const [salary] = await db.insert(salaries).values({
      ...insertSalary,
      createdAt: new Date()
    }).returning();
    return salary;
  }

  async updateSalary(updateSalary: UpdateSalary): Promise<Salary> {
    const { id, ...values } = updateSalary;
    const [salary] = await db
      .update(salaries)
      .set(values)
      .where(eq(salaries.id, id))
      .returning();

    if (!salary) {
      throw new Error(`Salary with id ${id} not found`);
    }

    return salary;
  }

  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(expenses.createdAt);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values({
      ...insertExpense,
      createdAt: insertExpense.date ? new Date(insertExpense.date) : new Date()
    }).returning();
    return expense;
  }

  async updateExpense(updateExpense: UpdateExpense): Promise<Expense> {
    const { id, ...values } = updateExpense;
    const [expense] = await db
      .update(expenses)
      .set({
        ...values,
        createdAt: values.date ? new Date(values.date) : undefined
      })
      .where(eq(expenses.id, id))
      .returning();

    if (!expense) {
      throw new Error(`Expense with id ${id} not found`);
    }

    return expense;
  }
}

// Export a single instance of the storage for use throughout the application
export const storage = new PostgresStorage();