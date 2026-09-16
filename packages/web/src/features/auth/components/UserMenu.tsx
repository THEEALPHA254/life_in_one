import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";

interface Props {
  compact?: boolean;
}

export function UserMenu({ compact }: Props) {
  const { user } = useAuth();
  if (!user) return null;

  const initial =
    (user.user_metadata?.display_name as string | undefined)?.[0] ??
    user.email?.[0] ??
    "?";
  const label =
    (user.user_metadata?.display_name as string | undefined) ?? user.email ?? "";

  const onSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
  };

  if (compact) {
    return (
      <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out">
        <LogOut className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium uppercase text-primary">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
