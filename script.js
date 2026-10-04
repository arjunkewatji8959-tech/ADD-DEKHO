const ADMIN_ID = "786";
const ADMIN_PASSWORD = "8959";
const MEMBERS_KEY = "pmpml_members_v1";
const TICKETS_KEY = "pmpml_tickets_v1";

const $ = (id) => document.getElementById(id);
const loginScreen = $("loginScreen");
const mainApp = $("mainApp");
const loginForm = $("loginForm");
const loginError = $("loginError");
const form = $("bookingForm");
const qrArea = $("qrArea");
const showQr = $("showQr");
const ticketCard = document.querySelector(".ticket-card");
const statusEl = $("ticketStatus");
let timer = null;
let expiryAt = null;
let currentUser = null;

function getMembers(){ return JSON.parse(localStorage.getItem(MEMBERS_KEY) || "[]"); }
function saveMembers(v){ localStorage.setItem(MEMBERS_KEY, JSON.stringify(v)); }
function getTickets(){ return JSON.parse(localStorage.getItem(TICKETS_KEY) || "[]"); }
function saveTickets(v){ localStorage.setItem(TICKETS_KEY, JSON.stringify(v)); }
function pad(n){ return String(n).padStart(2,"0"); }
function fmt(d){
  const day=pad(d.getDate()), mon=d.toLocaleString("en-IN",{month:"short"}), yy=String(d.getFullYear()).slice(-2);
  let h=d.getHours(); const ap=h>=12?"PM":"AM"; h=h%12||12;
  return `${day} ${mon}, ${yy} | ${pad(h)}:${pad(d.getMinutes())} ${ap}`;
}
function makeTicketCode(date){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let series="";
  for(let i=0;i<6;i++) series+=chars[Math.floor(Math.random()*chars.length)];
  return `${String(date.getFullYear()).slice(-2)}${pad(date.getMonth()+1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${series}`;
}
function setExpired(){
  clearInterval(timer); timer=null; $("countdown").textContent="00:00:00"; statusEl.textContent="TICKET INVALID";
  statusEl.classList.add("invalid"); ticketCard.classList.add("expired"); qrArea.classList.remove("open"); qrArea.setAttribute("aria-hidden","true"); showQr.textContent="▦  Show QR code";
}
function startCountdown(endTime){
  clearInterval(timer); expiryAt=endTime instanceof Date?endTime.getTime():Number(endTime);
  statusEl.textContent="✓ VALID"; statusEl.classList.remove("invalid"); ticketCard.classList.remove("expired");
  const tick=()=>{ const left=Math.max(0,Math.ceil((expiryAt-Date.now())/1000));
    const h=Math.floor(left/3600),m=Math.floor((left%3600)/60),sec=left%60;
    $("countdown").textContent=`${pad(h)}:${pad(m)}:${pad(sec)}`; if(left===0)setExpired(); };
  tick(); timer=setInterval(tick,1000);
}
document.addEventListener("visibilitychange",()=>{ if(!document.hidden && expiryAt){ if(expiryAt>Date.now())startCountdown(expiryAt); else setExpired(); }});

function showApp(user){
  currentUser=user; loginScreen.hidden=true; mainApp.hidden=false;
  $("welcomeText").textContent=`Welcome, ${user.name || "Admin"}`;
  $("adminPanel").hidden=user.role!=="admin";
  if(user.role==="admin") renderMembers();
  renderHistory();
}
function doLogin(id,password){
  if(id===ADMIN_ID && password===ADMIN_PASSWORD) return {id, name:"Admin", role:"admin"};
  const m=getMembers().find(x=>x.id===id && x.password===password);
  return m ? {...m,role:"member"} : null;
}
loginForm.addEventListener("submit",e=>{
  e.preventDefault(); const user=doLogin($("loginId").value.trim(),$("loginPassword").value);
  if(!user){ loginError.textContent="Wrong ID or password"; return; }
  loginError.textContent=""; showApp(user);
});

