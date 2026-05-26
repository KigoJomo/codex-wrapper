import { Navigate, useParams } from 'react-router'

import { ChatComposer } from '@/app/_components/chat-composer'
import { getThread } from '@/app/_api/projects'
import { useProjects } from '@/app/_components/use-projects'

export function ThreadPage() {
	const { projectId, threadId } = useParams()
	const { projects, loading } = useProjects()
	const match = getThread(projects, projectId, threadId)

	if (!loading && !match) {
		return <Navigate to="/home" replace />
	}

	if (!match) {
		return null
	}

	return (
		<section className="min-h-0 h-full flex flex-col items-center">
			<div className="chat-scroll-container w-full max-w-3xl flex-1 border p-4 pb-56">
				<div className="w-full h-full bg-card"></div>
			</div>

			<ChatComposer className="fixed bottom-2" />
		</section>
	)
}
