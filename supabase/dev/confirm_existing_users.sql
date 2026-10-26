-- Dev only: confirms every existing account.
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;
