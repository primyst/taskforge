# TaskForge

**AI-assisted project management platform** — describe a goal, get a structured task board back.

Built as a portfolio project to demonstrate full-stack engineering with real authentication, authorization, and AI integration — not a tutorial clone.

## Live demo

[taskforgeai.vercel.app]

## Features

- **Authentication** — email/password (bcrypt-hashed) and Google OAuth via Auth.js v5
- **Teams** — create teams, invite members by email, role-based membership (Owner / Admin / Member)
- **Projects & Tasks** — kanban board (To do / In progress / In review / Done), priority levels, assignees, due dates
- **AI task generation** — describe a goal in plain language, Groq (Llama 3.3 70B) breaks it into 3–8 structured tasks
- **Comments** — threaded discussion per task, with email + in-app notifications
- **File attachments** — direct-to-storage uploads via UploadThing, validated server-side
- **Notifications** — in-app bell + email (Nodemailer/Gmail SMTP) for assignments, comments, and invites
- **Role-based access control** — every API route enforces team membership and role permissions server-side; nothing relies on the client to behave

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | Auth.js v5 (NextAuth) |
| AI | Groq API |
| File storage | UploadThing |
| Email | Nodemailer (Gmail SMTP) |
| Validation | Zod |
| Deployment | Vercel |

## Architecture decisions worth mentioning

- **RBAC is enforced server-side on every route**, not just hidden in the UI. A set of shared helpers (`requireTeamMember`, `requireRole`, `requireProjectAccess`, `requireTaskAccess`) resolve any resource back to its team and check membership/role before any data is read or written — this closes the classic IDOR gap where a client edits a URL to touch someone else's data.
- **AI output is never trusted directly.** The Groq response is parsed, validated against a Zod schema, and capped at 10 tasks regardless of what the model returns, before anything touches the database.
- **File uploads are validated twice** — once via UploadThing's own type/size config, and the attachment record is only written from the server-side `onUploadComplete` callback, never from client-reported metadata.
- **Auth config is split** between an Edge-safe `auth.config.ts` (used by middleware) and the full `auth.ts` (Prisma + bcrypt, Node runtime only) — this keeps the Edge middleware bundle small and avoids shipping database drivers to the edge network.

## Local setup

\`\`\`bash
git clone https://github.com/primyst/taskforge.git
cd taskforge
npm install
cp .env.example .env.local   # fill in real values, see below
npx prisma generate
npx prisma db push
npm run dev
\`\`\`

### Environment variables

See `.env.example` for the full list. You'll need:
- A Postgres connection string (free tier: [Neon](https://neon.tech))
- An `AUTH_SECRET` (`openssl rand -base64 32`)
- Google OAuth credentials (optional — credentials login works without it)
- A Groq API key ([console.groq.com](https://console.groq.com), free)
- Gmail SMTP credentials for a dedicated sending account (App Password required)
- An UploadThing token (V7 format, from [uploadthing.com](https://uploadthing.com))

## Roadmap / known limitations

- Team invites currently require the invited person to already have a TaskForge account — a pending-invite system (token + email signup link) would remove this restriction
- No drag-and-drop on the kanban board yet — status changes via dropdown
- Deleting an attachment removes the database record but not yet the underlying file from UploadThing's storage

## Author

Built by [Abdullateef Abdulqudus Akinwumi](https://abdulqudus.vercel.app) — [GitHub](https://github.com/primyst)