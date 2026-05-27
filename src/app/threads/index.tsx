import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import ReactMarkdown from 'react-markdown'
import { Navigate, useParams } from 'react-router'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark'
import type {
	CodexThreadDiffItem,
	CodexThreadSessionTurn,
	CodexThreadTurn,
	CodexThreadTurnItem,
	CodexThreadWorkItem,
} from 'electron/codex-threads'
import remarkGfm from 'remark-gfm'

import {
	IconAlertTriangle as AlertTriangle,
	IconChevronDown as ChevronDown,
	IconX as X,
} from '@/components/icons'
import { ChatComposer } from '@/app/_components/chat-composer'
import { getLinkOpenMode, type LinkOpenMode } from '@/app/_api/preferences'
import { getThread } from '@/app/_api/projects'
import { useProjects } from '@/app/_components/use-projects'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

type MessageRole = 'user' | 'assistant' | 'event'

type RenderableItem = {
	id: string
	role: MessageRole
	label: string
	meta: string | null
	text: string
	rawType: string
}

type ThreadHistoryState = {
	turns: CodexThreadTurn[]
	sessionTurns: CodexThreadSessionTurn[]
}

type BrowserWebviewElement = HTMLElement & {
	getWebContentsId?: () => number
}

const threadHistoryCache = new Map<string, ThreadHistoryState>()

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getString(value: unknown) {
	return typeof value === 'string' ? value : null
}

function getContentText(content: unknown) {
	if (typeof content === 'string') {
		return content
	}

	if (!Array.isArray(content)) {
		return null
	}

	const parts = content
		.map((part) => {
			if (typeof part === 'string') {
				return part
			}

			if (isRecord(part)) {
				return getString(part.text) ?? getString(part.content)
			}

			return null
		})
		.filter((part): part is string => Boolean(part))

	return parts.length > 0 ? parts.join('\n') : null
}

function getItemText(item: CodexThreadTurnItem) {
	return (
		getString(item.text) ??
		getString(item.message) ??
		getString(item.output) ??
		getContentText(item.content) ??
		getContentText(item.delta) ??
		null
	)
}

function getEventText(item: CodexThreadTurnItem) {
	const command = getString(item.command)
	const name = getString(item.name) ?? getString(item.toolName)
	const status = getString(item.status)
	const text = getItemText(item)

	if (text) {
		return text
	}

	if (command) {
		return command
	}

	if (name && status) {
		return `${name} ${status}`
	}

	if (name) {
		return name
	}

	return item.type
}

function toRenderableItem(item: CodexThreadTurnItem, index: number): RenderableItem {
	const phase = getString(item.phase)
	const rawType = item.type

	if (rawType === 'userMessage') {
		return {
			id: item.id ?? `${rawType}-${index}`,
			role: 'user',
			label: 'Kigo',
			meta: null,
			text: getItemText(item)?.trim() ?? '',
			rawType,
		}
	}

	if (rawType === 'agentMessage') {
		return {
			id: item.id ?? `${rawType}-${index}`,
			role: 'assistant',
			label: phase === 'analysis' ? 'Codex reasoning' : 'Codex',
			meta: phase,
			text: getItemText(item)?.trim() ?? '',
			rawType,
		}
	}

	return {
		id: item.id ?? `${rawType}-${index}`,
		role: 'event',
		label: rawType.replace(/([a-z])([A-Z])/g, '$1 $2'),
		meta: getString(item.status),
		text: getEventText(item).trim(),
		rawType,
	}
}

function formatDuration(durationMs: number | null) {
	if (typeof durationMs === 'number') {
		return `${Math.max(1, Math.round(durationMs / 1000))}s`
	}

	return null
}

function formatTurnDuration(turn: CodexThreadTurn) {
	const duration = formatDuration(turn.durationMs)

	if (duration) {
		return duration
	}

	if (turn.startedAt && turn.completedAt) {
		return `${Math.max(1, turn.completedAt - turn.startedAt)}s`
	}

	return null
}

