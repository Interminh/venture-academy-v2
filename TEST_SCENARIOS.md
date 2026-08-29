# Test Scenarios

This is a working contract for what the app is expected to do correctly
today. Each section lists the important, everyday scenarios first, then
the edge cases that are easy to get wrong. If a scenario here fails, that's
a regression, not a surprise. If a scenario isn't here, it isn't a promise
yet.

Status tags: **known bug** marks a scenario that currently fails on
purpose (see `report.txt`), so it isn't confused with a regression.

---

## 1. Sign-up and login

**Important**
- Parent signs up with no tutor code and lands in the parent dashboard.
- Tutor signs up with a valid, active code and lands in the tutor dashboard.
- Wrong password or unknown email shows one generic "incorrect email or
  password" message (no hint about which one was wrong).
- Signing up with an email that already has an account shows a clear
  "already exists, log in instead" message rather than a fake "check your
  email" success.
- Password reset email is requested, link lands on the reset form, new
  password takes effect and signs the user in.

**Edge cases**
- Tutor code exists but has been deactivated by an admin -> signup is
  rejected, not silently downgraded to a parent account.
- Tutor code is mistyped -> signup is rejected outright, never silently
  falls back to creating a parent account.
- Password under 8 characters is rejected on both signup and reset.
- Password reset requested for an email that has no account -> same
  generic success message as a real one (no account enumeration).
- Reset link is expired or already used -> user is told to request a new
  one, not shown a broken form.
- Project has email confirmation enabled: signup succeeds but there's no
  session yet -> user sees "check your email," not a silent redirect loop.

---

## 2. Parent: managing a student

**Important**
- Creating a student requires a name, grade, at least one subject, and at
  least one weekly time slot; missing any of these blocks submission with
  a specific message.
- A parent only ever sees and edits their own students, never another
  family's.
- Editing a student's subjects or availability updates immediately and
  is reflected on the tutor side.
- Setting a max-weekly-sessions cap shows a "Fully booked" badge to
  tutors once approved claims reach that number.

**Edge cases**
- Removing a time slot that currently has a pending or approved claim on
  it auto-cancels that claim and notifies via the slot reopening, rather
  than leaving the tutor holding a booking for a time that no longer
  exists.
- Removing and re-adding the same slot preserves the old claim's history
  as a separate, distinct record (slots are soft-deleted, never hard
  deleted, so history is never lost).
- Once a student's pending-plus-approved claim count reaches their
  max-weekly-sessions cap, a tutor can no longer submit a new claim on
  any of that student's open slots — the slot still shows as open and
  claimable in the roster (the "Fully booked" badge only reflects
  approved sessions, not pending ones), but submitting fails with "this
  student has already reached their weekly session limit."
- The cap is still not enforced at approval time: an admin approving a
  claim that was already pending before the cap was reached, or before
  this check existed, can still push a student over the cap. The block
  is only on creating new pending claims, not on deciding existing ones.
- Leaving max-weekly-sessions blank means "no cap," and no "Fully booked"
  badge ever shows for that student.
- Submitting a non-positive or non-numeric max-weekly-sessions value is
  rejected with a validation message.
