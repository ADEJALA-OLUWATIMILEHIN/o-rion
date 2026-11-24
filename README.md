# O-Rion — Campus Recommerce

Certified pre-owned marketplace for students: verified listings, safe in-app chat, **escrow offers**, and PIN-confirmed handovers at certified safe hubs. Built from the Stitch designs (Discover, Chat & Escrow Offer, Snap & Sell grading).

```
o-rion/
├── backend/    Express 5 + TypeScript (tsx) + Sequelize/Postgres, JWT/bcrypt, Swagger, Multer
└── frontend/   React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + React Router
```

## Quick start

Requires Node 20+ and Postgres.

```bash
createdb orion
cd backend
cp .env.example .env       # set DATABASE_URL / JWT_SECRET
npm install
npm run migrate
npm run seed               # demo users, hubs, listings, a live negotiation
npm run dev                # http://localhost:4000/api  · docs at /api/docs
```

```bash
cd frontend
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:4000/api
npm install
npm run dev                # http://localhost:5173
```

Demo accounts (password `password123`): `ada@live.unilag.edu.ng` (buyer in the seeded chat), `tobi@live.unilag.edu.ng` (seller), `chioma@…`, `femi@gmail.com` (unverified).

## Backend

| Folder | Contents |
| --- | --- |
| `config/` | env loading, Sequelize connection, Swagger spec |
| `models/` | `User`, `Hub`, `Listing`, `Favorite`, `Conversation`, `Message`, `Offer` + associations |
| `route/` | `auth`, `listings`, `favorites`, `hubs`, `conversations`, `offers`, `uploads` (JSDoc → Swagger) |
| `middleware/` | `auth.ts` (JWT `requireAuth`/`optionalAuth`), `validate.ts` (zod), `upload.ts` (Multer), `error.ts` |
| `services/` | business logic: auth, listings + grading/price assessment, favorites, chat, escrow offers |
| `migrations/` | Umzug migrations run with tsx (`npm run migrate`, `npm run migrate:down`) |
| `scripts/` | migration runner and seed |

### Escrow offer lifecycle

1. Buyer opens a conversation on a listing and sends an offer (`POST /conversations/:id/offers`). A new offer replaces any pending one. Offers expire after 18h.
2. Seller **accepts**: the listing becomes `reserved`, other buyers' pending offers on it are declined, and a 4-digit handover PIN is generated. **Only the buyer** can see it.
3. Buyer tests the item at the hub, then gives the PIN to the seller.
4. Seller **completes** with the PIN: the offer becomes `completed`, the listing `sold`, and both users' trade counts go up.
5. Buyer can cancel (refund) while pending or accepted. Seller can decline while pending.

> Escrow is **simulated**: no money moves. To go live, call a payment provider (e.g. Paystack/Flutterwave) from `services/offerService.ts` at create/accept (hold), cancel/decline (refund) and complete (release).

The listing "trust score" and fair-price suggestion (`POST /listings/assess`) are rule-based heuristics in `services/listingService.ts`. They do not run real image or IMEI verification.

## Frontend

| Folder | Contents |
| --- | --- |
| `src/api/` | typed fetch client (reads `VITE_API_BASE_URL`, attaches JWT) + endpoint modules |
| `src/components/` | app shell (floating dock / desktop top bar), listing cards, offer card & dialog, `ui/` shadcn components |
| `src/pages/` | Discover, Listing, Sell (grading), Inbox, Chat, Saved, Profile, Login/Register, Escrow explainer |
| `src/lib/` | auth context, formatting, `cn()` |

Design tokens from `DESIGN.md` (violet `#7C3AED`, plum `#1E1B4B`, lavender `#F5F3FF`, Plus Jakarta Sans, pill buttons, soft violet shadows) live in `src/index.css` as shadcn CSS variables. `components.json` is configured, so `npx shadcn@latest add <component>` works.

Chat refreshes by polling every 4s. Swap in WebSockets/SSE if you need real-time updates.
