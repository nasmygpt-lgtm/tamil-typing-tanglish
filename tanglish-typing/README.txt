=== Tanglish Typing ===
Version: 1.0.0
Requires: WordPress 5.0+
License: GPL-2.0+

== Idhu enna? (What is this?) ==

WordPress editor la neenga TANGLISH (English letters la Tamil) type pannina,
adhu udane azhagaana TAMIL எழுத்துல convert aagum.

Example:
   "nalla irukkiya"   ->  "நல்ல இருக்கிய"
   "vanakkam nanba"   ->  "வனக்கம் நன்ப"
   "nandri"           ->  "நன்றி"

- Accurate suggestions: Google Input Tools transliteration-a use pannum
  (easytamiltyping.com maadhiri) -> correct spelling top-la varum.
- Internet illna, offline rule-based engine automatic-a fallback aagum.
- Post / Page editor la (Classic + Gutenberg) work aagum.

  Note: Accurate suggestions-ku type panra word Google Input Tools-ku
  (inputtools.google.com) anuppappadum. Internet illna, offline rules
  vachu approximate-a varum (edhuvum anuppaadhu).


== Install epadi? (Installation) ==

VAZHI 1 -- ZIP upload (easy):
  1. "tanglish-typing" folder-a ZIP pannunga (illa kudutha tanglish-typing.zip use pannunga).
  2. WordPress dashboard -> Plugins -> Add New -> Upload Plugin.
  3. ZIP file-a select panni "Install Now" click pannunga.
  4. "Activate Plugin" click pannunga.

VAZHI 2 -- FTP / File manager:
  1. "tanglish-typing" folder-a  wp-content/plugins/  la upload pannunga.
  2. Dashboard -> Plugins -> "Tanglish Typing" -> Activate.


== Epadi use panradhu? (Usage) ==

  1. Posts -> Add New (illa edhaachum post/page edit pannunga).
  2. Valadhu keezha moolaila oru pachai button varum: "Tanglish: ON".
  3. Editor la Tanglish type pannunga. Ovvoru word-kum, cursor keezha oru
     SUGGESTION DROPDOWN varum -- pala Tamil options kaattum.
        nalla  ->  1. நல்ல   2. நல்லா   3. நள்ள ...
  4. Ungaluku venMEE option-a ippadi choose pannunga:
        - Number key (1, 2, 3 ...) press pannunga, illa
        - Arrow keys (Up/Down) + Enter, illa
        - Mouse-la click pannunga, illa
        - SPACE press pannina -> highlight aana (top) option auto-select aagum.
        - Esc press pannina -> English word-aiye vecchukum (convert pannaadhu).
  5. Toggle button-la 3 mode irukku (click pannina maarum, illa Ctrl+Shift+T):
        Tanglish  ->  English check  ->  OFF  ->  (repeat)

== English grammar / spelling check (English check mode) ==

  1. Toggle-a "English check" mode-ku maathunga (pachai -> oodha color).
  2. Ungaloda post-a English-la muzhusa ezhuthunga.
  3. Keezha "Check English" button-a click pannunga.
  4. Spelling/grammar mistake irundhaa, andha word-la SUBTLE underline varum
     (spelling = sivappu pulli-koodu, grammar = neela pulli-koodu).
  5. Andha underline-a click pannina, chinna popup varum -- correct suggestion
     button(s). Adha click pannina, angeye correct aagidum.

  Note: English check-ku LanguageTool (api.languagetool.org) free service use
  aagum -- adhukku internet vேண்டும், matthu ungaloda text andha service-ku
  anuppappadum (grammar check panna). Privacy mukkiyam-na, English check mode-a
  use pannaadheenga; Tanglish mode 100% offline thaan.


== Typing guide (mukkiyam) ==

Uyir (vowels):
   a=அ  aa=ஆ  i=இ  ee/ii=ஈ  u=உ  oo/uu=ஊ
   e=எ  ae/E=ஏ  ai=ஐ  o=ஒ  oa/O=ஓ  au=ஔ

Sila special ezhuthu (idha kavaniங்க):
   t   = த   (ex: tamil -> தமில,  thanni -> தண்ணி)
   T   = ட   (ex: Tamில illa "d" use pannunga: paadam)
   n   = ந   (word start),   double "nn" -> ன்ன
   N   = ண   (ex: paNam -> பணம்)
   R   = ற   (ex: maRa -> மற)
   zh  = ழ   (ex: tamizh -> தமிழ்,  vazha -> வழ)
   L   = ள   (ex: puLi -> புளி)
   sh/S= ஷ    j=ஜ   h=ஹ

Tip: correct Tamil word venumna, sound-a paathu type pannunga:
   தமிழ்   -> "tamizh"
   பள்ளி    -> "paLLi"
   ஒழுக்கம் -> "ozhukkam"
   மரியாதை -> "mariyaadhai"


== Notes ==

- Idhu oru phonetic transliteration -- 100% perfect illa aana romba common
  Tamil words nalla varum. Sila words-ku capital letters (T, N, R, L, S)
  use pannina correct-a varum.
- Editor la ஏற்கனவே irukkura Tamil text-a idhu touch pannaadhu.
- English word-a Tamil-a maathaama vேண்டுமானால், adha type panni,
  convert aana piragu undo (Ctrl+Z) pannalam, illa Tanglish OFF pannunga.


== Files ==
   tanglish-typing.php   -- main plugin file
   assets/tanglish.js    -- transliteration engine
   assets/tanglish.css   -- toggle button style
   README.txt            -- indha file
