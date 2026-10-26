-- Auto-confirms new accounts. Trade-off: emails aren't verified, which is fine for a trust-based club.

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
