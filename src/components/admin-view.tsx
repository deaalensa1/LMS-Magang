import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabel, type AppRole } from "@/hooks/use-auth";

type Module = {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  drive_url: string;
  position: number;
  published: boolean;
};

export function AdminView() {
  const queryClient = useQueryClient();

  const modulesQuery = useQuery({
    queryKey: ["admin-modules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("*").order("position");
      if (error) throw error;
      return (data ?? []) as Module[];
    },
  });
  const modules = modulesQuery.data ?? [];

  const reportsQuery = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const attemptsQuery = useQuery({
    queryKey: ["admin-attempts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("id, module_id, score, total, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, email, institution")
            .order("full_name"),
          supabase.from("user_roles").select("user_id, role"),
        ]);
      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;
      const roleByUser = new Map((roles ?? []).map((r) => [r.user_id, r.role as AppRole]));
      return (profiles ?? []).map((p) => ({
        ...p,
        role: roleByUser.get(p.id) ?? null,
      }));
    },
  });

  const setUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.rpc("set_user_role", {
        _target_user_id: userId,
        _new_role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role pengguna diubah.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // module form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const createModule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("modules").insert({
        title,
        description,
        drive_url: driveUrl,
        youtube_url: youtubeUrl,
        position: modules.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Materi ditambahkan.");
      setTitle("");
      setDescription("");
      setDriveUrl("");
      setYoutubeUrl("");
      queryClient.invalidateQueries({ queryKey: ["admin-modules"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Materi dihapus.");
      queryClient.invalidateQueries({ queryKey: ["admin-modules"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // quiz form
  const [quizModule, setQuizModule] = useState("");
  const [question, setQuestion] = useState("");
  const [opts, setOpts] = useState({ a: "", b: "", c: "", d: "" });
  const [correct, setCorrect] = useState("a");

  const createQuiz = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("quizzes").insert({
        module_id: quizModule,
        question,
        option_a: opts.a,
        option_b: opts.b,
        option_c: opts.c,
        option_d: opts.d,
        correct_option: correct,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kuis ditambahkan.");
      setQuestion("");
      setOpts({ a: "", b: "", c: "", d: "" });
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Kelola materi, kuis, dan pantau laporan peserta magang.
        </p>
      </div>

      <Tabs defaultValue="materi">
        <TabsList>
          <TabsTrigger value="materi">Materi</TabsTrigger>
          <TabsTrigger value="kuis">Kuis</TabsTrigger>
          <TabsTrigger value="laporan">Laporan</TabsTrigger>
          <TabsTrigger value="pengguna">Pengguna</TabsTrigger>
        </TabsList>

        <TabsContent value="materi" className="space-y-6 pt-6">
          <form
            className="glass grid gap-4 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              createModule.mutate();
            }}
          >
            <h2 className="font-semibold">Tambah materi</h2>
            <div className="space-y-2">
              <Label htmlFor="m-title">Judul</Label>
              <Input
                id="m-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-desc">Deskripsi</Label>
              <Textarea
                id="m-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="m-drive">Link Google Drive</Label>
                <Input
                  id="m-drive"
                  placeholder="https://drive.google.com/file/d/.../view"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-yt">Link YouTube (opsional)</Label>
                <Input
                  id="m-yt"
                  placeholder="https://youtu.be/..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="justify-self-start" disabled={createModule.isPending}>
              Simpan materi
            </Button>
          </form>

          <div className="space-y-3">
            {modules.map((m, i) => (
              <div
                key={m.id}
                className="glass flex items-start justify-between gap-4 rounded-2xl! p-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {i + 1}. {m.title}
                  </p>
                  <p className="text-muted-foreground line-clamp-2 text-xs">{m.description}</p>
                  <div className="mt-2 flex gap-2">
                    {m.drive_url && <Badge variant="secondary">Drive</Badge>}
                    {m.youtube_url && <Badge variant="secondary">YouTube</Badge>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteModule.mutate(m.id)}
                  aria-label="Hapus materi"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {modules.length === 0 && (
              <p className="text-muted-foreground text-sm">Belum ada materi.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="kuis" className="pt-6">
          <form
            className="glass grid gap-4 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (!quizModule) {
                toast.error("Pilih materi dulu.");
                return;
              }
              createQuiz.mutate();
            }}
          >
            <h2 className="font-semibold">Tambah pertanyaan kuis</h2>
            <div className="space-y-2">
              <Label>Materi</Label>
              <Select value={quizModule} onValueChange={setQuizModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih materi" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="q">Pertanyaan</Label>
              <Textarea
                id="q"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["a", "b", "c", "d"] as const).map((k) => (
                <div key={k} className="space-y-2">
                  <Label htmlFor={`opt-${k}`}>Opsi {k.toUpperCase()}</Label>
                  <Input
                    id={`opt-${k}`}
                    required
                    value={opts[k]}
                    onChange={(e) => setOpts((p) => ({ ...p, [k]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Jawaban benar</Label>
              <Select value={correct} onValueChange={setCorrect}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["a", "b", "c", "d"] as const).map((k) => (
                    <SelectItem key={k} value={k}>
                      {k.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="justify-self-start" disabled={createQuiz.isPending}>
              Simpan kuis
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="laporan" className="space-y-6 pt-6">
          <div className="glass p-6">
            <h2 className="font-semibold">Laporan mingguan mahasiswa</h2>
            <div className="mt-4 space-y-3">
              {(reportsQuery.data ?? []).map((r) => (
                <div key={r.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Minggu {r.week_number}</Badge>
                    <span className="text-sm font-semibold">{r.title || "Tanpa judul"}</span>
                    <Badge variant="secondary">{r.status}</Badge>
                  </div>
                  <a
                    href={r.report_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary mt-2 block text-xs break-all underline"
                  >
                    {r.report_url}
                  </a>
                  {r.notes && <p className="text-muted-foreground mt-2 text-xs">{r.notes}</p>}
                </div>
              ))}
              {(reportsQuery.data ?? []).length === 0 && (
                <p className="text-muted-foreground text-sm">Belum ada laporan masuk.</p>
              )}
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="font-semibold">Hasil kuis terbaru</h2>
            <div className="mt-4 space-y-2">
              {(attemptsQuery.data ?? []).map((a) => {
                const mod = modules.find((m) => m.id === a.module_id);
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border p-3 text-sm"
                  >
                    <span>{mod?.title ?? "Materi dihapus"}</span>
                    <Badge variant="secondary">
                      {a.score}/{a.total}
                    </Badge>
                  </div>
                );
              })}
              {(attemptsQuery.data ?? []).length === 0 && (
                <p className="text-muted-foreground text-sm">Belum ada pengerjaan kuis.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pengguna" className="space-y-6 pt-6">
          <div className="glass p-6">
            <h2 className="font-semibold">Kelola Pengguna</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Ubah role pengguna di sini, termasuk mengangkat admin baru — tidak perlu akses
              database.
            </p>
            <div className="mt-4 space-y-3">
              {(usersQuery.data ?? []).map((u) => (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{u.full_name || "(tanpa nama)"}</p>
                    <p className="text-muted-foreground text-xs">{u.email}</p>
                    {u.institution && (
                      <p className="text-muted-foreground text-xs">{u.institution}</p>
                    )}
                  </div>
                  <Select
                    value={u.role ?? ""}
                    onValueChange={(v) =>
                      setUserRole.mutate({ userId: u.id, role: v as AppRole })
                    }
                    disabled={setUserRole.isPending}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Belum ada role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smk">{roleLabel.smk}</SelectItem>
                      <SelectItem value="mahasiswa">{roleLabel.mahasiswa}</SelectItem>
                      <SelectItem value="admin">{roleLabel.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {(usersQuery.data ?? []).length === 0 && (
                <p className="text-muted-foreground text-sm">Belum ada pengguna terdaftar.</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
