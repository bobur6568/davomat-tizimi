// ============================================================
// ADMIN — MA'LUMOTLARNI TOZALASH PANELI
// Faqat "admin" user ko'ra oladi va ishlatadi
// ============================================================

async function renderAdminResetPanel() {
  // Faqat admin ko'ra oladi
  if (!currentUser || currentUser.id !== 'admin') return;

  const existing = document.getElementById('admin-reset-panel');
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = 'admin-reset-panel';
  panel.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';

  panel.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;width:100%;max-width:440px;padding:1.5rem">

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <h3 style="font-size:15px;font-weight:700;color:var(--red)">⚠️ Ma'lumotlarni tozalash</h3>
        <button onclick="document.getElementById('admin-reset-panel').remove()" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">×</button>
      </div>

      <div style="background:rgba(240,79,79,.08);border:1px solid rgba(240,79,79,.25);border-radius:10px;padding:1rem;margin-bottom:1.5rem;font-size:13px;color:var(--text2);line-height:1.6">
        ⚠️ <b style="color:var(--red)">Diqqat!</b> Bu amal qaytarib bo'lmaydi.<br>
        O'chirilgan ma'lumotlar Firebase dan butunlay o'chadi.
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:1.5rem">

        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:1rem;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;font-weight:600">📋 Davomat ma'lumotlari</div>
            <div style="font-size:11px;color:var(--text2);margin-top:2px">Barcha kunlik davomat yozuvlari</div>
          </div>
          <button class="btn sm" style="color:var(--red);border-color:var(--red);white-space:nowrap" onclick="confirmReset('davomat_only')">
            🗑 O'chirish
          </button>
        </div>

        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:1rem;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;font-weight:600">🛑 Line Stop ma'lumotlari</div>
            <div style="font-size:11px;color:var(--text2);margin-top:2px">Barcha line stop yozuvlari</div>
          </div>
          <button class="btn sm" style="color:var(--red);border-color:var(--red);white-space:nowrap" onclick="confirmReset('linestop_only')">
            🗑 O'chirish
          </button>
        </div>

        <div style="background:rgba(240,79,79,.06);border:1px solid rgba(240,79,79,.3);border-radius:10px;padding:1rem;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--red)">🗑 Ikkalasini ham o'chirish</div>
            <div style="font-size:11px;color:var(--text2);margin-top:2px">Davomat + Line Stop</div>
          </div>
          <button class="btn sm" style="background:var(--red);color:white;border-color:var(--red);white-space:nowrap" onclick="confirmReset('all')">
            🗑 Hammasi
          </button>
        </div>

      </div>

      <button class="btn ghost" onclick="document.getElementById('admin-reset-panel').remove()" style="width:100%">Bekor qilish</button>
    </div>
  `;

  document.body.appendChild(panel);
}

async function confirmReset(tip) {
  let xabar = '';
  if (tip === 'davomat_only') xabar = "Barcha DAVOMAT ma'lumotlari o'chiriladi. Ishonchingiz komilmi?";
  if (tip === 'linestop_only') xabar = "Barcha LINE STOP ma'lumotlari o'chiriladi. Ishonchingiz komilmi?";
  if (tip === 'all') xabar = "DAVOMAT va LINE STOP ma'lumotlarining HAMMASI o'chiriladi. Ishonchingiz komilmi?";

  if (!confirm(xabar)) return;

  // Ikkinchi tasdiqlash
  const kod = prompt("Tasdiqlash uchun 'TOZALA' so'zini kiriting:");
  if (kod !== 'TOZALA') {
    showToast("Bekor qilindi. To'g'ri so'z kiritilmadi.", 'err');
    return;
  }

  try {
    showToast("O'chirilmoqda...", 'warn');

    if (tip === 'davomat_only' || tip === 'all') {
      await firebase.database().ref('davomat/kunlar').remove();
      await firebase.database().ref('davomat/davomat').remove();
    }

    if (tip === 'linestop_only' || tip === 'all') {
      await firebase.database().ref('davomat/line_stop').remove();
    }

    document.getElementById('admin-reset-panel')?.remove();
    showToast("✅ Ma'lumotlar muvaffaqiyatli o'chirildi!", 'ok');

  } catch(e) {
    console.error(e);
    showToast("Xatolik yuz berdi! Firebase ulanishini tekshiring.", 'err');
  }
}
