# Connecting Supabase and running the app

Steps to wire up a Supabase project and run the full parent, tutor, and
admin flow.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and start a **New Project**.
   The free tier is enough for a club.
2. Pick a name, region, and password. The app never connects with the DB
   password.
3. Under **Settings > API**, copy:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep it secret, never ship it to the browser)

## 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`.env.local` is gitignored. Add `RESEND_API_KEY` too if you want session
emails.

## 3. Run the migrations

Open the **SQL Editor** in the Supabase dashboard and run every file in
`supabase/migrations/` in numeric order, starting with `0001_init.sql`.

Or use the CLI, which keeps a migration history:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Then seed the starter subjects, in the SQL Editor or with the CLI:

```bash
npx supabase db execute -f supabase/seed.sql
```

Admins can add or retire subjects later from the dashboard.

## 4. Email confirmation

`0002_autoconfirm_email.sql` confirms every account at signup, so login
never waits on an email link. That avoids Supabase's low free-tier email
limit.

For real email verification later, drop that trigger, enable **Confirm
email** under **Authentication > Providers > Email**, and set up a custom
SMTP sender under **Authentication > Emails**.

Accounts created before that migration aren't confirmed retroactively.
Run `supabase/dev/confirm_existing_users.sql` once to fix them.

## 5. Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 6. Create your accounts

There's no seeded admin, so bootstrap the first one by hand:

1. Sign up at `/signup`. This account is a `parent`.
2. In the Supabase dashboard, open **Table Editor > profiles**, find the
   row, and change `role` to `admin`. Refresh the app.
3. In `/dashboard/admin/users`, add a tutor sign-up code (any string, like
   `VAT-TUTOR-2026`).
4. Sign up a second account at `/signup`, check the tutor box, and enter
   the code. Sign up a third without the box as a test parent.
5. The same admin page can promote or demote any account.

## 7. Walk the full lifecycle

1. As the **parent**, go to `/dashboard/parent/intake` and add a student
   with a few subjects and one weekly schedule.
2. As the **tutor**, open `/dashboard/tutor`, pick the student, and claim
   an open time with a subject. It should show "Pending".
3. As the **admin**, approve the claim at `/dashboard/admin`. It should
   show "Booked" everywhere, and the tutor should see the parent's email
   on `/dashboard/tutor/claims`.
4. As the **tutor**, cancel the booking. The slot should reopen for the
   tutor and the parent.
5. Claim and approve again, then force-cancel from the admin **Ledger**.
   It should be attributed to the admin and the claim row should remain.
6. Add a subject at `/dashboard/admin/subjects` and check it appears in
   the parent intake form.

To check realtime updates, log in as two tutors in separate browsers and
watch "Pending" appear without a refresh.

## 8. Regenerate types

After step 3, replace the hand-written types with generated ones:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > lib/types/database.ts
```

## Operating in production

**Code and database changes are separate.** Deploying to Vercel only
ships code. The schema changes only when you run a migration yourself in
the SQL Editor.

**Back up before any real migration.** Check **Project Settings >
Database > Backups** for what your plan covers. You can also click
**Create backup** there or run `node scripts/backup-db.mjs` for a local
JSON copy. Every migration so far only adds columns, tables, and
policies. Keep it that way, since dropping a column or adding a `not
null` constraint without a default can fail or destroy data.

**There's no staging environment.** Local dev and Vercel previews use the
same Supabase project as real families. To fix that, create a second free
Supabase project, run the migrations there, and point `.env.local` and
Vercel's Preview environment at it.

## Deliberate choices

- **No OAuth or magic links.** Email and password only, so nobody sees a
  Supabase-branded screen or link.
- **No phone numbers.** Contact after approval is by email.
- **Deploying.** Import the repo into Vercel and add the same env vars
  under Project Settings > Environment Variables.
