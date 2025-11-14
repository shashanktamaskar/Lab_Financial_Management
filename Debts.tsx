import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Debts() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    creditorName: "",
    description: "",
    principalAmount: "",
    remainingAmount: "",
    interestRate: "",
    dueDate: "",
    status: "active" as const,
    notes: "",
  });
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Fetch data
  const { data: debts, refetch: refetchDebts } = trpc.debts.list.useQuery();

  // Mutations
  const createDebt = trpc.debts.create.useMutation({
    onSuccess: () => {
      toast.success("Debt created successfully");
      refetchDebts();
      resetForm();
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create debt");
    },
  });

  const updateDebt = trpc.debts.update.useMutation({
    onSuccess: () => {
      toast.success("Debt updated successfully");
      refetchDebts();
      resetForm();
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update debt");
    },
  });

  const deleteDebt = trpc.debts.delete.useMutation({
    onSuccess: () => {
      toast.success("Debt deleted successfully");
      refetchDebts();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete debt");
    },
  });

  const createPayment = trpc.debtPayments.create.useMutation({
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      refetchDebts();
      setPaymentData({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setIsPaymentOpen(false);
      setSelectedDebtId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record payment");
    },
  });

  const resetForm = () => {
    setFormData({
      creditorName: "",
      description: "",
      principalAmount: "",
      remainingAmount: "",
      interestRate: "",
      dueDate: "",
      status: "active",
      notes: "",
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.creditorName || !formData.principalAmount || !formData.remainingAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      creditorName: formData.creditorName,
      description: formData.description || undefined,
      principalAmount: formData.principalAmount,
      remainingAmount: formData.remainingAmount,
      interestRate: formData.interestRate || undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      status: formData.status,
      notes: formData.notes || undefined,
    };

    if (editingId) {
      updateDebt.mutate({ id: editingId, ...payload });
    } else {
      createDebt.mutate(payload);
    }
  };

  const handleEdit = (debt: any) => {
    setFormData({
      creditorName: debt.creditorName,
      description: debt.description || "",
      principalAmount: debt.principalAmount,
      remainingAmount: debt.remainingAmount,
      interestRate: debt.interestRate || "",
      dueDate: debt.dueDate ? format(new Date(debt.dueDate), "yyyy-MM-dd") : "",
      status: debt.status,
      notes: debt.notes || "",
    });
    setEditingId(debt.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this debt?")) {
      deleteDebt.mutate(id);
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentData.amount || !selectedDebtId) {
      toast.error("Please fill in all required fields");
      return;
    }

    createPayment.mutate({
      debtId: selectedDebtId,
      amount: paymentData.amount,
      paymentDate: new Date(paymentData.paymentDate),
      notes: paymentData.notes || undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "partially_paid":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalDebtRemaining = debts?.reduce((sum, debt) => sum + parseFloat(debt.remainingAmount as any), 0) || 0;
  const activeDebts = debts?.filter(d => d.status !== "paid").length || 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Debt Management</h1>
            <p className="text-muted-foreground">Track and manage your debts</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Debt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Debt" : "Add New Debt"}
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? "Update the debt details below"
                    : "Enter the debt details below"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="creditorName">Creditor Name *</Label>
                  <Input
                    id="creditorName"
                    placeholder="e.g., Bank, Supplier"
                    value={formData.creditorName}
                    onChange={(e) =>
                      setFormData({ ...formData, creditorName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Debt details..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="principalAmount">Principal Amount *</Label>
                    <Input
                      id="principalAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.principalAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, principalAmount: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="remainingAmount">Remaining Amount *</Label>
                    <Input
                      id="remainingAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.remainingAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, remainingAmount: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.interestRate}
                      onChange={(e) =>
                        setFormData({ ...formData, interestRate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createDebt.isPending || updateDebt.isPending}
                >
                  {editingId ? "Update" : "Create"} Debt
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Remaining</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalDebtRemaining.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{activeDebts} active debt{activeDebts !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{debts?.length || 0}</div>
              <p className="text-xs text-muted-foreground">All recorded debts</p>
            </CardContent>
          </Card>
        </div>

        {/* Debts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Debt List</CardTitle>
            <CardDescription>All recorded debts</CardDescription>
          </CardHeader>
          <CardContent>
            {debts && debts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creditor</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debts.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium">
                          {debt.creditorName}
                        </TableCell>
                        <TableCell>
                          ${parseFloat(debt.principalAmount as any).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ${parseFloat(debt.remainingAmount as any).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {debt.interestRate ? `${parseFloat(debt.interestRate as any).toFixed(2)}%` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(debt.status as string)}>
                            {(debt.status as string)?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog open={isPaymentOpen && selectedDebtId === debt.id} onOpenChange={setIsPaymentOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedDebtId(debt.id)}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Record Payment</DialogTitle>
                                  <DialogDescription>
                                    Record a payment for {debt.creditorName}
                                  </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handlePayment} className="space-y-4">
                                  <div>
                                    <Label htmlFor="paymentAmount">Amount *</Label>
                                    <Input
                                      id="paymentAmount"
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={paymentData.amount}
                                      onChange={(e) =>
                                        setPaymentData({ ...paymentData, amount: e.target.value })
                                      }
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="paymentDate">Payment Date</Label>
                                    <Input
                                      id="paymentDate"
                                      type="date"
                                      value={paymentData.paymentDate}
                                      onChange={(e) =>
                                        setPaymentData({ ...paymentData, paymentDate: e.target.value })
                                      }
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="paymentNotes">Notes</Label>
                                    <Textarea
                                      id="paymentNotes"
                                      placeholder="Payment notes..."
                                      value={paymentData.notes}
                                      onChange={(e) =>
                                        setPaymentData({ ...paymentData, notes: e.target.value })
                                      }
                                    />
                                  </div>

                                  <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={createPayment.isPending}
                                  >
                                    Record Payment
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(debt)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(debt.id)}
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
              <div className="text-center py-8 text-muted-foreground">
                No debts recorded yet. Add your first debt to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
