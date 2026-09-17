import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState<"exchanging" | "error">("exchanging");
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get("code");
    const errParam = params.get("error");

    if (errParam) {
      setState("error");
      setError(`Google returned: ${errParam}`);
      return;
    }
    if (!code) {
      setState("error");
      setError("Missing authorization code in the callback URL.");
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("google-calendar-oauth-exchange", {
          body: {
            code,
            redirect_uri: `${window.location.origin}/auth/google/callback`,
          },
        });
        if (error) throw new Error(error.message);
        if (!data?.ok) throw new Error(data?.error ?? "Unknown error from exchange function");
        toast.success("Google Calendar connected");
        navigate("/settings", { replace: true });
      } catch (e) {
        setState("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [navigate, params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-3 rounded-xl border bg-card p-6 text-sm">
        {state === "exchanging" ? (
          <>
            <p className="font-medium">Connecting Google Calendar…</p>
            <p className="text-muted-foreground">Exchanging authorization with Supabase.</p>
          </>
        ) : (
          <>
            <p className="font-medium text-destructive">Connection failed</p>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => navigate("/settings")}>Back to settings</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
