chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({id:"pinch-selection",title:"Save selection to Pinch & Snap",contexts:["selection"]},()=>{});
});
chrome.contextMenus.onClicked.addListener(async (info,tab) => {
  if(info.menuItemId!=="pinch-selection" || !tab?.id) return;
  const item={id:"selection-"+Date.now(),type:"CSS",title:"Saved text selection",url:tab.url,domain:host(tab.url),note:info.selectionText||"",pocket:"Unsorted",createdAt:Date.now()};
  const d=await chrome.storage.local.get({items:[]});d.items.unshift(item);await chrome.storage.local.set({items:d.items});
});
chrome.commands.onCommand.addListener(async command => {
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id || /^(chrome|edge|about|chrome-extension|devtools):/i.test(tab.url||""))return;
  if(command==="activate-pinch") {
    try{await chrome.scripting.executeScript({target:{tabId:tab.id},files:["inspector.js"]});}catch(e){}
  }
  if(command==="capture-snap") {
    try{
      const dataUrl=await chrome.tabs.captureVisibleTab(tab.windowId,{format:"png"});
      const d=await chrome.storage.local.get({items:[],settings:{autoDownload:true,defaultPocket:"Unsorted"}});
      const item={id:"snap-"+Date.now(),type:"Screenshot",title:tab.title||"Screenshot",url:tab.url,domain:host(tab.url),dataUrl,pocket:d.settings.defaultPocket||"Unsorted",createdAt:Date.now()};
      d.items.unshift(item);await chrome.storage.local.set({items:d.items});
      if(d.settings.autoDownload!==false)await chrome.downloads.download({url:dataUrl,filename:`Pinch-Snap/${(tab.title||"capture").replace(/[<>:"/\\|?*]/g,"-").slice(0,60)}-${Date.now()}.png`,saveAs:false});
    }catch(e){}
  }
});
function host(url){try{return new URL(url).hostname.replace(/^www\./,"")}catch{return "Web"}}
