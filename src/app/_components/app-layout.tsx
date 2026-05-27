import { Outlet, useParams } from 'react-router'

import { getThread } from '@/app/_api/projects'
import { useProjects } from '@/app/_components/use-projects'
import {
	SidebarInset,
	SidebarProvider,
} from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { WindowTitleBar } from './window-title-bar'

export function AppLayout() {
	const { projectId, threadId } = useParams()
	const { projects } = useProjects()
	const activeThread = getThread(projects, projectId, threadId)

	return (
		<>
			<main className="relative h-svh overflow-hidden">
				<div className="content relative h-svh w-full bg-background">
					<SidebarProvider className="h-full min-h-0">
						<WindowTitleBar title={activeThread?.thread.title} />
						<AppSidebar />
						<SidebarInset className="flex h-full min-h-0 flex-col overflow-hidden pt-10">
							<div className="min-h-0 flex-1 overflow-hidden">
								<Outlet />
							</div>
						</SidebarInset>
					</SidebarProvider>
				</div>
			</main>
		</>
	)
}
