import { useState } from 'react'

import {
	getLinkOpenMode,
	setLinkOpenMode,
	type LinkOpenMode,
} from '@/app/_api/preferences'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

export function AppearanceSettings() {
	const [linkOpenMode, setLinkOpenModeState] = useState<LinkOpenMode>(() =>
		getLinkOpenMode()
	)

	function handleLinkOpenModeChange(value: LinkOpenMode) {
		setLinkOpenMode(value)
		setLinkOpenModeState(value)
	}

	return (
		<>
			<section className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<h2>Appearance</h2>
					<p className="text-muted-foreground">
						Control how the interface behaves while reading and browsing.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Links</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between gap-4">
							<div className="flex flex-col gap-1">
								<p className="text-sm font-medium">Open links in</p>
								<p className="text-sm text-muted-foreground">
									System browser is the default. In-app opens a browser pane beside
									the thread.
								</p>
							</div>

							<Select
								value={linkOpenMode}
								onValueChange={(value) =>
									handleLinkOpenModeChange(value as LinkOpenMode)
								}
							>
								<SelectTrigger className="w-44">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="system">System browser</SelectItem>
									<SelectItem value="in-app">In-app pane</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>
			</section>
		</>
	)
}
