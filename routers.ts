import { COOKIE_NAME } from "@shared/const";
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
        invoiceId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createExpense({
          userId: ctx.user.id,
          description: input.description,
          amount: input.amount,
          date: input.date,
          categoryId: input.categoryId,
          invoiceId: input.invoiceId,
          notes: input.notes,
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
        notes: z.string().optional(),
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
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createExpenseCategory({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          color: input.color,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
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
});

export type AppRouter = typeof appRouter;
