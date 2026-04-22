import { useState, Component, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Apply from "./pages/Apply";
import ApplicationsHub from "./pages/ApplicationsHub";
import GangApplication from "./pages/GangApplication";
import StaffApplication from "./pages/StaffApplication";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import DiscordCallback from "./pages/DiscordCallback";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import RequestOwner from "./pages/RequestOwner";
import NotFound from "./pages/NotFound";

// ── Error Boundary ──────────────────────────────────────────────────────────
interface EBState { hasError: boolean; message: string }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, message: "" };
  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, message: err.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="font-heading text-3xl font-bold text-primary mb-4 uppercase tracking-wider">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6 text-sm">{this.state.message}</p>
            <button
              onClick={() => window.location.href = "/"}
              className="gradient-red text-primary-foreground px-6 py-3 rounded-md font-heading uppercase tracking-wider text-sm"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Loading spinner ─────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground text-sm uppercase tracking-wider">Loading...</p>
    </div>
  </div>
);

// ── Route guards ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const OwnerRoute = ({ children }: { children: ReactNode }) => {
  const { user, isOwner, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isOwner) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
    },
  }));

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true }}>
            <AuthProvider>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/auth/discord/callback" element={<DiscordCallback />} />
                  <Route path="/apply" element={<ProtectedRoute><ApplicationsHub /></ProtectedRoute>} />
                  <Route path="/apply/whitelist" element={<ProtectedRoute><Apply /></ProtectedRoute>} />
                  <Route path="/apply/gang" element={<ProtectedRoute><GangApplication /></ProtectedRoute>} />
                  <Route path="/apply/staff" element={<ProtectedRoute><StaffApplication /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/owner" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
                  <Route path="/request-owner" element={<ProtectedRoute><RequestOwner /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
