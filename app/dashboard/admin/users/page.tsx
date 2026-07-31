import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { TutorCodeForm } from "@/components/admin/TutorCodeForm";
import { TutorCodeRow } from "@/components/admin/TutorCodeRow";
import { UserRoleRow } from "@/components/admin/UserRoleRow";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: codes }, { data: profiles }] = await Promise.all([
    supabase.from("tutor_signup_codes").select("id, code, is_active").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name, email, role").order("display_name"),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Tutor sign-up codes</h1>
        <p className="mb-6 text-body">
          Share an active code with tutors and they can enter it at{" "}
          <code className="rounded bg-bg-soft px-1.5 py-0.5 font-mono text-sm">/signup</code>{" "}
          to register their own account. No invite email needed.
        </p>
        <Card className="mb-6 max-w-xl p-5">
          <TutorCodeForm />
        </Card>
        <Card className="max-w-xl p-5">
          {(codes ?? []).length === 0 && (
            <p className="py-4 text-center text-sm text-body">No codes yet. Add one above.</p>
          )}
          {(codes ?? []).map((c) => (
            <TutorCodeRow key={c.id} id={c.id} code={c.code} isActive={c.is_active} />
          ))}
        </Card>
      </div>

      <div>
        <h1 className="mb-1 font-heading text-2xl font-bold text-ink">All accounts</h1>
        <p className="mb-6 text-body">
          Change anyone&apos;s role directly. Useful for promoting a tutor to
          admin, or fixing a signup mistake.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-soft text-xs uppercase tracking-wide text-body">
                <th className="p-3">Account</th>
                <th className="p-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => (
                <UserRoleRow
                  key={p.id}
                  userId={p.id}
                  displayName={p.display_name}
                  email={p.email}
                  role={p.role}
                  isSelf={p.id === user!.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
