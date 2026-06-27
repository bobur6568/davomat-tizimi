// ============================================================
// DAVOMAT TIZIMI — APP v4
// ============================================================
let currentUser = null;
let davState = { date:'', bolim:'', smena:'', attendance:{}, boshCount:0, yordamchilar:[], savedAt:null };
let hisobotTab = 'kunlik';
let allJamRows = [];
let chartInstances = {};
let editTimer = null;

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  // Tilni yuklash
  changeLang(currentLang);
  updateTestModeBadge();
  Storage.load();
  const saved = Storage.loadSession();
  if (saved) { currentUser = saved; bootApp(); }
  startClock();
  document.getElementById('login-inp').addEventListener('keydown', e=>{ if(e.key==='Enter') document.getElementById('pass-inp').focus(); });
  document.getElementById('pass-inp').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
  const yi = document.getElementById('dav-yordam-inp');
  if(yi) yi.addEventListener('input', function(){
    const found = findByTabel(this.value);
    const msg = document.getElementById('dav-yordam-found');
    if(found) msg.innerHTML=`<span style="color:var(--green)">✓ ${found.ism} (${found.bolim}/${found.smena})</span>`;
    else if(this.value.length>1) msg.innerHTML=`<span style="color:var(--text3)">Tizimda topilmadi</span>`;
    else msg.textContent='';
  });
});

function startClock() {
  const M=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const D=['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  function tick(){
    const now=new Date();
    const cl=document.getElementById('clock');
    if(cl) cl.textContent=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0');
    const dl=document.getElementById('topbar-date');
    if(dl) dl.textContent=D[now.getDay()]+', '+now.getDate()+' '+M[now.getMonth()]+' '+now.getFullYear();
  }
  tick(); setInterval(tick,1000); setInterval(updateTestModeBadge,5000);
}

// ============================================================
// SMENA VAQT ANIQLASH
// ============================================================
function detectSmenaType() {
  // Saqlash vaqtiga qarab kunduzgi yoki tungi
  const m = nowMinutes();
  if(m>=465 && m<=505) return 'kunduzgi'; // 07:45-08:25
  if(m>=1185 && m<=1225) return 'tungi';   // 19:45-20:25
  return null;
}
function isTestMode() {
  // Test rejim: 10.06.2026 soat 07:35 gacha
  const now = new Date();
  const testEnd = new Date('2026-06-10T07:35:00');
  return now < testEnd;
}

function isKunduziWindow() {
  if(isTestMode()) return true; // Test rejimda har doim ochiq
  const m=nowMinutes(); return m>=465&&m<=505;
}
function isTungiWindow() {
  if(isTestMode()) return true; // Test rejimda har doim ochiq
  const m=nowMinutes(); return m>=1185&&m<=1225;
}
function isAnyDavWindow()  { return isKunduziWindow()||isTungiWindow(); }
function isMasUlWindowOpen() {
  if(isTestMode()) return true; // Test rejimda har doim ochiq
  const m=nowMinutes(); return m>=460||m<=450;
}
function nowMinutes() { const n=new Date(); return n.getHours()*60+n.getMinutes(); }
function isEditAllowed(savedAt) { if(!savedAt) return false; return (Date.now()-new Date(savedAt).getTime())<10*60*1000; }

// ============================================================
// AUTH
// ============================================================
function doLogin() {
  const login=document.getElementById('login-inp').value.trim();
  const pass=document.getElementById('pass-inp').value;
  const user=DB.users.find(u=>u.login===login&&u.password===pass);
  if(!user){ document.getElementById('login-err').textContent='Login yoki parol xato!'; return; }
  document.getElementById('login-err').textContent='';
  currentUser=user; Storage.saveSession(user); bootApp();
}
function doLogout() {
  currentUser=null; Storage.clearSession();
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('login-inp').value='';
  document.getElementById('pass-inp').value='';
}
function bootApp() {
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('user-name-badge').textContent=currentUser.name;
  const rL={'admin':"To'liq Admin",'admin2':'Hisobot Admin','supervisor':'Nazorat','mas_ul':"Mas'ul"};
  document.getElementById('user-role-badge').textContent=rL[currentUser.role]||currentUser.role;
  buildSidebar();
  const first=['admin','admin2','supervisor'].includes(currentUser.role)?'jamlanma':'davomat';
  showPage(first);
  // Lang va test rejim
  setTimeout(()=>{ updateSidebarLang(); updateTestModeBadge(); }, 100);
}


// ============================================================
// ROLE HELPERS
// ============================================================
function isAdmin() { return currentUser.role === 'admin'; }
function isAdminOrSup() { return ['admin','supervisor'].includes(currentUser.role); }
function isViewer() { return ['admin','admin2','supervisor'].includes(currentUser.role); }
function isMasUl() { return currentUser.role === 'mas_ul'; }
function isSupervisor() { return currentUser.role === 'supervisor'; }
function isReadOnly() { return currentUser.role === 'admin2' && currentUser.readonly === true; }

// Supervisor ning mas'ullari
function getSupervisedMasUllar() {
  if(!isSupervisor()) return [];
  return DB.users.filter(u => (currentUser.mas_ullar||[]).includes(u.id));
}

// Supervisor nazorat qiladigan bo'lim+smenalar
function getSupervisedBolimSmenalar() {
  const masUllar = getSupervisedMasUllar();
  return masUllar.map(u => ({bolim: u.bolim, smena: u.smena, extra: u.extra_smenalar||[]}));
}

// Mas'ul ning supervisori
function getMasUlSupervisor() {
  if(!isMasUl()) return null;
  return DB.users.find(u => u.role==='supervisor' && (u.mas_ullar||[]).includes(currentUser.id));
}

// Supervisor bu davomat yozuvini o'zgartira oladimi
function canSupervisorEdit(bolim, smena) {
  if(isAdmin()) return true;
  if(!isSupervisor()) return false;
  const bsList = getSupervisedBolimSmenalar();
  return bsList.some(bs => bs.bolim===bolim && (bs.smena===smena || (bs.extra||[]).includes(smena)));
}

// Grafik bo'yicha bugun smena tipi
function getTodaySmenaType(bolim, smena) {
  const today = todayStr();
  return getDayType(today, bolim, smena);
}
// ============================================================
// SIDEBAR
// ============================================================
function buildSidebar() {
  const role=currentUser.role;
  const items=[
    {page:'davomat',         icon:'📝', label:'Davomat Kiritish',   roles:['admin','mas_ul','supervisor']},
    {page:'jamlanma',        icon:'📊', label:'Jamlanma',           roles:['admin','admin2','supervisor']},
    {page:'smena-xisobot',   icon:'🕗', label:'08:36 Xisoboti',     roles:['admin','admin2','supervisor']},
    {page:'hisobot',         icon:'📈', label:'Hisobotlar',         roles:['admin','admin2','supervisor']},
    {page:'reyting',         icon:'🏆', label:'Reyting',            roles:['admin','admin2','supervisor','mas_ul']},
    {page:'grafik',          icon:'📅', label:'Ish Grafigi',        roles:['admin','admin2','supervisor','mas_ul']},
    {page:'xodimlar',        icon:'👥', label:'Xodimlar',           roles:['admin']},
    {page:'bolimlar',        icon:'🏭', label:'Ish Joylari',        roles:['admin']},
    {page:'foydalanuvchilar',icon:'🔐', label:'Foydalanuvchilar',   roles:['admin']},
  ];
  document.getElementById('sidebar').innerHTML=
    items.filter(i=>i.roles.includes(role)).map(i=>
      `<div class="nav-item" id="nav-${i.page}" onclick="showPage('${i.page}')">
        <span class="ni-icon">${i.icon}</span><span>${i.label}</span>
      </div>`
    ).join('')+
    `<div class="logout-btn"><button class="btn sm danger" style="width:100%" onclick="doLogout()">⬅ Chiqish</button></div>`;
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pg=document.getElementById('page-'+page); if(pg) pg.classList.add('active');
  const nav=document.getElementById('nav-'+page); if(nav) nav.classList.add('active');
  if(page==='jamlanma') renderJamlanma();
  if(page==='hisobot') { hisobotTab='kunlik'; renderHisobot(); }
  if(page==='grafik') { document.getElementById('grafik-content').innerHTML=''; renderGrafik(null); }
  if(page==='reyting') renderReytingPage();
  if(page==='smena-xisobot') render0836Page();
  if(page==='xodimlar') { fillBolimSelects(); renderXodimlar(); }
  if(page==='bolimlar') renderBolimlar();
  if(page==='foydalanuvchilar') { renderFoydalanuvchilar(); setTimeout(()=>renderTozalash(),100); }
  if(page==='davomat') initDavomat();
}

// ============================================================
// DAVOMAT — MAS'UL (soddalashtirilgan)
// ============================================================
function initDavomat() {
  if(currentUser.role==='mas_ul') {
    initMasUlDavomat();
  } else if(currentUser.role==='supervisor') {
    initSupervisorDavomat();
  } else {
    initAdminDavomat();
  }
}

function initSupervisorDavomat() {
  // Supervisor: o'z nazoratidagi mas'ullarning davomatini ko'radi va o'zgartira oladi
  const wrap = document.getElementById('page-davomat');
  const bsList = getSupervisedBolimSmenalar();
  const today = todayStr();

  let html = `<div class="page-header"><div><h2>Davomat Nazorati</h2>
    <p>${currentUser.name} — nazorat qilinadigan smenalar</p></div>
    <button class="btn sm" onclick="refreshData()">🔄 Yangilash</button>
  </div>`;

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-bottom:1rem">';

  for(const bs of bsList) {
    const allSmenas = [bs.smena, ...(bs.extra||[])];
    for(const s of allSmenas) {
      const dav = getDavomat(today, bs.bolim, s);
      const emps = getEmpsForSmena(bs.bolim, s);
      let k=0,ke=0,y=0;
      for(const e of emps){const att=dav?dav.attendance[e.id]:null;if(!att||att.holat==='keldi') k++;else if(att.holat==='kech') ke++;else y++;}
      const pct = emps.length?Math.round(k/emps.length*100):0;
      const tip = getDayType(today, bs.bolim, s);
      const tipColor = tip==='kunduzi'?'var(--green)':tip==='tungi'?'var(--blue)':' var(--red)';
      const canEdit = dav && !isEditAllowed(dav.kiritilgan_vaqt);

      html += `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:1rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
          <span style="font-weight:700;font-family:var(--mono)">${bs.bolim}/${s}</span>
          <span style="font-size:10px;color:${tipColor};background:var(--bg4);padding:2px 8px;border-radius:10px">${tip||'grafik yo\'q'}</span>
        </div>
        <div style="display:flex;gap:8px;font-size:12px;margin-bottom:.5rem">
          <span style="color:var(--green)">✓${k}</span>
          <span style="color:var(--amber)">⏰${ke}</span>
          <span style="color:var(--red)">✗${y}</span>
        </div>
        <div class="progress-bar" style="margin-bottom:.5rem"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div style="display:flex;gap:6px">
          ${dav?'<span class="badge b-kiritilgan" style="font-size:10px">✓ Kiritilgan</span>':'<span class="badge b-kutilmoqda" style="font-size:10px">Kutilmoqda</span>'}
          ${canEdit?`<button class="btn xs primary" onclick="supervisorEditDavomat('${bs.bolim}','${s}','${today}')">✏️ Tahrirlash</button>`:''}
        </div>
      </div>`;
    }
  }
  html += '</div>';
  wrap.innerHTML = html;
}

function supervisorEditDavomat(bolim, smena, date) {
  if(!canSupervisorEdit(bolim, smena)) { showToast("Bu smena sizning nazoratda emas!",'err'); return; }
  davState = {
    date, bolim, smena,
    attendance: {},
    boshCount: 0,
    yordamchilar: []
  };
  const existing = getDavomat(date, bolim, smena);
  if(existing) {
    davState.attendance = JSON.parse(JSON.stringify(existing.attendance));
    davState.boshCount = existing.boshCount||0;
    davState.yordamchilar = [...(existing.yordamchilar||[])];
  }
  // Supervisor admin davomat formasini ishlatadi
  initAdminDavomat();
  // Step 2 ga o'tish
  davState.bolim = bolim; davState.smena = smena; davState.date = date;
  setTimeout(() => startAdminDavomat(), 100);
}

// --- MAS'UL: faqat sana tanlaydi, bo'lim/smena avtomatik (yoki tanlash) ---
function initMasUlDavomat() {
  const wrap=document.getElementById('page-davomat');
  const extraSmenalar = currentUser.extra_smenalar || [];
  const allSmenalar = [currentUser.smena, ...extraSmenalar];
  const hasExtra = extraSmenalar.length > 0;
  window._masulSelectedSmena = currentUser.smena;

  const smenaSelectHtml = hasExtra ? `
    <div class="card" style="margin-top:1rem">
      <div class="card-title">Smenani tanlang</div>
      <div class="grid-select">
        ${allSmenalar.map(s=>`
          <div class="grid-btn ${s===currentUser.smena?'selected':''}" id="masul-smena-btn-${s}" onclick="selectMasulSmena('${s}')">
            <div class="gb-label">${s} smena</div>
            <div class="gb-sub">${DB.xodimlar.filter(e=>e.bolim===currentUser.bolim&&e.smena===s).length} xodim</div>
          </div>`).join('')}
      </div>
    </div>` : '';

  wrap.innerHTML=`
    <div id="masul-step1">
      <div class="page-header">
        <div>
          <h2>Davomat Kiritish</h2>
          <p>${currentUser.name} — <b>${currentUser.bolim}</b> bo'lim</p>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Sanani tanlang</div>
        <input type="date" id="masul-date" style="max-width:220px" value="${todayStr()}" max="${todayStr()}" min="${todayStr()}" onchange="checkMasUlState()">
        <div style="margin-top:1rem;font-size:12px;color:var(--text2)">
          ⏰ Davomat kiritish vaqti: <span style="color:var(--amber)">Kunduzgi 07:45–08:25</span> | <span style="color:var(--blue)">Tungi 19:45–20:25</span>
        </div>
      </div>
      ${smenaSelectHtml}
      <div id="masul-time-warn" class="alert err" style="display:none">🔒 Hozir davomat kiritish vaqti emas. Kunduzgi: 07:45–08:25 | Tungi: 19:45–20:25</div>
      <div id="masul-already-warn" class="alert" style="display:none"></div>
      <div class="btn-row" style="justify-content:flex-start">
        <button class="btn primary" onclick="startMasUlDavomat()">Davom etish →</button>
      </div>
    </div>
    <div id="masul-step2" style="display:none"></div>
    <div id="masul-step3" style="display:none"></div>
  `;
  checkMasUlState();
}

function selectMasulSmena(s) {
  window._masulSelectedSmena = s;
  const allSmenalar = [currentUser.smena, ...(currentUser.extra_smenalar||[])];
  allSmenalar.forEach(sm => {
    const btn = document.getElementById('masul-smena-btn-'+sm);
    if(btn) { btn.className = 'grid-btn' + (sm===s?' selected':''); btn.querySelector('.gb-label').style.color = sm===s?'var(--green)':''; }
  });
  checkMasUlState();
}

function checkMasUlState() {
  const date=document.getElementById('masul-date')?.value||todayStr();
  const selectedSmena = window._masulSelectedSmena || currentUser.smena;
  const dav=getDavomat(date,currentUser.bolim,selectedSmena);
  const alWarn=document.getElementById('masul-already-warn');
  if(dav){
    const editOk=isEditAllowed(dav.kiritilgan_vaqt);
    alWarn.style.display='block';
    alWarn.className=editOk?'alert warn':'alert err';
    alWarn.textContent=editOk?'✏️ Davomat kiritilgan. Tahrirlash muddati (10 daq) tugamagan.':'🔒 Davomat kiritilgan va tahrirlash muddati tugagan.';
  } else { alWarn.style.display='none'; }

  // Grafik va vaqt tekshiruvi
  const tw=document.getElementById('masul-time-warn');
  if(tw) {
    const check = canMasUlEnterNow();
    if(!check.ok) {
      tw.style.display='block';
      tw.textContent='🔒 '+check.reason;
    } else {
      tw.style.display='none';
    }
  }
}

function startMasUlDavomat() {
  const date=document.getElementById('masul-date').value||todayStr();
  const selectedSmena = window._masulSelectedSmena || currentUser.smena;
  if(date!==todayStr()){ showToast("Faqat bugungi kun uchun davomat kiritish mumkin!",'err'); return; }

  // Grafik va vaqt tekshiruvi
  const check = canMasUlEnterNow();
  if(!check.ok){ showToast("❌ "+check.reason,'err'); return; }

  const existing=getDavomat(date,currentUser.bolim,selectedSmena);
  if(existing&&!isEditAllowed(existing.kiritilgan_vaqt)){ showToast("Tahrirlash muddati tugagan!",'err'); return; }

  davState={
    date, bolim:currentUser.bolim, smena:selectedSmena,
    attendance: existing?JSON.parse(JSON.stringify(existing.attendance)):{},
    boshCount: existing?existing.boshCount||0:0,
    yordamchilar: existing?[...(existing.yordamchilar||[])]:[]
  };

  document.getElementById('masul-step1').style.display='none';
  renderMasUlForm();
}