function formatStartedAt(startedAt: number | null) {
	if (!startedAt) {
		return null
	}

	return new Intl.DateTimeFormat(undefined, {
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(startedAt * 1000))
}

function getCodeLanguage(className: string | undefined) {
	return className?.match(/language-([\w-]+)/)?.[1] ?? null
}

function CodeBlock({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	const language = getCodeLanguage(className)
	const code = String(children).replace(/\n$/, '')
	const isDiff = language === 'diff' || language === 'patch'

	if (!isDiff) {
		return (
			<div className="my-3 overflow-hidden rounded-lg border bg-card/75">
				{language ? (
					<div className="border-b bg-muted/35 px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
						{language}
					</div>
				) : null}
				<SyntaxHighlighter
					language={language ?? 'text'}
					style={oneDark}
					customStyle={{
						margin: 0,
						background: 'transparent',
						padding: '0.75rem',
						fontSize: '0.82rem',
						lineHeight: 1.55,
					}}
					codeTagProps={{ style: { fontFamily: 'inherit' } }}
				>
					{code}
				</SyntaxHighlighter>
			</div>
		)
	}

	return (
		<div className="my-3 overflow-hidden rounded-lg border bg-card/75">
			{language ? (
				<div className="border-b bg-muted/35 px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
					{language}
				</div>
			) : null}
			<SyntaxHighlighter
				language="diff"
				style={oneDark}
				customStyle={{
					margin: 0,
					background: 'transparent',
					padding: '0.75rem',
					fontSize: '0.82rem',
					lineHeight: 1.55,
				}}
				codeTagProps={{ style: { fontFamily: 'inherit' } }}
			>
				{code}
			</SyntaxHighlighter>
		</div>
	)
}

function DiffCode({ children }: { children: string }) {
	return (
		<pre className="overflow-x-auto bg-transparent p-3 text-[0.82rem] leading-5">
			<code>
				{children.split('\n').map((line, index) => (
					<span
						key={`${index}-${line}`}
						className={cn(
							'block min-h-5 whitespace-pre px-1 font-mono',
							line.startsWith('+') &&
								!line.startsWith('+++') &&
								'bg-emerald-500/12 text-emerald-300',
							line.startsWith('-') &&
								!line.startsWith('---') &&
								'bg-red-500/12 text-red-300',
							line.startsWith('@@') && 'text-sky-300',
							(line.startsWith('diff --git') ||
								line.startsWith('*** ') ||
								line.startsWith('---') ||
								line.startsWith('+++')) &&
								'text-violet-300'
						)}
					>
						{line || ' '}
					</span>
				))}
			</code>
		</pre>
	)
}

function getFaviconUrl(href: string | undefined) {
	if (!href) {
		return null
	}

	try {
		const url = new URL(href)

		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return null
		}

		return `${url.origin}/favicon.ico`
	} catch {
		return null
	}
}

function MarkdownMessage({
	children,
	onOpenLink,
}: {
	children: string
	onOpenLink?: (href: string) => void
}) {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				a({ children, href }) {
					const faviconUrl = getFaviconUrl(href)

					return (
						<a
							href={href}
							onClick={(event) => {
								if (!href) {
									return
								}

								event.preventDefault()
								onOpenLink?.(href)
							}}
							rel="noreferrer"
							className="inline-flex items-baseline gap-1 text-sky-300 underline decoration-sky-300/50 underline-offset-4 transition-colors hover:text-sky-200"
						>
							{faviconUrl ? (
								<img
									src={faviconUrl}
									alt=""
									className="relative top-0.5 size-3.5 shrink-0 rounded-[2px]"
									onError={(event) => {
										event.currentTarget.hidden = true
									}}
								/>
							) : null}
							{children}
						</a>
					)
				},
				code({ children, className }) {
					const language = getCodeLanguage(className)

					if (language) {
						return <CodeBlock className={className}>{children}</CodeBlock>
					}

					return (
						<code className="rounded bg-muted px-1.5 py-0.5 text-[0.88em] text-foreground">
							{children}
						</code>
					)
				},
				h1({ children }) {
					return <h2 className="mt-5 mb-2 text-xl font-semibold">{children}</h2>
				},
				h2({ children }) {
					return <h3 className="mt-5 mb-2 text-lg font-semibold">{children}</h3>
				},
				h3({ children }) {
					return <h4 className="mt-4 mb-2 text-base font-semibold">{children}</h4>
				},
				li({ children }) {
					return <li className="my-1 pl-1">{children}</li>
				},
				ol({ children }) {
					return <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>
				},
				p({ children }) {
					return <p className="my-3 first:mt-0 last:mb-0">{children}</p>
				},
				pre({ children }) {
					return <>{children}</>
				},
				table({ children }) {
					return (
						<div className="my-3 overflow-x-auto rounded-lg border">
							<table className="w-full border-collapse text-sm">{children}</table>
						</div>
					)
				},
				td({ children }) {
					return <td className="border-t px-3 py-2 align-top">{children}</td>
				},
				th({ children }) {
					return (
						<th className="border-b bg-muted/35 px-3 py-2 text-left font-semibold">
							{children}
						</th>
					)
				},
				ul({ children }) {
					return <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>
				},
			}}
		>
			{children}
		</ReactMarkdown>
	)
}

