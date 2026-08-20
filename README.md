# Codex Wrapper

An Electron reader for the Codex work already stored on your machine. It groups threads by project and renders the conversation, tool activity, timings, and file diffs in a desktop UI.

## What works

- Checks whether the local Codex CLI is installed and signed in.
- Reads active threads through `codex app-server`.
- Falls back to local session JSONL when a thread needs more detailed work and diff data.
- Groups threads by working directory and shows their Git branch when available.
- Renders Markdown, syntax-highlighted code, tool calls, and patch diffs.
- Stores appearance, link-opening, and model-display preferences locally.

## Current limit

This is a reader today. The composer, model picker, attachments, voice button, and permission controls are present in the interface, but submitting a message does not start or resume a Codex thread yet.

## Requirements

- Node.js and npm
- A working `codex` command on `PATH`
- A signed-in Codex CLI account

## Development

```bash
npm install
npm run dev
```

The renderer uses React, Vite, and React Router. Electron owns the native window and talks to the Codex app server through a narrow preload bridge.

## Checks and packages

```bash
npm run lint
npm run build
```

`npm run build` runs TypeScript, builds the renderer, and packages the app with electron-builder. The current release workflow publishes a Windows installer from version tags. macOS and Linux targets exist in the builder configuration but are not part of that workflow yet.
