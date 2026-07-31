-- Auto-confirms every new account at signup, so login never depends on
-- clicking an email link or on the "Confirm email" toggle in the Supabase
-- dashboard (which moves around between dashboard redesigns and can be
-- awkward to find). Trade-off: anyone can register with an email address
-- they don't actually control, since there's no verification step anymore.
-- That's acceptable for a small, trust-based club tool where tutors need
-- a code from a director to sign up and parents are known to the club.
-- If you'd rather require real verification later (e.g. once this is
-- public-facing), drop this trigger and set up the dashboard toggle plus
-- a custom SMTP sender instead (see SETUP.md).

begin;

create function auto_confirm_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$;

create trigger auto_confirm_email_on_signup
  before insert on auth.users
  for each row execute function auto_confirm_email();

commit;
