// Centralised TanStack Query keys — importable from both web and future RN.
// Grouped by module for easy invalidation (`queryClient.invalidateQueries({ queryKey: keys.tasks.all })`).

export const keys = {
  auth: {
    session: ["auth", "session"] as const,
  },
  profile: {
    me: ["profile", "me"] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (filter?: unknown) => ["tasks", "list", filter] as const,
    categories: ["tasks", "categories"] as const,
  },
  calendar: {
    all: ["calendar"] as const,
    range: (fromIso: string, toIso: string) => ["calendar", "range", fromIso, toIso] as const,
  },
  journal: {
    all: ["journal"] as const,
    list: (search?: string) => ["journal", "list", search] as const,
    byDate: (date: string) => ["journal", "byDate", date] as const,
  },
  budget: {
    all: ["budget"] as const,
    categories: ["budget", "categories"] as const,
    transactions: (from?: string, to?: string) => ["budget", "transactions", from, to] as const,
  },
  goals: {
    all: ["goals"] as const,
    byYear: (year: number) => ["goals", year] as const,
  },
  health: {
    all: ["health"] as const,
    metric: (type: string, from?: string, to?: string) => ["health", type, from, to] as const,
  },
  bible: {
    all: ["bible"] as const,
    notes: ["bible", "notes"] as const,
  },
} as const;
