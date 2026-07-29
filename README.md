# Venture Academy Tutors (VAT) — v2

Venture Academy Tutors is a club at Interlake High School matching K-8
tutees in the Bellevue School District with volunteer teen tutors. This is
a from-scratch rebuild of the club's old static site + Google Sheets/Apps
Script workflow, on Next.js + Supabase — same underlying process, real
accounts, a proper database, and two gaps in the old system fixed
(cancelling an approved booking, and managing the subject list without
editing HTML).

**Not connected to a database yet.** See [`SETUP.md`](./SETUP.md) for the
full walkthrough — creating a Supabase project, running the migration, and
testing the whole parent → tutor → admin flow locally.

## How it works

1. A parent signs up and adds their student — grade, subjects, weekly
   availability.
2. Tutors browse open slots across all students and submit a claim on one.
3. The slot immediately shows as "Pending" so no one else claims it.
4. An admin (club director) approves or rejects the claim.
5. **Approved** → the slot is "Booked," and the tutor can see the family's
   email to reach out. **Rejected** → the slot reopens.
6. Either the tutor or an admin can cancel an approved booking later,
   reopening the slot — the claim's history is kept, never deleted.

## Roles

- **Parent** — self-signup, manages their own student(s) only.
- **Tutor** — individual login (no shared password), browses/claims slots,
  cancels their own bookings.
- **Admin** — club directors; approves/rejects claims, force-cancels any
  booking, manages the subjects list, invites tutor/admin accounts.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS v4
- **Backend**: Supabase (Postgres, Row Level Security, Auth, Realtime)
- **Auth**: email + password only — no OAuth, no magic link (see
  `SETUP.md` for why)

## Project layout

- `supabase/migrations/0001_init.sql` — full schema: enums, tables, RLS
  policies, derived-status views, the new-user trigger
- `app/` — public landing page + role-gated `/dashboard/{admin,tutor,parent}`
- `components/slots/StatusTrack.tsx` — the one recurring status indicator
  (Open → Pending → Booked) used everywhere a slot's status appears
- `lib/actions/` — all Server Actions (claims, tutees, subjects, users, auth)
- `lib/types/database.ts` — hand-written to match the migration; regenerate
  with `supabase gen types typescript` once a real project is linked

## Development

```bash
npm install
npm run dev
```

Requires a connected Supabase project first — see `SETUP.md`.
