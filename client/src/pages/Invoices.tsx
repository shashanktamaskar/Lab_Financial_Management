import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Invoices() {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch data
  const { data: invoices, refetch: refetchInvoices } = trpc.invoices.list.useQuery();

  // Mutations
  const uploadInvoice = trpc.invoices.upload.useMutation({
    onSuccess: () => {
      toast.success("Invoice uploaded and processed successfully");
      refetchInvoices();
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload invoice");
      setUploading(false);
    },
  });

  const deleteInvoice = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Invoice deleted successfully");
      refetchInvoices();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete invoice");
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF, Excel, or CSV file");
      return;
    }

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const fileBuffer = Buffer.from(buffer);

      uploadInvoice.mutate({
        fileBuffer,
        fileName: file.name,
        fileType: file.type.split("/")[1] || "pdf",
      });
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
      setUploading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalInvoices = invoices?.length || 0;
  const completedInvoices = invoices?.filter(i => i.status === "completed").length || 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">Upload and manage invoice files</p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Invoice
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground">All uploaded invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedInvoices}</div>
              <p className="text-xs text-muted-foreground">Successfully processed</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Formats</CardTitle>
            <CardDescription>Upload invoices in any of these formats</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                <span><strong>PDF</strong> - Portable Document Format</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                <span><strong>Excel</strong> - XLSX or XLS spreadsheets</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                <span><strong>CSV</strong> - Comma-separated values</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              Invoices are automatically parsed to extract line items and amounts, which are then added to your expenses.
            </p>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice List</CardTitle>
            <CardDescription>All uploaded invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices && invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.fileName}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs uppercase text-muted-foreground">
                            {invoice.fileType || "unknown"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {invoice.totalAmount ? `$${parseFloat(invoice.totalAmount as any).toFixed(2)}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status as string)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.uploadedDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {invoice.fileUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(invoice.fileUrl, "_blank")}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this invoice?")) {
                                  deleteInvoice.mutate(invoice.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No invoices uploaded yet</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Upload Your First Invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React from "react";
