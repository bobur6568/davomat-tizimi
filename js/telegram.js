// ============================================================
// TELEGRAM MINI APP INTEGRATSIYA
// ============================================================

const TG = window.Telegram?.WebApp;
const isTelegramApp = !!(TG && TG.initData && TG.initData.length > 0);

// initData dan user ID ni parse qilish
function parseTgUserId() {
  try {
    if(TG?.initDataUnsafe?.user?.id) return String(TG.initDataUnsafe.user.id);
    if(!TG || !TG.initData) return null;
    const params = new URLSearchParams(TG.initData);
    const userStr = params.get('user');
    if(!userStr) return null;
    const user = JSON.parse(decodeURIComponent(userStr));
    return user?.id ? String(user.id) : null;
  } catch(e) { return null; }
}

function initTelegramApp() {
  if(!isTelegramApp) return;
  TG.expand();
  TG.ready();
  TG.BackButton.onClick(handleTelegramBack);
}

function applyTelegramTheme() {}

let backButtonStack = [];
function pushBackStack(fn) { backButtonStack.push(fn); if(isTelegramApp) TG.BackButton.show(); }
function popBackStack() { backButtonStack.pop(); if(backButtonStack.length===0&&isTelegramApp) TG.BackButton.hide(); }
function handleTelegramBack() { if(backButtonStack.length>0) backButtonStack[backButtonStack.length-1](); }

function tryTelegramAutoLogin() {
  if(currentUser) return true;
  const tgId = parseTgUserId();
  if(!tgId) return false;

  // DB.users dan qidirish
  if(DB && DB.users && DB.users.length > 0) {
    const user = DB.users.find(u => u.telegram_id === tgId);
    if(user) {
      currentUser = user;
      Storage.saveSession(user);
      const ls = document.getElementById('login-screen');
      if(ls) ls.style.display = 'none';
      bootApp();
      return true;
    }
  }

  // Firebase dan yuklash
  if(typeof FirebaseStorage !== 'undefined') {
    FirebaseStorage.load().then(data => {
      if(!data || !data.users) return;
      const user = data.users.find(u => u.telegram_id === tgId);
      if(user && !currentUser) {
        if(data) Storage._applyData(data);
        currentUser = user;
        Storage.saveSession(user);
        const ls = document.getElementById('login-screen');
        if(ls) ls.style.display = 'none';
        bootApp();
      }
    });
  }
  return false;
}

function retryTelegramAutoLogin() {
  if(currentUser) return;
  tryTelegramAutoLogin();
}

function getRoleLabel(role) {
  const l = {'admin':"To'liq Admin",'admin2':'Hisobot Admin','supervisor':'Nazorat','mas_ul':"Mas'ul xodim"};
  return l[role] || role;
}

function showTelegramLinkHint(tgUser) {}
function tgHaptic(type='light') { try { if(isTelegramApp) TG.HapticFeedback.impactOccurred(type); } catch(e){} }
function tgHapticNotif(type='success') { try { if(isTelegramApp) TG.HapticFeedback.notificationOccurred(type); } catch(e){} }
function showTgMainBtn(text,color,cb) { if(!isTelegramApp) return; TG.MainButton.setText(text); TG.MainButton.color=color||'#00c98d'; TG.MainButton.textColor='#000000'; TG.MainButton.onClick(cb); TG.MainButton.show(); }
function hideTgMainBtn() { if(!isTelegramApp) return; TG.MainButton.hide(); TG.MainButton.offClick(); }
async function sendBotNotification(type,data) {}
function notifyDavomatSaved(davData) {}

document.addEventListener('DOMContentLoaded', () => { initTelegramApp(); });
