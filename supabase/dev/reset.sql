-- Dev only: drops everything 0001_init.sql creates. Never run against real data.

begin;

drop view if exists tutor_visible_contacts;
drop view if exists slot_status;

drop table if exists claims cascade;
drop table if exists availability_slots cascade;
drop table if exists tutee_subjects cascade;
drop table if exists tutees cascade;
drop table if exists subjects cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
drop function if exists auth_role();

drop table if exists profiles cascade;

drop type if exists weekday;
drop type if exists claim_status;
drop type if exists user_role;

commit;