form.addEventListener("submit",e=>{
  e.preventDefault();
  if(!currentUser)return;
  const route=$("route").value.trim(), count=Math.max(1,Number($("count").value));
  const from=$("from").value.trim(), to=$("to").value.trim(), fare=Math.max(1,Number($("fare").value));
  const valid=60, bookingTime=new Date(), validityTime=new Date(bookingTime.getTime()+valid*60*1000), ticketCode=makeTicketCode(bookingTime);
  $("tRoute").textContent=route; $("tCount").textContent=`${count}F`; $("tFare").textContent=fare*count;
  $("tFrom").textContent=from; $("tTo").textContent=to; $("tBooking").textContent=fmt(bookingTime); $("tValidity").textContent=fmt(validityTime); $("ticketId").textContent=ticketCode;
  $("qrcode").innerHTML="";
  if(window.QRCode)new QRCode($("qrcode"),{text:JSON.stringify({ticket:ticketCode,route,from,to,bookingTime:bookingTime.toISOString(),validityTime:validityTime.toISOString(),userId:currentUser.id}),width:170,height:170,correctLevel:QRCode.CorrectLevel.M});
  qrArea.classList.remove("open"); qrArea.setAttribute("aria-hidden","true"); showQr.textContent="▦  Show QR code"; startCountdown(validityTime);
  const tickets=getTickets(); tickets.unshift({ticketCode,route,count,from,to,fare:fare*count,bookingTime:bookingTime.toISOString(),validityTime:validityTime.toISOString(),userId:currentUser.id,userName:currentUser.name}); saveTickets(tickets);
  renderHistory();
  localStorage.setItem("pmpml_latest_ticket_v1", JSON.stringify(tickets[0]));
  window.location.href="ticket.html";
});

showQr.addEventListener("click",()=>{ if(ticketCard.classList.contains("expired"))return; const open=!qrArea.classList.contains("open"); qrArea.classList.toggle("open",open); qrArea.setAttribute("aria-hidden",String(!open)); showQr.textContent=open?"▦  Hide QR code":"▦  Show QR code"; if(open)qrArea.scrollIntoView({behavior:"smooth",block:"nearest"}); });

$("logoutBtn").addEventListener("click",()=>{ currentUser=null; clearInterval(timer); expiryAt=null; mainApp.hidden=true; loginScreen.hidden=false; loginForm.reset(); loginError.textContent=""; });
$("historyBtn").addEventListener("click",()=>{renderHistory(); $("historyModal").hidden=false;});
$("historyClose").addEventListener("click",()=>$("historyModal").hidden=true);
$("passwordClose").addEventListener("click",()=>$("passwordModal").hidden=true);
$("changePasswordBtn").addEventListener("click",()=>{ $("passwordMsg").textContent=""; $("newPassword").value=""; $("passwordModal").hidden=false; });
$("passwordForm").addEventListener("submit",e=>{
  e.preventDefault(); const pw=$("newPassword").value.trim(); if(!pw)return;
  if(currentUser.role==="admin"){ $("passwordMsg").textContent="Admin password is fixed for this demo."; return; }
  const ms=getMembers(), idx=ms.findIndex(x=>x.id===currentUser.id); if(idx<0)return;
  ms[idx].password=pw; saveMembers(ms); currentUser.password=pw; $("passwordMsg").textContent="Password updated successfully.";
});

$("memberForm").addEventListener("submit",e=>{
  e.preventDefault(); if(!currentUser || currentUser.role!=="admin")return;
  const name=$("memberName").value.trim(), id=$("memberId").value.trim(), password=$("memberPassword").value;
  const ms=getMembers(); if(!name||!id||!password)return;
  if(id===ADMIN_ID || ms.some(m=>m.id===id)){ $("memberMsg").textContent="This ID already exists."; return; }
  ms.push({name,id,password,createdAt:new Date().toISOString()}); saveMembers(ms); $("memberMsg").textContent="Member created successfully."; $("memberForm").reset(); renderMembers();
});
function renderMembers(){
  const box=$("membersList"), ms=getMembers(); if(!ms.length){box.innerHTML='<p class="muted">No members yet.</p>';return;}
  box.innerHTML=ms.map(m=>`<div class="member-row"><div><b>${escapeHtml(m.name)}</b><small>ID: ${escapeHtml(m.id)}</small></div><button type="button" data-edit="${escapeHtml(m.id)}">Edit Password</button></div>`).join("");
  box.querySelectorAll("[data-edit]").forEach(btn=>btn.addEventListener("click",()=>editMemberPassword(btn.dataset.edit)));
}
function editMemberPassword(id){
  const ms=getMembers(), m=ms.find(x=>x.id===id); if(!m)return;
  const pw=prompt(`New password for ${m.name} (ID ${m.id})`); if(pw===null)return; if(!pw.trim())return alert("Password cannot be empty.");
  m.password=pw.trim(); saveMembers(ms); renderMembers();
}
function renderHistory(){
  const box=$("historyList"); if(!box)return; let ts=getTickets();
  if(currentUser && currentUser.role!=="admin") ts=ts.filter(t=>t.userId===currentUser.id);
  if(!ts.length){box.innerHTML='<p class="muted">No tickets found.</p>';return;}
  box.innerHTML=ts.map(t=>`<div class="history-row"><div><b>${escapeHtml(t.ticketCode)}</b><span>${escapeHtml(t.from)} → ${escapeHtml(t.to)}</span><small>${escapeHtml(t.userName||t.userId)} · ${fmt(new Date(t.bookingTime))}</small></div><strong>₹${t.fare}</strong></div>`).join("");
}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
