import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { SmkView } from "@/components/smk-view";
import { MahasiswaView } from "@/components/mahasiswa-view";
import { AdminView } from "@/components/admin-view";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LMS Magang United Tractors" },
      {
        name: "description",
        content: "Akses materi magang, kuis, dan laporan mingguan di satu tempat.",
      },
      { property: "og:title", content: "Dashboard — LMS Magang United Tractors" },
      {
        property: "og:description",
        content: "Akses materi magang, kuis, dan laporan mingguan di satu tempat.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useAuth();

  const role = data?.role ?? null;
  const userId = data?.user?.id ?? "";

  return (
    <AppShell role={role} fullName={data?.fullName ?? ""}>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Memuat…</p>
      ) : role === "admin" ? (
        <AdminView />
      ) : role === "mahasiswa" ? (
        <MahasiswaView userId={userId} />
      ) : role === "smk" ? (
        <SmkView userId={userId} />
      ) : (
        <div className="bg-card rounded-2xl border p-8">
          <h1 className="text-lg font-semibold">Peran belum ditetapkan</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Hubungi admin untuk mendapatkan akses materi atau laporan.
          </p>
        </div>
      )}
    </AppShell>
  );
}
