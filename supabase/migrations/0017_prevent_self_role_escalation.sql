-- Trigger that blocks non-admins from changing their own role, closing a privilege escalation.

begin;

create function prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and auth_role() <> 'admin' then
    raise exception 'Only an admin can change a role.';
  end if;
  return new;
end;
$$;

create trigger prevent_self_role_escalation_trigger
  before update on profiles
  for each row execute function prevent_self_role_escalation();

commit;
