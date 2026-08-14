import { createServerFn } from "@tanstack/react-start";
import { requireAngelAuth } from "@/lib/auth/require-angel-auth";
import { assertAngelAdmin } from "@/lib/auth/require-admin";
import { AngelOSAdapterRegistry } from "../../angel-os/core/adapter-registry";
import { angelDataServerAdapter, type AngelDataClient } from "../../angel-os/adapters/data.server";

export type NewsCategory = "une" | "politique" | "medias" | "journalisme" | "ia" | "dordogne" | "emploi";
export type NewsItem = { id: string; title: string; url: string; source: string; publishedAt: string | null; category: NewsCategory };
export type NewsPayload = { items: NewsItem[]; fetchedAt: string; source?: "live" | "cache" };

const NEWS_CACHE_KEY = "news_dashboard";
const adapters = new AngelOSAdapterRegistry();
adapters.register(angelDataServerAdapter);

const FEEDS: Array<{ category: Exclude<NewsCategory, "une">; query: string }> = [
  { category: "politique", query: "politique France société gouvernement élections souveraineté social" },
  { category: "medias", query: "radio médias France animateur radio podcast audiovisuel" },
  { category: "journalisme", query: "journalisme communication édition presse France" },
  { category: "ia", query: "intelligence artificielle technologie ChatGPT IA France web" },
  { category: "dordogne", query: "Sarlat Dordogne Périgord Bergerac Périgueux actualité" },
  { category: "emploi", query: "alternance communication emploi BTS communication radio média stage" },
];

