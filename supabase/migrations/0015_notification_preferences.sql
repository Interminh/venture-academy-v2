-- Lets a parent or tutor opt out of session-notification emails (a claim
-- getting approved) without touching the separate, always-sent password
-- reset flow. unsubscribe_token is a standalone secret, not the user's
-- id, so the one-click link in an email can flip this off without the
-- recipient ever needing to be logged in, and without exposing anything
-- guessable.

begin;

alter table profiles add column notifications_enabled boolean not null default true;
alter table profiles add column unsubscribe_token uuid not null default gen_random_uuid();

alter table profiles add constraint profiles_unsubscribe_token_key unique (unsubscribe_token);

commit;
