import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Cloud, CloudSun, ExternalLink, Images, Mail, Map, Mic, Music2, Navigation, Search, Sparkles, Tv, Video, X } from "lucide-react";
import { FlammeMistralChat } from "@/components/flamme/FlammeMistralChat";
import { SEARCH_ENGINE_LABELS, readSearchEngine, writeSearchEngine, type SearchEngine } from "@/lib/flamme-prefs";
import { Card, FlameMark, cx } from "./social-v2-shared";

type SearchType = "all" | "images" | "news" | "videos" | "maps";

type Service = { name:string; description:string; href:string; icon:typeof Search };

const SERVICES:Service[]=[
  {name:"Mail",description:"Mailo",href:"https://www.mailo.com/?language=fr&page=id",icon:Mail},
  {name:"Stockage",description:"Fichiers Mailo",href:"https://www.mailo.com/?language=fr&page=id",icon:Cloud},
  {name:"Agenda",description:"Calendrier Mailo",href:"https://www.mailo.com/?language=fr&page=id",icon:CalendarDays},
  {name:"Photos",description:"Photoweb Cloud",href:"https://account.photowebcloud.fr/login.php",icon:Images},
  {name:"Carte",description:"Cartes IGN",href:"https://cartes.gouv.fr/decouvrir/explorer-les-cartes/",icon:Map},
  {name:"Itinéraires",description:"Mappy",href:"https://fr.mappy.com/",icon:Navigation},
  {name:"Vidéo",description:"Dailymotion",href:"https://www.dailymotion.com/fr",icon:Video},
  {name:"Musique",description:"Deezer",href:"https://www.deezer.com/fr/",icon:Music2},
  {name:"TV",description:"France.tv",href:"https://www.france.tv/",icon:Tv},
  {name:"Météo",description:"Météo-France",href:"https://meteofrance.com/",icon:CloudSun},
];

const TABS:Array<[SearchType,string]>=[["all","Web"],["images","Images"],["news","Actualités"],["videos","Vidéos"],["maps","Cartes"]];

