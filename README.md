# Venture Academy Tutors

Venture Academy Tutors (VAT) is a *club* at Interlake High School that
matches K-8 students in the Bellevue School District with volunteer teen
tutors, free of charge. This repo is the club's web app. It replaces a
manual OneNote process with accounts, a database, and one place for
directors to approve and manage bookings.

New here? [`SETUP.md`](./SETUP.md) walks through creating a Supabase
project, running the migrations, and testing the full flow locally.

## How it works

1. A parent signs up and adds their student: grade, subjects needed, and
   one weekly availability schedule.
2. Tutors browse students, filter by grade and subject, and claim an open
   time, picking the subject they'll help with.
3. The slot shows as pending right away, so nobody else can claim it.
4. A club director approves or rejects the claim.
5. Approved claims book the slot and show the tutor the family's email.
   Rejected claims reopen it. Parents and tutors get an email when a
   session is booked.
6. A tutor or director can cancel an approved booking later. The slot
   reopens and the claim history is kept.

## Roles

- **Parent:** signs up freely, manages their student's subjects and
  schedule, and sees their student's status.
- **Tutor:** signs up with a code from a director. Browses open slots,
  submits claims, cancels their own bookings, and logs hours.
- **Admin:** club directors. Approve or reject claims, force-cancel any
  booking, manage subjects and tutor codes, change roles, and hide
  accounts or codes without deleting history.

## Stack

- Next.js (App Router) with TypeScript
- Tailwind CSS v4
- Supabase: Postgres, Row Level Security, Auth, Realtime
- Resend for notification emails
- Email and password sign-in only, no OAuth or magic links

## Project layout

```
app/
  (marketing)/          landing page
  dashboard/            admin, parent, and tutor pages
  login/, signup/       auth pages
components/             slots, forms, admin, tutor, and shared UI
lib/
  actions/              Server Actions
  email/                notification emails
  supabase/             client setup for server, browser, and middleware
  types/database.ts     types matching the schema
supabase/
  migrations/           schema, in order
  dev/                  local dev scripts, not for production
  seed.sql              starter subject list
tests/                  Playwright suite and helpers
scripts/backup-db.mjs   snapshots every table to a local JSON file
```

[`TEST_SCENARIOS.md`](./TEST_SCENARIOS.md) lists the test surface and
results.

`components/slots/StatusTrack.tsx` is the single open, pending, booked
indicator used everywhere a slot's state shows.

## Getting started

```bash
npm install
npm run dev
```

The app needs a Supabase project to do more than render the login page.
See [`SETUP.md`](./SETUP.md).

## Database

The schema lives in `supabase/migrations/`, applied in numeric order. Row
Level Security is on for every table, so Postgres enforces access, not
just the UI. A tutor can't query another family's data, even by guessing
an ID.

`lib/types/database.ts` is hand-written to match the migrations. Once a
project is linked, regenerate it with the Supabase CLI (see `SETUP.md`).

**Backups.** `node scripts/backup-db.mjs` snapshots every table and
account through the Supabase API with the service-role key. It writes a
timestamped JSON file to `backups/`, which is gitignored because it holds
real user data.

## Testing

`tests/e2e/` is a Playwright suite that runs against a real Supabase
project: real signups, claims, and admin actions, plus direct API calls
that check RLS boundaries the UI never exposes.

```bash
cp .env.test.example .env.test   # add your project's URL, anon key, and service-role key
npx playwright install chromium
npx playwright test
```

The suite creates `@example.com` test accounts and removes them with
`tests/support/cleanup.mjs`. Don't point it at a database with real users
you care about without running that cleanup.

## Rate limits

- **Supabase Auth** throttles signup, login, and password reset itself.
  Check Authentication > Rate Limits in the dashboard for the current
  numbers.
- **This app adds none.** No Server Action throttles repeated logins,
  claims, or form submissions. That's fine at club scale, but a script
  could hammer signup, reset, or claim endpoints with only Supabase's
  limits in the way.
- **Free-tier Supabase** pauses after about a week without API activity.
  Resume it from the dashboard. It also caps monthly users, database size,
  and bandwidth.
- **Email** has its own provider limits. Notification emails go through
  Resend, so check your plan's sending limits.

## Security

- **RLS on every table.** Postgres enforces access. A demoted admin loses
  access on their next request.
- **Role is never trusted from the client.** Server Actions re-check the
  caller, and RLS checks again at the database.
- **Role changes are blocked in the database.** A trigger on `profiles`
  rejects role updates unless the caller is an admin, so calling the
  Supabase API directly doesn't bypass it.
- **Tutor codes stay private.** Signup validates a code through a
  security-definer function, so unauthenticated callers can't read the
  codes table or count the codes.
- **Passwords are hashed by Supabase.** Nobody can look one up.
- **Password reset is enumeration-safe.** The same message shows whether
  or not the email has an account. Signup does say when an email is
  taken, so real users aren't told to check an inbox that never gets
  mail.
- **Secrets stay out of the repo.** `.env.local` is gitignored and the
  service-role key is only read server-side.
- **Errors don't leak internals.** Next.js redacts production errors, and
  `app/error.tsx` and `app/global-error.tsx` show a plain message instead
  of a stack trace.

### Known gaps

- **No multi-factor authentication**, including for admins.
- **No application-level rate limiting.**
- **No audit trail for some admin actions.** Claims and soft-deleted
  students keep full history. Subject renames, tutor code toggles, and
  role changes don't record who did them.

## License

MIT. See [`LICENSE`](./LICENSE).

## Team

Built and maintained by the Venture Academy Tutors club director and tech
lead at Interlake High School: Minh Do
