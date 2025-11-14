import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended for Lab Finance Manager v2 with email/password auth and roles
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  // Support both OAuth and email/password
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash"), // For email/password auth
  loginMethod: varchar("loginMethod", { length: 64 }).default("email"),
  // Extended roles: admin (Lab Manager), member (Lab Member), readonly (Finance Team)
  role: mysqlEnum("role", ["admin", "member", "readonly", "auditor"]).default("member").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Expense categories for organizing financial tracking
 * Extended with hierarchy, icons, and budget allocation
 */
export const expenseCategories = mysqlTable("expenseCategories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Hex color code
  emoji: varchar("emoji", { length: 10 }), // Emoji icon for visual identification
  parentCategoryId: int("parentCategoryId"), // For hierarchical categories
  budgetAllocation: decimal("budgetAllocation", { precision: 12, scale: 2 }), // Suggested annual budget
  tags: text("tags"), // JSON array of additional labels
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;

/**
 * Main expenses table for tracking lab financial transactions
 * Extended with vendor, project, lab member, and tax tracking
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"),
  vendorId: int("vendorId"), // Link to vendor
  projectId: int("projectId"), // Which project is this expense for?
  labMemberId: int("labMemberId"), // Who purchased this?
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }), // Separate tax tracking
  currency: varchar("currency", { length: 3 }).default("USD"),
  date: timestamp("date").notNull(),
  invoiceId: int("invoiceId"), // Link to invoice if imported from file
  receiptUrl: text("receiptUrl"), // Receipt attachment
  notes: text("notes"),
  tags: text("tags"), // JSON array for custom grouping
  recurringExpenseId: int("recurringExpenseId"), // Link to recurring expense template
  isRecurring: boolean("isRecurring").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Invoices table for tracking uploaded invoice files
 * Extended with confidence scoring and better parsing metadata
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  vendorId: int("vendorId"), // Auto-detected or manually assigned vendor
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(), // S3 storage key
  fileType: varchar("fileType", { length: 50 }), // pdf, png, jpg, etc
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  invoiceDate: timestamp("invoiceDate"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }),
  taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  uploadedDate: timestamp("uploadedDate").defaultNow().notNull(),
  processedDate: timestamp("processedDate"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "review", "imported", "rejected"]).default("pending"),
  parsingConfidence: decimal("parsingConfidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  extractedData: text("extractedData"), // JSON string of extracted data from Gemini
  reviewNotes: text("reviewNotes"), // User notes during review
  rejectionReason: text("rejectionReason"), // Why was it rejected?
  isDuplicate: boolean("isDuplicate").default(false),
  duplicateOfId: int("duplicateOfId"), // Reference to original invoice if duplicate
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Debts table for tracking money owed (to creditors or from debtors)
 */
export const debts = mysqlTable("debts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  creditorName: varchar("creditorName", { length: 255 }).notNull(),
  description: text("description"),
  principalAmount: decimal("principalAmount", { precision: 12, scale: 2 }).notNull(),
  remainingAmount: decimal("remainingAmount", { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }).default("0"), // Percentage
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["active", "partially_paid", "paid", "overdue"]).default("active"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Debt = typeof debts.$inferSelect;
export type InsertDebt = typeof debts.$inferInsert;

/**
 * Debt payments table for tracking payment history
 */
export const debtPayments = mysqlTable("debtPayments", {
  id: int("id").autoincrement().primaryKey(),
  debtId: int("debtId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DebtPayment = typeof debtPayments.$inferSelect;
export type InsertDebtPayment = typeof debtPayments.$inferInsert;

/**
 * OneDrive sync logs for tracking Gemini API integration
 */
export const onedriveSync = mysqlTable("onedriveSync", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lastSyncDate: timestamp("lastSyncDate"),
  status: mysqlEnum("status", ["idle", "syncing", "completed", "failed"]).default("idle"),
  itemsProcessed: int("itemsProcessed").default(0),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnedriveSync = typeof onedriveSync.$inferSelect;
export type InsertOnedriveSync = typeof onedriveSync.$inferInsert;

/**
 * Lab Members - People who work in the lab and submit expenses
 */
export const labMembers = mysqlTable("labMembers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Which lab they belong to
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  role: varchar("role", { length: 100 }), // e.g., "Graduate Student", "Postdoc", "Technician", "PI"
  active: boolean("active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LabMember = typeof labMembers.$inferSelect;
export type InsertLabMember = typeof labMembers.$inferInsert;

/**
 * Projects - Research projects or cost centers for tracking expenses
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  projectCode: varchar("projectCode", { length: 50 }), // e.g., grant number
  status: mysqlEnum("status", ["active", "on_hold", "completed", "archived"]).default("active"),
  budgetAmount: decimal("budgetAmount", { precision: 12, scale: 2 }), // Project-specific budget
  principalInvestigator: varchar("principalInvestigator", { length: 255 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  tags: text("tags"), // JSON array for custom tags (e.g., ["Grant-123", "NIH-funded"])
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project Members - Link table for many-to-many relationship between projects and lab members
 */
export const projectMembers = mysqlTable("projectMembers", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  labMemberId: int("labMemberId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

/**
 * Vendors - Suppliers and creditors
 */
export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  website: text("website"),
  notes: text("notes"),
  preferredItems: text("preferredItems"), // JSON array of commonly purchased items
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

/**
 * Budgets - Annual budget allocations by category
 */
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  year: int("year").notNull(), // Fiscal year
  categoryId: int("categoryId").notNull(),
  budgetAmount: decimal("budgetAmount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

/**
 * Inventory Items - Track purchased items, costs, and trends
 */
export const inventoryItems = mysqlTable("inventoryItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: int("categoryId"),
  vendorId: int("vendorId"), // Usual supplier
  unit: varchar("unit", { length: 50 }), // e.g., "mL", "Box", "Pack", "kg"
  lastPurchaseDate: timestamp("lastPurchaseDate"),
  averageCost: decimal("averageCost", { precision: 12, scale: 2 }),
  totalQuantityPurchased: decimal("totalQuantityPurchased", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

/**
 * Recurring Expenses - Templates for subscription/recurring purchases
 */
export const recurringExpenses = mysqlTable("recurringExpenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  categoryId: int("categoryId"),
  vendorId: int("vendorId"),
  frequency: mysqlEnum("frequency", ["weekly", "biweekly", "monthly", "quarterly", "annually"]).notNull(),
  nextDueDate: timestamp("nextDueDate"),
  active: boolean("active").default(true).notNull(),
  autoCreate: boolean("autoCreate").default(false), // Auto-create expense on schedule
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecurringExpense = typeof recurringExpenses.$inferSelect;
export type InsertRecurringExpense = typeof recurringExpenses.$inferInsert;

/**
 * Audit Logs - Track all changes for compliance
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Who made the change
  action: varchar("action", { length: 50 }).notNull(), // "created", "updated", "deleted"
  entityType: varchar("entityType", { length: 50 }).notNull(), // "expense", "invoice", "category", etc.
  entityId: int("entityId").notNull(), // ID of the changed record
  oldValues: text("oldValues"), // JSON of old values
  newValues: text("newValues"), // JSON of new values
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Notifications - In-app notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "warning", "error", "success"]).default("info"),
  isRead: boolean("isRead").default(false),
  actionUrl: text("actionUrl"), // Optional link for action
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
