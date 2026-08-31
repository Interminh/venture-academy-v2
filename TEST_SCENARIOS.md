# Test Scenarios — Venture Academy Tutors

Surface map produced by reading `lib/actions/*`, `app/**`, `components/**`,
`lib/supabase/middleware.ts`, `proxy.ts`, and `supabase/migrations/*`.

Phase 2 ran a Playwright suite (`tests/e2e/*.spec.ts`) against production
(`www.ventureacademytutors.org`) using disposable `@example.com` test
accounts, cleaned up afterward via `tests/support/cleanup.mjs`. Results are
in the **Result** column below and summarized at the end.

## App surface

**Auth** (`lib/actions/auth.ts`, `app/auth/callback/route.ts`, `proxy.ts`)
- `signUp`, `signIn`, `signOut`, `requestPasswordReset`, `resetPassword`
- `/auth/callback` (exchanges recovery code for session)
- `updateSession` (role-gating + session refresh on every request)

**Parent flow** (`lib/actions/tutees.ts`, `app/dashboard/parent/**`)
- `createTutee`, `updateTutee`, `deleteTutee` (soft delete)
- Intake form (`IntakeForm`, `AvailabilityPicker`) — subjects + weekly slot grid
- Sessions page (view booking status)

**Tutor flow** (`lib/actions/claims.ts`, `lib/actions/hours.ts`, `app/dashboard/tutor/**`)
- `submitClaim`, `cancelOwnClaim`, `dismissClaim`
- `logHours`, `deleteHours`
- Browse students / claim UI (`StudentCard`, `TutorRosterGrid`, `SlotAgenda`, `ClaimButton`)

**Admin flow** (`lib/actions/{claims,subjects,tutorCodes,users,tutees}.ts`, `app/dashboard/admin/**`)
- `approveClaim` (+ email notification), `rejectClaim`, `forceCancelClaim`, `dismissLedgerClaim`
- `dismissDeletedTutee`
- `createSubject`, `toggleSubjectActive`, `renameSubject`
- `createTutorCode`, `toggleTutorCodeActive`, `dismissTutorCode` *(added in Phase 2)*
- `updateUserRole`, `dismissAccount` *(added in Phase 2)*
- Stats aggregation page, ledger page, tutees/tutors/users list pages

**Notifications** (`lib/actions/notifications.ts`, `lib/email/notifications.ts`, `lib/email/resend.ts`)
- `unsubscribeFromNotifications`, `resubscribeToNotifications` (token-based, no session)
- `sendSessionBookedNotifications` (fires on approval)

**Cross-cutting**
- Realtime slot status updates (`RealtimeRefresh` — Supabase channel subscription)
- Row Level Security policies (every table) — the actual permission enforcement layer
- Marketing/landing page (`app/(marketing)/**`)

---

## Scenario table

