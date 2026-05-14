import { Navigate, Route, Routes } from "react-router"

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppLayout } from "./_components/app-layout"
import { HomePage } from "./home"
import { SettingsPage } from "./settings"
import { ThreadPage } from "./threads"

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="codex-wrapper-theme"
    >
      <TooltipProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/projects/:projectId/new" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route
              path="/projects/:projectId/threads/:threadId"
              element={<ThreadPage />}
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </ThemeProvider>
  )
}
