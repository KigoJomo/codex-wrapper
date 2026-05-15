import { useContext } from 'react'

import { CodexStatusContext } from './codex-status-context'

export function useCodexStatus() {
	const context = useContext(CodexStatusContext)

	if (!context) {
		throw new Error('useCodexStatus must be used within a CodexStatusProvider')
	}

	return context
}
