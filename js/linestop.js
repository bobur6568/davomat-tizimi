// ============================================================
// LINE STOP MODULI
// ============================================================

const LINE_STOP_BOLIMLAR = ['UB', 'UA', 'PPS1', 'PPS2'];

const LINE_STOP_SABABLAR = [
  { kod: 'LS1', nom: "O'z vaqtida yetkazib olib kirilmagan (ulgurmagan)" },
  { kod: 'LS2', nom: "Omborda qoldiq yo'q (defitsit)" },
  { kod: 'LS3', nom: "SAP tizimida nosozlik bo'ldi" },
  { kod: 'LS4', nom: "Texnika buzilib qolishi holati" },
  { kod: 'LS5', nom: "Detallarda peresort holati bo'lgan" },
  { kod: 'LS6', nom: "Boshqa sabab" },
];

// vadmin4-8 ning Line Stop bo'limlari
const LINE_STOP_VADMIN_BOLIMLAR = {
  'vadmin4': ['UB_A', 'PPS1_A'],
  'vadmin5': ['UB_B', 'PPS1_B'],
  'vadmin6': ['UB_D', 'PPS1_D'],
  'vadmin7': ['UA_A', 'PPS2_A'],
  'vadmin8': ['UA_B', 'PPS2_B'],
};

// Tasdiqlash: vadmin2 → vadmin4,5,6 | vadmin3 → vadmin7,8
const LINE_STOP_APPROVER_MAP = {
  'vadmin2': ['vadmin4', 'vadmin5', 'vadmin6'],
  'vadmin3': ['vadmin7', 'vadmin8'],
};

const LINE_STOP_VIEWERS   = ['admin', 'admin2', 'vadmin1', 'vadmin2', 'vadmin3'];
const LINE_STOP_EDITORS   = ['vadmin4', 'vadmin5', 'vadmin6', 'vadmin7', 'vadmin8'];
const LINE_STOP_APPROVERS = ['vadmin2', 'vadmin3'];

// ============================================================
// ROL TEKSHIRISH
// ============================================================
function isLineStopViewer() {
  if (!currentUser) return false;
  return LINE_STOP_VIEWERS.includes(currentUser.id) || currentUser.role === 'admin';
}
function isLineStopEditor() {
  if (!currentUser) return false;
  return LINE_STOP_EDITORS.includes(currentUser.id);
}
function isLineStopApprover() {
  if (!currentUser) return false;
  return LINE_STOP_APPROVERS.includes(currentUser.id);
}
function isLineStopAdmin() {
  if (!currentUser) return false;
  return currentUser.id === 'admin' || currentUser.role === 'admin';
}
function getLineStopUserBolimlar() {
  if (!currentUser) return [];
  return LINE_STOP_VADMIN_BOLIMLAR[currentUser.id] || [];
}
function getMyEditors() {
  if (!currentUser) return [];
  return LINE_STOP_APPROVER_MAP[currentUser.id] || [];
}

// ============================================================
// FIREBASE AMALLAR
// ============================================================
async function saveLineStop(data) {
  const id = 'ls_' + Date.now();
  data.id = id;
  data.kiritgan = currentUser.id;
  data.kiritganNom = currentUser.name;
  data.kiritilganVaqt = new Date().toISOString();
  data.status = 'pending';
  await firebase.database().ref('davomat/line_stop/' + id).set(data);
  return id;
}

async function updateLineStop(id, data) {
  data.status = 'pending';
  data.radSababi = '';
  data.radEtgan = '';
  data.tahrirlangan = new Date().toISOString();
  await firebase.database().ref('davomat/line_stop/' + id).update(data);
}

async function approveLineStop(id) {
  await firebase.database().ref('davomat/line_stop/' + id).update({
    status: 'approved',
    tasdiqlagan: currentUser.id,
    tasdiqlaganNom: currentUser.name,
    tasdiqlanganVaqt: new Date().toISOString(),
    radSababi: '',
  });
}

async function rejectLineStop(id, sabab) {
  await firebase.database().ref('davomat/line_stop/' + id).update({
    status: 'rejected',
    radSababi: sabab,
    radEtgan: currentUser.id,
    radEtganNom: currentUser.name,
    radEtilganVaqt: new Date().toISOString(),
  });
}

async function deleteLineStopRecord(id) {
  if (!isLineStopAdmin()) {
    showToast("O'chirish huquqingiz yo'q!", 'err');
    return;
  }
  if (!confirm("Bu yozuvni o'chirmoqchimisiz?")) return;
  await firebase.database().ref('davomat/line_stop/' + id).remove();
  showToast("O'chirildi", 'ok');
  renderLineStopPage();
}

