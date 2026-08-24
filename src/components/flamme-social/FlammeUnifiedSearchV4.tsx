import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  BookOpen,
  CalendarDays,
  Cloud,
  CloudSun,
  ContactRound,
  ExternalLink,
  Globe,
  HeartHandshake,
  History,
  Images,
  LibraryBig,
  Mail,
  Map,
  MessageCircleMore,
  MessageSquareLock,
  MessagesSquare,
  Mic,
  Music2,
  Navigation,
  Newspaper,
  RadioTower,
  Search,
  Sparkles,
  Tv,
  Video,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { FlammeMistralChat } from "@/components/flamme/FlammeMistralChat";
import { FlammeWordmark } from "@/components/flamme/FlammeWordmark";
import { useCarouselNudge } from "@/components/flamme/useCarouselNudge";
import { FlammeNewsList, FlammeNewsRefresh, FlammeNewsSkeleton, formatUpdatedAt } from "@/components/flamme/FlammeNews";
import { getFlammeNews } from "@/lib/flamme-news.functions";
import type { FlammeNewsItem } from "@/lib/flamme-news-types";
import { ALL_LAYERS, SEARCH_ENGINE_LABELS, readNewsLayers, readSearchEngine, selectNewsFeed, writeSearchEngine, type SearchEngine } from "@/lib/flamme-prefs";
import { cx } from "./social-v2-shared";

type SearchType = "all" | "news" | "images" | "videos" | "maps";
type PanelKey = "radio" | "tv" | "mail" | "messages" | "forum" | "useful" | "routes" | "music" | "ai" | "good";
type Service = { name:string; description:string; url:string; icon:typeof Search; accent:string; panel?:PanelKey; keywords?:string[] };
type QuickLink = { name:string; description:string; url:string; host:string; icon:typeof Search; accent:string };
type Suggestion = { id:string; value:string; label:string; icon:typeof Search; description?:string; service?:Service };

const ACCENT = "#CE654B";
const services:Service[] = [
  {name:"Radio",description:"Radios & podcasts français",url:"#radio",icon:RadioTower,accent:"#c5221f",panel:"radio",keywords:["radio","podcast"]},
  {name:"TV",description:"Chaînes & replay français",url:"#tv",icon:Tv,accent:"#1d4ed8",panel:"tv",keywords:["tv","télé","replay"]},
  {name:"Mail",description:"Messageries e-mail françaises",url:"#mail",icon:Mail,accent:"#2b6cb0",panel:"mail",keywords:["mail","email"]},
  {name:"Messageries",description:"Messageries instantanées chiffrées",url:"#messageries",icon:MessageSquareLock,accent:"#0f766e",panel:"messages",keywords:["chat","messagerie"]},
  {name:"Réseaux",description:"Réseaux & forums français",url:"#reseaux",icon:MessagesSquare,accent:ACCENT,panel:"forum",keywords:["forum","réseau","communauté"]},
  {name:"Sites utiles",description:"Sites français du quotidien",url:"#sites-utiles",icon:LibraryBig,accent:"#0f766e",panel:"useful",keywords:["démarches","emploi","santé"]},
  {name:"Stockage",description:"Fichiers avec Mailo",url:"https://www.mailo.com/?language=fr&page=id",icon:Cloud,accent:"#0f766e"},
  {name:"Agenda",description:"Calendrier avec Mailo",url:"https://www.mailo.com/?language=fr&page=id",icon:CalendarDays,accent:"#2563eb"},
  {name:"Photos",description:"Photos avec Photoweb Cloud",url:"https://account.photowebcloud.fr/login.php",icon:Images,accent:"#e11d48"},
  {name:"Itinéraires",description:"Itinéraires & cartes françaises",url:"#itineraires",icon:Navigation,accent:"#7c3aed",panel:"routes",keywords:["itinéraire","trajet","gps"]},
  {name:"Annuaire",description:"PagesJaunes et PagesBlanches",url:"https://www.pagesjaunes.fr/",icon:ContactRound,accent:"#eab308"},
  {name:"Carte",description:"Cartes avec l’IGN",url:"https://cartes.gouv.fr/decouvrir/explorer-les-cartes/",icon:Map,accent:"#15803d"},
  {name:"Vidéo",description:"Avec Dailymotion",url:"https://www.dailymotion.com/fr",icon:Video,accent:"#111827"},
  {name:"Musique",description:"Musique en ligne française",url:"#musique",icon:Music2,accent:"#a21caf",panel:"music",keywords:["musique","deezer","qobuz"]},
  {name:"Livres",description:"Avec Vivlio",url:"https://www.vivlio.com/",icon:BookOpen,accent:"#c2410c"},
  {name:"IA",description:"Avec Mistral",url:"#ia-mistral",icon:Sparkles,accent:"#f97316",panel:"ai",keywords:["ia","mistral"]},
  {name:"Météo",description:"Prévisions avec Météo-France",url:"https://meteofrance.com/",icon:CloudSun,accent:"#0284c7"},
  {name:"Bonne action",description:"Solidarité & associations françaises",url:"#bonne-action",icon:HeartHandshake,accent:"#c2185b",panel:"good",keywords:["solidarité","association","bénévolat"]},
];

