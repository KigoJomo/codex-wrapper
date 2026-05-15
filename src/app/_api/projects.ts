import type { CodexThreadListItem } from 'electron/codex-threads'

export type Thread = {
	id: string
	title: string
	time: string
	preview: string | null
	updatedAt: number
}

export type Project = {
	id: string
	name: string
	cwd: string
	threads: Thread[]
}

function getProjectId(cwd: string) {
	let hash = 0

	for (let index = 0; index < cwd.length; index++) {
		hash = (hash * 31 + cwd.charCodeAt(index)) >>> 0
	}

	return `cwd-${hash.toString(36)}`
}

function getProjectName(cwd: string) {
	const normalized = cwd.replace(/\\/g, '/')
	const parts = normalized.split('/').filter(Boolean)
	const name = parts[parts.length - 1]

	return name ?? cwd
}

function getThreadTitle(thread: CodexThreadListItem) {
	return thread.name ?? thread.preview?.split(/\r?\n/)[0] ?? 'Untitled thread'
}

function getRelativeTime(timestampSeconds: number) {
	const elapsedSeconds = Math.max(
		0,
		Math.floor(Date.now() / 1000) - timestampSeconds
	)
	const elapsedMinutes = Math.floor(elapsedSeconds / 60)

	if (elapsedMinutes < 1) {
		return 'now'
	}

	if (elapsedMinutes < 60) {
		return `${elapsedMinutes}m`
	}

	const elapsedHours = Math.floor(elapsedMinutes / 60)

	if (elapsedHours < 24) {
		return `${elapsedHours}h`
	}

	return `${Math.floor(elapsedHours / 24)}d`
}

export function buildProjectsFromThreads(threads: CodexThreadListItem[]) {
	const projectsByCwd = new Map<string, Project>()

	for (const thread of threads) {
		const cwd = thread.cwd ?? 'Unknown'
		let project = projectsByCwd.get(cwd)

		if (!project) {
			project = {
				id: getProjectId(cwd),
				name: getProjectName(cwd),
				cwd,
				threads: [],
			}
			projectsByCwd.set(cwd, project)
		}

		project.threads.push({
			id: thread.id,
			title: getThreadTitle(thread),
			time: getRelativeTime(thread.updatedAt),
			preview: thread.preview,
			updatedAt: thread.updatedAt,
		})
	}

	return Array.from(projectsByCwd.values()).map((project) => ({
		...project,
		threads: project.threads.sort((first, second) => {
			return second.updatedAt - first.updatedAt
		}),
	}))
}

export function getProject(projects: Project[], projectId: string | undefined) {
	return projects.find((item) => item.id === projectId) ?? null
}

export function getThread(
	projects: Project[],
	projectId: string | undefined,
	threadId: string | undefined
) {
	const project = getProject(projects, projectId)
	const thread = project?.threads.find((item) => item.id === threadId)

	if (!project || !thread) {
		return null
	}

	return { project, thread }
}
