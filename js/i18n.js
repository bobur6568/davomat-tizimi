// ============================================================
// I18N - Ko'p tillilik (O'zbek va Rus)
// ============================================================
const TRANSLATIONS = {
  uz: {
    // Login
    appTitle: "Davomat Tizimi",
    appSubtitle: "Ishlab chiqarish davomati boshqaruvi",
    login: "Login",
    password: "Parol",
    enterBtn: "Kirish →",
    loginErr: "Login yoki parol xato!",
    adminHint: "Admin",
    masUlHint: "Mas'ul",
    // Topbar
    logout: "Chiqish",
    // Sidebar
    davomat: "Davomat Kiritish",
    jamlanma: "Jamlanma",
    smenaXisobot: "08:36 Xisoboti",
    hisobot: "Hisobotlar",
    reyting: "Reyting",
    grafik: "Ish Grafigi",
    xodimlar: "Xodimlar",
    bolimlar: "Ish Joylari",
    foydalanuvchilar: "Foydalanuvchilar",
    // Davomat
    davomatKiritish: "Davomat Kiritish",
    sanaTanlang: "Sanani tanlang",
    ishJoyiTanlang: "Ish joyini tanlang",
    smenaTanlang: "Smenani tanlang",
    davomEtish: "Davom etish →",
    saqlash: "✓ Saqlash",
    orqaga: "← Orqaga",
    keldi: "Keldi",
    kelmadi: "Kelmadi",
    kechikdi: "Kechikdi",
    ertaKetdi: "Erta ketdi",
    boshOrin: "Bo'sh o'rin",
    yordamchi: "Yordamchi",
    xodimlarRoyxati: "Xodimlar ro'yxati",
    boshIshOrinlari: "Bo'sh ish o'rinlari",
    yordamgaChiqqan: "Yordamga chiqqan xodimlar",
    tabelRaqami: "Tabel raqami",
    qoshish: "Qo'shish",
    // Hisobot
    kunlik: "Kunlik",
    haftalik: "Haftalik",
    oylik: "Oylik",
    choraklik: "Choraklik",
    yillik: "Yillik",
    // Jamlanma
    bugungiJamlanma: "Bugungi Jamlanma",
    // Grafik
    ishGrafigi: "Ish Grafigi",
    grafikTuzish: "Grafik tuzish",
    tahrirlash: "Tahrirlash",
    pngYuklash: "📸 PNG yuklab olish",
    kunduzi: "Kunduzi",
    tungi: "Tungi",
    dam: "Dam olish",
    saqlandi: "Saqlandi!",
    bekor: "Bekor",
    // Common
    jami: "Jami",
    yangilash: "🔄 Yangilash",
    bolimSmena: "Bo'lim / Smena",
    kiritilgan: "Kiritilgan",
    kutilmoqda: "Kutilmoqda",
    tahrirMuddat: "Tahrirlash muddati tugadi!",
    // Reyting  
    reyting: "Reyting",
    yoqotilganKun: "Yo'qotilgan kun",
    yoqotilganSoat: "Yo'qotilgan soat",
    muddat: "Muddat",
    // Errors
    vaqtEmas: "Davomat kiritish vaqti emas!",
    grafiqYoq: "Grafik topilmadi",
    xatolik: "Xatolik yuz berdi",
  },
  ru: {
    // Login
    appTitle: "Система Посещаемости",
    appSubtitle: "Управление производственной посещаемостью",
    login: "Логин",
    password: "Пароль",
    enterBtn: "Войти →",
    loginErr: "Неверный логин или пароль!",
    adminHint: "Админ",
    masUlHint: "Ответственный",
    // Topbar
    logout: "Выход",
    // Sidebar
    davomat: "Ввод Посещаемости",
    jamlanma: "Сводка",
    smenaXisobot: "Отчёт 08:36",
    hisobot: "Отчёты",
    reyting: "Рейтинг",
    grafik: "График Работы",
    xodimlar: "Сотрудники",
    bolimlar: "Рабочие места",
    foydalanuvchilar: "Пользователи",
    // Davomat
    davomatKiritish: "Ввод Посещаемости",
    sanaTanlang: "Выберите дату",
    ishJoyiTanlang: "Выберите рабочее место",
    smenaTanlang: "Выберите смену",
    davomEtish: "Продолжить →",
    saqlash: "✓ Сохранить",
    orqaga: "← Назад",
    keldi: "Пришёл",
    kelmadi: "Не пришёл",
    kechikdi: "Опоздал",
    ertaKetdi: "Ушёл раньше",
    boshOrin: "Вакантное место",
    yordamchi: "Помощник",
    xodimlarRoyxati: "Список сотрудников",
    boshIshOrinlari: "Вакантные места",
    yordamgaChiqqan: "Вышедшие на помощь",
    tabelRaqami: "Табельный номер",
    qoshish: "Добавить",
    // Hisobot
    kunlik: "Суточный",
    haftalik: "Недельный",
    oylik: "Месячный",
    choraklik: "Квартальный",
    yillik: "Годовой",
    // Jamlanma
    bugungiJamlanma: "Сводка за сегодня",
    // Grafik
    ishGrafigi: "График Работы",
    grafikTuzish: "Составить график",
    tahrirlash: "Редактировать",
    pngYuklash: "📸 Скачать PNG",
    kunduzi: "Дневная",
    tungi: "Ночная",
    dam: "Выходной",
    saqlandi: "Сохранено!",
    bekor: "Отмена",
    // Common
    jami: "Итого",
    yangilash: "🔄 Обновить",
    bolimSmena: "Участок / Смена",
    kiritilgan: "Введено",
    kutilmoqda: "Ожидается",
    tahrirMuddat: "Время редактирования истекло!",
    // Reyting
    reyting: "Рейтинг",
    yoqotilganKun: "Потеряно дней",
    yoqotilganSoat: "Потеряно часов",
    muddat: "Период",
    // Errors
    vaqtEmas: "Не время для ввода посещаемости!",
    grafiqYoq: "График не найден",
    xatolik: "Произошла ошибка",
  }
};

let currentLang = localStorage.getItem('davomat_lang') || 'uz';

function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS['uz'])[key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('davomat_lang', lang);
}
