import { withCodexAppServer } from './codex-app-server'

export type CodexStatus = {
	installed: boolean
	version: string | null
	appServerAvailable: boolean
	authenticated: boolean | null
	authMessage: string
	subscription: string | null
	subscriptionPlanType: string | null
	message: string
}

type AccountReadResult = {
	account?: {
		type?: string
		email?: string
		planType?: string
	} | null
	requiresOpenaiAuth?: boolean
}

function formatPlanType(planType: string | undefined) {
	switch (planType) {
		case 'free':
			return 'ChatGPT Free'
		case 'go':
			return 'ChatGPT Go'
		case 'plus':
			return 'ChatGPT Plus'
		case 'pro':
			return 'ChatGPT Pro'
		case 'prolite':
			return 'ChatGPT Pro'
		case 'team':
			return 'ChatGPT Team'
		case 'business':
		case 'self_serve_business_usage_based':
			return 'ChatGPT Business'
		case 'enterprise':
		case 'enterprise_cbp_usage_based':
			return 'ChatGPT Enterprise'
		case 'edu':
			return 'ChatGPT Edu'
		case 'unknown':
			return 'ChatGPT Subscription'
		default:
			return undefined
	}
}

function extractVersion(userAgent: string | undefined) {
	return userAgent?.match(/\/([^\s]+)/)?.[1] ?? null
}

function formatAuthMessage(account: AccountReadResult['account']) {
	if (!account) {
		return 'Not logged in.'
	}

	if (account.type === 'chatgpt') {
		return account.email
			? `Logged in using ChatGPT (${account.email})`
			: 'Logged in using ChatGPT'
	}

	if (account.type === 'apiKey') {
		return 'Logged in using an OpenAI API key'
	}

	return `Logged in using ${account.type ?? 'Codex'}`
}

export async function probeCodexAppServer() {
	return withCodexAppServer(async (request, initialize) => {
		const account = await request<AccountReadResult>('account/read', {})

		return {
			version: extractVersion(initialize.userAgent),
			account,
		}
	})
}

export async function getCodexStatus(): Promise<CodexStatus> {
	try {
		const { version, account } = await probeCodexAppServer()
		const authenticated = Boolean(account.account)
		const authMessage = formatAuthMessage(account.account)
		const subscriptionPlanType = account.account?.planType ?? null
		const subscription = formatPlanType(subscriptionPlanType ?? undefined) ?? null

		return {
			installed: true,
			version,
			appServerAvailable: true,
			authenticated,
			authMessage,
			subscription,
			subscriptionPlanType,
			message:
				authenticated || !account.requiresOpenaiAuth
					? 'Codex is ready.'
					: 'Codex CLI is not authenticated.',
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)

		return {
			installed: false,
			version: null,
			appServerAvailable: false,
			authenticated: null,
			authMessage: 'Codex CLI is unavailable.',
			subscription: null,
			subscriptionPlanType: null,
			message: message.includes('ENOENT')
				? 'Codex CLI was not found on PATH.'
				: message,
		}
	}
}
