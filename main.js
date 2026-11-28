(() => {
"use strict";
const KEY="pickleball-court-control-v3";
const freshCourt=(n)=>({id:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,name:`Court ${n}`,teams:{1:[],2:[]},queue:[],scores:{1:0,2:0},serve:1,serveTeam:1,finished:false,logos:{1:"",2:""},teamNames:{1:"TEAM 1",2:"TEAM 2"},courtRecords:{}});
const initial={courts:[],records:{},maxWins:11,theme:"court"};
const $=s=>document.querySelector(s);
let state=load(),editingId=null,editingCourtId=null,swapSourceId=null,toastTimer;
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(!s)return structuredClone(initial);
return {...structuredClone(initial),...s,courts:(s.courts||[]).map((c,i)=>({...freshCourt(i+1),...c,teams:{1:c.teams?.[1]||[],2:c.teams?.[2]||[]},queue:c.queue||[],scores:{1:Number(c.scores?.[1])||0,2:Number(c.scores?.[2])||0},logos:{1:c.logos?.[1]||"",2:c.logos?.[2]||""},teamNames:{1:c.teamNames?.[1]||"TEAM 1",2:c.teamNames?.[2]||"TEAM 2"},courtRecords:c.courtRecords||{}}))};}catch{return structuredClone(initial)}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{toast("Storage is full. Please use smaller photos/logos.")}}
const clean=s=>s.trim().replace(/\s+/g," ");
const allPlayers=()=>state.courts.flatMap(c=>[...c.queue,...c.teams[1],...c.teams[2]]);
function toast(m){const e=$("#toast");e.textContent=m;e.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove("show"),2400)}
function record(p,teamLogo=""){state.records[p.id] ||= {name:p.name,wins:0,losses:0,teamLogo:""};state.records[p.id].name=p.name;if(teamLogo)state.records[p.id].teamLogo=teamLogo}
function autoAssign(c){for(const t of ["1","2"])while(c.teams[t].length<2&&c.queue.length)c.teams[t].push(c.queue.shift())}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
const palette=["court-color-1","court-color-2","court-color-3","court-color-4","court-color-5","court-color-6","court-color-7","court-color-8","court-color-9","court-color-10"];
function animeAvatar(seed){
 const palettes=[["#f9a8d4","#7c3aed","#fde68a"],["#93c5fd","#1d4ed8","#fca5a5"],["#86efac","#047857","#fcd34d"],["#fda4af","#be123c","#bfdbfe"],["#c4b5fd","#6d28d9","#fef08a"],["#fdba74","#c2410c","#a7f3d0"],["#67e8f9","#0e7490","#fbcfe8"],["#d9f99d","#4d7c0f","#fecaca"]];
 let h=0;for(let i=0;i<String(seed).length;i++)h=(h*31+String(seed).charCodeAt(i))>>>0;const [hair,shirt,skin]=palettes[h%palettes.length];
 const hairPaths=[`<path d="M25 47Q18 8 50 9Q83 8 76 48L69 33Q51 42 32 31Z" fill="${hair}"/>`,`<path d="M23 48Q18 10 50 10Q82 10 77 49L70 25Q51 15 30 29Z" fill="${hair}"/>`,`<path d="M24 45Q15 17 40 9Q72 0 79 35L70 50L65 27Q46 40 29 29Z" fill="${hair}"/>`];
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${shirt}"/><stop offset="1" stop-color="${hair}"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g)"/><path d="M10 100Q14 70 39 67H61Q86 70 90 100" fill="${shirt}"/><path d="M42 62V75Q50 83 58 75V62" fill="${skin}"/><ellipse cx="50" cy="43" rx="25" ry="29" fill="${skin}"/>${hairPaths[(h>>>3)%3]}<ellipse cx="40" cy="46" rx="3" ry="4" fill="#172554"/><ellipse cx="60" cy="46" rx="3" ry="4" fill="#172554"/><path d="M44 58Q50 62 56 58" fill="none" stroke="#9f1239" stroke-width="2" stroke-linecap="round"/><circle cx="31" cy="54" r="4" fill="#fb7185" opacity=".45"/><circle cx="69" cy="54" r="4" fill="#fb7185" opacity=".45"/></svg>`;return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(svg);
}
function chip(p,courtId){const d=document.createElement("div");d.className="player-chip";
d.innerHTML=`${p.photo?`<img class="avatar" src="${p.photo}" alt="">`:`<img class="avatar anime-avatar" src="${animeAvatar(p.id)}" alt="Anime-style avatar for ${escape(p.name)}">`}<span class="player-name"></span><span class="player-actions"><button class="icon-button edit-player-button" data-edit="${p.id}" data-court="${courtId}" title="Edit player">✎ Edit</button><button class="icon-button swap-player-button" data-swap="${p.id}" data-court="${courtId}" title="Switch player position">⇄ Switch</button></span>`;
d.querySelector(".player-name").textContent=p.name;return d}
function teamHTML(c,t,idx){const logo=c.logos[t],teamName=c.teamNames?.[t]||`TEAM ${t}`;return `<section class="team-box team-${t}"><div class="team-head"><div class="team-identity">${logo?`<img class="team-logo" src="${logo}" alt="">`:`<span class="team-logo logo-placeholder">T${t}</span>`}<div><button type="button" class="team-label team-name-edit" data-team-name="${c.id}:${t}" title="Click to rename this team">${escape(teamName)} ✎</button><strong>${c.teams[t].length}/2 players</strong></div></div><label class="upload-logo">＋ Logo<input type="file" accept="image/*" data-logo="${c.id}:${t}" hidden></label></div><div class="team-score">${c.scores[t]}</div><div class="score-buttons"><button data-score="${c.id}:${t}:-1">−</button><button data-score="${c.id}:${t}:1">+</button></div><div class="player-list" data-player-list="${c.id}:${t}"></div></section>`}
function courtStatsHTML(c){
 const rows=Object.values(c.courtRecords||{}).sort((a,b)=>a.name.localeCompare(b.name));
 if(!rows.length)return '<tr><td colspan="4" class="empty-state">No completed games on this court yet.</td></tr>';
 return rows.map(r=>{const n=r.wins+r.losses;return `<tr><td>${escape(r.name)}</td><td class="record-win">${r.wins}</td><td class="record-loss">${r.losses}</td><td>${n?Math.round(r.wins/n*100)+"%":"—"}</td></tr>`}).join("");
}
function renderCourts(){const grid=$("#courtsGrid");grid.innerHTML="";
state.courts.forEach((c,i)=>{const card=document.createElement("article");card.className=`court-card panel ${palette[i%palette.length]}`;card.dataset.court=c.id;if(c.background){card.style.backgroundImage=`linear-gradient(rgba(5,12,28,.78),rgba(5,12,28,.88)),url("${c.background}")`;card.style.backgroundSize="cover";card.style.backgroundPosition="center";}
card.innerHTML=`<div class="court-title"><div><p class="eyebrow">COURT ${String(i+1).padStart(2,"0")}</p><h3>${escape(c.name)}</h3></div><div class="court-head-actions"><span class="court-state">${c.finished?"FINISHED":"READY"}</span><label class="upload-court-bg">＋ Court photo<input type="file" accept="image/*" data-court-bg="${c.id}" hidden></label><button class="danger-button small" data-clear-court="${c.id}">Clear players</button><button class="danger-button small" data-remove-court="${c.id}" title="Remove court">×</button></div></div>
<div class="teams">${teamHTML(c,1,i)}<div class="versus">VS</div>${teamHTML(c,2,i)}</div>
<div class="match-actions"><div class="serve-control"><span>Serve:</span><button data-serve="${c.id}" class="serve-button serve-${c.serveTeam}">Serve ${c.serve}</button></div><div class="win-actions"><button class="win-button win-one" data-win="${c.id}:1" ${c.finished?"disabled":""}>${escape(c.teamNames?.[1]||"TEAM 1")} WIN</button><button class="win-button win-two" data-win="${c.id}:2" ${c.finished?"disabled":""}>${escape(c.teamNames?.[2]||"TEAM 2")} WIN</button></div><button class="reset-button" data-reset="${c.id}">↻ Reset</button></div>
<div class="court-queue"><div class="court-queue-head"><strong>Waiting list</strong><span class="count">${c.queue.length}</span></div><div class="player-list court-waiting" data-queue="${c.id}"></div><form class="court-add-form" data-add-form="${c.id}"><input name="playerName" placeholder="Add player to this court" maxlength="32" required><label class="player-photo-picker" title="Optional player photo">＋ Photo<input name="playerPhoto" type="file" accept="image/*" capture="user" hidden></label><button class="primary-button">Add</button></form></div>
<section class="court-stats"><div class="court-stats-heading"><div><p class="eyebrow">PLAYER STATS</p><strong>${escape(c.name)} · Win / loss records</strong></div></div><div class="table-wrap"><table><thead><tr><th>Player</th><th>Wins</th><th>Losses</th><th>Win rate</th></tr></thead><tbody>${courtStatsHTML(c)}</tbody></table></div></section>`;
grid.append(card);
for(const t of [1,2]){const list=card.querySelector(`[data-player-list="${c.id}:${t}"]`);c.teams[t].forEach(p=>list.append(chip(p,c.id)));if(!c.teams[t].length){const e=document.createElement("div");e.className="empty-state";e.textContent="Waiting for players";list.append(e)}}
const q=card.querySelector(`[data-queue="${c.id}"]`);c.queue.forEach(p=>q.append(chip(p,c.id)));if(!c.queue.length)q.innerHTML='<div class="empty-state">No one waiting</div>';
})}
function renderRecords(){const b=$("#recordsBody");b.innerHTML="";const rows=Object.entries(state.records).sort((a,b)=>a[1].name.localeCompare(b[1].name));if(!rows.length){b.innerHTML='<tr><td colspan="5" class="empty-state">No records yet.</td></tr>';return}rows.forEach(([id,r])=>{const n=r.wins+r.losses,tr=document.createElement("tr");tr.innerHTML=`<td class="record-player">${r.teamLogo?`<img class="record-team-logo" src="${r.teamLogo}" alt="Team logo">`:`<span class="record-team-logo record-logo-empty">—</span>`}<strong>${escape(r.name)}</strong></td><td class="record-win">${r.wins}</td><td class="record-loss">${r.losses}</td><td>${n?Math.round(r.wins/n*100)+"%":"—"}</td>`;b.append(tr)})}
function render(){document.body.dataset.theme=state.theme;$("#themeSelect").value=state.theme;$("#maxWins").value=state.maxWins;renderCourts();save()}
function addPlayer(c,name,photo=""){name=clean(name);if(!name)return;if(allPlayers().some(p=>p.name.toLowerCase()===name.toLowerCase()))return toast("That player is already listed.");const id=crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;const p={id,name,photo:photo||animeAvatar(id)};record(p);c.queue.push(p);autoAssign(c);render();toast(`${name} added to ${c.name}.`)}
function findPlayer(pid){for(const c of state.courts){for(const t of ["1","2"]){const list=c.teams[t],i=list.findIndex(p=>p.id===pid);if(i>=0)return {player:list[i],list,index:i,court:c}}const i=c.queue.findIndex(p=>p.id===pid);if(i>=0)return {player:c.queue[i],list:c.queue,index:i,court:c}}return null}
function finish(c,w){if(c.finished)return;const l=w===1?2:1;c.courtRecords ||= {};c.teams[w].forEach(p=>{record(p,c.logos[w]);state.records[p.id].wins++;c.courtRecords[p.id] ||= {name:p.name,wins:0,losses:0};c.courtRecords[p.id].name=p.name;c.courtRecords[p.id].wins++});c.teams[l].forEach(p=>{record(p,c.logos[l]);state.records[p.id].losses++;c.courtRecords[p.id] ||= {name:p.name,wins:0,losses:0};c.courtRecords[p.id].name=p.name;c.courtRecords[p.id].losses++});const winners=c.teams[w].map(p=>p.name).join(", ");c.queue.push(...c.teams[1],...c.teams[2]);c.teams={1:[],2:[]};c.scores={1:0,2:0};c.serve=1;c.serveTeam=w;c.finished=false;autoAssign(c);render();toast(`${c.name}: Team ${w} wins (${winners}). Rotation complete.`)}
function positionLabel(c,pid){
 for(const t of ["1","2"]){const i=c.teams[t].findIndex(p=>p.id===pid);if(i>=0)return `Team ${t} · Player ${i+1}`}
 const i=c.queue.findIndex(p=>p.id===pid);return i>=0?`Waiting list · #${i+1}`:"Player";
}
function openSwap(pid,cid){
 const c=state.courts.find(x=>x.id===cid),source=findPlayer(pid);if(!c||!source)return;
 const candidates=[...c.teams[1].map(p=>({p,group:"Team 1"})),...c.teams[2].map(p=>({p,group:"Team 2"})),...c.queue.map(p=>({p,group:"Waiting list"}))].filter(x=>x.p.id!==pid);
 if(!candidates.length)return toast("Add another player to this court before switching.");
 swapSourceId=pid;$("#swapDescription").textContent=`Switch ${source.player.name} (${positionLabel(c,pid)}) with another player on ${c.name}.`;
 $("#swapTarget").innerHTML=candidates.map(x=>`<option value="${x.p.id}">${escape(x.p.name)} — ${x.group}</option>`).join("");
 $("#swapDialog").showModal();
}
$("#swapForm").addEventListener("submit",e=>{
 if(e.submitter?.id!=="confirmSwap")return;e.preventDefault();
 const a=findPlayer(swapSourceId),b=findPlayer($("#swapTarget").value);
 if(!a||!b||a.court.id!==b.court.id){$("#swapDialog").close();return toast("Could not switch those players.")}
 const temp=a.list[a.index];a.list[a.index]=b.list[b.index];b.list[b.index]=temp;
 const court=a.court;$("#swapDialog").close();swapSourceId=null;render();
 toast("Player positions switched on "+court.name+".");
});
function readImg(file,cb){if(!file)return;if(file.size>2*1024*1024)return toast("Images must be under 2 MB.");const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(file)}
$("#addCourt").addEventListener("click",()=>{state.courts.push(freshCourt(state.courts.length+1));render();toast("New court added with its own players and queue.")});
$("#themeSelect").addEventListener("change",e=>{state.theme=e.target.value;render()});
$("#maxWins").addEventListener("change",e=>{state.maxWins=Math.max(1,Math.min(99,parseInt(e.target.value)||11));render()});
$("#courtsGrid").addEventListener("submit",e=>{const form=e.target.closest("[data-add-form]");if(!form)return;e.preventDefault();const c=state.courts.find(c=>c.id===form.dataset.addForm);if(c){const name=form.playerName.value,file=form.querySelector("[name=playerPhoto]").files[0];if(file)readImg(file,src=>addPlayer(c,name,src));else addPlayer(c,name)}form.reset()});
$("#courtsGrid").addEventListener("click",e=>{
 const rename=e.target.closest("[data-team-name]");
 if(rename){const [cid,t]=rename.dataset.teamName.split(":");const c=state.courts.find(x=>x.id===cid);if(!c)return;const current=c.teamNames?.[t]||`TEAM ${t}`;const next=prompt(`Enter a name for Team ${t}:`,current);if(next!==null){const value=clean(next).slice(0,24);if(value){c.teamNames ||= {1:"TEAM 1",2:"TEAM 2"};c.teamNames[t]=value.toUpperCase();render()}else toast("Team name cannot be empty.")}return}

const win=e.target.closest("[data-win]");if(win){const [cid,t]=win.dataset.win.split(":");const c=state.courts.find(c=>c.id===cid);if(c)finish(c,Number(t));return}
const score=e.target.closest("[data-score]");if(score){const [cid,t,d]=score.dataset.score.split(":");const c=state.courts.find(c=>c.id===cid);if(!c||c.finished)return;c.scores[t]=Math.max(0,c.scores[t]+Number(d));if(c.scores[t]>=state.maxWins){c.scores[t]=state.maxWins;finish(c,Number(t))}else render();return}
const serve=e.target.closest("[data-serve]");if(serve){const c=state.courts.find(c=>c.id===serve.dataset.serve);if(c){c.serve=c.serve===1?2:1;c.serveTeam=c.serveTeam===1?2:1;render()}return}
const reset=e.target.closest("[data-reset]");if(reset){const c=state.courts.find(c=>c.id===reset.dataset.reset);if(c){c.scores={1:0,2:0};c.serve=1;c.serveTeam=1;c.finished=false;render();toast(`${c.name} reset.`)}return}
const clear=e.target.closest("[data-clear-court]");if(clear){const c=state.courts.find(c=>c.id===clear.dataset.clearCourt);if(c&&confirm(`Clear players on ${c.name}? Records will remain.`)){c.queue=[];c.teams={1:[],2:[]};c.scores={1:0,2:0};c.finished=false;render();toast(`${c.name} players cleared.`)}return}
const remove=e.target.closest("[data-remove-court]");if(remove){const c=state.courts.find(c=>c.id===remove.dataset.removeCourt);if(c&&confirm(`Remove ${c.name} and its player lists? Records are retained.`)){state.courts=state.courts.filter(x=>x.id!==c.id);render();toast("Court removed.")}return}
const swap=e.target.closest("[data-swap]");if(swap){openSwap(swap.dataset.swap,swap.dataset.court);return}
 const edit=e.target.closest("[data-edit]");if(edit){const f=findPlayer(edit.dataset.edit);if(!f)return;editingId=edit.dataset.edit;editingCourtId=f.court.id;$("#editName").value=f.player.name;$("#playerPhoto").value="";$("#playerDialog").showModal()}
});
$("#courtsGrid").addEventListener("change",e=>{
 const bg=e.target.closest("[data-court-bg]");
 if(bg){const c=state.courts.find(c=>c.id===bg.dataset.courtBg);if(c)readImg(bg.files[0],src=>{c.background=src;render();toast(`${c.name} background updated.`)});bg.value="";return}
 const inp=e.target.closest("[data-logo]");if(!inp)return;const [cid,t]=inp.dataset.logo.split(":");const c=state.courts.find(c=>c.id===cid);if(c)readImg(inp.files[0],src=>{c.logos[t]=src;render()})
});
$("#playerForm").addEventListener("submit",e=>{if(e.submitter?.id!=="savePlayer")return;e.preventDefault();const f=findPlayer(editingId),name=clean($("#editName").value);if(!f||!name)return;if(allPlayers().some(p=>p.id!==editingId&&p.name.toLowerCase()===name.toLowerCase()))return toast("Duplicate player name.");f.player.name=name;if(state.records[editingId])state.records[editingId].name=name;const file=$("#playerPhoto").files[0];const done=()=>{$("#playerDialog").close();render()};if(file)readImg(file,src=>{f.player.photo=src;done()});else done()});
$("#deletePlayer").addEventListener("click",()=>{const f=findPlayer(editingId);if(!f)return;if(confirm(`Remove ${f.player.name} from ${f.court.name}? Record stays.`)){f.list.splice(f.index,1);autoAssign(f.court);$("#playerDialog").close();render()}});

