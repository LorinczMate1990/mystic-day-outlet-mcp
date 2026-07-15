# Project Overview

An MCP (Model Context Protocol) server that gives an AI agent semi-automatic tools to help manage a webshop.

**Core principle:** the AI agent may only *prepare* actions. Any non-recoverable operation (issuing an invoice,
sending a reply e-mail, refunding a payment, etc.) must be explicitly enabled/confirmed by a human operator before
it executes. Tools that perform such operations must be split into a "prepare" step (agent-callable) and an
"execute" step (gated behind human approval) — never a single tool that does both.

## Tech Stack

- **Backend** (`mcpservice/`): NestJS + TypeScript. Hosts the MCP server and the webshop management logic.
- **Frontend** (`frontend/`): React + TypeScript (Vite). Operator-facing UI, used to review and approve/reject
  actions the agent has prepared.
- Both projects are independent TypeScript apps, no shared package/monorepo tooling.

## Project Structure

```
.
├── mcpservice/               NestJS app (MCP server + webshop logic)
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   └── app.service.ts
│   ├── Dockerfile            production image (multi-stage build)
│   ├── Dockerfile.dev         dev image (live reload via `start:dev`)
│   └── test/
├── frontend/                 React (Vite) operator UI
│   └── src/
│       ├── main.tsx
│       └── App.tsx
├── docker-compose.yml         prod stack: mcpservice + frontend
├── docker-compose.dev.yml     dev override: mcpservice only, live-reload volume mount, frontend disabled (replicas: 0)
└── CLAUDE.md
```

## Running the project

- **Prod**: `docker compose -f docker-compose.yml up`
- **Dev**: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`
  - Only the backend (`mcpservice`) runs in a container (bind-mounted for live reload).
  - The frontend is intentionally not started here — run it separately with `cd frontend && npm run dev`.
- Backend is reachable on host port `7000`, frontend (prod only) on `7001`.

## Design guidelines for new tools

- Prefer NestJS modules per webshop domain area (orders, invoicing, e-mail, inventory, etc.).
- Any MCP tool that causes a real-world, non-recoverable side effect must not execute directly — it should create
  a pending action that a human approves via the frontend before the actual side effect runs.
- Read-only / reversible tools (e.g. looking up an order, drafting an e-mail, calculating a price) can run freely
  without human confirmation.
- Whenever a new tool is registered on the MCP server (`mcpservice/src/mcp/mcp-server.factory.ts`), update the
  server's `instructions` string (passed to `new McpServer(...)`) to mention it by name. The `instructions` field
  is what tells the agent to prefer this server's tools over generic/external ones for this domain — an outdated
  `instructions` string means new tools silently go unused.
