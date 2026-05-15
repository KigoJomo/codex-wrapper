/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
	interface ProcessEnv {
		APP_ROOT: string
		VITE_PUBLIC: string
	}
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
	ipcRenderer: import('electron').IpcRenderer
	codex: {
		getStatus: () => Promise<{
			installed: boolean
			version: string | null
			appServerAvailable: boolean
			authenticated: boolean | null
			authMessage: string
			subscription: string | null
			subscriptionPlanType: string | null
			message: string
		}>
		threadsRaw: () => Promise<
			import('./codex-threads').CodexThreadListResult
		>
	}
}
