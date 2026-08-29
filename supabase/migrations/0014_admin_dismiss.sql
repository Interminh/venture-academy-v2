-- Lets an admin clear cancelled/rejected claims off the ledger, and
-- deleted students off the "All students" table, once they've been dealt
-- with. Same visibility-only pattern as the tutor's dismiss feature: the
-- underlying row (claim status, history, or soft-deleted tutee) is never
-- touched, this only controls whether it shows up in these two admin
-- views. Shared across all admins, not per-account, whoever dismisses it
-- dismisses it for every director.
--
-- No new RLS policies needed: claims_update_admin and tutees_update
-- already grant admins full update rights on both tables.

begin;

alter table claims add column admin_dismissed_at timestamptz;
alter table tutees add column admin_dismissed_at timestamptz;

commit;
