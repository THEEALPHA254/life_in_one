import { useState } from "react";
import { CalendarClock, PlugZap, RefreshCw, Unplug } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  beginGoogleOAuth,
  useDisconnectGoogleCalendar,
  useGoogleCalendarAccount,
  useSyncGoogleCalendar,
} from "@/features/calendar/hooks/useGoogleCalendar";

export function GoogleCalendarSection() {
  const { data: account, isLoading } = useGoogleCalendarAccount();
  const sync = useSyncGoogleCalendar();
  const disconnect = useDisconnectGoogleCalendar();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
          <CardTitle>Google Calendar</CardTitle>
        </div>
        <CardDescription>
          Sync events from your primary Google Calendar into Life OS. Local-to-Google push is coming in a later pass.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : account ? (
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Connected</p>
              <p className="text-xs text-muted-foreground">
                Calendar id: {account.google_calendar_id ?? "primary"}
              </p>
              {account.expires_at ? (
                <p className="text-xs text-muted-foreground">
                  Access token valid until {format(new Date(account.expires_at), "d MMM · HH:mm:ss")}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {account.sync_token ? "Incremental sync ready." : "Next sync will do a full pull."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
                <RefreshCw className={"h-4 w-4 " + (sync.isPending ? "animate-spin" : "")} />
                {sync.isPending ? "Syncing…" : "Sync now"}
              </Button>
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDisconnect(true)}>
                <Unplug className="h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Not connected.</p>
            <Button onClick={() => beginGoogleOAuth()}>
              <PlugZap className="h-4 w-4" />
              Connect Google Calendar
            </Button>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="Disconnect Google Calendar?"
        description="Local event copies are kept. To fully re-connect later, revoke access at myaccount.google.com/permissions first."
        confirmLabel="Disconnect"
        destructive
        pending={disconnect.isPending}
        onConfirm={async () => {
          if (!account) return;
          await disconnect.mutateAsync(account.id);
          setConfirmDisconnect(false);
        }}
      />
    </Card>
  );
}
