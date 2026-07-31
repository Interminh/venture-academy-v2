-- Dev-only: manually confirms every existing account so you can log in
-- immediately, without waiting on Supabase's email rate limit. Once you've
-- turned off "Confirm email" in Authentication settings, new signups won't
-- need this at all.
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;