const PREFERENCE_WEIGHTS: Array<{ pattern: RegExp; weight: number }> = [
  { pattern: /radio|animateur|antenne|podcast|audio|fm\b|audiovisuel/i, weight: 12 },
  { pattern: /journalis|presse|média|media|édition|editeur|rédaction/i, weight: 10 },
  { pattern: /communication|création|contenu|canva|marketing/i, weight: 8 },
  { pattern: /sarlat|dordogne|périgord|périgueux|bergerac/i, weight: 9 },
  { pattern: /alternance|apprentissage|bts|emploi|stage|recrut/i, weight: 9 },
  { pattern: /intelligence artificielle|\bia\b|chatgpt|openai|technolog|numérique|web/i, weight: 7 },
  { pattern: /politique|gouvernement|élection|assemblée|président|social|souverain/i, weight: 6 },
];
const CATEGORY_WEIGHT: Record<Exclude<NewsCategory, "une">, number> = { medias: 12, journalisme: 11, dordogne: 10, emploi: 10, politique: 7, ia: 7 };
const decodeXml = (value: string) => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
function tag(block: string, name: string): string { const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i")); return match ? decodeXml(match[1].trim()) : ""; }
function parseFeed(xml: string, category: Exclude<NewsCategory, "une">): NewsItem[] { const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []; return items.slice(0,18).map((block,index)=>{ const title=tag(block,"title").replace(/\s+-\s+[^-]+$/," ").trim(); const url=tag(block,"link"); const source=tag(block,"source")||"Google News"; const pubDate=tag(block,"pubDate"); const parsedDate=pubDate?new Date(pubDate):null; return {id:`${category}-${index}-${title}`,title,url,source,publishedAt:parsedDate&&!Number.isNaN(parsedDate.getTime())?parsedDate.toISOString():null,category}; }).filter((item)=>item.title&&item.url); }
async function loadFeed(feed:(typeof FEEDS)[number]):Promise<NewsItem[]>{ const url=`https://news.google.com/rss/search?q=${encodeURIComponent(feed.query)}&hl=fr&gl=FR&ceid=FR:fr`; const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),6500); try { const response=await fetch(url,{headers:{"User-Agent":"AngelOS-News/1.0",Accept:"application/rss+xml, application/xml, text/xml"},signal:controller.signal}); if(!response.ok)return[]; return parseFeed(await response.text(),feed.category);} catch{return[]} finally{clearTimeout(timeout);} }
async function readCache(context:any):Promise<NewsPayload|null>{ if(process.env.ANGEL_DATA_TOKEN){ try{ const data=await adapters.connect<AngelDataClient>('angel.data.native'); const cached=await data.get<NewsPayload>('cache.news',NEWS_CACHE_KEY); if(cached)return{...cached,source:'cache'};}catch(error){console.error('[Angel OS] news cache read failed',error);} } if(context.supabase){ const {data}=await context.supabase.from('angel_os_cache').select('payload, updated_at').eq('key',NEWS_CACHE_KEY).maybeSingle(); if(data?.payload){ const payload=data.payload as NewsPayload; return {...payload,fetchedAt:payload.fetchedAt||data.updated_at,source:'cache'}; } } return null; }
async function writeCache(context:any,payload:NewsPayload){ if(process.env.ANGEL_DATA_TOKEN){ try{ const data=await adapters.connect<AngelDataClient>('angel.data.native'); await data.set('cache.news',NEWS_CACHE_KEY,payload); return;}catch(error){console.error('[Angel OS] news cache write failed',error);} } if(context.supabase){ await context.supabase.from('angel_os_cache').upsert({key:NEWS_CACHE_KEY,payload,updated_at:new Date().toISOString()},{onConflict:'key'}); } }
function dedupe(items:NewsItem[]){ const seen=new Set<string>(); return items.sort((a,b)=>(b.publishedAt??'').localeCompare(a.publishedAt??'')).filter((item)=>{ const key=`${item.category}:${item.title.toLocaleLowerCase('fr').replace(/\W+/g,' ').trim()}`; if(!key||seen.has(key))return false; seen.add(key); return true;}); }
function preferenceScore(item:NewsItem){ const text=`${item.title} ${item.source}`; let score=item.category==='une'?0:CATEGORY_WEIGHT[item.category]; for(const rule of PREFERENCE_WEIGHTS){if(rule.pattern.test(text))score+=rule.weight;} if(item.publishedAt){const ageHours=Math.max(0,(Date.now()-new Date(item.publishedAt).getTime())/3_600_000); score+=Math.max(0,12-ageHours/3);} return score; }
function buildPersonalizedHeadlines(items:NewsItem[]):NewsItem[]{ const seenTitles=new Set<string>(); const ranked=[...items].sort((a,b)=>preferenceScore(b)-preferenceScore(a)).filter((item)=>{const key=item.title.toLocaleLowerCase('fr').replace(/\W+/g,' ').trim(); if(!key||seenTitles.has(key))return false; seenTitles.add(key); return true;}); const selected:NewsItem[]=[]; const perCategory=new Map<NewsCategory,number>(); for(const item of ranked){const count=perCategory.get(item.category)??0;if(count>=3)continue;selected.push({...item,id:`une-${item.id}`,category:'une'});perCategory.set(item.category,count+1);if(selected.length>=12)break;}return selected; }
function finalize(items:NewsItem[]){ const topical=dedupe(items.filter((item)=>item.category!=='une')); const headlines=buildPersonalizedHeadlines(topical); return [...headlines,...topical]; }

export const getAdminNews=createServerFn({method:'GET'}).middleware([requireAngelAuth]).handler(async({context}):Promise<NewsPayload>=>{ await assertAngelAdmin(context); const cached=await readCache(context); const groups=await Promise.all(FEEDS.map(loadFeed)); const liveItems=finalize(groups.flat()); if(liveItems.length===0)return cached??{items:[],fetchedAt:new Date().toISOString(),source:'cache'}; const liveCategories=new Set(liveItems.filter((item)=>item.category!=='une').map((item)=>item.category)); const cachedFill=(cached?.items??[]).filter((item)=>item.category!=='une'&&!liveCategories.has(item.category)); const merged=finalize([...liveItems.filter((item)=>item.category!=='une'),...cachedFill]); const payload:NewsPayload={items:merged,fetchedAt:new Date().toISOString(),source:'live'}; await writeCache(context,payload); return payload; });
export async function fetchAdminNewsSnapshot():Promise<NewsPayload>{ const groups=await Promise.all(FEEDS.map(loadFeed)); const items=finalize(groups.flat()); if(items.length===0)throw new Error('Actualités indisponibles'); return {items,fetchedAt:new Date().toISOString(),source:'live'}; }
