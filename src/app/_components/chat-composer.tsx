import { useState } from "react"

import {
  IconChevronDown as ChevronDown,
  IconEyeCheck as EyeCheck,
  IconHandStop as HandStop,
  IconMicrophone as Mic,
  IconPaperclip as Paperclip,
  IconSend as Send,
  IconSettings as Settings,
  IconShieldCheck as ShieldCheck,
} from "@/components/icons"

import { getDefaultModel, listModels } from "@/app/_api/models"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type ChatComposerProps = {
  className?: string
}

const permissions = [
  {
    value: "default",
    label: "Default permissions",
    icon: HandStop,
  },
  {
    value: "auto-review",
    label: "Auto-review",
    icon: EyeCheck,
  },
  {
    value: "full-access",
    label: "Full access",
    icon: ShieldCheck,
  },
  {
    value: "custom",
    label: "Custom (config.toml)",
    icon: Settings,
  },
] as const

type PermissionValue = (typeof permissions)[number]["value"]

export function ChatComposer({ className }: ChatComposerProps) {
  const models = listModels()
  const selectedModel = getDefaultModel()
  const [permissionValue, setPermissionValue] =
    useState<PermissionValue>("full-access")
  const selectedPermission =
    permissions.find((permission) => permission.value === permissionValue) ??
    permissions[0]
  const SelectedPermissionIcon = selectedPermission.icon

  return (
    <div
      className={cn(
        "w-full max-w-3xl rounded-2xl border border-border/80 bg-card/95 p-1 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.45)] transition-colors focus-within:border-primary/45 focus-within:ring-4 focus-within:ring-primary/10 dark:bg-card/90",
        className
      )}
    >
      <div className="overflow-hidden rounded-[calc(var(--radius-2xl)-0.25rem)] bg-background/65 dark:bg-background/35">
        <Textarea
          aria-label="Message"
          placeholder="Ask Codex anything. @ to use plugins or mention files"
          className="max-h-56 min-h-28 resize-none rounded-none border-0 bg-transparent px-4 pt-4 pb-3 text-[0.95rem] leading-6 shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
        />

        <div className="flex flex-col gap-2 border-t border-border/70 bg-muted/30 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Attach context"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Paperclip />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach context</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 px-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 aria-expanded:bg-orange-500/10 dark:text-orange-400 dark:hover:text-orange-300"
                >
                  <SelectedPermissionIcon className="size-3.5" />
                  <span>{selectedPermission.label}</span>
                  <ChevronDown className="size-3.5 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 p-1.5">
                <DropdownMenuLabel className="sr-only">
                  Permission mode
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={permissionValue}
                  onValueChange={(value) =>
                    setPermissionValue(value as PermissionValue)
                  }
                >
                  {permissions.map((permission) => {
                    const PermissionIcon = permission.icon

                    return (
                      <DropdownMenuRadioItem
                        key={permission.value}
                        value={permission.value}
                        className="gap-2 py-1.5 pr-7 text-xs font-semibold"
                      >
                        <PermissionIcon className="size-3.5 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">
                          {permission.label}
                        </span>
                      </DropdownMenuRadioItem>
                    )
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-w-0 max-w-44 justify-start text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className="truncate">
                    {selectedModel.shortName} {selectedModel.defaultReasoning}
                  </span>
                  <ChevronDown className="size-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Models</DropdownMenuLabel>
                {models.map((model) => (
                  <DropdownMenuItem key={model.id}>
                    <span className="min-w-0 flex-1 truncate">
                      {model.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {model.defaultReasoning}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Voice input"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Mic />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voice input</TooltipContent>
            </Tooltip>

            <Button
              size="icon"
              aria-label="Send message"
              className="shadow-sm shadow-primary/20"
            >
              <Send />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
