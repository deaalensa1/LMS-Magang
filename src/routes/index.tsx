import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GraduationCap, PlayCircle, ClipboardList, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LMS Magang — Belajar & Lapor Magang dalam Satu Tempat" },
      {
        name: "description",
        content:
          "Platform LMS magang untuk siswa SMK dan mahasiswa: tonton materi video, kerjakan kuis, dan kirim laporan mingguan.",
      },
      { property: "og:title", content: "LMS Magang — Belajar & Lapor Magang dalam Satu Tempat" },
      {
        property: "og:description",
        content:
          "Materi video, kuis, dan laporan mingguan magang dalam satu platform dengan peran Admin, SMK, dan Mahasiswa.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: PlayCircle,
    title: "Materi video",
    body: "Siswa SMK menonton modul YouTube yang dikurasi admin, langsung di dalam platform.",
  },
  {
    icon: ClipboardList,
    title: "Kuis terstruktur",
    body: "Setiap modul punya kuis pilihan ganda dengan penilaian otomatis dan riwayat nilai.",
  },
  {
    icon: GraduationCap,
    title: "Laporan mingguan",
    body: "Mahasiswa mengirim tautan laporan tiap minggu, lengkap dengan catatan dan status.",
  },
  {
    icon: ShieldCheck,
    title: "Kontrol admin",
    body: "Admin mengelola materi, kuis, dan memantau seluruh laporan peserta magang.",
  },
];

function Landing() {
  return (
    <main className="min-h-screen surface-grid">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-semibold">LMS Magang</span>
        <Button asChild variant="outline">
          <Link to="/auth">Masuk</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase">
          Program magang terpandu
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-bold text-balance sm:text-6xl">
          Belajar, uji pemahaman, dan laporkan progres magang dalam satu platform.
        </h1>
        <p className="text-muted-foreground mt-6 max-w-2xl text-lg">
          Tiga peran, satu alur kerja: Admin menyusun materi, siswa SMK belajar lewat video dan
          kuis, mahasiswa mengirim laporan mingguan.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Mulai sekarang</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/dashboard">Buka dashboard</Link>
          </Button>
        </div>

        <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <article
              key={f.title}
              className="glass p-6 transition-transform hover:-translate-y-1"
            >
              <f.icon className="text-primary size-6" aria-hidden />
              <h2 className="mt-4 text-base font-semibold">{f.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{f.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
