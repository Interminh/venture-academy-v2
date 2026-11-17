# Security Policy

This app handles contact details and schedules, so
security reports are taken seriously.

## Reporting a vulnerability

Please don't open a public issue or PR for a security problem.

Use GitHub's private reporting instead: go to the **Security** tab of this
repo and choose **Report a vulnerability**. Include:

- what the problem is and which part of the app it affects
- steps to reproduce, or a short proof of concept
- what an attacker could do with it

This is a volunteer-run project, so I can't promise a fixed turnaround.
Expect a first reply within about a week. Please give me time to fix it
before you share details publicly.

## Supported versions

Only the latest commit on `main` is supported. There are no versioned
releases.

## What's in scope

- Anything that lets a user read or change data they shouldn't: another
  family's students, another tutor's claims, contact details before a claim
  is approved.
- Privilege escalation, such as a parent or tutor becoming an admin.
- Auth bypass, session problems, and open redirects.
- Injection or XSS in any page or form.
- Secrets or personal data exposed through the repo or the app.

## Known gaps

These are already documented in the
[README](./README.md#known-gaps) and don't need a report:

- No multi-factor authentication.
- No application-level rate limiting. Only Supabase's own limits apply.
- No audit trail for some admin actions, like subject renames and role
  changes.

## If you're running your own copy

- Keep `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` out of the browser
  and out of git. `.env.local` is gitignored for this reason.
- Apply every migration in `supabase/migrations/`. `0017` closes a
  privilege escalation on the `profiles` table, so don't skip it.
- If a key ever shows up in a commit, rotate it right away. Deleting the
  commit isn't enough.
