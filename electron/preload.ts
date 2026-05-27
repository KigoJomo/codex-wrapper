import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
	on(...args: Parameters<typeof ipcRenderer.on>) {
		const [channel, listener] = args
		return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
	},
	off(...args: Parameters<typeof ipcRenderer.off>) {
		const [channel, ...omit] = args
		return ipcRenderer.off(channel, ...omit)
	},
	send(...args: Parameters<typeof ipcRenderer.send>) {
		const [channel, ...omit] = args
		return ipcRenderer.send(channel, ...omit)
	},
	invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
		const [channel, ...omit] = args
		return ipcRenderer.invoke(channel, ...omit)
	},
})

contextBridge.exposeInMainWorld('codex', {
	getStatus() {
		return ipcRenderer.invoke('codex:get-status')
	},
	threadsRaw() {
		return ipcRenderer.invoke('codex:threads-raw')
	},
	threadTurns(threadId: string) {
		return ipcRenderer.invoke('codex:thread-turns', threadId)
	},
	threadSession(threadId: string) {
		return ipcRenderer.invoke('codex:thread-session', threadId)
	},
	openExternal(url: string) {
		return ipcRenderer.invoke('codex:open-external', url)
	},
})
