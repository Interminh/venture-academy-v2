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

- **Check the caller on the server.** Every Server Action re-checks the
  user's role. Don't rely on the UI hiding a button.
- **RLS is the real access control.** If you add a table, turn on Row Level
  Security and write the policies in the same migration.
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
3. New tables and functions need grants. See `0003_grants.sql` and
   `0004_tutor_signup_codes.sql`.
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
