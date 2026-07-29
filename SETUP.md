# Connecting Supabase and running the app

Everything in this repo is built and type-checks/builds cleanly, but it's
running against placeholder environment variables — there's no real
database behind it yet. This is the checklist to wire up a real Supabase
project and get the full parent → tutor → admin flow working end to end.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project** (the free
   tier is fine for a club-sized app).
2. Pick a name/region/password (the DB password isn't something you'll need
   day-to-day — the app never connects with it directly).
3. Once it's provisioned, go to **Settings → API** and copy:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep this one secret — never put it in anything
     that ships to the browser)

## 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in the three values from step 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`.env.local` is already gitignored — it will never get committed.

## 3. Run the schema migration

Easiest path (no CLI install needed): open your project's **SQL Editor** in
the Supabase dashboard, paste the entire contents of
`supabase/migrations/0001_init.sql`, and run it. That one file creates every
enum, table, RLS policy, and view the app needs.

If you'd rather use the CLI (keeps a proper migration history for future
changes):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Then seed the starter subjects list (also via SQL Editor, or
`npx supabase db execute -f supabase/seed.sql` with the CLI):

```
supabase/seed.sql
```

You can add/rename/retire subjects later from the admin dashboard itself —
this seed is just so the dropdowns aren't empty on day one.

## 4. Email confirmation

By default Supabase requires clicking a confirmation link before a new
account can log in — that adds friction and depends on Supabase's very low
free-tier email send limit, which is easy to hit while testing.

`supabase/migrations/0002_autoconfirm_email.sql` (run this in the SQL
Editor too) sidesteps this entirely: it auto-confirms every account at
signup, so login never depends on an email link at all. This is the
recommended path — you don't need to go hunting for the "Confirm email"
toggle in the dashboard (it moves around between Supabase's own redesigns).

If you'd rather have real email verification later (e.g. once this is
public-facing and you want to guarantee an email address is real), drop
that trigger and instead enable **Confirm email** under **Authentication →
Providers → Email**, plus set up a custom SMTP sender under
**Authentication → Emails** so the confirmation/reset emails come from your
own address instead of a generic Supabase one.

If you'd already created a test account before running this migration, it
won't retroactively confirm it — also run `supabase/confirm_existing_users_dev.sql`
once to confirm any existing accounts.

## 5. Install and run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 6. Create your accounts

There's no seeded admin — the very first admin has to be bootstrapped by
hand once:

1. Go to `/signup` and create a normal account (this always comes in as
   role `parent`).
2. In the Supabase dashboard, **Table Editor → profiles**, find that row and
   change its `role` column from `parent` to `admin`. Refresh the app — you
   now land in the admin dashboard.
3. From `/dashboard/admin/users/invite`, invite yourself (or teammates) as
   additional `tutor` or `admin` accounts. Each invite sends a real email
   with a link to set a password — no shared password anywhere.
4. Sign up a second, separate account normally at `/signup` to act as a test
   parent, and use the admin invite screen to create a test tutor account.

## 7. Walk the full lifecycle once

This exercises everything, including the two gaps the old system had
(cancellation and subject management):

1. **As the parent account** → `/dashboard/parent/intake` → add a student
   with a couple of subjects and a few availability slots.
2. **As the tutor account** → `/dashboard/tutor` → claim one of those open
   slots. It should immediately show "Pending."
3. **As the admin account** → `/dashboard/admin` → approve the claim. It
   should flip to "Booked" everywhere, and the tutor should now see the
   parent's email on `/dashboard/tutor/claims`.
4. **Back as the tutor** → `/dashboard/tutor/claims` → cancel the booking →
   confirm the slot reopens to "Open" on the tutor browse page and the
   parent's dashboard.
5. Repeat the claim/approve, then use the admin's **Ledger** page to
   force-cancel instead — confirm it's attributed to the admin, not the
   tutor, and the claim row is kept (never deleted) for history.
6. Try `/dashboard/admin/subjects` to add a new subject and confirm it shows
   up immediately in the parent intake form's subject picker.

If you open two different browsers (or one regular + one incognito) logged
in as two different tutors, you can also confirm the realtime "Pending"
flip shows up live in the second tab without a manual refresh.

## 8. Regenerate types once, after step 3

`lib/types/database.ts` was hand-written to match the migration so the app
type-checks without a live project. Once your project is linked, replace it
with the real generated types:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > lib/types/database.ts
```

(If you used the CLI's `db push` instead of pasting SQL by hand, this also
verifies the migration applied the way you expect.)

## Notes on what's deliberately NOT set up

- **No OAuth / no magic link** — email+password only, so nothing ever shows
  a Supabase-branded consent screen or `supabase.co` link to a family or
  tutor. This was a deliberate choice, not an oversight.
- **No phone number field anywhere** — tutor/family contact after an
  approved claim happens over email only.
- **Deploying**: this is a standard Next.js app, so Vercel's default Next.js
  import flow works — just add the same three env vars there under
  Project Settings → Environment Variables.
