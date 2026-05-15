import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { buildProjectsFromThreads } from '@/app/_api/projects'
import type { Project } from '@/app/_api/projects'
import { ProjectsContext } from './projects-context'

export function ProjectsProvider({ children }: { children: ReactNode }) {
	const [projects, setProjects] = useState<Project[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	async function refresh() {
		setLoading(true)
		setError(null)

		try {
			const threads = await window.codex.threadsRaw()
			setProjects(buildProjectsFromThreads(threads.data))
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : String(caught))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void refresh()
	}, [])

	return (
		<ProjectsContext.Provider value={{ projects, loading, error, refresh }}>
			{children}
		</ProjectsContext.Provider>
	)
}
