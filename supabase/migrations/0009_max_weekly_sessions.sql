-- Lets a parent cap how many sessions a student should be booked into per
-- week. Null means "no cap set." Enforcement is deliberately UI-level (a
-- "Fully booked" badge once approved-claim count reaches the cap) rather
-- than a hard block on new claims. A family reaching the cap is a signal
-- for the parent/director to review, not a wall a tutor bounces off.

begin;

alter table tutees add column max_weekly_sessions smallint check (max_weekly_sessions > 0);

commit;
