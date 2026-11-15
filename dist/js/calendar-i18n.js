const keys = ['downloadStarted', 'downloadHelp', 'googleHelp', 'share', 'shareFailed', 'downloadAgain', 'importHelp'];

// Google Calendar is a brand name and stays unchanged in every language.
const rows = {
  en: [
    'Download started. Check Downloads.',
    'Open the .ics file in a calendar app that supports import.',
    'Google Calendar on Android? Use the Google Calendar button, then save the event. Google may ask you to sign in.',
    'Share file', 'Sharing unavailable. Download the file instead.', 'Download again', 'How to add it',
  ],
  zh: [
    '已开始下载，请查看下载内容。',
    '用支持导入的日历应用打开 .ics 文件。',
    '安卓使用 Google Calendar？点击 Google Calendar 按钮，再保存日程。Google 可能要求登录。',
    '分享文件', '暂时无法分享，请下载文件。', '重新下载', '如何加入日历',
  ],
  es: [
    'Descarga iniciada. Revisa Descargas.',
    'Abre el archivo .ics en una app de calendario que permita importar.',
    '¿Google Calendar en Android? Pulsa Google Calendar y guarda el evento. Google puede pedirte que inicies sesión.',
    'Compartir archivo', 'No se puede compartir. Descarga el archivo.', 'Descargar de nuevo', 'Cómo añadirlo',
  ],
  fr: [
    'Téléchargement lancé. Consultez Téléchargements.',
    'Ouvrez le fichier .ics dans une application de calendrier compatible avec l’importation.',
    'Google Calendar sur Android ? Appuyez sur Google Calendar, puis enregistrez l’événement. Google peut demander une connexion.',
    'Partager le fichier', 'Partage indisponible. Téléchargez le fichier.', 'Télécharger à nouveau', 'Comment l’ajouter',
  ],
  de: [
    'Download gestartet. Siehe Downloads.',
    'Öffne die .ics-Datei in einer Kalender-App mit Importfunktion.',
    'Google Calendar auf Android? Tippe auf Google Calendar und speichere den Termin. Google kann eine Anmeldung verlangen.',
    'Datei teilen', 'Teilen nicht verfügbar. Lade die Datei herunter.', 'Erneut herunterladen', 'So fügst du ihn hinzu',
  ],
  sv: [
    'Hämtning startad. Se Hämtade filer.',
    'Öppna .ics-filen i en kalenderapp som stöder import.',
    'Google Calendar på Android? Tryck på Google Calendar och spara händelsen. Google kan kräva inloggning.',
    'Dela fil', 'Delning är inte tillgänglig. Hämta filen.', 'Hämta igen', 'Så lägger du till den',
  ],
  da: [
    'Download startet. Se Downloads.',
    'Åbn .ics-filen i en kalenderapp, der understøtter import.',
    'Google Calendar på Android? Tryk på Google Calendar, og gem begivenheden. Google kan kræve login.',
    'Del fil', 'Deling er ikke tilgængelig. Download filen.', 'Download igen', 'Sådan tilføjer du den',
  ],
  no: [
    'Nedlasting startet. Se Nedlastinger.',
    'Åpne .ics-filen i en kalenderapp som støtter import.',
    'Google Calendar på Android? Trykk på Google Calendar og lagre hendelsen. Google kan kreve innlogging.',
    'Del fil', 'Deling er utilgjengelig. Last ned filen.', 'Last ned igjen', 'Slik legger du den til',
  ],
  fi: [
    'Lataus alkoi. Katso Lataukset.',
    'Avaa .ics-tiedosto kalenterisovelluksessa, joka tukee tuontia.',
    'Google Calendar Androidissa? Valitse Google Calendar ja tallenna tapahtuma. Google voi pyytää kirjautumaan.',
    'Jaa tiedosto', 'Jakaminen ei ole käytettävissä. Lataa tiedosto.', 'Lataa uudelleen', 'Näin lisäät tapahtuman',
  ],
  nl: [
    'Download gestart. Kijk bij Downloads.',
    'Open het .ics-bestand in een agenda-app die importeren ondersteunt.',
    'Google Calendar op Android? Tik op Google Calendar en sla de afspraak op. Google kan vragen om in te loggen.',
    'Bestand delen', 'Delen niet beschikbaar. Download het bestand.', 'Opnieuw downloaden', 'Zo voeg je het toe',
  ],
  it: [
    'Download avviato. Controlla Download.',
    'Apri il file .ics in un’app calendario che supporti l’importazione.',
    'Google Calendar su Android? Tocca Google Calendar e salva l’evento. Google potrebbe chiederti di accedere.',
    'Condividi file', 'Condivisione non disponibile. Scarica il file.', 'Scarica di nuovo', 'Come aggiungerlo',
  ],
  pt: [
    'Download iniciado. Verifique Downloads.',
    'Abra o arquivo .ics em um aplicativo de calendário que permita importar.',
    'Google Calendar no Android? Toque em Google Calendar e salve o evento. O Google pode pedir que você entre na conta.',
    'Compartilhar arquivo', 'Compartilhamento indisponível. Baixe o arquivo.', 'Baixar novamente', 'Como adicionar',
  ],
  pl: [
    'Pobieranie rozpoczęte. Sprawdź Pobrane.',
    'Otwórz plik .ics w aplikacji kalendarza obsługującej import.',
    'Google Calendar na Androidzie? Wybierz Google Calendar i zapisz wydarzenie. Google może poprosić o zalogowanie.',
    'Udostępnij plik', 'Udostępnianie niedostępne. Pobierz plik.', 'Pobierz ponownie', 'Jak dodać wydarzenie',
  ],
  cs: [
    'Stahování zahájeno. Zkontrolujte Stažené soubory.',
    'Otevřete soubor .ics v kalendářové aplikaci, která podporuje import.',
    'Google Calendar na Androidu? Klepněte na Google Calendar a uložte událost. Google může vyžadovat přihlášení.',
    'Sdílet soubor', 'Sdílení není dostupné. Stáhněte soubor.', 'Stáhnout znovu', 'Jak událost přidat',
  ],
  tr: [
    'İndirme başladı. İndirilenler’i kontrol edin.',
    '.ics dosyasını içe aktarmayı destekleyen bir takvim uygulamasında açın.',
    'Android’de Google Calendar mı? Google Calendar düğmesine dokunup etkinliği kaydedin. Google oturum açmanızı isteyebilir.',
    'Dosyayı paylaş', 'Paylaşım kullanılamıyor. Dosyayı indirin.', 'Tekrar indir', 'Nasıl eklenir',
  ],
  el: [
    'Η λήψη ξεκίνησε. Δείτε τις Λήψεις.',
    'Ανοίξτε το αρχείο .ics σε εφαρμογή ημερολογίου που υποστηρίζει εισαγωγή.',
    'Google Calendar σε Android; Πατήστε Google Calendar και αποθηκεύστε το συμβάν. Η Google μπορεί να ζητήσει σύνδεση.',
    'Κοινοποίηση αρχείου', 'Η κοινοποίηση δεν είναι διαθέσιμη. Κατεβάστε το αρχείο.', 'Λήψη ξανά', 'Πώς να το προσθέσετε',
  ],
  ro: [
    'Descărcare pornită. Verifică Descărcări.',
    'Deschide fișierul .ics într-o aplicație de calendar care permite importul.',
    'Google Calendar pe Android? Apasă Google Calendar și salvează evenimentul. Google poate cere autentificarea.',
    'Distribuie fișierul', 'Distribuirea nu este disponibilă. Descarcă fișierul.', 'Descarcă din nou', 'Cum îl adaugi',
  ],
  hu: [
    'Letöltés elindítva. Nézd meg a Letöltéseket.',
    'Nyisd meg az .ics-fájlt importálást támogató naptáralkalmazásban.',
    'Google Calendar Androidon? Koppints a Google Calendar gombra, majd mentsd az eseményt. A Google bejelentkezést kérhet.',
    'Fájl megosztása', 'A megosztás nem érhető el. Töltsd le a fájlt.', 'Letöltés újra', 'Így adhatod hozzá',
  ],
  uk: [
    'Завантаження почалося. Перевірте Завантаження.',
    'Відкрийте файл .ics у календарі, який підтримує імпорт.',
    'Google Calendar на Android? Натисніть Google Calendar і збережіть подію. Google може попросити ввійти в обліковий запис.',
    'Поділитися файлом', 'Поширення недоступне. Завантажте файл.', 'Завантажити знову', 'Як додати подію',
  ],
  ru: [
    'Скачивание началось. Проверьте Загрузки.',
    'Откройте файл .ics в приложении календаря с поддержкой импорта.',
    'Google Calendar на Android? Нажмите Google Calendar и сохраните событие. Google может попросить войти в аккаунт.',
    'Поделиться файлом', 'Поделиться не удалось. Скачайте файл.', 'Скачать снова', 'Как добавить событие',
  ],
  ar: [
    'بدأ التنزيل. تحقق من التنزيلات.',
    'افتح ملف .ics في تطبيق تقويم يدعم الاستيراد.',
    'تستخدم Google Calendar على Android؟ اضغط زر Google Calendar ثم احفظ الحدث. قد تطلب Google تسجيل الدخول.',
    'مشاركة الملف', 'المشاركة غير متاحة. نزّل الملف بدلاً من ذلك.', 'تنزيل مجددًا', 'طريقة الإضافة',
  ],
  he: [
    'ההורדה התחילה. יש לבדוק בהורדות.',
    'יש לפתוח את קובץ ה־.ics באפליקציית יומן שתומכת בייבוא.',
    'Google Calendar ב־Android? יש ללחוץ על Google Calendar ולשמור את האירוע. Google עשויה לבקש כניסה לחשבון.',
    'שיתוף קובץ', 'השיתוף אינו זמין. יש להוריד את הקובץ.', 'הורדה חוזרת', 'איך מוסיפים',
  ],
  hi: [
    'डाउनलोड शुरू हुआ। डाउनलोड फ़ोल्डर देखें।',
    '.ics फ़ाइल ऐसे कैलेंडर ऐप में खोलें जो आयात कर सके।',
    'Android पर Google Calendar? Google Calendar बटन दबाएँ और इवेंट सेव करें। Google साइन इन करने को कह सकता है।',
    'फ़ाइल शेयर करें', 'शेयर नहीं हो सकता। फ़ाइल डाउनलोड करें।', 'फिर डाउनलोड करें', 'कैसे जोड़ें',
  ],
  bn: [
    'ডাউনলোড শুরু হয়েছে। ডাউনলোড ফোল্ডার দেখুন।',
    'আমদানি সমর্থন করে এমন ক্যালেন্ডার অ্যাপে .ics ফাইলটি খুলুন।',
    'Android-এ Google Calendar? Google Calendar বোতামে চাপ দিয়ে ইভেন্টটি সেভ করুন। Google সাইন ইন করতে বলতে পারে।',
    'ফাইল শেয়ার করুন', 'শেয়ার করা যাচ্ছে না। ফাইলটি ডাউনলোড করুন।', 'আবার ডাউনলোড করুন', 'যেভাবে যোগ করবেন',
  ],
  id: [
    'Unduhan dimulai. Periksa Unduhan.',
    'Buka file .ics di aplikasi kalender yang mendukung impor.',
    'Google Calendar di Android? Ketuk Google Calendar, lalu simpan acara. Google mungkin meminta Anda login.',
    'Bagikan file', 'Tidak dapat berbagi. Unduh file ini.', 'Unduh lagi', 'Cara menambahkan',
  ],
  ms: [
    'Muat turun bermula. Semak Muat Turun.',
    'Buka fail .ics dalam aplikasi kalendar yang menyokong import.',
    'Google Calendar pada Android? Ketik Google Calendar, kemudian simpan acara. Google mungkin meminta anda log masuk.',
    'Kongsi fail', 'Perkongsian tidak tersedia. Muat turun fail.', 'Muat turun semula', 'Cara menambah',
  ],
  th: [
    'เริ่มดาวน์โหลดแล้ว ดูในรายการดาวน์โหลด',
    'เปิดไฟล์ .ics ด้วยแอปปฏิทินที่รองรับการนำเข้า',
    'ใช้ Google Calendar บน Android? แตะปุ่ม Google Calendar แล้วบันทึกกิจกรรม Google อาจขอให้ลงชื่อเข้าใช้',
    'แชร์ไฟล์', 'แชร์ไม่ได้ โปรดดาวน์โหลดไฟล์แทน', 'ดาวน์โหลดอีกครั้ง', 'วิธีเพิ่มลงปฏิทิน',
  ],
  vi: [
    'Đã bắt đầu tải. Kiểm tra mục Tải xuống.',
    'Mở tệp .ics bằng ứng dụng lịch hỗ trợ nhập tệp.',
    'Dùng Google Calendar trên Android? Nhấn Google Calendar rồi lưu sự kiện. Google có thể yêu cầu đăng nhập.',
    'Chia sẻ tệp', 'Không thể chia sẻ. Hãy tải tệp xuống.', 'Tải lại', 'Cách thêm vào lịch',
  ],
  ja: [
    'ダウンロードを開始しました。ダウンロード一覧をご確認ください。',
    '読み込みに対応したカレンダーアプリで .ics ファイルを開いてください。',
    'Android で Google Calendar をお使いですか？Google Calendar ボタンから予定を保存してください。Google へのログインが必要な場合があります。',
    'ファイルを共有', '共有できません。ファイルをダウンロードしてください。', '再ダウンロード', 'カレンダーへの追加方法',
  ],
  ko: [
    '다운로드를 시작했습니다. 다운로드 목록을 확인하세요.',
    '가져오기를 지원하는 캘린더 앱에서 .ics 파일을 여세요.',
    'Android에서 Google Calendar를 사용하시나요? Google Calendar 버튼을 누른 뒤 일정을 저장하세요. Google 로그인이 필요할 수 있습니다.',
    '파일 공유', '공유할 수 없습니다. 파일을 다운로드하세요.', '다시 다운로드', '캘린더에 추가하는 방법',
  ],
};

const catalogs = Object.fromEntries(Object.entries(rows).map(([lang, values]) => [lang, {
  ...Object.fromEntries(keys.map((key, index) => [key, values[index]])), google: 'Google Calendar',
}]));

export function calendarText(key, lang = 'en') {
  const language = String(lang).toLowerCase().split(/[-_]/)[0];
  return catalogs[language]?.[key] ?? catalogs.en[key] ?? key;
}