function renderMasUlForm() {
  const emps=getEmpsForSmena(davState.bolim,davState.smena);
  const b=getBolim(davState.bolim);
  const step2=document.getElementById('masul-step2');
  step2.style.display='block';
  step2.innerHTML=`
    <div class="page-header">
      <div>
        <h2>${davState.bolim} — ${davState.smena} smena</h2>
        <p>${formatDate(davState.date)} • ${b?.ish_orni||0} ish o'rni</p>
      </div>
      <button class="btn ghost" onclick="initMasUlDavomat()">← Orqaga</button>
    </div>
    <div id="masul-time-badge" class="alert info" style="margin-bottom:1rem">
      ${isKunduziWindow()?'🟢 Kunduzgi smena vaqti (07:45–08:25)':isTungiWindow()?'🟢 Tungi smena vaqti (19:45–20:25)':'⚪ Nazorat vaqtidan tashqari — test rejim'}
    </div>
    <div class="stats-row" id="masul-live-stats"></div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">Xodimlar ro'yxati</div>
        <span style="font-size:11px;color:var(--text2)">${emps.length} nafar</span>
      </div>
      <div id="masul-emp-list"></div>
    </div>
    <div class="bosh-section">
      <div class="section-mini-title sm-title-blue">📦 Bo'sh ish o'rinlari</div>
      <div style="display:flex;align-items:center;gap:10px;max-width:180px;margin-top:.5rem">
        <input type="number" id="masul-bosh" min="0" value="${davState.boshCount}" style="text-align:center" onchange="masulUpdateStats()">
        <span style="font-size:12px;color:var(--text2)">bo'sh o'rin</span>
      </div>
    </div>
    <div class="yordam-section">
      <div class="section-mini-title sm-title-purple">🤝 Yordamga chiqqan xodimlar</div>
      <div id="masul-yordam-list"></div>
      <div style="display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap">
        <input type="text" id="masul-yordam-inp" placeholder="Tabel raqami" style="max-width:150px" onkeydown="if(event.key==='Enter')addMasulYordam()">
        <button class="btn sm" onclick="addMasulYordam()">+ Qo'shish</button>
        <span id="masul-yordam-found" style="font-size:11px"></span>
      </div>
    </div>
    <div class="btn-row" style="margin-top:1rem">
      <button class="btn ghost" onclick="initMasUlDavomat()">← Orqaga</button>
      <button class="btn primary" onclick="saveMasUlDavomat()">✓ Saqlash</button>
    </div>
  `;
  // yordam input listener
  const yi=document.getElementById('masul-yordam-inp');
  if(yi) yi.addEventListener('input',function(){
    const found=findByTabel(this.value);
    const msg=document.getElementById('masul-yordam-found');
    if(found) msg.innerHTML=`<span style="color:var(--green)">✓ ${found.ism} (${found.bolim}/${found.smena})</span>`;
    else if(this.value.length>1) msg.innerHTML=`<span style="color:var(--text3)">Topilmadi</span>`;
    else msg.textContent='';
  });
  masulUpdateStats();
  renderMasUlEmpList();
  renderMasUlYordamList();
}

function renderMasUlEmpList() {
  const emps=getEmpsForSmena(davState.bolim,davState.smena);
  const list=document.getElementById('masul-emp-list');
  if(!list) return;
  list.innerHTML=emps.map(e=>{
    const att=davState.attendance[e.id]||{};
    const isYoq=att.holat==='yoq', isKech=att.holat==='kech', isErta=att.holat==='erta';
    const rowCls=isYoq?'emp-row yoq-row':isKech?'emp-row kech-row':isErta?'emp-row erta-row':'emp-row';
    return `<div class="${rowCls}" id="er-${e.id}">
      <div><input type="checkbox" class="emp-check" ${isYoq?'checked':''} onchange="masulToggleYoq(${e.id},this)" title="Kelmadi"></div>
      <div><div class="emp-name">${e.ism}</div><div class="emp-tabel">${e.tabel}</div></div>
      <div class="emp-actions">
        ${isYoq?`
          <select class="reason-sel" onchange="masulSetSabab(${e.id},this.value)">
            ${DB.sabablar.filter(s=>s.kod!=='KECH').map(s=>`<option value="${s.kod}" ${att.sabab===s.kod?'selected':''}>${s.kod} — ${s.nom}</option>`).join('')}
          </select>`
        :isKech?`
          <input type="text" class="kech-input" placeholder="09:45" value="${att.kechVaqt||''}" onchange="masulSetKechVaqt(${e.id},this.value)" title="Kelgan vaqt">
          <span style="font-size:11px;color:var(--text2)">da keldi</span>
          <button class="btn xs ghost" onclick="masulClearAtt(${e.id})">✕</button>`
        :isErta?`
          <input type="text" class="kech-input" placeholder="15:30" value="${att.ertaVaqt||''}" onchange="masulSetErtaVaqt(${e.id},this.value)" title="Ketgan vaqt">
          <span style="font-size:11px;color:var(--text2)">da ketdi</span>
          <button class="btn xs ghost" onclick="masulClearAtt(${e.id})">✕</button>`
        :`
          <button class="btn xs" onclick="masulSetKechMode(${e.id})" title="Kech keldi">⏰ Kech</button>
          <button class="btn xs" onclick="masulSetErtaMode(${e.id})" title="Erta ketdi" style="color:var(--amber);border-color:var(--amber)">🚶 Erta</button>`}
      </div>
    </div>`;
  }).join('');
}

function masulToggleYoq(id,cb){ if(cb.checked) davState.attendance[id]={holat:'yoq',sabab:'BS'}; else delete davState.attendance[id]; masulUpdateStats(); renderMasUlEmpList(); }
function masulSetSabab(id,sabab){ if(davState.attendance[id]) davState.attendance[id].sabab=sabab; }
function masulSetKechMode(id){ davState.attendance[id]={holat:'kech',sabab:'KECH',kechVaqt:''}; masulUpdateStats(); renderMasUlEmpList(); }
function masulSetErtaMode(id){ davState.attendance[id]={holat:'erta',sabab:'ERTA',ertaVaqt:''}; masulUpdateStats(); renderMasUlEmpList(); }
function masulSetKechVaqt(id,val){ if(davState.attendance[id]) davState.attendance[id].kechVaqt=val; }
function masulSetErtaVaqt(id,val){ if(davState.attendance[id]) davState.attendance[id].ertaVaqt=val; }
function masulClearAtt(id){ delete davState.attendance[id]; masulUpdateStats(); renderMasUlEmpList(); }

function masulUpdateStats() {
  const emps=getEmpsForSmena(davState.bolim,davState.smena);
  let k=0,ke=0,y=0,er=0;
  for(const e of emps){
    const att=davState.attendance[e.id];
    if(!att||att.holat==='keldi') k++;
    else if(att.holat==='kech') ke++;
    else if(att.holat==='erta') er++;
    else y++;
  }
  const bosh=parseInt(document.getElementById('masul-bosh')?.value||0)||0;
  davState.boshCount=bosh;
  const sl=document.getElementById('masul-live-stats');
  if(sl) sl.innerHTML=`
    <div class="stat"><div class="sv">${emps.length}</div><div class="sl">Ro'yhatda</div></div>
    <div class="stat green"><div class="sv">${k}</div><div class="sl">Keldi</div></div>
    <div class="stat amber"><div class="sv">${ke}</div><div class="sl">Kechikdi</div></div>
    <div class="stat red"><div class="sv">${y}</div><div class="sl">Kelmadi</div></div>
    <div class="stat" style="--c:var(--amber)"><div class="sv" style="color:var(--amber)">${er}</div><div class="sl">Erta ketdi</div></div>
    <div class="stat blue"><div class="sv">${bosh}</div><div class="sl">Bo'sh o'rin</div></div>
    <div class="stat purple"><div class="sv">${davState.yordamchilar.length}</div><div class="sl">Yordamchi</div></div>`;
}

function addMasulYordam(){
  const inp=document.getElementById('masul-yordam-inp');
  const tabel=inp.value.trim();
  if(!tabel) return;
  if(davState.yordamchilar.find(y=>y.tabel.toUpperCase()===tabel.toUpperCase())){ showToast("Allaqachon qo'shilgan!",'warn'); return; }
  const found=findByTabel(tabel);
  davState.yordamchilar.push({tabel:tabel.toUpperCase(),ism:found?found.ism:"Noma'lum",bolim:found?found.bolim:'',smena:found?found.smena:'',topildi:!!found});
  inp.value=''; document.getElementById('masul-yordam-found').textContent='';
  renderMasUlYordamList(); masulUpdateStats();
}
function renderMasUlYordamList(){
  const list=document.getElementById('masul-yordam-list'); if(!list) return;
  list.innerHTML=davState.yordamchilar.map((y,i)=>
    `<div class="yordam-chip">
      <span class="badge b-yordam">Yordam</span>
      <span style="font-family:var(--mono);font-size:11px;color:var(--text2)">${y.tabel}</span>
      <span style="flex:1;font-size:12px">${y.ism}</span>
      ${y.topildi?`<span style="font-size:10px;color:var(--text3)">${y.bolim}/${y.smena}</span>`:''}
      <button class="btn xs danger" onclick="removeMasulYordam(${i})">✕</button>
    </div>`
  ).join('');
}
function removeMasulYordam(i){ davState.yordamchilar.splice(i,1); renderMasUlYordamList(); masulUpdateStats(); }

function saveMasUlDavomat(){
  davState.boshCount=parseInt(document.getElementById('masul-bosh')?.value||0)||0;
  // Grafik va vaqt tekshiruvi
  const check = canMasUlEnterNow();
  if(!check.ok){ showToast("❌ "+check.reason,'err'); return; }
  const smenaType=check.tip||detectSmenaType();
  const key=getDavomatKey(davState.date,davState.bolim,davState.smena);
  const now=new Date().toISOString();
  DB.davomat[key]={
    date:davState.date, bolim:davState.bolim, smena:davState.smena,
    smenaType, // 'kunduzgi' yoki 'tungi'
    attendance:JSON.parse(JSON.stringify(davState.attendance)),
    boshCount:davState.boshCount,
    yordamchilar:[...davState.yordamchilar],
    kiritgan:currentUser.id,
    kiritilgan_vaqt:now,
  };
  Storage.save();
  davState.savedAt=now;
  showToast('✓ Davomat saqlandi! 10 daqiqa ichida tahrirlash mumkin.','ok');
  // Show result
  showMasUlResult(key);
  // Edit timer
  if(editTimer) clearTimeout(editTimer);
  editTimer=setTimeout(()=>{ showToast("Tahrirlash muddati tugadi!",'warn'); refreshResultButtons(); },10*60*1000);
}

