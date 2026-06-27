// ============================================================
// REYTING MODULI — Ish kuni yo'qotilishi
// ============================================================

const YOQOTISH_SABABLAR = ['BS','B','P','A/ART','AP/APT','AS/AST','?'];
const YOQOTISH_SOAT = 11;

// Bir yozuv uchun yo'qotish hisobi
function calcYoqotish(att) {
  if(!att) return {soat:0, kun:0, tip:null};

  // Kelmaganlik — 11 soat
  if(att.holat==='yoq' && YOQOTISH_SABABLAR.includes(att.sabab)) {
    return {soat:YOQOTISH_SOAT, kun:1, tip:att.sabab};
  }

  // Kech kelish — soat hisobi
  if(att.holat==='kech' && att.kechVaqt) {
    const soat = parseKechSoat(att.kechVaqt);
    if(soat > 0) return {soat: Math.round(soat*100)/100, kun:0, tip:'KECH'};
  }

  // Erta ketish — soat hisobi
  if(att.holat==='erta' && att.ertaVaqt) {
    const soat = parseErtaSoat(att.ertaVaqt);
    if(soat > 0) return {soat: Math.round(soat*100)/100, kun:0, tip:'ERTA'};
  }

  return {soat:0, kun:0, tip:null};
}

function parseKechSoat(vaqt) {
  if(!vaqt || !vaqt.includes(':')) return 0;
  const [h,m] = vaqt.split(':').map(Number);
  const kelgan = h*60+m;
  const boshlash = 8*60; // 08:00
  const diff = kelgan - boshlash;
  return diff > 0 ? Math.round(diff/60*100)/100 : 0;
}

function parseErtaSoat(vaqt) {
  if(!vaqt || !vaqt.includes(':')) return 0;
  const [h,m] = vaqt.split(':').map(Number);
  const ketgan = h*60+m;
  const tugash = 20*60; // 20:00
  const diff = tugash - ketgan;
  return diff > 0 ? Math.round(diff/60*100)/100 : 0;
}

// Muddat bo'yicha sanalar ro'yxati
function getDateRange(tip, customStart, customEnd) {
  const now = new Date();
  const today = todayStr();
  let start, end;

  if(tip === 'kunlik') {
    start = end = today;
  } else if(tip === 'haftalik') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    start = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    end = today;
  } else if(tip === 'oylik') {
    start = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';
    end = today;
  } else if(tip === 'yillik') {
    start = now.getFullYear()+'-01-01';
    end = today;
  } else if(tip === 'custom') {
    start = customStart || today;
    end = customEnd || today;
  } else {
    start = end = today;
  }

  const days = [];
  const s = new Date(start+'T12:00:00');
  const e = new Date(end+'T12:00:00');
  while(s <= e) {
    days.push(s.getFullYear()+'-'+String(s.getMonth()+1).padStart(2,'0')+'-'+String(s.getDate()).padStart(2,'0'));
    s.setDate(s.getDate()+1);
  }
  return {days, start, end};
}

// Barcha davomat ma'lumotlaridan xodim yo'qotishlarini yig'ish
function calcReyting(bolimFilter, smenaFilter, days) {
  // Xodimlarni aniqlash
  const emps = bolimFilter
    ? DB.xodimlar.filter(e => e.bolim===bolimFilter && (!smenaFilter||e.smena===smenaFilter))
    : (typeof getFilteredXodimlar==='function' ? getFilteredXodimlar() : DB.xodimlar);

  const empMap = {};
  for(const e of emps) {
    empMap[e.id] = {
      emp: e,
      totalSoat: 0,
      totalKun: 0,
      sababMap: {},
      details: []
    };
  }

  // Barcha kun va smenalarni ko'rib chiqish
  for(const day of days) {
    for(const b of DB.bolimlar) {
      if(bolimFilter && b.id !== bolimFilter) continue;
      for(const s of b.smenalar) {
        if(smenaFilter && s !== smenaFilter) continue;
        const dav = getDavomat(day, b.id, s);
        if(!dav) continue;

        for(const e of emps) {
          if(e.bolim !== b.id || e.smena !== s) continue;
          if(!empMap[e.id]) continue;

          const att = dav.attendance[e.id];
          const y = calcYoqotish(att);

          if(y.soat > 0) {
            empMap[e.id].totalSoat += y.soat;
            empMap[e.id].totalKun += y.kun;
            empMap[e.id].sababMap[y.tip] = (empMap[e.id].sababMap[y.tip]||0) + 1;
            empMap[e.id].details.push({date:day, bolim:b.id, smena:s, soat:y.soat, kun:y.kun, tip:y.tip});
          }
        }
      }
    }
  }

  // Natijani saralash
  const result = Object.values(empMap)
    .filter(r => r.totalSoat > 0 || r.totalKun > 0)
    .map(r => ({
      ...r,
      totalSoat: Math.round(r.totalSoat*100)/100,
      // Jami soatdan kunlarga o'tkazish (11 soat = 1 kun)
      kunHisob: Math.round(r.totalSoat/YOQOTISH_SOAT*100)/100
    }))
    .sort((a,b) => b.totalSoat - a.totalSoat);

  return result;
}

// Grafik PNG yuklab olish
function downloadGrafikAsPNG(oyKey) {
  if(!document.getElementById('grafik-table-print')) {
    renderGrafik(oyKey);
    setTimeout(()=>downloadGrafikAsPNG(oyKey), 600);
    return;
  }
  const el = document.getElementById('grafik-table-print');
  if(!el) { showToast('Grafik topilmadi. Avval grafik sahifasini oching.','err'); return; }

  if(typeof html2canvas === 'undefined') {
    showToast('📸 Yuklanmoqda...','warn');
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    sc.onload = () => doDownloadPNG(el, oyKey);
    sc.onerror = () => showToast('html2canvas yuklanmadi. Internet aloqasini tekshiring.','err');
    document.head.appendChild(sc);
  } else {
    doDownloadPNG(el, oyKey);
  }
}

function doDownloadPNG(el, oyKey) {
  const MN=['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const pts = oyKey.split('-');
  const label = MN[parseInt(pts[1])]+' '+pts[0];
  showToast('📸 PNG tayyorlanmoqda...','warn');

  html2canvas(el, {
    backgroundColor: '#0f1117',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'ish_grafigi_'+oyKey+'.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Grafik yuklandi: '+label,'ok');
  }).catch(err => {
    console.error(err);
    showToast("PNG yuklab bo'lmadi.",'err');
  });
}
