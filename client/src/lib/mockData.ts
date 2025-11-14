// Mock data for demo mode (GitHub Pages)
export const mockExpenses = [
  {
    id: 1,
    userId: "demo",
    description: "Lab Equipment Purchase",
    amount: "1250.00",
    date: new Date("2025-01-10"),
    categoryId: 1,
    notes: "New microscope",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    userId: "demo",
    description: "Chemical Supplies",
    amount: "450.75",
    date: new Date("2025-01-12"),
    categoryId: 2,
    notes: "Monthly restock",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    userId: "demo",
    description: "Software License",
    amount: "299.00",
    date: new Date("2025-01-15"),
    categoryId: 3,
    notes: "Annual renewal",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockCategories = [
  { id: 1, userId: "demo", name: "Equipment", color: "#3b82f6", createdAt: new Date(), updatedAt: new Date() },
  { id: 2, userId: "demo", name: "Supplies", color: "#10b981", createdAt: new Date(), updatedAt: new Date() },
  { id: 3, userId: "demo", name: "Software", color: "#f59e0b", createdAt: new Date(), updatedAt: new Date() },
  { id: 4, userId: "demo", name: "Utilities", color: "#ef4444", createdAt: new Date(), updatedAt: new Date() },
];

export const mockDebts = [
  {
    id: 1,
    userId: "demo",
    creditorName: "Equipment Financing Co.",
    amount: "15000.00",
    interestRate: "5.5",
    dueDate: new Date("2025-12-31"),
    status: "active" as const,
    notes: "Lab equipment loan",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    userId: "demo",
    creditorName: "Office Lease",
    amount: "24000.00",
    interestRate: "0",
    dueDate: new Date("2026-06-30"),
    status: "active" as const,
    notes: "Annual lease payment",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockInvoices = [
  {
    id: 1,
    userId: "demo",
    fileName: "invoice_jan_2025.pdf",
    fileUrl: "#",
    fileKey: "demo/invoice1.pdf",
    fileType: "pdf",
    status: "completed" as const,
    extractedData: null,
    totalAmount: "1250.00",
    processedDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const isDemoMode = () => {
  return import.meta.env.VITE_DEMO_MODE === "true";
};