function showMasUlResult(key) {
  const dav=DB.davomat[key];
  const emps=getEmpsForSmena(dav.bolim,dav.smena);
  document.getElementById('masul-step2').style.display='none';
  const step3=document.getElementById('masul-step3');
  step3.style.display='block';

  let keldi=0,kech=0,yoq=0,erta=0;
  const rows=[];
  for(const e of emps){
    const att=dav.attendance[e.id];
    let holat='keldi',sabab='—',izoh='—';
    if(att){
      if(att.holat==='yoq'){yoq++;holat='yoq';const sb=DB.sabablar.find(x=>x.kod===att.sabab);sabab=att.sabab;izoh=sb?sb.nom:'—';}
      else if(att.holat==='kech'){kech++;holat='kech';izoh=(att.kechVaqt||'?')+' da keldi';}
      else if(att.holat==='erta'){erta++;holat='erta';izoh=(att.ertaVaqt||'?')+' da ketdi';}
      else keldi++;
    } else keldi++;
    rows.push({e,holat,sabab,izoh});
  }

  const bM={keldi:'b-keldi',kech:'b-kech',yoq:'b-yoq',erta:'b-kech',bosh:'b-bosh',yordam:'b-yordam'};
  const lM={keldi:'Keldi',kech:'Kechikdi',yoq:'Kelmadi',erta:'Erta ketdi',bosh:"Bo'sh",yordam:'Yordam'};

  step3.innerHTML=`
    <div class="page-header">
      <div>
        <h2>✅ Davomat Saqlandi</h2>
        <p>${dav.bolim} — ${dav.smena} smena | ${formatDate(dav.date)} | ${dav.smenaType||'—'} smena</p>
      </div>
    </div>
    <div class="stats-row" style="margin-bottom:1.5rem">
      <div class="stat"><div class="sv">${emps.length}</div><div class="sl">Jami</div></div>
      <div class="stat green"><div class="sv">${keldi}</div><div class="sl">Keldi</div></div>
      <div class="stat amber"><div class="sv">${kech}</div><div class="sl">Kechikdi</div></div>
      <div class="stat red"><div class="sv">${yoq}</div><div class="sl">Kelmadi</div></div>
      <div class="stat" style=""><div class="sv" style="color:var(--amber)">${erta}</div><div class="sl">Erta ketdi</div></div>
      <div class="stat blue"><div class="sv">${dav.boshCount||0}</div><div class="sl">Bo'sh o'rin</div></div>
      <div class="stat purple"><div class="sv">${(dav.yordamchilar||[]).length}</div><div class="sl">Yordamchi</div></div>
    </div>
    <div class="card">
      <div class="card-title">Davomat xisoboti</div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>#</th><th>Tabel</th><th>Ism Familiya</th><th>Holat</th><th>Izoh</th></tr></thead>
        <tbody>
          ${rows.map((r,i)=>`<tr>
            <td style="color:var(--text3)">${i+1}</td>
            <td style="font-family:var(--mono);color:var(--text2)">${r.e.tabel}</td>
            <td style="font-weight:500">${r.e.ism}</td>
            <td><span class="badge ${bM[r.holat]||''}">${lM[r.holat]||r.holat}</span></td>
            <td style="font-size:11px;color:var(--text2)">${r.izoh}</td>
          </tr>`).join('')}
          ${(dav.yordamchilar||[]).map((y,i)=>`<tr>
            <td style="color:var(--text3)">${rows.length+i+1}</td>
            <td style="font-family:var(--mono);color:var(--purple)">${y.tabel}</td>
            <td style="color:var(--purple)">${y.ism}</td>
            <td><span class="badge b-yordam">Yordam</span></td>
            <td style="font-size:11px;color:var(--text2)">${y.bolim?y.bolim+'/'+y.smena+' dan':''}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>
    <div id="result-edit-btn" class="btn-row" style="justify-content:flex-start">
      <button class="btn" onclick="editMasUlDavomat('${key}')">✏️ Tahrirlash</button>
    </div>
    <div id="result-timer-info" style="font-size:11px;color:var(--text2);margin-top:.5rem">
      ⏳ Tahrirlash muddati: saqlangandan 10 daqiqa ichida
    </div>
  `;
  refreshResultButtons();
}

function refreshResultButtons(){
  const dav=DB.davomat[getDavomatKey(davState.date,davState.bolim,davState.smena)];
  const btn=document.getElementById('result-edit-btn');
  const info=document.getElementById('result-timer-info');
  if(!btn||!dav) return;
  const ok=isEditAllowed(dav.kiritilgan_vaqt);
  btn.style.display=ok?'flex':'none';
  if(info) info.textContent=ok?'⏳ Tahrirlash muddati hali tugamagan':'🔒 Tahrirlash muddati tugadi';
}

function editMasUlDavomat(key){
  const dav=DB.davomat[key];
  if(!dav||!isEditAllowed(dav.kiritilgan_vaqt)){ showToast("Tahrirlash muddati tugagan!",'err'); return; }
  davState={
    date:dav.date, bolim:dav.bolim, smena:dav.smena,
    attendance:JSON.parse(JSON.stringify(dav.attendance)),
    boshCount:dav.boshCount||0,
    yordamchilar:[...(dav.yordamchilar||[])]
  };
  document.getElementById('masul-step3').style.display='none';
  renderMasUlForm();
}

// ============================================================
// DAVOMAT — ADMIN
// ============================================================
function initAdminDavomat() {
  const wrap=document.getElementById('page-davomat');
  wrap.innerHTML=`
    <div id="dav-step1">
      <div class="page-header"><div><h2>Davomat Kiritish</h2><p>Sana, ish joyi va smenani tanlang</p></div></div>
      <div class="card">
        <div class="card-title">1. Sana</div>
        <input type="date" id="dav-date-inp" style="max-width:220px" value="${todayStr()}">
      </div>
      <div class="card" id="dav-bolim-card">
        <div class="card-title">2. Ish joyi</div>
        <div class="grid-select" id="dav-bolim-grid"></div>
      </div>
      <div class="card" id="dav-smena-card" style="display:none">
        <div class="card-title">3. Smena</div>
        <div class="grid-select" id="dav-smena-grid"></div>
      </div>
      <div id="dav-already-warn" class="alert ok" style="display:none"></div>
      <div class="btn-row" style="justify-content:flex-start">
        <button class="btn primary" onclick="startAdminDavomat()">Davom etish →</button>
      </div>
    </div>
    <div id="dav-step2" style="display:none">
      <div class="page-header">
        <div><h2 id="dav-s2-title">Davomat</h2><p id="dav-s2-sub"></p></div>
        <button class="btn ghost" onclick="initAdminDavomat()">← Orqaga</button>
      </div>
      <div id="dav-time-badge-wrap" class="alert info" style="margin-bottom:1rem"></div>
      <div class="stats-row" id="dav-live-stats"></div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">Xodimlar ro'yxati</div>
          <span style="font-size:11px;color:var(--text2)" id="dav-emp-count"></span>
        </div>
        <div id="dav-emp-list"></div>
      </div>
      <div class="bosh-section">
        <div class="section-mini-title sm-title-blue">📦 Bo'sh ish o'rinlari</div>
        <div style="display:flex;align-items:center;gap:10px;max-width:180px;margin-top:.5rem">
          <input type="number" id="dav-bosh" min="0" value="0" style="text-align:center" onchange="updateLiveStats()">
          <span style="font-size:12px;color:var(--text2)">bo'sh o'rin</span>
        </div>
      </div>
      <div class="yordam-section">
        <div class="section-mini-title sm-title-purple">🤝 Yordamga chiqqan xodimlar</div>
        <div id="dav-yordam-list"></div>
        <div style="display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap">
          <input type="text" id="dav-yordam-inp" placeholder="Tabel raqami" style="max-width:150px" onkeydown="if(event.key==='Enter')addYordam()">
          <button class="btn sm" onclick="addYordam()">+ Qo'shish</button>
          <span id="dav-yordam-found" style="font-size:11px"></span>
        </div>
      </div>
      <div class="btn-row" style="margin-top:1rem">
        <button class="btn ghost" onclick="initAdminDavomat()">← Orqaga</button>
        <button class="btn primary" onclick="saveAdminDavomat()">✓ Saqlash</button>
      </div>
    </div>
  `;
  renderAdminBolimGrid();
  const yi=document.getElementById('dav-yordam-inp');
  if(yi) yi.addEventListener('input',function(){
    const found=findByTabel(this.value);
    const msg=document.getElementById('dav-yordam-found');
    if(found) msg.innerHTML=`<span style="color:var(--green)">✓ ${found.ism} (${found.bolim}/${found.smena})</span>`;
    else if(this.value.length>1) msg.innerHTML=`<span style="color:var(--text3)">Topilmadi</span>`;
    else msg.textContent='';
  });
}

function renderAdminBolimGrid(){
  const grid=document.getElementById('dav-bolim-grid'); if(!grid) return;
  grid.innerHTML=DB.bolimlar.map(b=>{
    const sel=davState.bolim===b.id?'selected':'';
    return `<div class="grid-btn ${sel}" onclick="selectAdminBolim('${b.id}')">
      <div class="gb-label">${b.nom}</div>
      <div class="gb-sub">${b.smenalar.join(', ')} smena</div>
      <div class="gb-sub">${DB.xodimlar.filter(e=>e.bolim===b.id).length} xodim</div>
    </div>`;
  }).join('');
  const sc=document.getElementById('dav-smena-card');
  if(sc) sc.style.display=davState.bolim?'block':'none';
  if(davState.bolim) renderAdminSmenaGrid();
}
function selectAdminBolim(id){ davState.bolim=id; davState.smena=''; renderAdminBolimGrid(); }
function renderAdminSmenaGrid(){
  const b=getBolim(davState.bolim); if(!b) return;
  const date=document.getElementById('dav-date-inp')?.value||todayStr();
  document.getElementById('dav-smena-grid').innerHTML=b.smenalar.map(s=>{
    const dav=getDavomat(date,b.id,s);
    const sel=davState.smena===s?'selected':'';
    return `<div class="grid-btn ${sel} ${dav?'done':''}" onclick="selectAdminSmena('${s}')">
      <div class="gb-label">${s} smena</div>
      <div class="gb-sub">${DB.xodimlar.filter(e=>e.bolim===b.id&&e.smena===s).length} xodim</div>
      ${dav?'<div class="gb-sub" style="color:var(--green)">✓ Kiritilgan</div>':''}
    </div>`;
  }).join('');
}
function selectAdminSmena(s){
  davState.smena=s; renderAdminSmenaGrid();
  const date=document.getElementById('dav-date-inp')?.value||todayStr();
  const dav=getDavomat(date,davState.bolim,s);
  const aw=document.getElementById('dav-already-warn');
  if(dav){ const ok=isEditAllowed(dav.kiritilgan_vaqt); aw.style.display='block'; aw.className=ok?'alert warn':'alert err'; aw.textContent=ok?'✏️ Kiritilgan, tahrirlash mumkin':'🔒 Kiritilgan, tahrirlash muddati tugagan'; }
  else aw.style.display='none';
}
function startAdminDavomat(){
  const date=document.getElementById('dav-date-inp')?.value||todayStr();
  if(!davState.bolim||!davState.smena){ showToast("Ish joyi va smenani tanlang!",'err'); return; }
  davState.date=date;
  const existing=getDavomat(date,davState.bolim,davState.smena);
  davState.attendance=existing?JSON.parse(JSON.stringify(existing.attendance)):{};
  davState.boshCount=existing?existing.boshCount||0:0;
  davState.yordamchilar=existing?[...(existing.yordamchilar||[])]:[];
  document.getElementById('dav-step1').style.display='none';
  document.getElementById('dav-step2').style.display='block';
  const b=getBolim(davState.bolim);
  document.getElementById('dav-s2-title').textContent=davState.bolim+' — '+davState.smena+' smena';
  document.getElementById('dav-s2-sub').textContent=formatDate(date)+' • '+b?.ish_orni+' ish o\'rni';
  const badge=document.getElementById('dav-time-badge-wrap');
  badge.textContent=isKunduziWindow()?'🟢 Kunduzgi smena vaqti':isTungiWindow()?'🟢 Tungi smena vaqti':'⚪ Nazorat vaqtidan tashqari';
  document.getElementById('dav-bosh').value=davState.boshCount;
  renderAdminEmpList(); updateLiveStats(); renderDavYordamList();
}
function renderAdminEmpList(){
  const emps=getEmpsForSmena(davState.bolim,davState.smena);
  const list=document.getElementById('dav-emp-list');
  const cnt=document.getElementById('dav-emp-count');
  if(cnt) cnt.textContent=emps.length+" nafar";
  if(!emps.length){ list.innerHTML='<div style="padding:1.5rem;text-align:center;color:var(--text3)">Xodimlar topilmadi</div>'; return; }
  list.innerHTML=emps.map(e=>{
    const att=davState.attendance[e.id]||{};
    const isYoq=att.holat==='yoq', isKech=att.holat==='kech', isErta=att.holat==='erta';
    const rowCls=isYoq?'emp-row yoq-row':isKech?'emp-row kech-row':isErta?'emp-row erta-row':'emp-row';
    return `<div class="${rowCls}">
      <div><input type="checkbox" class="emp-check" ${isYoq?'checked':''} onchange="toggleYoq(${e.id},this)"></div>
      <div><div class="emp-name">${e.ism}</div><div class="emp-tabel">${e.tabel}</div></div>
      <div class="emp-actions">
        ${isYoq?`<select class="reason-sel" onchange="setSabab(${e.id},this.value)">${DB.sabablar.filter(s=>s.kod!=='KECH').map(s=>`<option value="${s.kod}" ${att.sabab===s.kod?'selected':''}>${s.kod} — ${s.nom}</option>`).join('')}</select>`
        :isKech?`<input type="text" class="kech-input" placeholder="09:45" value="${att.kechVaqt||''}" onchange="setKechVaqt(${e.id},this.value)"><span style="font-size:11px;color:var(--text2)">da keldi</span><button class="btn xs ghost" onclick="clearAtt(${e.id})">✕</button>`
        :isErta?`<input type="text" class="kech-input" placeholder="15:30" value="${att.ertaVaqt||''}" onchange="setErtaVaqt(${e.id},this.value)"><span style="font-size:11px;color:var(--text2)">da ketdi</span><button class="btn xs ghost" onclick="clearAtt(${e.id})">✕</button>`
        :`<button class="btn xs" onclick="setKechMode(${e.id})">⏰ Kech</button><button class="btn xs" onclick="setErtaMode(${e.id})" style="color:var(--amber);border-color:var(--amber)">🚶 Erta</button>`}
      </div>
    </div>`;
  }).join('');
}
function toggleYoq(id,cb){ if(cb.checked) davState.attendance[id]={holat:'yoq',sabab:'BS'}; else delete davState.attendance[id]; updateLiveStats(); renderAdminEmpList(); }
function setSabab(id,s){ if(davState.attendance[id]) davState.attendance[id].sabab=s; }
function setKechMode(id){ davState.attendance[id]={holat:'kech',sabab:'KECH',kechVaqt:''}; updateLiveStats(); renderAdminEmpList(); }
function setErtaMode(id){ davState.attendance[id]={holat:'erta',sabab:'ERTA',ertaVaqt:''}; updateLiveStats(); renderAdminEmpList(); }
function setKechVaqt(id,val){ if(davState.attendance[id]) davState.attendance[id].kechVaqt=val; }
function setErtaVaqt(id,val){ if(davState.attendance[id]) davState.attendance[id].ertaVaqt=val; }
function clearAtt(id){ delete davState.attendance[id]; updateLiveStats(); renderAdminEmpList(); }
function updateLiveStats(){
  const emps=getEmpsForSmena(davState.bolim,davState.smena);
  let k=0,ke=0,y=0,er=0;
  for(const e of emps){ const att=davState.attendance[e.id]; if(!att||att.holat==='keldi') k++; else if(att.holat==='kech') ke++; else if(att.holat==='erta') er++; else y++; }
  const bosh=parseInt(document.getElementById('dav-bosh')?.value||0)||0;
  davState.boshCount=bosh;
  const sl=document.getElementById('dav-live-stats');
  if(sl) sl.innerHTML=`
    <div class="stat"><div class="sv">${emps.length}</div><div class="sl">Ro'yhatda</div></div>
    <div class="stat green"><div class="sv">${k}</div><div class="sl">Keldi</div></div>
    <div class="stat amber"><div class="sv">${ke}</div><div class="sl">Kechikdi</div></div>
    <div class="stat red"><div class="sv">${y}</div><div class="sl">Kelmadi</div></div>
    <div class="stat"><div class="sv" style="color:var(--amber)">${er}</div><div class="sl">Erta ketdi</div></div>
    <div class="stat blue"><div class="sv">${bosh}</div><div class="sl">Bo'sh o'rin</div></div>
    <div class="stat purple"><div class="sv">${davState.yordamchilar.length}</div><div class="sl">Yordamchi</div></div>`;
}
function addYordam(){
  const inp=document.getElementById('dav-yordam-inp'); const tabel=inp.value.trim(); if(!tabel) return;
  if(davState.yordamchilar.find(y=>y.tabel.toUpperCase()===tabel.toUpperCase())){ showToast("Allaqachon qo'shilgan!",'warn'); return; }
  const found=findByTabel(tabel);
  davState.yordamchilar.push({tabel:tabel.toUpperCase(),ism:found?found.ism:"Noma'lum",bolim:found?found.bolim:'',smena:found?found.smena:'',topildi:!!found});
  inp.value=''; document.getElementById('dav-yordam-found').textContent='';
  renderDavYordamList(); updateLiveStats();
}
function renderDavYordamList(){
  const list=document.getElementById('dav-yordam-list'); if(!list) return;
  list.innerHTML=davState.yordamchilar.map((y,i)=>`<div class="yordam-chip"><span class="badge b-yordam">Yordam</span><span style="font-family:var(--mono);font-size:11px;color:var(--text2)">${y.tabel}</span><span style="flex:1;font-size:12px">${y.ism}</span>${y.topildi?`<span style="font-size:10px;color:var(--text3)">${y.bolim}/${y.smena}</span>`:''}<button class="btn xs danger" onclick="removeYordam(${i})">✕</button></div>`).join('');
}
function removeYordam(i){ davState.yordamchilar.splice(i,1); renderDavYordamList(); updateLiveStats(); }
function saveAdminDavomat(){
  davState.boshCount=parseInt(document.getElementById('dav-bosh')?.value||0)||0;
  const smenaType=detectSmenaType();
  const key=getDavomatKey(davState.date,davState.bolim,davState.smena);
  DB.davomat[key]={date:davState.date,bolim:davState.bolim,smena:davState.smena,smenaType,attendance:JSON.parse(JSON.stringify(davState.attendance)),boshCount:davState.boshCount,yordamchilar:[...davState.yordamchilar],kiritgan:currentUser.id,kiritilgan_vaqt:new Date().toISOString()};
  Storage.save(); showToast('✓ Davomat saqlandi!','ok'); initAdminDavomat();
}

// ============================================================
// JAMLANMA
// ============================================================
function renderJamlanma(){
  const date=todayStr();
  document.getElementById('jam-date-label').textContent=formatDate(date);
  let tK=0,tKe=0,tY=0,tEr=0,tB=0,tYr=0,tT=0;
  const cards=[];
  for(const b of getFilteredBolimlar()){
    for(const s of b.smenalar){
      const dav=getDavomat(date,b.id,s); const emps=getEmpsForSmena(b.id,s);
      let k=0,ke=0,y=0,er=0;
      for(const e of emps){ const att=dav?dav.attendance[e.id]:null; if(!att||att.holat==='keldi') k++; else if(att.holat==='kech') ke++; else if(att.holat==='erta') er++; else y++; }
      const bosh=dav?dav.boshCount||0:0,yordam=dav?(dav.yordamchilar||[]).length:0;
      tK+=k;tKe+=ke;tY+=y;tEr+=er;tB+=bosh;tYr+=yordam;tT+=emps.length;
      cards.push({b,s,k,ke,y,er,bosh,yordam,total:emps.length,pct:emps.length?Math.round(k/emps.length*100):0,dav});
    }
  }
  document.getElementById('jam-stats').innerHTML=`
    <div class="stat"><div class="sv">${tT}</div><div class="sl">Jami</div></div>
    <div class="stat green"><div class="sv">${tK}</div><div class="sl">Keldi</div></div>
    <div class="stat amber"><div class="sv">${tKe}</div><div class="sl">Kechikdi</div></div>
    <div class="stat red"><div class="sv">${tY}</div><div class="sl">Kelmadi</div></div>
    <div class="stat"><div class="sv" style="color:var(--amber)">${tEr}</div><div class="sl">Erta ketdi</div></div>
    <div class="stat blue"><div class="sv">${tB}</div><div class="sl">Bo'sh o'rin</div></div>
    <div class="stat purple"><div class="sv">${tYr}</div><div class="sl">Yordamchi</div></div>`;
  document.getElementById('jam-bolim-cards').innerHTML=cards.map(c=>`
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;">
        <span style="font-weight:700;font-family:var(--mono);font-size:13px">${c.b.nom}</span>
        <div style="display:flex;gap:4px;">
          <span style="font-size:10px;background:var(--bg4);padding:2px 7px;border-radius:10px;color:var(--text2)">${c.s}</span>
          <span class="badge ${c.dav?'b-kiritilgan':'b-kutilmoqda'}">${c.dav?'✓':'Kutilmoqda'}</span>
        </div>
      </div>
      <div style="display:flex;gap:10px;font-size:12px;margin-bottom:.5rem;flex-wrap:wrap">
        <span style="color:var(--green)">✓${c.k}</span><span style="color:var(--amber)">⏰${c.ke}</span>
        <span style="color:var(--red)">✗${c.y}</span><span style="color:var(--amber)">🚶${c.er}</span>
        <span style="color:var(--blue)">📦${c.bosh}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${c.pct}%"></div></div>
      <div style="font-size:10px;color:var(--text3);margin-top:3px;font-family:var(--mono)">${c.pct}% davomat</div>
    </div>`).join('');
  allJamRows=[]; let rn=1;
  const bM={keldi:'b-keldi',kech:'b-kech',yoq:'b-yoq',erta:'b-kech',bosh:'b-bosh',yordam:'b-yordam'};
  const lM={keldi:'Keldi',kech:'Kechikdi',yoq:'Kelmadi',erta:'Erta ketdi',bosh:"Bo'sh",yordam:'Yordam'};
  for(const b of getFilteredBolimlar()){
    for(const s of b.smenalar){
      const dav=getDavomat(date,b.id,s); const emps=getEmpsForSmena(b.id,s);
      for(const e of emps){
        const att=dav?dav.attendance[e.id]:null;
        let holat='keldi',izoh='—';
        if(att){ if(att.holat==='yoq'){holat='yoq';const sb=DB.sabablar.find(x=>x.kod===att.sabab);izoh=att.sabab+(sb?' — '+sb.nom:'');}
        else if(att.holat==='kech'){holat='kech';izoh=(att.kechVaqt||'?')+' da keldi';}
        else if(att.holat==='erta'){holat='erta';izoh=(att.ertaVaqt||'?')+' da ketdi';}}
        allJamRows.push({rn:rn++,e,b:b.nom,s,holat,izoh});
      }
      if(dav&&dav.boshCount) for(let i=0;i<dav.boshCount;i++) allJamRows.push({rn:rn++,e:{ism:"Bo'sh o'rin",tabel:'—'},b:b.nom,s,holat:'bosh',izoh:'—'});
      if(dav&&dav.yordamchilar) for(const y of dav.yordamchilar) allJamRows.push({rn:rn++,e:{ism:y.ism,tabel:y.tabel},b:b.nom+'(Y)',s,holat:'yordam',izoh:y.bolim?y.bolim+'/'+y.smena+' dan':'—'});
    }
  }
  filterJamTable('');
}
function filterJamTable(q){
  const rows=q?allJamRows.filter(r=>r.e.ism.toLowerCase().includes(q.toLowerCase())||r.e.tabel.toLowerCase().includes(q.toLowerCase())):allJamRows;
  const bM={keldi:'b-keldi',kech:'b-kech',yoq:'b-yoq',erta:'b-kech',bosh:'b-bosh',yordam:'b-yordam'};
  const lM={keldi:'Keldi',kech:'Kechikdi',yoq:'Kelmadi',erta:'Erta ketdi',bosh:"Bo'sh",yordam:'Yordam'};
  document.getElementById('jam-tbody').innerHTML=rows.map(r=>`<tr>
    <td style="color:var(--text3);font-family:var(--mono)">${r.rn}</td>
    <td style="font-family:var(--mono);color:var(--text2)">${r.e.tabel}</td>
    <td style="font-weight:500">${r.e.ism}</td>
    <td><span style="font-family:var(--mono);font-size:11px;color:var(--text2)">${r.b}</span></td>
    <td style="color:var(--text2)">${r.s}</td>
    <td><span class="badge ${bM[r.holat]||''}">${lM[r.holat]||r.holat}</span></td>
    <td style="font-size:11px;color:var(--text2)">${r.izoh}</td>
  </tr>`).join('')||'<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:var(--text3)">Ma\'lumot yo\'q</td></tr>';
}

// ============================================================
// ABSENTEEIZM HISOBI (5-band: TO,OT,UO,V,G,KM,KECH,ERTA hisoblanmaydi)
// ============================================================
const ABSENT_EXCLUDED = ['TO','OT','UO','V','G','KM','KECH','ERTA'];
function isAbsent(att) {
  if(!att||att.holat==='keldi') return false;
  if(att.holat==='kech'||att.holat==='erta') return false; // kech/erta hisoblanmaydi
  if(att.holat==='yoq' && ABSENT_EXCLUDED.includes(att.sabab)) return false;
  return true; // faqat haqiqiy yo'qlik (sababsiz, kasallik va h.k.)
}

function calcMonthlyStats(year,month,bolimFilter,smenaFilter){
  const days=getWorkDays(year,month);
  let totalKeldi=0,totalKech=0,totalYoq=0,totalErt=0,totalAbs=0,totalSessions=0;
  const byBolim={},bySabab={};
  for(const day of days){
    const viewBolimlar = getFilteredBolimlar ? getFilteredBolimlar() : DB.bolimlar;
  for(const b of viewBolimlar){
      if(bolimFilter&&b.id!==bolimFilter) continue;
      for(const s of b.smenalar){
        if(smenaFilter&&s!==smenaFilter) continue;
        const dav=getDavomat(day,b.id,s); if(!dav) continue;
        totalSessions++;
        if(!byBolim[b.id]) byBolim[b.id]={keldi:0,kech:0,yoq:0,abs:0};
        const emps=getEmpsForSmena(b.id,s);
        for(const e of emps){
          const att=dav.attendance[e.id];
          if(!att||att.holat==='keldi'){totalKeldi++;byBolim[b.id].keldi++;}
          else if(att.holat==='kech'){totalKech++;byBolim[b.id].kech++;}
          else if(att.holat==='erta'){totalErt++;}
          else{totalYoq++;byBolim[b.id].yoq++;const sb=att.sabab||'?';bySabab[sb]=(bySabab[sb]||0)+1;if(isAbsent(att)){totalAbs++;byBolim[b.id].abs++;}}
        }
      }
    }
  }
  const total=totalKeldi+totalKech+totalYoq+totalErt;
  return {totalKeldi,totalKech,totalYoq,totalErt,totalAbs,total,byBolim,bySabab,totalSessions,
    absRate:total?((totalAbs/total)*100).toFixed(1):'0.0'};
}

// ============================================================
// HISOBOTLAR — ZAMONAVIY KO'RINISH
// ============================================================
function switchHisobot(tab,btn){
  hisobotTab=tab;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderHisobot();
}
function renderHisobot(){
  const now=new Date();
  if(hisobotTab==='kunlik') renderKunlik();
  else if(hisobotTab==='haftalik') renderHaftalik();
  else if(hisobotTab==='oylik') renderOylik(now.getFullYear(),now.getMonth()+1);
  else if(hisobotTab==='chorak') renderChorak(now.getFullYear(),Math.ceil((now.getMonth()+1)/3));
  else if(hisobotTab==='yillik') renderYillik(now.getFullYear());
}
function destroyChart(id){ if(chartInstances[id]){ chartInstances[id].destroy(); delete chartInstances[id]; } }

// Chart defaults — zamonaviy
const CHART_COLORS={ green:'#00c98d',amber:'#f5a623',red:'#f04f4f',blue:'#4a9eff',purple:'#a78bfa',cyan:'#22d3ee' };
const CHART_BG={ green:'rgba(0,201,141,.15)',amber:'rgba(245,166,35,.15)',red:'rgba(240,79,79,.15)',blue:'rgba(74,158,255,.15)' };
function baseOpts(extra={}){
  return {responsive:true,maintainAspectRatio:false,
    plugins:{legend:{labels:{color:'#8a97b0',font:{size:11},boxWidth:12,padding:16}},
      tooltip:{backgroundColor:'#1e2535',titleColor:'#e8edf5',bodyColor:'#8a97b0',borderColor:'#2e3a52',borderWidth:1,padding:10,cornerRadius:8}},
    scales:{x:{ticks:{color:'#556278',font:{size:11}},grid:{color:'rgba(46,58,82,.5)',drawBorder:false}},
      y:{ticks:{color:'#556278',font:{size:11}},grid:{color:'rgba(46,58,82,.5)',drawBorder:false},beginAtZero:true}},
    ...extra};
}

function kpiCard(label,value,sub,color){ return `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:1.25rem;position:relative;overflow:hidden"><div style="font-size:11px;color:var(--text2);font-family:var(--mono);text-transform:uppercase;letter-spacing:.8px;margin-bottom:.5rem">${label}</div><div style="font-size:28px;font-weight:700;font-family:var(--mono);color:${color||'var(--text)'}">${value}</div>${sub?`<div style="font-size:11px;color:var(--text2);margin-top:4px">${sub}</div>`:''}<div style="position:absolute;right:-10px;bottom:-10px;width:60px;height:60px;border-radius:50%;background:${color||'var(--green)'};opacity:.07"></div></div>`; }

function renderKunlik(){
  const now=new Date(); const dateStr=todayStr();
  const M=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  let html=`<div style="display:flex;gap:8px;margin-bottom:1.5rem;align-items:center;flex-wrap:wrap">
    <input type="date" id="kl-date" value="${dateStr}" max="${dateStr}" onchange="renderKunlikDate(this.value)" style="max-width:190px">
    <span style="font-size:12px;color:var(--text2)">${formatDate(dateStr)}</span>
  </div>
  <div id="kunlik-wrap">${buildKunlikContent(dateStr)}</div>`;
  document.getElementById('hisobot-content').innerHTML=html;
}
function renderKunlikDate(date){ const w=document.getElementById('kunlik-wrap'); if(w) w.innerHTML=buildKunlikContent(date); }
function buildKunlikContent(date){
  // Faqat davomat kiritilgan smenalar hisoblanadi
  let tK=0,tKe=0,tY=0,tEr=0,tT=0,tAbs=0;
  const rows=[];

  // Kechagi sana (tungi smena uchun)
  const dateObj = new Date(date+'T12:00:00');
  const prev = new Date(dateObj); prev.setDate(prev.getDate()-1);
  const prevDate = prev.getFullYear()+'-'+String(prev.getMonth()+1).padStart(2,'0')+'-'+String(prev.getDate()).padStart(2,'0');

  for(const b of getFilteredBolimlar()){
    for(const s of b.smenalar){
      // Bugungi kunduzgi yoki kechagi tungi smenani topish
      const davToday = getDavomat(date,b.id,s);
      const davYest  = getDavomat(prevDate,b.id,s);

      // Faqat kiritilgan va smenaType mavjud smenalarni hisoblash
      let dav = null;
      let smenaLabel = s;
      if(davToday && davToday.smenaType==='kunduzi') { dav=davToday; smenaLabel=s+' (kunduzgi)'; }
      else if(davYest && davYest.smenaType==='tungi') { dav=davYest; smenaLabel=s+' (tungi)'; }
      else if(davToday) { dav=davToday; } // smenaType yo'q bo'lsa ham kiritilgan bo'lsa hisoblash

      if(!dav) continue; // Davomat kiritilmagan smenalarni o'tkazib yuborish

      const emps=getEmpsForSmena(b.id,s);
      let k=0,ke=0,y=0,er=0,abs=0;
      for(const e of emps){ const att=dav.attendance[e.id]; if(!att||att.holat==='keldi') k++; else if(att.holat==='kech') ke++; else if(att.holat==='erta') er++; else{y++;if(isAbsent(att)) abs++;} }
      tK+=k;tKe+=ke;tY+=y;tEr+=er;tT+=emps.length;tAbs+=abs;
      rows.push({nom:b.nom,s:smenaLabel,k,ke,y,er,abs,total:emps.length,pct:emps.length?Math.round(k/emps.length*100):0,kiritilgan:true});
    }
  }

  // Agar hech qanday davomat kiritilmagan bo'lsa, barcha smenalarni ko'rsatish
  if(rows.length===0){
    for(const b of getFilteredBolimlar()){
      for(const s of b.smenalar){
        const dav=getDavomat(date,b.id,s);
        const emps=getEmpsForSmena(b.id,s);
        let k=0,ke=0,y=0,er=0,abs=0;
        for(const e of emps){ const att=dav?dav.attendance[e.id]:null; if(!att||att.holat==='keldi') k++; else if(att.holat==='kech') ke++; else if(att.holat==='erta') er++; else{y++;if(isAbsent(att)) abs++;} }
        tK+=k;tKe+=ke;tY+=y;tEr+=er;tT+=emps.length;tAbs+=abs;
        rows.push({nom:b.nom,s,k,ke,y,er,abs,total:emps.length,pct:emps.length?Math.round(k/emps.length*100):0,kiritilgan:!!dav});
      }
    }
  }

  const tot=tT||1;
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:1.5rem">
    ${kpiCard('Jami xodim',tT,'','var(--text)')}
    ${kpiCard('Keldi',tK,Math.round(tK/tot*100)+'%','var(--green)')}
    ${kpiCard('Kechikdi',tKe,'','var(--amber)')}
    ${kpiCard('Kelmadi',tY,'','var(--red)')}
    ${kpiCard('Erta ketdi',tEr,'','var(--amber)')}
    ${kpiCard('Absenteeizm',((tAbs/tot)*100).toFixed(1)+'%','haqiqiy yo\'qlik','var(--red)')}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
    <div class="card"><div class="card-title">Holat taqsimoti</div><div class="chart-container"><canvas id="ch-kl-donut" role="img" aria-label="Kunlik holat taqsimoti"></canvas></div></div>
    <div class="card"><div class="card-title">Bo'limlar bo'yicha</div><div class="chart-container"><canvas id="ch-kl-bar" role="img" aria-label="Bo'limlar davomati"></canvas></div></div>
  </div>
  <div class="card"><div class="card-title">Batafsil jadval</div>
  <div class="tbl-wrap"><table><thead><tr><th>Bo'lim</th><th>Smena</th><th>Holat</th><th>Keldi</th><th>Kech</th><th>Kelmadi</th><th>Erta</th><th>Davomat %</th></tr></thead>
  <tbody>${rows.map(r=>`<tr>
    <td style="font-weight:600;font-family:var(--mono)">${r.nom}</td><td>${r.s}</td>
    <td><span class="badge ${r.kiritilgan?'b-kiritilgan':'b-kutilmoqda'}">${r.kiritilgan?'✓ Kiritilgan':'Kutilmoqda'}</span></td>
    <td style="color:var(--green);font-weight:600">${r.k}</td><td style="color:var(--amber)">${r.ke}</td>
    <td style="color:var(--red)">${r.y}</td><td style="color:var(--amber)">${r.er}</td>
    <td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${r.pct}%"></div></div><span style="font-family:var(--mono);font-size:11px;min-width:35px">${r.pct}%</span></div></td>
  </tr>`).join('')}</tbody></table></div></div>`;
  // Charts - deferred
  setTimeout(()=>{
    destroyChart('ch-kl-donut');
    const c1=document.getElementById('ch-kl-donut');
    if(c1) chartInstances['ch-kl-donut']=new Chart(c1,{type:'doughnut',data:{labels:['Keldi','Kechikdi','Kelmadi','Erta ketdi'],datasets:[{data:[tK,tKe,tY,tEr],backgroundColor:[CHART_COLORS.green,CHART_COLORS.amber,CHART_COLORS.red,CHART_COLORS.cyan],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:'#8a97b0',font:{size:11},boxWidth:12,padding:12}},tooltip:{backgroundColor:'#1e2535',titleColor:'#e8edf5',bodyColor:'#8a97b0',borderColor:'#2e3a52',borderWidth:1,cornerRadius:8}}}});
    destroyChart('ch-kl-bar');
    const c2=document.getElementById('ch-kl-bar');
    const uniq=[...new Set(rows.map(r=>r.nom))];
    const kData=uniq.map(n=>rows.filter(r=>r.nom===n).reduce((a,r)=>a+r.k,0));
    const yData=uniq.map(n=>rows.filter(r=>r.nom===n).reduce((a,r)=>a+r.y,0));
    if(c2) chartInstances['ch-kl-bar']=new Chart(c2,{type:'bar',data:{labels:uniq,datasets:[{label:'Keldi',data:kData,backgroundColor:CHART_COLORS.green,borderRadius:6,borderSkipped:false},{label:'Kelmadi',data:yData,backgroundColor:CHART_COLORS.red,borderRadius:6,borderSkipped:false}]},options:baseOpts()});
  },60);
}

function renderHaftalik(){
  const now=new Date(); const days=[];
  for(let i=6;i>=0;i--){ const d=new Date(now); d.setDate(d.getDate()-i); days.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')); }
  const M=['Yan','Fev','Mar','Apr','May','Iyu','Iyu','Avg','Sen','Okt','Noy','Dek'];
  const dData=days.map(day=>{
    let k=0,ke=0,y=0,abs=0;
    for(const b of DB.bolimlar) for(const s of b.smenalar){ const dav=getDavomat(day,b.id,s); if(!dav) continue; const emps=getEmpsForSmena(b.id,s); for(const e of emps){ const att=dav.attendance[e.id]; if(!att||att.holat==='keldi') k++; else if(att.holat==='kech') ke++; else{y++;if(isAbsent(att)) abs++;} } }
    const d=new Date(day+'T12:00:00'); return {label:d.getDate()+'/'+M[d.getMonth()],k,ke,y,abs};
  });
  const totK=dData.reduce((a,d)=>a+d.k,0),totY=dData.reduce((a,d)=>a+d.y,0),totAbs=dData.reduce((a,d)=>a+d.abs,0),totKe=dData.reduce((a,d)=>a+d.ke,0);
  const tot=totK+totKe+totY||1;
  document.getElementById('hisobot-content').innerHTML=`
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:1.5rem">
    ${kpiCard('Keldi',totK,'','var(--green)')}
    ${kpiCard('Kechikdi',totKe,'','var(--amber)')}
    ${kpiCard('Kelmadi',totY,'','var(--red)')}
    ${kpiCard('Absenteeizm',((totAbs/tot)*100).toFixed(1)+'%','haqiqiy yo\'qlik','var(--red)')}
  </div>
  <div class="card"><div class="card-title">Haftalik davomat tendensiyasi</div>
    <div class="chart-container" style="height:240px"><canvas id="ch-hafta" role="img" aria-label="Haftalik davomat"></canvas></div>
  </div>`;
  setTimeout(()=>{
    destroyChart('ch-hafta');
    const c=document.getElementById('ch-hafta');
    if(c) chartInstances['ch-hafta']=new Chart(c,{type:'line',data:{labels:dData.map(d=>d.label),datasets:[{label:'Keldi',data:dData.map(d=>d.k),borderColor:CHART_COLORS.green,backgroundColor:CHART_BG.green,tension:.4,fill:true,pointBackgroundColor:CHART_COLORS.green,pointRadius:4},{label:'Kechikdi',data:dData.map(d=>d.ke),borderColor:CHART_COLORS.amber,backgroundColor:CHART_BG.amber,tension:.4,fill:false,pointBackgroundColor:CHART_COLORS.amber,pointRadius:4},{label:'Kelmadi',data:dData.map(d=>d.y),borderColor:CHART_COLORS.red,backgroundColor:CHART_BG.red,tension:.4,fill:true,pointBackgroundColor:CHART_COLORS.red,pointRadius:4}]},options:baseOpts()});
  },60);
}

function renderOylik(year,month){
  const s=calcMonthlyStats(year,month,'','');
  const MN=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  document.getElementById('hisobot-content').innerHTML=`
  <div style="display:flex;gap:8px;margin-bottom:1.5rem;align-items:center;flex-wrap:wrap">
    <select id="oy-y" onchange="renderOylik(this.value,document.getElementById('oy-m').value)" style="max-width:100px">${[2024,2025,2026,2027].map(y=>`<option ${y===year?'selected':''}>${y}</option>`).join('')}</select>
    <select id="oy-m" onchange="renderOylik(document.getElementById('oy-y').value,this.value)" style="max-width:130px">${MN.map((m,i)=>`<option value="${i+1}" ${(i+1)===month?'selected':''}>${m}</option>`).join('')}</select>
    <span style="font-size:12px;color:var(--text2);font-weight:500">${MN[month-1]} ${year}</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:1.5rem">
    ${kpiCard('Jami qayd',s.total,'','var(--text)')}
    ${kpiCard('Keldi',s.totalKeldi,'','var(--green)')}
    ${kpiCard('Kechikdi',s.totalKech,'','var(--amber)')}
    ${kpiCard('Kelmadi',s.totalYoq,'','var(--red)')}
    ${kpiCard('Absenteeizm',s.absRate+'%','haqiqiy yo\'qlik','var(--red)')}
    ${kpiCard('Smenalar',s.totalSessions,'kiritildi','var(--cyan)')}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
    <div class="card"><div class="card-title">Holat taqsimoti</div><div class="chart-container"><canvas id="ch-oy-donut" role="img" aria-label="Oylik holat taqsimoti"></canvas></div></div>
    <div class="card"><div class="card-title">Bo'limlar bo'yicha davomat</div><div class="chart-container"><canvas id="ch-oy-bar" role="img" aria-label="Bo'limlar davomati"></canvas></div></div>
  </div>
  <div class="card"><div class="card-title">Bo'limlar batafsil</div>
  <table><thead><tr><th>Bo'lim</th><th>Keldi</th><th>Kechikdi</th><th>Kelmadi</th><th>Haqiqiy yo'qlik</th><th>Davomat %</th></tr></thead>
  <tbody>${DB.bolimlar.map(b=>{const bs=s.byBolim[b.id]||{keldi:0,kech:0,yoq:0,abs:0};const tot=bs.keldi+bs.kech+bs.yoq||1;const pct=Math.round(bs.keldi/tot*100);return `<tr><td style="font-weight:600;font-family:var(--mono)">${b.nom}</td><td style="color:var(--green);font-weight:600">${bs.keldi}</td><td style="color:var(--amber)">${bs.kech}</td><td style="color:var(--red)">${bs.yoq}</td><td style="color:var(--red)">${bs.abs||0}</td><td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%"></div></div><span style="font-family:var(--mono);font-size:11px;min-width:35px">${pct}%</span></div></td></tr>`;}).join('')}</tbody></table></div>`;
  setTimeout(()=>{
    destroyChart('ch-oy-donut');
    const c1=document.getElementById('ch-oy-donut');
    if(c1) chartInstances['ch-oy-donut']=new Chart(c1,{type:'doughnut',data:{labels:['Keldi','Kechikdi','Kelmadi'],datasets:[{data:[s.totalKeldi,s.totalKech,s.totalYoq],backgroundColor:[CHART_COLORS.green,CHART_COLORS.amber,CHART_COLORS.red],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:'#8a97b0',font:{size:11},boxWidth:12,padding:12}},tooltip:{backgroundColor:'#1e2535',titleColor:'#e8edf5',bodyColor:'#8a97b0',borderColor:'#2e3a52',borderWidth:1,cornerRadius:8}}}});
    destroyChart('ch-oy-bar');
    const c2=document.getElementById('ch-oy-bar');
    if(c2) chartInstances['ch-oy-bar']=new Chart(c2,{type:'bar',data:{labels:DB.bolimlar.map(b=>b.nom),datasets:[{label:'Keldi',data:DB.bolimlar.map(b=>(s.byBolim[b.id]||{}).keldi||0),backgroundColor:CHART_COLORS.green,borderRadius:6,borderSkipped:false},{label:'Kelmadi',data:DB.bolimlar.map(b=>(s.byBolim[b.id]||{}).yoq||0),backgroundColor:CHART_COLORS.red,borderRadius:6,borderSkipped:false}]},options:baseOpts()});
  },60);
}

function renderChorak(year,quarter){
  const MN=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const qM=[[1,2,3],[4,5,6],[7,8,9],[10,11,12]][quarter-1];
  let totK=0,totKe=0,totY=0,totAbs=0;
  const mData=qM.map(m=>{ const s=calcMonthlyStats(year,m,'',''); totK+=s.totalKeldi;totKe+=s.totalKech;totY+=s.totalYoq;totAbs+=s.totalAbs; return {month:MN[m-1],s}; });
  const tot=totK+totKe+totY||1;
  document.getElementById('hisobot-content').innerHTML=`
  <div style="display:flex;gap:8px;margin-bottom:1.5rem;align-items:center">
    <select onchange="renderChorak(${year},this.value)" style="max-width:160px">${[1,2,3,4].map(q=>`<option value="${q}" ${q===quarter?'selected':''}>Q${q} — ${year}</option>`).join('')}</select>
    <span style="font-size:12px;color:var(--text2)">${qM.map(m=>MN[m-1]).join(', ')}</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:1.5rem">
    ${kpiCard('Keldi',totK,'','var(--green)')}
    ${kpiCard('Kechikdi',totKe,'','var(--amber)')}
    ${kpiCard('Kelmadi',totY,'','var(--red)')}
    ${kpiCard('Absenteeizm',((totAbs/tot)*100).toFixed(1)+'%','haqiqiy yo\'qlik','var(--red)')}
  </div>
  <div class="card"><div class="card-title">Choraklik davomat</div><div class="chart-container" style="height:250px"><canvas id="ch-chorak" role="img" aria-label="Choraklik davomat"></canvas></div></div>
  <div class="card"><div class="card-title">Oylar batafsil</div>
  <table><thead><tr><th>Oy</th><th>Keldi</th><th>Kechikdi</th><th>Kelmadi</th><th>Absenteeizm</th></tr></thead>
  <tbody>${mData.map(({month,s})=>`<tr><td style="font-weight:500">${month}</td><td style="color:var(--green);font-weight:600">${s.totalKeldi}</td><td style="color:var(--amber)">${s.totalKech}</td><td style="color:var(--red)">${s.totalYoq}</td><td style="font-family:var(--mono)">${s.absRate}%</td></tr>`).join('')}</tbody></table></div>`;
  setTimeout(()=>{
    destroyChart('ch-chorak');
    const c=document.getElementById('ch-chorak');
    if(c) chartInstances['ch-chorak']=new Chart(c,{type:'bar',data:{labels:mData.map(d=>d.month),datasets:[{label:'Keldi',data:mData.map(d=>d.s.totalKeldi),backgroundColor:CHART_COLORS.green,borderRadius:8,borderSkipped:false},{label:'Kechikdi',data:mData.map(d=>d.s.totalKech),backgroundColor:CHART_COLORS.amber,borderRadius:8,borderSkipped:false},{label:'Kelmadi',data:mData.map(d=>d.s.totalYoq),backgroundColor:CHART_COLORS.red,borderRadius:8,borderSkipped:false}]},options:baseOpts()});
  },60);
}

function renderYillik(year){
  const MN=['Yan','Fev','Mar','Apr','May','Iyu','Iyu','Avg','Sen','Okt','Noy','Dek'];
  const MF=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  let totK=0,totKe=0,totY=0,totAbs=0;
  const mData=Array.from({length:12},(_,i)=>{ const s=calcMonthlyStats(year,i+1,'',''); totK+=s.totalKeldi;totKe+=s.totalKech;totY+=s.totalYoq;totAbs+=s.totalAbs; return {month:MN[i],monthF:MF[i],s}; });
  const tot=totK+totKe+totY||1;
  document.getElementById('hisobot-content').innerHTML=`
  <div style="display:flex;gap:8px;margin-bottom:1.5rem;">
    <select onchange="renderYillik(this.value)" style="max-width:100px">${[2024,2025,2026,2027].map(y=>`<option ${y===year?'selected':''}>${y}</option>`).join('')}</select>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:1.5rem">
    ${kpiCard('Jami',tot,'yil davomida','var(--text)')}
    ${kpiCard('Keldi',totK,'','var(--green)')}
    ${kpiCard('Kechikdi',totKe,'','var(--amber)')}
    ${kpiCard('Kelmadi',totY,'','var(--red)')}
    ${kpiCard('Absenteeizm',((totAbs/tot)*100).toFixed(1)+'%','haqiqiy yo\'qlik','var(--red)')}
  </div>
  <div class="card"><div class="card-title">Yillik davomat tendensiyasi</div><div class="chart-container" style="height:260px"><canvas id="ch-yil" role="img" aria-label="Yillik davomat tendensiyasi"></canvas></div></div>
  <div class="card"><div class="card-title">Oylar batafsil</div>
  <table><thead><tr><th>Oy</th><th>Keldi</th><th>Kechikdi</th><th>Kelmadi</th><th>Absenteeizm</th></tr></thead>
  <tbody>${mData.map(({monthF,s})=>`<tr><td style="font-weight:500">${monthF}</td><td style="color:var(--green);font-weight:600">${s.totalKeldi}</td><td style="color:var(--amber)">${s.totalKech}</td><td style="color:var(--red)">${s.totalYoq}</td><td style="font-family:var(--mono)">${s.absRate}%</td></tr>`).join('')}</tbody></table></div>`;
  setTimeout(()=>{
    destroyChart('ch-yil');
    const c=document.getElementById('ch-yil');
    if(c) chartInstances['ch-yil']=new Chart(c,{type:'line',data:{labels:mData.map(d=>d.month),datasets:[{label:'Keldi',data:mData.map(d=>d.s.totalKeldi),borderColor:CHART_COLORS.green,backgroundColor:CHART_BG.green,tension:.4,fill:true,pointBackgroundColor:CHART_COLORS.green,pointRadius:5,pointHoverRadius:7},{label:'Kechikdi',data:mData.map(d=>d.s.totalKech),borderColor:CHART_COLORS.amber,backgroundColor:'transparent',tension:.4,fill:false,pointBackgroundColor:CHART_COLORS.amber,pointRadius:4},{label:'Kelmadi',data:mData.map(d=>d.s.totalYoq),borderColor:CHART_COLORS.red,backgroundColor:CHART_BG.red,tension:.4,fill:true,pointBackgroundColor:CHART_COLORS.red,pointRadius:5,pointHoverRadius:7}]},options:baseOpts()});
  },60);
}

// ============================================================
// XODIMLAR
// ============================================================
function fillBolimSelects(){
  ['xod-filter-bolim','mx-bolim','mu-bolim'].forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    const val=el.value;
    if(id==='xod-filter-bolim') el.innerHTML="<option value=''>Barcha bo'limlar</option>"; else el.innerHTML='';
    DB.bolimlar.forEach(b=>{ const o=document.createElement('option'); o.value=b.id; o.textContent=b.nom; el.appendChild(o); });
    if(val) el.value=val;
  });
}
function renderXodimlar(q){
  const bolim=document.getElementById('xod-filter-bolim')?.value||'';
  const smena=document.getElementById('xod-filter-smena')?.value||'';
  const search=typeof q==='string'?q:'';
  let emps=DB.xodimlar;
  if(bolim) emps=emps.filter(e=>e.bolim===bolim);
  if(smena) emps=emps.filter(e=>e.smena===smena);
  if(search) emps=emps.filter(e=>e.ism.toLowerCase().includes(search.toLowerCase())||e.tabel.toLowerCase().includes(search.toLowerCase()));
  const el=document.getElementById('xod-count-label'); if(el) el.textContent=`Jami ${emps.length} nafar xodim`;
  const tbody=document.getElementById('xod-tbody'); if(!tbody) return;
  tbody.innerHTML=emps.map((e,i)=>`<tr>
    <td style="color:var(--text3)">${i+1}</td>
    <td style="font-family:var(--mono);color:var(--text2)">${e.tabel}</td>
    <td style="font-weight:500">${e.ism}</td>
    <td><span style="font-family:var(--mono);font-size:11px;background:var(--bg3);padding:2px 7px;border-radius:4px">${e.bolim}</span></td>
    <td style="color:var(--text2)">${e.smena}</td>
    <td><div style="display:flex;gap:4px"><button class="btn xs" onclick="openXodimModal(${e.id})">✏️</button><button class="btn xs danger" onclick="deleteXodim(${e.id})">🗑</button></div></td>
  </tr>`).join('')||'<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:var(--text3)">Topilmadi</td></tr>';
}
function openXodimModal(id){
  fillBolimSelects();
  if(id){ const e=DB.xodimlar.find(x=>x.id===id); if(!e) return; document.getElementById('mx-title').textContent='Xodimni tahrirlash'; document.getElementById('mx-id').value=e.id; document.getElementById('mx-ism').value=e.ism; document.getElementById('mx-tabel').value=e.tabel; document.getElementById('mx-bolim').value=e.bolim; fillMxSmena(); document.getElementById('mx-smena').value=e.smena; }
  else { document.getElementById('mx-title').textContent="Xodim qo'shish"; document.getElementById('mx-id').value=''; document.getElementById('mx-ism').value=''; document.getElementById('mx-tabel').value=''; document.getElementById('mx-bolim').value=DB.bolimlar[0]?.id||''; fillMxSmena(); }
  document.getElementById('modal-xodim').classList.remove('hidden');
}
function fillMxSmena(){ const b=getBolim(document.getElementById('mx-bolim').value); document.getElementById('mx-smena').innerHTML=(b?b.smenalar:[]).map(s=>`<option>${s}</option>`).join(''); }
function saveXodim(){
  const id=document.getElementById('mx-id').value;
  const ism=document.getElementById('mx-ism').value.trim().toUpperCase();
  const tabel=document.getElementById('mx-tabel').value.trim();
  const bolim=document.getElementById('mx-bolim').value;
  const smena=document.getElementById('mx-smena').value;
  if(!ism||!tabel||!bolim){ showToast("Barcha maydonlarni to'ldiring!",'err'); return; }
  if(id){ const e=DB.xodimlar.find(x=>x.id===parseInt(id)); if(e){e.ism=ism;e.tabel=tabel;e.bolim=bolim;e.smena=smena;} }
  else DB.xodimlar.push({id:DB.nextEmpId++,tabel,ism,bolim,smena});
  Storage.save(); closeModal('modal-xodim'); renderXodimlar(); showToast('Xodim saqlandi!','ok');
}
function deleteXodim(id){ if(!confirm("O'chirishni tasdiqlaysizmi?")) return; DB.xodimlar=DB.xodimlar.filter(e=>e.id!==id); Storage.save(); renderXodimlar(); showToast("O'chirildi",'ok'); }

// ============================================================
// BO'LIMLAR
// ============================================================
function renderBolimlar(){
  const tbody=document.getElementById('bol-tbody'); if(!tbody) return;
  tbody.innerHTML=DB.bolimlar.map((b,i)=>{
    const cnt=DB.xodimlar.filter(e=>e.bolim===b.id).length;
    return `<tr><td style="color:var(--text3)">${i+1}</td><td style="font-weight:700;font-family:var(--mono)">${b.nom}</td>
    <td>${b.smenalar.map(s=>`<span style="background:var(--bg3);border:1px solid var(--border);padding:2px 8px;border-radius:10px;font-size:11px;margin-right:4px">${s}</span>`).join('')}</td>
    <td style="font-family:var(--mono)">${b.ish_orni}</td><td>${cnt}</td>
    <td><div style="display:flex;gap:4px"><button class="btn xs" onclick="openBolimModal('${b.id}')">✏️</button><button class="btn xs danger" onclick="deleteBolim('${b.id}')">🗑</button></div></td></tr>`;
  }).join('');
}
function openBolimModal(id){
  if(id){ const b=getBolim(id); if(!b) return; document.getElementById('mb-title').textContent='Tahrirlash'; document.getElementById('mb-id').value=b.id; document.getElementById('mb-nom').value=b.nom; document.getElementById('mb-ish').value=b.ish_orni; document.getElementById('mb-smenalar').value=b.smenalar.join(','); }
  else { document.getElementById('mb-title').textContent="Qo'shish"; document.getElementById('mb-id').value=''; document.getElementById('mb-nom').value=''; document.getElementById('mb-ish').value='10'; document.getElementById('mb-smenalar').value='A,B'; }
  document.getElementById('modal-bolim').classList.remove('hidden');
}
function saveBolim(){
  const id=document.getElementById('mb-id').value;
  const nom=document.getElementById('mb-nom').value.trim().toUpperCase();
  const ish=parseInt(document.getElementById('mb-ish').value)||10;
  const smenalar=document.getElementById('mb-smenalar').value.split(',').map(s=>s.trim()).filter(Boolean);
  if(!nom){ showToast("Nom kiriting!",'err'); return; }
  if(id){ const b=getBolim(id); if(b){b.nom=nom;b.ish_orni=ish;b.smenalar=smenalar;} }
  else DB.bolimlar.push({id:nom,nom,smenalar,ish_orni:ish});
  Storage.save(); closeModal('modal-bolim'); renderBolimlar(); fillBolimSelects(); showToast("Saqlandi!",'ok');
}
function deleteBolim(id){ if(DB.xodimlar.filter(e=>e.bolim===id).length>0){ showToast("Bu ish joyida xodimlar bor!",'err'); return; } if(!confirm("O'chirishni tasdiqlaysizmi?")) return; DB.bolimlar=DB.bolimlar.filter(b=>b.id!==id); Storage.save(); renderBolimlar(); showToast("O'chirildi",'ok'); }

// ============================================================
// FOYDALANUVCHILAR
// ============================================================
function renderFoydalanuvchilar(){
  const tbody=document.getElementById('usr-tbody'); if(!tbody) return;
  const rL={'admin':"To'liq Admin",'admin2':'Hisobot Admin','supervisor':'Nazorat',"mas_ul":"Mas'ul"};
  const rB={'admin':'b-admin','admin2':'b-admin2','supervisor':'b-admin2','mas_ul':'b-mas'};
  tbody.innerHTML=DB.users.map((u,i)=>`<tr>
    <td style="color:var(--text3)">${i+1}</td>
    <td style="font-family:var(--mono)">${u.login}</td>
    <td style="font-family:var(--mono);color:var(--text3)">${u.password}</td>
    <td style="font-weight:500">${u.name}</td>
    <td><span class="badge ${rB[u.role]||''}">${rL[u.role]||u.role}</span></td>
    <td style="font-family:var(--mono);font-size:11px">${u.bolim||'—'}</td>
    <td style="color:var(--text2)">${u.smena||'—'}</td>
    <td><div style="display:flex;gap:4px"><button class="btn xs" onclick="openUserModal('${u.id}')">✏️</button>${u.id!=='admin'?`<button class="btn xs danger" onclick="deleteUser('${u.id}')">🗑</button>`:''}</div></td>
  </tr>`).join('');
}
function openUserModal(id){
  fillBolimSelects();
  if(id){ const u=DB.users.find(x=>x.id===id); if(!u) return; document.getElementById('mu-title').textContent='Tahrirlash'; document.getElementById('mu-id').value=u.id; document.getElementById('mu-name').value=u.name; document.getElementById('mu-login').value=u.login; document.getElementById('mu-pass').value=u.password; document.getElementById('mu-role').value=u.role; toggleUserFields(); if(u.bolim){ document.getElementById('mu-bolim').value=u.bolim; fillMuSmena(); if(u.smena) document.getElementById('mu-smena').value=u.smena; } }
  else { document.getElementById('mu-title').textContent="Qo'shish"; ['mu-id','mu-name','mu-login'].forEach(id=>document.getElementById(id).value=''); document.getElementById('mu-pass').value='1234'; document.getElementById('mu-role').value='mas_ul'; toggleUserFields(); if(DB.bolimlar[0]) document.getElementById('mu-bolim').value=DB.bolimlar[0].id; fillMuSmena(); }
  document.getElementById('modal-user').classList.remove('hidden');
}
function toggleUserFields(){ const r=document.getElementById('mu-role').value; document.getElementById('mu-extra').style.display=r==='mas_ul'?'block':'none'; }
function fillMuSmena(){ const b=getBolim(document.getElementById('mu-bolim')?.value); const sel=document.getElementById('mu-smena'); if(sel) sel.innerHTML=(b?b.smenalar:[]).map(s=>`<option>${s}</option>`).join(''); }
function saveUser(){
  const id=document.getElementById('mu-id').value;
  const name=document.getElementById('mu-name').value.trim();
  const login=document.getElementById('mu-login').value.trim();
  const pass=document.getElementById('mu-pass').value.trim();
  const role=document.getElementById('mu-role').value;
  const bolim=role==='mas_ul'?document.getElementById('mu-bolim').value:null;
  const smena=role==='mas_ul'?document.getElementById('mu-smena').value:null;
  if(!name||!login||!pass){ showToast("Barcha maydonlarni to'ldiring!",'err'); return; }
  if(!id&&DB.users.find(u=>u.login===login)){ showToast("Bu login allaqachon mavjud!",'err'); return; }
  if(id){ const u=DB.users.find(x=>x.id===id); if(u){u.name=name;u.login=login;u.password=pass;u.role=role;u.bolim=bolim;u.smena=smena;} }
  else DB.users.push({id:'u'+DB.nextUserId++,login,password:pass,role,name,bolim,smena});
  Storage.save(); closeModal('modal-user'); renderFoydalanuvchilar(); showToast('Saqlandi!','ok');
}
// ============================================================
// MA'LUMOTLARNI TOZALASH
// ============================================================
function renderTozalash() {
  const wrap = document.getElementById('tozalash-content');
  if(!wrap) return;

  const today = todayStr();
  const monthStart = today.substring(0,7)+'-01';

  wrap.innerHTML = `
  <!-- Test ma'lumotlarini tozalash -->
  <div class="card" style="border-color:rgba(245,166,35,.3);margin-bottom:1rem">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:.75rem">
      <div style="width:36px;height:36px;background:rgba(245,166,35,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px">🧪</div>
      <div>
        <div style="font-weight:600;font-size:14px">Test ma'lumotlarini tozalash</div>
        <div style="font-size:11px;color:var(--text2)">10.06.2026 kuni soat 07:40 gacha kiritilgan barcha davomat ma'lumotlari</div>
      </div>
    </div>
    <div id="test-preview" style="margin-bottom:.75rem"></div>
    <div style="display:flex;gap:8px">
      <button class="btn sm" onclick="previewTestTozalash()" style="border-color:var(--amber);color:var(--amber)">🔍 Tekshirish</button>
      <button class="btn sm danger" onclick="confirmTestTozalash()">🗑 Test ma'lumotlarini tozalash</button>
    </div>
  </div>

  <!-- Muddat bo'yicha tozalash -->
  <div class="card" style="border-color:rgba(240,79,79,.3)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem">
      <div style="width:36px;height:36px;background:rgba(240,79,79,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px">🗑</div>
      <div>
        <div style="font-weight:600;font-size:14px">Muddat bo'yicha tozalash</div>
        <div style="font-size:11px;color:var(--text2)">Tanlangan sana oralig'idagi davomat yozuvlari o'chiriladi</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1rem">
      <div>
        <label style="font-size:11px;color:var(--text2);display:block;margin-bottom:4px">Boshlanish sanasi</label>
        <input type="date" id="tozalash-start" value="${monthStart}" max="${today}" style="width:100%">
      </div>
      <div>
        <label style="font-size:11px;color:var(--text2);display:block;margin-bottom:4px">Tugash sanasi</label>
        <input type="date" id="tozalash-end" value="${today}" max="${today}" style="width:100%">
      </div>
    </div>
    <div style="margin-bottom:1rem">
      <label style="font-size:11px;color:var(--text2);display:block;margin-bottom:4px">Bo'lim (ixtiyoriy)</label>
      <select id="tozalash-bolim" style="max-width:200px">
        <option value="">Barcha bo'limlar</option>
        ${DB.bolimlar.map(b=>`<option value="${b.id}">${b.nom}</option>`).join('')}
      </select>
    </div>
    <div id="tozalash-preview" style="margin-bottom:1rem"></div>
    <div style="display:flex;gap:8px">
      <button class="btn sm" onclick="previewTozalash()" style="border-color:var(--amber);color:var(--amber)">🔍 Tekshirish</button>
      <button class="btn sm danger" onclick="confirmTozalash()">🗑 Tozalash</button>
    </div>
  </div>`;
}

// Test ma'lumotlarini tekshirish (10.06.2026 07:40 gacha)
function previewTestTozalash() {
  const testCutoff = new Date('2026-06-10T07:40:00');
  let count = 0;
  for(const key of Object.keys(DB.davomat)) {
    const dav = DB.davomat[key];
    if(!dav) continue;
    const kt = dav.kiritilgan_vaqt ? new Date(dav.kiritilgan_vaqt) : null;
    if(kt && kt < testCutoff) count++;
  }
  const prev = document.getElementById('test-preview');
  if(prev) prev.innerHTML = `<div style="background:var(--bg3);border:1px solid ${count>0?'rgba(245,166,35,.3)':'rgba(0,201,141,.3)'};border-radius:8px;padding:10px 14px;font-size:12px">
    ${count>0
      ? `<span style="color:var(--amber)">⚠️ 10.06.2026 soat 07:40 gacha kiritilgan <b>${count} ta</b> davomat yozuvi topildi.</span>`
      : `<span style="color:var(--green)">✓ Test davri ma'lumotlari topilmadi.</span>`
    }
  </div>`;
}

// Test ma'lumotlarini o'chirish
function confirmTestTozalash() {
  const testCutoff = new Date('2026-06-10T07:40:00');
  let count = 0;
  const toDelete = [];
  for(const key of Object.keys(DB.davomat)) {
    const dav = DB.davomat[key];
    if(!dav) continue;
    const kt = dav.kiritilgan_vaqt ? new Date(dav.kiritilgan_vaqt) : null;
    if(kt && kt < testCutoff) toDelete.push(key);
  }
  if(toDelete.length === 0) { showToast("Test ma'lumotlari topilmadi",'warn'); return; }
  if(!confirm(`10.06.2026 soat 07:40 gacha kiritilgan ${toDelete.length} ta davomat ma'lumoti o'chiriladi! Tasdiqlaysizmi?`)) return;
  toDelete.forEach(key => delete DB.davomat[key]);
  Storage.save();
  showToast(`✓ ${toDelete.length} ta test yozuvi o'chirildi!`,'ok');
  previewTestTozalash();
}

function previewTozalash() {
  const start = document.getElementById('tozalash-start').value;
  const end   = document.getElementById('tozalash-end').value;
  const bolim = document.getElementById('tozalash-bolim').value;
  const prev  = document.getElementById('tozalash-preview');

  if(!start || !end) { showToast("Sanalarni tanlang!",'err'); return; }
  if(start > end)    { showToast("Boshlanish sanasi tugash sanasidan katta!",'err'); return; }

  // Hisoblash
  let count = 0;
  const keys = Object.keys(DB.davomat);
  for(const key of keys) {
    const dav = DB.davomat[key];
    if(!dav) continue;
    if(dav.date < start || dav.date > end) continue;
    if(bolim && dav.bolim !== bolim) continue;
    count++;
  }

  prev.innerHTML = `<div style="background:var(--bg3);border:1px solid ${count>0?'rgba(240,79,79,.3)':'rgba(0,201,141,.3)'};border-radius:8px;padding:10px 14px;font-size:12px">
    ${count > 0
      ? `<span style="color:var(--red)">⚠️ ${start} — ${end} orasida <b>${count} ta</b> davomat yozuvi topildi${bolim?' ('+bolim+' bolimi)':''}. Tozalashni tasdiqlaysizmi?</span>`
      : `<span style="color:var(--green)">✓ Tanlangan muddat va bo'limda davomat yozuvi topilmadi.</span>`
    }
  </div>`;
}

function confirmTozalash() {
  const start = document.getElementById('tozalash-start').value;
  const end   = document.getElementById('tozalash-end').value;
  const bolim = document.getElementById('tozalash-bolim').value;

  if(!start || !end) { showToast("Sanalarni tanlang!",'err'); return; }

  const msg = start+' — '+end+' orasidagi '+(bolim?bolim+' bolimi ':'')+' barcha davomat malumotlari ochiriladi! Tasdiqlaysizmi?';
  if(!confirm(msg)) return;

  let count = 0;
  const keys = Object.keys(DB.davomat);
  for(const key of keys) {
    const dav = DB.davomat[key];
    if(!dav) continue;
    if(dav.date < start || dav.date > end) continue;
    if(bolim && dav.bolim !== bolim) continue;
    delete DB.davomat[key];
    count++;
  }

  Storage.save();
  showToast(`✓ ${count} ta davomat yozuvi o'chirildi!`,'ok');
  previewTozalash();
}

