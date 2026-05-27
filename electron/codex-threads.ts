import { withCodexAppServer } from './codex-app-server'
import fs from 'node:fs/promises'

export type CodexThreadListItem = {
	id: string
	sessionId: string
	forkedFromId: string | null
	preview: string | null
	ephemeral: boolean
	modelProvider: string
	createdAt: number
	updatedAt: number
	status: {
		type: string
	}
	path: string
	cwd: string | null
	cliVersion: string | null
	source: string | null
	threadSource: string | null
	agentNickname: string | null
	agentRole: string | null
	gitInfo: {
		sha: string | null
		branch: string | null
		originUrl: string | null
	} | null
	name: string | null
	turns: unknown[]
}

export type CodexThreadListResult = {
	data: CodexThreadListItem[]
	nextCursor: string | null
	backwardsCursor: string | null
}

export type CodexThreadTurnItem = {
	type: string
	id?: string
	[key: string]: unknown
}

export type CodexThreadTurn = {
	id: string
	items: CodexThreadTurnItem[]
	itemsView: string
	status: string
	error: string | null
	startedAt: number | null
	completedAt: number | null
	durationMs: number | null
}

export type CodexThreadTurnsResult = {
	data: CodexThreadTurn[]
	nextCursor: string | null
	backwardsCursor: string | null
}

export type CodexThreadWorkItem = {
	id: string
	type: 'assistant' | 'reasoning' | 'tool_call' | 'tool_output'
	title: string
	body: string
	status?: string | null
}

export type CodexThreadDiffItem = {
	id: string
	title: string
	diff: string
}

export type CodexThreadSessionTurn = {
	id: string
	startedAt: number | null
	completedAt: number | null
	durationMs: number | null
	userMessage: string
	response: string | null
	work: CodexThreadWorkItem[]
	diffs: CodexThreadDiffItem[]
}

export type CodexThreadSessionResult = {
	data: CodexThreadSessionTurn[]
}

type SessionLine = {
	timestamp?: string
	type?: string
	payload?: Record<string, unknown>
}

export async function getCodexThreadsRaw() {
	return withCodexAppServer((request) =>
		request<CodexThreadListResult>('thread/list', {
			limit: 20,
			archived: false,
		})
	)
}

export async function getCodexThreadTurns(threadId: string) {
	return withCodexAppServer((request) =>
		request<CodexThreadTurnsResult>('thread/turns/list', {
			threadId,
		})
	)
}

function getTextContent(content: unknown) {
	if (!Array.isArray(content)) {
		return null
	}

	const text = content
		.map((item) => {
			if (
				item &&
				typeof item === 'object' &&
				'text' in item &&
				typeof item.text === 'string'
			) {
				return item.text
			}

			return null
		})
		.filter(Boolean)
		.join('\n')

	return text || null
}

function formatToolArguments(value: unknown) {
	if (typeof value !== 'string') {
		return ''
	}

	try {
		const parsed = JSON.parse(value) as Record<string, unknown>
		return Object.entries(parsed)
			.map(([key, item]) => {
				const text = typeof item === 'string' ? item : JSON.stringify(item, null, 2)
				return `${key}: ${text}`
			})
			.join('\n')
	} catch {
		return value
	}
}

function extractDiffs(text: string, fallbackTitle: string) {
	const diffs: CodexThreadDiffItem[] = []
	const patchMatches = text.match(/\*\*\* Begin Patch[\s\S]*?\*\*\* End Patch/g)

	for (const [index, diff] of (patchMatches ?? []).entries()) {
		const fileSections = diff.split(
			/(?=^\*\*\* (?:Update|Add|Delete) File: .+$)/gm
		)

		for (const [sectionIndex, section] of fileSections.entries()) {
			const title =
				section.match(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/m)?.[1] ??
				section.match(/^\*\*\* Move to: (.+)$/m)?.[1] ??
				'Patch'

			if (!section.includes('*** Update File:') &&
				!section.includes('*** Add File:') &&
				!section.includes('*** Delete File:')) {
				continue
			}

			diffs.push({
				id: `${fallbackTitle}-patch-${index}-${sectionIndex}`,
				title,
				diff: section.trim(),
			})
		}
	}

	const gitDiffIndex = text.indexOf('diff --git ')

	if (gitDiffIndex >= 0) {
		const gitDiff = text.slice(gitDiffIndex).trim()
		const sections = gitDiff.split(/(?=^diff --git )/gm)

		for (const [index, section] of sections.entries()) {
			const title =
				section.match(/^diff --git a\/.+ b\/(.+)$/m)?.[1] ??
				section.match(/^\+\+\+ b\/(.+)$/m)?.[1] ??
				section.match(/^--- a\/(.+)$/m)?.[1] ??
				'Git diff'

			diffs.push({
				id: `${fallbackTitle}-git-diff-${index}`,
				title,
				diff: section.trim(),
			})
		}
	}

	return diffs
}

