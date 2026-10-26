-- Narrow security-definer check for duplicate emails, since signUp hides them.

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
