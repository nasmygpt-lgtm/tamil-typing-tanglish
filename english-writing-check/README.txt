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


== Epadi use panradhu? (LIVE check) ==

  1. Post / Page editor la, IDADHU keezha moolaila (bottom-LEFT) oru button varum:
        "English Check: ON"  (default-a ON, oodha color)
     (Tamil plugin button valadhu keezha; idhu idadhu keezha -- rendum thani.)
  2. Ungaloda post-a English-la ezhuthunga. BUTTON click panna vேண்டாம் --
     type panra pothu AUTO-va check aagum (konja neram nிறுத்தinaa).
  3. Mistake irundhaa, andha word-ku KEEZHA subtle underline varum:
        - Spelling mistake  -> sivappu (red) underline
        - Grammar / tense    -> neelam (blue) underline
  4. Andha underline-a CLICK pannina, chinna popup varum -- correct
     suggestion button(s). Adha click pannina angeye correct aagidum.
        wrongg   -> wrong
        he go    -> he goes
        I has    -> I have
  5. ON/OFF: button click (illa Ctrl+Shift+E).


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
