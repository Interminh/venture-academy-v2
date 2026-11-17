# Contributing

Thanks for looking. This is a small club app, so the process is light.

## Getting set up

Follow [`SETUP.md`](./SETUP.md). You need your own Supabase project, since
the app and the tests both talk to a real database. Don't use a project
that holds real families' data.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Next.js here is v16, which differs from older versions in places. If
something behaves oddly, check `node_modules/next/dist/docs/` before
assuming the old API.

## Before you open a PR

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three should pass. The Playwright suite (`npm test`) needs a Supabase
project and an admin login, so it's not required for every PR. Run it if
you touched auth, claims, admin actions, or RLS. See the Testing section
of the [README](./README.md).

## Branches and commits

- Branch off `main` and keep each PR to one change.
- Short, imperative commit messages: "Fix slot status on cancel", not
  "Fixed some bugs in the slot stuff".
- Small commits are better than one big one.

## Code

- **Don't trust the UI.** Hiding a button isn't access control. Actions
  confirm who's calling, but Row Level Security is what decides what that
  user can read or write, admin actions included.
- **New tables get RLS in the same migration.** Turn it on and write the
  policies there. Then test the policy by calling the Supabase API
  directly, not only through the UI. That's how the privilege escalation
  fixed in `0017` was found.
- **Keep history.** Claims, students, accounts, and tutor codes are
  soft-deleted or dismissed, not removed. Follow that pattern for new data
  that matters.
- **Comments say why, not what.** Skip the ones that restate the code.
- Match the surrounding style. There's no formatter config, so follow what
  the file already does.

## Database changes

Migrations live in `supabase/migrations/` and run in numeric order.

1. Add the next numbered file, for example `0018_short_name.sql`. Never
   edit one that's already been applied.
2. Keep it additive: new tables, columns, and policies. Dropping a column
   or adding a `not null` column without a default can fail on a database
   that already has rows.
3. New tables pick up their grants from the defaults set in
   `0003_grants.sql`. A function that signed-in or signed-out users call
   needs an explicit `grant execute`, and a `security definer` one should
   set `search_path`. `0004_tutor_signup_codes.sql` shows both.
4. Update `lib/types/database.ts` to match. It's hand-written, or you can
   regenerate it as described in `SETUP.md`.
5. Say in the PR what you ran it against, since a reviewer can't see your
   database.

## Reporting bugs and ideas

Open an issue with what you did, what you expected, and what happened.
For anything security related, don't open a public issue. See
[`SECURITY.md`](./SECURITY.md).

## License

By contributing you agree your work is released under the project's
[Apache 2.0 license](./LICENSE).
