"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "@/types";
import { supabaseBrowser } from "@/lib/supabase/client";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, fullName: string, organization?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
}

const DEFAULT_USER: UserProfile = {
  id: "default-user",
  email: "compliance.officer@metroshield.internal",
  fullName: "Senior Legal Metrology Auditor",
  organization: "Apex Consumer FMCG Ltd.",
  role: "auditor",
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_USER,
  isLoading: false,
  signIn: async () => ({ success: true }),
  signUp: async () => ({ success: true }),
  signOut: async () => {},
  setUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    try {
      const stored = localStorage.getItem("metroshield_user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(DEFAULT_USER);
      }
    } catch {
      setUser(DEFAULT_USER);
    } finally {
      setIsLoading(false);
    }

    // If Supabase is configured, listen to auth state changes
    if (supabaseBrowser) {
      supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || "",
            fullName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
            organization: session.user.user_metadata?.organization || "Corporate Compliance",
            role: "analyst",
            createdAt: session.user.created_at,
          };
          setUser(profile);
          localStorage.setItem("metroshield_user", JSON.stringify(profile));
        }
      });

      const { data: authListener } = supabaseBrowser.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || "",
              fullName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
              organization: session.user.user_metadata?.organization || "Corporate Compliance",
              role: "analyst",
              createdAt: session.user.created_at,
            };
            setUser(profile);
            localStorage.setItem("metroshield_user", JSON.stringify(profile));
          } else if (event === "SIGNED_OUT") {
            setUser(null);
            localStorage.removeItem("metroshield_user");
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      if (supabaseBrowser && password) {
        const { data, error } = await supabaseBrowser.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: data.user.user_metadata?.full_name || email.split("@")[0],
            organization: data.user.user_metadata?.organization || "Corporate Compliance",
            role: "analyst",
            createdAt: data.user.created_at,
          };
          setUser(profile);
          localStorage.setItem("metroshield_user", JSON.stringify(profile));
          return { success: true };
        }
      }

      // Local / Offline authentication fallback
      const profile: UserProfile = {
        id: "usr-" + email.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12),
        email,
        fullName: email.split("@")[0].replace(".", " "),
        organization: "Regulatory Affairs Bureau",
        role: "auditor",
        createdAt: new Date().toISOString(),
      };
      setUser(profile);
      localStorage.setItem("metroshield_user", JSON.stringify(profile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to sign in" };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, fullName: string, organization?: string) => {
    setIsLoading(true);
    try {
      if (supabaseBrowser) {
        const { data, error } = await supabaseBrowser.auth.signUp({
          email,
          password: "temporary-secure-password-123!",
          options: {
            data: { full_name: fullName, organization: organization || "Corporate Compliance" },
          },
        });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email,
            fullName,
            organization: organization || "Corporate Compliance",
            role: "analyst",
            createdAt: new Date().toISOString(),
          };
          setUser(profile);
          localStorage.setItem("metroshield_user", JSON.stringify(profile));
          return { success: true };
        }
      }

      const profile: UserProfile = {
        id: "usr-" + email.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12),
        email,
        fullName,
        organization: organization || "Regulatory Affairs Dept.",
        role: "analyst",
        createdAt: new Date().toISOString(),
      };
      setUser(profile);
      localStorage.setItem("metroshield_user", JSON.stringify(profile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to sign up" };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    if (supabaseBrowser) {
      await supabaseBrowser.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem("metroshield_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
