# Splitty

Split shared expenses with friends, fast and fair.

Splitty lets you create a group, invite members via a shareable link, log who paid for what, and see the minimum set of payments needed to settle up.

## Stack

- **Frontend**: React 18 + Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API routes (Node.js)
- **Database**: PostgreSQL via Prisma
- **Hosting**: Vercel

## Project structure

```
src/
├── app/                     # Next.js App Router pages + API routes
│   ├── page.tsx             # Home / create group
│   ├── g/[id]/              # Group pages
│   │   ├── page.tsx           - Overview (settlement + expenses + balances)
│   │   ├── add/page.tsx       - Add expense
│   │   ├── edit/page.tsx      - Edit group
│   │   └── created/page.tsx   - Post-creation share screen
│   └── api/groups/...       # REST endpoints
├── components/              # React components (client + server)
└── lib/
    ├── settlement.ts        # Greedy debtor/creditor matching (port of main.py)
    ├── balance.ts           # Net-balance computation per member
    ├── currency.ts
    ├── id.ts                # Short, URL-safe group IDs
    └── db.ts                # Prisma client singleton
prisma/
└── schema.prisma
docker/
└── entrypoint.sh            # runs `prisma db push` then starts the server
Dockerfile                   # multi-stage build → standalone Next.js image
docker-compose.yml           # full stack: app + Postgres
docker-compose.dev.yml       # Postgres only (for `make dev` on the host)
Makefile                     # `make help` for the full list
```

## Quick start

The project ships with a `Makefile` that wraps the most common workflows. Run `make help` to see all targets.

### Option A — fully containerized (one command)

```bash
make up
```

This builds the app image, starts a Postgres 16 container and the Splitty app, syncs the Prisma schema on boot, and exposes the app at http://localhost:3000.

Other handy targets:

| Command       | What it does                                      |
| ------------- | ------------------------------------------------- |
| `make logs`   | Tail the app container's logs                     |
| `make ps`     | Show container status                             |
| `make stop`   | Stop the stack (volumes kept)                     |
| `make down`   | Stop & remove containers (volumes kept)           |
| `make nuke`   | Stop & remove containers **and** the DB volume    |
| `make shell`  | Open a shell inside the running app container     |

### Option B — Next.js on the host, Postgres in Docker (best DX)

```bash
make install   # npm install
make db        # start Postgres in Docker (detached)
make db-push   # sync Prisma schema
make dev       # run Next.js dev server with hot reload
```

Then visit http://localhost:3000. Stop the database with `make db-stop` or wipe it with `make db-reset`.

### Option C — bring your own Postgres

```bash
npm install
cp .env.example .env   # edit DATABASE_URL
npm run db:push
npm run dev
```

Hosted Postgres options that work out of the box: [Neon](https://neon.tech), [Supabase](https://supabase.com), Vercel Postgres.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Add a Postgres database — easiest is Vercel Postgres (or Neon). Copy the **pooled** connection string into the project's `DATABASE_URL` environment variable.
4. Set `NEXT_PUBLIC_SITE_URL` to your deployed URL (e.g. `https://splitty.vercel.app`).
5. Deploy. The `postinstall` script runs `prisma generate`, and `npm run build` runs `prisma generate && next build`.
6. After the first deploy, push the schema once:
   ```bash
   DATABASE_URL="..." npx prisma db push
   ```

## How the settlement works

`src/lib/settlement.ts` is a TypeScript port of the original Python algorithm:

1. Compute each member's **net balance** = (amount they paid) − (amount they consumed in shares).
2. Repeatedly match the **largest creditor** with the **largest debtor**, transferring the smaller of the two.
3. Stop when everyone is at zero.

This produces at most `n − 1` transfers for `n` members.

## API

All routes are JSON.

- `POST /api/groups` — create a group. Body: `{ name, currency, members: string[] }`.
- `GET /api/groups/:id` — full group data.
- `PATCH /api/groups/:id` — rename and add/remove members.
- `POST /api/groups/:id/expenses` — add an expense. Shares must sum to the total.
- `DELETE /api/groups/:id/expenses/:expenseId` — delete an expense.
- `GET /api/groups/:id/csv` — download all expenses as CSV.

## License

MIT.