function deleteUser(id){ if(id==='admin'){ showToast("Bosh admin o'chirib bo'lmaydi!",'err'); return; } if(currentUser.id===id){ showToast("O'zingizni o'chira olmaysiz!",'err'); return; } if(!confirm("O'chirishni tasdiqlaysizmi?")) return; DB.users=DB.users.filter(u=>u.id!==id); Storage.save(); renderFoydalanuvchilar(); showToast("O'chirildi",'ok'); }

// ============================================================
// MODAL & TOAST
// ============================================================
function closeModal(id){ document.getElementById(id)?.classList.add('hidden'); }
window.addEventListener('click',e=>{ ['modal-xodim','modal-bolim','modal-user'].forEach(id=>{ const el=document.getElementById(id); if(el&&e.target===el) el.classList.add('hidden'); }); });
function showToast(msg,type='ok'){
  const c=document.getElementById('toast'); const item=document.createElement('div');
  item.className=`toast-item ${type}`; item.textContent=msg; c.appendChild(item);
  setTimeout(()=>item.remove(),3500);
}

// ============================================================
// ISH GRAFIGI TIZIMI
// ============================================================

// Grafik kaliti
function grafikKey(year, month, bolim, smena) {
  return year+'-'+String(month).padStart(2,'0')+'_'+bolim+'_'+smena;
}