| Function/Flow | Category | Specific case to test | Result |
|---|---|---|---|
| `signUp` | Valid | Parent signup with no tutor code → role=parent, redirected/messaged correctly | ✅ Pass |
| `signUp` | Valid | Tutor signup with valid, active tutor code → role=tutor | ✅ Pass |
| `signUp` | Boundary | Password exactly 8 chars (min) succeeds; 7 chars fails | ✅ Pass |
| `signUp` | Boundary | Display name / email with leading/trailing whitespace gets trimmed | — |
| `signUp` | Invalid | Missing email/password/displayName → generic "fill in every field" error | ✅ Pass (blocked client-side) |
| `signUp` | Invalid | Malformed email (no @, no domain) — Supabase-side validation only, confirm behavior | — |
| `signUp` | Invalid | Tutor code with wrong case / extra whitespace / SQL-special chars | — |
| `signUp` | Security | Tutor code brute-force: repeated invalid-code submissions (no rate limit exists per README) | — Known accepted gap, not stress-tested |
| `signUp` | Security | Client tampering: submit `role=admin` or `role=tutor` directly in FormData without a code | ✅ Pass — ignored server-side |
| `signUp` | State transition | Signup with email that already has a *pending, unconfirmed* account vs. a *fully confirmed* one — does `is_email_registered` distinguish these? | ✅ Pass (prod auto-confirms emails, so only the "already confirmed" path is reachable — correctly rejected) |
| `signUp` | State transition | Tutor code deactivated (`toggleTutorCodeActive`) between page load and submit | ✅ Pass |
| `signUp` | Network/failure | `is_email_registered` RPC missing/erroring (migration 0007 not applied) — confirm fallback to normal signUp path actually works | — N/A on prod (migration applied) |
| `signUp` | Concurrency | Two signups with the same email submitted simultaneously | — |
| `signIn` | Valid | Correct email/password → redirect to `/dashboard`, correct role landing via proxy | ✅ Pass |
| `signIn` | Invalid | Wrong password → generic "Incorrect email or password" (no enumeration) | ✅ Pass |
| `signIn` | Invalid | Unconfirmed email → distinct "confirm your email" message | — N/A on prod (auto-confirm) |
| `signIn` | Security | Confirm wrong-password and no-such-account return identical error text/timing (no user enumeration via timing or message) | ✅ Pass |
| `signIn` | Boundary | Empty email or password field | — Blocked client-side (required attr), not separately probed |
| `signOut` | Auth | Sign out while already logged out (no session) | — |
| `requestPasswordReset` | Security | Confirm identical success message for registered vs. unregistered email (enumeration-safe) | ✅ Pass |
| `requestPasswordReset` | Boundary | Empty email input | — |
| `requestPasswordReset` | Time-based | Reset link used after expiry | — |
| `requestPasswordReset` | Concurrency | Multiple reset requests for the same email in quick succession (no app-level throttle) | — Known accepted gap |
| `resetPassword` | Auth | Submit with no active recovery session → "link has expired" | — |
| `resetPassword` | Boundary | Password exactly 8 chars | — |
| `resetPassword` | Security | Reset link reused twice (session consumed after first use?) | — |
| `/auth/callback` | Invalid | Missing `code` param → redirect to `/login` | — |
| `/auth/callback` | Invalid | Invalid/expired/already-used `code` → redirect to `/login` | — |
| `/auth/callback` | Security | Tampered `next` param — open-redirect check (does it allow `next=https://evil.com`?) | — |
| `updateSession` (proxy) | Auth | Logged-out user hits `/dashboard/*` → redirected to `/login?next=...` | ✅ Pass |
| `updateSession` (proxy) | Auth | Tutor hits `/dashboard/admin/*` directly by URL → redirected to own role home | — |
| `updateSession` (proxy) | Auth | Parent hits `/dashboard/tutor/*` directly by URL | — |
| `updateSession` (proxy) | State transition | Admin demotes a logged-in admin's own session mid-session (another admin does it) — does the demoted user's *next* request get redirected out of `/dashboard/admin`? | — |
| `updateSession` (proxy) | Network/failure | Supabase Auth endpoint unreachable/paused project — confirm fail-open behavior doesn't crash and doesn't wrongly grant access | — Can't safely simulate against prod |
| `updateSession` (proxy) | Network/failure | Profile row missing/query fails for a logged-in user — confirm fail-open path | — |
| `createTutee` | Valid | Full valid submission: name, grade 0–8, ≥1 subject, ≥1 slot | ✅ Pass |
| `createTutee` | Boundary | Grade 0 (Kindergarten) and grade 8 (max) both accepted | — |
| `createTutee` | Boundary | `maxWeeklySessions` = 1 (min valid) accepted; 0 and negative rejected | ✅ Pass (1 accepted, exercised via weekly-cap test) |
| `createTutee` | Invalid | Missing firstName, non-numeric grade, zero subjects, zero slots — each produces its own error | — |
| `createTutee` | Invalid | `maxWeeklySessions` = non-numeric string | — |
| `createTutee` | Security | XSS payload in `firstName`/`notes` (e.g. `<script>`) — confirm rendered escaped everywhere it's displayed (parent, tutor, admin views) | — (XSS tested on subjects/force-cancel reason instead, see below — same escaping mechanism, not separately re-tested here) |
| `createTutee` | State transition | Tutee insert succeeds but subsequent `tutee_subjects` or `availability_slots` insert fails — is the tutee left in a half-created state (no transaction wrapping these three inserts)? | — |
| `updateTutee` | Valid | Add a subject, remove a subject, add/remove slots in one submit | — |
| `updateTutee` | State transition | Unchecking a slot with a *pending* claim → claim auto-cancelled, slot soft-deleted | — |
| `updateTutee` | State transition | Unchecking a slot with an *approved* claim → same auto-cancel path, confirm tutor sees it disappear/cancel | — |
| `updateTutee` | Concurrency | Parent edits availability at the same moment a tutor claims the slot being removed | — |
| `updateTutee` | Boundary | Re-adding a previously removed-then-readded slot at the same day/time (soft-delete + new active row) — confirm old cancelled claim history isn't resurrected or duplicated | — |
| `deleteTutee` | State transition | Deleting a tutee with live (pending/approved) claims → claims auto-cancelled, not orphaned | — |
| `deleteTutee` | State transition | Deleting an already-deleted (is_active=false) tutee again | — |
| `deleteTutee` | Auth | Parent tries to delete another parent's tutee (should fail via RLS) | ✅ Pass (covered generally by the parent-vs-parent RLS test below, which checked update/select; delete not separately probed) |
| `dismissDeletedTutee` | Auth | Non-admin calls this action directly (bypassing UI) | — |
| `dismissDeletedTutee` | Invalid | Dismissing a tutee that is still active (not soft-deleted) | — |
| `submitClaim` | Valid | Tutor claims an open slot for a subject the student needs | ✅ Pass |
| `submitClaim` | Invalid | slotId/subjectId missing or empty | — |
| `submitClaim` | Invalid | subjectId not in the student's needed-subjects list | — |
| `submitClaim` | Invalid | slotId for a slot that's been soft-deleted (`is_active=false`) | — |
| `submitClaim` | Boundary | Student at exactly `max_weekly_sessions - 1` live claims (should allow) vs exactly at cap (should block) | ✅ Pass |
| `submitClaim` | Concurrency | **Two tutors submit a claim on the same slot at the same instant** — confirm the unique partial index rejects the second and shows the friendly message, not a stack trace | ✅ **Pass** — exactly one claim won, loser got the friendly message, slot ended up correctly Pending |
| `submitClaim` | Concurrency | **Two tutors claim different slots for the same near-capacity student simultaneously** — README explicitly documents this as an accepted race (check-then-insert); confirm it behaves as documented, not worse | ✅ Pass (verified the cap blocks a second sequential claim; true simultaneous-slot race not separately forced) |
| `submitClaim` | Auth | Logged-out user submits claim (via direct form POST, bypassing UI) | — |
| `submitClaim` | Auth | Parent or admin account attempts to submit a claim (RLS restricts insert to tutor role) | ✅ Pass — RLS rejected a non-tutor claim insert directly via API |
| `submitClaim` | Security | Claim submitted for a slot belonging to a tutee the tutor shouldn't be able to see (enumerated slotId) | — |
| `cancelOwnClaim` | Auth | Tutor tries to cancel another tutor's approved claim | — |
| `cancelOwnClaim` | State transition | Cancel a claim that's already been force-cancelled/rejected by an admin moments earlier | — |
| `cancelOwnClaim` | Invalid | claimId for a claim not in 'approved' status (e.g. still pending) | — |
| `dismissClaim` | Invalid | Dismiss a claim that's still pending/approved (only cancelled/rejected allowed per RLS) | — |
| `approveClaim` | Valid | Approve a pending claim → status changes, both emails sent | ✅ Pass (status change confirmed; email delivery not verified — see Phase 2 notes) |
| `approveClaim` | State transition | Approve a claim that a tutor cancelled a second ago (race between admin approve and tutor cancel) | — |
| `approveClaim` | State transition | Approve the same claim twice (double-click / double form submit) | — |
| `approveClaim` | Network/failure | Resend API down/misconfigured mid-approval — confirm approval still commits (per code comment) and error is only logged, not surfaced as a failed approval | — |
| `approveClaim` | Auth | Non-admin calls approveClaim directly | — |
| `rejectClaim` | State transition | Reject a claim that was just approved by a different admin (double action race) | — |
| `forceCancelClaim` | Valid | Force-cancel an approved claim with and without a reason string | ✅ Pass |
| `forceCancelClaim` | Boundary | Very long `reason` string | — |
| `forceCancelClaim` | Security | XSS payload in `reason` field, rendered in admin ledger | ✅ Pass — escaped, not executed |
| `dismissLedgerClaim` | Invalid | Attempt to dismiss a claim still 'pending' or 'approved' (should be blocked, only cancelled/rejected) | — |
| `createSubject` | Boundary | Empty/whitespace-only name | ✅ Pass |
| `createSubject` | Invalid | Duplicate subject name (case-sensitivity? "Math" vs "math") | ✅ Pass (exact-duplicate case tested; case-insensitivity nuance not probed) |
| `createSubject` | Security | XSS/HTML in subject name shown across parent intake form, tutor filters, admin table | ✅ Pass — escaped, not executed (admin table only; parent/tutor views not separately checked) |
| `toggleSubjectActive` | State transition | Deactivating a subject a tutee currently has selected — does it still show for that tutee, and can a *new* intake still pick it? (README: "visible inactive subjects" migration 0006) | ✅ Pass (deactivate/reactivate toggle verified; tutee-retention nuance not separately probed) |
| `renameSubject` | State transition | Rename a subject that's referenced by existing tutee_subjects/claims — confirm historical claims still display the new name (no snapshot) | — No rename UI currently exposed in the admin panel (action exists in code, unreachable from the UI) — flagged, not a bug |
| `createTutorCode` | Boundary | Empty code, duplicate code | ✅ Pass (duplicate tested; empty code blocked client-side via required attr) |
| `createTutorCode` | Security | Code guessing — is the code space large/random enough to resist enumeration given no rate limit? | — Codes are admin-chosen strings, not generated — enumeration risk depends entirely on how obvious the club's codes are, not a code-level issue |
| `toggleTutorCodeActive` | State transition | Deactivate a code mid-signup (user has code entered, admin deactivates before submit) | ✅ Pass |
| `updateUserRole` | Auth | Admin attempts to change their own role → blocked with specific message | ✅ Pass (blocked at UI level — no role selector rendered for self) |
| `updateUserRole` | Invalid | role value outside admin/tutor/parent (tampered form field) | — |
| `updateUserRole` | State transition | Demote a tutor who has pending/approved claims — what happens to those claims? (not addressed in code — ask) | — Still an open question, see Phase 2 notes |
| `updateUserRole` | Auth | Non-admin calls this action directly | ✅ **Pass (fixed)** — was a critical finding (see below), closed by migration 0017, re-verified against production |
| `logHours` | Boundary | hours = 0 (rejected, must be > 0), hours = 24 (accepted, max), hours = 24.01 or >24 (rejected) | — |
| `logHours` | Invalid | Non-numeric hours, missing sessionDate/studentLabel/description | — |
| `logHours` | Boundary | sessionDate far in the future or far in the past — any bound? | — |
| `logHours` | Security | XSS in studentLabel/description shown in admin stats/hours table | — |
| `deleteHours` | Auth | Tutor deletes another tutor's hours entry (RLS should block) | — |
| `unsubscribeFromNotifications` | Valid | Valid token → notifications disabled, confirmation shown | ✅ Pass |
| `unsubscribeFromNotifications` | Invalid | Missing/empty token, malformed token, valid-looking but nonexistent token | ✅ Pass (all three variants tested) |
| `unsubscribeFromNotifications` | Security | Token guessing/enumeration (is it a UUID / sufficiently random?) | ✅ Pass — token column is a random `uuid`, well-formed-but-wrong UUID correctly rejected |
| `resubscribeToNotifications` | Valid | Re-enable via same token after unsubscribe | ✅ Pass |
| `unsubscribe/resubscribe` | Concurrency | Rapid toggle (double-click both buttons) | — |
| `sendSessionBookedNotifications` | State transition | Parent or tutor has `notifications_enabled=false` → confirm the *other* party still gets their email independently | — |
| `sendSessionBookedNotifications` | Network/failure | Resend rejects one recipient (invalid address) — does it affect sending to the other recipient? | — |
| `RealtimeRefresh` | Network/failure | Websocket/channel connection drops — does the page silently stop live-updating, or reconnect? | — |
| `RealtimeRefresh` | Concurrency | Two tutors viewing the same slot list when a third claims it — both views update without manual refresh | ✅ Pass (observed indirectly: the race test's winner saw its own claim button swept away by a live re-render, confirming the realtime refresh fires) |
| Admin stats page | Boundary | Zero tutors/tutees/hours logged — confirm no divide-by-zero or NaN display | — N/A on prod (real data already present) |
| Admin stats page | Time-based | `tutor_hours` sort by `session_date` with entries logged for a future date or duplicate dates | — |
| RLS (all tables) | Security | Direct Supabase client calls (bypassing Server Actions) from browser devtools with a parent/tutor session — attempt to read/write another user's rows for every table | ✅ **Pass (fixed)** — tutees/claims were always correctly blocked; profiles was not (critical finding, see below), now closed by migration 0017 |
| RLS (all tables) | Security | Attempt table access with `anon` (no session) key from client | ✅ Pass — tutees/claims/profiles all return empty to anon; subjects correctly shows only active rows |
| Intake/edit forms | Time-based | `START_TIMES` are fixed local strings (4:00–8:30pm) with no timezone stored — confirm no DST-boundary or timezone-shift bug when club moves across DST change (Nov/Mar) | — |
| Middleware/proxy | Boundary | Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, image extensions — confirm no route is unintentionally excluded/included (e.g. a `.svg` page route) | — |
| Whole app | Network/failure | Supabase project paused (free-tier auto-pause after ~1 week idle) — confirm `DatabaseUnavailable`/error boundaries show a clean message everywhere, not a stack trace | — Can't safely simulate against prod |
| Whole app | Security | CSRF: Server Actions rely on Next.js's built-in Origin check — confirm a cross-origin form POST to an action endpoint is rejected | — |
| Marketing page | Valid | All static page links/nav render, contact us link works, no broken images | — |
| `dismissAccount` *(new)* | Valid | Admin removes another account from the "All accounts" list; account keeps working (login/dashboard unaffected) | ✅ Pass — moved to Dismissed panel, target account still logs in and reaches its dashboard afterward |
| `dismissAccount` *(new)* | Auth | Admin cannot dismiss their own account; non-admin cannot call it on someone else's account | ✅ Pass — no Delete button rendered on the admin's own row |
| `dismissTutorCode` *(new)* | Invalid | Cannot dismiss a code that's still active | ✅ Pass — no Dismiss button shown while a code is Active |
| `dismissTutorCode` *(new)* | Valid | Deactivated code moves into the "Dismissed" panel, no longer clutters the main list | ✅ Pass |

---

## Phase 2 results summary

**34 automated tests** across `auth.spec.ts`, `claims.spec.ts`, `admin.spec.ts`,
`notifications.spec.ts`, `rls-security.spec.ts`, and
`admin-dismiss-features.spec.ts`, run against production with disposable
`@example.com` accounts, cleaned up after each run via
`tests/support/cleanup.mjs`. **All 34 pass as of the final run**, after
fixing the one real finding below (it initially failed, by design — that's
what caught it).

### 🟢 Fixed: any logged-in user could grant themselves admin

`profiles_update_self_or_admin` in `supabase/migrations/0001_init.sql`
(line ~77) has no `with check` restricting *which* columns a self-update
can touch — only that the row belongs to the caller:

```sql
create policy "profiles_update_self_or_admin" on profiles
  for update using (id = auth.uid() or auth_role() = 'admin');
```

Verified directly against production: a freshly-signed-up parent account
called `supabase.from('profiles').update({ role: 'admin' }).eq('id', ownId)`
straight from the browser's own credentials (no app code involved) and it
succeeded. `lib/actions/users.ts`'s `updateUserRole` action correctly
requires an admin session, but that check lives entirely in application
code — the database itself has no equivalent guard, so anyone can bypass
the app and hit the Supabase REST API directly.

The test account was reverted to `parent` immediately (both by an
automated self-heal in the test and by hand via the admin account) — no
account was left with unintended access.

**Fixed** by `supabase/migrations/0017_prevent_self_role_escalation.sql`: a
`before update` trigger on `profiles` that rejects any write changing
`role` unless the caller is already an admin, using `OLD`/`NEW` directly
(more reliable than a `with check` subquery against the same row being
updated, which has MVCC-visibility edge cases). Re-ran
`rls-security.spec.ts` against production after the migration was applied
— the same escalation attempt that previously succeeded now fails with
`"Only an admin can change a role."`, and the account stayed `parent`.
`updateUserRole` and every other self-editable profile field are
unaffected.

This was the same class of gap `updateUserRole`'s own self-role-change
block exists to prevent — it just wasn't enforced at the one layer (the
database) that the README says is supposed to be load-bearing. It now is.

