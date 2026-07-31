-- Supabase Auth's signUp deliberately returns a fake success (no error, no
-- session) for an email that's already registered, to prevent enumeration.
-- That's the wrong trade-off for this app: it already auto-confirms every
-- account (0002) specifically to avoid any email-dependent step, and for a
-- small trust-based club, telling a returning parent "an account with this
-- email already exists, try logging in" is far more useful than a fake
-- "check your inbox" message for a confirmation email that will never
-- arrive. Mirrors the is_valid_tutor_code pattern: a narrow security
-- definer function so an unauthenticated signup request can check this
-- without any broader read access to `profiles`.

begin;

create function is_email_registered(input_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where lower(email) = lower(input_email)
  );
$$;

grant execute on function is_email_registered(text) to anon, authenticated;

commit;
