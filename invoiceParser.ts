import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Buffer } from 'buffer';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedInvoiceData {
  items: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount: number;
  }>;
  totalAmount: number;
  invoiceDate?: Date;
  invoiceNumber?: string;
  vendor?: string;
}

/**
 * Parse PDF invoice file
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedInvoiceData> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = '';

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
    }

    // Extract total amount - look for common patterns
    let totalAmount = 0;
    const totalPatterns = [
      /total\s*:?\s*\$?([\d,]+\.?\d*)/gi,
      /grand\s+total\s*:?\s*\$?([\d,]+\.?\d*)/gi,
      /amount\s+due\s*:?\s*\$?([\d,]+\.?\d*)/gi,
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        totalAmount = parseFloat(match[0].replace(/[^\d.]/g, ''));
        break;
      }
    }

    // Extract invoice date
    let invoiceDate: Date | undefined;
    const datePattern = /(?:date|invoice\s+date)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
      invoiceDate = new Date(dateMatch[1]);
    }

    // Extract invoice number
    let invoiceNumber: string | undefined;
    const invoicePattern = /(?:invoice|inv|#)\s*:?\s*([A-Z0-9\-]+)/i;
    const invoiceMatch = text.match(invoicePattern);
    if (invoiceMatch) {
      invoiceNumber = invoiceMatch[1];
    }

    // Extract vendor/company name (usually at the top)
    const lines = text.split('\n');
    const vendor = lines[0]?.trim() || undefined;

    // Extract line items - simplified parsing
    const items: ParsedInvoiceData['items'] = [];
    const lineItemPattern = /([^\n]+?)\s+(\d+\.?\d*)\s*\$?([\d,]+\.?\d*)/g;
    let match;
    while ((match = lineItemPattern.exec(text)) !== null) {
      items.push({
        description: match[1].trim(),
        amount: parseFloat(match[3].replace(/,/g, '')),
      });
    }

    return {
      items,
      totalAmount: totalAmount || 0,
      invoiceDate,
      invoiceNumber,
      vendor,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF invoice');
  }
}

/**
 * Parse Excel invoice file
 */
export async function parseExcel(buffer: Buffer): Promise<ParsedInvoiceData> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
    if (!sheet) {
      throw new Error('No sheets found in Excel file');
    }

    const data = XLSX.utils.sheet_to_json(sheet) as Array<Record<string, any>>;

    let totalAmount = 0;
    const items: ParsedInvoiceData['items'] = [];
    let invoiceDate: Date | undefined;
    let invoiceNumber: string | undefined;
    let vendor: string | undefined;

    // Parse rows
    for (const row of data) {
      // Look for total amount
      const amountKey = Object.keys(row).find(k => 
        k.toLowerCase().includes('total') || 
        k.toLowerCase().includes('amount') ||
        k.toLowerCase().includes('sum')
      );

      if (amountKey && typeof row[amountKey] === 'number') {
        totalAmount = Math.max(totalAmount, row[amountKey]);
      }

      // Look for description and amount
      const descKey = Object.keys(row).find(k => 
        k.toLowerCase().includes('description') || 
        k.toLowerCase().includes('item') ||
        k.toLowerCase().includes('product')
      );

      const priceKey = Object.keys(row).find(k => 
        k.toLowerCase().includes('price') || 
        k.toLowerCase().includes('amount') ||
        k.toLowerCase().includes('cost')
      );

      if (descKey && priceKey && row[descKey] && row[priceKey]) {
        items.push({
          description: String(row[descKey]),
          amount: parseFloat(row[priceKey]),
        });
      }

      // Look for invoice date
      const dateKey = Object.keys(row).find(k => 
        k.toLowerCase().includes('date') || 
        k.toLowerCase().includes('invoice date')
      );

      if (dateKey && row[dateKey] && !invoiceDate) {
        const dateVal = row[dateKey];
        if (dateVal instanceof Date) {
          invoiceDate = dateVal;
        } else if (typeof dateVal === 'number') {
          // Excel serial date
          invoiceDate = new Date((dateVal - 25569) * 86400 * 1000);
        } else if (typeof dateVal === 'string') {
          invoiceDate = new Date(dateVal);
        }
      }

      // Look for invoice number
      const invKey = Object.keys(row).find(k => 
        k.toLowerCase().includes('invoice') && 
        k.toLowerCase().includes('number')
      );

      if (invKey && row[invKey] && !invoiceNumber) {
        invoiceNumber = String(row[invKey]);
      }
    }

    // If no items found but we have total, create a single item
    if (items.length === 0 && totalAmount > 0) {
      items.push({
        description: 'Invoice items',
        amount: totalAmount,
      });
    }

    return {
      items,
      totalAmount: totalAmount || 0,
      invoiceDate,
      invoiceNumber,
      vendor,
    };
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error('Failed to parse Excel invoice');
  }
}

/**
 * Parse CSV invoice file
 */
export async function parseCSV(buffer: Buffer): Promise<ParsedInvoiceData> {
  return new Promise((resolve, reject) => {
    const csvText = buffer.toString('utf-8');

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as Array<Record<string, any>>;

          let totalAmount = 0;
          const items: ParsedInvoiceData['items'] = [];
          let invoiceDate: Date | undefined;
          let invoiceNumber: string | undefined;

          for (const row of data) {
            // Look for amount columns
            const amountKey = Object.keys(row).find(k => 
              k.toLowerCase().includes('amount') || 
              k.toLowerCase().includes('total') ||
              k.toLowerCase().includes('price')
            );

            if (amountKey) {
              const amount = parseFloat(row[amountKey]);
              if (!isNaN(amount)) {
                totalAmount += amount;

                // Look for description
                const descKey = Object.keys(row).find(k => 
                  k.toLowerCase().includes('description') || 
                  k.toLowerCase().includes('item')
                );

                items.push({
                  description: descKey ? String(row[descKey]) : 'Item',
                  amount,
                });
              }
            }

            // Look for date
            const dateKey = Object.keys(row).find(k => 
              k.toLowerCase().includes('date')
            );

            if (dateKey && row[dateKey] && !invoiceDate) {
              const parsed = new Date(row[dateKey]);
              if (!isNaN(parsed.getTime())) {
                invoiceDate = parsed;
              }
            }

            // Look for invoice number
            const invKey = Object.keys(row).find(k => 
              k.toLowerCase().includes('invoice')
            );

            if (invKey && row[invKey] && !invoiceNumber) {
              invoiceNumber = String(row[invKey]);
            }
          }

          resolve({
            items,
            totalAmount,
            invoiceDate,
            invoiceNumber,
          });
        } catch (error) {
          reject(new Error('Failed to parse CSV invoice'));
        }
      },
      error: (error: any) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

/**
 * Main invoice parser - routes to appropriate parser based on file type
 */
export async function parseInvoice(
  buffer: Buffer,
  fileType: string
): Promise<ParsedInvoiceData> {
  const type = fileType.toLowerCase();

  if (type === 'pdf' || type === 'application/pdf') {
    return parsePDF(buffer);
  } else if (type === 'xlsx' || type === 'xls' || type.includes('spreadsheet')) {
    return parseExcel(buffer);
  } else if (type === 'csv' || type === 'text/csv') {
    return parseCSV(buffer);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}
