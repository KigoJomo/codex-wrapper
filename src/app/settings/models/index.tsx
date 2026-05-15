import { useCodexStatus } from '@/app/_components/use-codex-status'
import { OpenAILogo } from '@/assets/openai-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ModelSettings() {
	const { loading, status, refresh } = useCodexStatus()
	const isReady =
		status?.installed && status.appServerAvailable && status.authenticated
	const hasWarning = status && !isReady

	return (
		<>
			<section className="flex flex-col gap-12">
				<div className="flex flex-col gap-2">
					<h2>Models</h2>
					<p className="text-muted-foreground">
						Manage your AI model settings and preferences.
					</p>
				</div>

				<Card className="pb-0">
					<CardHeader>
						<CardTitle>Providers</CardTitle>
					</CardHeader>
					<CardContent className="px-0">
						<div className="flex w-full items-start justify-between gap-4 border-t px-6 py-4">
							<div className="flex-1 flex flex-col gap-2">
								<div className="provider-name flex items-center gap-2">
									<OpenAILogo className="*:fill-muted-foreground" />
									<span>Codex</span>
								</div>

								<div className="max-w-lg grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
									<div>
										<p className="text-xs">CLI</p>
										<p className="text-foreground text-xs">
											{status?.installed ? 'Installed' : 'Not found'}
										</p>
									</div>
									<div>
										<p className="text-xs">Version</p>
										<p className="text-foreground text-xs">
											{status?.version ?? '-'}
										</p>
									</div>
									<div>
										<p className="text-xs">App Server</p>
										<p className="text-foreground text-xs">
											{status?.appServerAvailable ? 'Available' : 'Unavailable'}
										</p>
									</div>
									<div className="sm:col-span-3">
										<p className="text-xs">Login</p>
										<p className="text-foreground text-xs">
											{status?.authMessage ?? 'Checking login status...'}
										</p>
									</div>
									<div className="sm:col-span-3">
										<p className="text-xs">Subscription</p>
										<p className="text-foreground text-xs">
											{status?.subscription ??
												status?.subscriptionPlanType ??
												'-'}
										</p>
									</div>
								</div>
							</div>

							<div className="status flex shrink-0 items-center gap-2">
								{loading && (
									<Badge
										variant="outline"
										className="border-amber-500 bg-amber-500/10">
										<div className="size-2 rounded-full bg-amber-500" />
										<span>Checking status...</span>
									</Badge>
								)}
								{!loading && isReady && (
									<Badge
										variant="outline"
										className="border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
										<div className="size-2 rounded-full bg-emerald-500" />
										<span>Ready</span>
									</Badge>
								)}
								{!loading && hasWarning && (
									<Badge
										variant="outline"
										className="border-destructive bg-destructive/10 text-destructive">
										<div className="size-2 rounded-full bg-destructive" />
										<span>Needs attention</span>
									</Badge>
								)}
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={loading}
									onClick={() => void refresh()}>
									Refresh
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</section>
		</>
	)
}
