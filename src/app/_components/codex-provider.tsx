import type { CodexStatus } from 'electron/codex-status'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { CodexStatusContext } from './codex-status-context'

export function CodexStatusProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<CodexStatus | null>(null)
	const [loading, setLoading] = useState(true)

	async function refresh() {
		setLoading(true)

		try {
			const nextStatus = await window.codex.getStatus()
			setStatus(nextStatus)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void refresh()
	}, [])

	return (
		<CodexStatusContext.Provider value={{ status, loading, refresh }}>
			{children}
		</CodexStatusContext.Provider>
	)
}
