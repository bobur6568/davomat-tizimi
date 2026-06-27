// ============================================================
// DAVOMAT TIZIMI — DATA v3 (yangilangan xodimlar ro'yhati)
// ============================================================

const DB = {
  users: [
    // ===== BOSH ADMIN =====
    { id: 'admin', login: 'admin', password: 'admin123', role: 'admin', name: 'XAKIMOV BOBUR', bolim: null, smena: null },

    // ===== HISOBOT ADMINLAR =====
    // vadmin1: barcha ko'radi (umumiy)
    { id: 'vadmin1', login: 'vadmin1', password: '1234', role: 'admin2', name: 'ABDURAZAKOV NODIRBEK', bolim: null, smena: null, view_scope: 'all' },

    // vadmin2: UB+PPS1 (ko'k) + Ofis
    // ko'radigan bo'lim/smenalar: UB(A,B,D), PPS1(A,B,D), Ofis(A,B,C,D)
    { id: 'vadmin2', login: 'vadmin2', password: '1234', role: 'admin2', name: 'MIRZA AKBAROV BEXZOD', bolim: null, smena: null,
      view_scope: 'filtered',
      view_bolimlar: [
        {bolim:'UB', smenalar:['A','B','D']},
        {bolim:'PPS1', smenalar:['A','B','D']},
        {bolim:'Ofis', smenalar:['A','B','C','D']},
      ]
    },

    // vadmin3: UA+PPS2+Cleaning+Tarozi (sariq) + Ofis C, Cleaning C
    { id: 'vadmin3', login: 'vadmin3', password: '1234', role: 'admin2', name: 'ABDUMALIKOV ABDULXAMID', bolim: null, smena: null,
      view_scope: 'filtered',
      view_bolimlar: [
        {bolim:'UA', smenalar:['A','B']},
        {bolim:'PPS2', smenalar:['A','B']},
        {bolim:'Cleaning', smenalar:['A','B','C','D']},
        {bolim:'Tarozi', smenalar:['A','B','D']},
        {bolim:'Ofis', smenalar:['C']},
      ]
    },

    // vadmin4-8: supervisor (davomat o'zgartira oladi)
    { id: 'vadmin4', login: 'vadmin4', password: '1234', role: 'supervisor', name: 'AKBAROV ASKARJON',      bolim: null, smena: null, mas_ullar: ['u_ub_a','u_pps1_a','u_cl_a'] },
    { id: 'vadmin5', login: 'vadmin5', password: '1234', role: 'supervisor', name: 'MUXTORALIYEV OBIDJON', bolim: null, smena: null, mas_ullar: ['u_ub_b','u_pps1_b','u_cl_b'] },
    { id: 'vadmin6', login: 'vadmin6', password: '1234', role: 'supervisor', name: 'UMIRZAKOV IQBOLIDIN',  bolim: null, smena: null, mas_ullar: ['u_ub_d','u_pps1_d','u_cl_d'] },
    { id: 'vadmin7', login: 'vadmin7', password: '1234', role: 'supervisor', name: 'BAYBUBAYEV ILXAMJON',  bolim: null, smena: null, mas_ullar: ['u_ua_a','u_pps2_a'] },
    { id: 'vadmin8', login: 'vadmin8', password: '1234', role: 'supervisor', name: 'MIRZAKARIMOV MUSAJON', bolim: null, smena: null, mas_ullar: ['u_ua_b','u_pps2_b'] },

    // ===== MAS'UL XODIMLAR — Faqat davomat kiritadi =====
    // ofis_a, ofis_b, ofis_d — o'z smenasi + C smenani ham kirita oladi
    // C smena: UA grafigiga asosan kim kunduzgida bo'lsa o'sha kiritadi
    // ofis_a: UA A kunduzgi bo'lganda C kiritadi (BAYBUBAYEV ILXAMJON)
    // ofis_b: UA B kunduzgi bo'lganda C kiritadi (MIRZAKARIMOV MUSAJON)
    // ofis_d: UA D (dam olish) bo'lganda C kiritilmaydi
    { id: 'u_ofis_a', supervisor_id: 'vadmin7', login: 'ofis_a', password: '1234', role: 'mas_ul', name: 'MAMAJONOV MUXAMMADAZIZ', bolim: 'Ofis', smena: 'A', extra_smenalar: ['C'], c_smena_ua_smena: 'A' },
    { id: 'u_ofis_b', supervisor_id: 'vadmin8', login: 'ofis_b', password: '1234', role: 'mas_ul', name: 'XOLDAROV OMADBEK',       bolim: 'Ofis', smena: 'B', extra_smenalar: ['C'], c_smena_ua_smena: 'B' },
    { id: 'u_ofis_d', login: 'ofis_d', password: '1234', role: 'mas_ul', name: 'XAKIMOV BOBUR',          bolim: 'Ofis', smena: 'D', extra_smenalar: [] },
    { id: 'u_ub_a', supervisor_id: 'vadmin4',   login: 'ub_a',   password: '1234', role: 'mas_ul', name: 'KADIROV XUSAN',          bolim: 'UB',   smena: 'A' },
    { id: 'u_ub_b', supervisor_id: 'vadmin5',   login: 'ub_b',   password: '1234', role: 'mas_ul', name: 'TOJIDINOV RUSTAMBEK',    bolim: 'UB',   smena: 'B' },
    { id: 'u_ub_d', supervisor_id: 'vadmin6',   login: 'ub_d',   password: '1234', role: 'mas_ul', name: "BEGMATOV MO'SAJON",      bolim: 'UB',   smena: 'D' },
    { id: 'u_ua_a', supervisor_id: 'vadmin7',   login: 'ua_a',   password: '1234', role: 'mas_ul', name: 'JUMABOYEV IXTIYORJON',   bolim: 'UA',   smena: 'A' },
    { id: 'u_ua_b', supervisor_id: 'vadmin8',   login: 'ua_b',   password: '1234', role: 'mas_ul', name: 'MUSTAFAQULOV FARXODBEK', bolim: 'UA',   smena: 'B' },
    { id: 'u_pps1_a', supervisor_id: 'vadmin4', login: 'pps1_a', password: '1234', role: 'mas_ul', name: 'AXMADJONOV SARVARBEK',   bolim: 'PPS1', smena: 'A' },
    { id: 'u_pps1_b', supervisor_id: 'vadmin5', login: 'pps1_b', password: '1234', role: 'mas_ul', name: 'KASIMOV SHOXABBOS',      bolim: 'PPS1', smena: 'B' },
    { id: 'u_pps1_d', supervisor_id: 'vadmin6', login: 'pps1_d', password: '1234', role: 'mas_ul', name: "G'OZIYEV SHAVKATBEK",    bolim: 'PPS1', smena: 'D' },
    { id: 'u_pps2_a', supervisor_id: 'vadmin7', login: 'pps2_a', password: '1234', role: 'mas_ul', name: 'SOBIROV XOTAMJON',       bolim: 'PPS2', smena: 'A' },
    { id: 'u_pps2_b', supervisor_id: 'vadmin8', login: 'pps2_b', password: '1234', role: 'mas_ul', name: 'ANVAROV SHOXRUXBEK',     bolim: 'PPS2', smena: 'B' },
    { id: 'u_cl_a', supervisor_id: 'vadmin4',   login: 'cl_a',   password: '1234', role: 'mas_ul', name: 'AXMEDOV MASHXURBEK',     bolim: 'Cleaning', smena: 'A' },
    { id: 'u_cl_b', supervisor_id: 'vadmin5',   login: 'cl_b',   password: '1234', role: 'mas_ul', name: 'IKROMOV ISLOMBEK',       bolim: 'Cleaning', smena: 'B' },
    { id: 'u_cl_d', supervisor_id: 'vadmin6',   login: 'cl_d',   password: '1234', role: 'mas_ul', name: 'MAMATAZIZOV ILXOMIDIN',  bolim: 'Cleaning', smena: 'D' },
  ],

  bolimlar: [
    { id: 'Ofis',     nom: 'Ofis ITR',          smenalar: ['A','B','C','D'], ish_orni: 4  },
    { id: 'UB',       nom: 'UB',                smenalar: ['A','B','D'],     ish_orni: 28 },
    { id: 'UA',       nom: 'UA',                smenalar: ['A','B'],         ish_orni: 28 },
    { id: 'PPS1',     nom: 'PPS1',              smenalar: ['A','B','D'],     ish_orni: 17 },
    { id: 'PPS2',     nom: 'PPS2',              smenalar: ['A','B'],         ish_orni: 13 },
    { id: 'Cleaning', nom: 'Cleaning',          smenalar: ['A','B','C','D'], ish_orni: 13 },
    { id: 'Tarozi',   nom: 'Tarozi',            smenalar: ['A','B','D'],     ish_orni: 1  },
  ],

  sabablar: [
    { kod: 'BS',     nom: "Kasallik (1 kunlik)" },
    { kod: 'B',      nom: "Kasallik (bir necha kunlik)" },
    { kod: 'OT',     nom: "Dam olish kuni (otgul)" },
    { kod: 'TO',     nom: "Mehnat ta'tili" },
    { kod: 'UO',     nom: "O'qish ta'tili" },
    { kod: 'G',      nom: "Davlat xizmatlari" },
    { kod: 'V',      nom: "Dam olish kuni (oddiy)" },
    { kod: 'P',      nom: "Sababsiz kelmaganlik" },
    { kod: 'KM',     nom: "Komandirovka" },
    { kod: '?',      nom: "Noma'lum" },
    { kod: 'A/ART',  nom: "Xar xil xolatlar 1" },
    { kod: 'AP/APT', nom: "Xar xil xolatlar 2" },
    { kod: 'AS/AST', nom: "Xar xil xolatlar 3" },
    { kod: 'KECH',   nom: "Ishga kech kelish (soat kiritiladi)" },
  ],

  xodimlar: [
    // ===== OFIS — C smena =====
    {id:1,  tabel:'6212', ism:'ABDURAZAKOV NODIRBEK',        lavozim:'Rahbar',       bolim:'Ofis', smena:'C'},
    {id:2,  tabel:'6100', ism:'MIRZA AKBAROV BEXZOD',        lavozim:'Rahbar',       bolim:'Ofis', smena:'C'},
    {id:3,  tabel:'6071', ism:'ABDUMALIKOV ABDULXAMID',      lavozim:'Rahbar',       bolim:'Ofis', smena:'C'},
    {id:4,  tabel:'0775', ism:'ABDURAIMOV ABDULXAMID',       lavozim:'Muhandis',     bolim:'Ofis', smena:'C'},
    {id:5,  tabel:'1335', ism:'QULIYEV MAMASHUKIR',          lavozim:'Muhandis',     bolim:'Ofis', smena:'C'},
    {id:6,  tabel:'9273', ism:'ABDURAXIMOVA GULCHEXRA',      lavozim:'Tabelchi',     bolim:'Ofis', smena:'C'},
    // ===== OFIS — A smena =====
    {id:7,  tabel:'N654', ism:'MAMAJONOV MUXAMMADAZIZ',      lavozim:'Muhandis',     bolim:'Ofis', smena:'A'},
    {id:8,  tabel:'K735', ism:'AKBAROV ASKARJON',            lavozim:'Smena ustasi', bolim:'Ofis', smena:'A'},
    {id:9,  tabel:'6096', ism:'BAYBUBAYEV ILXAMJON',         lavozim:'Smena ustasi', bolim:'Ofis', smena:'A'},
    // ===== OFIS — B smena =====
    {id:10, tabel:'D001', ism:'XOLDAROV OMADBEK',            lavozim:'Muhandis',     bolim:'Ofis', smena:'B'},
    {id:11, tabel:'M672', ism:'MUXTORALIYEV OBIDJON',        lavozim:'Smena ustasi', bolim:'Ofis', smena:'B'},
    {id:12, tabel:'4973', ism:'MIRZAKARIMOV MUSAJON',        lavozim:'Smena ustasi', bolim:'Ofis', smena:'B'},
    // ===== OFIS — D smena =====
    {id:13, tabel:'P183', ism:'XAKIMOV BOBUR',               lavozim:'Muhandis',     bolim:'Ofis', smena:'D'},
    {id:14, tabel:'7098', ism:'UMIRZAKOV IQBOLIDIN',         lavozim:'Smena ustasi', bolim:'Ofis', smena:'D'},

    // ===== UB — A smena (28 o'rin, 20 xodim) =====
    {id:15, tabel:'M649', ism:'KADIROV XUSAN',               lavozim:'Usta',         bolim:'UB', smena:'A'},
    {id:16, tabel:'M690', ism:'IRMATOV SIROJIDIN',           lavozim:'Brigadir',     bolim:'UB', smena:'A'},
    {id:17, tabel:'6039', ism:"AZIMOV O'TKIRBEK",            lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:18, tabel:'M282', ism:'ERGASHEV AKBARALI',           lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:19, tabel:'K678', ism:'NURDINOV ISLOMJON',           lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:20, tabel:'B494', ism:'ABDUROMONOV MUXIDDIN',        lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:21, tabel:'B498', ism:'AXMADJONOV ILYOSBEK',         lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:22, tabel:'1735', ism:'MAMARASULOV BAXODIR',         lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:23, tabel:'B500', ism:'BOZOROV BAXODIRJON',          lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:24, tabel:'R963', ism:'SHAROBIDINOV BOBIRMIRZO',     lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:25, tabel:'1565', ism:'VAXOBOV MASHXURBEK',          lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:26, tabel:'R489', ism:'TESHABOYEV DIYORBEK',         lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:27, tabel:'R961', ism:"MO'MINOV SALOXIDDIN",         lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:28, tabel:'T435', ism:'OBIDOV AHMATILLO',            lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:29, tabel:'R957', ism:"G'ULOMJONOV AKBARALI",        lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:30, tabel:'M745', ism:'AXUNOV SHUXRATBEK',           lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:31, tabel:'B939', ism:'OLIMJONOV HUSANBOY',          lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:32, tabel:'N898', ism:'XOMIDOV DOSTONBEK',           lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:33, tabel:'N902', ism:"UBAYDULLAYEV G'AYRATBEK",     lavozim:'Ishchi',       bolim:'UB', smena:'A'},
    {id:34, tabel:'B922', ism:'KARIMOV JAHONGIR',            lavozim:'Ishchi',       bolim:'UB', smena:'A'},

    // ===== UB — B smena (28 o'rin, 25 xodim) =====
    {id:35, tabel:'A602', ism:'TOJIDINOV RUSTAMBEK',         lavozim:'Usta',         bolim:'UB', smena:'B'},
    {id:36, tabel:'K742', ism:'ABDULLAYEV SHERZODBEK',       lavozim:'Brigadir',     bolim:'UB', smena:'B'},
    {id:37, tabel:'T738', ism:'ZOKIRJONOV ABDULLAJON',       lavozim:'Brigadir',     bolim:'UB', smena:'B'},
    {id:38, tabel:'M692', ism:'KULMATOV YORQINMIRZO',        lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:39, tabel:'K003', ism:'AKBAROV ULUGBEK',             lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:40, tabel:'Q279', ism:'OTAJONOV SHAHZODBEK',         lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:41, tabel:'T440', ism:'ODILJONOV ABDUXALIM',         lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:42, tabel:'T442', ism:'OTAJONOV TURSUNALI',          lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:43, tabel:'T666', ism:'YUSUPAXMEDOV ABOBAKIR',       lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:44, tabel:'R937', ism:'UBAYDULLAYEV KOMILJON',       lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:45, tabel:'R494', ism:'TURSUNOV NODIRBEK',           lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:46, tabel:'R472', ism:'NORMIRZAYEV SHERZODBEK',      lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:47, tabel:'R491', ism:"TO'XTASINOV MUXAMMADQODIR",   lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:48, tabel:'R486', ism:'SODIQOV DILYORBEK',           lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:49, tabel:'R498', ism:"UMARALIYEV RO'ZIMUXAMMAD",    lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:50, tabel:'R487', ism:'SOLIJONOV SHAXBOZ',           lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:51, tabel:'R471', ism:'MUXTOROV DILSHODBEK',         lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:52, tabel:'R959', ism:'SODIQOV JAXONGIR',            lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:53, tabel:'M752', ism:'UMAROV OTABEK',               lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:54, tabel:'R503', ism:'YOQOBOV RUSTAMJON',           lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:55, tabel:'R955', ism:'RAXIMJONOV XIKMATALI',        lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:56, tabel:'R477', ism:'ORTIQOV BEGIJON',             lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:57, tabel:'P477', ism:'YUSUPOV SARDORBEK',           lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:58, tabel:'N894', ism:'XALIKOV AKMAL',               lavozim:'Ishchi',       bolim:'UB', smena:'B'},
    {id:59, tabel:'Q467', ism:'MAHMUDOV MIRJALOL',           lavozim:'Ishchi',       bolim:'UB', smena:'B'},

    // ===== UB — D smena (28 o'rin, 24 xodim) =====
    {id:60, tabel:'5224', ism:"BEGMATOV MO'SAJON",           lavozim:'Usta',         bolim:'UB', smena:'D'},
    {id:61, tabel:'K728', ism:'ABDUGANIYEV ISLOMBEK',        lavozim:'Brigadir',     bolim:'UB', smena:'D'},
    {id:62, tabel:'Q453', ism:'QOSIMOV MUHAMMADSHARIF',      lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:63, tabel:'2360', ism:"ASHUROV ULUG'BEK",            lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:64, tabel:'Q463', ism:'ABDULAXATOV AZIZBEK',         lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:65, tabel:'P482', ism:'MIRZAYEV MUXAMMADALI',        lavozim:'Brigadir',     bolim:'UB', smena:'D'},
    {id:66, tabel:'7964', ism:'TOJIMATOV AVAZBEK',           lavozim:'Brigadir',     bolim:'UB', smena:'D'},
    {id:67, tabel:'D090', ism:'XOSHIMOV JAMSHIDBEK',         lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:68, tabel:'T405', ism:'KURBONALIYEV ABDULATIF',      lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:69, tabel:'M493', ism:'MANNOBOV NIZOMIDDIN',         lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:70, tabel:'K725', ism:'MAMATURAIMOV BAXTIYORJON',    lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:71, tabel:'B893', ism:'YUSUPOV MAXMUDJON',           lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:72, tabel:'N890', ism:"YO'LDASHEV IBROXIMJON",       lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:73, tabel:'5398', ism:'XOLIQOV OTABEK',              lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:74, tabel:'R408', ism:'XUSANOV XUDOYBERDI',          lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:75, tabel:'R974', ism:'ABDUKARIMOV JASURBEK',        lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:76, tabel:'4236', ism:'XOJIYEV NURTOZAXON',          lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:77, tabel:'Q480', ism:"JO'RABOYEV XIKMATILLO",       lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:78, tabel:'N927', ism:'ZOKIRJONOV UMIDJON',          lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:79, tabel:'R484', ism:'SHOKIROV JOXONGIRBEK',        lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:80, tabel:'M033', ism:"MADUMAROV QO'CHOARBOY",       lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:81, tabel:'A991', ism:'XAYITOV BOTIRJON',            lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:82, tabel:'T665', ism:'YUNUSOV MADAMINBEK',          lavozim:'Ishchi',       bolim:'UB', smena:'D'},
    {id:83, tabel:'A255', ism:'KUCHQAROV XUSANBOY',          lavozim:'Ishchi',       bolim:'UB', smena:'D'},

    // ===== UA — A smena (28 o'rin, 23 xodim) =====
    {id:84, tabel:'D599', ism:'JUMABOYEV IXTIYORJON',        lavozim:'Usta',         bolim:'UA', smena:'A'},
    {id:85, tabel:'D603', ism:'ALIMOV BOBIR',                lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:86, tabel:'A528', ism:'ASHIROV ILHOMJON',            lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:87, tabel:'Q470', ism:"O'RMONJONOV ADAXAMJON",       lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:88, tabel:'N904', ism:'TURDIYEV ABUBAKIR',           lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:89, tabel:'N905', ism:'XUSANOV AXMADJON',            lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:90, tabel:'N921', ism:'YULCHIYEV SHODIYORBEK',       lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:91, tabel:'B972', ism:'XUSANOV SARDORBEK',           lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:92, tabel:'N333', ism:'TURSUNOV ABDULAZIZ',          lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:93, tabel:'B241', ism:'ABDULLAYEV NODIRBEK',         lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:94, tabel:'K727', ism:'ABDUGANIYEV MUXAMMADVALI',    lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:95, tabel:'1429', ism:'XALMIRZAYEV AXMADJON',        lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:96, tabel:'R492', ism:'TOLIPOV ISLOMIDDIN',          lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:97, tabel:'N773', ism:'SALOXIDINOV SOBIRJON',        lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:98, tabel:'Q472', ism:'SOYIBJONOV SARVARBEK',        lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:99, tabel:'N886', ism:'YANGIBOYEV MUXIDDIN',         lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:100,tabel:'R966', ism:'JOMIYEV MIRSULTON',           lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:101,tabel:'8072', ism:'ASHUROV BAXTIYORJON',         lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:102,tabel:'N915', ism:'TURSUNBAYEV BOBURJON',        lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:103,tabel:'T389', ism:'GAFUROV AZAMBEK',             lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:104,tabel:'T648', ism:'UMAROV SHOHRUHBEK',           lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:105,tabel:'T446', ism:'QOBULOV MUHAMMADDIYOR',       lavozim:'Ishchi',       bolim:'UA', smena:'A'},
    {id:106,tabel:'T647', ism:'UMAROV MUHRIDDIN',            lavozim:'Ishchi',       bolim:'UA', smena:'A'},

    // ===== UA — B smena (28 o'rin, 24 xodim) =====
    {id:107,tabel:'P014', ism:'MUSTAFAQULOV FARXODBEK',      lavozim:'Usta',         bolim:'UA', smena:'B'},
    {id:108,tabel:'K112', ism:'ARIPOV AXRORIDIN',            lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:109,tabel:'K726', ism:'OXUNOV BEKZODJON',            lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:110,tabel:'N913', ism:'SHAMSHIDDINOV SARDORBEK',     lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:111,tabel:'A986', ism:'MAXAMMADJONOV ABDULATIF',     lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:112,tabel:'T641', ism:"TURG'UNBOYEV IMINYAMIN",      lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:113,tabel:'T379', ism:'BOTIRALIEV DAVRONBEK',        lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:114,tabel:'Q483', ism:'SOBIROV OBBOSBEK',            lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:115,tabel:'T497', ism:'SOBIROV ASADBEK',             lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:116,tabel:'A987', ism:'KOMILJONOV ISLOMBEK',         lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:117,tabel:'Q555', ism:'YODGORBEKOV SHAMSHODBEK',     lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:118,tabel:'B954', ism:'RUSTAMOV MUHAMMADSOLI',       lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:119,tabel:'N919', ism:'XAKIMOV OTABEK',              lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:120,tabel:'2695', ism:"XOLIQOV G'AYRATJON",          lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:121,tabel:'D640', ism:"JO'RAYEV SHOXRUX",            lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:122,tabel:'T663', ism:'YOQOBOV DIYORBEK',            lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:123,tabel:'B199', ism:'ABDUQOSIMOV XUSANBOY',        lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:124,tabel:'T401', ism:'KAMOLIDDINOV SOYIBJON',       lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:125,tabel:'N906', ism:'UMARALIYEV JAVOXIRBEK',       lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:126,tabel:'N922', ism:'RAYIMOV SHUKURULLO',          lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:127,tabel:'Q473', ism:'MAXKAMOV AZIZBEK',            lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:128,tabel:'D636', ism:'MAMATAZIZOV BEKMUROD',        lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:129,tabel:'4170', ism:'ENAZAROV DILSHODBEK',         lavozim:'Ishchi',       bolim:'UA', smena:'B'},
    {id:130,tabel:'T647', ism:'UMAROV MUXRIDDIN',            lavozim:'Ishchi',       bolim:'UA', smena:'B'},

    // ===== PPS1 — A smena (17 o'rin, 15 xodim) =====
    {id:131,tabel:'A551', ism:'AXMADJONOV SARVARBEK',        lavozim:'Usta',         bolim:'PPS1', smena:'A'},
    {id:132,tabel:'A598', ism:'ABDUJABBAROV KOZIMJON',       lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:133,tabel:'M659', ism:'NAZAROV XUSANBOY',            lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:134,tabel:'M697', ism:'YUSUPOV MIROLIM',             lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:135,tabel:'A244', ism:'EGAMBERDIYEV JOLOLDIN',       lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:136,tabel:'R700', ism:'QAHHOROV UMIDJON',            lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:137,tabel:'T748', ism:'TURSUNALIYEV RUZALI',         lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:138,tabel:'R956', ism:'MAXMUDJONOV JAMSHID',         lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:139,tabel:'R502', ism:"YAQUBOV ULUG'BEK",            lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:140,tabel:'N899', ism:"TO'HTASINOV OHINJON",         lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:141,tabel:'B938', ism:'OLIMJONOV HASANBOY',          lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:142,tabel:'4149', ism:'UMAROV INOMJON',              lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:143,tabel:'M024', ism:'ABDUPATTOYEV AZMIDDIN',       lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:144,tabel:'K724', ism:"O'RINBOYEV ABDULAZIZ",        lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},
    {id:145,tabel:'4308', ism:'KARABOYEV XILOLIDIN',         lavozim:'Ishchi',       bolim:'PPS1', smena:'A'},

    // ===== PPS1 — B smena (17 o'rin, 12 xodim) =====
    {id:146,tabel:'5020', ism:'KASIMOV SHOXABBOS',           lavozim:'Usta',         bolim:'PPS1', smena:'B'},
    {id:147,tabel:'K565', ism:'MATKARIMOV IKROM',            lavozim:'Ishchi',       bolim:'PPS1', smena:'B'},
    {id:148,tabel:'M853', ism:'TAVAKKALOV DILSHODBEK',       lavozim:'Ishchi',       bolim:'PPS1', smena:'B'},
    {id:149,tabel:'B926', ism:'KOMILOV AZIMJON',             lavozim:'Ishchi',       bolim:'PPS1', smena:'B'},
    {id:150,tabel:'K733', ism:"XAKIMOV G'AYRATBEK",          lavozim:'Ishchi',       bolim:'PPS1', smena:'B'},
    {id:151,tabel:'P396', ism:'AXMEDOV MADAMINJON',          lavozim:'Ishchi',       bolim:'PPS1', smena:'B'},
    {id:152,tabel:'T633', ism:'TILAVOLDIYEV FARRUX',         lavozim:'Ishchi',       bolim:'PPS1', smena:'B'},
    {id:153,tabel:'N895', ism:"TOSHPO'LATOV IBROXIMJON",     lavozim:'Ishchi',       bolim:'PPS1', smena:'B'},
    {id:154,tabel:'A556', ism:'YUNUSOV ABDUVALIY',           lavozim:'Ishchi',       bolim:'PPS1', smena:'B'},
    {id:155,tabel:'B942', ism:'OXUNOV ISKANDARBEK',          lavozim:'Ishchi',       bolim:'PPS1', smena:'B'},
    {id:156,tabel:'4702', ism:'TILLAYEV TOIRJON',            lavozim:'Ishchi',       bolim:'PPS1', smena:'B'},
    {id:157,tabel:'B198', ism:'ABDUMANNOBOV XURSHIDBEK',     lavozim:'Ishchi',       bolim:'PPS1', smena:'B'},

    // ===== PPS1 — D smena (17 o'rin, 13 xodim) =====
    {id:158,tabel:'1127', ism:"G'OZIYEV SHAVKATBEK",         lavozim:'Usta',         bolim:'PPS1', smena:'D'},
    {id:159,tabel:'K736', ism:'OMONOV ABRORBEK',             lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},
    {id:160,tabel:'M689', ism:'DOLIYEV SHUXRAT',             lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},
    {id:161,tabel:'D149', ism:"QO'SHBO'TAYEV DOSTONBEK",     lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},
    {id:162,tabel:'B424', ism:'TURSUNOV JASUR',              lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},
    {id:163,tabel:'R469', ism:'MULLAJONOV ISMOILJON',        lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},
    {id:164,tabel:'K572', ism:"JO'RAYEV IKBOLJON",           lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},
    {id:165,tabel:'B194', ism:"ABDUG'ANIYEV MIRZAJON",       lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},
    {id:166,tabel:'0975', ism:'SODIQOV DILSHODBEK',          lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},
    {id:167,tabel:'B920', ism:'ISROILOV RAHMATILLO',         lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},
    {id:168,tabel:'6965', ism:'ABUBAKIROV SIROJIDDIN',       lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},
    {id:169,tabel:'B499', ism:"BO'TAYEV MUSLIMBEK",          lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},
    {id:170,tabel:'Q479', ism:"MA'MIRBEKOV HIKMATILLO",      lavozim:'Ishchi',       bolim:'PPS1', smena:'D'},

    // ===== PPS2 — A smena (13 o'rin, 12 xodim) =====
    {id:171,tabel:'4299', ism:'SOBIROV XOTAMJON',            lavozim:'Usta',         bolim:'PPS2', smena:'A'},
    {id:172,tabel:'R967', ism:'QORABOYEV SARVARBEK',         lavozim:'Ishchi',       bolim:'PPS2', smena:'A'},
    {id:173,tabel:'T496', ism:'SHERBOYEV KOZIMJON',          lavozim:'Ishchi',       bolim:'PPS2', smena:'A'},
    {id:174,tabel:'M696', ism:'SHAXOBIDINOV ISMOIL',         lavozim:'Ishchi',       bolim:'PPS2', smena:'A'},
    {id:175,tabel:'D441', ism:'KOMILOV ABDUVALI',            lavozim:'Ishchi',       bolim:'PPS2', smena:'A'},
    {id:176,tabel:'T382', ism:'DEXQONOV FAXRIDDIN',          lavozim:'Ishchi',       bolim:'PPS2', smena:'A'},
    {id:177,tabel:'T694', ism:'MAMASOLIYEV MUXAMMADJON',     lavozim:'Ishchi',       bolim:'PPS2', smena:'A'},
    {id:178,tabel:'B949', ism:'RAIMJONOV MIRZAODIL',         lavozim:'Ishchi',       bolim:'PPS2', smena:'A'},
    {id:179,tabel:'T638', ism:'TOLIBJONOV KOZIMJON',         lavozim:'Ishchi',       bolim:'PPS2', smena:'A'},
    {id:180,tabel:'A791', ism:'ABDIQOSIMOV ZAFARJON',        lavozim:'Ishchi',       bolim:'PPS2', smena:'A'},
    {id:181,tabel:'N912', ism:'SAIDUMAROV ABDULAZIZ',        lavozim:'Ishchi',       bolim:'PPS2', smena:'A'},
    {id:182,tabel:'A536', ism:'EGAMBERDIYEV MUXAMMADKARIM',  lavozim:'Ishchi',       bolim:'PPS2', smena:'A'},

    // ===== PPS2 — B smena (13 o'rin, 12 xodim) =====
    {id:183,tabel:'A527', ism:'ANVAROV SHOXRUXBEK',          lavozim:'Usta',         bolim:'PPS2', smena:'B'},
    {id:184,tabel:'A985', ism:'XUSANOV SARVARBEK',           lavozim:'Ishchi',       bolim:'PPS2', smena:'B'},
    {id:185,tabel:'2774', ism:'KARIMOV SHAVKATBEK',          lavozim:'Ishchi',       bolim:'PPS2', smena:'B'},
    {id:186,tabel:'A534', ism:'ARTIKOV SAIDISLOM',           lavozim:'Ishchi',       bolim:'PPS2', smena:'B'},
    {id:187,tabel:'B947', ism:'QUDRATILLAYEV ORZIBEK',       lavozim:'Ishchi',       bolim:'PPS2', smena:'B'},
    {id:188,tabel:'P474', ism:'MAVLONOV SARVARBEK',          lavozim:'Ishchi',       bolim:'PPS2', smena:'B'},
    {id:189,tabel:'B469', ism:'ABDURAXMONOV DIYORBEK',       lavozim:'Ishchi',       bolim:'PPS2', smena:'B'},
    {id:190,tabel:'Q484', ism:'DAVRONBEKOV OTABEK',          lavozim:'Ishchi',       bolim:'PPS2', smena:'B'},
    {id:191,tabel:'P886', ism:'ISROILOV ILXOMJON',           lavozim:'Ishchi',       bolim:'PPS2', smena:'B'},
    {id:192,tabel:'P158', ism:'QURBONOV BEHZOD',             lavozim:'Ishchi',       bolim:'PPS2', smena:'B'},
    {id:193,tabel:'T457', ism:'SAYDALIYEV IQBOLJON',         lavozim:'Ishchi',       bolim:'PPS2', smena:'B'},
    {id:194,tabel:'Q585', ism:'IBRAGIMOV ABDULAZIXON',       lavozim:'Ishchi',       bolim:'PPS2', smena:'B'},

    // ===== CLEANING — A smena (13 o'rin, 12 xodim) =====
    {id:195,tabel:'6284', ism:'AXMEDOV MASHXURBEK',          lavozim:'Usta',         bolim:'Cleaning', smena:'A'},
    {id:196,tabel:'R488', ism:'SOTIBOLDIYEV SANJARBEK',      lavozim:'Ishchi',       bolim:'Cleaning', smena:'A'},
    {id:197,tabel:'R481', ism:'RAYIMJONOV ABDULAZIZBEK',     lavozim:'Ishchi',       bolim:'Cleaning', smena:'A'},
    {id:198,tabel:'7781', ism:"JO'RABOYEV SANJARBEK",        lavozim:'Ishchi',       bolim:'Cleaning', smena:'A'},
    {id:199,tabel:'T503', ism:'SOTVOLDIYEV JASURBEK',        lavozim:'Ishchi',       bolim:'Cleaning', smena:'A'},
    {id:200,tabel:'T115', ism:"TAG'DIRALIYEV JASURBEK",      lavozim:'Ishchi',       bolim:'Cleaning', smena:'A'},
    {id:201,tabel:'N505', ism:"RO'ZIALIYEV ALISHER",         lavozim:'Ishchi',       bolim:'Cleaning', smena:'A'},
    {id:202,tabel:'2932', ism:'TURDALIYEV XURSANBEK',        lavozim:'Ishchi',       bolim:'Cleaning', smena:'A'},
    {id:203,tabel:'V290', ism:'OLIMOV ALISHER',              lavozim:'Ishchi',       bolim:'Cleaning', smena:'A'},
    {id:204,tabel:'V013', ism:'MAMIROV JAMSHIDBEK',          lavozim:'Ishchi',       bolim:'Cleaning', smena:'A'},
    {id:205,tabel:'B963', ism:'TOLIBJONOV ABUBAKIR',         lavozim:'Ishchi',       bolim:'Cleaning', smena:'A'},
    {id:206,tabel:'Q244', ism:'YUSUFBEKOV BEXZODBEK',        lavozim:'Ishchi',       bolim:'Cleaning', smena:'A'},

    // ===== CLEANING — B smena (13 o'rin, 11 xodim) =====
    {id:207,tabel:'K567', ism:'IKROMOV ISLOMBEK',            lavozim:'Usta',         bolim:'Cleaning', smena:'B'},
    {id:208,tabel:'R466', ism:'MARIBJONOV JOLOLDIN',         lavozim:'Ishchi',       bolim:'Cleaning', smena:'B'},
    {id:209,tabel:'7891', ism:'BALTABAYEV TOIR',             lavozim:'Ishchi',       bolim:'Cleaning', smena:'B'},
    {id:210,tabel:'7368', ism:'MAMANAZAROV ZIYOVUDDIN',      lavozim:'Ishchi',       bolim:'Cleaning', smena:'B'},
    {id:211,tabel:'7892', ism:'DJABBAROV RAXMATILLA',        lavozim:'Ishchi',       bolim:'Cleaning', smena:'B'},
    {id:212,tabel:'D634', ism:'RAYIMKULOV ABDUMALIK',        lavozim:'Ishchi',       bolim:'Cleaning', smena:'B'},
    {id:213,tabel:'R490', ism:'TILAVOLDIYEV NOZIMJON',       lavozim:'Ishchi',       bolim:'Cleaning', smena:'B'},
    {id:214,tabel:'R965', ism:'XAMIDOV AXRORBEK',            lavozim:'Ishchi',       bolim:'Cleaning', smena:'B'},
    {id:215,tabel:'Q776', ism:'NORBAYEV ABRORJON',           lavozim:'Ishchi',       bolim:'Cleaning', smena:'B'},
    {id:216,tabel:'N520', ism:'MAMASIDDIQOV XURSHIDBEK',     lavozim:'Ishchi',       bolim:'Cleaning', smena:'B'},
    {id:217,tabel:'Q276', ism:'JALOLDINOV JAMOLIDIN',        lavozim:'Ishchi',       bolim:'Cleaning', smena:'B'},

    // ===== CLEANING — D smena (13 o'rin, 10 xodim) =====
    {id:218,tabel:'P480', ism:'MAMATAZIZOV ILXOMIDIN',       lavozim:'Usta',         bolim:'Cleaning', smena:'D'},
    {id:219,tabel:'8041', ism:'XOJIMATOV TURSINBOY',         lavozim:'Ishchi',       bolim:'Cleaning', smena:'D'},
    {id:220,tabel:'7369', ism:'SOLOMOV MUMINJON',            lavozim:'Ishchi',       bolim:'Cleaning', smena:'D'},
    {id:221,tabel:'A410', ism:'FOZILOV DAVRONBEK',           lavozim:'Ishchi',       bolim:'Cleaning', smena:'D'},
    {id:222,tabel:'T434', ism:'NURMATOV SHERMUXAMMAD',       lavozim:'Ishchi',       bolim:'Cleaning', smena:'D'},
    {id:223,tabel:'B971', ism:'XOMIDOV MUXAMMADJON',         lavozim:'Ishchi',       bolim:'Cleaning', smena:'D'},
    {id:224,tabel:'R485', ism:'SOBIROV SARDORBEK',           lavozim:'Ishchi',       bolim:'Cleaning', smena:'D'},
    {id:225,tabel:'R473', ism:'NURMAMATOV BOBURJON',         lavozim:'Ishchi',       bolim:'Cleaning', smena:'D'},
    {id:226,tabel:'Q277', ism:'TURGUNOV ELYORBEK',           lavozim:'Ishchi',       bolim:'Cleaning', smena:'D'},
    {id:227,tabel:'6543', ism:'XUDOYBERGANOV SARDORBEK',     lavozim:'Brigadir',     bolim:'Cleaning', smena:'D'},

    // ===== TAROZI — A smena =====
    {id:228,tabel:'6247', ism:'ATABAYEV XUSHNUDBEK',         lavozim:'Omborchi',     bolim:'Tarozi', smena:'A'},
    // ===== TAROZI — B smena =====
    {id:229,tabel:'K562', ism:'ABDUSATTOROV XAYOTBEK',       lavozim:'Omborchi',     bolim:'Tarozi', smena:'B'},
    // ===== TAROZI — D smena =====
    {id:230,tabel:'1100', ism:'KASIMOV AKRAMJON',            lavozim:'Omborchi',     bolim:'Tarozi', smena:'D'},

    // ===== CLEANING — C smena (Ofis bilan birga) =====
    {id:231,tabel:'0975', ism:"ERGASHEV G'ULOMJON",          lavozim:'Ishchi',       bolim:'Cleaning', smena:'C'},
    {id:232,tabel:'R870', ism:'RAJABOV ISLOM',               lavozim:'Ishchi',       bolim:'Cleaning', smena:'C'},
  ],

  davomat: {},
  nextEmpId: 300,
  nextUserId: 200,

  // Ish grafigi: key = 'YYYY-MM_BOLIM_SMENA', value = { 'YYYY-MM-DD': 'kunduzi'|'tungi'|'dam' }
  grafik: {},

  // Grafik meta: key = 'YYYY-MM', value = { tuzilgan: ISO, tuzgan: userId }
  grafik_meta: {},
};

