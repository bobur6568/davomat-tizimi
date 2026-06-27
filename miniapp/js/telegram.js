window.addEventListener('load', () => { alert('telegram.js ishladi! TG: ' + (window.Telegram ? 'bor' : 'yoq')); });
// ============================================================
// TELEGRAM MINI APP INTEGRATSIYA
// ============================================================

const TG = window.Telegram?.WebApp;
const isTelegramApp = !!(TG && TG.initData && TG.initData.length > 0);

// initData dan user ID ni parse qilish
function parseTgUserId() {
  try {
    if(!TG || !TG.initData) return null;
    const params = new URLSearchParams(TG.initData);
    const userStr = params.get('user');
    if(!userStr) return null;
    const user = JSON.parse(decodeURIComponent(userStr));
    return user?.id ? String(user.id) : null;
  } catch(e) { return null; }
}
const tgUserId = parseTgUserId() || (TG?.initDataUnsafe?.user?.id ? String(TG.initDataUnsafe.user.id) : null);

// ============================================================
// TELEGRAM INIT
// ============================================================
function initTelegramApp() {
  alert('TG ID: ' + tgUserId + ' | initData: ' + (TG.initData ? TG.initData.substring(0,50) : 'YOQ'));

  // Ilovani to'liq kengaytirish
  TG.expand();
  TG.ready();

  // Telegram ranglarini qo'llash (foydalanuvchi dark/light)
  applyTelegramTheme();

  // Back button sozlash
  TG.BackButton.onClick(handleTelegramBack);

  console.log('[TG] Mini App initialized. User:', TG.initDataUnsafe?.user);
}

// ============================================================
// TELEGRAM TEMA
// ============================================================
function applyTelegramTheme() {
  if (!isTelegramApp) return;
  // Doim dark mode ishlatamiz (ilova dizayni dark)
  document.documentElement.style.setProperty('--bg', '#0f1117');
}

// ============================================================
// BACK BUTTON
// ============================================================
let backButtonStack = [];

function pushBackStack(fn) {
  backButtonStack.push(fn);
  if (isTelegramApp) TG.BackButton.show();
}

function popBackStack() {
  backButtonStack.pop();
  if (backButtonStack.length === 0 && isTelegramApp) {
    TG.BackButton.hide();
  }
}

function handleTelegramBack() {
  if (backButtonStack.length > 0) {
    const fn = backButtonStack[backButtonStack.length - 1];
    fn();
  }
}

// ============================================================
// TELEGRAM USER => AUTO LOGIN
// ============================================================
function tryTelegramAutoLogin() {
  if (!tgUserId) return false;
  if (currentUser) return true;

  const tgId = tgUserId;

  // Avval DB.users dan qidirish
  if(DB && DB.users && DB.users.length > 0) {
    const user = DB.users.find(u => u.telegram_id === tgId);
    if (user) {
      currentUser = user;
      Storage.saveSession(user);
      document.getElementById('login-screen').style.display='none';
      bootApp();
      tgHapticNotif('success');
      return true;
    }
  }

  // Firebase dan to'g'ridan yuklash
  if(typeof FirebaseStorage !== 'undefined') {
    FirebaseStorage.load().then(data => {
      if(!data || !data.users) return;
      const user = data.users.find(u => u.telegram_id === tgId);
      if(user) {
        Storage._applyData(data);
        currentUser = user;
        Storage.saveSession(user);
        document.getElementById('login-screen').style.display='none';
        bootApp();
        tgHapticNotif('success');
      }
    });
  }

  return false;
}
    return true;
  }

  // Telegram orqali kirildi lekin bog'lanmagan
  showTelegramLinkHint(tgUser);
  return false;
}

function getRoleLabel(role) {
  const labels = {
    'admin': "To'liq Admin",
    'admin2': 'Hisobot Admin',
    'supervisor': 'Nazorat',
    'mas_ul': "Mas'ul xodim"
  };
  return labels[role] || role;
}

// Bog'lanmagan foydalanuvchiga hint
function showTelegramLinkHint(tgUser) {
  const hint = document.createElement('div');
  hint.style.cssText = 'position:fixed;top:0;left:0;right:0;background:rgba(245,166,35,.15);border-bottom:1px solid rgba(245,166,35,.3);color:#f5a623;font-size:12px;padding:10px 16px;z-index:1000;text-align:center;';
  hint.innerHTML = `⚠️ Telegram akkauntingiz (@${tgUser.username || tgUser.first_name}) tizimda ro'yxatdan o'tmagan. Admin bilan bog'laning.`;
  document.body.appendChild(hint);
  setTimeout(() => hint.remove(), 8000);
}

// ============================================================
// HAPTIC FEEDBACK
// ============================================================
function tgHaptic(type = 'light') {
  if (!isTelegramApp) return;
  try {
    TG.HapticFeedback.impactOccurred(type); // light, medium, heavy
  } catch(e) {}
}

function tgHapticNotif(type = 'success') {
  if (!isTelegramApp) return;
  try {
    TG.HapticFeedback.notificationOccurred(type); // success, warning, error
  } catch(e) {}
}

// ============================================================
// MAIN BUTTON (pastki tugma)
// ============================================================
function showTgMainBtn(text, color, cb) {
  if (!isTelegramApp) return;
  TG.MainButton.setText(text);
  TG.MainButton.color = color || '#00c98d';
  TG.MainButton.textColor = '#000000';
  TG.MainButton.onClick(cb);
  TG.MainButton.show();
}

function hideTgMainBtn() {
  if (!isTelegramApp) return;
  TG.MainButton.hide();
  TG.MainButton.offClick();
}

// ============================================================
// XABAR YUBORISH (bot orqali)
// ============================================================
async function sendBotNotification(type, data) {
  // BOT_API_URL ni bot/config.js dan oladi
  if (!window.BOT_API_URL) return;
  try {
    await fetch(window.BOT_API_URL + '/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, initData: isTelegramApp ? TG.initData : '' })
    });
  } catch(e) {
    console.warn('[TG] Notification failed:', e);
  }
}

// ============================================================
// DAVOMAT SAQLANGANDA NOTIFICATION
// ============================================================
function notifyDavomatSaved(davData) {
  sendBotNotification('davomat_saved', {
    bolim: davData.bolim,
    smena: davData.smena,
    date: davData.date,
    kiritgan: currentUser?.name,
    stats: davData._stats
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initTelegramApp();
});
