import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Debts from "./pages/Debts";
import Invoices from "./pages/Invoices";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "./lib/trpc";

const queryClient = new QueryClient();

function Router() {
  // Dashboard routes require authentication
  return (
    <Switch>
      <Route path={"\\"} component={DashboardHome} />
      <Route path={"\\dashboard"} component={DashboardHome} />
      <Route path={"\\expenses"} component={ExpensesPage} />
      <Route path={"\\debts"} component={DebtsPage} />
      <Route path={"\\invoices"} component={InvoicesPage} />
      <Route path={"\\404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function DashboardHome() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}

function ExpensesPage() {
  return (
    <DashboardLayout>
      <Expenses />
    </DashboardLayout>
  );
}

function DebtsPage() {
  return (
    <DashboardLayout>
      <Debts />
    </DashboardLayout>
  );
}

function InvoicesPage() {
  return (
    <DashboardLayout>
      <Invoices />
    </DashboardLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            defaultTheme="light"
            // switchable
          >
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

export default App;
