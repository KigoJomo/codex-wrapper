import { Outlet, useParams } from 'react-router'

import { getThread } from '@/app/_api/projects'
import { useProjects } from '@/app/_components/use-projects'
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { WindowTitleBar } from './window-title-bar'

export function AppLayout() {
	const { projectId, threadId } = useParams()
	const { projects } = useProjects()
	const activeThread = getThread(projects, projectId, threadId)

	return (
		<>
			<main className="relative h-svh overflow-hidden pt-10">
				<div className="content h-[calc(100svh-2.5rem)] w-full bg-background relative">
					<SidebarProvider>
					<SidebarTrigger className="absolute top-4.5 right-4 z-20" />
						<WindowTitleBar />
						<AppSidebar />
						<SidebarInset className="min-h-full overflow-hidden">
							<header className="flex h-12 shrink-0 items-center justify-between pl-6 pr-4">
								{activeThread ? (
									<p className="truncate text-sm font-medium">
										{activeThread.thread.title}
									</p>
								) : null}
							</header>
							<Outlet />
						</SidebarInset>
					</SidebarProvider>
				</div>
			</main>
		</>
	)
}
