import { withCodexAppServer } from './codex-app-server'

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

export async function getCodexThreadsRaw() {
	return withCodexAppServer((request) =>
		request<CodexThreadListResult>('thread/list', {
			limit: 20,
			archived: false,
		})
	)
}
