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
manage the subject list and tutor sign-up codes, promote or demote any
account's role, and remove accounts or retired tutor codes from view
without deleting their history.

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
  migrations/             schema, in order, 0001 onward
  dev/                    scripts for local development only, not for production
  seed.sql                starter subject list
tests/
  e2e/                    Playwright suite: auth, claims, admin, RLS
  support/                shared test helpers and the test-data cleanup script
scripts/
  backup-db.mjs           snapshots every table to a local JSON file
```

See [`TEST_SCENARIOS.md`](./TEST_SCENARIOS.md) for the full test surface
and the results of the last full pass.

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

**Backups.** `scripts/backup-db.mjs` snapshots every table, plus every
account, straight through the Supabase API using the service-role key, so
it needs no database password. Run it with `node scripts/backup-db.mjs`;
it writes a timestamped JSON file to `backups/` (gitignored, since it
holds real user data).

## Testing

`tests/e2e/` is a Playwright suite that drives the real app, real signups,
real claims, real admin actions, plus a few tests that call the Supabase
API directly to check Row Level Security boundaries the UI never exposes.
It's meant to run against an actual Supabase project, not mocks.

```bash
npm install
cp .env.test.example .env.test   # fill in your project's URL, anon key, and service-role key
npx playwright install chromium
npx playwright test
```

The suite creates disposable `@example.com` test accounts and cleans them
up afterward with `tests/support/cleanup.mjs`. Don't point `.env.test` at
a database with real users you care about without running that cleanup.

## Rate limits

**Supabase Auth.** Signup, login, and password-reset requests are
throttled by Supabase's own built-in Auth rate limits, not by anything
in this app's code. The exact numbers live in the Supabase dashboard
under Authentication → Rate Limits, check there directly rather than
trusting a number written here, Supabase has changed these defaults
before and they vary by plan.

**This app adds none of its own.** No Server Action here throttles
repeated calls, login attempts, claim submissions, or resubmitted forms.
For a club-sized user base this hasn't mattered in practice, but it's a
real gap if traffic or abuse ever grows: someone could script repeated
signups, password-reset requests, or claim attempts with nothing in the
app itself to slow them down, only whatever Supabase's platform-level
limits happen to catch.

**Supabase's free-tier project limits.** The project pauses
automatically after about a week with no API activity (that's what the
"Be right back" screen is for) and has to be manually resumed from the
dashboard. The free tier also caps monthly active users, database size,
and bandwidth, unlikely for a club this size to hit, but worth knowing
they exist.

**Outbound email, if you add it, is a separate limit entirely,**
whatever your email provider allows, not Supabase's. A personal Gmail
account is capped at 500 sent messages per rolling 24 hours (500
recipients per message too, combining to/cc/bcc), a Google Workspace
account usually gets 2,000/day. That ceiling is very unlikely to bind at
this club's scale. The more realistic risk is deliverability: automated
mail sent through smtp.gmail.com with an app password can get flagged
by Google's own abuse detection, or land in spam on the receiving end,
well before you're anywhere near the 500 cap, since that heuristic
looks at sending patterns, not just volume. A transactional email
provider (Resend, Postmark) is a more reliable fit for something like
an automated "your claim was accepted" notice, and keeps a personal
Gmail password out of server code, but for a low-volume, no-links,
plain-text courtesy notice, Gmail SMTP is a reasonable place to start.

## Security

- **Row Level Security on every table.** Access control is enforced by
  Postgres itself, not just by what the UI happens to render. A tutor
  genuinely cannot query another family's data by guessing an ID; a
  demoted admin loses admin access on their very next request. This is
  the single most load-bearing security property of the app, nearly
  everything else is a convenience layered on top of it.
- **Role is never trusted from the client.** Every Server Action
  re-checks who's making the request, and RLS checks it again
  independently at the database layer, so a tampered request can't
  reach a permission the UI doesn't expose.
- **Role changes are enforced at the database layer, not just by the
  app.** A trigger on `profiles` rejects any update that changes a role
  unless the caller is already an admin, so this can't be done by calling
  the Supabase API directly and skipping the app's own checks.
- **Tutor codes never leak.** A signup request checks a code's validity
  through a security-definer function that can confirm a match without
  ever letting an unauthenticated caller read the codes table or learn
  how many codes exist.
- **Passwords are hashed by Supabase**, never visible in plaintext to
  anyone, including the project owner. There is no "look up a user's
  password" path, by design.
- **Password reset is enumeration-safe**, the same message shows
  whether or not an email has an account. Signup is a deliberate
  exception: it does say if an email's already taken, so a real user
  isn't shown a fake "check your email" message for a confirmation that
  will never arrive. That's a considered tradeoff, not an oversight.
- **Secrets stay out of the repo.** `.env.local` is gitignored, and the
  service-role key is only ever read server-side, never sent to the
  browser.
- **Errors don't leak internals.** Production error messages from
  Server Components and Server Actions are redacted by Next.js itself;
  this app also has its own error boundaries (`app/error.tsx`,
  `app/global-error.tsx`) so a Supabase outage or an unexpected crash
  shows a plain-language screen instead of a stack trace.

### Known gaps

- **No multi-factor authentication**, for any role, including admin. An
  admin account is the highest-value target in this system (subject and
  tutor-code management, force-cancel, role changes), and it's protected
  by the same email-and-password as everyone else.
- **No application-level rate limiting**, as above.
- **No audit trail for admin actions outside of claims and deleted
  students.** Claims and soft-deleted students keep a full history (who,
  when, and in some cases why). Renaming a subject, toggling a tutor
  code, or changing someone's role does not record who did it or when,
  beyond whatever timestamp columns that row already has.

## License

MIT. See [`LICENSE`](./LICENSE).

## Team

Built and maintained by the Venture Academy Tutors club director & *tech-lead* at
Interlake High School: Minh Do