// Grafik tuzish ruxsatini tekshirish
function canEditGrafik(year, month) {
  // Admin har doim grafik tuzishi/o'zgartirishi mumkin
  if(currentUser && currentUser.role === 'admin') return true;
  const now = new Date();
  const ny = now.getFullYear(), nm = now.getMonth()+1, nd = now.getDate();
  // Joriy oy yoki keyingi oy grafigi — oxirgi kunda
  const lastDay = new Date(ny, nm, 0).getDate();
  if(nd === lastDay) return true;
  // Joriy oyning grafigi istalgan vaqtda
  if(year === ny && month === nm) return true;
  return false;
}

// Grafik mavjudligini tekshirish
function grafikExists(year, month) {
  const key = year+'-'+String(month).padStart(2,'0');
  return !!DB.grafik_meta[key];
}

// Smena uchun kun tipini olish
function getDayType(dateStr, bolim, smena) {
  // C smena — dushanba-juma kunduzi, shanba-yakshanba dam
  if(smena==='C') {
    const d = new Date(dateStr+'T12:00:00');
    const dw = d.getDay();
    if(dw===0||dw===6) return 'dam';
    return 'kunduzi';
  }
  const [y,m] = dateStr.split('-').map(Number);
  const key = grafikKey(y, m, bolim, smena);
  return (DB.grafik[key]||{})[dateStr] || null;
}