function DiffPanel({ diff }: { diff: CodexThreadDiffItem }) {
	return (
		<details className="mt-4 overflow-hidden rounded-lg border bg-card/70">
			<summary className="cursor-pointer border-b bg-muted/35 px-3 py-2 text-xs font-medium text-muted-foreground">
				{diff.title}
			</summary>
			<DiffCode>{diff.diff}</DiffCode>
		</details>
	)
}

function WorkItem({ item }: { item: CodexThreadWorkItem }) {
	return (
		<div className="border-t border-border/70 px-3 py-2 first:border-t-0">
			<div className="mb-1 flex items-center justify-between gap-2 text-xs">
				<span className="font-medium text-muted-foreground">{item.title}</span>
				{item.status ? (
					<span className="text-muted-foreground/70">{item.status}</span>
				) : null}
			</div>
			<pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-muted-foreground">
				{item.body}
			</pre>
		</div>
	)
}

function TurnWork({
	duration,
	items,
}: {
	duration: string | null
	items: CodexThreadWorkItem[]
}) {
	if (items.length === 0) {
		return null
	}

	return (
		<details className="mb-4 rounded-lg border bg-card/45">
			<summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">
				{duration ? `Worked for ${duration}` : 'Worked'} ({items.length})
			</summary>
			<div>
				{items.map((item) => (
					<WorkItem key={item.id} item={item} />
				))}
			</div>
		</details>
	)
}

function ThreadItem({
	item,
	onOpenLink,
}: {
	item: RenderableItem
	onOpenLink: (href: string) => void
}) {
	const isUser = item.role === 'user'

	return (
		<article
			className={cn(
				'flex min-w-0',
				isUser ? 'justify-end' : 'justify-start',
				item.role === 'event' && 'py-1'
			)}
		>
			<div
				className={cn(
					'min-w-0',
					isUser &&
						'max-w-[78%] rounded-lg bg-primary px-3.5 py-2.5 text-primary-foreground shadow-sm shadow-primary/20',
					item.role === 'assistant' && 'w-full text-foreground',
					item.role === 'event' &&
						'w-full rounded-md bg-muted/45 px-3 py-2 text-muted-foreground'
				)}
			>
				{item.role === 'assistant' ? (
					<div className="text-[0.94rem] leading-6">
						<MarkdownMessage onOpenLink={onOpenLink}>
							{item.text || item.rawType}
						</MarkdownMessage>
					</div>
				) : (
					<pre
						className={cn(
							'whitespace-pre-wrap break-words font-sans text-[0.94rem] leading-6',
							item.role === 'event' && 'font-mono text-xs leading-5'
						)}
					>
						{item.text || item.rawType}
					</pre>
				)}
			</div>
		</article>
	)
}