// ============================================================
// STORAGE
// ============================================================
const Storage = {
  KEY: 'davomat_db_v8',
  SESSION: 'davomat_session_v2',

  // Firebase ga saqlash (asosiy) + localStorage (zaxira)
  save() {
    try {
      // localStorage ga zaxira
      localStorage.setItem(this.KEY, JSON.stringify(DB));
      // Firebase ga ham saqlash (agar mavjud bo'lsa)
      if(typeof FirebaseStorage !== 'undefined') {
        const saveData = {
          davomat: DB.davomat || {},
          grafik: DB.grafik || {},
          grafik_meta: DB.grafik_meta || {},
          users: DB.users || [],
          bolimlar: DB.bolimlar || [],
          xodimlar: DB.xodimlar || [],
          nextEmpId: DB.nextEmpId,
          nextUserId: DB.nextUserId,
        };
        FirebaseStorage.save(saveData);
      }
    } catch(e) { console.error('Save error:', e); }
  },

  // Firebase dan yuklash (asosiy) + localStorage (zaxira)
  load() {
    try {
      // Avval localStorage dan yukla (tezkor)
      const raw = localStorage.getItem(this.KEY);
      if(raw) {
        const s = JSON.parse(raw);
        this._applyData(s);
      }
      // Keyin Firebase dan yangilash
      if(typeof FirebaseStorage !== 'undefined') {
        FirebaseStorage.load().then(s => {
          if(s) {
            this._applyData(s);
            // Aktiv sahifani qayta render qilish
            this._refreshActivePage();
            // Real-time yangilanish
            FirebaseStorage.listen(data => {
              if(data) {
                this._applyData(data);
                this._refreshActivePage();
              }
            });
          }
        });
      }
    } catch(e) { console.error('Load error:', e); }
  },

  // Aktiv sahifani qayta render qilish
  _refreshActivePage() {
    try {
      const activePage = document.querySelector('.page.active');
      if(!activePage) return;
      const pageId = activePage.id.replace('page-','');
      if(typeof showPage === 'function') {
        showPage(pageId);
      }
    } catch(e) {}
  },

  _applyData(s) {
    if(s.users)       DB.users       = s.users;
    // bolimlar va xodimlarni faqat Firebase da ko'proq yoki teng bo'lsa yangilash
    if(s.bolimlar && s.bolimlar.length >= DB.bolimlar.length) DB.bolimlar = s.bolimlar;
    if(s.xodimlar && s.xodimlar.length >= DB.xodimlar.length) DB.xodimlar = s.xodimlar;
    if(s.davomat)     DB.davomat     = s.davomat;
    if(s.grafik)      DB.grafik      = s.grafik;
    if(s.grafik_meta) DB.grafik_meta = s.grafik_meta;
    if(s.nextEmpId)   DB.nextEmpId   = s.nextEmpId;
    if(s.nextUserId)  DB.nextUserId  = s.nextUserId;
  },

  saveSession(u) { try { sessionStorage.setItem(this.SESSION, JSON.stringify({id:u.id,login:u.login,role:u.role,name:u.name,bolim:u.bolim,smena:u.smena,extra_smenalar:u.extra_smenalar,view_scope:u.view_scope,view_bolimlar:u.view_bolimlar,mas_ullar:u.mas_ullar,supervisor_id:u.supervisor_id,c_smena_ua_smena:u.c_smena_ua_smena,readonly:u.readonly})); } catch(e) {} },
  loadSession() { try { const r=sessionStorage.getItem(this.SESSION); return r?JSON.parse(r):null; } catch(e) { return null; } },
  clearSession() { try { sessionStorage.removeItem(this.SESSION); } catch(e) {} }
};

