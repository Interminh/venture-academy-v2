-- Opt-out for session emails, with a standalone token so unsubscribe links need no login.

begin;

alter table profiles add column notifications_enabled boolean not null default true;
alter table profiles add column unsubscribe_token uuid not null default gen_random_uuid();

alter table profiles add constraint profiles_unsubscribe_token_key unique (unsubscribe_token);

commit;