// GCash donation QR dialog: hidden and unloaded until the donation button is clicked.
const gcashDialog=$("#gcashDialog"),gcashImage=gcashDialog.querySelector(".gcash-qr");
gcashDialog.hidden=true;
$("#showGcash").addEventListener("click",()=>{
 gcashDialog.hidden=false;
 if(!gcashImage.getAttribute("src"))gcashImage.src=gcashImage.dataset.src;
 gcashDialog.showModal();
});
$("#closeGcash").addEventListener("click",()=>gcashDialog.close());
gcashDialog.addEventListener("close",()=>{gcashDialog.hidden=true;});


// App sharing: use the device share sheet, or provide common social share links.
const appTitle="Pickleball Court Control";
const appText="Use Pickleball Court Control to manage courts, scores, player rotation and stats.";
const appUrl=()=>location.href.split("#")[0];
function prepareShareLinks(){
 const u=encodeURIComponent(appUrl()),t=encodeURIComponent(appText);
 $("#shareFacebook").href=`https://www.facebook.com/sharer/sharer.php?u=${u}`;
 $("#shareX").href=`https://twitter.com/intent/tweet?url=${u}&text=${t}`;
 $("#shareWhatsApp").href=`https://wa.me/?text=${t}%20${u}`;
 $("#shareTelegram").href=`https://t.me/share/url?url=${u}&text=${t}`;
 $("#shareEmail").href=`mailto:?subject=${encodeURIComponent(appTitle)}&body=${t}%0A${u}`;
}
$("#shareApp").addEventListener("click",async()=>{
 prepareShareLinks();
 if(navigator.share){
  try{await navigator.share({title:appTitle,text:appText,url:appUrl()});return}catch(err){if(err?.name==="AbortError")return}
 }
 $("#shareDialog").showModal();
});
$("#closeShare").addEventListener("click",()=>$("#shareDialog").close());
$("#copyAppLink").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText(appUrl());toast("App link copied.");$("#shareDialog").close()}
 catch{toast("Copy unavailable. Please copy the address from your browser.")}
});

let installPrompt=null;
const installButton=$("#installApp");
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;installButton.hidden=false});
window.addEventListener("appinstalled",()=>{installPrompt=null;installButton.hidden=true;toast("Court Control installed.")});
installButton.addEventListener("click",async()=>{
 if(installPrompt){installPrompt.prompt();try{await installPrompt.userChoice}catch{}installPrompt=null}
 else $("#installDialog").showModal();
});
$("#closeInstall").addEventListener("click",()=>$("#installDialog").close());
if(window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true)installButton.hidden=true;
if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")){
 window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
}

render();
})();