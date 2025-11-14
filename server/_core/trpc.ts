import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

export interface Context {
  user: any | null;
  req: any;
  res: any;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // TODO: Implement proper authentication
  // For now, use a mock user
  if (!ctx.user && process.env.NODE_ENV !== "development") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user || { id: "demo-user-1", email: "demo@example.com" },
    },
  });
});