async function getLineStoplar() {
  return new Promise((resolve) => {
    firebase.database().ref('davomat/line_stop').once('value', snap => {
      resolve(snap.exists() ? snap.val() : {});
    });
  });
}

// ============================================================
// RASM YUKLASH
// ============================================================
function readImageAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================
// ASOSIY SAHIFA
// ============================================================
async function renderLineStopPage() {
  const content = document.getElementById('line-stop-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text2)">⏳ Yuklanmoqda...</div>';

  if (isLineStopEditor()) {
    renderLineStopEditorPage(content);
  } else if (isLineStopApprover()) {
    renderLineStopApproverPage(content);
  } else if (isLineStopViewer()) {
    renderLineStopViewerPage(content);
  } else {
    content.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--red)">❌ Ruxsat yo\'q</div>';
  }
}

// ============================================================
// KIRITUVCHI SAHIFASI (vadmin4-8)
// ============================================================
async function renderLineStopEditorPage(content) {
  const lsData = await getLineStoplar();

  const myRecords = Object.values(lsData)
    .filter(r => r && r.kiritgan === currentUser.id)
    .sort((a, b) => new Date(b.kiritilganVaqt) - new Date(a.kiritilganVaqt))
    .slice(0, 30);

  const pendingCount  = myRecords.filter(r => r.status === 'pending').length;
  const rejectedCount = myRecords.filter(r => r.status === 'rejected').length;

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:8px">
      <div>
        <h3 style="font-size:15px;font-weight:600">Line Stop Kiritish</h3>
        <p style="font-size:11px;color:var(--text2)">${currentUser.name}</p>
      </div>
      <button class="btn primary" onclick="openLineStopModal()">+ Yangi to'xtalish</button>
    </div>

    ${pendingCount > 0 ? `
      <div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:10px;padding:.75rem 1rem;margin-bottom:.75rem;font-size:12px;color:var(--amber)">
        ⏳ <b>${pendingCount} ta</b> yozuv tasdiqlanishini kutmoqda
      </div>
    ` : ''}

    ${rejectedCount > 0 ? `
      <div style="background:rgba(240,79,79,.1);border:1px solid rgba(240,79,79,.3);border-radius:10px;padding:.75rem 1rem;margin-bottom:.75rem;font-size:12px;color:var(--red)">
        ❌ <b>${rejectedCount} ta</b> yozuv rad etilgan — tahrirlang va qayta yuboring
      </div>
    ` : ''}

    <div class="card">
      <div class="card-title">Mening yozuvlarim</div>
      ${myRecords.length === 0
        ? '<div style="color:var(--text3);text-align:center;padding:1rem">Hozircha yozuv yo\'q</div>'
        : myRecords.map(r => renderLineStopEditorCard(r)).join('')}
    </div>
  `;

  content.innerHTML = html;
}

function renderLineStopEditorCard(r) {
  const sababNom = LINE_STOP_SABABLAR.find(s => s.kod === r.sabab)?.nom || r.sabab || '?';
  const isPending  = r.status === 'pending';
  const isRejected = r.status === 'rejected';
  const isApproved = r.status === 'approved';

  let statusBadge = '';
  if (isPending)  statusBadge = `<span style="background:rgba(245,158,11,.15);color:var(--amber);border:1px solid rgba(245,158,11,.3);padding:2px 8px;border-radius:20px;font-size:11px">⏳ Kutilmoqda</span>`;
  if (isApproved) statusBadge = `<span style="background:rgba(34,197,94,.12);color:#22c55e;border:1px solid rgba(34,197,94,.3);padding:2px 8px;border-radius:20px;font-size:11px">✅ Tasdiqlangan</span>`;
  if (isRejected) statusBadge = `<span style="background:rgba(240,79,79,.12);color:var(--red);border:1px solid rgba(240,79,79,.3);padding:2px 8px;border-radius:20px;font-size:11px">❌ Rad etildi</span>`;

  const borderColor = isRejected ? 'var(--red)' : isPending ? 'var(--amber)' : 'var(--border)';

  return `
    <div style="background:var(--bg3);border:1px solid ${borderColor};border-radius:10px;padding:1rem;margin-bottom:.75rem">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px">
        <div>
          <span style="font-weight:700;font-family:var(--mono)">${r.bolim}</span>
          <span style="margin:0 6px;color:var(--text3)">|</span>
          <span style="font-size:12px;color:var(--text2)">${r.sana || ''} &nbsp; ${r.smena} smena</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          ${statusBadge}
          <span style="background:rgba(240,79,79,.15);color:var(--red);border:1px solid rgba(240,79,79,.3);padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;font-family:var(--mono)">${r.davomiylik} daq</span>
        </div>
      </div>
      <div style="margin-top:.5rem;font-size:12px;color:var(--text2)">⏰ ${r.vaqtDan || ''} — ${r.vaqtGacha || ''}</div>
      <div style="margin-top:.4rem;font-size:12px">📋 ${sababNom}${r.boshqaSabab && r.sabab==='LS6' ? ': '+r.boshqaSabab : ''}</div>
      ${r.izoh ? `<div style="margin-top:.4rem;font-size:11px;color:var(--text2)">💬 ${r.izoh}</div>` : ''}
      ${isRejected && r.radSababi ? `
        <div style="margin-top:.5rem;background:rgba(240,79,79,.08);border:1px solid rgba(240,79,79,.2);border-radius:8px;padding:.5rem .75rem;font-size:12px;color:var(--red)">
          ❌ Rad sababi: <b>${r.radSababi}</b>
        </div>
      ` : ''}
      ${r.rasmlar && r.rasmlar.length > 0 ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:.5rem">
          ${r.rasmlar.map(img => `<img src="${img}" onclick="openImageModal('${img}')" style="width:60px;height:60px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid var(--border)">`).join('')}
        </div>
      ` : ''}
      ${isRejected ? `
        <div style="margin-top:.75rem">
          <button class="btn sm primary" onclick="openLineStopModal('${r.id}')">✏️ Tahrirlash va qayta yuborish</button>
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================
// TASDIQLASH SAHIFASI (vadmin2, vadmin3)
// ============================================================
async function renderLineStopApproverPage(content) {
  const lsData = await getLineStoplar();
  const myEditors = getMyEditors();

  const allMyRecords = Object.values(lsData)
    .filter(r => r && myEditors.includes(r.kiritgan))
    .sort((a, b) => new Date(b.kiritilganVaqt) - new Date(a.kiritilganVaqt));

  const pending  = allMyRecords.filter(r => r.status === 'pending');
  const approved = allMyRecords.filter(r => r.status === 'approved');
  const rejected = allMyRecords.filter(r => r.status === 'rejected');

  let html = `
    <div style="margin-bottom:1.5rem">
      <h3 style="font-size:15px;font-weight:600">Line Stop Tasdiqlash</h3>
      <p style="font-size:11px;color:var(--text2)">${currentUser.name}</p>
    </div>

    ${pending.length > 0 ? `
      <div class="card" style="margin-bottom:1rem">
        <div class="card-title" style="color:var(--amber)">⏳ Tasdiqlanmagan (${pending.length})</div>
        ${pending.map(r => renderLineStopApproverCard(r)).join('')}
      </div>
    ` : `
      <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:10px;padding:.75rem 1rem;margin-bottom:1rem;font-size:12px;color:#22c55e">
        ✅ Barcha yozuvlar ko'rib chiqilgan
      </div>
    `}

    ${rejected.length > 0 ? `
      <div class="card" style="margin-bottom:1rem">
        <div class="card-title" style="color:var(--red)">❌ Rad etilgan (${rejected.length})</div>
        ${rejected.map(r => renderLineStopApproverCard(r)).join('')}
      </div>
    ` : ''}

    <div class="card">
      <div class="card-title">✅ Tasdiqlangan (${approved.length})</div>
      ${approved.length === 0
        ? '<div style="color:var(--text3);text-align:center;padding:1rem">Hozircha yozuv yo\'q</div>'
        : approved.map(r => renderLineStopApproverCard(r)).join('')}
    </div>
  `;

  content.innerHTML = html;
}

function renderLineStopApproverCard(r) {
  const sababNom = LINE_STOP_SABABLAR.find(s => s.kod === r.sabab)?.nom || r.sabab || '?';
  const isPending  = r.status === 'pending';
  const isRejected = r.status === 'rejected';
  const isApproved = r.status === 'approved';

  let statusBadge = '';
  if (isPending)  statusBadge = `<span style="background:rgba(245,158,11,.15);color:var(--amber);border:1px solid rgba(245,158,11,.3);padding:2px 8px;border-radius:20px;font-size:11px">⏳ Kutilmoqda</span>`;
  if (isApproved) statusBadge = `<span style="background:rgba(34,197,94,.12);color:#22c55e;border:1px solid rgba(34,197,94,.3);padding:2px 8px;border-radius:20px;font-size:11px">✅ Tasdiqlangan</span>`;
  if (isRejected) statusBadge = `<span style="background:rgba(240,79,79,.12);color:var(--red);border:1px solid rgba(240,79,79,.3);padding:2px 8px;border-radius:20px;font-size:11px">❌ Rad etildi</span>`;

  const borderColor = isRejected ? 'rgba(240,79,79,.4)' : isPending ? 'rgba(245,158,11,.4)' : 'var(--border)';

  return `
    <div style="background:var(--bg3);border:1px solid ${borderColor};border-radius:10px;padding:1rem;margin-bottom:.75rem">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px">
        <div>
          <span style="font-weight:700;font-family:var(--mono)">${r.bolim}</span>
          <span style="margin:0 6px;color:var(--text3)">|</span>
          <span style="font-size:12px;color:var(--text2)">${r.sana || ''} &nbsp; ${r.smena} smena</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          ${statusBadge}
          <span style="background:rgba(240,79,79,.15);color:var(--red);border:1px solid rgba(240,79,79,.3);padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;font-family:var(--mono)">${r.davomiylik} daq</span>
        </div>
      </div>

      <div style="margin-top:.5rem;font-size:12px;color:var(--text2)">⏰ ${r.vaqtDan || ''} — ${r.vaqtGacha || ''}</div>
      <div style="margin-top:.3rem;font-size:12px;color:var(--text2)">👤 Kiritgan: <b>${r.kiritganNom || r.kiritgan}</b></div>
      <div style="margin-top:.4rem;font-size:12px">📋 ${sababNom}${r.boshqaSabab && r.sabab==='LS6' ? ': '+r.boshqaSabab : ''}</div>
      ${r.izoh ? `<div style="margin-top:.4rem;font-size:11px;color:var(--text2)">💬 ${r.izoh}</div>` : ''}
      ${r.radSababi ? `
        <div style="margin-top:.4rem;font-size:11px;color:var(--red)">❌ Rad sababi: ${r.radSababi}</div>
      ` : ''}
      ${r.tasdiqlaganNom ? `
        <div style="margin-top:.4rem;font-size:11px;color:#22c55e">✅ Tasdiqlagan: ${r.tasdiqlaganNom}</div>
      ` : ''}

      ${r.rasmlar && r.rasmlar.length > 0 ? `
        <div style="margin-top:.6rem">
          <div style="font-size:11px;color:var(--text2);margin-bottom:4px">📎 Rasmlar (${r.rasmlar.length} ta):</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${r.rasmlar.map(img => `<img src="${img}" onclick="openImageModal('${img}')" style="width:80px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid var(--border);transition:.2s" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'">`).join('')}
          </div>
        </div>
      ` : ''}

      ${isPending ? `
        <div style="display:flex;gap:8px;margin-top:.75rem">
          <button class="btn primary sm" style="flex:1" onclick="confirmApproveLineStop('${r.id}')">✅ Tasdiqlash</button>
          <button class="btn sm" style="flex:1;color:var(--red);border-color:var(--red)" onclick="openRejectModal('${r.id}')">❌ Rad etish</button>
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================
// RAD ETISH MODALI
// ============================================================
function openRejectModal(id) {
  const existing = document.getElementById('ls-reject-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'ls-reject-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem';

  modal.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;width:100%;max-width:420px;padding:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h3 style="font-size:15px;font-weight:700;color:var(--red)">❌ Rad etish</h3>
        <button onclick="document.getElementById('ls-reject-modal').remove()" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">×</button>
      </div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:1rem">Rad etish sababini kiriting. Bu sabab kirituvchiga ko'rinadi.</div>
      <textarea id="ls-rad-sababi" placeholder="Rad etish sababi..." style="width:100%;height:80px;resize:vertical;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-family:var(--font);font-size:13px"></textarea>
      <div style="display:flex;gap:8px;margin-top:1rem">
        <button class="btn ghost" onclick="document.getElementById('ls-reject-modal').remove()" style="flex:1">Bekor</button>
        <button class="btn sm" style="flex:2;background:var(--red);color:white;border-color:var(--red)" onclick="confirmRejectLineStop('${id}')">❌ Rad etishni tasdiqlash</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById('ls-rad-sababi').focus();
}

async function confirmRejectLineStop(id) {
  const sabab = document.getElementById('ls-rad-sababi')?.value?.trim();
  if (!sabab) {
    showToast("Rad etish sababini kiriting!", 'err');
    return;
  }
  try {
    showToast('Rad etilmoqda...', 'warn');
    await rejectLineStop(id, sabab);
    document.getElementById('ls-reject-modal')?.remove();
    showToast('❌ Rad etildi', 'ok');
    renderLineStopPage();
  } catch(e) {
    showToast('Xatolik yuz berdi!', 'err');
  }
}

async function confirmApproveLineStop(id) {
  if (!confirm("Bu yozuvni tasdiqlaysizmi?")) return;
  try {
    showToast('Tasdiqlanmoqda...', 'warn');
    await approveLineStop(id);
    showToast('✅ Tasdiqlandi!', 'ok');
    renderLineStopPage();
  } catch(e) {
    showToast('Xatolik yuz berdi!', 'err');
  }
}

// ============================================================
// KIRITISH / TAHRIRLASH MODALI
// ============================================================
let lsSelectedImages = [];
let lsEditingId = null;

function openLineStopModal(editId = null) {
  lsSelectedImages = [];
  lsEditingId = editId;
  const userBolimlar = getLineStopUserBolimlar();
  const today = todayStr();

  const modal = document.createElement('div');
  modal.id = 'ls-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:2000;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:1rem';

  modal.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;width:100%;max-width:480px;padding:1.5rem;margin:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <h3 style="font-size:15px;font-weight:700">${editId ? "✏️ Tahrirlash" : "Yangi to'xtalish"}</h3>
        <button onclick="closeLineStopModal()" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">×</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:1rem">
        <div class="form-group">
          <label style="font-size:12px;color:var(--text2);margin-bottom:4px;display:block">Bo'lim / Smena</label>
          <select id="ls-bolim" style="width:100%">
            ${userBolimlar.map(b => `<option value="${b}">${b.replace('_', ' / ')} smena</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label style="font-size:12px;color:var(--text2);margin-bottom:4px;display:block">Sana</label>
          <input type="date" id="ls-sana" value="${today}" max="${today}" style="width:100%">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div class="form-group">
            <label style="font-size:12px;color:var(--text2);margin-bottom:4px;display:block">Vaqt (dan)</label>
            <input type="time" id="ls-vaqt-dan" style="width:100%">
          </div>
          <div class="form-group">
            <label style="font-size:12px;color:var(--text2);margin-bottom:4px;display:block">Vaqt (gacha)</label>
            <input type="time" id="ls-vaqt-gacha" style="width:100%" oninput="calcLsDavomiylik()">
          </div>
        </div>

        <div class="form-group">
          <label style="font-size:12px;color:var(--text2);margin-bottom:4px;display:block">Davomiylik (daqiqa)</label>
          <input type="number" id="ls-davomiylik" placeholder="Avtomatik hisoblanadi" style="width:100%" min="1">
        </div>

        <div class="form-group">
          <label style="font-size:12px;color:var(--text2);margin-bottom:4px;display:block">Sabab</label>
          <select id="ls-sabab" style="width:100%" onchange="toggleLsBoshqaSabab()">
            ${LINE_STOP_SABABLAR.map(s => `<option value="${s.kod}">${s.nom}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" id="ls-boshqa-wrap" style="display:none">
          <label style="font-size:12px;color:var(--text2);margin-bottom:4px;display:block">Boshqa sabab (kiriting)</label>
          <input type="text" id="ls-boshqa-sabab" placeholder="Sababni kiriting..." style="width:100%">
        </div>

        <div class="form-group">
          <label style="font-size:12px;color:var(--text2);margin-bottom:4px;display:block">Izoh (ixtiyoriy)</label>
          <textarea id="ls-izoh" placeholder="Qo'shimcha ma'lumot..." style="width:100%;height:60px;resize:vertical;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-family:var(--font)"></textarea>
        </div>

        <div class="form-group">
          <label style="font-size:12px;color:var(--text2);margin-bottom:4px;display:block">Rasmlar (PPSR, Tushuntirish xati) — max 4 ta</label>
          <input type="file" id="ls-rasmlar" accept="image/*" multiple onchange="handleLsImages(this)" style="display:none">
          <button class="btn sm" onclick="document.getElementById('ls-rasmlar').click()">📎 Rasm yuklash</button>
          <div id="ls-rasm-preview" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-top:1.5rem">
        <button class="btn ghost" onclick="closeLineStopModal()" style="flex:1">Bekor</button>
        <button class="btn primary" onclick="saveLineStopRecord()" style="flex:2">${editId ? '✓ Qayta yuborish' : '✓ Saqlash'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Tahrirlash rejimida mavjud ma'lumotlarni yuklash
  if (editId) {
    firebase.database().ref('davomat/line_stop/' + editId).once('value', snap => {
      const r = snap.val();
      if (!r) return;
      const bolimSmena = r.bolimSmena || (r.bolim + '_' + r.smena);
      const bolimSel = document.getElementById('ls-bolim');
      if (bolimSel) bolimSel.value = bolimSmena;
      const sanaSel = document.getElementById('ls-sana');
      if (sanaSel) sanaSel.value = r.sana || '';
      const danSel = document.getElementById('ls-vaqt-dan');
      if (danSel) danSel.value = r.vaqtDan || '';
      const gachaSel = document.getElementById('ls-vaqt-gacha');
      if (gachaSel) gachaSel.value = r.vaqtGacha || '';
      const davSel = document.getElementById('ls-davomiylik');
      if (davSel) davSel.value = r.davomiylik || '';
      const sababSel = document.getElementById('ls-sabab');
      if (sababSel) { sababSel.value = r.sabab || 'LS1'; toggleLsBoshqaSabab(); }
      const boshqaSel = document.getElementById('ls-boshqa-sabab');
      if (boshqaSel) boshqaSel.value = r.boshqaSabab || '';
      const izohSel = document.getElementById('ls-izoh');
      if (izohSel) izohSel.value = r.izoh || '';
      if (r.rasmlar && r.rasmlar.length > 0) {
        lsSelectedImages = [...r.rasmlar];
        renderLsImagePreview();
      }
    });
  }
}

function closeLineStopModal() {
  document.getElementById('ls-modal')?.remove();
  lsSelectedImages = [];
  lsEditingId = null;
}

function calcLsDavomiylik() {
  const dan   = document.getElementById('ls-vaqt-dan')?.value;
  const gacha = document.getElementById('ls-vaqt-gacha')?.value;
  if (!dan || !gacha) return;
  const [dh, dm] = dan.split(':').map(Number);
  const [gh, gm] = gacha.split(':').map(Number);
  let diff = (gh * 60 + gm) - (dh * 60 + dm);
  if (diff < 0) diff += 24 * 60;
  if (diff > 0) document.getElementById('ls-davomiylik').value = diff;
}

function toggleLsBoshqaSabab() {
  const sabab = document.getElementById('ls-sabab')?.value;
  const wrap  = document.getElementById('ls-boshqa-wrap');
  if (wrap) wrap.style.display = sabab === 'LS6' ? 'block' : 'none';
}

async function handleLsImages(input) {
  const files = Array.from(input.files).slice(0, 4 - lsSelectedImages.length);
  for (const file of files) {
    if (lsSelectedImages.length >= 4) break;
    const base64 = await readImageAsBase64(file);
    lsSelectedImages.push(base64);
  }
  renderLsImagePreview();
  input.value = '';
}

function renderLsImagePreview() {
  const preview = document.getElementById('ls-rasm-preview');
  if (!preview) return;
  preview.innerHTML = lsSelectedImages.map((img, i) => `
    <div style="position:relative">
      <img src="${img}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;border:1px solid var(--border)">
      <button onclick="removeLsImage(${i})" style="position:absolute;top:-6px;right:-6px;background:var(--red);border:none;color:white;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
    </div>
  `).join('');
}

function removeLsImage(idx) {
  lsSelectedImages.splice(idx, 1);
  renderLsImagePreview();
}

async function saveLineStopRecord() {
  const bolim       = document.getElementById('ls-bolim')?.value;
  const sana        = document.getElementById('ls-sana')?.value;
  const vaqtDan     = document.getElementById('ls-vaqt-dan')?.value;
  const vaqtGacha   = document.getElementById('ls-vaqt-gacha')?.value;
  const davomiylik  = document.getElementById('ls-davomiylik')?.value;
  const sabab       = document.getElementById('ls-sabab')?.value;
  const boshqaSabab = document.getElementById('ls-boshqa-sabab')?.value?.trim();
  const izoh        = document.getElementById('ls-izoh')?.value?.trim();

  if (!bolim || !sana || !vaqtDan || !vaqtGacha || !davomiylik) {
    showToast("Barcha maydonlarni to'ldiring!", 'err');
    return;
  }
  if (sabab === 'LS6' && !boshqaSabab) {
    showToast("Boshqa sabab matnini kiriting!", 'err');
    return;
  }

  const parts   = bolim.split('_');
  const bolimId = parts[0];
  const smena   = parts[1];

  const data = {
    bolim: bolimId,
    smena: smena,
    bolimSmena: bolim,
    sana,
    vaqtDan,
    vaqtGacha,
    davomiylik: parseInt(davomiylik),
    sabab,
    boshqaSabab: sabab === 'LS6' ? boshqaSabab : '',
    izoh,
    rasmlar: lsSelectedImages,
  };

  try {
    showToast('Saqlanmoqda...', 'warn');
    if (lsEditingId) {
      await updateLineStop(lsEditingId, data);
      showToast('✓ Tahrirlandi va qayta yuborildi!', 'ok');
    } else {
      await saveLineStop(data);
      showToast('✓ Saqlandi! Tasdiqlash kutilmoqda.', 'ok');
    }
    closeLineStopModal();
    renderLineStopPage();
  } catch(e) {
    showToast('Xatolik yuz berdi!', 'err');
  }
}

// ============================================================
// KO'RUVCHI SAHIFASI (admin, vadmin1) — faqat tasdiqlangan
// ============================================================
let lsFilter = {
  muddat: 'kunlik',
  bolim: '',
  smena: '',
  customStart: '',
  customEnd: '',
};

async function renderLineStopViewerPage(content) {
  const lsData = await getLineStoplar();
  const allRecords = Object.values(lsData).filter(r => r && r.status === 'approved');

  const today = todayStr();
  const now   = new Date();
  let start, end;

  if (lsFilter.muddat === 'kunlik') { start = end = today; }
  else if (lsFilter.muddat === 'haftalik') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    start = d.toISOString().split('T')[0];
    end = today;
  } else if (lsFilter.muddat === 'oylik') {
    start = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
    end = today;
  } else if (lsFilter.muddat === 'choraklik') {
    const q = Math.floor(now.getMonth() / 3);
    start = now.getFullYear() + '-' + String(q * 3 + 1).padStart(2, '0') + '-01';
    end = today;
  } else if (lsFilter.muddat === 'yillik') {
    start = now.getFullYear() + '-01-01';
    end = today;
  } else if (lsFilter.muddat === 'custom') {
    start = lsFilter.customStart || today;
    end   = lsFilter.customEnd   || today;
  }

  let filtered = allRecords.filter(r => {
    if (r.sana < start || r.sana > end) return false;
    if (lsFilter.bolim && r.bolim !== lsFilter.bolim) return false;
    if (lsFilter.smena && r.smena !== lsFilter.smena) return false;
    return true;
  }).sort((a, b) => b.sana.localeCompare(a.sana) || b.kiritilganVaqt.localeCompare(a.kiritilganVaqt));

  const totalDaq  = filtered.reduce((s, r) => s + (r.davomiylik || 0), 0);
  const totalSoat = Math.floor(totalDaq / 60);
  const totalMin  = totalDaq % 60;

  const bolimStats = {};
  filtered.forEach(r => {
    const key = r.bolim + '_' + r.smena;
    if (!bolimStats[key]) bolimStats[key] = { bolim: r.bolim, smena: r.smena, count: 0, daq: 0 };
    bolimStats[key].count++;
    bolimStats[key].daq += r.davomiylik || 0;
  });

  let html = `
    <div style="margin-bottom:1.5rem">
      <h3 style="font-size:15px;font-weight:600;margin-bottom:1rem">Line Stop Hisoboti</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem;align-items:center">
        <select onchange="lsFilter.muddat=this.value;renderLineStopPage()" style="max-width:140px">
          <option value="kunlik"    ${lsFilter.muddat==='kunlik'   ?'selected':''}>Kunlik</option>
          <option value="haftalik"  ${lsFilter.muddat==='haftalik' ?'selected':''}>Haftalik</option>
          <option value="oylik"     ${lsFilter.muddat==='oylik'    ?'selected':''}>Oylik</option>
          <option value="choraklik" ${lsFilter.muddat==='choraklik'?'selected':''}>Choraklik</option>
          <option value="yillik"    ${lsFilter.muddat==='yillik'   ?'selected':''}>Yillik</option>
          <option value="custom"    ${lsFilter.muddat==='custom'   ?'selected':''}>O'z muddati</option>
        </select>
        ${lsFilter.muddat === 'custom' ? `
          <input type="date" value="${lsFilter.customStart}" onchange="lsFilter.customStart=this.value;renderLineStopPage()" style="max-width:140px">
          <span style="color:var(--text3)">—</span>
          <input type="date" value="${lsFilter.customEnd}" onchange="lsFilter.customEnd=this.value;renderLineStopPage()" style="max-width:140px">
        ` : ''}
        <select onchange="lsFilter.bolim=this.value;lsFilter.smena='';renderLineStopPage()" style="max-width:120px">
          <option value="">Barcha bo'lim</option>
          ${LINE_STOP_BOLIMLAR.map(b => `<option value="${b}" ${lsFilter.bolim===b?'selected':''}>${b}</option>`).join('')}
        </select>
        ${lsFilter.bolim ? `
          <select onchange="lsFilter.smena=this.value;renderLineStopPage()" style="max-width:100px">
            <option value="">Barcha smena</option>
            ${(DB.bolimlar.find(b=>b.id===lsFilter.bolim)?.smenalar||[]).map(s=>`<option value="${s}" ${lsFilter.smena===s?'selected':''}>${s}</option>`).join('')}
          </select>
        ` : ''}
        <span style="font-size:11px;color:var(--text2);margin-left:auto">${start} — ${end}</span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:1.5rem">
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:1rem">
        <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:.4rem">Jami to'xtalish</div>
        <div style="font-size:28px;font-weight:700;font-family:var(--mono);color:var(--red)">${filtered.length}</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:1rem">
        <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:.4rem">Jami vaqt</div>
        <div style="font-size:28px;font-weight:700;font-family:var(--mono);color:var(--amber)">${totalSoat}s ${totalMin}d</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:1rem">
        <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:.4rem">Jami daqiqa</div>
        <div style="font-size:28px;font-weight:700;font-family:var(--mono)">${totalDaq}</div>
      </div>
    </div>

    ${Object.keys(bolimStats).length > 0 ? `
    <div class="card" style="margin-bottom:1rem">
      <div class="card-title">Bo'lim / Smena bo'yicha</div>
      <div class="tbl-wrap"><table>
        <thead><tr>
          <th>Bo'lim</th><th>Smena</th>
          <th style="color:var(--red)">To'xtalish</th>
          <th style="color:var(--amber)">Daqiqa</th>
          <th style="color:var(--amber)">Soat</th>
        </tr></thead>
        <tbody>
          ${Object.values(bolimStats).sort((a,b)=>b.daq-a.daq).map(s=>`
            <tr>
              <td style="font-weight:600">${s.bolim}</td>
              <td style="font-family:var(--mono)">${s.smena}</td>
              <td style="text-align:center;font-weight:700;font-family:var(--mono);color:var(--red)">${s.count}</td>
              <td style="text-align:center;font-weight:700;font-family:var(--mono);color:var(--amber)">${s.daq}</td>
              <td style="text-align:center;font-family:var(--mono);color:var(--text2)">${Math.floor(s.daq/60)}s ${s.daq%60}d</td>
            </tr>
          `).join('')}
        </tbody>
      </table></div>
    </div>
    ` : ''}

    <div class="card">
      <div class="card-title">Barcha yozuvlar (${filtered.length})</div>
      ${filtered.length === 0
        ? '<div style="text-align:center;padding:1.5rem;color:var(--text3)">Bu davrda to\'xtalish qayd etilmagan</div>'
        : filtered.map(r => renderLineStopViewerCard(r)).join('')}
    </div>
  `;

  content.innerHTML = html;
}

function renderLineStopViewerCard(r) {
  const sababNom = LINE_STOP_SABABLAR.find(s => s.kod === r.sabab)?.nom || r.sabab || '?';
  return `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:1rem;margin-bottom:.75rem">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px">
        <div>
          <span style="font-weight:700;font-family:var(--mono)">${r.bolim}</span>
          <span style="margin:0 6px;color:var(--text3)">|</span>
          <span style="font-size:12px;color:var(--text2)">${r.sana || ''} &nbsp; ${r.smena} smena</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <span style="background:rgba(240,79,79,.15);color:var(--red);border:1px solid rgba(240,79,79,.3);padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;font-family:var(--mono)">${r.davomiylik} daq</span>
          ${isLineStopAdmin() ? `<button class="btn sm" style="color:var(--red);border-color:var(--red)" onclick="deleteLineStopRecord('${r.id}')">🗑</button>` : ''}
        </div>
      </div>
      <div style="margin-top:.5rem;font-size:12px;color:var(--text2)">⏰ ${r.vaqtDan || ''} — ${r.vaqtGacha || ''} &nbsp;·&nbsp; 👤 ${r.kiritganNom || ''}</div>
      <div style="margin-top:.4rem;font-size:12px">📋 ${sababNom}${r.boshqaSabab && r.sabab==='LS6' ? ': '+r.boshqaSabab : ''}</div>
      ${r.izoh ? `<div style="margin-top:.4rem;font-size:11px;color:var(--text2)">💬 ${r.izoh}</div>` : ''}
      ${r.tasdiqlaganNom ? `<div style="margin-top:.3rem;font-size:11px;color:#22c55e">✅ ${r.tasdiqlaganNom}</div>` : ''}
      ${r.rasmlar && r.rasmlar.length > 0 ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:.5rem">
          ${r.rasmlar.map(img => `<img src="${img}" onclick="openImageModal('${img}')" style="width:60px;height:60px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid var(--border)">`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================
// RASM MODAL
// ============================================================
function openImageModal(src) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:3000;display:flex;align-items:center;justify-content:center;cursor:pointer';
  modal.onclick = () => modal.remove();
  modal.innerHTML = `<img src="${src}" style="max-width:95vw;max-height:95vh;object-fit:contain;border-radius:8px">`;
  document.body.appendChild(modal);
}
