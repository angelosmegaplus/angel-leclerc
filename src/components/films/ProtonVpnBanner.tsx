import { useState } from "react";
import { ExternalLink, ShieldCheck, X } from "lucide-react";

const PROTON_PLAY_URL = "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://play.google.com/store/apps/details%3Fid%3Dch.protonvpn.android%26hl%3Dfr%26referrer%3Dutm_source%253Dgoogle%2526utm_medium%253Dorganic%2526utm_term%253Dprotonvpn%26pcampaignid%3DAPPU_1_3tyEaub-CrqtkdUPgJLo6QY&ved=2ahUKEwjm5bSZnauWAxW6VqQEHQAJOm0Q44QBegQIJRAJ&usg=AOvVaw3p7YdszxHyYeUpgw_kuR50";

export function ProtonVpnBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:mx-0 sm:w-[420px]">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111214]/95 p-3.5 text-white shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-200">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-[-.02em]">Utilise Proton VPN</p>
          <p className="mt-0.5 text-[11px] text-white/45">Gratuit sur Google Play</p>
        </div>
        <a
          href={PROTON_PLAY_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-white/90"
        >
          Installer <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Fermer"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
