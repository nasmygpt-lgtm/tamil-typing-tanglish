/*
 * Tanglish Typing - Offline transliteration engine
 * Type Tamil using English letters; converts to Tamil script on space/enter.
 * No external API. All logic is local.
 */
(function () {
    "use strict";

    /* ------------------------------------------------------------------ *
     * 1. TRANSLITERATION MAPS
     * ------------------------------------------------------------------ */

    // Vowels - independent form (used at word start)
    var VOWELS = {
        "a": "\u0B85", "aa": "\u0B86", "A": "\u0B86",
        "i": "\u0B87", "ii": "\u0B88", "ee": "\u0B88", "I": "\u0B88",
        "u": "\u0B89", "uu": "\u0B8A", "oo": "\u0B8A", "U": "\u0B8A",
        "e": "\u0B8E", "ae": "\u0B8F", "E": "\u0B8F",
        "ai": "\u0B90",
        "o": "\u0B92", "oa": "\u0B93", "O": "\u0B93",
        "au": "\u0B94", "ou": "\u0B94"
    };

    // Vowel signs (matra) - combine with a consonant
    var VOWEL_SIGNS = {
        "a": "",
        "aa": "\u0BBE", "A": "\u0BBE",
        "i": "\u0BBF", "ii": "\u0BC0", "ee": "\u0BC0", "I": "\u0BC0",
        "u": "\u0BC1", "uu": "\u0BC2", "oo": "\u0BC2", "U": "\u0BC2",
        "e": "\u0BC6", "ae": "\u0BC7", "E": "\u0BC7",
        "ai": "\u0BC8",
        "o": "\u0BCA", "oa": "\u0BCB", "O": "\u0BCB",
        "au": "\u0BCC", "ou": "\u0BCC"
    };

    // Consonants - base form (with pulli / virama). 't'->TA (dental) by default,
    // use 'T' for retroflex. 'n'->dental NA by default.
    var VIRAMA = "\u0BCD";
    var CONSONANTS = {
        "k": "\u0B95" + VIRAMA, "g": "\u0B95" + VIRAMA, "kh": "\u0B95" + VIRAMA, "gh": "\u0B95" + VIRAMA,
        "ng": "\u0B99" + VIRAMA,
        "ch": "\u0B9A" + VIRAMA, "c": "\u0B9A" + VIRAMA, "s": "\u0BB8" + VIRAMA, "j": "\u0B9C" + VIRAMA, "jh": "\u0B9C" + VIRAMA,
        "nj": "\u0B9E" + VIRAMA,
        "T": "\u0B9F" + VIRAMA, "th": "\u0BA4" + VIRAMA, "dh": "\u0BA4" + VIRAMA, "t": "\u0BA4" + VIRAMA, "d": "\u0B9F" + VIRAMA, "D": "\u0B9F" + VIRAMA,
        "N": "\u0BA3" + VIRAMA, "nh": "\u0BA8" + VIRAMA, "n": "\u0BA8" + VIRAMA,
        "p": "\u0BAA" + VIRAMA, "b": "\u0BAA" + VIRAMA, "ph": "\u0BAA" + VIRAMA, "bh": "\u0BAA" + VIRAMA, "f": "\u0B83\u0BAA" + VIRAMA,
        "m": "\u0BAE" + VIRAMA,
        "y": "\u0BAF" + VIRAMA,
        "r": "\u0BB0" + VIRAMA, "R": "\u0BB1" + VIRAMA,
        "l": "\u0BB2" + VIRAMA, "L": "\u0BB3" + VIRAMA, "zh": "\u0BB4" + VIRAMA, "z": "\u0BB4" + VIRAMA,
        "v": "\u0BB5" + VIRAMA, "w": "\u0BB5" + VIRAMA,
        "sh": "\u0BB7" + VIRAMA, "Sh": "\u0BB7" + VIRAMA, "S": "\u0BB7" + VIRAMA,
        "h": "\u0BB9" + VIRAMA,
        "ksh": "\u0B95" + VIRAMA + "\u0BB7" + VIRAMA,
        "q": "\u0B95" + VIRAMA
    };

    // Longest keys first (greedy match)
    var VOWEL_KEYS = Object.keys(VOWELS).sort(function (a, b) { return b.length - a.length; });
    var CONSONANT_KEYS = Object.keys(CONSONANTS).sort(function (a, b) { return b.length - a.length; });

    var NA_DENTAL = "\u0BA8"; // dental na
    var NA_ALVEOLAR = "\u0BA9"; // alveolar na

    /* ------------------------------------------------------------------ *
     * 2. CORE: transliterate one word
     * ------------------------------------------------------------------ */
    function transliterateWord(word) {
        if (!word) return word;
        if (/[\u0B80-\u0BFF]/.test(word)) return word; // already Tamil
        if (!/[a-zA-Z]/.test(word)) return word;

        // clusters + glides
        word = word.replace(/ndr/g, "nR").replace(/ntr/g, "nR");
        word = word.replace(/([eouEOU])i$/g, "$1y"); // poi -> poy (keep 'ai')

        var out = "";
        var i = 0;
        var n = word.length;

        while (i < n) {
            var matchedConsonant = null;
            var consLen = 0;
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
                    var base = matchedConsonant.slice(0, -1); // remove virama
                    out += base + matchedVowelSign;
                    i += vLen;
                } else {
                    out += matchedConsonant;
                }
                continue;
            }

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

            out += word.charAt(i);
            i += 1;
        }

        return applyTamilRules(out);
    }

    // Post-processing: dental na -> alveolar na in word-medial/final positions
    function applyTamilRules(s) {
        s = s.replace(new RegExp(NA_DENTAL + VIRAMA + "$", "g"), NA_ALVEOLAR + VIRAMA);
        var chars = Array.from(s);
        for (var idx = 1; idx < chars.length; idx++) {
            if (chars[idx] === NA_DENTAL) {
                chars[idx] = NA_ALVEOLAR;
            }
        }
        return chars.join("");
    }

    function transliterateChunk(text) {
        return text.replace(/[A-Za-z]+/g, function (w) {
            return transliterateWord(w);
        });
    }

    /* ------------------------------------------------------------------ *
     * 3. INPUT HANDLING
     * On 'input', if the text right before the cursor is "word + boundary",
     * convert that word. Works with React (Gutenberg).
     * ------------------------------------------------------------------ */
    var enabled = true;

    var WORD_BEFORE_BOUNDARY = /([A-Za-z]{1,})([ \t\n.,!?;:)("'\u00A0])$/;

    function handleTextInput(el) {
        var pos = el.selectionStart;
        if (pos === null || pos === undefined) return;
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

    function handleContentEditable() {
        var sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        var range = sel.getRangeAt(0);
        if (!range.collapsed) return;

        var node = range.startContainer;
        if (node.nodeType !== 3) {
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
        node.textContent = text.slice(0, start) + converted + boundary + text.slice(offset);

        var newOffset = start + converted.length + boundary.length;
        try {
            var newRange = document.createRange();
            newRange.setStart(node, Math.min(newOffset, node.textContent.length));
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
        } catch (e) {}

        var host = node.parentElement;
        while (host && !host.isContentEditable) host = host.parentElement;
        if (host) {
            try {
                host.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: false }));
            } catch (e) {}
        }
    }

    function onInput(e) {
        if (!enabled) return;
        var el = e.target;
        if (!el || !el.tagName) return;
        var tag = el.tagName.toLowerCase();

        if (tag === "textarea" || (tag === "input" && (el.type === "text" || el.type === "search"))) {
            handleTextInput(el);
        } else if (el.isContentEditable) {
            handleContentEditable();
        }
    }

    /* ------------------------------------------------------------------ *
     * 4. TOGGLE BUTTON UI
     * ------------------------------------------------------------------ */
    var toggleBtn = null;

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

    /* ------------------------------------------------------------------ *
     * 5. INIT
     * ------------------------------------------------------------------ */
    function init() {
        document.addEventListener("input", onInput, true);

        document.addEventListener("keydown", function (e) {
            if (e.ctrlKey && e.shiftKey && (e.key === "T" || e.key === "t")) {
                e.preventDefault();
                toggleEnabled();
            }
        });

        toggleBtn = buildToggle();
        attachToEditorIframes();
    }

    // Gutenberg iframe (newer versions) support
    function attachToEditorIframes() {
        var tries = 0;
        var timer = setInterval(function () {
            tries++;
            var iframe = document.querySelector('iframe[name="editor-canvas"]');
            if (iframe && iframe.contentDocument) {
                try {
                    iframe.contentDocument.addEventListener("input", onInput, true);
                } catch (err) { /* cross-origin */ }
            }
            if (tries > 30) clearInterval(timer);
        }, 500);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // Expose for console testing
    window.TanglishTyping = {
        convert: transliterateChunk,
        word: transliterateWord
    };
})();