const panelLinks:Record<Exclude<PanelKey,"ai">,QuickLink[]> = {
  radio:[
    {name:"Radioplayer France",description:"Radios, webradios et podcasts français.",url:"https://www.radioplayer.fr/",host:"radioplayer.fr",icon:RadioTower,accent:"#c5221f"},
    {name:"France Inter",description:"Direct et podcasts de France Inter.",url:"https://www.radiofrance.fr/franceinter",host:"radiofrance.fr",icon:RadioTower,accent:"#c5221f"},
    {name:"RTL",description:"Radio, émissions et podcasts.",url:"https://www.rtl.fr/",host:"rtl.fr",icon:RadioTower,accent:"#c5221f"},
  ],
  tv:[
    {name:"france.tv",description:"France 2, 3, 4, 5 et franceinfo.",url:"https://www.france.tv/",host:"france.tv",icon:Tv,accent:"#1d4ed8"},
    {name:"TF1+",description:"Direct et replay du groupe TF1.",url:"https://www.tf1.fr/",host:"tf1.fr",icon:Tv,accent:"#0ea5e9"},
    {name:"ARTE",description:"Direct et replay culturel franco-allemand.",url:"https://www.arte.tv/fr/",host:"arte.tv",icon:Tv,accent:"#f97316"},
  ],
  mail:[
    {name:"Mailo",description:"Mail, agenda et cloud.",url:"https://www.mailo.com/fr/",host:"mailo.com",icon:Mail,accent:"#2b6cb0"},
    {name:"Laposte.net",description:"Messagerie du groupe La Poste.",url:"https://www.laposte.net/accueil",host:"laposte.net",icon:Mail,accent:"#1a73e8"},
  ],
  messages:[
    {name:"Olvid",description:"Messagerie française chiffrée.",url:"https://www.olvid.io/fr/",host:"olvid.io",icon:MessageSquareLock,accent:"#0f766e"},
    {name:"Skred",description:"Messagerie française orientée confidentialité.",url:"https://skred.mobi/",host:"skred.mobi",icon:MessageSquareLock,accent:"#1a73e8"},
    {name:"Treebal",description:"Messagerie chiffrée et écoresponsable.",url:"https://www.treebal.green/",host:"treebal.green",icon:MessageSquareLock,accent:"#15803d"},
  ],
  forum:[
    {name:"Piaille",description:"Communauté française du Fediverse.",url:"https://piaille.fr/",host:"piaille.fr",icon:MessageCircleMore,accent:"#6366f1"},
    {name:"Whaller",description:"Réseau social et communautés français.",url:"https://whaller.com/fr",host:"whaller.com",icon:MessagesSquare,accent:ACCENT},
    {name:"Copains d’avant",description:"Retrouver anciens camarades et connaissances.",url:"https://copainsdavant.linternaute.com/",host:"linternaute.com",icon:MessagesSquare,accent:"#0f766e"},
  ],
  useful:[
    {name:"Service-Public",description:"Démarches et informations administratives.",url:"https://www.service-public.gouv.fr/",host:"service-public.gouv.fr",icon:LibraryBig,accent:ACCENT},
    {name:"France Travail",description:"Emploi et démarches.",url:"https://www.francetravail.fr/accueil/",host:"francetravail.fr",icon:LibraryBig,accent:"#c2410c"},
    {name:"Doctolib",description:"Rendez-vous de santé.",url:"https://www.doctolib.fr/",host:"doctolib.fr",icon:LibraryBig,accent:"#2563eb"},
  ],
  routes:[
    {name:"Mappy",description:"Itinéraires voiture, transports et à pied.",url:"https://fr.mappy.com/",host:"mappy.com",icon:Navigation,accent:"#7c3aed"},
    {name:"ViaMichelin",description:"Itinéraires, coûts et cartes routières.",url:"https://www.viamichelin.fr/",host:"viamichelin.fr",icon:Map,accent:"#1d4ed8"},
    {name:"IGN",description:"Cartes officielles françaises.",url:"https://cartes.gouv.fr/",host:"cartes.gouv.fr",icon:Map,accent:"#15803d"},
  ],
  music:[
    {name:"Deezer",description:"Streaming musical et podcasts.",url:"https://www.deezer.com/fr/",host:"deezer.com",icon:Music2,accent:"#a21caf"},
    {name:"Qobuz",description:"Streaming et téléchargement haute qualité.",url:"https://www.qobuz.com/fr-fr/",host:"qobuz.com",icon:Music2,accent:"#0f766e"},
  ],
  good:[
    {name:"Restos du Cœur",description:"Aide alimentaire et bénévolat.",url:"https://www.restosducoeur.org/",host:"restosducoeur.org",icon:HeartHandshake,accent:"#c2185b"},
    {name:"Croix-Rouge française",description:"Aide humanitaire, secourisme et action sociale.",url:"https://www.croix-rouge.fr/",host:"croix-rouge.fr",icon:HeartHandshake,accent:"#c5221f"},
    {name:"Secours populaire",description:"Solidarité et lutte contre la précarité.",url:"https://www.secourspopulaire.fr/",host:"secourspopulaire.fr",icon:HeartHandshake,accent:"#0f766e"},
  ],
};