function ThreadTurnCard({
	turn,
	index,
	onOpenLink,
}: {
	turn: CodexThreadTurn
	index: number
	onOpenLink: (href: string) => void
}) {
	const items = turn.items.map(toRenderableItem).filter((item) => item.text)
	const startedAt = formatStartedAt(turn.startedAt)
	const duration = formatTurnDuration(turn)

	return (
		<section className="max-w-none px-0">
			<div className="mb-3 flex items-center gap-3">
				<div className="flex size-7 items-center justify-center rounded-md border bg-card text-xs font-semibold text-muted-foreground">
					{index + 1}
				</div>
				<div className="h-px flex-1 bg-border" />
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					{startedAt ? <span>{startedAt}</span> : null}
					{duration ? <span>{duration}</span> : null}
				</div>
			</div>

			<div className="space-y-2">
				{items.map((item) => (
					<ThreadItem key={item.id} item={item} onOpenLink={onOpenLink} />
				))}
			</div>
		</section>
	)
}

function ThreadSessionCard({
	turn,
	index,
	onOpenLink,
}: {
	turn: CodexThreadSessionTurn
	index: number
	onOpenLink: (href: string) => void
}) {
	const startedAt = formatStartedAt(turn.startedAt)
	const userItem: RenderableItem = {
		id: `${turn.id}-user`,
		role: 'user',
		label: 'Kigo',
		meta: null,
		text: turn.userMessage,
		rawType: 'userMessage',
	}
	const responseItem: RenderableItem = {
		id: `${turn.id}-response`,
		role: 'assistant',
		label: 'Codex',
		meta: null,
		text: turn.response ?? '',
		rawType: 'agentMessage',
	}
	const workItems = turn.work.filter((item, itemIndex) => {
		return item.body !== turn.response || itemIndex !== turn.work.length - 1
	})
	const duration = formatDuration(turn.durationMs)

	return (
		<section className="max-w-none px-0">
			<div className="mb-3 flex items-center gap-3">
				<div className="flex size-7 items-center justify-center rounded-md border bg-card text-xs font-semibold text-muted-foreground">
					{index + 1}
				</div>
				<div className="h-px flex-1 bg-border" />
				{startedAt ? (
					<div className="text-xs text-muted-foreground">{startedAt}</div>
				) : null}
			</div>

			<div className="space-y-4">
				{turn.userMessage ? (
					<ThreadItem item={userItem} onOpenLink={onOpenLink} />
				) : null}
				<TurnWork duration={duration} items={workItems} />
				{turn.response ? (
					<>
						<ThreadItem item={responseItem} onOpenLink={onOpenLink} />
						{turn.diffs.map((diff) => (
							<DiffPanel key={diff.id} diff={diff} />
						))}
					</>
				) : null}
			</div>
		</section>
	)
}

function BrowserPane({
	url,
	onClose,
}: {
	url: string
	onClose: () => void
}) {
	const browserViewportRef = useRef<HTMLDivElement | null>(null)
	const browserWebviewRef = useRef<BrowserWebviewElement | null>(null)

	useLayoutEffect(() => {
		const host = browserViewportRef.current

		if (!host) {
			return
		}

		let webview = browserWebviewRef.current

		if (!webview) {
			webview = document.createElement('webview') as BrowserWebviewElement
			webview.style.display = 'flex'
			webview.style.width = '100%'
			webview.style.height = '100%'
			webview.style.backgroundColor = '#fff'
			webview.setAttribute('partition', 'persist:codex-wrapper-browser')
			webview.setAttribute(
				'webpreferences',
				'contextIsolation=yes,nodeIntegration=no,sandbox=yes'
			)
			webview.setAttribute('allowpopups', '')
			browserWebviewRef.current = webview
		}

		if (webview.parentElement !== host) {
			host.append(webview)
		}

		let frameId: number | null = null
		const syncWebviewSize = () => {
			const rect = host.getBoundingClientRect()
			webview.style.width = `${Math.max(0, Math.floor(rect.width))}px`
			webview.style.height = `${Math.max(0, Math.floor(rect.height))}px`
		}
		const scheduleSyncWebviewSize = () => {
			if (frameId !== null) {
				return
			}

			frameId = window.requestAnimationFrame(() => {
				frameId = null
				syncWebviewSize()
			})
		}
		const resizeObserver = new ResizeObserver(scheduleSyncWebviewSize)

		syncWebviewSize()
		const initialFrameId = window.requestAnimationFrame(syncWebviewSize)
		resizeObserver.observe(host)
		window.addEventListener('resize', scheduleSyncWebviewSize)

		return () => {
			window.cancelAnimationFrame(initialFrameId)

			if (frameId !== null) {
				window.cancelAnimationFrame(frameId)
			}

			resizeObserver.disconnect()
			window.removeEventListener('resize', scheduleSyncWebviewSize)
			webview.remove()
			browserWebviewRef.current = null
		}
	}, [])

	useLayoutEffect(() => {
		const webview = browserWebviewRef.current

		if (!webview || webview.getAttribute('src') === url) {
			return
		}

		webview.setAttribute('src', url)
	}, [url])

	return (
		<aside className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
			<div className="grid h-11 shrink-0 grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2 border-b px-2">
				<div />
				<p className="min-w-0 truncate text-center text-sm font-semibold text-foreground">
					{url}
				</p>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Close browser pane"
					onClick={onClose}
				>
					<X />
				</Button>
			</div>
			<div className="relative min-h-0 flex-1 overflow-hidden bg-card">
				<div ref={browserViewportRef} className="absolute inset-0 bg-transparent" />
			</div>
		</aside>
	)
}