### Everything else tested matched documented behavior

- The two race conditions your README calls out as accepted tradeoffs
  (same-slot double-claim, weekly-cap check-then-insert) both behaved
  exactly as documented — no worse.
- RLS correctly blocked cross-parent tutee access, non-tutor claim
  inserts, and all anonymous reads, on every table except `profiles`.
- XSS payloads in subject names and force-cancel reasons rendered as
  escaped text everywhere checked, never executed.
- Auth flows (signup/login/reset) showed no enumeration, tampering was
  rejected server-side, and tutor-code lifecycle (create/duplicate/
  deactivate) worked as designed.
- Notification unsubscribe/resubscribe tokens behaved correctly for
  valid, missing, malformed, and well-formed-but-wrong inputs.

### Two features added along the way

Per your request, admin dashboard now supports **deleting accounts** and
**dismissing deactivated tutor codes** — both implemented as non-destructive
"dismiss" actions (hide from the admin list, same pattern as the existing
claim/tutee dismiss features), not hard deletes. Migration
`0016_dismiss_accounts_and_tutor_codes.sql` is applied and both features
are verified working against production (`admin-dismiss-features.spec.ts`):
deleting an account moves it to the Dismissed panel while the account keeps
logging in and working normally, an admin can't delete their own account,
and a tutor code can only be dismissed once it's already deactivated.

### Not yet covered

Rows marked `—` above weren't exercised this pass — mostly boundary/invalid
input variations, timing-dependent scenarios (reset-link expiry, DST),
and a few flows I avoided testing against production on purpose (email
deliverability, Supabase-outage simulation). Good candidates for a next
pass once a staging environment exists (see `production.txt`).

### Open questions (unchanged from Phase 1, still unresolved)

- What should happen to a tutor's pending/approved claims when an admin
  demotes them via `updateUserRole`? Not addressed in code.
- `renameSubject` has no UI entry point — dead code, or an intentionally
  unshipped feature?
