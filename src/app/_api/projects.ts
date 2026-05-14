export type Thread = {
  id: string
  title: string
  time: string
}

export type Project = {
  id: string
  name: string
  threads: Thread[]
}

const projects: Project[] = [
  {
    id: "codex-wrapper",
    name: "codex-wrapper",
    threads: [
      { id: "build-ai-agent-shell", title: "Build AI agent shell", time: "9m" },
    ],
  },
  {
    id: "dci-tender",
    name: "DCI Tender",
    threads: [
      {
        id: "draft-technical-response",
        title: "Draft technical response",
        time: "1h",
      },
    ],
  },
  { id: "moss-web-portal", name: "moss-web-portal", threads: [] },
  { id: "moss-system", name: "moss-system", threads: [] },
  { id: "hand-terminal", name: "hand-terminal", threads: [] },
  { id: "fabit", name: "FabIt", threads: [] },
  { id: "sidekick-ai", name: "sidekick-ai", threads: [] },
  { id: "kigo-ke", name: "kigo_ke", threads: [] },
]

export function listProjects() {
  return projects
}

export function getProject(projectId: string | undefined) {
  return projects.find((item) => item.id === projectId) ?? null
}

export function getThread(
  projectId: string | undefined,
  threadId: string | undefined
) {
  const project = getProject(projectId)
  const thread = project?.threads.find((item) => item.id === threadId)

  if (!project || !thread) {
    return null
  }

  return { project, thread }
}
