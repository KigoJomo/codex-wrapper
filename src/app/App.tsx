import { Navigate, Route, Routes } from 'react-router'

import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from './_components/app-layout'
import { HomePage } from './home'
import { ThreadPage } from './threads'
import { CodexStatusProvider } from './_components/codex-provider'
import { ProjectsProvider } from './_components/projects-provider'
import { AppearanceSettings } from './settings/appearance'
import { ModelSettings } from './settings/models'

export default function App() {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			storageKey="codex-wrapper-theme">
			<TooltipProvider>
				<CodexStatusProvider>
					<ProjectsProvider>
						<Routes>
							<Route element={<AppLayout />}>
								<Route path="/" element={<Navigate to="/home" replace />} />
								<Route path="/home" element={<HomePage />} />
								<Route path="/projects/:projectId/new" element={<HomePage />} />
								<Route path="/settings">
									<Route
										index
										element={<Navigate to="/settings/appearance" replace />}
									/>
									<Route path="appearance" element={<AppearanceSettings />} />
									<Route path="models" element={<ModelSettings />} />
								</Route>
								<Route
									path="/projects/:projectId/threads/:threadId"
									element={<ThreadPage />}
								/>
								<Route path="*" element={<Navigate to="/home" replace />} />
							</Route>
						</Routes>
					</ProjectsProvider>
				</CodexStatusProvider>
			</TooltipProvider>
		</ThemeProvider>
	)
}
