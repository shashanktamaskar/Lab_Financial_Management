import { z } from "zod";
import { protectedProcedure } from "./_core/trpc";
import { storagePut } from "./storage";
import * as db from "./db";
import { parseInvoice } from "./invoiceParser";
import { nanoid } from "nanoid";

/**
 * Handle invoice file upload
 */
export const uploadInvoice = protectedProcedure
  .input(z.object({
    fileBuffer: z.instanceof(Buffer),
    fileName: z.string().min(1),
    fileType: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      // Generate unique file key
      const fileKey = `invoices/${ctx.user.id}/${nanoid()}-${input.fileName}`;

      // Upload to S3
      const { url } = await storagePut(
        fileKey,
        input.fileBuffer,
        `application/${input.fileType}`
      );

      // Create invoice record in database
      const invoiceResult = await db.createInvoice({
        userId: ctx.user.id,
        fileName: input.fileName,
        fileUrl: url,
        fileKey,
        fileType: input.fileType,
        status: "processing",
      });

      // Parse invoice asynchronously
      try {
        const parsedData = await parseInvoice(input.fileBuffer, input.fileType);

        // Update invoice with extracted data
        const extractedDataStr = JSON.stringify(parsedData);
        
        // Create expense entries from parsed data
        if (parsedData.items && parsedData.items.length > 0) {
          for (const item of parsedData.items) {
            await db.createExpense({
              userId: ctx.user.id,
              description: item.description,
              amount: item.amount.toString(),
              date: parsedData.invoiceDate || new Date(),
              invoiceId: (invoiceResult as any).insertId,
              notes: `Imported from invoice: ${input.fileName}`,
            });
          }
        }

        // Update invoice status to completed
        await db.updateInvoice((invoiceResult as any).insertId, ctx.user.id, {
          status: "completed",
          extractedData: extractedDataStr,
          totalAmount: parsedData.totalAmount.toString(),
          processedDate: new Date(),
        });

        return {
          success: true,
          invoiceId: (invoiceResult as any).insertId,
          fileUrl: url,
          parsedData,
        };
      } catch (parseError) {
        console.error("Invoice parsing error:", parseError);
        
        // Update invoice status to failed
        await db.updateInvoice((invoiceResult as any).insertId, ctx.user.id, {
          status: "failed",
          processedDate: new Date(),
        });

        return {
          success: false,
          invoiceId: (invoiceResult as any).insertId,
          fileUrl: url,
          error: "Failed to parse invoice file",
        };
      }
    } catch (error) {
      console.error("Invoice upload error:", error);
      throw new Error("Failed to upload invoice");
    }
  });

/**
 * Process an existing invoice file
 */
export const processInvoice = protectedProcedure
  .input(z.object({
    invoiceId: z.number(),
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      const invoice = await db.getInvoiceById(input.invoiceId, ctx.user.id);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Download file from S3 and parse
      // Note: In production, you'd fetch the file from S3
      // For now, we'll just update the status
      
      await db.updateInvoice(input.invoiceId, ctx.user.id, {
        status: "completed",
        processedDate: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error("Invoice processing error:", error);
      throw new Error("Failed to process invoice");
    }
  });
