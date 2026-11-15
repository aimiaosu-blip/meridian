// Local interface translations and bounded scheduling vocabulary.
const inputs = {
 el:{today:['σήμερα'],tomorrow:['αύριο'],nextWeek:['την επόμενη εβδομάδα','επόμενη εβδομάδα'],minutes:['λεπτά','λεπτό'],hours:['ώρες','ώρα'],host:['είμαι στην','είμαι στη','είμαι στο','βρίσκομαι στην','βρίσκομαι στο'],later:['αργότερα','πιο αργά'],earlier:['νωρίτερα','πιο νωρίς'],add:['πρόσθεσε','προσθήκη'],remove:['αφαίρεσε','αφαίρεση'],allowExtended:['και εκτός ωραρίου','επίτρεψε πρωινές και βραδινές ώρες'],workingOnly:['μόνο εντός ωραρίου','μόνο εργάσιμες ώρες'],weekdays:['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'],cities:{'Στοκχόλμη':'Stockholm','Σαγκάη':'Shanghai','Νέα Υόρκη':'New York','Νέα Υόρκη':'New York','Λονδίνο':'London','Τόκιο':'Tokyo','Αθήνα':'Athens'}},
 ro:{today:['astăzi','azi'],tomorrow:['mâine'],nextWeek:['săptămâna viitoare'],minutes:['minute','minut'],hours:['ore','oră'],host:['sunt în','mă aflu în'],later:['mai târziu'],earlier:['mai devreme'],add:['adaugă'],remove:['elimină','scoate'],allowExtended:['permite ore extinse','și în afara programului'],workingOnly:['doar în timpul programului','doar ore de lucru'],weekdays:['luni','marți','miercuri','joi','vineri','sâmbătă','duminică'],cities:{'Stockholm':'Stockholm','Shanghai':'Shanghai','New York':'New York','Londra':'London','Tokyo':'Tokyo'}},
 hu:{today:['ma'],tomorrow:['holnap'],nextWeek:['jövő héten','következő héten'],minutes:['perces','perc'],hours:['órás','óra'],host:['itt vagyok:','itt vagyok','jelenleg itt vagyok'],later:['később'],earlier:['korábban'],add:['add hozzá','hozzáadás'],remove:['távolítsd el','eltávolítás'],allowExtended:['munkaidőn kívül is','korai és késői időpontok is'],workingOnly:['csak munkaidőben'],weekdays:['hétfő','kedd','szerda','csütörtök','péntek','szombat','vasárnap'],cities:{'Stockholmban':'Stockholm','Stockholm':'Stockholm','Sanghajban':'Shanghai','Sanghaj':'Shanghai','New Yorkban':'New York','New York':'New York','Londonban':'London','London':'London','Tokióban':'Tokyo','Tokió':'Tokyo'}},
 uk:{today:['сьогодні'],tomorrow:['завтра'],nextWeek:['наступного тижня'],minutes:['хвилин','хвилини','хвилину','хв'],hours:['годин','години','годину'],host:['я перебуваю в','я перебуваю у','я в','я у'],later:['пізніше'],earlier:['раніше'],add:['додай','додати'],remove:['прибери','видали','видалити'],allowExtended:['дозволь ранній і пізній час','поза робочими годинами теж'],workingOnly:['лише в робочі години','тільки в робочий час'],weekdays:['понеділок','вівторок','середа','четвер','п’ятниця','субота','неділя'],cities:{'Стокгольмі':'Stockholm','Стокгольм':'Stockholm','Шанхаї':'Shanghai','Шанхаєм':'Shanghai','Шанхай':'Shanghai','Нью-Йорку':'New York','Нью-Йорком':'New York','Нью-Йорк':'New York','Лондоні':'London','Лондоном':'London','Лондон':'London','Токіо':'Tokyo'}},
 ru:{today:['сегодня'],tomorrow:['завтра'],nextWeek:['на следующей неделе','следующая неделя'],minutes:['минут','минуты','минуту','мин'],hours:['часов','часа','час'],host:['я нахожусь в','я в'],later:['позже','попозже'],earlier:['раньше','пораньше'],add:['добавь','добавить'],remove:['убери','удали','удалить'],allowExtended:['разреши раннее и позднее время','можно вне рабочих часов'],workingOnly:['только в рабочее время','только рабочие часы'],weekdays:['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'],cities:{'Стокгольме':'Stockholm','Стокгольм':'Stockholm','Шанхае':'Shanghai','Шанхаем':'Shanghai','Шанхай':'Shanghai','Нью-Йорке':'New York','Нью-Йорком':'New York','Нью-Йорк':'New York','Лондоне':'London','Лондоном':'London','Лондон':'London','Токио':'Tokyo'}},
 ar:{today:['اليوم'],tomorrow:['غدًا','غداً','غدا'],nextWeek:['الأسبوع القادم','الأسبوع المقبل'],minutes:['دقائق','دقيقة'],hours:['ساعات','ساعة'],host:['أنا في','انا في','موقعي في'],later:['لاحقًا','لاحقا','وقت متأخر'],earlier:['أبكر','وقت أبكر'],add:['أضف','اضف','إضافة'],remove:['احذف','أزل','إزالة'],allowExtended:['السماح بأوقات مبكرة ومتأخرة','خارج ساعات العمل أيضًا'],workingOnly:['ساعات العمل فقط','خلال ساعات العمل فقط'],weekdays:['الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت','الأحد'],cities:{'ستوكهولم':'Stockholm','شنغهاي':'Shanghai','نيويورك':'New York','لندن':'London','طوكيو':'Tokyo'}},
 he:{today:['היום'],tomorrow:['מחר'],nextWeek:['בשבוע הבא','שבוע הבא'],minutes:['דקות','דקה'],hours:['שעות','שעה'],host:['אני נמצא ב','אני נמצאת ב','אני ב'],later:['מאוחר יותר'],earlier:['מוקדם יותר'],add:['הוסף','הוסיפי','הוספה'],remove:['הסר','הסירי','הסרה'],allowExtended:['אפשר שעות מוקדמות ומאוחרות','גם מחוץ לשעות העבודה'],workingOnly:['רק בשעות העבודה'],weekdays:['יום שני','יום שלישי','יום רביעי','יום חמישי','יום שישי','יום שבת','יום ראשון'],cities:{'סטוקהולם':'Stockholm','שטוקהולם':'Stockholm','שנגחאי':'Shanghai','שנחאי':'Shanghai','ניו יורק':'New York','לונדון':'London','טוקיו':'Tokyo'}},
 hi:{today:['आज'],tomorrow:['कल'],nextWeek:['अगले सप्ताह','अगले हफ़्ते','अगले हफ्ते'],minutes:['मिनट'],hours:['घंटे','घंटा'],host:['मैं यहाँ हूँ:','मेरा स्थान','मैं हूं'],later:['बाद में','थोड़ा बाद'],earlier:['पहले','थोड़ा पहले'],add:['जोड़ें','जोड़ो'],remove:['हटाएँ','हटाएं','हटाओ'],allowExtended:['सुबह जल्दी और देर शाम भी','काम के समय के बाहर भी'],workingOnly:['केवल काम के समय में'],weekdays:['सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार','रविवार'],cities:{'स्टॉकहोम':'Stockholm','शंघाई':'Shanghai','न्यूयॉर्क':'New York','न्यू यॉर्क':'New York','लंदन':'London','टोक्यो':'Tokyo'}},
 bn:{today:['আজ'],tomorrow:['আগামীকাল'],nextWeek:['আগামী সপ্তাহে','পরের সপ্তাহে'],minutes:['মিনিট'],hours:['ঘণ্টা','ঘন্টা'],host:['আমার অবস্থান','আমি আছি'],later:['আরও পরে','পরে'],earlier:['আরও আগে','আগে'],add:['যোগ করুন','যোগ করো'],remove:['বাদ দিন','সরান'],allowExtended:['সকাল ও সন্ধ্যার সময়ও','কাজের সময়ের বাইরেও'],workingOnly:['শুধু কাজের সময়ে'],weekdays:['সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার','রবিবার'],cities:{'স্টকহোম':'Stockholm','সাংহাই':'Shanghai','নিউ ইয়র্ক':'New York','নিউইয়র্ক':'New York','লন্ডন':'London','টোকিও':'Tokyo'}},
 id:{today:['hari ini'],tomorrow:['besok'],nextWeek:['minggu depan','pekan depan'],minutes:['menit'],hours:['jam'],host:['saya berada di','saya di'],later:['lebih lambat','lebih sore'],earlier:['lebih awal'],add:['tambahkan','tambah'],remove:['hapus','keluarkan'],allowExtended:['izinkan di luar jam kerja','sertakan pagi dan malam'],workingOnly:['hanya jam kerja'],weekdays:['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'],cities:{'Stockholm':'Stockholm','Shanghai':'Shanghai','New York':'New York','London':'London','Tokyo':'Tokyo'}},
 ms:{today:['hari ini'],tomorrow:['esok'],nextWeek:['minggu depan','minggu hadapan'],minutes:['minit'],hours:['jam'],host:['saya berada di','saya di'],later:['lebih lewat'],earlier:['lebih awal'],add:['tambahkan','tambah'],remove:['buang','alih keluar'],allowExtended:['benarkan di luar waktu kerja','sertakan awal pagi dan malam'],workingOnly:['waktu kerja sahaja'],weekdays:['Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu','Ahad'],cities:{'Stockholm':'Stockholm','Shanghai':'Shanghai','New York':'New York','London':'London','Tokyo':'Tokyo'}},
 th:{today:['วันนี้'],tomorrow:['พรุ่งนี้'],nextWeek:['สัปดาห์หน้า','อาทิตย์หน้า'],minutes:['นาที'],hours:['ชั่วโมง'],host:['ฉันอยู่ที่','ฉันอยู่','ผมอยู่ที่','ผมอยู่'],later:['ช้าลง','เลื่อนออกไป'],earlier:['เร็วขึ้น','เลื่อนให้เร็วขึ้น'],add:['เพิ่ม'],remove:['นำออก','ลบ'],allowExtended:['รวมช่วงเช้าและค่ำ','อนุญาตนอกเวลางาน'],workingOnly:['เฉพาะเวลางาน'],weekdays:['วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์','วันอาทิตย์'],cities:{'สตอกโฮล์ม':'Stockholm','เซี่ยงไฮ้':'Shanghai','นิวยอร์ก':'New York','ลอนดอน':'London','โตเกียว':'Tokyo'}},
 vi:{today:['hôm nay'],tomorrow:['ngày mai'],nextWeek:['tuần sau','tuần tới'],minutes:['phút'],hours:['giờ','tiếng'],host:['tôi đang ở','tôi ở'],later:['muộn hơn','trễ hơn'],earlier:['sớm hơn'],add:['thêm'],remove:['bỏ','xóa'],allowExtended:['cho phép sáng sớm và tối muộn','cả ngoài giờ làm việc'],workingOnly:['chỉ trong giờ làm việc'],weekdays:['thứ hai','thứ ba','thứ tư','thứ năm','thứ sáu','thứ bảy','chủ nhật'],cities:{'Stockholm':'Stockholm','Thượng Hải':'Shanghai','New York':'New York','Luân Đôn':'London','London':'London','Tokyo':'Tokyo'}},
 ja:{today:['今日','本日'],tomorrow:['明日'],nextWeek:['来週'],minutes:['分間','分'],hours:['時間'],host:['現在地は','私は'],later:['もっと遅く','少し遅く','遅めに'],earlier:['もっと早く','少し早く','早めに'],add:['追加','加えて'],remove:['外して','削除'],allowExtended:['早朝と夜も含める','勤務時間外も可'],workingOnly:['勤務時間内のみ'],weekdays:['月曜日','火曜日','水曜日','木曜日','金曜日','土曜日','日曜日'],cities:{'ストックホルム':'Stockholm','上海':'Shanghai','ニューヨーク':'New York','ロンドン':'London','東京':'Tokyo'}},
 ko:{today:['오늘'],tomorrow:['내일'],nextWeek:['다음 주','다음주'],minutes:['분'],hours:['시간'],host:['현재 위치는','저는','나는'],later:['더 늦게','조금 늦게'],earlier:['더 일찍','조금 일찍'],add:['추가','추가해'],remove:['제외','삭제'],allowExtended:['이른 아침과 저녁도 포함','근무 시간 외도 허용'],workingOnly:['근무 시간 내에서만'],weekdays:['월요일','화요일','수요일','목요일','금요일','토요일','일요일'],cities:{'스톡홀름':'Stockholm','상하이':'Shanghai','뉴욕':'New York','런던':'London','도쿄':'Tokyo'}}
};