function getStartedAt(timestamp: string | undefined) {
	if (!timestamp) {
		return null
	}

	const value = Math.floor(new Date(timestamp).getTime() / 1000)
	return Number.isFinite(value) ? value : null
}

function parseCodexSessionJsonl(raw: string) {
	const turns: CodexThreadSessionTurn[] = []
	let current: CodexThreadSessionTurn | null = null

	function ensureTurn(line: SessionLine) {
		if (current) {
			return current
		}

		current = {
			id: `turn-${turns.length}`,
			startedAt: getStartedAt(line.timestamp),
			completedAt: getStartedAt(line.timestamp),
			durationMs: null,
			userMessage: '',
			response: null,
			work: [],
			diffs: [],
		}
		turns.push(current)
		return current
	}

	for (const [index, lineText] of raw.split(/\r?\n/).entries()) {
		if (!lineText.trim()) {
			continue
		}

		let line: SessionLine

		try {
			line = JSON.parse(lineText) as SessionLine
		} catch {
			continue
		}

		const payload = line.payload

		if (!payload) {
			continue
		}

		if (line.type === 'event_msg' && payload.type === 'user_message') {
			current = {
				id: `turn-${turns.length}`,
				startedAt: getStartedAt(line.timestamp),
				completedAt: getStartedAt(line.timestamp),
				durationMs: null,
				userMessage:
					typeof payload.message === 'string' ? payload.message.trim() : '',
				response: null,
				work: [],
				diffs: [],
			}
			turns.push(current)
			continue
		}

		const turn = ensureTurn(line)
		const timestamp = getStartedAt(line.timestamp)

		if (timestamp) {
			turn.completedAt = timestamp

			if (turn.startedAt) {
				turn.durationMs = Math.max(0, timestamp - turn.startedAt) * 1000
			}
		}

		if (line.type !== 'response_item') {
			continue
		}

		if (payload.type === 'message' && payload.role === 'assistant') {
			const text = getTextContent(payload.content)?.trim()

			if (!text) {
				continue
			}

			if (payload.phase === 'final') {
				turn.response = text
			} else {
				turn.work.push({
					id: `work-${index}`,
					type: 'assistant',
					title: 'Update',
					body: text,
				})
				turn.response = text
			}
			continue
		}

		if (payload.type === 'reasoning') {
			const summary = Array.isArray(payload.summary)
				? payload.summary
						.map((item) => {
							if (
								item &&
								typeof item === 'object' &&
								'text' in item &&
								typeof item.text === 'string'
							) {
								return item.text
							}

							return null
						})
						.filter(Boolean)
						.join('\n')
				: ''

			if (summary) {
				turn.work.push({
					id: `work-${index}`,
					type: 'reasoning',
					title: 'Thinking',
					body: summary,
				})
			}
			continue
		}

		if (
			payload.type === 'function_call' ||
			payload.type === 'custom_tool_call' ||
			payload.type === 'tool_search_call'
		) {
			const name = typeof payload.name === 'string' ? payload.name : 'tool'
			const body =
				typeof payload.input === 'string'
					? payload.input
					: formatToolArguments(payload.arguments)

			turn.work.push({
				id: `work-${index}`,
				type: 'tool_call',
				title: name,
				body,
				status: typeof payload.status === 'string' ? payload.status : null,
			})

			turn.diffs.push(...extractDiffs(body, `diff-${index}`))
			continue
		}

		if (
			payload.type === 'function_call_output' ||
			payload.type === 'custom_tool_call_output' ||
			payload.type === 'tool_search_output'
		) {
			const body = typeof payload.output === 'string' ? payload.output : ''

			if (!body) {
				continue
			}

			turn.work.push({
				id: `work-${index}`,
				type: 'tool_output',
				title: 'Tool output',
				body,
			})
			turn.diffs.push(...extractDiffs(body, `diff-${index}`))
		}
	}

	return turns.filter((turn) => turn.userMessage || turn.response || turn.work.length)
}

export async function getCodexThreadSession(threadId: string) {
	return withCodexAppServer(async (request) => {
		const result = await request<{ thread: CodexThreadListItem }>('thread/read', {
			threadId,
		})
		const raw = await fs.readFile(result.thread.path, 'utf8')

		return {
			data: parseCodexSessionJsonl(raw),
		} satisfies CodexThreadSessionResult
	})
}
