# Panduan Deploy Mandiri LMS Magang

Panduan ini untuk menjalankan aplikasi sendiri (di luar Lovable) lengkap dengan database-nya, supaya kamu bebas mengubah kodenya.

## 1. Ambil kodenya

1. Di Lovable, hubungkan proyek ke **GitHub** (menu proyek → Connect to GitHub). Semua kode akan tersinkron otomatis dua arah.
2. Clone repo-nya di komputermu:
   ```bash
   git clone https://github.com/<username>/<repo>.git
   cd <repo>
   bun install   # atau: npm install
   ```

## 2. Buat database Supabase sendiri

1. Daftar/login di [supabase.com](https://supabase.com) → **New project** (gratis). Catat:
   - **Project URL** (Settings → API → Project URL)
   - **anon public key** (Settings → API → anon public)
   - **service_role key** (rahasia, jangan ditaruh di frontend)
2. Buka **SQL Editor** di dashboard Supabase, lalu jalankan isi file migrasi di folder `supabase/migrations/` **satu per satu sesuai urutan tanggal di nama file**:
   - `20260828025530_...sql` (tabel, role, RLS, data contoh)
   - `20260828025555_...sql`
   - `20260830044043_...sql`
3. Kalau mau cara otomatis: install [Supabase CLI](https://supabase.com/docs/guides/cli), lalu:
   ```bash
   supabase link --project-ref <id-proyek-kamu>
   supabase db push
   ```

## 3. Isi environment variables

Salin `.env.example` (atau `.env`) menjadi `.env.local` dan ganti nilainya dengan milik proyek Supabase barumu:

```env
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<anon key>"
SUPABASE_PROJECT_ID="<id proyek>"
VITE_SUPABASE_URL="https://xxxx.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key>"
VITE_SUPABASE_PROJECT_ID="<id proyek>"
```

Untuk menjalankan lokal: `bun run dev` → buka http://localhost:5173.

## 4. Deploy ke Vercel (gratis)

1. Push kode ke GitHub.
2. Di [vercel.com](https://vercel.com) → **Add New Project** → import repo GitHub-mu.
3. Framework preset: biarkan auto-detect (Vite).
4. Tambahkan semua environment variable di atas di **Settings → Environment Variables**.
5. Deploy. Setiap push ke branch utama akan otomatis ter-deploy ulang.

> Alternatif lain yang juga cocok untuk aplikasi ini: Netlify atau Cloudflare Pages (proyek ini dibundel dengan target Cloudflare).

## 5. Login dengan Google (opsional)

Kalau mau tombol "Lanjutkan dengan Google" berfungsi di deployment sendiri:

1. Buat OAuth Client di [Google Cloud Console](https://console.cloud.google.com) (Web application) dengan redirect URL: `https://<id-proyek>.supabase.co/auth/v1/callback`.
2. Di dashboard Supabase → **Authentication → Providers → Google**: aktifkan, isi Client ID & Secret.
3. Tambahkan domain Vercel-mu di **Authentication → URL Configuration → Redirect URLs**.

Tanpa ini, login email/password tetap jalan.

## 6. Membuat akun Admin pertama

Daftar lewat halaman `/auth` dengan peran apa pun, lalu ubah rolenya lewat SQL Editor Supabase:

```sql
insert into public.user_roles (user_id, role)
values ('<uuid-user-kamu>', 'admin')
on conflict do nothing;
```

(UUID user bisa dilihat di Authentication → Users.)

## Struktur kode singkat

| Bagian | File |
| --- | --- |
| Tema warna & efek kaca | `src/styles.css` |
| Halaman landing | `src/routes/index.tsx` |
| Login/daftar | `src/routes/auth.tsx` |
| Dashboard per peran | `src/routes/_authenticated/dashboard.tsx` |
| Tampilan siswa SMK | `src/components/smk-view.tsx` |
| Tampilan mahasiswa | `src/components/mahasiswa-view.tsx` |
| Tampilan admin | `src/components/admin-view.tsx` |
| Skema database | `supabase/migrations/` |
