import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, FileText, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { youtubeEmbedUrl, driveEmbedUrl } from "@/components/app-shell";

type Module = {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  drive_url: string;
  position: number;
};

type Quiz = {
  id: string;
  module_id: string | null;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option?: string;
  position: number;
};

type Attempt = {
  id: string;
  module_id: string | null;
  score: number;
  total: number;
  created_at: string;
};

export function SmkView({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const modulesQuery = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, title, description, youtube_url, drive_url, position")
        .order("position");
      if (error) throw error;
      return (data ?? []) as Module[];
    },
  });

  const attemptsQuery = useQuery({
    queryKey: ["attempts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("id, module_id, score, total, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Attempt[];
    },
  });

  const modules = modulesQuery.data ?? [];
  const attempts = attemptsQuery.data ?? [];
  const active = modules.find((m) => m.id === activeId) ?? null;

  const quizzesQuery = useQuery({
    queryKey: ["quizzes", active?.id],
    enabled: !!active,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("module_id", active!.id)
        .order("position");
      if (error) throw error;
      return (data ?? []) as Quiz[];
    },
  });
  const quizzes = quizzesQuery.data ?? [];

  const submitQuiz = useMutation({
    mutationFn: async () => {
      const score = quizzes.filter((q) => answers[q.id] === q.correct_option).length;
      const { error } = await supabase.from("quiz_attempts").insert({
        user_id: userId,
        module_id: active!.id,
        score,
        total: quizzes.length,
        answers,
      });
      if (error) throw error;
      return { score, total: quizzes.length };
    },
    onSuccess: ({ score, total }) => {
      toast.success(`Nilai kamu: ${score}/${total}`);
      setAnswers({});
      setShowQuiz(false);
      queryClient.invalidateQueries({ queryKey: ["attempts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function attemptFor(moduleId: string) {
    return attempts.find((a) => a.module_id === moduleId);
  }

  // ---------- Daftar modul ----------
  if (!active) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Materi Magang</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pilih modul untuk membuka materi, lalu kerjakan kuisnya di akhir materi.
          </p>
        </div>

        {modulesQuery.isLoading && <p className="text-muted-foreground text-sm">Memuat materi…</p>}
        {!modulesQuery.isLoading && modules.length === 0 && (
          <p className="text-muted-foreground text-sm">Belum ada materi yang diterbitkan.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => {
            const done = attemptFor(m.id);
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveId(m.id);
                  setShowQuiz(false);
                  setAnswers({});
                }}
                className="glass group flex h-full flex-col p-5 text-left transition-transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {done ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {done.score}/{done.total}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Belum dikuis</Badge>
                  )}
                </div>
                <h2 className="mt-4 text-base font-semibold">{m.title}</h2>
                <p className="text-muted-foreground mt-1 line-clamp-3 text-sm">{m.description}</p>
                <div className="text-muted-foreground mt-4 flex items-center gap-3 text-xs">
                  {m.drive_url && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> Dokumen
                    </span>
                  )}
                  {m.youtube_url && (
                    <span className="flex items-center gap-1">
                      <PlayCircle className="h-3.5 w-3.5" /> Video
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- Detail modul ----------
  const lastAttempt = attemptFor(active.id);
  const index = modules.findIndex((m) => m.id === active.id);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => {
          setActiveId(null);
          setShowQuiz(false);
          setAnswers({});
        }}
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Semua materi
      </Button>

      <div className="glass space-y-6 p-6">
        <div>
          <p className="text-primary text-xs font-semibold tracking-widest uppercase">
            Modul {String(index + 1).padStart(2, "0")}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{active.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm whitespace-pre-line">
            {active.description}
          </p>
        </div>

        {active.drive_url && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Materi (Google Drive)</h2>
            <div className="bg-muted overflow-hidden rounded-xl border">
              <iframe
                key={`drive-${active.id}`}
                src={driveEmbedUrl(active.drive_url)}
                title={`Materi ${active.title}`}
                className="h-[600px] w-full"
                allow="autoplay"
              />
            </div>
            <a
              href={active.drive_url}
              target="_blank"
              rel="noreferrer"
              className="text-primary text-xs underline"
            >
              Buka materi di tab baru
            </a>
          </div>
        )}

        {active.youtube_url && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Video pembelajaran</h2>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                key={`yt-${active.id}`}
                src={youtubeEmbedUrl(active.youtube_url)}
                title={active.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {!active.drive_url && !active.youtube_url && (
          <p className="text-muted-foreground text-sm">Materi belum diunggah untuk modul ini.</p>
        )}
      </div>

      <div className="glass p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Kuis modul ini</h2>
            <p className="text-muted-foreground text-sm">
              {quizzesQuery.isLoading
                ? "Memuat kuis…"
                : quizzes.length === 0
                  ? "Belum ada kuis untuk materi ini."
                  : `${quizzes.length} pertanyaan pilihan ganda.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastAttempt && (
              <Badge variant="secondary">
                Nilai terakhir: {lastAttempt.score}/{lastAttempt.total}
              </Badge>
            )}
            {quizzes.length > 0 && !showQuiz && (
              <Button onClick={() => setShowQuiz(true)}>Kerjakan kuis</Button>
            )}
          </div>
        </div>

        {showQuiz && quizzes.length > 0 && (
          <form
            className="mt-6 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (Object.keys(answers).length < quizzes.length) {
                toast.error("Jawab semua pertanyaan dulu ya.");
                return;
              }
              submitQuiz.mutate();
            }}
          >
            {quizzes.map((q, i) => (
              <div key={q.id} className="space-y-3">
                <p className="text-sm font-semibold">
                  {i + 1}. {q.question}
                </p>
                <RadioGroup
                  value={answers[q.id] ?? ""}
                  onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  className="gap-2"
                >
                  {(["a", "b", "c", "d"] as const).map((opt) => (
                    <div key={opt} className="flex items-center gap-3">
                      <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                      <Label htmlFor={`${q.id}-${opt}`} className="text-sm font-normal">
                        {q[`option_${opt}` as const]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            <div className="flex gap-3">
              <Button type="submit" disabled={submitQuiz.isPending}>
                Kirim jawaban
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowQuiz(false)}>
                Batal
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