const searchTabs:Array<{name:string;type:SearchType}> = [
  {name:"Tous",type:"all"},{name:"Actualités",type:"news"},{name:"Images",type:"images"},{name:"Vidéos",type:"videos"},{name:"Cartes",type:"maps"},
];
const searchIcons:Record<SearchType,typeof Search> = {all:Search,news:Newspaper,images:Images,videos:Video,maps:Map};
const localSuggestions = ["actualités France","météo aujourd’hui","programme TV ce soir","résultats sportifs","itinéraire","traduction français anglais","intelligence artificielle française"];
const panelTitles:Record<PanelKey,string> = {radio:"Radios & podcasts français",tv:"Télévision française",mail:"Messageries e-mail",messages:"Messageries instantanées",forum:"Réseaux & forums français",useful:"Sites utiles en France",routes:"Itinéraires & cartes",music:"Musique en ligne",ai:"IA Mistral",good:"Bonne action"};

function fold(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
async function qwantSuggestions(query:string,signal:AbortSignal){
  try{const response=await fetch(`https://api.qwant.com/v3/suggest?q=${encodeURIComponent(query)}&locale=fr_FR&version=2`,{signal});if(!response.ok)return[];const payload=await response.json() as {data?:{items?:Array<{value?:string}>}};return (payload.data?.items??[]).map(item=>item.value??"").filter(Boolean).slice(0,6)}catch(error){if((error as Error).name==="AbortError")throw error;return[]}
}

export function FlammeUnifiedSearchV4({dark}:{dark:boolean}) {
  const [query,setQuery]=useState("");
  const [activeTab,setActiveTab]=useState<SearchType>("all");
  const [focused,setFocused]=useState(false);
  const [highlight,setHighlight]=useState(-1);
  const [history,setHistory]=useState<string[]>([]);
  const [remote,setRemote]=useState<string[]>([]);
  const [engine,setEngine]=useState<SearchEngine>("qwant");
  const [panel,setPanel]=useState<PanelKey|null>(null);
  const [voiceMessage,setVoiceMessage]=useState("");
  const [listening,setListening]=useState(false);
  const [news,setNews]=useState<FlammeNewsItem[]>([]);
  const [newsAt,setNewsAt]=useState<string|null>(null);
  const [newsLoading,setNewsLoading]=useState(true);
  const [newsFailed,setNewsFailed]=useState(false);
  const abortRef=useRef<AbortController|null>(null);
  const {controls:carouselNudge,markInteraction}=useCarouselNudge();
  const surface=dark?"bg-[#181b20] border-white/10":"bg-white border-black/[.08]";
  const muted=dark?"text-slate-400":"text-slate-500";
  const engineLabel=SEARCH_ENGINE_LABELS[engine];

  useEffect(()=>{setEngine(readSearchEngine());try{const stored=JSON.parse(localStorage.getItem("flamme-search-history")||"[]");if(Array.isArray(stored))setHistory(stored.filter((item):item is string=>typeof item==="string").slice(0,10))}catch{setHistory([])}},[]);
  const loadNews=useCallback(async()=>{setNewsLoading(true);try{const payload=await getFlammeNews({data:{region:null}});if(payload?.items?.length){setNews(payload.items);setNewsAt(payload.fetchedAt);setNewsFailed(false)}else setNewsFailed(true)}catch{setNewsFailed(true)}finally{setNewsLoading(false)}},[]);
  useEffect(()=>{void loadNews()},[loadNews]);
  useEffect(()=>{const raw=query.trim();abortRef.current?.abort();if(raw.length<2){setRemote([]);return}const controller=new AbortController();abortRef.current=controller;const timer=window.setTimeout(()=>void qwantSuggestions(raw,controller.signal).then(values=>{if(!controller.signal.aborted)setRemote(values)}),220);return()=>{window.clearTimeout(timer);controller.abort()}},[query]);
  useEffect(()=>setHighlight(-1),[query]);

  const suggestions=useMemo<Suggestion[]>(()=>{
    const q=fold(query);const rows:Suggestion[]=[];const seen=new Set<string>();const push=(row:Suggestion)=>{const key=fold(row.value);if(!key||seen.has(key))return;seen.add(key);rows.push(row)};
    history.filter(item=>!q||fold(item).includes(q)).slice(0,q?3:5).forEach(item=>push({id:`h-${item}`,value:item,label:item,icon:History}));
    remote.forEach(item=>push({id:`q-${item}`,value:item,label:item,icon:Globe}));
    if(q)services.filter(service=>fold(service.name).includes(q)||fold(service.description).includes(q)||(service.keywords??[]).some(key=>fold(key).includes(q))).slice(0,3).forEach(service=>push({id:`s-${service.name}`,value:service.name,label:service.name,description:service.description,icon:service.icon,service}));
    localSuggestions.filter(item=>!q||fold(item).includes(q)).slice(0,5).forEach(item=>push({id:`l-${item}`,value:item,label:item,icon:Search}));
    return rows.slice(0,10)
  },[history,query,remote]);

  const saveHistory=(value:string)=>{const clean=value.trim();if(!clean)return;setHistory(current=>{const next=[clean,...current.filter(item=>item!==clean)].slice(0,10);try{localStorage.setItem("flamme-search-history",JSON.stringify(next))}catch{}return next})};
  const chooseEngine=(next:SearchEngine)=>{setEngine(next);writeSearchEngine(next)};
  const go=(raw=query,type=activeTab)=>{const value=raw.trim();if(!value)return;saveHistory(value);const encoded=encodeURIComponent(value);if(type==="maps"){location.href=`https://cartes.gouv.fr/?q=${encoded}`;return}if(engine==="lilo"&&(type==="all"||type==="images")){location.href=type==="images"?`https://search.lilo.org/?q=${encoded}&tab=images`:`https://search.lilo.org/?q=${encoded}`;return}location.href=`https://www.qwant.com/?l=fr&t=${type}&q=${encoded}`};
  const submit=(event:FormEvent)=>{event.preventDefault();go()};
  const runSuggestion=(row:Suggestion)=>{if(row.service){if(row.service.panel){setPanel(row.service.panel);setFocused(false);return}window.open(row.service.url,"_blank","noopener,noreferrer");return}go(row.value)};
  const keyDown=(event:ReactKeyboardEvent<HTMLInputElement>)=>{if(!focused||!suggestions.length)return;if(event.key==="ArrowDown"){event.preventDefault();setHighlight(current=>(current+1)%suggestions.length)}else if(event.key==="ArrowUp"){event.preventDefault();setHighlight(current=>current<=0?suggestions.length-1:current-1)}else if(event.key==="Escape"){setFocused(false);setHighlight(-1)}else if(event.key==="Enter"&&highlight>=0){event.preventDefault();const row=suggestions[highlight];if(row)runSuggestion(row)}};
  const voice=()=>{if(listening)return;setVoiceMessage("");const Ctor=(window as typeof window & {SpeechRecognition?:new()=>any;webkitSpeechRecognition?:new()=>any}).SpeechRecognition||(window as typeof window & {webkitSpeechRecognition?:new()=>any}).webkitSpeechRecognition;if(!Ctor){setVoiceMessage("La recherche vocale n’est pas disponible sur ce navigateur.");return}const recognition=new Ctor();recognition.lang="fr-FR";recognition.interimResults=false;recognition.onstart=()=>setListening(true);recognition.onend=()=>setListening(false);recognition.onresult=(event:any)=>{const value=event?.results?.[0]?.[0]?.transcript||"";setListening(false);if(value){setQuery(value);go(value)}};recognition.onerror=()=>{setListening(false);setVoiceMessage("Impossible d’utiliser le micro pour le moment.")};try{recognition.start()}catch{setListening(false)}};
  const visibleNews=useMemo(()=>selectNewsFeed(news,readNewsLayers()||ALL_LAYERS,12),[news]);
  const sources=useMemo(()=>{const unique=[...new Set(visibleNews.map(item=>item.source).filter(Boolean))];return unique.length?`${unique.slice(0,3).join(" • ")}${unique.length>3?` +${unique.length-3}`:""}`:"Sources françaises"},[visibleNews]);
  const ActiveIcon=searchIcons[activeTab];

  return <div className={cx("flamme-original-search mx-auto min-h-[calc(100dvh-126px)] w-full overflow-x-hidden",dark?"bg-[#101216] text-white":"bg-[#F0F2F5] text-[#172638]")} style={{fontFamily:"Roboto, Arial, sans-serif"}}>
    <main className="mx-auto flex w-full max-w-[652px] flex-col px-4 pb-4 pt-2 sm:px-5 md:min-h-[calc(100dvh-210px)] md:justify-center md:pb-10 md:pt-0">
      <div className="mt-5 flex justify-center sm:mt-9 md:mt-0"><FlammeWordmark darkMode={dark}/></div>
      <form onSubmit={submit} className="mt-6">
        <div className={cx("relative mx-auto rounded-[26px] border transition-shadow",surface,focused?"shadow-[0_1px_8px_rgba(32,33,36,.25)]":"hover:shadow-[0_1px_6px_rgba(32,33,36,.16)]")}>
          <div className="flex h-[52px] items-center gap-1 px-3 sm:h-[46px] sm:gap-2 sm:px-4">
            <ActiveIcon className="h-5 w-5 shrink-0 text-slate-400"/>
            <input value={query} onChange={event=>setQuery(event.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>window.setTimeout(()=>{setFocused(false);setHighlight(-1)},140)} onKeyDown={keyDown} className="h-full min-w-0 flex-1 bg-transparent px-1 text-[16px] outline-none" placeholder={`Rechercher sur ${engineLabel}`} autoComplete="off"/>
            {query&&<button type="button" onClick={()=>setQuery("")} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400" aria-label="Effacer"><X className="h-4 w-4"/></button>}
            <button type="button" onClick={voice} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10" aria-label="Recherche vocale">{listening?<span className="flex gap-0.5"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#CE654B]"/><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#CE654B] [animation-delay:.15s]"/><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#CE654B] [animation-delay:.3s]"/></span>:<Mic className="h-5 w-5 text-[#CE654B]"/>}</button>
            <button type="button" onClick={()=>window.open("https://www.qwant.com/ai?l=fr","_blank","noopener,noreferrer")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10" aria-label="IA Qwant"><Sparkles className="h-5 w-5 text-orange-500"/></button>
          </div>
          {focused&&suggestions.length>0&&<ul className={cx("border-t pb-2 pt-1",dark?"border-white/10":"border-black/[.07]")}>{suggestions.map((row,index)=>{const Icon=row.icon;return <li key={row.id} className={cx("flex min-h-11 items-center",index===highlight?(dark?"bg-white/10":"bg-[#F0F2F5]"):dark?"hover:bg-white/5":"hover:bg-[#F7F7F8]")}><button type="button" onMouseDown={event=>event.preventDefault()} onMouseEnter={()=>setHighlight(index)} onClick={()=>runSuggestion(row)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 px-4 text-left text-[15px]"><Icon className="h-4 w-4 shrink-0 text-slate-400"/><span className="min-w-0 flex-1 truncate"><span className={row.service?"font-semibold":undefined}>{row.label}</span>{row.description&&<span className={muted}> — {row.description}</span>}</span></button>{history.includes(row.value)&&<button type="button" onMouseDown={event=>event.preventDefault()} onClick={()=>setHistory(current=>{const next=current.filter(item=>item!==row.value);localStorage.setItem("flamme-search-history",JSON.stringify(next));return next})} className="mr-2 flex h-9 w-9 items-center justify-center rounded-full text-slate-400"><X className="h-4 w-4"/></button>}</li>})}</ul>}
        </div>
      </form>
      {voiceMessage&&<p className="mt-2 text-center text-xs text-amber-600">{voiceMessage}</p>}
      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500"><span>Moteur :</span>{(["qwant","lilo"] as SearchEngine[]).map(item=><button key={item} onClick={()=>chooseEngine(item)} className={cx("rounded-full border px-3 py-1.5 font-semibold",dark?"border-white/15":"border-black/10",engine===item&&"border-[#CE654B] text-[#CE654B]")}>{SEARCH_ENGINE_LABELS[item]}</button>)}</div>
      <div className="-mx-4 mt-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden"><div className={cx("flex min-w-max gap-1 border-b",dark?"border-white/10":"border-black/[.08]")}>{searchTabs.map(tab=><button key={tab.type} type="button" onClick={()=>setActiveTab(tab.type)} className={cx("min-h-11 whitespace-nowrap border-b-2 px-4 text-[14px]",activeTab===tab.type?"border-[#CE654B] font-semibold text-[#CE654B]":`border-transparent ${muted}`)}>{tab.name}</button>)}</div></div>
      <div className="mt-5 hidden justify-center gap-3 md:flex"><button onClick={()=>go()} className={cx("h-9 rounded-lg border px-4 text-[14px] font-medium",dark?"border-white/10 bg-white/5":"border-black/[.06] bg-white")}>Recherche {engineLabel}</button><button onClick={()=>setPanel("ai")} className={cx("h-9 rounded-lg border px-4 text-[14px] font-medium",dark?"border-white/10 bg-white/5":"border-black/[.06] bg-white")}>IA</button></div>
      <nav aria-label="Services Flamme" onScroll={markInteraction} onPointerDown={markInteraction} className="-mx-4 mt-5 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><motion.div animate={carouselNudge} className="flex min-w-max gap-4 pb-3">{services.map(service=>{const Icon=service.icon;const inner=<><span className={cx("flex h-12 w-12 items-center justify-center rounded-full",dark?"bg-white/[.08]":"bg-white shadow-sm")} style={{color:service.accent}}><Icon className="h-5 w-5"/></span><span className="w-[68px] text-[12px] leading-tight line-clamp-2">{service.name}</span></>;return service.panel?<button key={service.name} type="button" onClick={()=>setPanel(service.panel!)} title={service.description} className="flex w-[68px] shrink-0 flex-col items-center gap-2 text-center">{inner}</button>:<a key={service.name} href={service.url} target="_blank" rel="noreferrer" title={service.description} className="flex w-[68px] shrink-0 flex-col items-center gap-2 text-center">{inner}</a>})}</motion.div></nav>
    </main>

    <section className="mx-auto w-full max-w-[720px] px-4 pb-10 md:hidden">
      <div className={cx("mb-4 flex items-end justify-between gap-3 border-b pb-3",dark?"border-white/10":"border-black/[.08]")}><div className="min-w-0"><h1 className="text-[21px] font-normal">Découvrir</h1><p className={cx("mt-1 truncate text-[12px]",muted)}>{visibleNews.length?`${sources} — ${formatUpdatedAt(newsAt)}`:"Actualités et sujets du moment"}</p></div><FlammeNewsRefresh onRefresh={()=>void loadNews()} loading={newsLoading} label="Actualiser" darkMode={dark}/></div>
      {newsLoading&&!visibleNews.length&&!newsFailed?<FlammeNewsSkeleton surface={surface} darkMode={dark}/>:visibleNews.length?<FlammeNewsList items={visibleNews} surface={surface} muted={muted} darkMode={dark}/>:<div className={cx("rounded-2xl border p-5 text-center text-sm",surface)}><Newspaper className="mx-auto h-7 w-7 text-[#CE654B]"/><strong className="mt-2 block">Actualités momentanément indisponibles</strong><a href="https://www.qwant.com/?l=fr&t=news&q=actualités" target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-[#CE654B]">Ouvrir Qwant Actualités</a></div>}
    </section>

    <footer className={cx("mt-auto border-t px-5 py-4 text-center text-[11px]",dark?"border-white/10 bg-[#181b20] text-slate-500":"border-black/[.06] bg-white text-slate-500")}><p>Flamme est une bêta indépendante. Les recherches sont fournies par Qwant ou Lilo ; les services restent fournis par leurs éditeurs respectifs.</p></footer>

    {panel&&<div className="fixed inset-0 z-[240] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true"><button type="button" aria-label="Fermer" onClick={()=>setPanel(null)} className="absolute inset-0 bg-black/45"/><div className={cx("relative max-h-[82dvh] w-full overflow-y-auto rounded-t-3xl border p-5 shadow-2xl sm:max-w-[560px] sm:rounded-3xl",surface)}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold">{panelTitles[panel]}</h2><button onClick={()=>setPanel(null)} className={cx("flex h-9 w-9 items-center justify-center rounded-full",dark?"bg-white/10":"bg-[#F0F2F5]")}><X className="h-5 w-5"/></button></div>{panel==="ai"?<FlammeMistralChat darkMode={dark}/>:<div className="space-y-2">{panelLinks[panel].map(link=>{const Icon=link.icon;return <a key={link.name} href={link.url} target="_blank" rel="noreferrer" className={cx("flex items-start gap-3 rounded-2xl border p-3",dark?"border-white/10 hover:bg-white/5":"border-black/[.07] bg-white hover:bg-[#F7F7F8]")}><span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full",dark?"bg-white/[.08]":"bg-[#F0F2F5]")} style={{color:link.accent}}><Icon className="h-5 w-5"/></span><span className="min-w-0 flex-1"><strong className="block text-sm">{link.name}</strong><span className={cx("mt-1 block text-xs leading-5",muted)}>{link.description}</span><span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#CE654B]"><ExternalLink className="h-3 w-3"/>{link.host}</span></span></a>})}</div>}</div></div>}
  </div>;
}