- A parent (or an admin, on a family's behalf) can delete a student.
  Deleting is a soft delete: the student drops out of the parent's list
  and tutor browsing immediately, but the tutee row and its claim history
  survive for the admin ledger, same pattern as a removed slot.
- Deleting a student with a pending or approved claim auto-cancels that
  claim first, so a tutor never ends up quietly holding a booking for a
  student that no longer exists.
- Deleting a student twice, or deleting one that's already gone, fails
  cleanly with "this student can no longer be removed" rather than a
  crash.

---

## 3. Tutor: browsing and claiming

**Important**
- Tutor can filter the student roster by grade and subject.
- Claiming an open slot requires picking one of the student's actual
  needed subjects; the claim is not tied to a subject the student doesn't
  need.
- A freshly claimed slot shows as pending immediately, and disappears
  from other tutors' "open" view.
- Once a director approves a claim, the tutor can see the family's email
  to coordinate.
- Tutor can cancel their own approved booking; the slot reopens for
  anyone to claim.
- Tutor can log hours (date, hours, who it was for) independent of
  whether that session traces back to a specific claim.
- Tutor can dismiss a cancelled or rejected claim off their own "My
  sessions" list. This only hides it from that tutor's view, the claim
  and its full history are untouched everywhere else, including the
  admin ledger.

**Edge cases**
- Two tutors claim the same open slot at nearly the same moment -> only
  one insert succeeds (unique constraint on slot + live claim), the
  other sees "someone just claimed this, try another one," not a crash
  or a double-booked slot.
- Tutor tries to claim a slot for a subject the student doesn't need ->
  rejected with a specific message, not a silent no-op.
- Tutor tries to cancel a claim that isn't theirs, or isn't approved
  (e.g. still pending, or already cancelled/rejected) -> rejected; the
  RLS policy only allows a tutor to cancel their own approved claims.
- Tutor tries to dismiss a claim that isn't theirs, or is still pending
  or approved -> rejected; dismissing only applies to their own claims
  once cancelled or rejected, an active booking can't be hidden this way.
- Tutor tries to view another tutor's claimed-but-not-yet-approved slot
  details -> not exposed; contact info only unlocks after approval, and
  only for the tutor on that specific claim.
- Slot the tutor is viewing gets removed by the parent while the claim
  form is open -> submission fails cleanly ("that slot no longer
  exists"), not a broken insert.
- Logging hours with 0, negative, or over 24 hours in a day is rejected.
- Logging hours with no student label or no date is rejected.

---

## 4. Admin: approvals and moderation

**Important**
- Admin sees all pending claims across all families and can approve or
  reject each one.
- Approving a claim books the slot and unlocks contact info both ways
  (tutor sees parent email, parent sees tutor email/name).
- Rejecting a claim reopens the slot; the rejected claim stays in history,
  it is not deleted.
- Admin can force-cancel any booking (pending, approved, or otherwise),
  optionally with a reason, and the slot reopens.
- Admin can promote or demote any user's role (parent/tutor/admin).
- Admin can dismiss a cancelled/rejected claim on the ledger, and a
  deleted student on "All students," once they've been dealt with. Both
  move into a collapsed "Dismissed" panel on that same page rather than
  disappearing, closed by default, opened with one click when a director
  wants to look back. Shared across every admin account, and the
  underlying data is untouched either way, the same claim history stays
  fully visible in the ledger regardless of whether the student behind it
  has been dismissed from the students table.

**Edge cases**
- New pending claims are blocked once a student hits their cap (see
  section 2), but approval itself still isn't gated: a claim that was
  already pending when the cap was reached can still be approved,
  pushing the student's booked count past the cap.
- Admin tries to change their own role -> explicitly rejected ("ask
  another admin"), so a lone admin can never lock themselves out.
- Non-admin (parent or tutor) attempts any admin action directly (role
  change, force-cancel, subject edit, tutor-code edit) -> rejected at the
  database level (RLS), not just hidden in the UI.
- Force-cancelling a claim that's already cancelled or rejected -> no
  error, but no meaningful state change either; history is untouched.
- Deactivating a subject leaves it visible (greyed out) wherever it's
  already assigned to a student, but hidden from new-subject pickers.
- Deactivating a tutor sign-up code blocks new signups with that code
  immediately, without affecting tutors who already signed up with it.
- Renaming a subject or reusing an existing subject/code name -> rejected
  with a specific "already exists" message (unique constraint).
- Dismissing a claim that's still pending or approved, or a student that
  hasn't been deleted -> rejected; dismiss only applies to claims already
  cancelled/rejected and students already soft-deleted.

---

## 5. Access control (cross-role)

**Important**
- A parent can never query or see another family's students, slots, or
  claims, even by guessing an ID directly against the database.
- A tutor can never see a family's contact info before their claim on
  that family is approved.
- Every table enforces this at the Postgres row-level-security layer, not
  just by what the UI happens to render — this is true even for
  hand-crafted requests that skip the UI entirely.

**Edge cases**
- Logged-out (anonymous) request to any dashboard data table returns
  nothing, not an error that leaks structure.
- A demoted admin (now parent or tutor) immediately loses admin-only
  access on their very next request, no stale session privilege.
- A tutor code lookup during signup can confirm validity without ever
  exposing the list of codes or how many exist, even to a failed request.

---

## 6. Data integrity

**Important**
- Claims are never hard-deleted; every approval, rejection, and
  cancellation is kept as permanent history.
- A slot's displayed status (open / pending / booked) always matches
  exactly one live claim, never more than one.

**Edge cases**
- A student's subject or slot is removed while it has claim history ->
  the historical claims still reference valid rows and still display
  correctly in the admin ledger, even though the subject/slot itself is
  now inactive.
- Two overlapping requests modify the same slot's availability at once
  (e.g. parent edits schedule while a claim is mid-submit) -> the unique
  active-slot constraint prevents duplicate active slots for the same
  day/time.
