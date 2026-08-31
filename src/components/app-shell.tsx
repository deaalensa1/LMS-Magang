import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { roleLabel, type AppRole } from "@/hooks/use-auth";

export function AppShell({
  role,
  fullName,
  children,
}: {
  role: AppRole | null;
  fullName: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="surface-grid min-h-screen">
      <header className="glass sticky top-3 z-10 mx-auto mt-3 max-w-6xl rounded-full! px-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-semibold">LMS Magang</span>
            {role && <Badge variant="secondary">{roleLabel[role]}</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground hidden text-sm sm:inline">{fullName}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Keluar
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

export function youtubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
    const id = parsed.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
    if (parsed.pathname.startsWith("/embed/")) return url;
  } catch {
    /* fall through */
  }
  return url;
}

export function driveEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("google.com")) return url;
    const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    const folderMatch = parsed.pathname.match(/\/drive\/folders\/([^/]+)/);
    if (folderMatch) return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`;
    if (parsed.pathname.includes("/document/") || parsed.pathname.includes("/presentation/") || parsed.pathname.includes("/spreadsheets/")) {
      return url.replace(/\/(edit|view)(\?[^#]*)?(#.*)?$/, "/preview");
    }
  } catch {
    /* fall through */
  }
  return url;
}
