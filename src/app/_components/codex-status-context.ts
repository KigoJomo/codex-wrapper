import { createContext } from 'react'

import type { CodexStatus } from 'electron/codex-status'

export type CodexStatusContextValue = {
	status: CodexStatus | null
	loading: boolean
	refresh: () => Promise<void>
}

export const CodexStatusContext =
	createContext<CodexStatusContextValue | null>(null)
