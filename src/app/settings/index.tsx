import { getDefaultModel, listModels } from "@/app/_api/models"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const settings = [
  {
    label: "Require confirmation before high-impact actions",
    description: "Ask before commands that modify files, services, or remote state.",
    enabled: true,
  },
  {
    label: "Show compact thread history",
    description: "Keep the project sidebar dense for repeated daily use.",
    enabled: false,
  },
]

export function SettingsPage() {
  const models = listModels()
  const defaultModel = getDefaultModel()

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-medium tracking-normal">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure local agent preferences for this workspace.
          </p>
        </div>

        <section className="space-y-1">
          <h2 className="text-sm font-medium">Agent</h2>
          <div className="divide-y rounded-lg border bg-card">
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="text-sm">Default model</p>
                <p className="text-sm text-muted-foreground">
                  Used when a new chat starts without a model override.
                </p>
              </div>
              <Select defaultValue={defaultModel.id}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {settings.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Switch defaultChecked={item.enabled} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
