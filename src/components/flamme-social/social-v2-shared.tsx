import { useEffect, useState, type ReactNode } from "react";
import { BadgeCheck, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const socialDb = supabase as any;

export type SocialView = "home" | "feed" | "videos" | "groups" | "messages" | "discover" | "notifications" | "contacts" | "saved" | "events" | "search" | "profile" | "settings" | "flamme";
export type Profile = { id:string; handle:string; display_name:string; bio:string; avatar_path?:string|null; cover_path?:string|null; city?:string|null; website?:string|null; is_private:boolean; allow_messages:"everyone"|"contacts"|"nobody"; show_online?:boolean; last_seen_at?:string; created_at:string; is_verified?:boolean };
export type Post = { id:string; author_id:string; group_id?:string|null; content:string; kind:"post"|"video"; poll?:{ question?:string; options?:string[] }|null; visibility:"public"|"contacts"|"only_me"; created_at:string; updated_at:string; is_anonymous?:boolean; moderation_status?:"visible"|"review"|"hidden" };
export type Media = { id:string; post_id:string; path:string; bucket?:"flamme-media"|"flamme-private-media"; media_type:"image"|"video"; position:number };
export type CommentRow = { id:string; post_id:string; author_id:string; parent_id?:string|null; content:string; created_at:string; is_anonymous?:boolean; moderation_status?:"visible"|"review"|"hidden" };
export type ReactionRow = { id:string; post_id:string; user_id:string; reaction:"like"|"love"|"laugh"|"wow"|"sad"|"support" };
export type PollVote = { id:string; post_id:string; user_id:string; option_index:number };
export type GroupRow = { id:string; owner_id:string; name:string; description:string; image_path?:string|null; visibility:"public"|"private"|"invite"; created_at:string };
export type FollowRow = { id:string; follower_id:string; following_id:string; status:"pending"|"accepted" };
export type EventRow = { id:string; creator_id:string; group_id?:string|null; title:string; description:string; starts_at:string; place?:string|null; image_path?:string|null; visibility:"public"|"private"; created_at:string };
export type StoryRow = { id:string; author_id:string; text:string; background:string; visibility:"public"|"contacts"|"only_me"; created_at:string; expires_at:string; is_anonymous?:boolean; moderation_status?:"visible"|"review"|"hidden" };
export type StoryMedia = { id:string; story_id:string; path:string; bucket:"flamme-private-media"; media_type:"image"|"video" };

export function cx(...values:Array<string|false|null|undefined>) { return values.filter(Boolean).join(" "); }
export function dateLabel(value:string) { return new Date(value).toLocaleString("fr-FR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }); }
export function relativeLabel(value:string) { const ms=Date.now()-new Date(value).getTime(); const m=Math.max(0,Math.floor(ms/60000)); if(m<1)return "à l’instant"; if(m<60)return `${m} min`; const h=Math.floor(m/60); if(h<24)return `${h} h`; const d=Math.floor(h/24); return `${d} j`; }
export function safeExt(file:File) { const ext=(file.name.split(".").pop()||"bin").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,6); return ext||"bin"; }
export function isAllowedMedia(file:File) { return /^(image\/(jpeg|png|webp)|video\/(mp4|webm))$/.test(file.type) && file.size<=50*1024*1024; }
export function publicAvatarUrl(path?:string|null) { return path ? supabase.storage.from("flamme-avatars").getPublicUrl(path).data.publicUrl : null; }

export function socialErrorMessage(cause:unknown,fallback:string) {
  const raw = cause instanceof Error
    ? cause.message
    : cause && typeof cause === "object" && "message" in cause && typeof (cause as {message?:unknown}).message === "string"
      ? (cause as {message:string}).message
      : "";
  if (!raw) return fallback;
  const message = raw.toLowerCase();
  if (message.includes("row-level security") || message.includes("violates row-level security") || message.includes("42501")) return "Cette action est bloquée par les règles de sécurité. Rechargez la page puis réessayez.";
  if (message.includes("payload too large") || message.includes("maximum allowed size") || message.includes("file size")) return "Le fichier est trop volumineux pour être envoyé.";
  if (message.includes("mime") || message.includes("content type") || message.includes("not supported")) return "Ce format de fichier n’est pas pris en charge.";
  if (message.includes("duplicate key") || message.includes("already exists")) return "Cet élément existe déjà.";
  if (message.includes("network") || message.includes("fetch failed") || message.includes("failed to fetch")) return "Connexion interrompue. Vérifiez votre réseau puis réessayez.";
  if (message.includes("jwt") || message.includes("auth") || message.includes("session")) return "Votre session a expiré. Reconnectez-vous puis réessayez.";
  return raw.length > 240 ? fallback : raw;
}

export async function notify(userId:string, actorId:string, kind:string, entityType:string, entityId:string, payload:Record<string,unknown>={}) {
  if(!userId || userId===actorId) return;
  await socialDb.from("flamme_notifications").insert({ user_id:userId, actor_id:actorId, kind, entity_type:entityType, entity_id:entityId, payload }).then(()=>undefined,()=>undefined);
}

async function moderationToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function moderatePublicText(content:string, kind:string) {
  if(!content.trim()) return true;
  try {
    const token = await moderationToken();
    if (!token) return true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 6000);
    const response=await fetch("/api/flamme-social-moderate",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action:"preflight",content,kind,scope:"public"}),signal:controller.signal});
    window.clearTimeout(timer);
    const result=await response.json() as {available?:boolean;decision?:string;reason?:string};
    if(result.available && result.decision==="block") {
      window.alert(`Publication bloquée par la modération${result.reason?` : ${result.reason}`:"."}`);
      return false;
    }
    if(result.available && result.decision==="review") return window.confirm(`Le filtre de sécurité recommande une vérification${result.reason?` : ${result.reason}`:""}. Publier quand même ?`);
  } catch { /* Si l'IA est momentanément indisponible, les protections RLS restent actives. */ }
  return true;
}

