import {
	IconArrowLeft as ArrowLeft,
	IconRobot as Bot,
	IconChevronRight as ChevronRight,
	IconDatabase as Database,
	IconFolder as Folder,
	IconKey as KeyRound,
	IconPlus as Plus,
	IconSearch as Search,
	IconSettings as Settings,
	IconShieldCheck as ShieldCheck,
	IconAdjustmentsHorizontal as SlidersHorizontal,
	IconEdit as SquarePen,
} from '@/components/icons'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { useProjects } from '@/app/_components/use-projects'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail,
} from '@/components/ui/sidebar'
import {
	IconArrowsDiagonal,
	IconArrowsDiagonalMinimize,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

const primaryActions = [
	{ label: 'New chat', icon: Plus, kind: 'new-chat' },
	{ label: 'Search', icon: Search },
]

const settingsSections = [
	{ label: 'Appearance', icon: Bot, path: '/settings/appearance' },
	{ label: 'Models', icon: SlidersHorizontal, path: '/settings/models' },
	{ label: 'Permissions', icon: ShieldCheck, path: '/settings/permissions' },
	{ label: 'Credentials', icon: KeyRound, path: '/settings/credentials' },
	{ label: 'Data', icon: Database, path: '/settings/data' },
]

export function AppSidebar() {
	const { projectId, threadId } = useParams()
	const { pathname } = useLocation()
	const navigate = useNavigate()
	const isSettingsRoute = pathname.startsWith('/settings')
	const newChatPath = projectId ? `/projects/${projectId}/new` : '/home'
	const { projects, loading, error, refresh } = useProjects()
	const initialProjectState = useMemo(
		() =>
			Object.fromEntries(
				projects.map((project, index) => [
					project.id,
					index === 0 || project.id === projectId,
				])
			) as Record<string, boolean>,
		[projectId, projects]
	)
	const [openProjects, setOpenProjects] = useState(initialProjectState)
	const allProjectsOpen = projects.every((project) => openProjects[project.id])

	useEffect(() => {
		if (!projectId) {
			return
		}

		setOpenProjects((current) => ({
			...current,
			[projectId]: true,
		}))
	}, [projectId])

	useEffect(() => {
		setOpenProjects((current) => ({
			...Object.fromEntries(
				projects.map((project, index) => [
					project.id,
					current[project.id] ?? (index === 0 || project.id === projectId),
				])
			),
		}))
	}, [projectId, projects])

	function setAllProjects(open: boolean) {
		setOpenProjects(
			Object.fromEntries(
				projects.map((project) => [project.id, open])
			) as Record<string, boolean>
		)
	}

	return (
		<Sidebar
			side="left"
			collapsible="offcanvas"
			variant="floating"
			className="top-10 h-[calc(100svh-2.5rem)]">
			<SidebarContent>
				{isSettingsRoute ? (
					<>
						<SidebarGroup>
							<SidebarGroupContent className="pl-6">
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton asChild tooltip="Back to app">
											<Link to="/home">
												<ArrowLeft className="stroke-muted-foreground" />
												<span className="text-muted-foreground">
													Back to app
												</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>

						<SidebarGroup className="mt-4">
							<SidebarGroupLabel className="mb-1 px-1 text-xs font-normal">
								Settings
							</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu className="gap-1">
									{settingsSections.map((item) => (
										<SidebarMenuItem key={item.label}>
											<SidebarMenuButton
												onClick={() => navigate(item.path)}
												tooltip={item.label}
												isActive={pathname === item.path}
												className="font-normal">
												<item.icon className="stroke-muted-foreground" />
												<span className="text-muted-foreground">
													{item.label}
												</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</>
				) : (
					<>
						<SidebarGroup>
							<SidebarGroupContent>
								<SidebarMenu>
									{primaryActions.map((item, index) => (
										<SidebarMenuItem key={item.label} className={index === 0 ? 'pl-6' : ''}>
											{item.kind === 'new-chat' ? (
												<SidebarMenuButton asChild tooltip={item.label}>
													<Link to={newChatPath}>
														<item.icon className="stroke-muted-foreground" />
														<span className="text-muted-foreground">
															{item.label}
														</span>
													</Link>
												</SidebarMenuButton>
											) : (
												<SidebarMenuButton tooltip={item.label}>
													<item.icon className="stroke-muted-foreground" />
													<span className="text-muted-foreground">
														{item.label}
													</span>
												</SidebarMenuButton>
											)}
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>

						<SidebarGroup className="mt-4 group-data-[collapsible=icon]:hidden">
							<SidebarGroupLabel className="mb-1 px-1 text-xs font-normal">
								Projects
							</SidebarGroupLabel>
							<SidebarGroupAction asChild>
								<Button
									aria-label={
										allProjectsOpen
											? 'Collapse all projects'
											: 'Expand all projects'
									}
									title={
										allProjectsOpen
											? 'Collapse all projects'
											: 'Expand all projects'
									}
									onClick={() => setAllProjects(!allProjectsOpen)}
									size="icon-sm"
									variant="ghost">
									{allProjectsOpen ? (
										<IconArrowsDiagonalMinimize />
									) : (
										<IconArrowsDiagonal />
									)}
								</Button>
							</SidebarGroupAction>
							<SidebarGroupContent>
								<SidebarMenu className="gap-1.5">
									{loading ? (
										<SidebarMenuItem>
											<SidebarMenuButton className="h-8 px-2 font-normal">
												<span className="text-muted-foreground">
													Loading projects...
												</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									) : null}
									{error ? (
										<SidebarMenuItem>
											<SidebarMenuButton
												className="h-auto min-h-8 px-2 py-2 font-normal"
												onClick={() => void refresh()}>
												<span className="text-destructive">
													Failed to load projects. Click to retry.
												</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									) : null}
									{!loading && !error && projects.map((project) => (
										<SidebarMenuItem key={project.id}>
											<Collapsible
												className="group/collapsible"
												open={openProjects[project.id]}
												onOpenChange={(open) =>
													setOpenProjects((current) => ({
														...current,
														[project.id]: open,
													}))
												}>
												<CollapsibleTrigger asChild>
													<SidebarMenuButton
														tooltip={project.name}
														isActive={project.id === projectId}
														className="h-8 px-2 pr-8 font-normal">
														<ChevronRight className="stroke-muted-foreground transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
														<Folder className="stroke-muted-foreground" />
														<span className="text-muted-foreground">
															{project.name}
														</span>
													</SidebarMenuButton>
												</CollapsibleTrigger>
												<SidebarMenuAction
													asChild
													showOnHover
													title={`Start new chat in ${project.name}`}>
													<Link to={`/projects/${project.id}/new`}>
														<SquarePen />
														<span className="sr-only">
															Start new chat in {project.name}
														</span>
													</Link>
												</SidebarMenuAction>
												{project.threads.length > 0 ? (
													<CollapsibleContent>
														<SidebarMenuSub className="mt-1 gap-1.5">
															{project.threads.map((thread) => (
																<SidebarMenuSubItem key={thread.id}>
																	<SidebarMenuSubButton
																		asChild
																		isActive={
																			project.id === projectId &&
																			thread.id === threadId
																		}
																		className="h-7 pr-8 text-xs font-normal">
																		<Link
																			to={`/projects/${project.id}/threads/${thread.id}`}
																			className="flex min-w-0 flex-1 items-center justify-between gap-2">
																			<span className="truncate text-muted-foreground">
																				{thread.title}
																			</span>
																			<span className="shrink-0 text-[0.7rem] font-normal text-muted-foreground">
																				{thread.time}
																			</span>
																		</Link>
																	</SidebarMenuSubButton>
																</SidebarMenuSubItem>
															))}
														</SidebarMenuSub>
													</CollapsibleContent>
												) : null}
											</Collapsible>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</>
				)}
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							tooltip="Settings"
							isActive={pathname === '/settings'}>
							<Link to="/settings">
								<Settings />
								<span>Settings</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
