import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import {
	IconArrowLeft as ArrowLeft,
	IconArrowRight as ArrowRight,
	IconLayoutSidebarFilled as SidebarIcon,
	IconMinus as Minus,
	IconSquare as Square,
	IconX as X,
} from '@/components/icons'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

type WindowTitleBarProps = {
	title?: string | null
}

export function WindowTitleBar({ title }: WindowTitleBarProps) {
	const { pathname } = useLocation()
	const navigate = useNavigate()
	const { isMobile, state, toggleSidebar } = useSidebar()
	const showSidebarTrigger = isMobile || state === 'collapsed'
	const [historyState, setHistoryState] = useState(() => ({
		canGoBack: window.history.state?.idx > 0,
		canGoForward: false,
		maxIndex: window.history.state?.idx ?? 0,
	}))

	useEffect(() => {
		const index = window.history.state?.idx ?? 0

		setHistoryState(({ maxIndex }) => ({
			canGoBack: index > 0,
			canGoForward: index < maxIndex,
			maxIndex: Math.max(maxIndex, index),
		}))
	}, [pathname])

	return (
		<nav
			className="fixed top-0 right-0 z-50 flex h-10 items-center justify-between gap-4 border-b bg-background pl-2 transition-[left] duration-200 ease-linear [app-region:drag]"
			style={{
				left: !isMobile && state === 'expanded' ? 'var(--sidebar-width)' : 0,
			}}>
			<div className="flex min-w-0 items-center gap-2 [app-region:no-drag]">
				{showSidebarTrigger ? (
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Open sidebar"
						title="Open sidebar"
						onClick={toggleSidebar}>
						<SidebarIcon />
					</Button>
				) : null}
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Go back"
						disabled={!historyState.canGoBack}
						onClick={() => navigate(-1)}>
						<ArrowLeft />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Go forward"
						disabled={!historyState.canGoForward}
						onClick={() => navigate(1)}>
						<ArrowRight />
					</Button>
				</div>
				{title ? (
					<p className="min-w-0 truncate text-sm font-semibold">
						{title}
					</p>
				) : null}
			</div>

			<div className="flex items-center gap-1 [app-region:no-drag]">
				<div className="flex items-center">
					<Button
						variant="ghost"
						size="icon-sm"
						className="h-10 w-12 rounded-none"
						onClick={() => window.ipcRenderer?.send('window:minimize')}>
						<Minus />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						className="h-10 w-12 rounded-none"
						onClick={() => window.ipcRenderer?.send('window:toggle-maximize')}>
						<Square className="size-3" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						className="h-10 w-12 rounded-none hover:bg-destructive hover:text-destructive-foreground"
						onClick={() => window.ipcRenderer?.send('window:close')}>
						<X />
					</Button>
				</div>
			</div>
		</nav>
	)
}
