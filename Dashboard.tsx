import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, AlertCircle, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function Dashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'week' | 'month'>('month');

  // Calculate date range
  const now = new Date();
  const startDate = dateRange === 'week' 
    ? startOfWeek(now)
    : startOfMonth(now);
  const endDate = dateRange === 'week'
    ? endOfWeek(now)
    : endOfMonth(now);

  // Fetch data
  const { data: dashboardStats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery({
    startDate,
    endDate,
  });

  const { data: expenses, isLoading: expensesLoading } = trpc.expenses.list.useQuery({
    startDate,
    endDate,
  });

  const { data: debts, isLoading: debtsLoading } = trpc.debts.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  // Process data for charts
  const expensesByCategory = useMemo(() => {
    if (!expenses || !categories) return [];
    
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const grouped: Record<number, number> = {};

    expenses.forEach(exp => {
      const catId = (exp.categoryId || 0) as number;
      grouped[catId] = (grouped[catId] || 0) + parseFloat(exp.amount as any);
    });

    return Object.entries(grouped).map(([catId, amount]) => {
      const category = categoryMap.get(parseInt(catId));
      return {
        name: category?.name || 'Uncategorized',
        value: amount,
        color: category?.color || '#3B82F6',
      };
    });
  }, [expenses, categories]);

  const dailyExpenses = useMemo(() => {
    if (!expenses) return [];
    
    const grouped: Record<string, number> = {};
    expenses.forEach(exp => {
      const day = format(new Date(exp.date), 'MMM dd');
      grouped[day] = (grouped[day] || 0) + parseFloat(exp.amount as any);
    });

    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([day, amount]) => ({ day, amount }));
  }, [expenses]);

  const debtsByStatus = useMemo(() => {
    if (!debts) return [];
    
    const grouped: Record<string, number> = {};
    debts.forEach(debt => {
      const status = debt.status as string;
      grouped[status] = (grouped[status] || 0) + 1;
    });

    return Object.entries(grouped).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count,
    }));
  }, [debts]);

  const totalExpenses = dashboardStats?.expenses.total || 0;
  const totalDebtRemaining = dashboardStats?.debts.totalRemaining || 0;
  const activeDebts = dashboardStats?.debts.activeCount || 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || 'User'}!</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {dateRange === 'week' ? 'This week' : 'This month'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalDebtRemaining.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {activeDebts} active debt{activeDebts !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Daily Spend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalExpenses / (dateRange === 'week' ? 7 : 30)).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Per day</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {dateRange === 'week' ? 'This week' : 'This month'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="debts">Debts</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button
                variant={dateRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('week')}
              >
                Week
              </Button>
              <Button
                variant={dateRange === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('month')}
              >
                Month
              </Button>
            </div>
          </div>

          <TabsContent value="expenses" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Daily Trend */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Expense Trend</CardTitle>
                  <CardDescription>Daily spending pattern</CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyExpenses.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyExpenses}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#3B82F6" 
                          name="Daily Expenses"
                          dot={{ fill: '#3B82F6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No expense data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>By Category</CardTitle>
                  <CardDescription>Expense distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  {expensesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expensesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expensesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No category data
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="debts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Debt Status</CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                {debtsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={debtsByStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#3B82F6" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No debt data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest expenses from this period</CardDescription>
          </CardHeader>
          <CardContent>
            {expenses && expenses.length > 0 ? (
              <div className="space-y-4">
                {expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <p className="font-semibold">${parseFloat(expense.amount as any).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No transactions yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