// ============================================================
// HELPERS
// ============================================================
function todayStr() {
  const d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function formatDate(ds) {
  if(!ds) return '';
  const d=new Date(ds+'T12:00:00');
  const M=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const D=['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  return D[d.getDay()]+', '+d.getDate()+' '+M[d.getMonth()]+' '+d.getFullYear();
}
function getBolim(id) { return DB.bolimlar.find(b=>b.id===id); }
function findByTabel(t) { return DB.xodimlar.find(e=>e.tabel.toUpperCase()===t.toUpperCase().trim()); }
function getEmpsForSmena(bolim,smena) { return DB.xodimlar.filter(e=>e.bolim===bolim&&e.smena===smena); }
function getDavomatKey(date,bolim,smena) { return date+'_'+bolim+'_'+smena; }
function getDavomat(date,bolim,smena) { return DB.davomat[getDavomatKey(date,bolim,smena)]||null; }

function nowMinutes() { const n=new Date(); return n.getHours()*60+n.getMinutes(); }
function isMasUlWindowOpen() { const m=nowMinutes(); return m>=460||m<=450; }
function isKunduziWindow() { const m=nowMinutes(); return m>=470&&m<=505; }
function isTungiWindow()   { const m=nowMinutes(); return m>=1190&&m<=1225; }
function isAnyDavWindow()  { return isKunduziWindow()||isTungiWindow(); }
function isEditAllowed(savedAt) { if(!savedAt) return false; return (Date.now()-new Date(savedAt).getTime())<5*60*1000; }

function getWorkDays(year,month) {
  const days=[],dim=new Date(year,month,0).getDate();
  for(let d=1;d<=dim;d++) days.push(year+'-'+String(month).padStart(2,'0')+'-'+String(d).padStart(2,'0'));
  return days;
}
function calcMonthlyStats(year,month,bolimFilter,smenaFilter) {
  const days=getWorkDays(year,month);
  let totalKeldi=0,totalKech=0,totalYoq=0,totalSessions=0;
  const byBolim={},bySabab={};
  for(const day of days){
    for(const b of DB.bolimlar){
      if(bolimFilter&&b.id!==bolimFilter) continue;
      for(const s of b.smenalar){
        if(smenaFilter&&s!==smenaFilter) continue;
        const dav=getDavomat(day,b.id,s); if(!dav) continue;
        totalSessions++;
        if(!byBolim[b.id]) byBolim[b.id]={keldi:0,kech:0,yoq:0};
        const emps=getEmpsForSmena(b.id,s);
        for(const e of emps){
          const att=dav.attendance[e.id];
          if(!att||att.holat==='keldi'){totalKeldi++;byBolim[b.id].keldi++;}
          else if(att.holat==='kech'){totalKech++;byBolim[b.id].kech++;}
          else{totalYoq++;byBolim[b.id].yoq++;const sb=att.sabab||'?';bySabab[sb]=(bySabab[sb]||0)+1;}
        }
      }
    }
  }
  const total=totalKeldi+totalKech+totalYoq;
  return {totalKeldi,totalKech,totalYoq,total,byBolim,bySabab,totalSessions,absRate:total?((totalYoq/total)*100).toFixed(1):'0.0'};
}

// ============================================================
// ISH GRAFIGI — { 'YYYY-MM_BOLIM_SMENA': { 'YYYY-MM-DD': 'kunduzi'|'tungi'|'dam' } }
// ============================================================
// grafik_meta: { 'YYYY-MM': { tuzilgan: ISO, tuzgan: userId } }
