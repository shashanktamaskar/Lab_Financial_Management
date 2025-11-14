import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  expenses, InsertExpense, Expense,
  debts, InsertDebt, Debt,
  debtPayments, InsertDebtPayment, DebtPayment,
  invoices, InsertInvoice, Invoice,
  expenseCategories, InsertExpenseCategory, ExpenseCategory,
  onedriveSync, InsertOnedriveSync, OnedriveSync
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

// ============= USER OPERATIONS =============

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

// ============= EXPENSE OPERATIONS =============

export async function createExpense(expense: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(expenses).values(expense);
  return result;
}

export async function getExpensesByUser(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(expenses.userId, userId)];
  
  if (startDate) {
    conditions.push(gte(expenses.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(expenses.date, endDate));
  }
  
  return await db
    .select()
    .from(expenses)
    .where(and(...conditions))
    .orderBy(desc(expenses.date));
}

export async function getExpenseById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateExpense(id: number, userId: number, data: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(expenses)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

export async function deleteExpense(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

// ============= EXPENSE CATEGORY OPERATIONS =============

export async function createExpenseCategory(category: InsertExpenseCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(expenseCategories).values(category);
}

export async function getCategoriesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.userId, userId))
    .orderBy(expenseCategories.name);
}

export async function updateExpenseCategory(id: number, userId: number, data: Partial<InsertExpenseCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(expenseCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(expenseCategories.id, id), eq(expenseCategories.userId, userId)));
}

export async function deleteExpenseCategory(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .delete(expenseCategories)
    .where(and(eq(expenseCategories.id, id), eq(expenseCategories.userId, userId)));
}

// ============= INVOICE OPERATIONS =============

export async function createInvoice(invoice: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(invoices).values(invoice);
}

export async function getInvoicesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.uploadedDate));
}

export async function getInvoiceById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateInvoice(id: number, userId: number, data: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(invoices)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
}

export async function deleteInvoice(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .delete(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
}

// ============= DEBT OPERATIONS =============

export async function createDebt(debt: InsertDebt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(debts).values(debt);
}

export async function getDebtsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(debts)
    .where(eq(debts.userId, userId))
    .orderBy(desc(debts.createdAt));
}

export async function getDebtById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(debts)
    .where(and(eq(debts.id, id), eq(debts.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateDebt(id: number, userId: number, data: Partial<InsertDebt>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(debts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(debts.id, id), eq(debts.userId, userId)));
}

export async function deleteDebt(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .delete(debts)
    .where(and(eq(debts.id, id), eq(debts.userId, userId)));
}

// ============= DEBT PAYMENT OPERATIONS =============

export async function createDebtPayment(payment: InsertDebtPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(debtPayments).values(payment);
}

export async function getDebtPayments(debtId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(debtPayments)
    .where(and(eq(debtPayments.debtId, debtId), eq(debtPayments.userId, userId)))
    .orderBy(desc(debtPayments.paymentDate));
}

// ============= ONEDRIVE SYNC OPERATIONS =============

export async function getOrCreateOnedriveSync(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db
    .select()
    .from(onedriveSync)
    .where(eq(onedriveSync.userId, userId))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  const newSync: InsertOnedriveSync = {
    userId,
    status: "idle",
  };
  
  await db.insert(onedriveSync).values(newSync);
  return newSync;
}

export async function updateOnedriveSync(userId: number, data: Partial<InsertOnedriveSync>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(onedriveSync)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(onedriveSync.userId, userId));
}

// ============= DASHBOARD STATISTICS =============

export async function getExpenseStats(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { total: 0, byCategory: [] };
  
  const expenseList = await db
    .select()
    .from(expenses)
    .where(and(
      eq(expenses.userId, userId),
      gte(expenses.date, startDate),
      lte(expenses.date, endDate)
    ));
  
  const total = expenseList.reduce((sum, exp) => {
    return sum + parseFloat(exp.amount as any);
  }, 0);
  
  const byCategory: Record<string, number> = {};
  for (const exp of expenseList) {
    const catId = exp.categoryId?.toString() || "uncategorized";
    byCategory[catId] = (byCategory[catId] || 0) + parseFloat(exp.amount as any);
  }
  
  return { total, byCategory };
}

export async function getDebtStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalPrincipal: 0, totalRemaining: 0, activeCount: 0 };
  
  const debtList = await db
    .select()
    .from(debts)
    .where(eq(debts.userId, userId));
  
  const totalPrincipal = debtList.reduce((sum, debt) => {
    return sum + parseFloat(debt.principalAmount as any);
  }, 0);
  
  const totalRemaining = debtList.reduce((sum, debt) => {
    return sum + parseFloat(debt.remainingAmount as any);
  }, 0);
  
  const activeCount = debtList.filter(d => d.status !== "paid").length;
  
  return { totalPrincipal, totalRemaining, activeCount };
}