export function ThreadPage() {
	const { projectId, threadId } = useParams()
	const { projects, loading } = useProjects()
	const match = getThread(projects, projectId, threadId)
	const [turns, setTurns] = useState<CodexThreadTurn[]>([])
	const [sessionTurns, setSessionTurns] = useState<CodexThreadSessionTurn[]>([])
	const [turnsLoading, setTurnsLoading] = useState(true)
	const [turnsError, setTurnsError] = useState<string | null>(null)
	const [browserUrl, setBrowserUrl] = useState<string | null>(null)
	const [showScrollToBottom, setShowScrollToBottom] = useState(false)
	const scrollContainerRef = useRef<HTMLDivElement | null>(null)
	const [linkOpenMode, setLinkOpenModeState] = useState<LinkOpenMode>(() =>
		getLinkOpenMode()
	)

	const updateScrollToBottomButton = useCallback(() => {
		const element = scrollContainerRef.current

		if (!element) {
			setShowScrollToBottom(false)
			return
		}

		const distanceFromBottom =
			element.scrollHeight - element.scrollTop - element.clientHeight

		setShowScrollToBottom(
			element.scrollHeight > element.clientHeight && distanceFromBottom > 96
		)
	}, [])

	const scrollToBottom = useCallback(() => {
		scrollContainerRef.current?.scrollTo({
			top: scrollContainerRef.current.scrollHeight,
			behavior: 'smooth',
		})
	}, [])

	useEffect(() => {
		if (!threadId) {
			return
		}

		let cancelled = false
		const cached = threadHistoryCache.get(threadId)

		if (cached) {
			setTurns(cached.turns)
			setSessionTurns(cached.sessionTurns)
			setTurnsLoading(false)
		} else {
			setTurns([])
			setSessionTurns([])
			setTurnsLoading(true)
		}

		setTurnsError(null)

		Promise.allSettled([
			window.codex.threadTurns(threadId),
			window.codex.threadSession(threadId),
		])
			.then(([turnResult, sessionResult]) => {
				if (!cancelled) {
					if (turnResult.status === 'fulfilled') {
						setTurns(turnResult.value.data)
					}

					if (sessionResult.status === 'fulfilled') {
						setSessionTurns(sessionResult.value.data)
					}

					threadHistoryCache.set(threadId, {
						turns:
							turnResult.status === 'fulfilled'
								? turnResult.value.data
								: cached?.turns ?? [],
						sessionTurns:
							sessionResult.status === 'fulfilled'
								? sessionResult.value.data
								: cached?.sessionTurns ?? [],
					})

					if (turnResult.status === 'rejected' && sessionResult.status === 'rejected') {
						throw turnResult.reason
					}
				}
			})
			.catch((caught) => {
				if (!cancelled) {
					setTurnsError(caught instanceof Error ? caught.message : String(caught))
				}
			})
			.finally(() => {
				if (!cancelled) {
					setTurnsLoading(false)
				}
			})

		return () => {
			cancelled = true
		}
	}, [threadId])

	useEffect(() => {
		function handleStorage(event: StorageEvent) {
			if (event.key === 'codex-wrapper-link-open-mode') {
				setLinkOpenModeState(getLinkOpenMode())
			}
		}

		window.addEventListener('storage', handleStorage)
		return () => window.removeEventListener('storage', handleStorage)
	}, [])

	const orderedTurns = useMemo(
		() => [...turns].sort((first, second) => {
			return (first.startedAt ?? 0) - (second.startedAt ?? 0)
		}),
		[turns]
	)

	useEffect(() => {
		const frameId = window.requestAnimationFrame(updateScrollToBottomButton)

		return () => window.cancelAnimationFrame(frameId)
	}, [
		browserUrl,
		orderedTurns,
		sessionTurns,
		turnsError,
		turnsLoading,
		updateScrollToBottomButton,
	])

	function handleOpenLink(href: string) {
		let url: URL

		try {
			url = new URL(href)
		} catch {
			return
		}

		if (
			linkOpenMode === 'in-app' &&
			(url.protocol === 'http:' || url.protocol === 'https:')
		) {
			setBrowserUrl(href)
			return
		}

		if (
			url.protocol === 'http:' ||
			url.protocol === 'https:' ||
			url.protocol === 'mailto:'
		) {
			void window.codex.openExternal(href)
		}
	}

	if (!loading && !match) {
		return <Navigate to="/home" replace />
	}

	if (!match) {
		return null
	}

	return (
		<section className="flex h-full min-h-0 max-w-none flex-col px-0">
			<div className="flex min-h-0 flex-1 gap-4 p-5 pt-2">
				<div
					className={cn(
						'flex min-h-0 flex-col overflow-hidden bg-background',
						browserUrl ? 'min-w-0 flex-1' : 'mx-auto w-full max-w-3xl'
					)}
				>
					<div
						ref={scrollContainerRef}
						onScroll={updateScrollToBottomButton}
						className="chat-scroll-container no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4"
					>
						<div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-6">
							{turnsLoading ? (
								<div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
									<Spinner className="size-4" />
									<span>Loading thread history</span>
								</div>
							) : null}

							{turnsError ? (
								<div className="flex gap-3 rounded-lg border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
									<AlertTriangle className="mt-0.5 size-4 shrink-0" />
									<span>{turnsError}</span>
								</div>
							) : null}

							{!turnsLoading &&
							!turnsError &&
							sessionTurns.length === 0 &&
							orderedTurns.length === 0 ? (
								<div className="rounded-lg border bg-card px-4 py-6 text-sm text-muted-foreground">
									No turn history is available for this thread yet.
								</div>
							) : null}

							{sessionTurns.length > 0
								? sessionTurns.map((turn, index) => (
										<ThreadSessionCard
											key={turn.id}
											turn={turn}
											index={index}
											onOpenLink={handleOpenLink}
										/>
									))
								: orderedTurns.map((turn, index) => (
										<ThreadTurnCard
											key={turn.id}
											turn={turn}
											index={index}
											onOpenLink={handleOpenLink}
										/>
									))}
						</div>
					</div>

					<div className="relative shrink-0 px-5 py-4">
						{showScrollToBottom ? (
							<Button
								type="button"
								size="icon-sm"
								variant="outline"
								aria-label="Scroll to bottom"
								onClick={scrollToBottom}
								className="absolute top-0 left-1/2 z-10 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/95 shadow-md shadow-black/10 backdrop-blur transition hover:-translate-y-[calc(50%+1px)] dark:shadow-black/30"
							>
								<ChevronDown />
							</Button>
						) : null}
						<ChatComposer className="mx-auto shadow-none" />
					</div>
				</div>

				{browserUrl ? (
					<BrowserPane url={browserUrl} onClose={() => setBrowserUrl(null)} />
				) : null}
			</div>
		</section>
	)
}
