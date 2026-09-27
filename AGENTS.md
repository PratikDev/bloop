# Repository Guidelines

## Build, Test, and Development Commands

Use the package scripts in `package.json`:

- `bun install` installs dependencies from `bun.lock`.
- `bun run dev` starts the local Next.js dev server.
- `bun run build` creates a production build.
- `bun run start` serves the production build after `build`.
- `bun run shadd <component>` adds shadcn components through `bunx --bun shadcn@latest add`.
- `bun run lint` runs ESLint with Next.js core web vitals and TypeScript rules.

## Coding Style & Naming Conventions

Write TypeScript and TSX with strict compiler settings. Use the `@/*` path alias for repo-root imports. Try to avoid `any` or `unknown` types as much as possible. Keep **EVERYTHING** type-safe. Components use PascalCase filenames and exports, for example `ThemePanel.tsx`; hooks use `use-*` naming, for example `use-mobile.ts`; utility modules use short lowercase names such as `lib.ts` or `audio.ts`. Keep route UI in `app/` and reusable UI or business presentation in `components/`. Prefer server components by default; add `"use client"` only for browser state, effects, or event handlers. Before changing Next.js APIs, read the relevant installed guide in `node_modules/next/dist/docs/`. Never make a single file too long. Do code splitting with easily manageable/understandable file structure. always follow DRY strategy for everything. Whether it's a type/interface declaration or even a simple utility function. Never write same logic in multiple places. and keep everything easily extensible. If any css color is needs to be used that isn't available in `globals.css` already, never use tailwind arbitrary values. always declare them as variables in `globals.css` and use those variables in the classnames. For any frontend related task, use shadcn/ui components as much as possible. When asked to move a component's logic to a custom hook, determine if this hook is component-specific or will be reused across multiple components. For component-specific hooks, move the component jsx to it's own directory first and then place the custom hook inside that directory. So `components/Example.tsx` should become `components/Example/index.tsx` and the path for the custom hook should be `components/Example/use-custom-hook.ts`. For reusuable hooks, place it in `hooks/` directory.


## Testing Guidelines

No automated test framework is currently configured. For now, validate changes with `bun run lint` and, for UI behavior, a local `bun run dev` smoke test. When adding tests, colocate them near the code as `*.test.ts` or `*.test.tsx`, and add a matching `test` script to `package.json`.

## Commit & Pull Request Guidelines

Keep commits atomic: commit only the files you touched and list each path explicitly. For tracked files run `git commit -m "<scoped message>" -- path/to/file1 path/to/file2`. For brand-new files, use the one-liner `git restore --staged :/ && git add "path/to/file1" "path/to/file2" && git commit -m "<scoped message>" -- path/to/file1 path/to/file2`. Always check the changed files by `git status` before committing. Never commit files from the thread context. Never change any file content before committing. PRs should explain user-visible impact, list schema or config changes, and link related issues. Pull requests should include a short summary, validation steps, and linked issues when relevant. Note any schema, environment, or migration impact explicitly. Do not commit any changes unless you're asked to.

## Security & Configuration Tips

Do not commit secrets or local environment files. Keep generated output such as `.next/`, `out/`, and `build/` out of source control. Treat `lib/mock-data.ts` as development data unless a backend integration explicitly replaces it. Do not move from one phase/task to another unless i ask you to specifically.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
