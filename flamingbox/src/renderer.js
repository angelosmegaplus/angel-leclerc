const HOME = 'https://www.google.com/';
const SEARCH = 'https://www.google.com/search?q=';
const state = { tabs: [], activeId: null, bookmarks: [], history: [], settings: { home: HOME, blockTrackers: true, httpsFirst: true } };
const $ = (id) => document.getElementById(id);
const tabsEl = $('tabs');
const viewport = $('viewport');
const address = $('address');
const panel = $('panel');

function uid(){ return `t${Date.now()}${Math.random().toString(16).slice(2)}`; }
function active(){ return state.tabs.find(t => t.id === state.activeId); }
function escapeHTML(v=''){ return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function normalizeInput(raw){
  const v=raw.trim();
  if(!v) return state.settings.home || HOME;
  if(/^(https?:\/\/)/i.test(v)) return v;
  if(/^(?:[\w-]+\.)+[a-z]{2,}(?:\/|$)/i.test(v)) return `https://${v}`;
  return `${SEARCH}${encodeURIComponent(v)}`;
}

function createTab(url = state.settings.home || HOME, opts = {}){
  const id=uid();
  const tab={id,title:opts.private?'Privé':'Nouvel onglet',url,private:!!opts.private};
  const w=document.createElement('webview');
  w.className='webview';
  w.setAttribute('partition', opts.private ? `temporary:${id}` : 'persist:flamingbox');
  w.setAttribute('allowpopups','false');
  w.src=url;
  tab.webview=w;
  viewport.appendChild(w);
  state.tabs.push(tab);
  wireWebview(tab);
  activateTab(id);
  renderTabs();
  return tab;
}

function wireWebview(tab){
  const w=tab.webview;
  const sync=()=>{
    try{tab.url=w.getURL()||tab.url;}catch{}
    try{tab.title=w.getTitle()||tab.url||'FlamingBox';}catch{}
    if(state.activeId===tab.id){address.value=tab.url||'';updateSecurity(tab.url||'');}
    renderTabs();
  };
  w.addEventListener('did-start-loading',sync);
  w.addEventListener('did-stop-loading',async()=>{sync();if(!tab.private&&/^https?:\/\//i.test(tab.url||'')){await window.flamingbox.addHistory({url:tab.url,title:tab.title});await loadData();}});
  w.addEventListener('page-title-updated',sync);
  w.addEventListener('did-fail-load',()=>sync());
}

function activateTab(id){
  state.activeId=id;
  for(const t of state.tabs)t.webview.classList.toggle('active',t.id===id);
  const t=active();address.value=t?.url||'';updateSecurity(t?.url||'');updateBookmarkButton();renderTabs();
}
function closeTab(id){
  const i=state.tabs.findIndex(t=>t.id===id);if(i<0)return;
  const [t]=state.tabs.splice(i,1);t.webview.remove();
  if(!state.tabs.length){createTab();return;}
  activateTab(state.tabs[Math.max(0,i-1)]?.id||state.tabs[0].id);
}
function renderTabs(){
  tabsEl.innerHTML='';
  for(const t of state.tabs){
    const b=document.createElement('button');b.className=`tab ${t.id===state.activeId?'active':''}`;
    b.innerHTML=`<span>${t.private?'◉':'●'}</span><span class="tab-title">${escapeHTML(t.title||'Nouvel onglet')}</span><span class="tab-close">×</span>`;
    b.onclick=(e)=>e.target.classList.contains('tab-close')?closeTab(t.id):activateTab(t.id);
    tabsEl.appendChild(b);
  }
}
function updateSecurity(url){
  const secure=/^https:\/\//i.test(url);$('security').style.color=secure?'#58d68d':'#f4b942';$('security').title=secure?'Connexion HTTPS':'Connexion non chiffrée ou page locale';
}
async function toggleBookmark(){
  const t=active();if(!t?.url)return;
  const r=await window.flamingbox.toggleBookmark({url:t.url,title:t.title});state.bookmarks=r.bookmarks||[];updateBookmarkButton();renderLibrary();
}
function updateBookmarkButton(){const t=active();$('bookmark').textContent=t&&state.bookmarks.some(b=>b.url===t.url)?'★':'☆';}
function renderLibrary(){
  const fill=(id,items)=>{const root=$(id);root.innerHTML='';if(!items.length){root.innerHTML='<div class="empty">Aucun élément</div>';return;}for(const x of items.slice(0,100)){const b=document.createElement('button');b.className='list-item';b.innerHTML=`<span class="item-title">${escapeHTML(x.title||x.url)}</span><span class="item-url">${escapeHTML(x.url)}</span>`;b.onclick=()=>{createTab(x.url);panel.classList.add('hidden');};root.appendChild(b);}};
  fill('bookmarksList',state.bookmarks);fill('historyList',state.history);
}
async function loadData(){
  const data=await window.flamingbox.getData();state.bookmarks=data.bookmarks||[];state.history=data.history||[];state.settings={...state.settings,...(data.settings||{})};$('blockTrackers').checked=!!state.settings.blockTrackers;$('httpsFirst').checked=!!state.settings.httpsFirst;renderLibrary();updateBookmarkButton();
}
async function doImport(){
  $('importStatus').textContent='Analyse des profils Firefox, Chrome, Chromium et Edge…';
  try{const r=await window.flamingbox.importBrowserData();$('importStatus').textContent=`${r.importedBookmarks} favoris ajoutés. Sources : ${(r.sources||[]).join(', ')||'aucune'}.${r.warnings?.length?' '+r.warnings.join(' | '):''}`;await loadData();}catch(e){$('importStatus').textContent=`Import impossible : ${e.message}`;}
}

$('addressForm').onsubmit=(e)=>{e.preventDefault();const t=active();if(t)t.webview.src=normalizeInput(address.value);};
$('newTab').onclick=()=>createTab();$('privateTab').onclick=()=>createTab(state.settings.home||HOME,{private:true});
$('back').onclick=()=>{try{if(active()?.webview.canGoBack())active().webview.goBack();}catch{}};
$('forward').onclick=()=>{try{if(active()?.webview.canGoForward())active().webview.goForward();}catch{}};
$('reload').onclick=()=>{try{active()?.webview.reload();}catch{}};
$('home').onclick=()=>{const t=active();if(t)t.webview.src=state.settings.home||HOME;};
$('bookmark').onclick=toggleBookmark;$('library').onclick=()=>panel.classList.toggle('hidden');$('closePanel').onclick=()=>panel.classList.add('hidden');$('importData').onclick=doImport;
$('passwords').onclick=()=>createTab('https://passwords.google.com/');
$('security').onclick=()=>{$('securityPanel').classList.toggle('hidden');$('securityTitle').textContent='FlamingBox Shield';$('securityText').textContent='HTTPS prioritaire, principaux trackers bloqués, fenêtres pop-up neutralisées, permissions sensibles refusées par défaut.';};
$('blockTrackers').onchange=async(e)=>{state.settings=await window.flamingbox.updateSettings({blockTrackers:e.target.checked});};
$('httpsFirst').onchange=async(e)=>{state.settings=await window.flamingbox.updateSettings({httpsFirst:e.target.checked});};
window.flamingbox.onOpenTab((url,meta)=>createTab(url,{private:false,payment:!!meta.payment}));
window.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='l'){e.preventDefault();address.focus();address.select();}if(e.ctrlKey&&e.key.toLowerCase()==='t'){e.preventDefault();createTab();}if(e.ctrlKey&&e.key.toLowerCase()==='w'){e.preventDefault();closeTab(state.activeId);}if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='n'){e.preventDefault();createTab(state.settings.home||HOME,{private:true});}});

(async()=>{await loadData();createTab();})();
