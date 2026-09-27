=== English Writing Check ===
Version: 1.0.0
Requires: WordPress 5.0+
License: GPL-2.0+

== Idhu enna? (What is this?) ==

Post / Page editor la English-la ezhuthina, spelling + grammar mistakes-a
kandupidichi, correct suggestion kaattum. Ungaloda Tamil (Tanglish) plugin-oda
edhuvum sambandham illa -- idhu THANI (separate) plugin. Rendaiyum
onnaa illa thani-thaniyaa use pannalaam.


== Install epadi? ==

  1. "english-writing-check" folder-a ZIP pannunga (illa kudutha ZIP use pannunga).
  2. WordPress -> Plugins -> Add New -> Upload Plugin.
  3. ZIP select -> Install Now -> Activate.


== Epadi use panradhu? ==

  1. Post / Page editor la, IDADHU keezha moolaila (bottom-LEFT) oru button varum:
        "English Check: OFF"
     (Tamil plugin button valadhu keezha; idhu idadhu keezha -- rendum thani.)
  2. Adha click pannina "ON" aagum (oodha color) + udane check panna aarambikkum.
  3. Ungaloda post-a English-la ezhuthunga.
  4. Innoru thadava button ("Check English") click pannina, editor-la ulla
     text-a scan pannum.
  5. Mistake irundhaa, valadhu pakkam oru PANEL varum -- ovvoru mistake-um:
        - Enna mistake (message)
        - Context (andha vaakiyam, mistake sivappu-la)
        - Correct suggestion button(s)
  6. Suggestion button-a click pannina, angeye correct aagidum.
  7. Keyboard shortcut: Ctrl+Shift+E (toggle + check).


== Notes ==

- Grammar/spelling check-ku LanguageTool (api.languagetool.org) free service
  use aagum. Adhukku INTERNET vேண்டும், matthu ungaloda text andha service-ku
  anuppappadum. Privacy mukkiyam-na, idha use pannaadheenga.
- Neenga edit panra block (paragraph) thaan check aagum. Ovvoru block-aiyum
  thani-thaniyaa check pannunga (cursor-a andha block-la vachu button click).
- WordPress core-a, illa vera plugins-a idhu touch pannaadhu.


== Files ==
   english-writing-check.php   -- main plugin file
   assets/ewc.js               -- check logic (LanguageTool + panel)
   assets/ewc.css              -- button + panel style
   README.txt                  -- indha file
