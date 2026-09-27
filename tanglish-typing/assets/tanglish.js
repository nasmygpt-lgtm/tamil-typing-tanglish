/**
 * Tanglish Typing - Offline transliteration engine
 * -------------------------------------------------
 * English letters la type panna Tamil-a convert pannum.
 * Word boundary (space / enter / punctuation) la convert aagum.
 *
 * No external API. Ella logic-um inga thaan.
 */
(function () {
    "use strict";

    /* =====================================================================
     * 1. TRANSLITERATION MAPS
     * ===================================================================*/

    // Uyir ezhuthukkal (vowels) - independent form (word start la varum)
    var VOWELS = {
        "a": "அ", "aa": "ஆ", "A": "ஆ",
        "i": "இ", "ii": "ஈ", "ee": "ஈ", "I": "ஈ",
        "u": "உ", "uu": "ஊ", "oo": "ஊ", "U": "ஊ",
        "e": "எ", "ae": "ஏ", "E": "ஏ",
        "ai": "ஐ",
        "o": "ஒ", "oa": "ஓ", "O": "ஓ",
        "au": "ஔ", "ou": "ஔ"
    };

    // Uyir matra (vowel signs) - mெய் ezhuthu-oda serum
    var VOWEL_SIGNS = {
        "a": "",        // inherent
        "aa": "ா", "A": "ா",
        "i": "ி", "ii": "ீ", "ee": "ீ", "I": "ீ",
        "u": "ு", "uu": "ூ", "oo": "ூ", "U": "ூ",
        "e": "ெ", "ae": "ே", "E": "ே",
        "ai": "ை",
        "o": "ொ", "oa": "ோ", "O": "ோ",
        "au": "ௌ", "ou": "ௌ"
    };

    // Mெய் ezhuthukkal (consonants) - base form (pulli-oda)
    // Tamil la 't' -> த (common), retroflex 'ட' kku 'T' use pannunga.
    // 'n' -> ந (dental, default), 'ன' kku word-middle la auto handle pannuvom.
    var CONSONANTS = {
        "k": "க்", "g": "க்", "kh": "க்", "gh": "க்",
        "ng": "ங்",
        "ch": "ச்", "c": "ச்", "s": "ஸ்", "j": "ஜ்", "jh": "ஜ்",
        "nj": "ஞ்",
        "T": "ட்", "th": "த்", "dh": "த்", "t": "த்", "d": "ட்", "D": "ட்",
        "N": "ண்", "nh": "ந்", "n": "ந்",
        "p": "ப்", "b": "ப்", "ph": "ப்", "bh": "ப்", "f": "ஃப்",
        "m": "ம்",
        "y": "ய்",
        "r": "ர்", "R": "ற்",
        "l": "ல்", "L": "ள்", "zh": "ழ்", "z": "ழ்",
        "v": "வ்", "w": "வ்",
        "sh": "ஷ்", "Sh": "ஷ்", "S": "ஷ்",
        "h": "ஹ்",
        "ksh": "க்ஷ்",
        "q": "க்"
    };

    // Special / aayudha
    var SPECIALS = {
        "ak": "ஃ" // aayudham (rare)
    };

    // Vowel keys - longest first (greedy match)
    var VOWEL_KEYS = Object.keys(VOWELS).sort(function (a, b) {
        return b.length - a.length;
    });
    // Consonant keys - longest first
    var CONSONANT_KEYS = Object.keys(CONSONANTS).sort(function (a, b) {
        return b.length - a.length;
    });

    /* =====================================================================
     * 2. CORE: oru word-a Tamil-a maathu
     * ===================================================================*/
    function transliterateWord(word) {
        if (!word) return word;

        // Word la Tamil already irundhaa (or numbers/symbols), skip pannu
        if (/[\u0B80-\u0BFF]/.test(word)) return word;
        if (!/[a-zA-Z]/.test(word)) return word;

        // Pre-process: common clusters + glides
        // "ndr" / "ntr" -> alveolar cluster (nandri -> நன்றி): n + R
        word = word.replace(/ndr/g, "nR").replace(/ntr/g, "nR");
        // vowel + 'i' at word end -> glide 'y' (poi -> poy => பொய்)
        // NOTE: "ai" oru valid diphthong (ஐ/ை) -> adha break pannaadhe.
        word = word.replace(/([eouEOU])i$/g, "$1y");

        var out = "";
        var i = 0;
        var n = word.length;

        while (i < n) {
            var matchedConsonant = null;
            var consLen = 0;

            // 2a. Consonant match panna paaru (longest first)
            for (var c = 0; c < CONSONANT_KEYS.length; c++) {
                var ck = CONSONANT_KEYS[c];
                if (word.substr(i, ck.length) === ck) {
                    matchedConsonant = CONSONANTS[ck];
                    consLen = ck.length;
                    break;
                }
            }

            if (matchedConsonant) {
                i += consLen;
                // Consonant-ku appuram vowel iruka nu paaru
                var matchedVowelSign = null;
                var vLen = 0;
                for (var v = 0; v < VOWEL_KEYS.length; v++) {
                    var vk = VOWEL_KEYS[v];
                    if (word.substr(i, vk.length) === vk) {
                        matchedVowelSign = VOWEL_SIGNS[vk];
                        vLen = vk.length;
                        break;
                    }
                }
                if (matchedVowelSign !== null) {
                    // consonant + vowel: pulli remove panni matra add pannu
                    // matchedConsonant kadaisila "்" irukkum -> adha remove pannu
                    var base = matchedConsonant.slice(0, -1); // remove pulli
                    out += base + matchedVowelSign;
                    i += vLen;
                } else {
                    // vowel illa -> pulli-oda consonant (mெய்)
                    out += matchedConsonant;
                }
                continue;
            }

            // 2b. Vowel match panna paaru (word start / consonant illama)
            var matchedVowel = null;
            var vwLen = 0;
            for (var vv = 0; vv < VOWEL_KEYS.length; vv++) {
                var vvk = VOWEL_KEYS[vv];
                if (word.substr(i, vvk.length) === vvk) {
                    matchedVowel = VOWELS[vvk];
                    vwLen = vvk.length;
                    break;
                }
            }
            if (matchedVowel) {
                out += matchedVowel;
                i += vwLen;
                continue;
            }

            // 2c. Edhuvum match aagala -> character-a appadiye vidu
            out += word.charAt(i);
            i += 1;
        }

        return applyTamilRules(out);
    }

    /* ---------------------------------------------------------------------
     * Tamil orthography rules (post-processing)
     * Tamil la sila ezhuthukkal position-oda maarum:
     *  - "ந" (dental na) word kadaisila / consonant munnadi -> "ன" (alveolar)
     *  - double "ண்ண", "ன்ன" etc. natural-a varum
     * ------------------------------------------------------------------- */
    function applyTamilRules(s) {
        // ந -> ன : word middle/end la, aana word-start la ந stay pannum.
        // Simple rule: mudhal ezhuthu ந-a irundhaa vidu, மத்தvai ன-a maathu.
        // (perfect illa aana common case-ku nalla work aagum)

        // Kadaisi "ந்" (pulli-oda, word end) -> "ன்"
        s = s.replace(/ந்$/g, "ன்");

        // Word middle la vowel-oda "ந" (start illama) -> "ன"
        // First character-a thavira மத்த "ந" (with vowel sign) -> "ன"
        var chars = Array.from(s);
        for (var idx = 1; idx < chars.length; idx++) {
            if (chars[idx] === "ந") {
                // munnadi character oru mெய் (pulli) illama irundhaa maathu
                var prev = chars[idx - 1];
                // "ந்த", "ந்த்ர" madhiri cluster la ந stay pannanum (nda sound)
                // aana simple case la (nalla, ன) alveolar venum
                chars[idx] = "ன";
            }
        }
        s = chars.join("");

        return s;
    }

    /* =====================================================================
     * 3. Full text la ella words-aiyum convert pannu (last word thavira)
     * ===================================================================*/
    // Sila common English words-a convert pannaama vidu (optional keep list)
    var KEEP_ENGLISH = {}; // venumna inga English words add pannalam

    function transliterateChunk(text) {
        // Word + separator-a pirichi, ovvoru word-aiyum maathu
        return text.replace(/[A-Za-z]+/g, function (w) {
            if (KEEP_ENGLISH[w.toLowerCase()]) return w;
            return transliterateWord(w);
        });
    }

    /* =====================================================================
     * 4. INPUT HANDLING - textarea / input / contenteditable
     * ---------------------------------------------------------------------
     * Approach: 'input' event-la, cursor-ku munnadi oru "complete-aana word"
     * (word + adhukku appuram space/punctuation) irundhaa, andha word-a
     * maathuvom. Idhu React (Gutenberg)-oda stable-a work aagum.
     * ===================================================================*/
    var enabled = true;

    // cursor-ku munnadi "word + boundary" pattern -> andha word-a maathanum
    // e.g. "hello nalla " la cursor kadaisila irundhaa -> "nalla" convert
    var WORD_BEFORE_BOUNDARY = /([A-Za-z]{1,})([ \t\n.,!?;:)("'\u00A0])$/;

    // -------- TEXTAREA / INPUT (Classic editor, title box) ----------
    function handleTextInput(el) {
        var pos = el.selectionStart;
        if (pos === null) return;
        var value = el.value;
        var before = value.slice(0, pos);
        var after = value.slice(pos);

        var m = before.match(WORD_BEFORE_BOUNDARY);
        if (!m) return;

        var word = m[1];
        var boundary = m[2];
        var converted = transliterateWord(word);
        if (converted === word) return;

        var head = before.slice(0, before.length - word.length - boundary.length);
        var newBefore = head + converted + boundary;
        el.value = newBefore + after;
        var newPos = newBefore.length;
        try { el.selectionStart = el.selectionEnd = newPos; } catch (e) {}
        el.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // -------- CONTENTEDITABLE (Gutenberg block) ----------
    function handleContentEditable() {
        var sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        var range = sel.getRangeAt(0);
        if (!range.collapsed) return;

        var node = range.startContainer;
        // text node illama (element) irundhaa, cursor-ku munnadi ulla text node-a edu
        if (node.nodeType !== 3 /*TEXT_NODE*/) {
            var child = node.childNodes[range.startOffset - 1];
            if (child && child.nodeType === 3) {
                node = child;
                range = document.createRange();
                range.setStart(node, node.textContent.length);
            } else {
                return;
            }
        }

        var offset = range.startOffset;
        var text = node.textContent;
        var before = text.slice(0, offset);

        var m = before.match(WORD_BEFORE_BOUNDARY);
        if (!m) return;

        var word = m[1];
        var boundary = m[2];
        var converted = transliterateWord(word);
        if (converted === word) return;

        var start = offset - word.length - boundary.length;
        node.textContent =
            text.slice(0, start) + converted + boundary + text.slice(offset);

        // Cursor-a correct position la vai
        var newOffset = start + converted.length + boundary.length;
        try {
            var newRange = document.createRange();
            newRange.setStart(node, Math.min(newOffset, node.textContent.length));
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
        } catch (e) {}

        // React-ku theriya input event fire pannu
        var host = node.parentElement;
        while (host && !host.isContentEditable) host = host.parentElement;
        if (host) {
            host.dispatchEvent(
                new InputEvent("input", { bubbles: true, cancelable: false })
            );
        }
    }

    // Ovvoru input-lum (space/enter type panra pothu) convert try pannu
    function onInput(e) {
        if (!enabled) return;
        var el = e.target;
        var tag = (el.tagName || "").toLowerCase();

        if (tag === "textarea" || (tag === "input" && (el.type === "text" || el.type === "search"))) {
            handleTextInput(el);
        } else if (el.isContentEditable) {
            handleContentEditable();
        }
    }

    /* =====================================================================
     * 5. TOGGLE BUTTON UI
     * ===================================================================*/
    function buildToggle() {
        var btn = document.createElement("div");
        btn.id = "tanglish-toggle";
        btn.className = "tanglish-toggle on";
        btn.innerHTML = '<span class="tt-dot"></span> Tanglish: <b>ON</b>';
        btn.title = "Tanglish typing ON/OFF (Ctrl+Shift+T)";

        btn.addEventListener("click", toggleEnabled);
        document.body.appendChild(btn);
        return btn;
    }

    var toggleBtn = null;
    function toggleEnabled() {
        enabled = !enabled;
        if (!toggleBtn) return;
        if (enabled) {
            toggleBtn.className = "tanglish-toggle on";
            toggleBtn.innerHTML = '<span class="tt-dot"></span> Tanglish: <b>ON</b>';
        } else {
            toggleBtn.className = "tanglish-toggle off";
            toggleBtn.innerHTML = '<span class="tt-dot"></span> Tanglish: <b>OFF</b>';
        }
    }

    /* =====================================================================
     * 6. INIT
     * ===================================================================*/
    function init() {
        // 'input' event-la convert pannu (React/Gutenberg-oda stable)
        document.addEventListener("input", onInput, true);

        // Keyboard shortcut: Ctrl+Shift+T (ON/OFF)
        document.addEventListener("keydown", function (e) {
            if (e.ctrlKey && e.shiftKey && (e.key === "T" || e.key === "t")) {
                e.preventDefault();
                toggleEnabled();
            }
        });

        toggleBtn = buildToggle();

        // Gutenberg block editor sila version-la iframe la irukkum
        attachToEditorIframes();
    }

    // Gutenberg iframe (site editor / newer versions) support
    function attachToEditorIframes() {
        var tries = 0;
        var timer = setInterval(function () {
            tries++;
            var iframe = document.querySelector('iframe[name="editor-canvas"]');
            if (iframe && iframe.contentDocument) {
                try {
                    iframe.contentDocument.addEventListener("input", onInput, true);
                } catch (err) { /* cross-origin - ignore */ }
            }
            if (tries > 30) clearInterval(timer); // 15 secondsku appuram stop
        }, 500);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // Debug-ku global-a expose pannu (console la test panna)
    window.TanglishTyping = {
        convert: transliterateChunk,
        word: transliterateWord
    };
})();
