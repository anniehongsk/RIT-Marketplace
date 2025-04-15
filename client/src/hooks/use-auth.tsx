import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, type PublicUser, type InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: PublicUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<PublicUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<PublicUser, Error, RegisterData>;
  acceptTermsMutation: UseMutationResult<{ success: boolean }, Error, void>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  acceptedTerms: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showTerms, setShowTerms] = useState(false);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<PublicUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: PublicUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: PublicUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to RIT Marketplace, ${user.username}!`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const acceptTermsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/terms/accept");
      return await res.json();
    },
    onSuccess: () => {
      // Update the user data to reflect terms acceptance
      if (user) {
        queryClient.setQueryData(["/api/user"], {
          ...user,
          acceptedTerms: true,
        });
      }
      toast({
        title: "Terms accepted",
        description: "You have accepted the terms and conditions.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept terms",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // When user data loads, check if they've accepted terms
    if (user && !user.acceptedTerms) {
      setShowTerms(true);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        acceptTermsMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
