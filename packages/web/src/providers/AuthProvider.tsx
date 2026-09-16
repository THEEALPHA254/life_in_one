import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useThemeStore } from "@lio/core/stores/theme";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session ?? null))
      .finally(() => setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, next) => {
      setSession(next);
      if (!next) queryClient.clear();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("theme_mode, accent_color")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        if (data.theme_mode) setMode(data.theme_mode as "light" | "dark" | "system");
        if (data.accent_color) setAccent(data.accent_color);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user, setMode, setAccent]);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
