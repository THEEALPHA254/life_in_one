import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireAuth, RedirectIfAuthed } from "./components/auth/RequireAuth";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { TasksPage } from "./features/tasks/pages/TasksPage";
import { CalendarPage } from "./features/calendar/pages/CalendarPage";
import { JournalPage } from "./features/journal/pages/JournalPage";
import { BudgetPage } from "./features/budget/pages/BudgetPage";
import { GoalsPage } from "./features/goals/pages/GoalsPage";
import { HealthPage } from "./features/health/pages/HealthPage";
import { BiblePage } from "./features/bible/pages/BiblePage";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";

export const router = createBrowserRouter([
  { path: "/login", element: <RedirectIfAuthed><LoginPage /></RedirectIfAuthed> },
  { path: "/register", element: <RedirectIfAuthed><RegisterPage /></RedirectIfAuthed> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "journal", element: <JournalPage /> },
      { path: "budget", element: <BudgetPage /> },
      { path: "goals", element: <GoalsPage /> },
      { path: "health", element: <HealthPage /> },
      { path: "bible", element: <BiblePage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
