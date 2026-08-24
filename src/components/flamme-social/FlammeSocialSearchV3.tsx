import { useEffect, useState } from "react";
import { MessageSquareText, Newspaper, Search, Users } from "lucide-react";
import { Avatar, Card, relativeLabel, socialDb, type Profile } from "./social-v2-shared";

type Topic = { id:string; author_id:string; title:string; body:string; category:string; updated_at:string };
type PostHit = { id:string; author_id:string; content:string; created_at:string };

export function SearchViewV3({ me, onProfile, onDiscussions }: { me:Profile; onProfile?:(profile:Profile)=>void; onDiscussions?:()=>void }) {
  const [query,setQuery]=useState("");
  const [people,setPeople]=useState<Profile[]>([]);
  const [topics,setTopics]=useState<Topic[]>([]);
  const [posts,setPosts]=useState<PostHit[]>([]);

  useEffect(()=>{
    const value=query.trim();
    if(value.length<2){setPeople([]);setTopics([]);setPosts([]);return;}
    const timer=window.setTimeout(async()=>{
      const escaped=value.replace(/[%_,()]/g,"");
      const [peopleResult,topicResult,postResult]=await Promise.all([
        socialDb.from("flamme_profiles").select("*").neq("id",me.id).or(`display_name.ilike.%${escaped}%,handle.ilike.%${escaped}%`).limit(12),
        socialDb.from("flamme_forum_topics").select("id,author_id,title,body,category,updated_at").or(`title.ilike.%${escaped}%,body.ilike.%${escaped}%`).order("updated_at",{ascending:false}).limit(12),
        socialDb.from("flamme_posts").select("id,author_id,content,created_at").ilike("content",`%${escaped}%`).order("created_at",{ascending:false}).limit(12),
      ]);
      setPeople((peopleResult.data??[]) as Profile[]);
      setTopics((topicResult.data??[]) as Topic[]);
      setPosts((postResult.data??[]) as PostHit[]);
    },220);
    return()=>window.clearTimeout(timer);
  },[me.id,query]);

  const ready=query.trim().length>=2;
  return <div className="space-y-2 sm:space-y-3">
    <Card className="p-3 sm:p-4">
      <h1 className="text-lg font-extrabold dark:text-white sm:text-xl">Recherche</h1>
      <label className="mt-3 flex min-w-0 items-center gap-2 rounded-xl bg-[#F0F2F5] px-3 py-2.5 dark:bg-white/[.06]"><Search className="h-5 w-5 shrink-0 text-slate-400"/><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Personnes, discussions, publications…" className="min-w-0 flex-1 bg-transparent text-[16px] outline-none dark:text-white"/></label>
    </Card>

    {ready&&<>
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b px-3 py-3 dark:border-white/10"><Users className="h-4 w-4 text-[#CE654B]"/><h2 className="text-sm font-extrabold dark:text-white">Personnes</h2></div>
        {people.map(profile=><button key={profile.id} onClick={()=>onProfile?.(profile)} className="flex w-full min-w-0 items-center gap-3 border-b px-3 py-3 text-left last:border-0 dark:border-white/10"><Avatar profile={profile} size="sm"/><span className="min-w-0 flex-1"><strong className="block truncate text-sm dark:text-white">{profile.display_name}</strong><span className="block truncate text-xs text-slate-500">@{profile.handle}</span></span></button>)}
        {!people.length&&<p className="px-3 py-4 text-xs text-slate-500">Aucun profil trouvé.</p>}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b px-3 py-3 dark:border-white/10"><MessageSquareText className="h-4 w-4 text-[#CE654B]"/><h2 className="text-sm font-extrabold dark:text-white">Discussions</h2></div>
        {topics.map(topic=><button key={topic.id} onClick={onDiscussions} className="block w-full min-w-0 border-b px-3 py-3 text-left last:border-0 dark:border-white/10"><strong className="block break-words text-sm dark:text-white">{topic.title}</strong><p className="mt-1 line-clamp-2 break-words text-xs text-slate-500">{topic.body}</p><span className="mt-1 block text-[10px] font-bold text-[#CE654B]">{topic.category} · activité {relativeLabel(topic.updated_at)}</span></button>)}
        {!topics.length&&<p className="px-3 py-4 text-xs text-slate-500">Aucune discussion trouvée.</p>}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b px-3 py-3 dark:border-white/10"><Newspaper className="h-4 w-4 text-[#CE654B]"/><h2 className="text-sm font-extrabold dark:text-white">Publications</h2></div>
        {posts.map(post=><div key={post.id} className="border-b px-3 py-3 last:border-0 dark:border-white/10"><p className="line-clamp-3 break-words text-sm text-slate-700 dark:text-slate-200">{post.content}</p><span className="mt-1 block text-[10px] text-slate-500">{relativeLabel(post.created_at)}</span></div>)}
        {!posts.length&&<p className="px-3 py-4 text-xs text-slate-500">Aucune publication trouvée.</p>}
      </Card>
    </>}
  </div>;
}