// Mas'ul shu kuni kirita oladimi
function canEnterDavomat(dateStr, bolim, smena) {
  const tip = getDayType(dateStr, bolim, smena);
  if(!tip || tip==='dam') return { ok:false, reason:'Dam olish kuni' };
  const m = nowMinutes();
  if(tip==='kunduzi' && !(m>=465&&m<=505)) return { ok:false, reason:'Kunduzgi davomat vaqti: 07:45–08:25' };
  if(tip==='tungi'   && !(m>=1185&&m<=1225)) return { ok:false, reason:'Tungi davomat vaqti: 19:45–20:25' };
  return { ok:true, tip };
}


// Grafik ko'rish (faqat o'qish) — barcha rollar uchun
function renderGrafikViewOnly(selOy, allOylar, MN) {
  const content = document.getElementById('grafik-content');
  if(!content) return;
  const isAdmin = currentUser.role === 'admin';
  const dNames=['Ya','Du','Se','Ch','Pa','Ju','Sh'];

  let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:8px"><div>';
  html += '<h3 style="font-size:15px;font-weight:600">Ish Grafigi</h3>';
  html += '<p style="font-size:11px;color:var(--text2)">Oylik smena jadvali</p></div></div>';

  if(allOylar.length === 0) {
    html += '<div class="alert info">📅 Hali hech qanday grafik tuzilmagan.</div>';
    content.innerHTML = html;
    return;
  }

  // Oy tanlash
  html += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap">';
  html += '<label style="font-size:12px;color:var(--text2)">Oyni tanlang:</label>';
  html += '<select onchange="renderGrafik(this.value)" style="max-width:180px">';
  allOylar.forEach(function(o) {
    const parts = o.split('-');
    const y = parseInt(parts[0]), m = parseInt(parts[1]);
    html += '<option value="'+o+'"'+(o===selOy?' selected':'')+'>'+MN[m]+' '+y+'</option>';
  });
  html += '</select>';
  if(isAdmin && selOy) {
    html += '<button class="btn sm primary" onclick="openGrafikEditorFromView(\''+selOy+'\')">✏️ Tahrirlash</button>';
  }
  if(selOy) {
    html += '<button class="btn sm" onclick="downloadGrafikAsPNG(\''+selOy+'\')" style="color:var(--cyan);border-color:var(--cyan)">📸 PNG yuklab olish</button>';
  }
  html += '</div>';

  if(!selOy) { content.innerHTML = html; return; }

  const parts2 = selOy.split('-');
  const sy = parseInt(parts2[0]), sm = parseInt(parts2[1]);
  const days = getWorkDays(sy, sm);

  const bolimSmenalar = [];
  for(let i=0; i<DB.bolimlar.length; i++) {
    const b = DB.bolimlar[i];
    for(let j=0; j<b.smenalar.length; j++) {
      // Mas'ul faqat o'z bo'limi va smenasini ko'radi
      if(currentUser.role === 'mas_ul') {
        const mySmenas = [currentUser.smena, ...(currentUser.extra_smenalar||[])];
        if(b.id !== currentUser.bolim && !(currentUser.extra_smenalar||[]).length) continue;
        if(b.id === currentUser.bolim && !mySmenas.includes(b.smenalar[j])) continue;
        // C smena uchun Ofis ko'rsatiladi
        if(b.id !== currentUser.bolim && b.id !== 'UA' && !mySmenas.includes(b.smenalar[j])) continue;
      }
      bolimSmenalar.push({bolim:b.id, nom:b.nom, smena:b.smenalar[j]});
    }
  }

  html += '<div class="card"><div class="card-title">'+MN[sm]+' '+sy+' — Ish Grafigi</div>';
  html += '<div style="overflow-x:auto"><table style="font-size:11px;border-collapse:collapse;min-width:600px"><thead><tr>';
  html += '<th style="text-align:left;padding:6px 10px;background:var(--bg3);position:sticky;left:0;z-index:2;min-width:140px">Bo\'lim / Smena</th>';
  days.forEach(function(d) {
    const dd = new Date(d+'T12:00:00');
    const dw = dd.getDay();
    const dam = dw===0||dw===6;
    html += '<th style="text-align:center;padding:4px 2px;background:var(--bg3);min-width:30px;'+(dam?'color:var(--red)':'')+'">'+
      '<div style="font-weight:600">'+dd.getDate()+'</div>'+
      '<div style="font-size:9px;opacity:.6">'+dNames[dw]+'</div></th>';
  });
  html += '</tr></thead><tbody>';

  bolimSmenalar.forEach(function(bs) {
    const isC = bs.smena === 'C';
    const key = grafikKey(sy, sm, bs.bolim, bs.smena);
    const g = isC ? {} : (DB.grafik[key]||{});
    html += '<tr>';
    html += '<td style="padding:6px 10px;font-weight:600;font-family:var(--mono);font-size:11px;background:var(--bg3);position:sticky;left:0;z-index:1;border-bottom:1px solid var(--border)">'+
      bs.nom+'<span style="opacity:.5;font-size:10px">/'+bs.smena+'</span>'+
      (isC ? '<span style="font-size:9px;color:var(--text3);margin-left:4px">(auto)</span>' : '')+
      '</td>';
    days.forEach(function(d) {
      const dd2 = new Date(d+'T12:00:00');
      const dw2 = dd2.getDay();
      const weekend = dw2===0||dw2===6;
      let tip;
      if(isC) { tip = weekend ? 'dam' : 'kunduzi'; }
      else { tip = g[d] || null; }
      const col = tip==='kunduzi'?'#00c98d':tip==='tungi'?'#4a9eff':tip==='dam'?'#f04f4f':'#556278';
      const lbl = tip==='kunduzi'?'K':tip==='tungi'?'T':tip==='dam'?'D':'—';
      const bg  = tip==='kunduzi'?'rgba(0,201,141,.08)':tip==='tungi'?'rgba(74,158,255,.08)':(tip==='dam'||weekend)?'rgba(240,79,79,.06)':'';
      html += '<td style="text-align:center;padding:4px 1px;border-bottom:1px solid var(--border);font-weight:700;color:'+col+';background:'+bg+'">'+lbl+'</td>';
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  html += '<div style="display:flex;gap:16px;margin-top:.75rem;font-size:11px;flex-wrap:wrap">';
  html += '<span style="color:var(--green)">&#9632; K = Kunduzgi</span>';
  html += '<span style="color:var(--blue)">&#9632; T = Tungi</span>';
  html += '<span style="color:var(--red)">&#9632; D = Dam olish</span>';
  html += '<span style="color:var(--text3)">— = Belgilanmagan</span></div></div>';

  content.innerHTML = html;
}

function openGrafikEditorFromView(oyKey) {
  if(!oyKey) return;
  const [y, m] = oyKey.split('-').map(Number);
  openGrafikEditor(y, m);
}

// Grafik sahifasini render qilish
function renderGrafik(selectedOy) {
  const now = new Date();
  const content = document.getElementById('grafik-content');
  if(!content) return;
  const isAdmin = currentUser.role === 'admin';

  const MN=['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

  // Barcha mavjud grafik oylarini olish
  const allOylar = Object.keys(DB.grafik_meta).sort().reverse();

  // Tanlangan oy (default: eng so'nggi)
  const selOy = selectedOy || allOylar[0] || null;

  // Foydalanuvchi ko'rish rejimi (admin bo'lmasa faqat ko'radi)
  if(!isAdmin) {
    renderGrafikViewOnly(selOy, allOylar, MN);
    return;
  }

  // Qaysi oy uchun grafik tuzish mumkin (faqat admin)
  const targets = [];
  const ny2 = now.getFullYear(), nm2 = now.getMonth()+1, nd2 = now.getDate();

  // Iyun 2026 uchun maxsus: 09.06.2026 kuni butun kun
  if(ny2===2026 && nm2===6 && nd2===9) {
    targets.push({year:2026, month:6, label:'Iyun 2026', special:true});
  }
  // Keyingi oy: har oyning oxirgi kunida
  const lastDay = new Date(ny2, nm2, 0).getDate();
  if(nd2===lastDay) {
    const ny = nm2===12 ? ny2+1 : ny2;
    const nm = nm2===12 ? 1 : nm2+1;
    targets.push({year:ny, month:nm, label:MN[nm]+' '+ny});
  }

  // Admin uchun: yangi grafik tuzish + ko'rish
  let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:8px"><div>';
  html += '<h3 style="font-size:15px;font-weight:600">Ish Grafigi Boshqaruvi</h3>';
  html += '<p style="font-size:11px;color:var(--text2)">Oylik smena jadvali</p></div></div>';

  // Yangi grafik tuzish kartasi
  if(targets.length > 0) {
    targets.forEach(t => {
      const exists = grafikExists(t.year, t.month);
      const meta = DB.grafik_meta[t.year+'-'+String(t.month).padStart(2,'0')];
      html += '<div class="card" style="border-color:'+(exists?'rgba(0,201,141,.3)':'rgba(245,166,35,.3)')+'">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
      html += '<div><div style="font-size:14px;font-weight:600">'+t.label+' — Grafik';
      if(exists) html += ' <span style="color:var(--green);font-size:12px">✓ Tuzilgan</span>';
      else html += ' <span style="color:var(--amber);font-size:12px">⚠ Tuzilmagan</span>';
      html += '</div>';
      if(exists) html += '<div style="font-size:11px;color:var(--text2)">Tuzilgan: '+new Date(meta.tuzilgan).toLocaleString()+'</div>';
      html += '</div>';
      html += '<button class="btn primary" onclick="openGrafikEditor('+t.year+','+t.month+')">'+(exists?'✏️ Tahrirlash':'📋 Grafik tuzish')+'</button>';
      html += '</div>';
      if(exists) html += renderGrafikSummary(t.year, t.month);
      html += '</div>';
    });
  } else {
    html += '<div class="alert info">📅 Hozir yangi grafik tuzish vaqti emas.<br><span style="font-size:11px;display:block;margin-top:4px">• Iyun 2026: 09.06.2026 kuni &nbsp;• Keyingi oylar: har oyning oxirgi kunida</span></div>';
  }

  // Oy tanlash va ko'rish
  html += '<div class="card"><div class="card-header"><div class="card-title">Grafik ko\'rish</div></div>';
  if(allOylar.length === 0) {
    html += '<div style="color:var(--text3);font-size:12px;padding:.5rem">Hali grafik tuzilmagan</div>';
  } else {
    html += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:1rem;flex-wrap:wrap">';
    html += '<label style="font-size:12px;color:var(--text2)">Oyni tanlang:</label>';
    html += '<select onchange="renderGrafik(this.value)" style="max-width:180px">';
    allOylar.forEach(function(o) {
      const pts = o.split('-'); const y=parseInt(pts[0]),m=parseInt(pts[1]);
      html += '<option value="'+o+'"'+(o===selOy?' selected':'')+'>'+ MN[m]+' '+y+'</option>';
    });
    html += '</select>';
    if(selOy) html += '<button class="btn sm" onclick="openGrafikEditorFromView(\'"+selOy+"\')" style="color:var(--green);border-color:var(--green)">✏️ Bu oyni tahrirlash</button>';
    if(selOy) html += '<button class="btn sm" onclick="downloadGrafikAsPNG(\'"+selOy+"\')" style="color:var(--cyan);border-color:var(--cyan)">📸 PNG yuklab olish</button>';
    html += '</div>';
    if(selOy) html += renderFullGrafikTable(selOy, MN);
  }
  html += '</div>';

  content.innerHTML = html;
}

function renderGrafikSummary(year, month) {
  const days = getWorkDays(year, month);
  let html = `<div style="overflow-x:auto"><table style="font-size:11px;min-width:600px">
    <thead><tr>
      <th style="min-width:120px">Bo'lim/Smena</th>
      ${days.slice(0,15).map(d=>{const dd=new Date(d+'T12:00:00');return `<th style="text-align:center;min-width:28px">${dd.getDate()}</th>`}).join('')}
      <th>...</th>
    </tr></thead><tbody>`;

  for(const b of DB.bolimlar) {
    if(b.id==='Ofis') continue; // C smena auto
    for(const s of b.smenalar) {
      if(s==='C') continue;
      const key = grafikKey(year, month, b.id, s);
      const g = DB.grafik[key]||{};
      html += `<tr><td style="font-weight:500;font-family:var(--mono)">${b.nom}/${s}</td>`;
      days.slice(0,15).forEach(d=>{
        const tip=g[d]||'—';
        const col=tip==='kunduzi'?'var(--green)':tip==='tungi'?'var(--blue)':tip==='dam'?'var(--red)':'var(--text3)';
        const lbl=tip==='kunduzi'?'K':tip==='tungi'?'T':tip==='dam'?'D':'—';
        html+=`<td style="text-align:center;color:${col};font-weight:600">${lbl}</td>`;
      });
      html+=`<td style="color:var(--text3)">...</td></tr>`;
    }
  }
  html += `</tbody></table></div>
  <div style="display:flex;gap:12px;margin-top:.5rem;font-size:11px">
    <span style="color:var(--green)">■ K = Kunduzgi</span>
    <span style="color:var(--blue)">■ T = Tungi</span>
    <span style="color:var(--red)">■ D = Dam olish</span>
  </div>`;
  return html;
}

// Grafik editor
function openGrafikEditor(year, month) {
  const MN=['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const days = getWorkDays(year, month);

  // Iyun 2026 uchun 10-30 iyun
  let editDays = days;
  if(year===2026 && month===6) {
    editDays = days.filter(d => parseInt(d.split('-')[2]) >= 10);
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'grafik-modal';
  modal.style.zIndex = '300';

  // Har bir bo'lim+smena uchun mavjud grafik yoki bo'sh
  const bolimSmenalar = [];
  for(const b of DB.bolimlar) {
    if(b.id==='Ofis') continue;
    for(const s of b.smenalar) {
      if(s==='C') continue;
      const key = grafikKey(year, month, b.id, s);
      const existing = DB.grafik[key] || {};
      bolimSmenalar.push({bolim:b.id, nom:b.nom, smena:s, key, existing});
    }
  }

  modal.innerHTML = `
  <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:14px;padding:1.5rem;width:95vw;max-width:1100px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
      <div>
        <h3 style="font-size:16px;font-weight:600">${MN[month]} ${year} — Ish Grafigi</h3>
        <p style="font-size:11px;color:var(--text2)">Har bir smena uchun kunlik ish rejimini belgilang: K=Kunduzgi, T=Tungi, D=Dam olish</p>
      </div>
      <button class="btn ghost" onclick="closeGrafikModal()">✕ Yopish</button>
    </div>

    <div style="margin-bottom:.5rem;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <span style="font-size:12px;color:var(--text2)">Tezkor to'ldirish:</span>
      <button class="btn xs" onclick="fillAllSmena('kunduzi')">Barchasi Kunduzgi</button>
      <button class="btn xs" onclick="fillAllSmena('tungi')">Barchasi Tungi</button>
      <button class="btn xs" onclick="fillAllSmena('dam')">Barchasi Dam</button>
    </div>
    <div style="margin-bottom:1rem;font-size:11px;color:var(--blue);background:var(--blue-dim);border:1px solid rgba(74,158,255,.2);border-radius:6px;padding:8px 12px">
      💡 UB smenasini to'ldirsangiz → PPS1 va Cleaning avtomatik moslashadi. UA → PPS2 moslashadi.
    </div>

    <div style="overflow-x:auto">
      <table id="grafik-table" style="font-size:11px;border-collapse:collapse;min-width:800px">
        <thead>
          <tr>
            <th style="text-align:left;padding:6px 8px;background:var(--bg3);position:sticky;left:0;z-index:2;min-width:130px">Bo'lim / Smena</th>
            ${editDays.map(d=>{
              const dd=new Date(d+'T12:00:00');
              const dw=dd.getDay();
              const dam=dw===0||dw===6;
              const dNames=['Ya','Du','Se','Ch','Pa','Ju','Sh'];
              return `<th style="text-align:center;padding:4px 2px;background:var(--bg3);min-width:36px;${dam?'color:var(--red)':''}">
                <div>${dd.getDate()}</div>
                <div style="font-size:9px;opacity:.7">${dNames[dw]}</div>
              </th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${bolimSmenalar.map(bs => `
            <tr id="row-${bs.bolim}-${bs.smena}">
              <td style="padding:6px 8px;font-weight:600;font-family:var(--mono);background:var(--bg3);position:sticky;left:0;z-index:1;border-bottom:1px solid var(--border)">
                ${bs.nom}<span style="opacity:.6">/${bs.smena}</span>
                <div style="display:flex;gap:3px;margin-top:3px">
                  <button class="btn xs" onclick="fillRow('${bs.bolim}','${bs.smena}','kunduzi')" style="font-size:9px;padding:1px 5px;color:var(--green)">K</button>
                  <button class="btn xs" onclick="fillRow('${bs.bolim}','${bs.smena}','tungi')" style="font-size:9px;padding:1px 5px;color:var(--blue)">T</button>
                  <button class="btn xs" onclick="fillRow('${bs.bolim}','${bs.smena}','dam')" style="font-size:9px;padding:1px 5px;color:var(--red)">D</button>
                </div>
              </td>
              ${editDays.map(d=>{
                const dd=new Date(d+'T12:00:00');
                const dw=dd.getDay();
                const weekend=dw===0||dw===6;
                const cur=bs.existing[d]||(weekend?'dam':'');
                return `<td style="padding:2px;text-align:center;border-bottom:1px solid var(--border);${weekend?'background:var(--red-dim)':''}">
                  <select data-bolim="${bs.bolim}" data-smena="${bs.smena}" data-date="${d}"
                    style="font-size:10px;padding:2px 1px;width:36px;text-align:center;border:1px solid var(--border);border-radius:4px;background:var(--bg3);color:var(--text)"
                    onchange="grafikCellChange(this)">
                    <option value="kunduzi" ${cur==='kunduzi'?'selected':''}  style="color:var(--green)">K</option>
                    <option value="tungi"   ${cur==='tungi'?'selected':''}    style="color:var(--blue)">T</option>
                    <option value="dam"     ${cur==='dam'||weekend?'selected':''} style="color:var(--red)">D</option>
                  </select>
                </td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:1.25rem">
      <button class="btn ghost" onclick="closeGrafikModal()">Bekor</button>
      <button class="btn primary" onclick="saveGrafik(${year},${month})">✓ Grafik saqlash</button>
    </div>
  </div>`;

  document.body.appendChild(modal);

  // Store editDays globally for save
  window._grafikEditDays = editDays;
  window._grafikBolimSmenalar = bolimSmenalar;
}

function grafikCellChange(sel, syncGroup) {
  const val = sel.value;
  const colors = {kunduzi:'var(--green-dim)',tungi:'var(--blue-dim)',dam:'var(--red-dim)'};
  const textColors = {kunduzi:'var(--green)',tungi:'var(--blue)',dam:'var(--red)'};
  sel.style.background = colors[val]||'var(--bg3)';
  sel.style.color = textColors[val]||'var(--text)';

  // Guruh sinxronizatsiyasi (faqat foydalanuvchi o'zgartirsa, loop bo'lmasin)
  if(syncGroup !== false) {
    const bolim = sel.getAttribute('data-bolim');
    const smena = sel.getAttribute('data-smena');
    const date  = sel.getAttribute('data-date');

    let syncBolimlar = [];
    if(SMENA_GROUPS_3.includes(bolim)) syncBolimlar = SMENA_GROUPS_3.filter(b=>b!==bolim);
    else if(SMENA_GROUPS_2.includes(bolim)) syncBolimlar = SMENA_GROUPS_2.filter(b=>b!==bolim);

    syncBolimlar.forEach(b => {
      const peer = document.querySelector(`select[data-bolim="${b}"][data-smena="${smena}"][data-date="${date}"]`);
      if(peer) grafikCellChange(peer, false); // false = sinxronizatsiyasiz
      if(peer) peer.value = val;
      if(peer) { peer.style.background = colors[val]||'var(--bg3)'; peer.style.color = textColors[val]||'var(--text)'; }
    });
  }
}

// 3 smenali guruh: UB => PPS1, Cleaning
// 2 smenali guruh: UA => PPS2
const SMENA_GROUPS_3 = ['UB','PPS1','Cleaning'];
const SMENA_GROUPS_2 = ['UA','PPS2'];

function fillRow(bolim, smena, tip) {
  // Qaysi guruhga tegishli bo'lsa, o'sha guruhning xuddi shu smenasini ham to'ldiradi
  let syncBolimlar = [bolim];
  if(SMENA_GROUPS_3.includes(bolim)) {
    syncBolimlar = SMENA_GROUPS_3;
  } else if(SMENA_GROUPS_2.includes(bolim)) {
    syncBolimlar = SMENA_GROUPS_2;
  }

  syncBolimlar.forEach(b => {
    const sels = document.querySelectorAll(`select[data-bolim="${b}"][data-smena="${smena}"]`);
    sels.forEach(s => {
      const d = new Date(s.getAttribute('data-date')+'T12:00:00');
      const dw = d.getDay();
      if((dw===0||dw===6) && tip!=='dam') {
        s.value='dam';
      } else {
        s.value=tip;
      }
      grafikCellChange(s);
    });
  });
}

function fillAllSmena(tip) {
  if(!window._grafikBolimSmenalar) return;
  // fillRow already syncs groups, so just call for first bolim in each group
  const done = new Set();
  window._grafikBolimSmenalar.forEach(bs => {
    const groupKey = (SMENA_GROUPS_3.includes(bs.bolim)?'3':SMENA_GROUPS_2.includes(bs.bolim)?'2':'other_'+bs.bolim)+'_'+bs.smena;
    if(done.has(groupKey)) return;
    done.add(groupKey);
    fillRow(bs.bolim, bs.smena, tip);
  });
}

function saveGrafik(year, month) {
  const sels = document.querySelectorAll('#grafik-table select');
  const newGrafik = {};

  sels.forEach(sel => {
    const bolim = sel.getAttribute('data-bolim');
    const smena = sel.getAttribute('data-smena');
    const date  = sel.getAttribute('data-date');
    const val   = sel.value;
    const key   = grafikKey(year, month, bolim, smena);
    if(!newGrafik[key]) newGrafik[key]={};
    newGrafik[key][date] = val;
  });

  // Save to DB
  Object.assign(DB.grafik, newGrafik);
  const metaKey = year+'-'+String(month).padStart(2,'0');
  DB.grafik_meta[metaKey] = { tuzilgan: new Date().toISOString(), tuzgan: currentUser.id };
  Storage.save();

  showToast(`✓ ${['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'][month]} ${year} grafigi saqlandi!`,'ok');
  closeGrafikModal();
  renderGrafik();
}

function openGrafikView(year, month) {
  const MN=['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const days = getWorkDays(year, month);
  const modal = document.createElement('div');
  modal.className='modal-overlay';
  modal.id='grafik-view-modal';
  modal.style.zIndex='300';

  const bolimSmenalar=[];
  for(const b of DB.bolimlar){
    if(b.id==='Ofis') continue;
    for(const s of b.smenalar){
      if(s==='C') continue;
      const key=grafikKey(year,month,b.id,s);
      bolimSmenalar.push({bolim:b.id,nom:b.nom,smena:s,key,g:DB.grafik[key]||{}});
    }
  }

  modal.innerHTML=`
  <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:14px;padding:1.5rem;width:95vw;max-width:1100px;max-height:90vh;overflow-y:auto">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <h3 style="font-size:15px;font-weight:600">${MN[month]} ${year} — Ish Grafigi</h3>
      <button class="btn ghost" onclick="document.getElementById('grafik-view-modal').remove()">✕</button>
    </div>
    <div style="overflow-x:auto">
      <table style="font-size:11px;border-collapse:collapse;min-width:800px">
        <thead><tr>
          <th style="text-align:left;padding:6px 8px;background:var(--bg3);position:sticky;left:0;min-width:130px">Bo'lim/Smena</th>
          ${days.map(d=>{const dd=new Date(d+'T12:00:00');const dw=dd.getDay();const dam=dw===0||dw===6;const dN=['Ya','Du','Se','Ch','Pa','Ju','Sh'];return `<th style="text-align:center;padding:3px 2px;background:var(--bg3);min-width:30px;${dam?'color:var(--red)':''}"><div>${dd.getDate()}</div><div style="font-size:9px;opacity:.6">${dN[dw]}</div></th>`;}).join('')}
        </tr></thead>
        <tbody>
          ${bolimSmenalar.map(bs=>`<tr>
            <td style="padding:5px 8px;font-weight:600;font-family:var(--mono);background:var(--bg3);position:sticky;left:0;border-bottom:1px solid var(--border)">${bs.nom}/${bs.smena}</td>
            ${days.map(d=>{const tip=bs.g[d]||'—';const col=tip==='kunduzi'?'#00c98d':tip==='tungi'?'#4a9eff':tip==='dam'?'#f04f4f':'#556278';const lbl=tip==='kunduzi'?'K':tip==='tungi'?'T':tip==='dam'?'D':'—';const dd=new Date(d+'T12:00:00');const dw=dd.getDay();return `<td style="text-align:center;padding:3px 1px;border-bottom:1px solid var(--border);font-weight:700;color:${col};${(dw===0||dw===6)?'background:var(--red-dim)':''}">${lbl}</td>`;}).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="display:flex;gap:12px;margin-top:.75rem;font-size:11px">
      <span style="color:var(--green)">■ K = Kunduzgi (07:45–08:25)</span>
      <span style="color:var(--blue)">■ T = Tungi (19:45–20:25)</span>
      <span style="color:var(--red)">■ D = Dam olish</span>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

function closeGrafikModal() {
  const m = document.getElementById('grafik-modal');
  if(m) m.remove();
}

function renderFullGrafikTable(oyKey, MN) {
  const pts = oyKey.split('-');
  const sy=parseInt(pts[0]), sm=parseInt(pts[1]);
  const days = getWorkDays(sy, sm);
  const dNames=['Ya','Du','Se','Ch','Pa','Ju','Sh'];
  const cols = {kunduzi:'var(--green)',tungi:'var(--blue)',dam:'var(--red)'};
  const lbls = {kunduzi:'K',tungi:'T',dam:'D'};

  let html = '<div id="grafik-table-print" style="overflow-x:auto;background:#0f1117;padding:1rem"><table style="font-size:11px;border-collapse:collapse;min-width:700px">';
  html += '<thead><tr>';
  html += '<th style="text-align:left;padding:6px 8px;background:var(--bg3);position:sticky;left:0;min-width:120px">Bo\'lim/Smena</th>';
  days.forEach(function(d) {
    const dd=new Date(d+'T12:00:00'); const dw=dd.getDay(); const isW=dw===0||dw===6;
    html += '<th style="text-align:center;padding:4px 2px;background:var(--bg3);min-width:30px;'+(isW?'color:var(--red)':'')+'">';
    html += '<div>'+dd.getDate()+'</div><div style="font-size:9px;opacity:.6">'+dNames[dw]+'</div></th>';
  });
  html += '</tr></thead><tbody>';

  // C smena satri
  html += '<tr><td style="padding:5px 8px;font-weight:600;font-family:var(--mono);background:var(--bg3);position:sticky;left:0;border-bottom:1px solid var(--border);color:var(--text2)">Ofis & Cleaning/C</td>';
  days.forEach(function(d) {
    const dd=new Date(d+'T12:00:00'); const dw=dd.getDay();
    const tip=(dw===0||dw===6)?'dam':'kunduzi';
    html += '<td style="text-align:center;padding:3px 1px;border-bottom:1px solid var(--border);font-weight:700;color:'+(cols[tip]||'')+';'+(dw===0||dw===6?'background:var(--red-dim)':'')+'">'+(lbls[tip]||'')+'</td>';
  });
  html += '</tr>';

  // Boshqa bo'limlar
  for(let i=0;i<DB.bolimlar.length;i++) {
    const b=DB.bolimlar[i];
    if(b.id==='Ofis') continue;
    for(let j=0;j<b.smenalar.length;j++) {
      const s=b.smenalar[j];
      if(s==='C') continue;
      const key=grafikKey(sy,sm,b.id,s);
      const g=DB.grafik[key]||{};
      html += '<tr><td style="padding:5px 8px;font-weight:600;font-family:var(--mono);background:var(--bg3);position:sticky;left:0;border-bottom:1px solid var(--border)">'+b.nom+'<span style="opacity:.6">/'+s+'</span></td>';
      days.forEach(function(d) {
        const dd=new Date(d+'T12:00:00'); const dw=dd.getDay(); const isW=dw===0||dw===6;
        const tip=g[d]||(isW?'dam':null);
        html += '<td style="text-align:center;padding:3px 1px;border-bottom:1px solid var(--border);font-weight:700;color:'+(tip?cols[tip]:'var(--text3)')+';'+(isW?'background:var(--red-dim)':'')+'">'+(tip?lbls[tip]:'—')+'</td>';
      });
      html += '</tr>';
    }
  }
  html += '</tbody></table></div>';
  html += '<div style="display:flex;gap:12px;margin-top:.75rem;font-size:11px">';
  html += '<span style="color:var(--green)">■ K = Kunduzgi</span>';
  html += '<span style="color:var(--blue)">■ T = Tungi</span>';
  html += '<span style="color:var(--red)">■ D = Dam olish</span></div>';
  return html;
}


// Mobile sidebar toggle
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  if(sb) sb.classList.toggle('open');
  if(ov) ov.classList.toggle('show');
}

// Auto-close sidebar on mobile when page changes
document.addEventListener('click', function(e) {
  if(e.target.closest('.nav-item')) {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    if(sb && sb.classList.contains('open')) {
      sb.classList.remove('open');
      if(ov) ov.classList.remove('show');
    }
  }
});

// ============================================================
// 1. MA'LUMOTLARNI YANGILASH TUGMASI
// ============================================================
function refreshData() {
  if(typeof FirebaseStorage !== 'undefined') {
    showToast('🔄 Ma\'lumotlar yangilanmoqda...','warn');
    FirebaseStorage.load().then(data => {
      if(data) {
        Storage._applyData(data);
        // Aktiv sahifani qayta render qilish
        const activePage = document.querySelector('.page.active');
        if(activePage) {
          const pageId = activePage.id.replace('page-','');
          showPage(pageId);
        }
        showToast('✓ Ma\'lumotlar yangilandi!','ok');
      }
    });
  } else {
    showToast('Firebase ulanmagan','err');
  }
}

// ============================================================
// 2. GRAFIK ASOSIDA JAMLANMA
// ============================================================
function getActiveSmenas() {
  // Bugun va kecha ish grafigiga asosan aktiv smenalar
  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate()-1);
  const yStr = yesterday.getFullYear()+'-'+String(yesterday.getMonth()+1).padStart(2,'0')+'-'+String(yesterday.getDate()).padStart(2,'0');

  const active = [];
  for(const b of DB.bolimlar) {
    for(const s of b.smenalar) {
      if(s==='C') {
        // C smena: har kuni kunduzgi
        const d = new Date(today+'T12:00:00');
        if(d.getDay()!==0 && d.getDay()!==6) {
          active.push({bolim:b.id, smena:s, date:today, tip:'kunduzi'});
        }
        continue;
      }
      // Bugungi kunduzgi
      const tipToday = getDayType(today, b.id, s);
      if(tipToday==='kunduzi') active.push({bolim:b.id, smena:s, date:today, tip:'kunduzi'});
      // Kechagi tungi
      const tipYest = getDayType(yStr, b.id, s);
      if(tipYest==='tungi') active.push({bolim:b.id, smena:s, date:yStr, tip:'tungi'});
    }
  }
  return active;
}

// ============================================================
// 6. DAVOMAT KIRITISH VAQTINI GRAFIK ASOSIDA TEKSHIRISH
// ============================================================
function canMasUlEnterNow() {
  // Grafik bo'yicha bugun qaysi smena ishlamoqda
  const today = todayStr();
  const bolim = currentUser.bolim;
  const smena = window._masulSelectedSmena || currentUser.smena;

  // C smena - UA grafigi asosida tekshirish
  if(smena === 'C') {
    const d = new Date(today+'T12:00:00');
    if(d.getDay()===0||d.getDay()===6) return {ok:false, reason:"C smena bugun dam olish kuni"};
    if(!isKunduziWindow()) return {ok:false, reason:"Kunduzgi davomat vaqti: 07:45–08:25"};
    // ofis_a faqat UA A kunduzgi bo'lganda, ofis_b faqat UA B kunduzgi bo'lganda
    if(currentUser.c_smena_ua_smena) {
      const uaSmena = currentUser.c_smena_ua_smena; // 'A' yoki 'B'
      const uaTip = getDayType(today, 'UA', uaSmena);
      if(uaTip !== 'kunduzi') return {ok:false, reason:'UA '+uaSmena+' smena bugun kunduzgi emas — C smena kiritish yopiq'};
    }
    return {ok:true, tip:'kunduzi'};
  }

  const tip = getDayType(today, bolim, smena);
  if(!tip || tip==='dam') return {ok:false, reason:"Bugun "+bolim+" "+smena+" smena dam olish kuni"};
  if(tip==='kunduzi' && !isKunduziWindow()) return {ok:false, reason:"Kunduzgi davomat vaqti: 07:45–08:25"};
  if(tip==='tungi' && !isTungiWindow()) return {ok:false, reason:"Tungi davomat vaqti: 19:45–20:25"};
  return {ok:true, tip};
}

// ============================================================
// TIL VA TEST REJIM
// ============================================================
function changeLang(lang) {
  setLang(lang);
  // Tugmalarni yangilash
  const uzBtn = document.getElementById('lang-uz');
  const ruBtn = document.getElementById('lang-ru');
  if(uzBtn) { uzBtn.style.borderColor = lang==='uz'?'var(--green)':'var(--border)'; uzBtn.style.color = lang==='uz'?'var(--green)':'var(--text2)'; uzBtn.style.fontWeight = lang==='uz'?'600':'400'; }
  if(ruBtn) { ruBtn.style.borderColor = lang==='ru'?'var(--green)':'var(--border)'; ruBtn.style.color = lang==='ru'?'var(--green)':'var(--text2)'; ruBtn.style.fontWeight = lang==='ru'?'600':'400'; }
  // Login sahifasi matnlarini yangilash
  const els = {
    'login-title': t('appTitle'),
    'login-subtitle': t('appSubtitle'),
    'lbl-login': t('login'),
    'lbl-pass': t('password'),
    'login-btn': t('enterBtn'),
    'hint-masul': t('masUlHint'),
  };
  Object.entries(els).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if(el) el.textContent = text;
  });
  document.getElementById('login-err').textContent = '';
}

function updateTestModeBadge() {
  const badge = document.getElementById('test-mode-badge');
  if(badge) badge.style.display = isTestMode() ? 'block' : 'none';
}

// Sidebar matnlarini til bo'yicha yangilash
function updateSidebarLang() {
  const labelMap = {
    'davomat': t('davomat'),
    'jamlanma': t('jamlanma'),
    'smena-xisobot': t('smenaXisobot'),
    'hisobot': t('hisobot'),
    'reyting': t('reyting'),
    'grafik': t('grafik'),
    'xodimlar': t('xodimlar'),
    'bolimlar': t('bolimlar'),
    'foydalanuvchilar': t('foydalanuvchilar'),
  };
  Object.entries(labelMap).forEach(([page, label]) => {
    const el = document.getElementById('nav-'+page);
    if(el) { const span = el.querySelector('span:last-child'); if(span) span.textContent = label; }
  });
  // Logout tugmasi
  const logoutBtns = document.querySelectorAll('.logout-btn .btn');
  logoutBtns.forEach(btn => { btn.textContent = '⬅ '+t('logout'); });
}

// ============================================================
// VIEW SCOPE — vadmin2/3 uchun filtrlash
// ============================================================

// Foydalanuvchi ko'ra oladigan bo'lim+smenalar ro'yxatini olish
function getViewScope() {
  if(currentUser.role === 'admin') return null; // admin hamma narsani ko'radi
  if(currentUser.role === 'mas_ul') {
    // Mas'ul faqat o'z bo'limi
    return [{bolim: currentUser.bolim, smenalar: [currentUser.smena, ...(currentUser.extra_smenalar||[])]}];
  }
  if(currentUser.role === 'supervisor') {
    // Supervisor o'z nazoratidagi smenalar
    const bsMap = {};
    getSupervisedBolimSmenalar().forEach(bs => {
      if(!bsMap[bs.bolim]) bsMap[bs.bolim] = [];
      bsMap[bs.bolim].push(bs.smena);
      (bs.extra||[]).forEach(s => bsMap[bs.bolim].push(s));
    });
    return Object.entries(bsMap).map(([bolim,smenalar]) => ({bolim, smenalar}));
  }
  if(currentUser.role === 'admin2') {
    if(!currentUser.view_scope || currentUser.view_scope === 'all') return null; // vadmin1 - hammani ko'radi
    if(currentUser.view_scope === 'filtered' && currentUser.view_bolimlar && currentUser.view_bolimlar.length > 0) {
      return currentUser.view_bolimlar;
    }
    return null;
  }
  return null;
}

// Berilgan bo'lim+smena ko'rinishida ekanligini tekshirish
function isInViewScope(bolim, smena) {
  const scope = getViewScope();
  if(!scope) return true; // null = hamma ko'rinadi
  return scope.some(s => s.bolim === bolim && s.smenalar.includes(smena));
}

// Filtrlangan bo'limlar ro'yxatini olish
function getFilteredBolimlar() {
  const scope = getViewScope();
  if(!scope) return DB.bolimlar;
  return DB.bolimlar.filter(b => scope.some(s => s.bolim === b.id)).map(b => {
    const sc = scope.find(s => s.bolim === b.id);
    return {...b, smenalar: b.smenalar.filter(s => sc.smenalar.includes(s))};
  });
}

// Filtrlangan xodimlar
function getFilteredXodimlar() {
  const scope = getViewScope();
  if(!scope) return DB.xodimlar;
  return DB.xodimlar.filter(e => isInViewScope(e.bolim, e.smena));
}
