import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  expenses, InsertExpense,
  debts, InsertDebt,
  debtPayments, InsertDebtPayment,
  invoices, InsertInvoice,
  expenseCategories, InsertExpenseCategory,
  onedriveSync, InsertOnedriveSync,
  labMembers, InsertLabMember,
  projects, InsertProject,
  projectMembers,
  vendors, InsertVendor,
  budgets, InsertBudget,
  inventoryItems, InsertInventoryItem,
  recurringExpenses, InsertRecurringExpense,
  auditLogs, InsertAuditLog,
  notifications, InsertNotification
} from "./schema";

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
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // For OAuth users, openId is required; for email users, email is required
    const values: any = {
      openId: user.openId || null,
      name: user.name || "User",
      email: user.email || "",
      loginMethod: user.loginMethod || "email",
      role: user.role || "member",
      lastSignedIn: user.lastSignedIn || new Date(),
    };

    // Include optional fields if provided
    if (user.passwordHash !== undefined) {
      values.passwordHash = user.passwordHash;
    }

    const updateSet: Record<string, any> = {
      name: values.name,
      email: values.email,
      loginMethod: values.loginMethod,
      role: values.role,
      lastSignedIn: new Date(),
    };

    // Use email as the unique key for upserts (since we're moving to email/password auth)
    if (user.openId) {
      await db.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
    } else {
      await db.insert(users).values(values);
    }
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

// ============= LAB MEMBER OPERATIONS =============

export async function createLabMember(member: InsertLabMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(labMembers).values(member);
}

export async function getLabMembersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(labMembers)
    .where(eq(labMembers.userId, userId))
    .orderBy(labMembers.name);
}

export async function getLabMemberById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(labMembers)
    .where(and(eq(labMembers.id, id), eq(labMembers.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateLabMember(id: number, userId: number, data: Partial<InsertLabMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(labMembers)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(labMembers.id, id), eq(labMembers.userId, userId)));
}

export async function deleteLabMember(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(labMembers)
    .where(and(eq(labMembers.id, id), eq(labMembers.userId, userId)));
}

// ============= PROJECT OPERATIONS =============

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(projects).values(project);
}

export async function getProjectsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateProject(id: number, userId: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function deleteProject(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

// ============= PROJECT MEMBER OPERATIONS =============

export async function addProjectMember(projectId: number, labMemberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(projectMembers).values({ projectId, labMemberId });
}

export async function getProjectMembers(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
}

export async function removeProjectMember(projectId: number, labMemberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.labMemberId, labMemberId)));
}

// ============= VENDOR OPERATIONS =============

export async function createVendor(vendor: InsertVendor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(vendors).values(vendor);
}

export async function getVendorsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(vendors)
    .where(eq(vendors.userId, userId))
    .orderBy(vendors.name);
}

export async function getVendorById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.id, id), eq(vendors.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateVendor(id: number, userId: number, data: Partial<InsertVendor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(vendors)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(vendors.id, id), eq(vendors.userId, userId)));
}

export async function deleteVendor(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(vendors)
    .where(and(eq(vendors.id, id), eq(vendors.userId, userId)));
}

// ============= BUDGET OPERATIONS =============

export async function createBudget(budget: InsertBudget) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(budgets).values(budget);
}

export async function getBudgetsByUser(userId: number, year?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(budgets.userId, userId)];
  if (year) {
    conditions.push(eq(budgets.year, year));
  }

  return await db
    .select()
    .from(budgets)
    .where(and(...conditions))
    .orderBy(budgets.categoryId);
}

export async function getBudgetById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateBudget(id: number, userId: number, data: Partial<InsertBudget>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(budgets)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
}

export async function deleteBudget(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
}

// ============= INVENTORY ITEM OPERATIONS =============

export async function createInventoryItem(item: InsertInventoryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(inventoryItems).values(item);
}

export async function getInventoryItemsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.userId, userId))
    .orderBy(inventoryItems.name);
}

export async function getInventoryItemById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateInventoryItem(id: number, userId: number, data: Partial<InsertInventoryItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(inventoryItems)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)));
}

export async function deleteInventoryItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(inventoryItems)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)));
}

// ============= RECURRING EXPENSE OPERATIONS =============

export async function createRecurringExpense(recurringExpense: InsertRecurringExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(recurringExpenses).values(recurringExpense);
}

export async function getRecurringExpensesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(recurringExpenses)
    .where(eq(recurringExpenses.userId, userId))
    .orderBy(desc(recurringExpenses.createdAt));
}

export async function getRecurringExpenseById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(recurringExpenses)
    .where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateRecurringExpense(id: number, userId: number, data: Partial<InsertRecurringExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(recurringExpenses)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId)));
}

export async function deleteRecurringExpense(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(recurringExpenses)
    .where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId)));
}

// ============= AUDIT LOG OPERATIONS =============

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(auditLogs).values(log);
}

export async function getAuditLogsByUser(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function getAuditLogsByEntity(entityType: string, entityId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

// ============= NOTIFICATION OPERATIONS =============

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(notifications).values(notification);
}

export async function getNotificationsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function deleteNotification(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}
