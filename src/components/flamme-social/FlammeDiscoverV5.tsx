import { useState } from "react";
import { CalendarDays, Compass, Users } from "lucide-react";
import { Card, cx, type Profile } from "./social-v2-shared";
import { EventsViewV2, PeopleViewV2 } from "./FlammeSocialCommunityV2";

export function FlammeDiscoverV5({ me, onProfile }: { me: Profile; onProfile?: (profile: Profile) => void }) {
  const [tab, setTab] = useState<"people" | "events">("people");
  return <div className="space-y-2">
    <Card className="overflow-hidden p-0">
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CE654B]/10 text-[#CE654B]"><Compass className="h-5 w-5" /></span>
          <div className="min-w-0"><h1 className="text-lg font-extrabold dark:text-white">Découvrir</h1><p className="text-[11px] leading-relaxed text-slate-500">Né autour du scoutisme, Flamme est aujourd’hui ouvert à tous les centres d’intérêt.</p></div>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-black/[.06] dark:border-white/10">
        <button onClick={() => setTab("people")} className={cx("relative flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold", tab === "people" ? "text-[#CE654B]" : "text-slate-500")}><Users className="h-4 w-4" />Personnes{tab === "people" && <span className="absolute inset-x-6 bottom-0 h-0.5 bg-[#CE654B]" />}</button>
        <button onClick={() => setTab("events")} className={cx("relative flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold", tab === "events" ? "text-[#CE654B]" : "text-slate-500")}><CalendarDays className="h-4 w-4" />Événements{tab === "events" && <span className="absolute inset-x-6 bottom-0 h-0.5 bg-[#CE654B]" />}</button>
      </div>
    </Card>
    <div className={tab === "people" ? "flamme-discover-people-v5" : ""}>
      {tab === "people" ? <PeopleViewV2 me={me} mode="discover" onProfile={onProfile} /> : <EventsViewV2 me={me} />}
    </div>
    <style>{`.flamme-discover-people-v5 > div > section:first-child{display:none!important}`}</style>
  </div>;
}
