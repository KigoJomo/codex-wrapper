import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

export const APP_SERVER_TIMEOUT_MS = 5000

export type RpcSuccess = {
	id: number
	result?: unknown
}

export type RpcFailure = {
	id: number
	error?: {
		message?: string
	}
}

type PendingRequest = (message: RpcSuccess | RpcFailure) => void

export type AppServerRequest = <Result>(
	method: string,
	params: unknown
) => Promise<Result>

export type AppServerInitializeResult = {
	userAgent?: string
}

function getCodexEnvironment() {
	const paths = (process.env.PATH ?? '')
		.split(path.delimiter)
		.filter((item) => item.length > 0)

	if (process.platform === 'win32') {
		const appData = process.env.APPDATA
		const localAppData = process.env.LOCALAPPDATA
		const home = os.homedir()

		if (appData) {
			paths.push(path.join(appData, 'npm'))
		}

		if (localAppData) {
			paths.push(path.join(localAppData, 'Programs', 'npm'))
		}

		paths.push(path.join(home, 'AppData', 'Roaming', 'npm'))
	}

	return {
		...process.env,
		PATH: Array.from(new Set(paths)).join(path.delimiter),
	}
}

function request<Result>(
	pending: Map<number, PendingRequest>,
	stdin: NodeJS.WritableStream,
	id: number,
	method: string,
	params: unknown
) {
	return new Promise<Result>((resolve, reject) => {
		pending.set(id, (message) => {
			if ('error' in message && message.error) {
				reject(new Error(message.error.message ?? `${method} failed`))
				return
			}

			resolve((message as RpcSuccess).result as Result)
		})

		stdin.write(`${JSON.stringify({ id, method, params })}\n`)
	})
}

function withTimeout<Result>(work: Promise<Result>, message: string) {
	const timeout = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new Error(message)), APP_SERVER_TIMEOUT_MS)
	})

	return Promise.race([work, timeout])
}

export async function withCodexAppServer<Result>(
	callback: (
		request: AppServerRequest,
		initialize: AppServerInitializeResult
	) => Promise<Result>
) {
	return withTimeout(
		runCodexAppServer(callback),
		'Timed out while communicating with Codex app-server.'
	)
}

async function runCodexAppServer<Result>(
	callback: (
		request: AppServerRequest,
		initialize: AppServerInitializeResult
	) => Promise<Result>
) {
	const child = spawn('codex', ['app-server'], {
		cwd: process.cwd(),
		env: getCodexEnvironment(),
		shell: process.platform === 'win32',
		windowsHide: true,
	})
	const pending = new Map<number, PendingRequest>()
	let nextId = 1
	let stdoutBuffer = ''

	child.stdout.setEncoding('utf8')
	child.stderr.resume()

	child.stdout.on('data', (chunk: string) => {
		stdoutBuffer += chunk
		const lines = stdoutBuffer.split(/\r?\n/)
		stdoutBuffer = lines.pop() ?? ''

		for (const line of lines) {
			if (!line.trim()) {
				continue
			}

			const message = JSON.parse(line) as RpcSuccess | RpcFailure

			if (typeof message.id !== 'number') {
				continue
			}

			const resolve = pending.get(message.id)
			pending.delete(message.id)
			resolve?.(message)
		}
	})

	const call: AppServerRequest = (method, params) =>
		request(pending, child.stdin, nextId++, method, params)

	try {
		const initialize = await call<AppServerInitializeResult>('initialize', {
			clientInfo: {
				name: 'codex_wrapper',
				title: 'Codex Wrapper',
				version: '0.0.0',
			},
			capabilities: {
				experimentalApi: true,
			},
		})

		child.stdin.write(`${JSON.stringify({ method: 'initialized' })}\n`)

		return await callback(call, initialize)
	} finally {
		child.kill()
	}
}
