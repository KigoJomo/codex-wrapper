import { Outlet, useParams } from 'react-router'

import { getThread } from '@/app/_api/projects'
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { WindowTitleBar } from './window-title-bar'

export function AppLayout() {
	const { projectId, threadId } = useParams()
	const activeThread = getThread(projectId, threadId)

	return (
		<>
			<main className="relative h-svh overflow-hidden pt-10">
				<div className="content h-[calc(100svh-2.5rem)] w-full bg-background">
					<SidebarProvider>
						<WindowTitleBar />
						<AppSidebar />
						<SidebarInset className="min-h-full overflow-hidden">
							<header className="flex h-12 shrink-0 items-center justify-between pl-6 pr-4">
								{activeThread ? (
									<p className="truncate text-sm font-medium">
										{activeThread.thread.title}
									</p>
								) : null}

								<SidebarTrigger />
							</header>
							<Outlet />
						</SidebarInset>
					</SidebarProvider>
				</div>
			</main>
		</>
	)
}
