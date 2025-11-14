import { COOKIE_NAME } from "./_core/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { uploadInvoice, processInvoice } from "./invoiceUpload";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============= EXPENSE OPERATIONS =============
  expenses: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getExpensesByUser(ctx.user.id, input.startDate, input.endDate);
      }),

    create: protectedProcedure
      .input(z.object({
        description: z.string().min(1),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        date: z.date(),
        categoryId: z.number().optional(),
        vendorId: z.number().optional(),
        projectId: z.number().optional(),
        labMemberId: z.number().optional(),
        taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        currency: z.string().length(3).optional(),
        invoiceId: z.number().optional(),
        receiptUrl: z.string().optional(),
        notes: z.string().optional(),
        tags: z.string().optional(),
        recurringExpenseId: z.number().optional(),
        isRecurring: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createExpense({
          userId: ctx.user.id,
          description: input.description,
          amount: input.amount,
          date: input.date,
          categoryId: input.categoryId,
          vendorId: input.vendorId,
          projectId: input.projectId,
          labMemberId: input.labMemberId,
          taxAmount: input.taxAmount,
          currency: input.currency,
          invoiceId: input.invoiceId,
          receiptUrl: input.receiptUrl,
          notes: input.notes,
          tags: input.tags,
          recurringExpenseId: input.recurringExpenseId,
          isRecurring: input.isRecurring,
        });
      }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const expense = await db.getExpenseById(input, ctx.user.id);
        if (!expense) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return expense;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().optional(),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        date: z.date().optional(),
        categoryId: z.number().optional(),
        vendorId: z.number().optional(),
        projectId: z.number().optional(),
        labMemberId: z.number().optional(),
        taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        currency: z.string().length(3).optional(),
        receiptUrl: z.string().optional(),
        notes: z.string().optional(),
        tags: z.string().optional(),
        isRecurring: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateExpense(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteExpense(input, ctx.user.id);
      }),
  }),

  // ============= EXPENSE CATEGORY OPERATIONS =============
  categories: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getCategoriesByUser(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        emoji: z.string().optional(),
        parentCategoryId: z.number().optional(),
        budgetAllocation: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        tags: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createExpenseCategory({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          color: input.color,
          emoji: input.emoji,
          parentCategoryId: input.parentCategoryId,
          budgetAllocation: input.budgetAllocation,
          tags: input.tags,
          active: input.active,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        emoji: z.string().optional(),
        parentCategoryId: z.number().optional(),
        budgetAllocation: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        tags: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateExpenseCategory(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteExpenseCategory(input, ctx.user.id);
      }),
  }),

  // ============= INVOICE OPERATIONS =============
  invoices: router({
    upload: uploadInvoice,

    process: processInvoice,

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getInvoicesByUser(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        fileName: z.string().min(1),
        fileUrl: z.string().url(),
        fileKey: z.string().min(1),
        fileType: z.string().optional(),
        totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createInvoice({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileKey: input.fileKey,
          fileType: input.fileType,
          totalAmount: input.totalAmount,
          status: input.status || "pending",
        });
      }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const invoice = await db.getInvoiceById(input, ctx.user.id);
        if (!invoice) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return invoice;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
        extractedData: z.string().optional(),
        processedDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateInvoice(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteInvoice(input, ctx.user.id);
      }),
  }),

  // ============= DEBT OPERATIONS =============
  debts: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getDebtsByUser(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        creditorName: z.string().min(1),
        description: z.string().optional(),
        principalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        remainingAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        interestRate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        dueDate: z.date().optional(),
        status: z.enum(["active", "partially_paid", "paid", "overdue"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createDebt({
          userId: ctx.user.id,
          creditorName: input.creditorName,
          description: input.description,
          principalAmount: input.principalAmount,
          remainingAmount: input.remainingAmount,
          interestRate: input.interestRate,
          dueDate: input.dueDate,
          status: input.status || "active",
          notes: input.notes,
        });
      }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const debt = await db.getDebtById(input, ctx.user.id);
        if (!debt) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return debt;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        creditorName: z.string().optional(),
        description: z.string().optional(),
        principalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        remainingAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        interestRate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        dueDate: z.date().optional(),
        status: z.enum(["active", "partially_paid", "paid", "overdue"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateDebt(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteDebt(input, ctx.user.id);
      }),
  }),

  // ============= DEBT PAYMENT OPERATIONS =============
  debtPayments: router({
    list: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        return await db.getDebtPayments(input, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        debtId: z.number(),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        paymentDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify debt belongs to user
        const debt = await db.getDebtById(input.debtId, ctx.user.id);
        if (!debt) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Create payment
        const payment = await db.createDebtPayment({
          debtId: input.debtId,
          userId: ctx.user.id,
          amount: input.amount,
          paymentDate: input.paymentDate,
          notes: input.notes,
        });

        // Update debt remaining amount
        const newRemaining = Math.max(
          0,
          parseFloat(debt.remainingAmount as any) - parseFloat(input.amount)
        );
        
        const newStatus = newRemaining === 0 ? "paid" : 
                         newRemaining < parseFloat(debt.principalAmount as any) ? "partially_paid" : 
                         "active";

        await db.updateDebt(input.debtId, ctx.user.id, {
          remainingAmount: newRemaining.toString(),
          status: newStatus,
        });

        return payment;
      }),
  }),

  // ============= DASHBOARD STATISTICS =============
  dashboard: router({
    stats: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        const expenseStats = await db.getExpenseStats(ctx.user.id, input.startDate, input.endDate);
        const debtStats = await db.getDebtStats(ctx.user.id);
        
        return {
          expenses: expenseStats,
          debts: debtStats,
        };
      }),
  }),

  // ============= ONEDRIVE SYNC =============
  onedrive: router({
    getSync: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getOrCreateOnedriveSync(ctx.user.id);
      }),

    updateSync: protectedProcedure
      .input(z.object({
        status: z.enum(["idle", "syncing", "completed", "failed"]).optional(),
        itemsProcessed: z.number().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateOnedriveSync(ctx.user.id, {
          ...input,
          lastSyncDate: new Date(),
        });
      }),
  }),

  // ============= LAB MEMBER OPERATIONS =============
  labMembers: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getLabMembersByUser(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        role: z.string().optional(),
        active: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createLabMember({
          userId: ctx.user.id,
          name: input.name,
          email: input.email,
          role: input.role,
          active: input.active,
          notes: input.notes,
        });
      }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const member = await db.getLabMemberById(input, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return member;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.string().optional(),
        active: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateLabMember(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteLabMember(input, ctx.user.id);
      }),
  }),

  // ============= PROJECT OPERATIONS =============
  projects: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getProjectsByUser(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        projectCode: z.string().optional(),
        status: z.enum(["active", "on_hold", "completed", "archived"]).optional(),
        budgetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        principalInvestigator: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          projectCode: input.projectCode,
          status: input.status,
          budgetAmount: input.budgetAmount,
          principalInvestigator: input.principalInvestigator,
          startDate: input.startDate,
          endDate: input.endDate,
          tags: input.tags,
        });
      }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return project;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        projectCode: z.string().optional(),
        status: z.enum(["active", "on_hold", "completed", "archived"]).optional(),
        budgetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        principalInvestigator: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateProject(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteProject(input, ctx.user.id);
      }),

    // Project member management
    addMember: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        labMemberId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify project belongs to user
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return await db.addProjectMember(input.projectId, input.labMemberId);
      }),

    removeMember: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        labMemberId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify project belongs to user
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return await db.removeProjectMember(input.projectId, input.labMemberId);
      }),

    getMembers: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        // Verify project belongs to user
        const project = await db.getProjectById(input, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return await db.getProjectMembers(input);
      }),
  }),

  // ============= VENDOR OPERATIONS =============
  vendors: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getVendorsByUser(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        website: z.string().url().optional(),
        notes: z.string().optional(),
        preferredItems: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createVendor({
          userId: ctx.user.id,
          name: input.name,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          website: input.website,
          notes: input.notes,
          preferredItems: input.preferredItems,
          active: input.active,
        });
      }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const vendor = await db.getVendorById(input, ctx.user.id);
        if (!vendor) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return vendor;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        website: z.string().url().optional(),
        notes: z.string().optional(),
        preferredItems: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateVendor(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteVendor(input, ctx.user.id);
      }),
  }),

  // ============= BUDGET OPERATIONS =============
  budgets: router({
    list: protectedProcedure
      .input(z.object({
        year: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getBudgetsByUser(ctx.user.id, input.year);
      }),

    create: protectedProcedure
      .input(z.object({
        year: z.number(),
        categoryId: z.number(),
        budgetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createBudget({
          userId: ctx.user.id,
          year: input.year,
          categoryId: input.categoryId,
          budgetAmount: input.budgetAmount,
          notes: input.notes,
        });
      }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const budget = await db.getBudgetById(input, ctx.user.id);
        if (!budget) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return budget;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        year: z.number().optional(),
        categoryId: z.number().optional(),
        budgetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateBudget(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteBudget(input, ctx.user.id);
      }),
  }),

  // ============= INVENTORY OPERATIONS =============
  inventory: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getInventoryItemsByUser(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        vendorId: z.number().optional(),
        unit: z.string().optional(),
        lastPurchaseDate: z.date().optional(),
        averageCost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        totalQuantityPurchased: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createInventoryItem({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          categoryId: input.categoryId,
          vendorId: input.vendorId,
          unit: input.unit,
          lastPurchaseDate: input.lastPurchaseDate,
          averageCost: input.averageCost,
          totalQuantityPurchased: input.totalQuantityPurchased,
          notes: input.notes,
        });
      }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const item = await db.getInventoryItemById(input, ctx.user.id);
        if (!item) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return item;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        vendorId: z.number().optional(),
        unit: z.string().optional(),
        lastPurchaseDate: z.date().optional(),
        averageCost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        totalQuantityPurchased: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateInventoryItem(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteInventoryItem(input, ctx.user.id);
      }),
  }),

  // ============= RECURRING EXPENSE OPERATIONS =============
  recurringExpenses: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getRecurringExpensesByUser(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        description: z.string().min(1),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        categoryId: z.number().optional(),
        vendorId: z.number().optional(),
        frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "annually"]),
        nextDueDate: z.date().optional(),
        active: z.boolean().optional(),
        autoCreate: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createRecurringExpense({
          userId: ctx.user.id,
          description: input.description,
          amount: input.amount,
          categoryId: input.categoryId,
          vendorId: input.vendorId,
          frequency: input.frequency,
          nextDueDate: input.nextDueDate,
          active: input.active,
          autoCreate: input.autoCreate,
          notes: input.notes,
        });
      }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const recurring = await db.getRecurringExpenseById(input, ctx.user.id);
        if (!recurring) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return recurring;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().optional(),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        categoryId: z.number().optional(),
        vendorId: z.number().optional(),
        frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "annually"]).optional(),
        nextDueDate: z.date().optional(),
        active: z.boolean().optional(),
        autoCreate: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateRecurringExpense(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteRecurringExpense(input, ctx.user.id);
      }),
  }),

  // ============= AUDIT LOG OPERATIONS =============
  auditLogs: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getAuditLogsByUser(ctx.user.id, input.limit);
      }),

    getByEntity: protectedProcedure
      .input(z.object({
        entityType: z.string(),
        entityId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getAuditLogsByEntity(input.entityType, input.entityId, input.limit);
      }),
  }),

  // ============= NOTIFICATION OPERATIONS =============
  notifications: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getNotificationsByUser(ctx.user.id, input.limit);
      }),

    markAsRead: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.markNotificationAsRead(input, ctx.user.id);
      }),

    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        return await db.markAllNotificationsAsRead(ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteNotification(input, ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
