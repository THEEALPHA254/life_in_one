import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireAuth, RedirectIfAuthed } from "./components/auth/RequireAuth";

// Lazy each feature page — Tiptap/Recharts/react-day-picker are pulled in per
// route so first paint doesn't drag every module's deps. Named-export → default
// via `.then(m => ({ default: m.XPage }))`.
const DashboardPage = lazy(() => import("./features/dashboard/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const TasksPage    = lazy(() => import("./features/tasks/pages/TasksPage").then((m) => ({ default: m.TasksPage })));
const CalendarPage = lazy(() => import("./features/calendar/pages/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const JournalPage  = lazy(() => import("./features/journal/pages/JournalPage").then((m) => ({ default: m.JournalPage })));
const BudgetPage   = lazy(() => import("./features/budget/pages/BudgetPage").then((m) => ({ default: m.BudgetPage })));
const GoalsPage    = lazy(() => import("./features/goals/pages/GoalsPage").then((m) => ({ default: m.GoalsPage })));
const HealthPage   = lazy(() => import("./features/health/pages/HealthPage").then((m) => ({ default: m.HealthPage })));
const BiblePage    = lazy(() => import("./features/bible/pages/BiblePage").then((m) => ({ default: m.BiblePage })));
const SettingsPage = lazy(() => import("./features/settings/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const LoginPage    = lazy(() => import("./features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./features/auth/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const GoogleCallbackPage = lazy(() => import("./features/calendar/pages/GoogleCallbackPage").then((m) => ({ default: m.GoogleCallbackPage })));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  { path: "/login",    element: <RedirectIfAuthed><Lazy><LoginPage /></Lazy></RedirectIfAuthed> },
  { path: "/register", element: <RedirectIfAuthed><Lazy><RegisterPage /></Lazy></RedirectIfAuthed> },
  { path: "/auth/google/callback", element: <RequireAuth><Lazy><GoogleCallbackPage /></Lazy></RequireAuth> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Lazy><DashboardPage /></Lazy> },
      { path: "tasks",     element: <Lazy><TasksPage /></Lazy> },
      { path: "calendar",  element: <Lazy><CalendarPage /></Lazy> },
      { path: "journal",   element: <Lazy><JournalPage /></Lazy> },
      { path: "budget",    element: <Lazy><BudgetPage /></Lazy> },
      { path: "goals",     element: <Lazy><GoalsPage /></Lazy> },
      { path: "health",    element: <Lazy><HealthPage /></Lazy> },
      { path: "bible",     element: <Lazy><BiblePage /></Lazy> },
      { path: "settings",  element: <Lazy><SettingsPage /></Lazy> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
