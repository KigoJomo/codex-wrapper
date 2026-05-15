import { createContext } from 'react'

import type { Project } from '@/app/_api/projects'

export type ProjectsContextValue = {
	projects: Project[]
	loading: boolean
	error: string | null
	refresh: () => Promise<void>
}

export const ProjectsContext = createContext<ProjectsContextValue | null>(null)
