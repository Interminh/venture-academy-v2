# Connecting Supabase and running the app

Everything in this repo builds and type-checks cleanly, but it's running
against placeholder environment variables right now. There's no real
database behind it yet. This is the checklist to wire up a real Supabase
project and get the full parent, tutor, and admin flow working end to end.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and start a **New Project**
   (the free tier is fine for a club-sized app).
2. Pick a name, region, and password. You won't need the DB password
   day-to-day since the app never connects with it directly.
3. Once it's provisioned, go to **Settings → API** and copy:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep this one secret, never put it in anything
     that ships to the browser)

## 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in the three values from step 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`.env.local` is already gitignored, so it will never get committed.

## 3. Run the schema migrations

Easiest path, no CLI install needed: open your project's **SQL Editor** in
the Supabase dashboard and run each file in `supabase/migrations/` in
order: `0001_init.sql`, then `0002_autoconfirm_email.sql`,
`0003_grants.sql`, `0004_tutor_signup_codes.sql`, and
`0005_schedule_per_student.sql`. They build on each other, so order matters.

If you'd rather use the CLI (this keeps a proper migration history for
future changes):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Then seed the starter subjects list, also via SQL Editor, or with the CLI:

```bash
npx supabase db execute -f supabase/seed.sql
```

You can add, rename, or retire subjects later from the admin dashboard
itself. This seed just keeps the dropdowns from being empty on day one.

## 4. Email confirmation

By default Supabase makes a new account click a confirmation link before
it can log in. That adds friction and depends on Supabase's very low
free-tier email limit, which is easy to hit while testing.

`supabase/migrations/0002_autoconfirm_email.sql` (already run as part of
step 3) sidesteps this entirely. It auto-confirms every account at signup,
so login never depends on an email link at all. This is the recommended
path: you don't need to go hunting for the "Confirm email" toggle in the
dashboard, which moves around between Supabase's own redesigns.

If you'd rather have real email verification later, for example once this
is public-facing and you want to guarantee an email address is real, drop
that trigger and instead enable **Confirm email** under **Authentication →
Providers → Email**, plus set up a custom SMTP sender under
**Authentication → Emails** so confirmation and reset emails come from
your own address instead of a generic Supabase one.

If you already created a test account before running this migration, it
won't retroactively confirm it. Run `supabase/dev/confirm_existing_users.sql`
once to confirm any existing accounts.

## 5. Install and run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 6. Create your accounts

There's no seeded admin. The first admin has to be bootstrapped by hand:

1. Go to `/signup` and create a normal account. This always comes in as
   role `parent`.
2. In the Supabase dashboard, open **Table Editor → profiles**, find that
   row, and change its `role` column from `parent` to `admin`. Refresh the
   app and you'll land in the admin dashboard.
3. From `/dashboard/admin/users`, add a tutor sign-up code (any string you
   choose, e.g. `VAT-TUTOR-2026`). This is what you hand out to real tutors.
4. Sign up a second, separate test account at `/signup`, check "I'm
   signing up as a tutor," and enter that code. It comes in as `tutor`
   immediately, no email or invite step involved. Sign up a third account
   without checking the box to act as a test parent.
5. The same `/dashboard/admin/users` page also lets you promote or demote
   any existing account's role directly, if you ever need to fix a
   mis-signup or make someone else an admin.

## 7. Walk the full lifecycle once

This exercises everything, including the two gaps the old system had:
cancellation and subject management.

1. As the **parent** account, go to `/dashboard/parent/intake` and add a
   student with a couple of needed subjects and one shared weekly
   schedule (not one schedule per subject).
2. As the **tutor** account, go to `/dashboard/tutor`, click that
   student's card to open their schedule, and claim an open time,
   picking which subject you're helping with. It should immediately show
   "Pending."
3. As the **admin** account, go to `/dashboard/admin` and approve the
   claim. It should flip to "Booked" everywhere, and the tutor should now
   see the parent's email on `/dashboard/tutor/claims`.
4. Back as the **tutor**, go to `/dashboard/tutor/claims` and cancel the
   booking. Confirm the slot reopens to "Open" on the tutor browse page
   and the parent's dashboard.
5. Repeat the claim and approval, then use the admin's **Ledger** page to
   force-cancel instead. Confirm it's attributed to the admin, not the
   tutor, and that the claim row is kept, never deleted, for history.
6. Try `/dashboard/admin/subjects` to add a new subject and confirm it
   shows up immediately in the parent intake form's subject picker.

If you open two different browsers, or one regular and one incognito,
logged in as two different tutors, you can also confirm the realtime
"Pending" flip shows up live in the second tab without a manual refresh.

## 8. Regenerate types once, after step 3

`lib/types/database.ts` was hand-written to match the migrations so the
app type-checks without a live project. Once your project is linked,
replace it with the real generated types:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > lib/types/database.ts
```

If you used the CLI's `db push` instead of pasting SQL by hand, this also
confirms the migrations applied the way you expect.

## Operating in production

**Code changes and database changes are separate.** Deploying to Vercel
(pushing to `main`) only ships code, it never touches Supabase. The only
thing that changes the schema is running a migration file yourself in the
SQL Editor, on purpose, never as a side effect of a deploy.

**Back up before any real migration.** Supabase includes some automatic
backups even on the free tier, check **Project Settings → Database →
Backups** for what your plan actually covers rather than trusting a
number written here, plan details change. Take your own snapshot right
before anything risky anyway: click **Create backup** on that same page,
or run `node scripts/backup-db.mjs` for a local JSON copy (see the
README's Database section). Every migration through `0017` is purely
additive, new columns, new tables, new policies, nothing has ever dropped
or renamed existing data. Keep it that way if you can; a migration that
drops a column or adds a `not null` constraint without a default on a
table that already has rows can fail outright or destroy data.

**There's no staging environment.** Local dev and Vercel preview
deployments both point at the same Supabase project real families use,
whatever `.env.local` has. Testing a schema change "locally" still means
running it against the real database. If that ever matters enough to fix:
spin up a second, free Supabase project as dev/staging, run all the
migrations on it, point `.env.local` there instead, and optionally scope
a separate set of credentials to Vercel's Preview environment so shared
preview links don't touch real data either.

## Notes on what's deliberately not set up

- **No OAuth, no magic link.** Email and password only, so nothing ever
  shows a Supabase-branded consent screen or a `supabase.co` link to a
  family or tutor. Deliberate choice, not an oversight.
- **No phone number field anywhere.** Tutor and family contact after an
  approved claim happens over email only.
- **Deploying.** This is a standard Next.js app, so Vercel's default
  Next.js import flow works. Add the same three env vars there under
  Project Settings → Environment Variables.
