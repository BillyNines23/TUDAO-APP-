import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin }: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  
  const { data, isLoading } = useQuery<{ user: { id: string; username: string; role: string } | null }>({
    queryKey: ["/api/auth/me"],
  });

  useEffect(() => {
    if (!isLoading) {
      if (!data?.user) {
        // Not logged in, redirect to login
        navigate("/login");
      } else if (requireAdmin && data.user.role !== "admin") {
        // Not an admin, redirect to home
        navigate("/");
      }
    }
  }, [data, isLoading, navigate, requireAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!data?.user || (requireAdmin && data.user.role !== "admin")) {
    return null;
  }

  return <>{children}</>;
}