export function FlammeUnifiedSearchV4({dark}:{dark:boolean}){
  const [query,setQuery]=useState("");
  const [type,setType]=useState<SearchType>("all");
  const [engine,setEngine]=useState<SearchEngine>("qwant");
  const [aiOpen,setAiOpen]=useState(false);
  const [servicesOpen,setServicesOpen]=useState(false);
  const [voiceMessage,setVoiceMessage]=useState("");

  useEffect(()=>{setEngine(readSearchEngine())},[]);
  const label=SEARCH_ENGINE_LABELS[engine];
  const visible=useMemo(()=>servicesOpen?SERVICES:SERVICES.slice(0,6),[servicesOpen]);

  const chooseEngine=(next:SearchEngine)=>{setEngine(next);writeSearchEngine(next)};
  const go=(raw=query,searchType=type)=>{
    const value=raw.trim();if(!value)return;const encoded=encodeURIComponent(value);
    if(searchType==="maps"){location.href=`https://cartes.gouv.fr/?q=${encoded}`;return;}
    if(engine==="lilo"&&(searchType==="all"||searchType==="images")){location.href=searchType==="images"?`https://search.lilo.org/?q=${encoded}&tab=images`:`https://search.lilo.org/?q=${encoded}`;return;}
    location.href=`https://www.qwant.com/?l=fr&t=${searchType}&q=${encoded}`;
  };
  const submit=(event:FormEvent)=>{event.preventDefault();go()};
  const voice=()=>{
    setVoiceMessage("");
    const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!Recognition){setVoiceMessage("La recherche vocale n’est pas disponible sur ce navigateur.");return;}
    const recognition=new Recognition();recognition.lang="fr-FR";recognition.interimResults=false;recognition.maxAlternatives=1;
    recognition.onresult=(event:any)=>{const value=event?.results?.[0]?.[0]?.transcript||"";if(value){setQuery(value);go(value)}};
    recognition.onerror=()=>setVoiceMessage("Impossible d’utiliser le micro pour le moment.");
    try{recognition.start()}catch{setVoiceMessage("Impossible de démarrer le micro.")}
  };

  return <div className="mx-auto w-full max-w-4xl space-y-3 px-2 sm:px-0">
    <Card className="overflow-hidden p-4 sm:p-6">
      <div className="flex items-center gap-3"><FlameMark className="h-10 w-10"/><div className="min-w-0"><h1 className="text-xl font-extrabold tracking-tight dark:text-white sm:text-2xl">Flamme</h1><p className="truncate text-xs text-slate-500">Recherche, services et réseau social dans la même interface.</p></div></div>
      <form onSubmit={submit} className="mt-5 flex min-w-0 items-center gap-1 rounded-full border border-black/10 bg-[#F0F2F5] p-1.5 focus-within:border-[#CE654B] dark:border-white/10 dark:bg-white/[.07]">
        <Search className="ml-2 h-5 w-5 shrink-0 text-slate-400"/>
        <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Rechercher sur le Web…" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base outline-none placeholder:text-slate-400 dark:text-white"/>
        {query&&<button type="button" onClick={()=>setQuery("")} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400"><X className="h-4 w-4"/></button>}
        <button type="button" onClick={voice} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Recherche vocale"><Mic className="h-4 w-4"/></button>
        <button className="rounded-full bg-[#CE654B] px-4 py-2.5 text-xs font-extrabold text-white">Chercher</button>
      </form>
      {voiceMessage&&<p className="mt-2 text-xs text-amber-600">{voiceMessage}</p>}
      <div className="mt-3 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{TABS.map(([id,name])=><button key={id} onClick={()=>setType(id)} className={cx("shrink-0 rounded-full px-3 py-2 text-xs font-bold",type===id?"bg-[#CE654B]/12 text-[#CE654B]":"text-slate-500 hover:bg-black/5 dark:hover:bg-white/5")}>{name}</button>)}</div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span>Moteur :</span>{(["qwant","lilo"] as SearchEngine[]).map(item=><button key={item} onClick={()=>chooseEngine(item)} className={cx("rounded-full border px-2.5 py-1.5 font-bold dark:border-white/10",engine===item&&"border-[#CE654B] text-[#CE654B]")}>{SEARCH_ENGINE_LABELS[item]}</button>)}<span className="ml-auto hidden sm:inline">Recherche actuelle : {label}</span></div>
    </Card>

    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{visible.map(service=>{const Icon=service.icon;return <a key={service.name} href={service.href} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3 rounded-xl border border-black/[.06] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#181b20]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CE654B]/10 text-[#CE654B]"><Icon className="h-5 w-5"/></span><span className="min-w-0"><strong className="block truncate text-sm dark:text-white">{service.name}</strong><span className="block truncate text-[10px] text-slate-500">{service.description}</span></span><ExternalLink className="ml-auto hidden h-3 w-3 shrink-0 text-slate-300 sm:block"/></a>})}</div>
    <button onClick={()=>setServicesOpen(value=>!value)} className="w-full rounded-xl bg-white py-2.5 text-xs font-bold text-slate-500 shadow-sm dark:bg-[#181b20]">{servicesOpen?"Réduire les services":"Afficher tous les services"}</button>

    <Card className="p-3 sm:p-4"><button onClick={()=>setAiOpen(value=>!value)} className="flex w-full items-center gap-3 text-left"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10"><Sparkles className="h-5 w-5"/></span><span className="min-w-0 flex-1"><strong className="block text-sm dark:text-white">IA Mistral</strong><span className="block truncate text-[11px] text-slate-500">Poser une question sans quitter Flamme.</span></span><span className="text-xs font-bold text-[#CE654B]">{aiOpen?"Fermer":"Ouvrir"}</span></button>{aiOpen&&<div className="mt-4 border-t pt-4 dark:border-white/10"><FlammeMistralChat darkMode={dark}/></div>}</Card>
  </div>;
}
