import { Navigate, useParams } from "react-router"

import { ChatComposer } from "@/app/_components/chat-composer"
import { getThread } from "@/app/_api/projects"
import { useProjects } from "@/app/_components/use-projects"

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
    <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-6 pb-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{match.project.name}</p>
          <h1 className="text-2xl font-medium tracking-normal">
            {match.thread.title}
          </h1>
        </div>

        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          This is placeholder thread history for now. Messages for{" "}
          <span className="text-foreground">{match.thread.title}</span> will
          render here when the chat data layer is added.
        </div>

        <ChatComposer />
      </div>
    </main>
  )
}
