import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Report = {
  id: string;
  week_number: number;
  title: string;
  report_url: string;
  notes: string | null;
  status: string;
  feedback: string | null;
  created_at: string;
};

export function MahasiswaView({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [week, setWeek] = useState("1");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const reportsQuery = useQuery({
    queryKey: ["weekly_reports", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_reports")
        .select("*")
        .order("week_number", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Report[];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weekly_reports").insert({
        user_id: userId,
        week_number: Number(week),
        title,
        report_url: url,
        notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Laporan mingguan terkirim.");
      setTitle("");
      setUrl("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["weekly_reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reports = reportsQuery.data ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <section className="glass h-fit p-6">
        <h1 className="text-lg font-semibold">Kirim laporan mingguan</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tempel tautan laporan (Google Docs, Drive, Notion, dll).
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="week">Minggu ke-</Label>
            <Input
              id="week"
              type="number"
              min={1}
              max={52}
              required
              value={week}
              onChange={(e) => setWeek(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Judul laporan</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Laporan Minggu 1 — Onboarding"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Link laporan</Label>
            <Input
              id="url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submit.isPending}>
            Kirim laporan
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Riwayat laporan
        </h2>
        {reportsQuery.isLoading && <p className="text-muted-foreground text-sm">Memuat…</p>}
        {!reportsQuery.isLoading && reports.length === 0 && (
          <p className="text-muted-foreground text-sm">Belum ada laporan terkirim.</p>
        )}
        {reports.map((r) => (
          <article key={r.id} className="glass p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">
                Minggu {r.week_number} — {r.title}
              </h3>
              <Badge variant={r.status === "reviewed" ? "default" : "secondary"}>
                {r.status === "reviewed" ? "Sudah ditinjau" : "Terkirim"}
              </Badge>
            </div>
            <a
              href={r.report_url}
              target="_blank"
              rel="noreferrer"
              className="text-primary mt-2 block text-sm break-all underline underline-offset-4"
            >
              {r.report_url}
            </a>
            {r.notes && <p className="text-muted-foreground mt-2 text-sm">{r.notes}</p>}
            {r.feedback && (
              <p className="bg-secondary mt-3 rounded-lg p-3 text-sm">
                <span className="font-semibold">Umpan balik admin: </span>
                {r.feedback}
              </p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
