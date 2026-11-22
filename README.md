# Trip It

Full-stack app: **React 19** client (Vite + TypeScript + Tailwind v4 + shadcn) and **Node.js / Express 5** server (TypeScript + Prisma 7 + PostgreSQL). Structure follows the sheba project conventions.

```
trip it/
├── client/   # React + Vite frontend (feature-based: src/features/<name>/{api,hooks,pages,...})
└── server/   # Express + TS backend (src/modules/<name>/<name>.{routes,controller,service,repository,schema}.ts)
```

## Prerequisites
- Node.js 22+
- PostgreSQL running on `localhost:5432`

## Server
```bash
cd server
npm install
cp .env.example .env          # set DATABASE_URL password + JWT_SECRET
createdb -U postgres trip_it   # or create it via pgAdmin
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed                # admin@tripit.local / Admin1234!
npm run dev                    # http://localhost:4000
```

API: `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` (JWT in an httpOnly cookie).

## Client
```bash
cd client
npm install
npm run dev                    # http://localhost:5174 (proxies /api → :4000)
```

Hebrew (RTL, default) and English are supported — toggle from the header. Translations live in `client/src/locales/{he,en}`.
