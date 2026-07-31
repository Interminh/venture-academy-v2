# Venture Academy Tutors

Venture Academy Tutors (VAT) is a club at Interlake High School that
matches K-8 students in the Bellevue School District with volunteer teen
tutors, free of charge. This repo is the club's web app: it replaces an
older static site backed by Google Sheets and Apps Script with a proper
Next.js app on top of Supabase.

The underlying process is the same one the club has always run. What
changed is the plumbing: real accounts instead of a shared password, a
normalized database instead of a spreadsheet, and two things the old
system genuinely couldn't do, cancelling an approved booking and managing
the subject list without editing raw HTML.

**Not connected to a database yet?** See [`SETUP.md`](./SETUP.md) for a
full walkthrough: creating a Supabase project, running the migrations,
and testing the whole parent, tutor, and admin flow locally.

## How it works

1. A parent signs up and adds their student: grade, subjects needed, and
   one weekly availability schedule shared across subjects.
2. Tutors browse students, filterable by grade and subject, open a
   student's schedule, and claim an open time, picking which subject
   they're helping with as part of the claim.
3. The slot shows as pending immediately, so nobody else can claim it.
4. A club director approves or rejects the claim.
5. Approved claims book the slot and let the tutor see the family's email
   so they can reach out. Rejected claims reopen the slot.
6. Either the tutor or a director can cancel an approved booking later.
   The slot reopens and the claim's history is kept, never deleted.

## Roles

**Parent**
Signs up freely, manages their own student's subjects and schedule, and
sees only their own student's status.

**Tutor**
Signs up with a code from a club director instead of a shared password.
Browses open slots, submits claims, and cancels their own bookings.

**Admin**
Club directors. Approve or reject claims, force-cancel any booking,
manage the subject list and tutor sign-up codes, and can promote or
demote any account's role.

## Stack

- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **Database and auth**: Supabase (Postgres, Row Level Security,
  Auth, Realtime)
- **Sign-in**: email and password only, no OAuth and no magic links (see
  `SETUP.md` for the reasoning)

## Project layout

```
app/
  (marketing)/          landing page sections
  dashboard/
    admin/               approvals, ledger, subjects, tutor codes, users
    parent/               student intake, schedule, status
    tutor/                 browse students, claim slots, my claims
  login/, signup/         auth pages
components/
  slots/                  StatusTrack, SlotAgenda, and other schedule UI
  forms/                  intake form and availability picker
  admin/, tutor/, ui/    role-specific and shared components
lib/
  actions/                Server Actions: claims, tutees, subjects, auth, users
  supabase/               Supabase client setup for server, browser, and middleware
  types/database.ts       hand-written types matching the current schema
supabase/
  migrations/             schema, in order, 0001 through 0005
  dev/                    scripts for local development only, not for production
  seed.sql                starter subject list
```

`components/slots/StatusTrack.tsx` is worth a look on its own: it's the
one status indicator (open, pending, booked) reused everywhere a slot's
state shows up, so the whole app reads the same lifecycle the same way.

## Getting started

```bash
npm install
npm run dev
```

The app needs a connected Supabase project to do anything useful beyond
render the login page. Follow [`SETUP.md`](./SETUP.md) for the full setup,
including the schema migrations and how to bootstrap your first admin
account.

## Database

Everything lives in `supabase/migrations/`, applied in numeric order.
Row Level Security is enabled on every table, so access control is
enforced by Postgres itself, not just by what the UI happens to show. A
tutor genuinely cannot query another family's data, even by guessing an
ID.

`lib/types/database.ts` is hand-written to match the migrations so the
app type-checks without a live project connected. Once you've linked a
real project, regenerate it with the Supabase CLI (see `SETUP.md`).

## License

MIT. See [`LICENSE`](./LICENSE).

## Team

Built and maintained by the Venture Academy Tutors club directors at
Interlake High School: Violet Ha, Minh Do, and Saahil Shah.
