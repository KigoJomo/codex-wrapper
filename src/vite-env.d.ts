/// <reference types="vite/client" />

import type * as React from 'react'

declare global {
	namespace JSX {
		interface IntrinsicElements {
			webview: React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					src?: string
					partition?: string
					allowpopups?: boolean
					autosize?: boolean
					minheight?: string
					minwidth?: string
					webpreferences?: string
				},
				HTMLElement
			>
		}
	}
}

export {}
