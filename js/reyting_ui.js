// ============================================================
// REYTING UI
// ============================================================

let reytingState = {
  muddat: 'oylik',
  bolim: '',
  smena: '',
  customStart: '',
  customEnd: ''
};

function renderReytingPage() {
  const content = document.getElementById('reyting-content');
  if(!content) return;

  const isAdminView = ['admin','admin2','supervisor'].includes(currentUser.role);
  const isMasUlView = currentUser.role === 'mas_ul';

  const bolimFilter = isMasUlView ? currentUser.bolim : (reytingState.bolim || null);
  const smenaFilter = isMasUlView ? currentUser.smena : (reytingState.smena || null);

  const {days, start, end} = getDateRange(
    reytingState.muddat,
    reytingState.customStart,
    reytingState.customEnd
  );

  const reyting = calcReyting(bolimFilter, smenaFilter, days);

  const totalSoat = Math.round(reyting.reduce((s,r)=>s+r.totalSoat,0)*100)/100;
  const totalKun  = reyting.reduce((s,r)=>s+r.totalKun,0);
  const totalEmps = reyting.length;

  // Muddat tanlash
  let html = `<div style="display:flex;gap:8px;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap">
    <select onchange="reytingSetMuddat(this.value)" style="max-width:160px">
      <option value="kunlik"  ${reytingState.muddat==='kunlik'?'selected':''}>Kunlik</option>
      <option value="haftalik"${reytingState.muddat==='haftalik'?'selected':''}>Haftalik</option>
      <option value="oylik"   ${reytingState.muddat==='oylik'?'selected':''}>Oylik</option>
      <option value="yillik"  ${reytingState.muddat==='yillik'?'selected':''}>Yillik</option>
      <option value="custom"  ${reytingState.muddat==='custom'?'selected':''}>O'z muddati</option>
    </select>
    ${reytingState.muddat==='custom'?`
      <input type="date" value="${reytingState.customStart}" onchange="reytingState.customStart=this.value;renderReytingPage()" style="max-width:150px">
      <span style="color:var(--text3)">—</span>
      <input type="date" value="${reytingState.customEnd}"  onchange="reytingState.customEnd=this.value;renderReytingPage()"  style="max-width:150px">
    `:''}
    ${isAdminView?`
      <select onchange="reytingState.bolim=this.value;reytingState.smena='';renderReytingPage()" style="max-width:150px">
        <option value="">Barcha bo'limlar</option>
        ${(typeof getFilteredBolimlar==='function'?getFilteredBolimlar():DB.bolimlar).map(b=>`<option value="${b.id}" ${reytingState.bolim===b.id?'selected':''}>${b.nom}</option>`).join('')}
      </select>
      ${reytingState.bolim?`
        <select onchange="reytingState.smena=this.value;renderReytingPage()" style="max-width:120px">
          <option value="">Barcha smenalar</option>
          ${(DB.bolimlar.find(b=>b.id===reytingState.bolim)?.smenalar||[]).map(s=>`<option value="${s}" ${reytingState.smena===s?'selected':''}>${s} smena</option>`).join('')}
        </select>
      `:''}
    `:''}
    <span style="font-size:11px;color:var(--text2);margin-left:auto">${formatDate(start)} — ${formatDate(end)}</span>
  </div>`;

  // Umumiy statistika kartalar
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:1.5rem">
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:1rem">
      <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:.4rem">Xodimlar soni</div>
      <div style="font-size:28px;font-weight:700;font-family:var(--mono)">${totalEmps}</div>
    </div>
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:1rem">
      <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:.4rem">Jami yo'qotilgan kun</div>
      <div style="font-size:28px;font-weight:700;font-family:var(--mono);color:var(--red)">${totalKun}</div>
    </div>
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:1rem">
      <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:.4rem">Jami yo'qotilgan soat</div>
      <div style="font-size:28px;font-weight:700;font-family:var(--mono);color:var(--amber)">${totalSoat}</div>
    </div>
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:1rem">
      <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:.4rem">O'rtacha / xodim</div>
      <div style="font-size:28px;font-weight:700;font-family:var(--mono);color:var(--amber)">${totalEmps?Math.round(totalSoat/totalEmps*100)/100:0} soat</div>
    </div>
  </div>`;

  // Sabab bo'yicha taqsimot
  if(reyting.length > 0) {
    const allSababMap = {};
    reyting.forEach(r => Object.entries(r.sababMap).forEach(([k,v]) => { allSababMap[k]=(allSababMap[k]||0)+v; }));

    html += `<div class="card" style="margin-bottom:1rem">
      <div class="card-title">Sabab bo'yicha taqsimot</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${Object.entries(allSababMap).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:8px 14px;text-align:center;min-width:70px">
            <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:${k==='KECH'?'var(--amber)':k==='ERTA'?'var(--cyan)':'var(--red)'}">${k}</div>
            <div style="font-size:22px;font-weight:700;font-family:var(--mono);margin:2px 0">${v}</div>
            <div style="font-size:10px;color:var(--text2)">marta</div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // Reyting jadvali
  html += `<div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
      <div class="card-title" style="margin-bottom:0">Xodimlar reytingi (eng ko'p yo'qotgandan)</div>
    </div>`;

  if(reyting.length === 0) {
    html += `<div style="text-align:center;padding:2rem;color:var(--text3)">
      <div style="font-size:32px;margin-bottom:.5rem">✓</div>
      Bu muddatda yo'qotish qayd etilmagan
    </div>`;
  } else {
    html += `<div class="tbl-wrap"><table>
      <thead><tr>
        <th style="width:36px">#</th>
        <th>Familiya Ismi</th>
        <th style="width:80px">Tabel №</th>
        <th style="width:100px">Ish joyi</th>
        <th style="width:70px;color:var(--red)">Kun</th>
        <th style="width:70px;color:var(--amber)">Soat</th>
        <th>Sabablar</th>
      </tr></thead>
      <tbody>
      ${reyting.map((r,i)=>{
        const sababStr = Object.entries(r.sababMap)
          .sort((a,b)=>b[1]-a[1])
          .map(([k,v])=>`<span style="background:var(--bg3);border:1px solid var(--border);padding:2px 7px;border-radius:5px;font-size:10px;font-family:var(--mono);color:${k==='KECH'?'var(--amber)':k==='ERTA'?'var(--cyan)':'var(--red)'}">${k}×${v}</span>`)
          .join(' ');
        return `<tr>
          <td style="color:var(--text3);font-family:var(--mono);text-align:center">${i+1}</td>
          <td style="font-weight:600">${r.emp.ism}</td>
          <td style="font-family:var(--mono);font-size:11px;color:var(--text2)">${r.emp.tabel}</td>
          <td><span style="font-family:var(--mono);font-size:10px;background:var(--bg3);padding:2px 6px;border-radius:4px">${r.emp.bolim}/${r.emp.smena}</span></td>
          <td style="text-align:center;font-weight:700;font-family:var(--mono);color:var(--red)">${r.totalKun}</td>
          <td style="text-align:center;font-weight:700;font-family:var(--mono);color:var(--amber)">${r.totalSoat}</td>
          <td>${sababStr}</td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div>`;

    // Izoh
    html += `<div style="margin-top:.75rem;font-size:11px;color:var(--text2);padding:8px 12px;background:var(--bg3);border-radius:8px">
      <b>Hisoblash tartibi:</b> BS, B, P, A/ART, AP/APT, AS/AST, ? = 11 soat = 1 kun &nbsp;|&nbsp; KECH/ERTA = haqiqiy soat miqdori
    </div>`;
  }

  html += `</div>`;
  content.innerHTML = html;
}

function reytingSetMuddat(v) {
  reytingState.muddat = v;
  if(v === 'custom') {
    const now = new Date();
    reytingState.customEnd = todayStr();
    reytingState.customStart = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';
  }
  renderReytingPage();
}

// ---- 08:36 XISOBOTI ----
function calc0836Report() {
  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate()-1);
  const yStr = yesterday.getFullYear()+'-'+String(yesterday.getMonth()+1).padStart(2,'0')+'-'+String(yesterday.getDate()).padStart(2,'0');

  const report = { kunduzi:[], tungi:[], date: today, prevDate: yStr };

  for(const b of DB.bolimlar) {
    for(const s of b.smenalar) {
      const davK = getDavomat(today, b.id, s);
      if(davK && davK.smenaType === 'kunduzi') {
        report.kunduzi.push({bolim:b.id, bolimNom:b.nom, smena:s, dav:davK});
      }
      const davT = getDavomat(yStr, b.id, s);
      if(davT && davT.smenaType === 'tungi') {
        report.tungi.push({bolim:b.id, bolimNom:b.nom, smena:s, dav:davT});
      }
    }
  }
  return report;
}

function render0836Page() {
  const content = document.getElementById('smena-xisobot-content');
  if(!content) return;

  const rep = calc0836Report();
  const now = new Date();
  const soat = now.getHours()*60+now.getMinutes();
  const isReady = soat >= 8*60+36;
  const MN=['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);

  let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:8px">
    <div>
      <h3 style="font-size:15px;font-weight:600">Smena Xisoboti — 08:36</h3>
      <p style="font-size:11px;color:var(--text2)">${today.getDate()} ${MN[today.getMonth()+1]} ${today.getFullYear()}</p>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <div style="font-family:var(--mono);font-size:12px;background:${isReady?'rgba(0,201,141,.1)':'rgba(245,166,35,.1)'};border:1px solid ${isReady?'rgba(0,201,141,.3)':'rgba(245,166,35,.3)'};padding:5px 14px;border-radius:20px;color:${isReady?'var(--green)':'var(--amber)'}">
        ${isReady?'✓ Xisobot tayyor':'⏳ 08:36 da tayyor bo\'ladi'}
      </div>
      <button class="btn sm" onclick="render0836Page()">🔄</button>
    </div>
  </div>`;

  // Kunduzgi smena
  html += `<div class="card" style="margin-bottom:1rem">
    <div class="card-title" style="color:var(--green)">☀️ Bugungi kunduzgi smena — ${today.getDate()} ${MN[today.getMonth()+1]}</div>`;
  if(rep.kunduzi.length === 0) {
    html += `<div style="color:var(--text3);font-size:12px;padding:.75rem 0">Kunduzgi smena davomati kiritilmagan</div>`;
  } else {
    rep.kunduzi.forEach(item => { html += renderSmenaBlock(item); });
  }
  html += `</div>`;

  // Tungi smena
  html += `<div class="card">
    <div class="card-title" style="color:var(--blue)">🌙 Kechagi tungi smena — ${yesterday.getDate()} ${MN[yesterday.getMonth()+1]}</div>`;
  if(rep.tungi.length === 0) {
    html += `<div style="color:var(--text3);font-size:12px;padding:.75rem 0">Tungi smena davomati kiritilmagan</div>`;
  } else {
    rep.tungi.forEach(item => { html += renderSmenaBlock(item); });
  }
  html += `</div>`;

  content.innerHTML = html;
}

function renderSmenaBlock(item) {
  const emps = getEmpsForSmena(item.bolim, item.smena);
  const dav = item.dav;
  let keldi=0, kech=0, yoq=0, erta=0;
  const kelmaganlar=[], kechlar=[], ertalar=[];

  for(const e of emps) {
    const att = dav.attendance ? dav.attendance[e.id] : null;
    if(!att || att.holat==='keldi') { keldi++; }
    else if(att.holat==='kech')  { kech++;  kechlar.push({e,att}); }
    else if(att.holat==='erta')  { erta++;  ertalar.push({e,att}); }
    else                         { yoq++;   kelmaganlar.push({e,att}); }
  }

  const bosh = dav.boshCount || 0;
  const pct = emps.length ? Math.round(keldi/emps.length*100) : 0;

  let html = `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:1rem;margin-bottom:.75rem">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem;flex-wrap:wrap;gap:6px">
      <div style="font-weight:700;font-family:var(--mono)">${item.bolimNom} / ${item.smena} smena</div>
      <div style="display:flex;gap:10px;font-size:12px">
        <span style="color:var(--green)">✓ ${keldi}</span>
        <span style="color:var(--amber)">⏰ ${kech}</span>
        <span style="color:var(--red)">✗ ${yoq}</span>
        <span style="color:var(--cyan)">🚶 ${erta}</span>
        ${bosh?`<span style="color:var(--text3)">📦 ${bosh}</span>`:''}
      </div>
    </div>
    <div style="background:var(--bg4);border-radius:4px;height:5px;margin-bottom:.75rem">
      <div style="height:100%;border-radius:4px;background:var(--green);width:${pct}%"></div>
    </div>`;

  if(kelmaganlar.length) {
    html += `<div style="margin-bottom:.5rem">
      <div style="font-size:10px;color:var(--red);font-family:var(--mono);letter-spacing:.5px;margin-bottom:4px">KELMAGANLAR (${kelmaganlar.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${kelmaganlar.map(({e,att})=>`<span style="background:rgba(240,79,79,.1);border:1px solid rgba(240,79,79,.2);padding:3px 8px;border-radius:6px;font-size:11px">${e.ism} <span style="opacity:.6;font-family:var(--mono)">[${att.sabab||'?'}]</span></span>`).join('')}
      </div></div>`;
  }
  if(kechlar.length) {
    html += `<div style="margin-bottom:.5rem">
      <div style="font-size:10px;color:var(--amber);font-family:var(--mono);letter-spacing:.5px;margin-bottom:4px">KECHIKDILAR (${kechlar.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${kechlar.map(({e,att})=>`<span style="background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.2);padding:3px 8px;border-radius:6px;font-size:11px">${e.ism}${att.kechVaqt?` <span style="opacity:.6;font-family:var(--mono)">[${att.kechVaqt}]</span>`:''}</span>`).join('')}
      </div></div>`;
  }
  if(ertalar.length) {
    html += `<div>
      <div style="font-size:10px;color:var(--cyan);font-family:var(--mono);letter-spacing:.5px;margin-bottom:4px">ERTA KETDILAR (${ertalar.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${ertalar.map(({e,att})=>`<span style="background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.2);padding:3px 8px;border-radius:6px;font-size:11px">${e.ism}${att.ertaVaqt?` <span style="opacity:.6;font-family:var(--mono)">[${att.ertaVaqt}]</span>`:''}</span>`).join('')}
      </div></div>`;
  }
  html += `</div>`;
  return html;
}
