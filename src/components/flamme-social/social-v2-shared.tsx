import { useEffect, useState, type ReactNode } from "react";
import { Flame, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const socialDb = supabase as any;

export type SocialView = "home" | "feed" | "videos" | "groups" | "messages" | "discover" | "notifications" | "contacts" | "saved" | "events" | "search" | "profile" | "settings";
export type Profile = { id:string; handle:string; display_name:string; bio:string; avatar_path?:string|null; cover_path?:string|null; city?:string|null; website?:string|null; is_private:boolean; allow_messages:"everyone"|"contacts"|"nobody"; show_online?:boolean; last_seen_at?:string; created_at:string };
export type Post = { id:string; author_id:string; group_id?:string|null; content:string; kind:"post"|"video"; poll?:{ question?:string; options?:string[] }|null; visibility:"public"|"contacts"|"only_me"; created_at:string; updated_at:string };
export type Media = { id:string; post_id:string; path:string; bucket?:"flamme-media"|"flamme-private-media"; media_type:"image"|"video"; position:number };
export type CommentRow = { id:string; post_id:string; author_id:string; parent_id?:string|null; content:string; created_at:string };
export type ReactionRow = { id:string; post_id:string; user_id:string; reaction:"like"|"love"|"laugh"|"wow"|"sad"|"support" };
export type PollVote = { id:string; post_id:string; user_id:string; option_index:number };
export type GroupRow = { id:string; owner_id:string; name:string; description:string; image_path?:string|null; visibility:"public"|"private"|"invite"; created_at:string };
export type FollowRow = { id:string; follower_id:string; following_id:string; status:"pending"|"accepted" };
export type EventRow = { id:string; creator_id:string; group_id?:string|null; title:string; description:string; starts_at:string; place?:string|null; image_path?:string|null; visibility:"public"|"private"; created_at:string };
export type StoryRow = { id:string; author_id:string; text:string; background:string; visibility:"public"|"contacts"|"only_me"; created_at:string; expires_at:string };
export type StoryMedia = { id:string; story_id:string; path:string; bucket:"flamme-private-media"; media_type:"image"|"video" };

export function cx(...values:Array<string|false|null|undefined>) { return values.filter(Boolean).join(" "); }
export function dateLabel(value:string) { return new Date(value).toLocaleString("fr-FR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }); }
export function relativeLabel(value:string) { const ms=Date.now()-new Date(value).getTime(); const m=Math.max(0,Math.floor(ms/60000)); if(m<1)return "à l’instant"; if(m<60)return `${m} min`; const h=Math.floor(m/60); if(h<24)return `${h} h`; const d=Math.floor(h/24); return `${d} j`; }
export function safeExt(file:File) { const ext=(file.name.split(".").pop()||"bin").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,6); return ext||"bin"; }
export function isAllowedMedia(file:File) { return /^(image\/(jpeg|png|webp)|video\/(mp4|webm))$/.test(file.type) && file.size<=50*1024*1024; }
export function publicAvatarUrl(path?:string|null) { return path ? supabase.storage.from("flamme-avatars").getPublicUrl(path).data.publicUrl : null; }

export async function notify(userId:string, actorId:string, kind:string, entityType:string, entityId:string, payload:Record<string,unknown>={}) {
  if(!userId || userId===actorId) return;
  await socialDb.from("flamme_notifications").insert({ user_id:userId, actor_id:actorId, kind, entity_type:entityType, entity_id:entityId, payload }).then(()=>undefined,()=>undefined);
}

export async function moderatePublicText(content:string, kind:string) {
  if(!content.trim()) return true;
  try {
    const response=await fetch("/api/flamme-social-moderate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content,kind,scope:"public"})});
    const result=await response.json() as {available?:boolean;decision?:string;reason?:string};
    if(result.available && result.decision==="review") return window.confirm(`Le filtre Mistral recommande une vérification${result.reason?` : ${result.reason}`:""}. Publier quand même ?`);
  } catch { /* L'IA est optionnelle, jamais une dépendance de sécurité. */ }
  return true;
}

export function FlameMark({className="h-9 w-9"}:{className?:string}) { return <span className={cx("inline-flex items-center justify-center rounded-[30%] bg-gradient-to-br from-[#F27A52] via-[#CE654B] to-[#A84D38] text-white shadow-sm",className)}><Flame className="h-[60%] w-[60%] fill-current"/></span>; }

export function Avatar({profile,size="md",online=false}:{profile?:Profile|null;size?:"xs"|"sm"|"md"|"lg"|"xl";online?:boolean}) {
  const src=publicAvatarUrl(profile?.avatar_path); const sizes={xs:"h-7 w-7 text-[10px]",sm:"h-9 w-9 text-xs",md:"h-11 w-11 text-sm",lg:"h-16 w-16 text-xl",xl:"h-24 w-24 text-3xl"}[size];
  return <span className={cx("relative inline-flex shrink-0",sizes)}>{src?<img src={src} alt="" className="h-full w-full rounded-full object-cover ring-1 ring-black/5"/>:<span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#F9D7CA] to-[#F1B9A4] font-extrabold text-[#8B3F2E]">{profile?.display_name?.slice(0,1)?.toUpperCase()||"F"}</span>}{online&&<span className="absolute bottom-0 right-0 h-[27%] w-[27%] rounded-full border-2 border-white bg-emerald-500 dark:border-[#1d2026]"/>}</span>;
}

export function Card({children,className}:{children:ReactNode;className?:string}) { return <section className={cx("rounded-[22px] border border-black/[.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.05)] dark:border-white/10 dark:bg-[#181b20]",className)}>{children}</section>; }
export function Empty({icon:Icon=Home,title,text}:{icon?:typeof Home;title:string;text:string}) { return <Card className="p-8 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#CE654B]/10"><Icon className="h-6 w-6 text-[#CE654B]"/></span><strong className="mt-4 block text-[15px] text-slate-900 dark:text-white">{title}</strong><p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p></Card>; }

export function SecureMedia({bucket="flamme-media",path,type,className,controls=true,muted=false,autoPlay=false}:{bucket?:string;path:string;type:"image"|"video";className?:string;controls?:boolean;muted?:boolean;autoPlay?:boolean}) {
  const [url,setUrl]=useState<string|null>(null);
  useEffect(()=>{let active=true;(async()=>{if(bucket==="flamme-media"){const next=supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;if(active)setUrl(next);return;}const {data}=await supabase.storage.from(bucket).createSignedUrl(path,3600);if(active)setUrl(data?.signedUrl??null);})();return()=>{active=false};},[bucket,path]);
  if(!url) return <div className={cx("animate-pulse bg-slate-200 dark:bg-white/10",className)}/>;
  return type==="video"?<video src={url} controls={controls} muted={muted} autoPlay={autoPlay} playsInline preload="metadata" className={className}/>:<img src={url} alt="" className={className}/>;
}

export function Modal({open,onClose,children,className}:{open:boolean;onClose:()=>void;children:ReactNode;className?:string}) {
  useEffect(()=>{if(!open)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[onClose,open]);
  if(!open)return null; return <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px]" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose()}}><div className={cx("max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-[26px] bg-white shadow-2xl dark:bg-[#181b20]",className)}>{children}</div></div>;
}