export async function reportContent(targetType:string,targetId:string,details:string,reason="other") {
  try {
    const token=await moderationToken();
    if(!token) throw new Error("Session expirée.");
    const response=await fetch("/api/flamme-social-moderate",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action:"report",targetType,targetId,reason,details,scope:"public"})});
    const result=await response.json() as {ok?:boolean;ai?:{autoHide?:boolean;decision?:string};error?:string};
    if(!response.ok||!result.ok) throw new Error(result.error||"Signalement impossible.");
    return result;
  } catch(cause) {
    throw new Error(socialErrorMessage(cause,"Signalement impossible."));
  }
}

export function FlameMark({className="h-9 w-9"}:{className?:string}) { return <span className={cx("inline-flex shrink-0 items-center justify-center",className)}><img src="/flamme-social-logo.svg" alt="" aria-hidden="true" draggable={false} decoding="async" className="h-full w-full object-contain"/></span>; }

export function VerifiedName({profile,className}:{profile?:Profile|null;className?:string}) {
  return <span className={cx("inline-flex min-w-0 items-center gap-1",className)}><span className="truncate">{profile?.display_name??"Utilisateur Flamme"}</span>{profile?.is_verified&&<BadgeCheck aria-label="Compte officiel" className="h-[1em] w-[1em] shrink-0 fill-[#1877F2] text-white stroke-[2.5]"/>}</span>;
}

export function Avatar({profile,size="md",online=false}:{profile?:Profile|null;size?:"xs"|"sm"|"md"|"lg"|"xl";online?:boolean}) {
  const src=publicAvatarUrl(profile?.avatar_path); const sizes={xs:"h-7 w-7 text-[10px]",sm:"h-9 w-9 text-xs",md:"h-11 w-11 text-sm",lg:"h-16 w-16 text-xl",xl:"h-24 w-24 text-3xl"}[size];
  return <span className={cx("relative inline-flex shrink-0",sizes)}>{src?<img src={src} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full rounded-full object-cover ring-1 ring-black/5"/>:<span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#F9D7CA] to-[#F1B9A4] font-extrabold text-[#8B3F2E]">{profile?.display_name?.slice(0,1)?.toUpperCase()||"F"}</span>}{online&&<span className="absolute bottom-0 right-0 h-[27%] w-[27%] rounded-full border-2 border-white bg-emerald-500 dark:border-[#1d2026]"/>}</span>;
}

export function Card({children,className}:{children:ReactNode;className?:string}) { return <section className={cx("rounded-xl border border-black/[.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.06)] dark:border-white/10 dark:bg-[#181b20]",className)}>{children}</section>; }
export function Empty({icon:Icon=Home,title,text}:{icon?:typeof Home;title:string;text:string}) { return <Card className="p-8 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#CE654B]/10"><Icon className="h-6 w-6 text-[#CE654B]"/></span><strong className="mt-4 block text-[15px] text-slate-900 dark:text-white">{title}</strong><p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p></Card>; }

export function SecureMedia({bucket="flamme-media",path,type,className,controls=true,muted=false,autoPlay=false}:{bucket?:string;path:string;type:"image"|"video";className?:string;controls?:boolean;muted?:boolean;autoPlay?:boolean}) {
  const [url,setUrl]=useState<string|null>(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{let active=true;setUrl(null);setFailed(false);(async()=>{try{if(bucket==="flamme-media"){const next=supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;if(active)setUrl(next);return;}const {data,error}=await supabase.storage.from(bucket).createSignedUrl(path,3600);if(error)throw error;if(active)setUrl(data?.signedUrl??null);}catch{if(active)setFailed(true)}})();return()=>{active=false};},[bucket,path]);
  if(failed) return <div className={cx("flex items-center justify-center bg-slate-100 p-4 text-center text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400",className)}>Média indisponible.</div>;
  if(!url) return <div className={cx("animate-pulse bg-slate-200 dark:bg-white/10",className)}/>;
  return type==="video"
    ? <video src={url} controls={controls} muted={muted} autoPlay={autoPlay} playsInline preload="metadata" onError={()=>setFailed(true)} className={className}/>
    : <img src={url} alt="" loading="lazy" decoding="async" draggable={false} onError={()=>setFailed(true)} className={className}/>;
}

export function Modal({open,onClose,children,className}:{open:boolean;onClose:()=>void;children:ReactNode;className?:string}) {
  useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",onKey);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKey)}},[onClose,open]);
  if(!open)return null; return <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-3" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose()}}><div className={cx("max-h-[calc(100dvh-8px)] w-full max-w-xl overscroll-contain overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-[94dvh] sm:rounded-2xl dark:bg-[#181b20]",className)}>{children}</div></div>;
}
