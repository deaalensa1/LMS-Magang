import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "smk" | "mahasiswa";

export const roleLabel: Record<AppRole, string> = {
  admin: "Admin",
  smk: "Siswa SMK",
  mahasiswa: "Mahasiswa",
};

export type SessionInfo = {
  user: User | null;
  role: AppRole | null;
  fullName: string;
  institution: string | null;
};

export async function fetchSessionInfo(): Promise<SessionInfo> {
  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;
  if (!user) return { user: null, role: null, fullName: "", institution: null };

  const [{ data: roleRow }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id).limit(1).maybeSingle(),
    supabase.from("profiles").select("full_name, institution").eq("id", user.id).maybeSingle(),
  ]);

  return {
    user,
    role: (roleRow?.role as AppRole | undefined) ?? null,
    fullName: profile?.full_name || (user.email ?? ""),
    institution: profile?.institution ?? null,
  };
}

export function useAuth() {
  return useQuery({
    queryKey: ["session-info"],
    queryFn: fetchSessionInfo,
    staleTime: 30_000,
  });
}
