const $ = (id) => document.getElementById(id);
const views = ["homeView","pocketsView","settingsView","inspectView"];
let currentFilter = "All";
let allItems = [];
let currentTab = null;
const defaultPockets = ["Unsorted","UI Inspiration","Projects","Bug Reports","Read Later"];

function showView(id) {
  views.forEach(v => $(v).classList.toggle("hidden", v !== id));
}
function message(text, error=false) {
  $("status").textContent = text;
  $("status").style.color = error ? "#b04a4a" : "#5b765d";
  setTimeout(() => { if ($("status").textContent === text) $("status").textContent = ""; }, 3000);
}
async function getData() {
  const d = await chrome.storage.local.get({items:[], pockets:defaultPockets, settings:{instantPinch:false,autoDownload:true,defaultPocket:"Unsorted"}});
  return d;
}
async function saveItem(item) {
  const d = await getData();
  const entry = {id: crypto.randomUUID(), createdAt: Date.now(), pocket: $("pocketSelect").value || d.settings.defaultPocket || "Unsorted", ...item};
  d.items.unshift(entry);
  await chrome.storage.local.set({items:d.items});
  message("Saved to " + entry.pocket);
  return entry;
}
async function activeTab() {
  const tabs = await chrome.tabs.query({active:true,currentWindow:true});
  return tabs[0];
}
async function init() {
  currentTab = await activeTab();
  const d = await getData();
  $("instantToggle").setAttribute("aria-checked", String(!!d.settings.instantPinch));
  $("settingsInstantToggle").setAttribute("aria-checked", String(!!d.settings.instantPinch));
  $("autoDownloadToggle").setAttribute("aria-checked", String(d.settings.autoDownload !== false));
  $("defaultPocket").value = d.settings.defaultPocket || "Unsorted";
  $("pocketSelect").value = d.settings.defaultPocket || "Unsorted";
  if (d.settings.instantPinch) {
    activatePinch().catch(()=>{});
  }
}
function isRestricted(url="") {
  return /^(chrome|edge|about|chrome-extension|devtools):/i.test(url) || url.includes("chromewebstore.google.com");
}
async function activatePinch() {
  currentTab = currentTab || await activeTab();
  if (!currentTab || isRestricted(currentTab.url)) { message("Pinch can't run on this browser page.", true); return; }
  try {
    await chrome.scripting.executeScript({target:{tabId:currentTab.id},files:["inspector.js"]});
    window.close();
  } catch(e) { message("This page doesn't allow inspection.", true); }
}
async function snap() {
  currentTab = currentTab || await activeTab();
  if (!currentTab || isRestricted(currentTab.url)) { message("Screenshots aren't available on this browser page.", true); return; }
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(currentTab.windowId,{format:"png"});
    const d = await getData();
    const title = currentTab.title || "Screenshot";
    const item = {type:"Screenshot",title, url:currentTab.url, domain:safeDomain(currentTab.url), dataUrl, pocket:$("pocketSelect").value || d.settings.defaultPocket || "Unsorted"};
    const entry = {id:crypto.randomUUID(),createdAt:Date.now(),...item};
    d.items.unshift(entry);
    await chrome.storage.local.set({items:d.items});
    if (d.settings.autoDownload !== false) {
      const filename = `Pinch-Snap/${safeFilename(title)}-${Date.now()}.png`;
      await chrome.downloads.download({url:dataUrl,filename,saveAs:false});
    }
    message("Screenshot saved to " + entry.pocket);
  } catch(e) { message("Couldn't capture this tab. Try again.", true); }
}
function safeDomain(url) { try { return new URL(url).hostname.replace(/^www\./,""); } catch { return "Web"; } }
function safeFilename(s) { return (s||"capture").replace(/[<>:"/\\|?*\x00-\x1F]/g,"-").slice(0,70) || "capture"; }
async function savePage() {
  currentTab = currentTab || await activeTab();
  if (!currentTab || isRestricted(currentTab.url)) { message("This page can't be saved.", true); return; }
  await saveItem({type:"Page",title:currentTab.title || currentTab.url,url:currentTab.url,domain:safeDomain(currentTab.url),favicon:currentTab.favIconUrl||""});
}
async function setSetting(key,value) {
  const d = await getData(); d.settings[key]=value; await chrome.storage.local.set({settings:d.settings});
}
function toggleButton(btn, value) { btn.setAttribute("aria-checked",String(value)); }
$("pinchBtn").addEventListener("click", activatePinch);
$("snapBtn").addEventListener("click", snap);
$("savePageBtn").addEventListener("click", savePage);
$("viewPocketsBtn").addEventListener("click", async()=>{showView("pocketsView"); await renderItems();});
$("settingsBtn").addEventListener("click", async()=>{const d=await getData();toggleButton($("settingsInstantToggle"),!!d.settings.instantPinch);toggleButton($("autoDownloadToggle"),d.settings.autoDownload!==false);$("defaultPocket").value=d.settings.defaultPocket||"Unsorted";showView("settingsView");});
$("backHome").addEventListener("click",()=>showView("homeView"));
$("backSettings").addEventListener("click",()=>showView("homeView"));
$("backInspect").addEventListener("click",()=>showView("homeView"));
$("profileBtn").addEventListener("click",()=>message("No account needed. Your library is stored locally."));
$("instantToggle").addEventListener("click",async()=>{const next=$("instantToggle").getAttribute("aria-checked")!=="true";toggleButton($("instantToggle"),next);toggleButton($("settingsInstantToggle"),next);await setSetting("instantPinch",next);message(next?"Instant Pinch enabled":"Instant Pinch disabled");if(next)activatePinch();});
$("settingsInstantToggle").addEventListener("click",async()=>{const next=$("settingsInstantToggle").getAttribute("aria-checked")!=="true";toggleButton($("settingsInstantToggle"),next);toggleButton($("instantToggle"),next);await setSetting("instantPinch",next);});
$("autoDownloadToggle").addEventListener("click",async()=>{const next=$("autoDownloadToggle").getAttribute("aria-checked")!=="true";toggleButton($("autoDownloadToggle"),next);await setSetting("autoDownload",next);});
$("defaultPocket").addEventListener("change",async()=>{await setSetting("defaultPocket",$("defaultPocket").value);$("pocketSelect").value=$("defaultPocket").value;});
$("pocketSelect").addEventListener("change",async()=>{await setSetting("defaultPocket",$("pocketSelect").value);});
$("addPocketBtn").addEventListener("click",async()=>{const name=prompt("Name your new pocket");if(!name||!name.trim())return;const d=await getData();const n=name.trim();if(d.pockets.includes(n)){alert("That pocket already exists.");return;}d.pockets.push(n);await chrome.storage.local.set({pockets:d.pockets});await populatePockets();message("Pocket created: "+n);});
$("exportBtn").addEventListener("click",async()=>{const d=await getData();const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),items:d.items,pockets:d.pockets},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="pinch-snap-library.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$("clearDataBtn").addEventListener("click",async()=>{if(!confirm("Delete all saved items and custom pockets from this device? This cannot be undone."))return;await chrome.storage.local.set({items:[],pockets:defaultPockets});await renderItems();message("Local library cleared");});
$("searchInput").addEventListener("input",renderItems);
$("filterRow").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;currentFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderItems();});
async function populatePockets() {
  const d=await getData(); const select=$("pocketSelect"); const selected=select.value;
  select.innerHTML="";
  d.pockets.forEach(p=>{const o=document.createElement("option");o.value=p;o.textContent=p;select.appendChild(o);});
  select.value=d.pockets.includes(selected)?selected:(d.settings.defaultPocket||"Unsorted");
}
async function renderItems() {
  const d=await getData();allItems=d.items||[];
  const q=($("searchInput").value||"").toLowerCase().trim();
  const items=allItems.filter(i=>(currentFilter==="All"||i.type===currentFilter)&&(!q||`${i.title} ${i.url} ${i.note||""} ${i.pocket}`.toLowerCase().includes(q)));
  $("itemCount").textContent=`${items.length} ${items.length===1?"item":"items"}`;
  const list=$("pocketList");list.innerHTML="";
  if(!items.length){list.innerHTML='<div class="empty-state"><strong>Your pockets are looking fresh.</strong><p>Save a page, inspect an element, or capture a screenshot. Your useful finds will live here.</p></div>';return;}
  items.forEach(item=>{
    const row=document.createElement("article");row.className="saved-item";
    const icon=item.type==="Screenshot"?"▧":item.type==="CSS"?"{ }":"↗";
    row.innerHTML=`<div class="item-icon">${icon}</div><div class="item-body"><div class="item-title"></div><div class="item-meta"></div>${item.note?'<div class="item-note"></div>':''}</div><div class="item-actions"><button class="mini-btn open-item" title="Open">↗</button><button class="mini-btn delete-item" title="Delete">×</button></div>`;
    row.querySelector(".item-title").textContent=item.title||item.type;
    row.querySelector(".item-meta").textContent=`${item.pocket||"Unsorted"} · ${item.domain||safeDomain(item.url||"")} · ${new Date(item.createdAt).toLocaleDateString()}`;
    if(item.note)row.querySelector(".item-note").textContent=item.note;
    row.querySelector(".open-item").addEventListener("click",()=>{if(item.url)chrome.tabs.create({url:item.url});else if(item.dataUrl){const w=window.open();w.document.write(`<img src="${item.dataUrl}" style="max-width:100%">`);}});
    row.querySelector(".delete-item").addEventListener("click",async()=>{const next=(await getData()).items.filter(x=>x.id!==item.id);await chrome.storage.local.set({items:next});renderItems();});
    list.appendChild(row);
  });
}
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();showView("pocketsView");$("searchInput").focus();renderItems();}if(e.key==="Escape")showView("homeView");});
init().then(populatePockets);
