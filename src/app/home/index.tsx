import { useParams } from "react-router"

import { ChatComposer } from "@/app/_components/chat-composer"
import { getProject, listProjects } from "@/app/_api/projects"

export function HomePage() {
  const { projectId } = useParams()
  const projects = listProjects()
  const project = getProject(projectId) ?? projects[0]

  return (
		<main className="min-h-0 flex-1 overflow-y-auto px-4 py-8">
			<div className="flex min-h-full flex-col items-center justify-center gap-8 pb-6">
				<div className="text-center">
					<h1 className="text-2xl tracking-normal text-foreground sm:text-3xl">
						What should we build in{' '}
						<span className="text-chart-2">
							{project.name}?
						</span>
					</h1>
				</div>

				<ChatComposer />
			</div>
		</main>
	)
}
