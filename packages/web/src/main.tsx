import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { QueryProvider } from "./providers/QueryProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { Toaster } from "sonner";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>,
);
