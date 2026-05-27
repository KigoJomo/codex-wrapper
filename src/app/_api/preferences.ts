export const LINK_OPEN_MODE_KEY = 'codex-wrapper-link-open-mode'

export type LinkOpenMode = 'system' | 'in-app'

export function getLinkOpenMode() {
	const stored = window.localStorage.getItem(LINK_OPEN_MODE_KEY)
	return stored === 'in-app' ? stored : 'system'
}

export function setLinkOpenMode(value: LinkOpenMode) {
	window.localStorage.setItem(LINK_OPEN_MODE_KEY, value)
}