const keysB = ["Outside working hours · Early / late, 07:00–22:00", "Rest hours or a non-working day", "Within working hours", "Storage unavailable. This session still works.", "You", "home", "My teams", "How it works", "Find a time.<br><em>For everyone.</em>", "Across time zones.", "Help", "Describe your meeting", "Later? Shorter? Add a city…", "Stockholm → Shanghai, next week, 45 min…", "Find times", "My location", "City · date · duration", "Adjust", "Examples", "On-device · No account", "Your time", "Recommended", "Option {n}", "{n} joining outside working hours", "Within work hours", "Off hours", "Finding a good time…", "No future times remain on these dates", "No shared working-hours window", "Change the details or drag to explore.", "Include 07:00–22:00", "Choose a time", "Close options", "participants", "Adjust details", "Working hours only. No calendar access.", "Download .ics", "No invitations sent.", "Preview", "Found {n} options. Drag to adjust.", "No match. Change the details or drag to explore.", "Search failed. Try fewer dates.", "Use up to 20 people and 14 dates.", "Comparing local times…", "Past time. Move it forward.", "Times updated.", "Close", "Save a name and city.", "Monday to Friday", "EXAMPLE", "Plan a meeting", "Edit", "Delete", "Add a team or person", "Saved on this device. Examples are editable.", "Edit team or person", "Add team or person", "One entry per city.", "Name", "e.g. Asian sales team", "Location", "Work starts", "Work ends", "Mon–Fri. An earlier end means an overnight shift.", "Back", "Save", "My location & working hours", "Where will you be?", "I will be in", "Save location", "Adjust this meeting", "For this meeting only.", "From date", "Through date", "Duration (minutes)", "Starts", "Ends", "Add a city", "Add participant", "Include early / late hours (07:00–22:00)", "Include weekends", "Cancel", "Remove", "Choose a future meeting time.", "Save to calendar", "Import into Outlook, Google or Apple Calendar.", "Meeting title", "Cross-time-zone meeting", "Includes rest hours. Save anyway.", "Adds an event only. No invitations or video link.", "Quick guide", "Enter cities, a date and duration.", "Try “later”, “30 minutes” or “add Tokyo”.", "Drag a time bar. All clocks move together.", "Common meeting phrases only. Review the details.", "Daylight saving included. Calendars and holidays not checked.", "Saved on this device. No invitations sent.", "Choose valid and different work start and end times.", "Enter a name and choose a city.", "That name already exists. Choose a different name.", "You can save up to 100 teams or people.", "Choose a duration of 1–480 minutes and a date range of up to 14 days.", "Keep between 1 and 19 other participants.", "Calendar conflicts not checked. No invitations sent.", "Downloaded. Import the file into your calendar.", "Saved team removed.", "Add up to 19 other participants.", "Globe unavailable. Planning still works.", "English", "Language", "Search languages", "Working hours", "Early / late", "Rest hours", "Move the meeting across local clocks", "Drag to adjust. Arrow keys move 15 minutes.", "Move meeting 15 minutes earlier", "Move meeting 15 minutes later", "Pause rotation", "Start rotation", "Zoom in", "Zoom out", "Reset globe view", "Drag to explore · scroll to zoom", "Opening the world map…", "Reload map", "Map unavailable. Retry to load it.", "Invalid date. Try tomorrow or next week.", "Choose a supported city or saved team.", "Use a duration from 1 to 480 minutes.", "Generate options first, then drag to set an exact time.", "Some people were not recognized. Review the list.", "Schedule one meeting at a time.", "Local dates changed. Check the date range.", "Meeting time", "Drag a meeting window to update everyone’s time. Use arrow keys for 15-minute steps.", "This clock time occurs twice; using {n}.", "This time does not exist during a daylight-saving change. Choose another time.", "European pricing team", "Asian sales team", "New York pricing team"];
const rowsB = {
el: `Εκτός ωραρίου · Πρωί / βράδυ, 07:00–22:00
Ώρες ανάπαυσης ή αργία
Εντός ωραρίου
Η αποθήκευση δεν λειτουργεί. Μπορείτε να συνεχίσετε.
Εσείς
αρχική
Οι ομάδες μου
Πώς λειτουργεί
Βρείτε ώρα.<br><em>Για όλους.</em>
Σε κάθε ζώνη ώρας.
Βοήθεια
Περιγράψτε τη συνάντηση
Αργότερα; Συντομότερα; Προσθήκη πόλης…
Στοκχόλμη → Σαγκάη, επόμενη εβδομάδα, 45 λεπτά…
Εύρεση ώρας
Η τοποθεσία μου
Πόλη · ημερομηνία · διάρκεια
Αλλαγή
Παραδείγματα
Στη συσκευή · Χωρίς λογαριασμό
Η ώρα σας
Προτεινόμενη
Επιλογή {n}
{n} συμμετέχουν εκτός ωραρίου
Εντός ωραρίου
Εκτός ωραρίου
Αναζήτηση ώρας…
Δεν απομένουν μελλοντικές ώρες σε αυτές τις ημερομηνίες
Δεν υπάρχει κοινό ωράριο
Αλλάξτε τα στοιχεία ή σύρετε για εξερεύνηση.
Συμπερίληψη 07:00–22:00
Επιλέξτε ώρα
Κλείσιμο επιλογών
συμμετέχοντες
Αλλαγή στοιχείων
Βάσει ωραρίου. Χωρίς πρόσβαση σε ημερολόγια.
Λήψη .ics
Δεν αποστέλλονται προσκλήσεις.
Προεπισκόπηση
Βρέθηκαν {n} επιλογές. Σύρετε για αλλαγή.
Καμία αντιστοιχία. Αλλάξτε στοιχεία ή σύρετε.
Αποτυχία αναζήτησης. Δοκιμάστε λιγότερες ημερομηνίες.
Έως 20 άτομα και 14 ημερομηνίες.
Σύγκριση τοπικών ωρών…
Η ώρα έχει περάσει. Μετακινήστε αργότερα.
Οι ώρες ενημερώθηκαν.
Κλείσιμο
Αποθηκεύστε όνομα και πόλη.
Δευτέρα έως Παρασκευή
ΠΑΡΑΔΕΙΓΜΑ
Σχεδιασμός συνάντησης
Επεξεργασία
Διαγραφή
Προσθήκη ομάδας ή ατόμου
Αποθήκευση στη συσκευή. Τα παραδείγματα αλλάζουν.
Επεξεργασία ομάδας ή ατόμου
Προσθήκη ομάδας ή ατόμου
Μία εγγραφή ανά πόλη.
Όνομα
π.χ. ομάδα πωλήσεων Ασίας
Τοποθεσία
Έναρξη εργασίας
Λήξη εργασίας
Δευ–Παρ. Νωρίτερη λήξη σημαίνει νυχτερινή βάρδια.
Πίσω
Αποθήκευση
Τοποθεσία και ωράριό μου
Πού θα βρίσκεστε;
Θα βρίσκομαι σε
Αποθήκευση τοποθεσίας
Αλλαγή συνάντησης
Μόνο για αυτή τη συνάντηση.
Από ημερομηνία
Έως ημερομηνία
Διάρκεια (λεπτά)
Έναρξη
Λήξη
Προσθήκη πόλης
Προσθήκη συμμετέχοντα
Συμπερίληψη πρωινού / βραδινού χρόνου (07:00–22:00)
Συμπερίληψη Σαββατοκύριακου
Ακύρωση
Αφαίρεση
Επιλέξτε μελλοντική ώρα.
Αποθήκευση στο ημερολόγιο
Εισαγωγή σε Outlook, Google ή Apple Calendar.
Τίτλος συνάντησης
Συνάντηση μεταξύ ζωνών ώρας
Περιλαμβάνει ώρες ανάπαυσης. Αποθήκευση παρ’ όλα αυτά.
Προσθέτει μόνο συμβάν. Χωρίς προσκλήσεις ή σύνδεσμο βίντεο.
Σύντομος οδηγός
Εισαγάγετε πόλεις, ημερομηνία και διάρκεια.
Δοκιμάστε «αργότερα», «30 λεπτά» ή «πρόσθεσε Τόκιο».
Σύρετε τη λωρίδα ώρας. Όλα τα ρολόγια αλλάζουν μαζί.
Μόνο κοινές φράσεις συναντήσεων. Ελέγξτε τα στοιχεία.
Υπολογίζεται η θερινή ώρα. Δεν ελέγχονται ημερολόγια και αργίες.
Αποθήκευση στη συσκευή. Χωρίς προσκλήσεις.
Επιλέξτε έγκυρες, διαφορετικές ώρες έναρξης και λήξης.
Εισαγάγετε όνομα και επιλέξτε πόλη.
Το όνομα υπάρχει ήδη. Επιλέξτε άλλο.
Αποθηκεύστε έως 100 ομάδες ή άτομα.
Επιλέξτε 1–480 λεπτά και διάστημα έως 14 ημερών.
Διατηρήστε 1 έως 19 άλλους συμμετέχοντες.
Δεν ελέγχονται συγκρούσεις ημερολογίου. Χωρίς προσκλήσεις.
Έγινε λήψη. Εισαγάγετε το αρχείο στο ημερολόγιό σας.
Η αποθηκευμένη ομάδα αφαιρέθηκε.
Προσθέστε έως 19 άλλους συμμετέχοντες.
Η υδρόγειος δεν είναι διαθέσιμη. Ο σχεδιασμός λειτουργεί.
Αγγλικά
Γλώσσα
Αναζήτηση γλωσσών
Ώρες εργασίας
Πρωί / βράδυ
Ώρες ανάπαυσης
Μετακίνηση συνάντησης στα τοπικά ρολόγια
Σύρετε για αλλαγή. Τα βέλη μετακινούν κατά 15 λεπτά.
15 λεπτά νωρίτερα
15 λεπτά αργότερα
Παύση περιστροφής
Έναρξη περιστροφής
Μεγέθυνση
Σμίκρυνση
Επαναφορά υδρογείου
Σύρετε για εξερεύνηση · Κυλήστε για ζουμ
Άνοιγμα παγκόσμιου χάρτη…
Επαναφόρτωση χάρτη
Ο χάρτης δεν είναι διαθέσιμος. Δοκιμάστε ξανά.
Μη έγκυρη ημερομηνία. Δοκιμάστε αύριο ή επόμενη εβδομάδα.
Επιλέξτε υποστηριζόμενη πόλη ή αποθηκευμένη ομάδα.
Χρησιμοποιήστε διάρκεια 1–480 λεπτών.
Δημιουργήστε επιλογές και σύρετε για ακριβή ώρα.
Μερικά άτομα δεν αναγνωρίστηκαν. Ελέγξτε τη λίστα.
Προγραμματίστε μία συνάντηση τη φορά.
Οι τοπικές ημερομηνίες άλλαξαν. Ελέγξτε το διάστημα.
Ώρα συνάντησης
Σύρετε το πλαίσιο συνάντησης για ενημέρωση όλων. Τα βέλη αλλάζουν κατά 15 λεπτά.
Αυτή η ώρα εμφανίζεται δύο φορές· χρησιμοποιείται {n}.
Η ώρα δεν υπάρχει λόγω αλλαγής θερινής ώρας. Επιλέξτε άλλη.
Ευρωπαϊκή ομάδα τιμολόγησης
Ομάδα πωλήσεων Ασίας
Ομάδα τιμολόγησης Νέας Υόρκης`,
ro: `În afara programului · Devreme / târziu, 07:00–22:00
Ore de odihnă sau zi nelucrătoare
În timpul programului
Stocarea nu este disponibilă. Puteți continua.
Tu
acasă
Echipele mele
Cum funcționează
Găsește o oră.<br><em>Pentru toți.</em>
Dincolo de fusuri orare.
Ajutor
Descrie întâlnirea
Mai târziu? Mai scurt? Adaugă un oraș…
Stockholm → Shanghai, săptămâna viitoare, 45 minute…
Caută ore
Locația mea
Oraș · dată · durată
Ajustează
Exemple
Pe dispozitiv · Fără cont
Ora ta
Recomandat
Opțiunea {n}
{n} participă în afara programului
În timpul programului
În afara programului
Căutăm o oră potrivită…
Nu mai sunt ore viitoare în aceste date
Niciun interval comun de lucru
Modifică detaliile sau trage pentru a explora.
Include 07:00–22:00
Alege o oră
Închide opțiunile
participanți
Modifică detaliile
Doar programul de lucru. Fără acces la calendare.
Descarcă .ics
Nu se trimit invitații.
Previzualizare
Am găsit {n} opțiuni. Trage pentru a ajusta.
Nicio potrivire. Modifică detaliile sau trage.
Căutarea a eșuat. Încearcă mai puține date.
Maximum 20 de persoane și 14 date.
Comparăm orele locale…
Ora a trecut. Mut-o mai târziu.
Ore actualizate.
Închide
Salvează un nume și un oraș.
Luni–vineri
EXEMPLU
Planifică o întâlnire
Editează
Șterge
Adaugă echipă sau persoană
Salvat pe dispozitiv. Exemplele pot fi editate.
Editează echipa sau persoana
Adaugă echipă sau persoană
O înregistrare pentru fiecare oraș.
Nume
de ex. echipa de vânzări din Asia
Locație
Începutul programului
Sfârșitul programului
Lun–vin. Sfârșitul înaintea începutului indică o tură de noapte.
Înapoi
Salvează
Locația și programul meu
Unde vei fi?
Voi fi în
Salvează locația
Modifică întâlnirea
Doar pentru această întâlnire.
De la data
Până la data
Durată (minute)
Începe
Se termină
Adaugă un oraș
Adaugă participant
Include ore devreme / târziu (07:00–22:00)
Include weekendurile
Anulează
Elimină
Alege o oră în viitor.
Salvează în calendar
Importă în Outlook, Google sau Apple Calendar.
Titlul întâlnirii
Întâlnire între fusuri orare
Include ore de odihnă. Salvează oricum.
Adaugă doar un eveniment. Fără invitații sau link video.
Ghid rapid
Introdu orașe, o dată și durata.
Încearcă „mai târziu”, „30 minute” sau „adaugă Tokyo”.
Trage bara de timp. Toate ceasurile se schimbă împreună.
Doar expresii uzuale pentru întâlniri. Verifică detaliile.
Include ora de vară. Calendarele și sărbătorile nu sunt verificate.
Salvat pe dispozitiv. Fără invitații.
Alege ore valide și diferite pentru început și sfârșit.
Introdu un nume și alege un oraș.
Numele există deja. Alege alt nume.
Poți salva maximum 100 de echipe sau persoane.
Alege 1–480 de minute și un interval de maximum 14 zile.
Păstrează între 1 și 19 alți participanți.
Conflictele din calendar nu sunt verificate. Fără invitații.
Descărcat. Importă fișierul în calendar.
Echipa salvată a fost eliminată.
Adaugă maximum 19 alți participanți.
Globul nu este disponibil. Planificarea funcționează.
Engleză
Limbă
Caută limbi
Program de lucru
Devreme / târziu
Ore de odihnă
Mută întâlnirea pe ceasurile locale
Trage pentru a ajusta. Săgețile mută cu 15 minute.
Mută întâlnirea cu 15 minute mai devreme
Mută întâlnirea cu 15 minute mai târziu
Oprește rotația
Pornește rotația
Mărește
Micșorează
Resetează globul
Trage pentru a explora · Derulează pentru zoom
Deschidem harta lumii…
Reîncarcă harta
Harta nu este disponibilă. Încearcă din nou.
Dată invalidă. Încearcă mâine sau săptămâna viitoare.
Alege un oraș acceptat sau o echipă salvată.
Folosește o durată de 1–480 de minute.
Generează opțiuni, apoi trage pentru ora exactă.
Unele persoane nu au fost recunoscute. Verifică lista.
Planifică o singură întâlnire odată.
Datele locale s-au schimbat. Verifică intervalul.
Ora întâlnirii
Trage intervalul întâlnirii pentru a actualiza toate orele. Săgețile mută cu 15 minute.
Această oră apare de două ori; se folosește {n}.
Ora nu există la schimbarea orei de vară. Alege alta.
Echipa europeană de prețuri
Echipa de vânzări din Asia
Echipa de prețuri din New York`,
hu: `Munkaidőn kívül · Korán / későn, 07:00–22:00
Pihenőidő vagy munkaszüneti nap
Munkaidőben
A tárolás nem érhető el. Folytathatja a használatot.
Ön
kezdőlap
Csapataim
Így működik
Találjon időpontot.<br><em>Mindenkinek.</em>
Időzónákon át.
Súgó
Írja le a megbeszélést
Később? Rövidebben? Új város…
Stockholm → Sanghaj, jövő héten, 45 perc…
Időpontkeresés
Saját hely
Város · dátum · időtartam
Módosítás
Példák
Ezen az eszközön · Fiók nélkül
Saját idő
Ajánlott
{n}. lehetőség
{n} résztvevő munkaidőn kívül
Munkaidőben
Munkaidőn kívül
Megfelelő időpont keresése…
Ezeken a napokon nincs jövőbeli időpont
Nincs közös munkaidő
Módosítsa az adatokat, vagy húzza az idősávot.
07:00–22:00 bevonása
Válasszon időpontot
Lehetőségek bezárása
résztvevő
Adatok módosítása
Csak munkaidő alapján. Naptárhozzáférés nélkül.
.ics letöltése
Nem küldünk meghívókat.
Előnézet
{n} lehetőség. Húzással módosítható.
Nincs találat. Módosítsa az adatokat, vagy húzza a sávot.
Sikertelen keresés. Próbáljon kevesebb dátumot.
Legfeljebb 20 fő és 14 dátum.
Helyi idők összevetése…
Elmúlt időpont. Helyezze későbbre.
Időpontok frissítve.
Bezárás
Mentsen nevet és várost.
Hétfőtől péntekig
PÉLDA
Megbeszélés tervezése
Szerkesztés
Törlés
Csapat vagy személy hozzáadása
Az eszközön mentve. A példák szerkeszthetők.
Csapat vagy személy szerkesztése
Csapat vagy személy hozzáadása
Városonként egy bejegyzés.
Név
pl. ázsiai értékesítési csapat
Hely
Munkaidő kezdete
Munkaidő vége
H–P. A korábbi befejezés éjszakai műszakot jelöl.
Vissza
Mentés
Saját hely és munkaidő
Hol lesz?
Itt leszek
Hely mentése
Megbeszélés módosítása
Csak erre a megbeszélésre.
Kezdő dátum
Záró dátum
Időtartam (perc)
Kezdés
Befejezés
Város hozzáadása
Résztvevő hozzáadása
Korai / késői időpontok is (07:00–22:00)
Hétvégék is
Mégse
Eltávolítás
Válasszon jövőbeli időpontot.
Mentés a naptárba
Importálás Outlook, Google vagy Apple Naptárba.
Megbeszélés címe
Megbeszélés időzónák között
Pihenőidőt is érint. Mentés így is.
Csak eseményt ad hozzá. Meghívó és videóhivatkozás nélkül.
Gyors útmutató
Adja meg a városokat, dátumot és időtartamot.
Próbálja: „később”, „30 perc” vagy „add hozzá Tokió”.
Húzza az idősávot. Minden óra együtt változik.
Csak gyakori kifejezések. Ellenőrizze az adatokat.
Óraátállítás figyelembe véve. Naptárak és ünnepnapok ellenőrzése nélkül.
Az eszközön mentve. Nem küldünk meghívókat.
Adjon meg érvényes, eltérő kezdő és záró időpontot.
Adjon meg nevet és válasszon várost.
Ez a név már létezik. Válasszon másikat.
Legfeljebb 100 csapat vagy személy menthető.
Válasszon 1–480 percet és legfeljebb 14 napot.
1–19 további résztvevő legyen.
Naptárütközések ellenőrzése nélkül. Nincs meghívóküldés.
Letöltve. Importálja a fájlt a naptárába.
Mentett csapat eltávolítva.
Legfeljebb 19 további résztvevő adható hozzá.
A földgömb nem érhető el. A tervezés működik.
Angol
Nyelv
Nyelvek keresése
Munkaidő
Korán / későn
Pihenőidő
Megbeszélés mozgatása a helyi órákon
Húzza a módosításhoz. A nyilak 15 percet lépnek.
15 perccel korábbra
15 perccel későbbre
Forgás szüneteltetése
Forgás indítása
Nagyítás
Kicsinyítés
Földgömb visszaállítása
Húzás: felfedezés · Görgetés: nagyítás
Világtérkép megnyitása…
Térkép újratöltése
A térkép nem érhető el. Próbálja újra.
Érvénytelen dátum. Próbálja: holnap vagy jövő héten.
Válasszon támogatott várost vagy mentett csapatot.
Az időtartam 1–480 perc lehet.
Előbb keressen időpontokat, majd húzással pontosítsa.
Néhány személy nem ismerhető fel. Ellenőrizze a listát.
Egyszerre egy megbeszélést tervezzen.
A helyi dátumok megváltoztak. Ellenőrizze a tartományt.
Megbeszélés ideje
Húzza a megbeszélés sávját az összes óra frissítéséhez. A nyilak 15 percet lépnek.
Ez az idő kétszer fordul elő; ezt használjuk: {n}.
Ez az idő nem létezik az óraátállításkor. Válasszon másikat.
Európai árazási csapat
Ázsiai értékesítési csapat
New York-i árazási csapat`,
uk: `Поза робочим часом · Рано / пізно, 07:00–22:00
Час відпочинку або вихідний
У робочий час
Сховище недоступне. Можна продовжити.
Ви
головна
Мої команди
Як це працює
Знайдіть час.<br><em>Для всіх.</em>
Між часовими поясами.
Допомога
Опишіть зустріч
Пізніше? Коротше? Додати місто…
Стокгольм → Шанхай, наступного тижня, 45 хвилин…
Знайти час
Моє розташування
Місто · дата · тривалість
Змінити
Приклади
На пристрої · Без облікового запису
Ваш час
Рекомендовано
Варіант {n}
{n} учасників поза робочим часом
У робочий час
Поза робочим часом
Шукаємо зручний час…
На ці дати не залишилося майбутніх годин
Немає спільного робочого часу
Змініть дані або перетягніть шкалу.
Включити 07:00–22:00
Виберіть час
Закрити варіанти
учасники
Змінити дані
Лише за робочими годинами. Без доступу до календарів.
Завантажити .ics
Запрошення не надсилаються.
Перегляд
Знайдено {n} варіантів. Перетягніть для зміни.
Немає збігів. Змініть дані або перетягніть шкалу.
Помилка пошуку. Спробуйте менше дат.
До 20 осіб і 14 дат.
Порівнюємо місцевий час…
Цей час минув. Перенесіть на пізніше.
Час оновлено.
Закрити
Збережіть назву та місто.
Понеділок–п’ятниця
ПРИКЛАД
Запланувати зустріч
Редагувати
Видалити
Додати команду або особу
Збережено на пристрої. Приклади можна редагувати.
Редагувати команду або особу
Додати команду або особу
Один запис на місто.
Назва
напр. відділ продажів Азії
Розташування
Початок роботи
Кінець роботи
Пн–пт. Раніше завершення означає нічну зміну.
Назад
Зберегти
Моє розташування та робочі години
Де ви будете?
Я буду в
Зберегти розташування
Змінити зустріч
Лише для цієї зустрічі.
Початкова дата
Кінцева дата
Тривалість (хвилини)
Початок
Кінець
Додати місто
Додати учасника
Включити ранні / пізні години (07:00–22:00)
Включити вихідні
Скасувати
Прибрати
Виберіть майбутній час зустрічі.
Зберегти в календар
Імпортуйте в Outlook, Google або Apple Calendar.
Назва зустрічі
Зустріч між часовими поясами
Включає час відпочинку. Зберегти все одно.
Лише подія. Без запрошень і відеопосилання.
Короткий посібник
Введіть міста, дату та тривалість.
Спробуйте «пізніше», «30 хвилин» або «додай Токіо».
Перетягніть шкалу. Усі годинники рухаються разом.
Лише поширені фрази для зустрічей. Перевірте дані.
Літній час враховано. Календарі та свята не перевіряються.
Збережено на пристрої. Без запрошень.
Виберіть коректні й різні години початку та завершення.
Введіть назву та виберіть місто.
Така назва вже є. Виберіть іншу.
Можна зберегти до 100 команд або осіб.
Виберіть 1–480 хвилин і період до 14 днів.
Залиште від 1 до 19 інших учасників.
Конфлікти календаря не перевіряються. Без запрошень.
Завантажено. Імпортуйте файл у свій календар.
Збережену команду видалено.
Додайте до 19 інших учасників.
Глобус недоступний. Планування працює.
Англійська
Мова
Пошук мов
Робочий час
Рано / пізно
Час відпочинку
Пересувайте зустріч на місцевих годинниках
Перетягніть для зміни. Стрілки зсувають на 15 хвилин.
На 15 хвилин раніше
На 15 хвилин пізніше
Призупинити обертання
Почати обертання
Збільшити
Зменшити
Скинути вигляд глобуса
Перетягніть для огляду · Прокрутіть для масштабу
Відкриваємо карту світу…
Перезавантажити карту
Карта недоступна. Спробуйте ще раз.
Некоректна дата. Спробуйте завтра або наступного тижня.
Виберіть підтримуване місто або збережену команду.
Вкажіть тривалість від 1 до 480 хвилин.
Спочатку знайдіть варіанти, потім перетягніть до потрібного часу.
Деяких осіб не розпізнано. Перевірте список.
Плануйте одну зустріч за раз.
Місцеві дати змінилися. Перевірте період.
Час зустрічі
Перетягніть вікно зустрічі, щоб оновити час усіх. Стрілки змінюють час на 15 хвилин.
Цей час трапляється двічі; використовується {n}.
Цього часу немає під час переходу на літній час. Виберіть інший.
Європейська команда ціноутворення
Відділ продажів Азії
Команда ціноутворення Нью-Йорка`,
ru: `Вне рабочего времени · Рано / поздно, 07:00–22:00
Время отдыха или выходной
В рабочее время
Хранилище недоступно. Можно продолжить.
Вы
главная
Мои команды
Как это работает
Найдите время.<br><em>Для всех.</em>
Между часовыми поясами.
Помощь
Опишите встречу
Позже? Короче? Добавить город…
Стокгольм → Шанхай, на следующей неделе, 45 минут…
Найти время
Моё местоположение
Город · дата · длительность
Изменить
Примеры
На устройстве · Без регистрации
Ваше время
Рекомендуем
Вариант {n}
{n} участников вне рабочего времени
В рабочее время
Вне рабочего времени
Ищем удобное время…
На эти даты не осталось будущих часов
Нет общего рабочего времени
Измените данные или перетащите шкалу.
Включить 07:00–22:00
Выберите время
Закрыть варианты
участники
Изменить данные
Только по рабочим часам. Без доступа к календарям.
Скачать .ics
Приглашения не отправляются.
Просмотр
Найдено {n} вариантов. Перетащите для изменения.
Совпадений нет. Измените данные или перетащите шкалу.
Ошибка поиска. Попробуйте меньше дат.
До 20 человек и 14 дат.
Сравниваем местное время…
Это время прошло. Перенесите на позже.
Время обновлено.
Закрыть
Сохраните имя и город.
Понедельник–пятница
ПРИМЕР
Запланировать встречу
Изменить
Удалить
Добавить команду или человека
Сохранено на устройстве. Примеры можно редактировать.
Изменить команду или человека
Добавить команду или человека
Одна запись на город.
Имя
напр. отдел продаж Азии
Местоположение
Начало работы
Конец работы
Пн–пт. Более ранний конец означает ночную смену.
Назад
Сохранить
Моё местоположение и рабочие часы
Где вы будете?
Я буду в
Сохранить местоположение
Изменить встречу
Только для этой встречи.
Начальная дата
Конечная дата
Длительность (минуты)
Начало
Конец
Добавить город
Добавить участника
Включить ранние / поздние часы (07:00–22:00)
Включить выходные
Отмена
Убрать
Выберите будущее время встречи.
Сохранить в календарь
Импортируйте в Outlook, Google или Apple Calendar.
Название встречи
Встреча между часовыми поясами
Включает время отдыха. Всё равно сохранить.
Только событие. Без приглашений и видеоссылки.
Краткое руководство
Введите города, дату и длительность.
Попробуйте «позже», «30 минут» или «добавь Токио».
Перетащите шкалу. Все часы меняются вместе.
Только распространённые фразы для встреч. Проверьте данные.
Летнее время учтено. Календари и праздники не проверяются.
Сохранено на устройстве. Без приглашений.
Выберите допустимые и разные часы начала и конца работы.
Введите имя и выберите город.
Такое имя уже есть. Выберите другое.
Можно сохранить до 100 команд или людей.
Выберите 1–480 минут и период до 14 дней.
Оставьте от 1 до 19 других участников.
Конфликты календаря не проверяются. Без приглашений.
Скачано. Импортируйте файл в свой календарь.
Сохранённая команда удалена.
Добавьте до 19 других участников.
Глобус недоступен. Планирование работает.
Английский
Язык
Поиск языков
Рабочее время
Рано / поздно
Время отдыха
Передвигайте встречу по местным часам
Перетащите для изменения. Стрелки сдвигают на 15 минут.
На 15 минут раньше
На 15 минут позже
Приостановить вращение
Начать вращение
Приблизить
Отдалить
Сбросить вид глобуса
Перетащите для обзора · Прокрутите для масштаба
Открываем карту мира…
Перезагрузить карту
Карта недоступна. Попробуйте ещё раз.
Неверная дата. Попробуйте завтра или на следующей неделе.
Выберите поддерживаемый город или сохранённую команду.
Укажите длительность от 1 до 480 минут.
Сначала найдите варианты, затем перетащите для точного времени.
Некоторые люди не распознаны. Проверьте список.
Планируйте по одной встрече за раз.
Местные даты изменились. Проверьте период.
Время встречи
Перетащите окно встречи, чтобы обновить время всех. Стрелки меняют время на 15 минут.
Это время встречается дважды; используется {n}.
Такого времени нет при переходе на летнее время. Выберите другое.
Европейская команда ценообразования
Отдел продаж Азии
Команда ценообразования Нью-Йорка`,
ar: `خارج ساعات العمل · مبكر / متأخر، 07:00–22:00
وقت راحة أو يوم عطلة
ضمن ساعات العمل
التخزين غير متاح. يمكنك المتابعة.
أنت
الرئيسية
فرقي
كيف يعمل
اختر وقتًا.<br><em>يناسب الجميع.</em>
عبر المناطق الزمنية.
مساعدة
صِف اجتماعك
لاحقًا؟ أقصر؟ أضف مدينة…
ستوكهولم → شنغهاي، الأسبوع القادم، 45 دقيقة…
ابحث عن أوقات
موقعي
المدينة · التاريخ · المدة
تعديل
أمثلة
على جهازك · دون حساب
وقتك
مقترح
الخيار {n}
{n} يشاركون خارج ساعات العمل
ضمن ساعات العمل
خارج ساعات العمل
نبحث عن وقت مناسب…
لا توجد أوقات مستقبلية في هذه التواريخ
لا توجد ساعات عمل مشتركة
عدّل التفاصيل أو اسحب للاستكشاف.
تضمين 07:00–22:00
اختر وقتًا
إغلاق الخيارات
مشاركون
تعديل التفاصيل
حسب ساعات العمل فقط. دون الوصول للتقويم.
تنزيل .ics
لا تُرسل دعوات.
معاينة
وجدنا {n} خيارات. اسحب للتعديل.
لا توجد نتيجة. عدّل التفاصيل أو اسحب.
فشل البحث. جرّب تواريخ أقل.
حتى 20 شخصًا و14 تاريخًا.
نقارن الأوقات المحلية…
هذا الوقت مضى. انقله إلى وقت لاحق.
تم تحديث الأوقات.
إغلاق
احفظ اسمًا ومدينة.
من الاثنين إلى الجمعة
مثال
خطط لاجتماع
تعديل
حذف
إضافة فريق أو شخص
محفوظ على جهازك. يمكن تعديل الأمثلة.
تعديل فريق أو شخص
إضافة فريق أو شخص
إدخال واحد لكل مدينة.
الاسم
مثلًا: فريق مبيعات آسيا
الموقع
بداية العمل
نهاية العمل
الاثنين–الجمعة. نهاية أبكر تعني وردية ليلية.
رجوع
حفظ
موقعي وساعات عملي
أين ستكون؟
سأكون في
حفظ الموقع
تعديل الاجتماع
لهذا الاجتماع فقط.
من تاريخ
إلى تاريخ
المدة بالدقائق
البداية
النهاية
إضافة مدينة
إضافة مشارك
تضمين الأوقات المبكرة / المتأخرة (07:00–22:00)
تضمين عطلة نهاية الأسبوع
إلغاء
إزالة
اختر وقت اجتماع في المستقبل.
حفظ في التقويم
استورد الملف إلى Outlook أو Google أو Apple Calendar.
عنوان الاجتماع
اجتماع عبر المناطق الزمنية
يشمل وقت الراحة. احفظ رغم ذلك.
تُضاف فعالية فقط. دون دعوات أو رابط فيديو.
دليل سريع
أدخل المدن والتاريخ والمدة.
جرّب «لاحقًا» أو «30 دقيقة» أو «أضف طوكيو».
اسحب شريط الوقت. تتحرك الساعات معًا.
عبارات اجتماعات شائعة فقط. راجع التفاصيل.
يشمل التوقيت الصيفي. لا تُفحص التقاويم والعطلات.
محفوظ على جهازك. لا تُرسل دعوات.
اختر وقتَي بداية ونهاية صالحين ومختلفين.
أدخل اسمًا واختر مدينة.
الاسم موجود بالفعل. اختر اسمًا آخر.
يمكنك حفظ حتى 100 فريق أو شخص.
اختر مدة 1–480 دقيقة وفترة لا تتجاوز 14 يومًا.
أبقِ بين 1 و19 مشاركًا آخر.
لا تُفحص تعارضات التقويم. لا تُرسل دعوات.
تم التنزيل. استورد الملف إلى تقويمك.
تمت إزالة الفريق المحفوظ.
أضف حتى 19 مشاركًا آخر.
الكرة الأرضية غير متاحة. التخطيط يعمل.
الإنجليزية
اللغة
البحث عن لغة
ساعات العمل
مبكر / متأخر
وقت الراحة
حرّك الاجتماع عبر الساعات المحلية
اسحب للتعديل. الأسهم تغيّر الوقت بمقدار 15 دقيقة.
تقديم الاجتماع 15 دقيقة
تأخير الاجتماع 15 دقيقة
إيقاف الدوران
بدء الدوران
تكبير
تصغير
إعادة ضبط الكرة الأرضية
اسحب للاستكشاف · مرّر للتكبير
نفتح خريطة العالم…
إعادة تحميل الخريطة
الخريطة غير متاحة. أعد المحاولة.
تاريخ غير صالح. جرّب غدًا أو الأسبوع القادم.
اختر مدينة مدعومة أو فريقًا محفوظًا.
استخدم مدة من 1 إلى 480 دقيقة.
أنشئ الخيارات أولًا، ثم اسحب لضبط الوقت.
لم يتم التعرّف على بعض الأشخاص. راجع القائمة.
خطط لاجتماع واحد في كل مرة.
تغيّرت التواريخ المحلية. راجع الفترة.
وقت الاجتماع
اسحب نافذة الاجتماع لتحديث وقت الجميع. الأسهم تغيّر الوقت بمقدار 15 دقيقة.
يتكرر هذا الوقت مرتين؛ سيتم استخدام {n}.
هذا الوقت غير موجود عند تغيير التوقيت الصيفي. اختر وقتًا آخر.
فريق التسعير الأوروبي
فريق مبيعات آسيا
فريق التسعير في نيويورك`,
he: `מחוץ לשעות העבודה · מוקדם / מאוחר, 07:00–22:00
שעות מנוחה או יום חופש
בשעות העבודה
האחסון אינו זמין. אפשר להמשיך.
אתם
בית
הצוותים שלי
איך זה עובד
מצאו זמן.<br><em>לכולם.</em>
מעבר לאזורי זמן.
עזרה
תארו את הפגישה
מאוחר יותר? קצר יותר? הוספת עיר…
סטוקהולם → שנגחאי, בשבוע הבא, 45 דקות…
מציאת זמנים
המיקום שלי
עיר · תאריך · משך
התאמה
דוגמאות
במכשיר · ללא חשבון
השעה שלכם
מומלץ
אפשרות {n}
{n} משתתפים מחוץ לשעות העבודה
בשעות העבודה
מחוץ לשעות העבודה
מחפשים זמן מתאים…
לא נותרו זמנים עתידיים בתאריכים אלה
אין שעות עבודה משותפות
שנו פרטים או גררו כדי לבדוק.
כולל 07:00–22:00
בחרו זמן
סגירת האפשרויות
משתתפים
שינוי פרטים
לפי שעות העבודה בלבד. ללא גישה ליומנים.
הורדת .ics
לא נשלחות הזמנות.
תצוגה מקדימה
נמצאו {n} אפשרויות. גררו להתאמה.
אין התאמה. שנו פרטים או גררו.
החיפוש נכשל. נסו פחות תאריכים.
עד 20 אנשים ו־14 תאריכים.
משווים שעות מקומיות…
הזמן עבר. הזיזו קדימה.
הזמנים עודכנו.
סגירה
שמרו שם ועיר.
שני עד שישי
דוגמה
תכנון פגישה
עריכה
מחיקה
הוספת צוות או אדם
נשמר במכשיר. ניתן לערוך דוגמאות.
עריכת צוות או אדם
הוספת צוות או אדם
רשומה אחת לכל עיר.
שם
למשל: צוות מכירות אסיה
מיקום
תחילת העבודה
סיום העבודה
שני–שישי. סיום מוקדם מההתחלה מציין משמרת לילה.
חזרה
שמירה
המיקום ושעות העבודה שלי
איפה תהיו?
אהיה ב
שמירת מיקום
שינוי הפגישה
לפגישה הזאת בלבד.
מתאריך
עד תאריך
משך בדקות
התחלה
סיום
הוספת עיר
הוספת משתתף
כולל שעות מוקדמות / מאוחרות (07:00–22:00)
כולל סופי שבוע
ביטול
הסרה
בחרו זמן עתידי לפגישה.
שמירה ביומן
ייבוא ל־Outlook, Google או Apple Calendar.
כותרת הפגישה
פגישה בין אזורי זמן
כולל שעות מנוחה. שמירה בכל זאת.
נוסף אירוע בלבד. ללא הזמנות או קישור וידאו.
מדריך קצר
הזינו ערים, תאריך ומשך.
נסו „מאוחר יותר”, „30 דקות” או „הוסף טוקיו”.
גררו את סרגל הזמן. כל השעונים נעים יחד.
ביטויי פגישות נפוצים בלבד. בדקו את הפרטים.
שעון קיץ נלקח בחשבון. יומנים וחגים לא נבדקים.
נשמר במכשיר. לא נשלחות הזמנות.
בחרו שעות התחלה וסיום תקינות ושונות.
הזינו שם ובחרו עיר.
השם כבר קיים. בחרו שם אחר.
אפשר לשמור עד 100 צוותים או אנשים.
בחרו 1–480 דקות וטווח של עד 14 ימים.
השאירו בין 1 ל־19 משתתפים נוספים.
התנגשויות ביומן לא נבדקות. לא נשלחות הזמנות.
הורד. ייבאו את הקובץ ליומן.
הצוות השמור הוסר.
הוסיפו עד 19 משתתפים נוספים.
הגלובוס אינו זמין. התכנון פועל.
אנגלית
שפה
חיפוש שפות
שעות עבודה
מוקדם / מאוחר
שעות מנוחה
הזיזו את הפגישה בשעונים המקומיים
גררו להתאמה. החצים מזיזים ב־15 דקות.
הקדמת הפגישה ב־15 דקות
דחיית הפגישה ב־15 דקות
השהיית הסיבוב
התחלת הסיבוב
התקרבות
התרחקות
איפוס תצוגת הגלובוס
גררו לסיור · גללו לשינוי גודל
פותחים את מפת העולם…
טעינת המפה מחדש
המפה אינה זמינה. נסו שוב.
תאריך שגוי. נסו מחר או בשבוע הבא.
בחרו עיר נתמכת או צוות שמור.
השתמשו במשך של 1 עד 480 דקות.
תחילה צרו אפשרויות, ואז גררו לשעה מדויקת.
חלק מהאנשים לא זוהו. בדקו את הרשימה.
תכננו פגישה אחת בכל פעם.
התאריכים המקומיים השתנו. בדקו את הטווח.
זמן הפגישה
גררו את חלון הפגישה לעדכון הזמן של כולם. החצים מזיזים ב־15 דקות.
השעה הזאת מופיעה פעמיים; נשתמש ב־{n}.
השעה אינה קיימת במעבר לשעון קיץ. בחרו שעה אחרת.
צוות התמחור האירופי
צוות מכירות אסיה
צוות התמחור בניו יורק`,
hi: `काम के समय से बाहर · सुबह / शाम, 07:00–22:00
आराम का समय या छुट्टी
काम के समय में
सेव करने की सुविधा उपलब्ध नहीं। आप जारी रख सकते हैं।
आप
होम
मेरी टीमें
कैसे काम करता है
समय चुनें।<br><em>सबके लिए।</em>
हर समय क्षेत्र में।
मदद
अपनी मीटिंग बताएँ
बाद में? छोटी मीटिंग? शहर जोड़ें…
स्टॉकहोम → शंघाई, अगले सप्ताह, 45 मिनट…
समय खोजें
मेरा स्थान
शहर · तारीख · अवधि
बदलें
उदाहरण
डिवाइस पर · बिना खाते के
आपका समय
सुझाव
विकल्प {n}
{n} लोग काम के समय से बाहर जुड़ेंगे
काम के समय में
काम के समय से बाहर
सही समय खोज रहे हैं…
इन तारीखों पर कोई भविष्य का समय नहीं बचा
काम का कोई साझा समय नहीं
जानकारी बदलें या खींचकर देखें।
07:00–22:00 शामिल करें
समय चुनें
विकल्प बंद करें
प्रतिभागी
जानकारी बदलें
केवल काम के समय के आधार पर। कैलेंडर एक्सेस नहीं।
.ics डाउनलोड करें
निमंत्रण नहीं भेजे जाते।
पूर्वावलोकन
{n} विकल्प मिले। बदलने के लिए खींचें।
कोई मेल नहीं। जानकारी बदलें या खींचें।
खोज असफल। कम तारीखें चुनें।
अधिकतम 20 लोग और 14 तारीखें।
स्थानीय समय की तुलना हो रही है…
यह समय बीत चुका है। आगे बढ़ाएँ।
समय अपडेट हुए।
बंद करें
नाम और शहर सेव करें।
सोमवार से शुक्रवार
उदाहरण
मीटिंग तय करें
संपादित करें
मिटाएँ
टीम या व्यक्ति जोड़ें
इसी डिवाइस पर सेव। उदाहरण बदल सकते हैं।
टीम या व्यक्ति बदलें
टीम या व्यक्ति जोड़ें
हर शहर के लिए एक प्रविष्टि।
नाम
जैसे एशिया बिक्री टीम
स्थान
काम शुरू
काम समाप्त
सोम–शुक्र। समाप्ति पहले होने का अर्थ रात की शिफ्ट है।
वापस
सेव करें
मेरा स्थान और काम का समय
आप कहाँ होंगे?
मैं यहाँ होऊँगा
स्थान सेव करें
मीटिंग बदलें
केवल इस मीटिंग के लिए।
शुरू की तारीख
अंतिम तारीख
अवधि (मिनट)
शुरू
समाप्त
शहर जोड़ें
प्रतिभागी जोड़ें
सुबह / शाम का समय शामिल करें (07:00–22:00)
सप्ताहांत शामिल करें
रद्द करें
हटाएँ
भविष्य का मीटिंग समय चुनें।
कैलेंडर में सेव करें
Outlook, Google या Apple Calendar में आयात करें।
मीटिंग का नाम
अलग समय क्षेत्रों की मीटिंग
आराम का समय शामिल है। फिर भी सेव करें।
केवल इवेंट जुड़ेगा। निमंत्रण या वीडियो लिंक नहीं।
त्वरित गाइड
शहर, तारीख और अवधि डालें।
“बाद में”, “30 मिनट” या “टोक्यो जोड़ें” आज़माएँ।
समय पट्टी खींचें। सभी घड़ियाँ साथ बदलेंगी।
केवल सामान्य मीटिंग वाक्यांश। जानकारी जाँचें।
डेलाइट सेविंग शामिल है। कैलेंडर और छुट्टियाँ नहीं जाँची जातीं।
इसी डिवाइस पर सेव। निमंत्रण नहीं भेजे जाते।
काम शुरू और समाप्त होने के सही, अलग समय चुनें।
नाम डालें और शहर चुनें।
यह नाम पहले से मौजूद है। दूसरा नाम चुनें।
अधिकतम 100 टीमें या व्यक्ति सेव कर सकते हैं।
1–480 मिनट और अधिकतम 14 दिनों की अवधि चुनें।
1 से 19 अन्य प्रतिभागी रखें।
कैलेंडर टकराव नहीं जाँचे जाते। निमंत्रण नहीं भेजे जाते।
डाउनलोड हो गया। फ़ाइल कैलेंडर में आयात करें।
सेव की गई टीम हटा दी गई।
अधिकतम 19 अन्य प्रतिभागी जोड़ें।
ग्लोब उपलब्ध नहीं। मीटिंग योजना काम कर रही है।
अंग्रेज़ी
भाषा
भाषा खोजें
काम का समय
सुबह / शाम
आराम का समय
स्थानीय घड़ियों पर मीटिंग का समय बदलें
खींचकर बदलें। तीरों से 15 मिनट का बदलाव होता है।
मीटिंग 15 मिनट पहले करें
मीटिंग 15 मिनट बाद करें
घूमना रोकें
घूमना शुरू करें
ज़ूम इन
ज़ूम आउट
ग्लोब रीसेट करें
घुमाने के लिए खींचें · ज़ूम के लिए स्क्रॉल करें
दुनिया का नक्शा खुल रहा है…
नक्शा फिर लोड करें
नक्शा उपलब्ध नहीं। दोबारा कोशिश करें।
गलत तारीख। कल या अगले सप्ताह आज़माएँ।
समर्थित शहर या सेव की गई टीम चुनें।
1 से 480 मिनट की अवधि रखें।
पहले विकल्प बनाएँ, फिर सही समय पर खींचें।
कुछ लोग पहचाने नहीं गए। सूची जाँचें।
एक बार में एक मीटिंग तय करें।
स्थानीय तारीखें बदली हैं। तारीखों का दायरा जाँचें।
मीटिंग का समय
सबका समय बदलने के लिए मीटिंग बॉक्स खींचें। तीरों से 15 मिनट का बदलाव होता है।
यह समय दो बार आता है; {n} इस्तेमाल होगा।
डेलाइट सेविंग बदलाव में यह समय मौजूद नहीं है। दूसरा समय चुनें।
यूरोपीय मूल्य निर्धारण टीम
एशिया बिक्री टीम
न्यूयॉर्क मूल्य निर्धारण टीम`,
bn: `কাজের সময়ের বাইরে · সকাল / সন্ধ্যা, 07:00–22:00
বিশ্রামের সময় বা ছুটির দিন
কাজের সময়ে
সংরক্ষণ করা যাচ্ছে না। ব্যবহার চালিয়ে যেতে পারেন।
আপনি
হোম
আমার দল
যেভাবে কাজ করে
সময় খুঁজুন।<br><em>সবার জন্য।</em>
সব সময় অঞ্চল জুড়ে।
সহায়তা
আপনার মিটিং লিখুন
আরও পরে? ছোট মিটিং? শহর যোগ করুন…
স্টকহোম → সাংহাই, আগামী সপ্তাহে, 45 মিনিট…
সময় খুঁজুন
আমার অবস্থান
শহর · তারিখ · সময়কাল
বদলান
উদাহরণ
ডিভাইসে · অ্যাকাউন্ট ছাড়া
আপনার সময়
প্রস্তাবিত
বিকল্প {n}
{n} জন কাজের সময়ের বাইরে যোগ দেবেন
কাজের সময়ে
কাজের সময়ের বাইরে
উপযুক্ত সময় খোঁজা হচ্ছে…
এই তারিখে ভবিষ্যতের আর কোনো সময় নেই
কাজের কোনো সাধারণ সময় নেই
তথ্য বদলান বা টেনে দেখুন।
07:00–22:00 অন্তর্ভুক্ত করুন
সময় বাছুন
বিকল্প বন্ধ করুন
অংশগ্রহণকারী
তথ্য বদলান
শুধু কাজের সময় অনুযায়ী। ক্যালেন্ডারে প্রবেশ নেই।
.ics ডাউনলোড
আমন্ত্রণ পাঠানো হয় না।
প্রিভিউ
{n}টি বিকল্প পাওয়া গেছে। টেনে বদলান।
মেলেনি। তথ্য বদলান বা টেনে দেখুন।
খোঁজা যায়নি। কম তারিখ বাছুন।
সর্বোচ্চ 20 জন ও 14টি তারিখ।
স্থানীয় সময় তুলনা করা হচ্ছে…
সময় পেরিয়ে গেছে। সামনে এগিয়ে দিন।
সময় আপডেট হয়েছে।
বন্ধ করুন
নাম ও শহর সংরক্ষণ করুন।
সোমবার থেকে শুক্রবার
উদাহরণ
মিটিং পরিকল্পনা করুন
সম্পাদনা
মুছুন
দল বা ব্যক্তি যোগ করুন
এই ডিভাইসে সংরক্ষিত। উদাহরণ বদলানো যায়।
দল বা ব্যক্তি বদলান
দল বা ব্যক্তি যোগ করুন
প্রতি শহরে একটি এন্ট্রি।
নাম
যেমন এশিয়া বিক্রয় দল
অবস্থান
কাজ শুরু
কাজ শেষ
সোম–শুক্র। শেষ সময় আগে হলে রাতের শিফট বোঝায়।
ফিরুন
সংরক্ষণ
আমার অবস্থান ও কাজের সময়
আপনি কোথায় থাকবেন?
আমি থাকব
অবস্থান সংরক্ষণ
মিটিং বদলান
শুধু এই মিটিংয়ের জন্য।
শুরুর তারিখ
শেষের তারিখ
সময়কাল (মিনিট)
শুরু
শেষ
শহর যোগ করুন
অংশগ্রহণকারী যোগ করুন
সকাল / সন্ধ্যার সময়ও রাখুন (07:00–22:00)
সপ্তাহান্ত রাখুন
বাতিল
সরান
ভবিষ্যতের মিটিং সময় বাছুন।
ক্যালেন্ডারে সংরক্ষণ
Outlook, Google বা Apple Calendar-এ আমদানি করুন।
মিটিংয়ের নাম
সময় অঞ্চল জুড়ে মিটিং
বিশ্রামের সময় রয়েছে। তবুও সংরক্ষণ করুন।
শুধু ইভেন্ট যোগ হয়। আমন্ত্রণ বা ভিডিও লিংক নেই।
সহজ নির্দেশনা
শহর, তারিখ ও সময়কাল লিখুন।
“আরও পরে”, “30 মিনিট” বা “টোকিও যোগ করুন” লিখুন।
সময়ের বার টানুন। সব ঘড়ি একসঙ্গে বদলাবে।
শুধু প্রচলিত মিটিংয়ের বাক্য। তথ্য যাচাই করুন।
ডেলাইট সেভিং ধরা হয়। ক্যালেন্ডার ও ছুটি যাচাই হয় না।
এই ডিভাইসে সংরক্ষিত। আমন্ত্রণ পাঠানো হয় না।
কাজ শুরু ও শেষের বৈধ এবং আলাদা সময় বাছুন।
নাম লিখুন ও শহর বাছুন।
নামটি আগে থেকেই আছে। অন্য নাম দিন।
সর্বোচ্চ 100টি দল বা ব্যক্তি সংরক্ষণ করা যায়।
1–480 মিনিট এবং সর্বোচ্চ 14 দিনের সময়সীমা বাছুন।
1 থেকে 19 জন অন্য অংশগ্রহণকারী রাখুন।
ক্যালেন্ডারের দ্বন্দ্ব যাচাই হয় না। আমন্ত্রণ পাঠানো হয় না।
ডাউনলোড হয়েছে। ফাইল ক্যালেন্ডারে আমদানি করুন।
সংরক্ষিত দল সরানো হয়েছে।
সর্বোচ্চ 19 জন অন্য অংশগ্রহণকারী যোগ করুন।
গ্লোব পাওয়া যাচ্ছে না। পরিকল্পনা করা যাবে।
ইংরেজি
ভাষা
ভাষা খুঁজুন
কাজের সময়
সকাল / সন্ধ্যা
বিশ্রামের সময়
স্থানীয় ঘড়িতে মিটিংয়ের সময় সরান
টেনে বদলান। তীর চিহ্নে 15 মিনিট করে সরবে।
মিটিং 15 মিনিট আগে করুন
মিটিং 15 মিনিট পরে করুন
ঘোরা থামান
ঘোরা শুরু করুন
বড় করুন
ছোট করুন
গ্লোব রিসেট করুন
দেখতে টানুন · জুম করতে স্ক্রল করুন
বিশ্বের মানচিত্র খোলা হচ্ছে…
মানচিত্র আবার লোড করুন
মানচিত্র পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।
ভুল তারিখ। আগামীকাল বা আগামী সপ্তাহে চেষ্টা করুন।
সমর্থিত শহর বা সংরক্ষিত দল বাছুন।
1 থেকে 480 মিনিটের সময়কাল দিন।
আগে বিকল্প তৈরি করুন, তারপর টেনে সঠিক সময় দিন।
কিছু ব্যক্তিকে চেনা যায়নি। তালিকা যাচাই করুন।
একবারে একটি মিটিং পরিকল্পনা করুন।
স্থানীয় তারিখ বদলেছে। তারিখের সীমা দেখুন।
মিটিংয়ের সময়
সবার সময় বদলাতে মিটিং বক্স টানুন। তীর চিহ্নে 15 মিনিট করে সরবে।
এই সময়টি দুবার আসে; {n} ব্যবহার করা হবে।
ডেলাইট সেভিং পরিবর্তনে এই সময় নেই। অন্য সময় বাছুন।
ইউরোপীয় মূল্য নির্ধারণ দল
এশিয়া বিক্রয় দল
নিউইয়র্ক মূল্য নির্ধারণ দল`,
id: `Di luar jam kerja · Pagi / malam, 07:00–22:00
Jam istirahat atau hari libur
Dalam jam kerja
Penyimpanan tidak tersedia. Anda tetap bisa lanjut.
Anda
beranda
Tim saya
Cara kerja
Temukan waktu.<br><em>Untuk semua.</em>
Lintas zona waktu.
Bantuan
Jelaskan rapat Anda
Lebih lambat? Lebih singkat? Tambah kota…
Stockholm → Shanghai, minggu depan, 45 menit…
Cari waktu
Lokasi saya
Kota · tanggal · durasi
Sesuaikan
Contoh
Di perangkat · Tanpa akun
Waktu Anda
Disarankan
Opsi {n}
{n} peserta di luar jam kerja
Dalam jam kerja
Di luar jam kerja
Mencari waktu yang sesuai…
Tidak ada waktu mendatang pada tanggal ini
Tidak ada jam kerja bersama
Ubah detail atau seret untuk mencoba.
Sertakan 07:00–22:00
Pilih waktu
Tutup opsi
peserta
Ubah detail
Berdasarkan jam kerja saja. Tanpa akses kalender.
Unduh .ics
Undangan tidak dikirim.
Pratinjau
Ditemukan {n} opsi. Seret untuk menyesuaikan.
Tidak cocok. Ubah detail atau seret.
Pencarian gagal. Coba lebih sedikit tanggal.
Maksimal 20 orang dan 14 tanggal.
Membandingkan waktu lokal…
Waktu sudah lewat. Geser ke depan.
Waktu diperbarui.
Tutup
Simpan nama dan kota.
Senin sampai Jumat
CONTOH
Rencanakan rapat
Edit
Hapus
Tambah tim atau orang
Disimpan di perangkat ini. Contoh dapat diedit.
Edit tim atau orang
Tambah tim atau orang
Satu entri per kota.
Nama
mis. tim penjualan Asia
Lokasi
Mulai kerja
Selesai kerja
Sen–Jum. Akhir lebih awal berarti sif malam.
Kembali
Simpan
Lokasi dan jam kerja saya
Anda akan berada di mana?
Saya akan berada di
Simpan lokasi
Sesuaikan rapat
Hanya untuk rapat ini.
Dari tanggal
Sampai tanggal
Durasi (menit)
Mulai
Selesai
Tambah kota
Tambah peserta
Sertakan pagi / malam (07:00–22:00)
Sertakan akhir pekan
Batal
Hapus
Pilih waktu rapat mendatang.
Simpan ke kalender
Impor ke Outlook, Google, atau Apple Calendar.
Judul rapat
Rapat lintas zona waktu
Termasuk jam istirahat. Tetap simpan.
Hanya menambah acara. Tanpa undangan atau tautan video.
Panduan singkat
Masukkan kota, tanggal, dan durasi.
Coba “lebih lambat”, “30 menit”, atau “tambah Tokyo”.
Seret bilah waktu. Semua jam bergerak bersama.
Hanya frasa rapat umum. Periksa detailnya.
Waktu musim panas dihitung. Kalender dan hari libur tidak diperiksa.
Disimpan di perangkat ini. Undangan tidak dikirim.
Pilih waktu mulai dan selesai yang valid dan berbeda.
Masukkan nama dan pilih kota.
Nama sudah ada. Pilih nama lain.
Anda dapat menyimpan hingga 100 tim atau orang.
Pilih durasi 1–480 menit dan rentang maksimal 14 hari.
Sertakan 1 hingga 19 peserta lain.
Benturan kalender tidak diperiksa. Undangan tidak dikirim.
Terunduh. Impor berkas ke kalender Anda.
Tim tersimpan dihapus.
Tambahkan hingga 19 peserta lain.
Globe tidak tersedia. Perencanaan tetap berfungsi.
Inggris
Bahasa
Cari bahasa
Jam kerja
Pagi / malam
Jam istirahat
Geser rapat pada jam lokal
Seret untuk menyesuaikan. Tombol panah menggeser 15 menit.
Majukan rapat 15 menit
Mundurkan rapat 15 menit
Jeda putaran
Mulai putaran
Perbesar
Perkecil
Atur ulang globe
Seret untuk menjelajah · Gulir untuk zoom
Membuka peta dunia…
Muat ulang peta
Peta tidak tersedia. Coba lagi.
Tanggal tidak valid. Coba besok atau minggu depan.
Pilih kota yang didukung atau tim tersimpan.
Gunakan durasi 1 hingga 480 menit.
Buat opsi dahulu, lalu seret untuk waktu yang tepat.
Beberapa orang tidak dikenali. Periksa daftar.
Jadwalkan satu rapat setiap kali.
Tanggal lokal berubah. Periksa rentang tanggal.
Waktu rapat
Seret jendela rapat untuk memperbarui waktu semua orang. Tombol panah menggeser 15 menit.
Waktu ini muncul dua kali; menggunakan {n}.
Waktu ini tidak ada saat pergantian waktu musim panas. Pilih waktu lain.
Tim penetapan harga Eropa
Tim penjualan Asia
Tim penetapan harga New York`,
ms: `Di luar waktu kerja · Awal / lewat, 07:00–22:00
Waktu rehat atau hari cuti
Dalam waktu kerja
Storan tidak tersedia. Anda boleh teruskan.
Anda
utama
Pasukan saya
Cara penggunaan
Cari masa.<br><em>Untuk semua.</em>
Merentas zon waktu.
Bantuan
Terangkan mesyuarat anda
Lebih lewat? Lebih singkat? Tambah bandar…
Stockholm → Shanghai, minggu depan, 45 minit…
Cari masa
Lokasi saya
Bandar · tarikh · tempoh
Laraskan
Contoh
Pada peranti · Tanpa akaun
Waktu anda
Disyorkan
Pilihan {n}
{n} peserta di luar waktu kerja
Dalam waktu kerja
Di luar waktu kerja
Mencari masa yang sesuai…
Tiada masa akan datang pada tarikh ini
Tiada waktu kerja bersama
Ubah butiran atau seret untuk mencuba.
Sertakan 07:00–22:00
Pilih masa
Tutup pilihan
peserta
Ubah butiran
Berdasarkan waktu kerja sahaja. Tiada akses kalendar.
Muat turun .ics
Jemputan tidak dihantar.
Pratonton
{n} pilihan ditemui. Seret untuk melaraskan.
Tiada padanan. Ubah butiran atau seret.
Carian gagal. Cuba lebih sedikit tarikh.
Maksimum 20 orang dan 14 tarikh.
Membandingkan waktu tempatan…
Masa sudah berlalu. Alihkan ke hadapan.
Masa dikemas kini.
Tutup
Simpan nama dan bandar.
Isnin hingga Jumaat
CONTOH
Rancang mesyuarat
Edit
Padam
Tambah pasukan atau orang
Disimpan pada peranti ini. Contoh boleh diedit.
Edit pasukan atau orang
Tambah pasukan atau orang
Satu entri bagi setiap bandar.
Nama
cth. pasukan jualan Asia
Lokasi
Mula kerja
Tamat kerja
Isn–Jum. Waktu tamat lebih awal bermaksud syif malam.
Kembali
Simpan
Lokasi dan waktu kerja saya
Anda akan berada di mana?
Saya akan berada di
Simpan lokasi
Laraskan mesyuarat
Untuk mesyuarat ini sahaja.
Dari tarikh
Hingga tarikh
Tempoh (minit)
Mula
Tamat
Tambah bandar
Tambah peserta
Sertakan waktu awal / lewat (07:00–22:00)
Sertakan hujung minggu
Batal
Alih keluar
Pilih masa mesyuarat akan datang.
Simpan ke kalendar
Import ke Outlook, Google atau Apple Calendar.
Tajuk mesyuarat
Mesyuarat merentas zon waktu
Termasuk waktu rehat. Simpan juga.
Hanya menambah acara. Tiada jemputan atau pautan video.
Panduan ringkas
Masukkan bandar, tarikh dan tempoh.
Cuba “lebih lewat”, “30 minit” atau “tambah Tokyo”.
Seret bar masa. Semua jam bergerak bersama.
Frasa mesyuarat lazim sahaja. Semak butiran.
Waktu musim panas diambil kira. Kalendar dan cuti tidak disemak.
Disimpan pada peranti ini. Jemputan tidak dihantar.
Pilih waktu mula dan tamat yang sah dan berbeza.
Masukkan nama dan pilih bandar.
Nama sudah wujud. Pilih nama lain.
Anda boleh menyimpan hingga 100 pasukan atau orang.
Pilih tempoh 1–480 minit dan julat sehingga 14 hari.
Kekalkan 1 hingga 19 peserta lain.
Pertindihan kalendar tidak disemak. Jemputan tidak dihantar.
Dimuat turun. Import fail ke kalendar anda.
Pasukan tersimpan dialih keluar.
Tambah sehingga 19 peserta lain.
Glob tidak tersedia. Perancangan masih berfungsi.
Inggeris
Bahasa
Cari bahasa
Waktu kerja
Awal / lewat
Waktu rehat
Alihkan mesyuarat pada jam tempatan
Seret untuk melaraskan. Kekunci anak panah mengalih 15 minit.
Awalkan mesyuarat 15 minit
Lewatkan mesyuarat 15 minit
Jeda putaran
Mula putaran
Zum masuk
Zum keluar
Tetapkan semula glob
Seret untuk meneroka · Tatal untuk zum
Membuka peta dunia…
Muat semula peta
Peta tidak tersedia. Cuba lagi.
Tarikh tidak sah. Cuba esok atau minggu depan.
Pilih bandar yang disokong atau pasukan tersimpan.
Gunakan tempoh 1 hingga 480 minit.
Jana pilihan dahulu, kemudian seret untuk masa tepat.
Sesetengah orang tidak dikenal pasti. Semak senarai.
Jadualkan satu mesyuarat pada satu masa.
Tarikh tempatan berubah. Semak julat tarikh.
Masa mesyuarat
Seret kotak mesyuarat untuk mengemas kini waktu semua orang. Kekunci anak panah mengalih 15 minit.
Waktu ini berlaku dua kali; menggunakan {n}.
Waktu ini tidak wujud ketika perubahan waktu musim panas. Pilih waktu lain.
Pasukan penetapan harga Eropah
Pasukan jualan Asia
Pasukan penetapan harga New York`,
th: `นอกเวลางาน · เช้า / ค่ำ, 07:00–22:00
เวลาพักหรือวันหยุด
ในเวลางาน
บันทึกข้อมูลไม่ได้ แต่ยังใช้งานต่อได้
คุณ
หน้าหลัก
ทีมของฉัน
วิธีใช้
หาเวลาที่ลงตัว<br><em>สำหรับทุกคน</em>
เชื่อมทุกเขตเวลา
ช่วยเหลือ
บอกความต้องการประชุม
ช้าลง? สั้นลง? เพิ่มเมือง…
สตอกโฮล์ม → เซี่ยงไฮ้ สัปดาห์หน้า 45 นาที…
ค้นหาเวลา
ตำแหน่งของฉัน
เมือง · วันที่ · ระยะเวลา
ปรับ
ตัวอย่าง
บนอุปกรณ์ · ไม่ต้องมีบัญชี
เวลาของคุณ
แนะนำ
ตัวเลือก {n}
{n} คนเข้าร่วมนอกเวลางาน
ในเวลางาน
นอกเวลางาน
กำลังหาเวลาที่เหมาะสม…
ไม่มีเวลาในอนาคตเหลือในวันที่เลือก
ไม่มีเวลางานที่ตรงกัน
แก้รายละเอียดหรือลากเพื่อสำรวจ
รวมเวลา 07:00–22:00
เลือกเวลา
ปิดตัวเลือก
ผู้เข้าร่วม
แก้รายละเอียด
อิงเวลางานเท่านั้น ไม่เข้าถึงปฏิทิน
ดาวน์โหลด .ics
ไม่มีการส่งคำเชิญ
ดูตัวอย่าง
พบ {n} ตัวเลือก ลากเพื่อปรับ
ไม่พบเวลาที่ตรงกัน แก้รายละเอียดหรือลาก
ค้นหาไม่สำเร็จ ลองลดจำนวนวัน
สูงสุด 20 คนและ 14 วัน
กำลังเทียบเวลาท้องถิ่น…
เวลานี้ผ่านไปแล้ว เลื่อนไปข้างหน้า
อัปเดตเวลาแล้ว
ปิด
บันทึกชื่อและเมือง
วันจันทร์ถึงวันศุกร์
ตัวอย่าง
วางแผนประชุม
แก้ไข
ลบ
เพิ่มทีมหรือบุคคล
บันทึกบนอุปกรณ์นี้ แก้ไขตัวอย่างได้
แก้ไขทีมหรือบุคคล
เพิ่มทีมหรือบุคคล
หนึ่งรายการต่อเมือง
ชื่อ
เช่น ทีมขายเอเชีย
ตำแหน่ง
เริ่มงาน
เลิกงาน
จ.–ศ. หากเวลาเลิกงานเร็วกว่าเวลาเริ่ม หมายถึงกะข้ามคืน
กลับ
บันทึก
ตำแหน่งและเวลางานของฉัน
คุณจะอยู่ที่ไหน?
ฉันจะอยู่ที่
บันทึกตำแหน่ง
ปรับการประชุมนี้
สำหรับการประชุมนี้เท่านั้น
ตั้งแต่วันที่
ถึงวันที่
ระยะเวลา (นาที)
เริ่ม
สิ้นสุด
เพิ่มเมือง
เพิ่มผู้เข้าร่วม
รวมเวลาเช้า / ค่ำ (07:00–22:00)
รวมวันเสาร์อาทิตย์
ยกเลิก
นำออก
เลือกเวลาประชุมในอนาคต
บันทึกลงปฏิทิน
นำเข้าใน Outlook, Google หรือ Apple Calendar
ชื่อการประชุม
การประชุมข้ามเขตเวลา
มีเวลาพักรวมอยู่ บันทึกต่อ
เพิ่มกิจกรรมเท่านั้น ไม่มีคำเชิญหรือลิงก์วิดีโอ
คู่มือย่อ
ระบุเมือง วันที่ และระยะเวลา
ลอง “ช้าลง” “30 นาที” หรือ “เพิ่มโตเกียว”
ลากแถบเวลา นาฬิกาทั้งหมดจะเลื่อนไปพร้อมกัน
รองรับวลีประชุมทั่วไปเท่านั้น โปรดตรวจรายละเอียด
คำนวณเวลาออมแสง ไม่ตรวจปฏิทินและวันหยุด
บันทึกบนอุปกรณ์นี้ ไม่มีการส่งคำเชิญ
เลือกเวลาเริ่มและเลิกงานที่ถูกต้องและไม่เหมือนกัน
กรอกชื่อและเลือกเมือง
มีชื่อนี้แล้ว โปรดใช้ชื่ออื่น
บันทึกทีมหรือบุคคลได้สูงสุด 100 รายการ
เลือก 1–480 นาที และช่วงวันไม่เกิน 14 วัน
คงผู้เข้าร่วมอื่นไว้ 1 ถึง 19 คน
ไม่ตรวจเวลาชนกันในปฏิทิน ไม่มีการส่งคำเชิญ
ดาวน์โหลดแล้ว นำไฟล์เข้าในปฏิทินของคุณ
นำทีมที่บันทึกออกแล้ว
เพิ่มผู้เข้าร่วมอื่นได้สูงสุด 19 คน
ลูกโลกไม่พร้อมใช้งาน ยังวางแผนประชุมได้
อังกฤษ
ภาษา
ค้นหาภาษา
เวลางาน
เช้า / ค่ำ
เวลาพัก
เลื่อนการประชุมบนเวลาท้องถิ่น
ลากเพื่อปรับ ปุ่มลูกศรเลื่อนครั้งละ 15 นาที
เลื่อนประชุมให้เร็วขึ้น 15 นาที
เลื่อนประชุมให้ช้าลง 15 นาที
หยุดหมุน
เริ่มหมุน
ซูมเข้า
ซูมออก
รีเซ็ตมุมมองลูกโลก
ลากเพื่อสำรวจ · เลื่อนเพื่อซูม
กำลังเปิดแผนที่โลก…
โหลดแผนที่ใหม่
แผนที่ไม่พร้อมใช้งาน ลองอีกครั้ง
วันที่ไม่ถูกต้อง ลองพรุ่งนี้หรือสัปดาห์หน้า
เลือกเมืองที่รองรับหรือทีมที่บันทึกไว้
ใช้ระยะเวลา 1 ถึง 480 นาที
สร้างตัวเลือกก่อน แล้วลากเพื่อกำหนดเวลาที่แน่นอน
ไม่รู้จักบางรายชื่อ โปรดตรวจรายการ
วางแผนครั้งละหนึ่งการประชุม
วันที่ท้องถิ่นเปลี่ยนแล้ว โปรดตรวจช่วงวัน
เวลาประชุม
ลากกรอบประชุมเพื่ออัปเดตเวลาของทุกคน ปุ่มลูกศรเลื่อนครั้งละ 15 นาที
เวลานี้เกิดขึ้นสองครั้ง จะใช้ {n}
ไม่มีเวลานี้ระหว่างการเปลี่ยนเวลาออมแสง โปรดเลือกเวลาอื่น
ทีมกำหนดราคายุโรป
ทีมขายเอเชีย
ทีมกำหนดราคานิวยอร์ก`,
vi: `Ngoài giờ làm · Sớm / muộn, 07:00–22:00
Giờ nghỉ hoặc ngày nghỉ
Trong giờ làm
Không thể lưu dữ liệu. Bạn vẫn có thể tiếp tục.
Bạn
trang chủ
Nhóm của tôi
Cách dùng
Tìm thời gian.<br><em>Cho mọi người.</em>
Kết nối mọi múi giờ.
Trợ giúp
Mô tả cuộc họp
Muộn hơn? Ngắn hơn? Thêm thành phố…
Stockholm → Thượng Hải, tuần sau, 45 phút…
Tìm giờ
Vị trí của tôi
Thành phố · ngày · thời lượng
Điều chỉnh
Ví dụ
Trên thiết bị · Không cần tài khoản
Giờ của bạn
Đề xuất
Phương án {n}
{n} người tham gia ngoài giờ làm
Trong giờ làm
Ngoài giờ làm
Đang tìm giờ phù hợp…
Không còn giờ trong tương lai ở các ngày này
Không có giờ làm chung
Sửa chi tiết hoặc kéo để xem.
Bao gồm 07:00–22:00
Chọn giờ
Đóng phương án
người tham gia
Sửa chi tiết
Chỉ dựa trên giờ làm. Không truy cập lịch.
Tải .ics
Không gửi lời mời.
Xem trước
Tìm được {n} phương án. Kéo để chỉnh.
Không khớp. Sửa chi tiết hoặc kéo.
Tìm kiếm thất bại. Thử ít ngày hơn.
Tối đa 20 người và 14 ngày.
Đang so sánh giờ địa phương…
Giờ này đã qua. Hãy chuyển về sau.
Đã cập nhật giờ.
Đóng
Lưu tên và thành phố.
Thứ hai đến thứ sáu
VÍ DỤ
Lên lịch họp
Sửa
Xóa
Thêm nhóm hoặc người
Lưu trên thiết bị này. Có thể sửa ví dụ.
Sửa nhóm hoặc người
Thêm nhóm hoặc người
Mỗi thành phố một mục.
Tên
ví dụ: nhóm bán hàng châu Á
Vị trí
Bắt đầu làm
Kết thúc làm
Thứ hai–sáu. Giờ kết thúc sớm hơn nghĩa là ca qua đêm.
Quay lại
Lưu
Vị trí và giờ làm của tôi
Bạn sẽ ở đâu?
Tôi sẽ ở
Lưu vị trí
Điều chỉnh cuộc họp
Chỉ cho cuộc họp này.
Từ ngày
Đến ngày
Thời lượng (phút)
Bắt đầu
Kết thúc
Thêm thành phố
Thêm người tham gia
Bao gồm giờ sớm / muộn (07:00–22:00)
Bao gồm cuối tuần
Hủy
Bỏ
Chọn giờ họp trong tương lai.
Lưu vào lịch
Nhập vào Outlook, Google hoặc Apple Calendar.
Tên cuộc họp
Cuộc họp xuyên múi giờ
Bao gồm giờ nghỉ. Vẫn lưu.
Chỉ thêm sự kiện. Không có lời mời hay liên kết video.
Hướng dẫn nhanh
Nhập thành phố, ngày và thời lượng.
Thử “muộn hơn”, “30 phút” hoặc “thêm Tokyo”.
Kéo thanh thời gian. Mọi đồng hồ cùng thay đổi.
Chỉ hỗ trợ cụm từ họp phổ biến. Kiểm tra chi tiết.
Có tính giờ mùa hè. Không kiểm tra lịch và ngày lễ.
Lưu trên thiết bị này. Không gửi lời mời.
Chọn giờ bắt đầu và kết thúc hợp lệ, khác nhau.
Nhập tên và chọn thành phố.
Tên đã tồn tại. Chọn tên khác.
Có thể lưu tối đa 100 nhóm hoặc người.
Chọn 1–480 phút và khoảng tối đa 14 ngày.
Giữ từ 1 đến 19 người tham gia khác.
Không kiểm tra trùng lịch. Không gửi lời mời.
Đã tải. Nhập tệp vào lịch của bạn.
Đã xóa nhóm đã lưu.
Thêm tối đa 19 người tham gia khác.
Quả địa cầu chưa tải được. Vẫn có thể lên lịch.
Tiếng Anh
Ngôn ngữ
Tìm ngôn ngữ
Giờ làm
Sớm / muộn
Giờ nghỉ
Di chuyển cuộc họp trên đồng hồ địa phương
Kéo để chỉnh. Phím mũi tên dịch 15 phút.
Chuyển cuộc họp sớm hơn 15 phút
Chuyển cuộc họp muộn hơn 15 phút
Dừng xoay
Bắt đầu xoay
Phóng to
Thu nhỏ
Đặt lại quả địa cầu
Kéo để khám phá · Cuộn để thu phóng
Đang mở bản đồ thế giới…
Tải lại bản đồ
Bản đồ chưa tải được. Thử lại.
Ngày không hợp lệ. Thử ngày mai hoặc tuần sau.
Chọn thành phố được hỗ trợ hoặc nhóm đã lưu.
Dùng thời lượng từ 1 đến 480 phút.
Tạo phương án trước, rồi kéo để đặt giờ chính xác.
Không nhận ra một số người. Kiểm tra danh sách.
Lên lịch từng cuộc họp một.
Ngày địa phương đã đổi. Kiểm tra khoảng ngày.
Giờ họp
Kéo khung cuộc họp để cập nhật giờ của mọi người. Phím mũi tên dịch 15 phút.
Giờ này xuất hiện hai lần; dùng {n}.
Giờ này không tồn tại khi đổi giờ mùa hè. Chọn giờ khác.
Nhóm định giá châu Âu
Nhóm bán hàng châu Á
Nhóm định giá New York`,
ja: `勤務時間外 · 早朝／夜間、07:00–22:00
休息時間または休日
勤務時間内
保存できません。このまま利用できます。
あなた
ホーム
マイチーム
使い方
みんなに合う<br><em>時間を見つけよう。</em>
タイムゾーンを越えて。
ヘルプ
会議の希望を入力
遅めに？短く？都市を追加…
ストックホルム → 上海、来週、45分…
時間を探す
現在地
都市・日付・時間
調整
入力例
端末内で処理・登録不要
あなたの時間
おすすめ
候補 {n}
{n}人が勤務時間外に参加
勤務時間内
勤務時間外
適した時間を検索中…
選択した日付に今後の時間がありません
共通する勤務時間がありません
条件を変えるか、ドラッグして確認できます。
07:00–22:00を含める
時間を選択
候補を閉じる
参加者
条件を変更
勤務時間に基づく候補です。カレンダー参照なし。
.icsをダウンロード
招待は送信されません。
プレビュー
{n}件の候補。ドラッグして調整できます。
候補なし。条件を変えるか、ドラッグしてください。
検索に失敗しました。日数を減らしてください。
最大20人・14日まで。
現地時間を比較中…
過去の時間です。先に進めてください。
時間を更新しました。
閉じる
名前と都市を保存。
月曜〜金曜
サンプル
会議を計画
編集
削除
チーム・参加者を追加
この端末に保存。サンプルは編集できます。
チーム・参加者を編集
チーム・参加者を追加
都市ごとに1件登録。
名前
例：アジア営業チーム
場所
勤務開始
勤務終了
月〜金。終了が開始より早い場合は夜勤です。
戻る
保存
現在地と勤務時間
どこにいますか？
滞在都市
場所を保存
会議を調整
この会議のみに適用。
開始日
終了日
会議時間（分）
開始
終了
都市を追加
参加者を追加
早朝／夜間を含める（07:00–22:00）
週末を含める
キャンセル
外す
今後の会議時間を選んでください。
カレンダーに保存
Outlook、Google、Appleカレンダーに読み込めます。
会議名
タイムゾーンをまたぐ会議
休息時間を含みます。このまま保存。
予定のみ追加。招待やビデオリンクは作成されません。
クイックガイド
都市、日付、会議時間を入力。
「遅めに」「30分」「東京を追加」など。
時間バーをドラッグすると、全員の時計が連動します。
一般的な会議表現に対応。内容をご確認ください。
夏時間に対応。予定と祝日は確認しません。
この端末に保存。招待は送信されません。
有効な勤務開始・終了時刻を別々に指定してください。
名前を入力し、都市を選んでください。
登録済みの名前です。別の名前にしてください。
最大100件のチーム・参加者を保存できます。
会議時間は1〜480分、日付は14日以内で指定してください。
他の参加者は1〜19人にしてください。
予定の重複は確認しません。招待は送信されません。
ダウンロード済み。カレンダーに読み込んでください。
保存したチームを削除しました。
他の参加者を最大19人追加できます。
地球儀を表示できません。会議の計画は利用できます。
英語
言語
言語を検索
勤務時間
早朝／夜間
休息時間
各地の時計で会議時間を動かす
ドラッグで調整。矢印キーで15分ずつ移動。
会議を15分早める
会議を15分遅らせる
回転を停止
回転を開始
拡大
縮小
地球儀をリセット
ドラッグで回転・スクロールでズーム
世界地図を読み込み中…
地図を再読み込み
地図を表示できません。再試行してください。
無効な日付です。明日や来週を試してください。
対応する都市か保存済みチームを選んでください。
会議時間は1〜480分にしてください。
候補を検索してから、ドラッグで時刻を指定してください。
一部の参加者を認識できません。一覧をご確認ください。
一度に1件の会議を計画してください。
現地の日付が変わりました。日付範囲をご確認ください。
会議時間
会議枠をドラッグすると全員の時間が変わります。矢印キーで15分ずつ移動。
この時刻は2回あります。{n}を使用します。
夏時間の切り替えで存在しない時刻です。別の時刻を選んでください。
欧州価格設定チーム
アジア営業チーム
ニューヨーク価格設定チーム`,
ko: `근무 시간 외 · 이른 아침 / 저녁, 07:00–22:00
휴식 시간 또는 휴무일
근무 시간 내
저장할 수 없습니다. 계속 사용할 수 있습니다.
나
홈
내 팀
사용 방법
모두에게 맞는<br><em>시간을 찾으세요.</em>
시간대를 넘어.
도움말
회의 내용을 입력하세요
더 늦게? 더 짧게? 도시 추가…
스톡홀름 → 상하이, 다음 주, 45분…
시간 찾기
내 위치
도시 · 날짜 · 시간
조정
예시
기기 내 처리 · 가입 불필요
내 시간
추천
후보 {n}
{n}명이 근무 시간 외에 참여
근무 시간 내
근무 시간 외
좋은 시간을 찾는 중…
선택한 날짜에 남은 미래 시간이 없습니다
공통 근무 시간이 없습니다
조건을 바꾸거나 드래그해 확인하세요.
07:00–22:00 포함
시간 선택
후보 닫기
참가자
조건 변경
근무 시간 기준입니다. 캘린더 접근 없음.
.ics 다운로드
초대는 전송되지 않습니다.
미리보기
후보 {n}개. 드래그해 조정하세요.
일치하는 시간이 없습니다. 조건을 바꾸거나 드래그하세요.
검색에 실패했습니다. 날짜 수를 줄여 보세요.
최대 20명, 14일.
현지 시간 비교 중…
지난 시간입니다. 앞으로 이동하세요.
시간이 업데이트되었습니다.
닫기
이름과 도시를 저장하세요.
월요일~금요일
예시
회의 계획
편집
삭제
팀 또는 사람 추가
이 기기에 저장됩니다. 예시는 수정할 수 있습니다.
팀 또는 사람 편집
팀 또는 사람 추가
도시마다 항목 하나.
이름
예: 아시아 영업팀
위치
근무 시작
근무 종료
월~금. 종료가 시작보다 빠르면 야간 근무입니다.
뒤로
저장
내 위치와 근무 시간
어디에 계실 예정인가요?
체류 도시
위치 저장
회의 조정
이 회의에만 적용됩니다.
시작 날짜
종료 날짜
회의 길이(분)
시작
종료
도시 추가
참가자 추가
이른 아침 / 저녁 포함(07:00–22:00)
주말 포함
취소
제외
미래의 회의 시간을 선택하세요.
캘린더에 저장
Outlook, Google 또는 Apple 캘린더로 가져오세요.
회의 제목
여러 시간대의 회의
휴식 시간이 포함됩니다. 그래도 저장합니다.
일정만 추가됩니다. 초대나 화상 회의 링크는 없습니다.
빠른 안내
도시, 날짜, 회의 길이를 입력하세요.
“더 늦게”, “30분”, “도쿄 추가”를 입력해 보세요.
시간 막대를 드래그하면 모든 시계가 함께 움직입니다.
일반적인 회의 표현만 지원합니다. 내용을 확인하세요.
서머타임을 반영합니다. 캘린더와 공휴일은 확인하지 않습니다.
이 기기에 저장됩니다. 초대는 전송되지 않습니다.
올바르고 서로 다른 근무 시작·종료 시간을 선택하세요.
이름을 입력하고 도시를 선택하세요.
이미 있는 이름입니다. 다른 이름을 사용하세요.
최대 100개의 팀 또는 사람을 저장할 수 있습니다.
1~480분, 최대 14일의 날짜 범위를 선택하세요.
다른 참가자는 1~19명으로 지정하세요.
일정 중복은 확인하지 않습니다. 초대는 전송되지 않습니다.
다운로드했습니다. 파일을 캘린더로 가져오세요.
저장된 팀을 삭제했습니다.
다른 참가자를 최대 19명 추가하세요.
지구본을 표시할 수 없습니다. 회의 계획은 이용할 수 있습니다.
영어
언어
언어 검색
근무 시간
이른 아침 / 저녁
휴식 시간
현지 시계에서 회의 시간 이동
드래그해 조정하세요. 방향키로 15분씩 이동합니다.
회의를 15분 앞당기기
회의를 15분 늦추기
회전 멈춤
회전 시작
확대
축소
지구본 초기화
드래그로 탐색 · 스크롤로 확대
세계 지도 여는 중…
지도 다시 불러오기
지도를 사용할 수 없습니다. 다시 시도하세요.
잘못된 날짜입니다. 내일 또는 다음 주를 입력하세요.
지원되는 도시나 저장된 팀을 선택하세요.
회의 길이는 1~480분으로 설정하세요.
먼저 후보를 찾은 뒤 드래그해 정확한 시간을 정하세요.
일부 참가자를 인식하지 못했습니다. 목록을 확인하세요.
한 번에 회의 하나를 계획하세요.
현지 날짜가 바뀌었습니다. 날짜 범위를 확인하세요.
회의 시간
회의 구간을 드래그하면 모두의 시간이 바뀝니다. 방향키로 15분씩 이동합니다.
이 시각은 두 번 발생합니다. {n}을 사용합니다.
서머타임 전환으로 존재하지 않는 시각입니다. 다른 시간을 선택하세요.
유럽 가격 책정팀
아시아 영업팀
뉴욕 가격 책정팀`
};
export const localesB = Object.fromEntries(Object.entries(rowsB).map(([code, rows]) => {
  const values = rows.split('\n');
  if (values.length !== keysB.length) throw new Error(`Locale ${code}: expected ${keysB.length}, received ${values.length}`);
  return [code, {...Object.fromEntries(keysB.map((key, index) => [key, values[index]])), input: inputs[code]}];
}));
