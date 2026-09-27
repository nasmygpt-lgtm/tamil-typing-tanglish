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
     * 2b. VARIANT GENERATOR - multiple Tamil options for one word
     * Returns a ranked, de-duplicated list of Tamil candidates so the user
     * can pick the right one (e.g. "nalla" -> [நல்ல, நல்லா]).
     * ------------------------------------------------------------------ */
    var AA_SIGN = "\u0BBE";     // vowel sign aa
    var LA_1 = "\u0BB2";        // la
    var LA_2 = "\u0BB3";        // La (retroflex)
    var LA_3 = "\u0BB4";        // zha
    var RA_1 = "\u0BB0";        // ra
    var RA_2 = "\u0BB1";        // Ra (alveolar)
    var NA_RETRO = "\u0BA3";    // Na (retroflex, "periya moonu suzhi na")

    function pushUnique(arr, val) {
        if (val && arr.indexOf(val) === -1) arr.push(val);
    }

    function getSuggestions(word) {
        if (!word || !/[a-zA-Z]/.test(word)) return [];

        var base = transliterateWord(word);
        var out = [];
        pushUnique(out, base);

        // Variant 1: add trailing aa (nalla -> நல்லா) if word ends in a short 'a'
        // (i.e. base ends with a bare consonant cluster's inherent 'a')
        var lastChar = base.charAt(base.length - 1);
        // if base does not already end with a vowel sign / matra, offer the aa form
        var endsWithMatra = /[\u0BBE-\u0BCC\u0BCD]$/.test(base);
        if (!endsWithMatra && /[a]$/.test(word)) {
            pushUnique(out, base + AA_SIGN);
        }

        // Variant 2: la/La/zha swaps for the letter 'l' (ambiguous in Tanglish)
        if (base.indexOf(LA_1) !== -1) {
            pushUnique(out, base.split(LA_1).join(LA_2)); // ள
            pushUnique(out, base.split(LA_1).join(LA_3)); // ழ
        }

        // Variant 3: ra/Ra swap for 'r'
        if (base.indexOf(RA_1) !== -1) {
            pushUnique(out, base.split(RA_1).join(RA_2)); // ற
        }

        // Variant 4: na swaps. Tamil-la moonu 'na' irukku:
        //   ந (dental)  /  ன (alveolar)  /  ண (retroflex - periya moonu suzhi)
        // Ovvoru na form-kum, matha rendu forms-aiyum option-a kudu.
        var naForms = [NA_DENTAL, NA_ALVEOLAR, NA_RETRO];
        for (var f = 0; f < naForms.length; f++) {
            var present = naForms[f];
            if (base.indexOf(present) !== -1) {
                for (var g = 0; g < naForms.length; g++) {
                    if (g !== f) {
                        pushUnique(out, base.split(present).join(naForms[g]));
                    }
                }
            }
        }

        // Keep the English original as the last option (in case user wants it)
        pushUnique(out, word);

        return out.slice(0, 7); // max 7 options
    }

    /* ------------------------------------------------------------------ *
     * 3. INPUT HANDLING
     * On 'input', if the text right before the cursor is "word + boundary",
     * convert that word. Works with React (Gutenberg).
     * ------------------------------------------------------------------ */
    var enabled = true;

    /*
     * Gutenberg / React-safe approach:
     * We intercept the boundary character (space, enter, punctuation) at
     * 'beforeinput'. Before it is inserted, we look at the word right before
     * the caret, and if it needs converting, we select that word and replace
     * it using document.execCommand('insertText'). execCommand keeps React's
     * internal state in sync, so the change is NOT reverted. The boundary
     * character then proceeds to insert normally.
     */
    // ------------------------------------------------------------------
    // SUGGESTION STATE
    // ------------------------------------------------------------------
    // While the user types an English word, we track it and show a dropdown
    // of Tamil options under the caret. The user selects via number key,
    // arrow+Enter, mouse click, or Space (picks the highlighted option).
    var sug = {
        active: false,
        el: null,           // the editable element (textarea/input/contenteditable)
        win: window,        // owner window (for iframe support)
        word: "",           // current English word being typed
        options: [],        // Tamil candidates
        index: 0,           // highlighted option
        box: null           // dropdown DOM element
    };

    function isEditableTarget(el) {
        if (!el || !el.tagName) return null;
        var tag = el.tagName.toLowerCase();
        if (tag === "textarea" || (tag === "input" && (el.type === "text" || el.type === "search"))) {
            return "field";
        }
        if (el.isContentEditable) return "editable";
        return null;
    }

    // Read the English word immediately before the caret.
    // Returns { word, replace(newText) } or null.
    function readWordBeforeCaret(el, kind, win) {
        if (kind === "field") {
            var pos = el.selectionStart;
            if (pos === null || pos === undefined) return null;
            var value = el.value;
            var m = value.slice(0, pos).match(/([A-Za-z]{1,})$/);
            if (!m) return null;
            var word = m[1];
            return {
                word: word,
                replace: function (newText) {
                    var head = value.slice(0, pos - word.length);
                    var after = value.slice(pos);
                    el.value = head + newText + after;
                    var np = head.length + newText.length;
                    try { el.selectionStart = el.selectionEnd = np; } catch (e) {}
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                }
            };
        }
        // contenteditable
        var w = win || window;
        var d = w.document;
        var selc = w.getSelection ? w.getSelection() : null;
        if (!selc || selc.rangeCount === 0) return null;
        var range = selc.getRangeAt(0);
        if (!range.collapsed) return null;
        var node = range.startContainer;
        var offset = range.startOffset;
        if (node.nodeType !== 3) {
            var child = node.childNodes[offset - 1];
            if (child && child.nodeType === 3) { node = child; offset = node.textContent.length; }
            else return null;
        }
        var mm = node.textContent.slice(0, offset).match(/([A-Za-z]{1,})$/);
        if (!mm) return null;
        var wd = mm[1];
        return {
            word: wd,
            replace: function (newText) {
                try {
                    var r = d.createRange();
                    r.setStart(node, offset - wd.length);
                    r.setEnd(node, offset);
                    selc.removeAllRanges();
                    selc.addRange(r);
                    d.execCommand("insertText", false, newText);
                } catch (e) {}
            }
        };
    }

    // Caret pixel position (for dropdown placement)
    function getCaretRect(el, kind, win) {
        try {
            if (kind === "editable") {
                var w = win || window;
                var s = w.getSelection();
                if (s && s.rangeCount) {
                    var rr = s.getRangeAt(0).cloneRange();
                    var rects = rr.getClientRects();
                    var rect = rects && rects.length ? rects[rects.length - 1] : rr.getBoundingClientRect();
                    // adjust for iframe offset
                    var fr = frameOffset(win);
                    return { left: rect.left + fr.x, bottom: rect.bottom + fr.y };
                }
            }
            // field: approximate at element's caret using bounding box
            var b = el.getBoundingClientRect();
            return { left: b.left + 6, bottom: b.top + 26 };
        } catch (e) {
            var bb = el.getBoundingClientRect();
            return { left: bb.left, bottom: bb.bottom };
        }
    }

    function frameOffset(win) {
        try {
            if (win && win.frameElement) {
                var r = win.frameElement.getBoundingClientRect();
                return { x: r.left, y: r.top };
            }
        } catch (e) {}
        return { x: 0, y: 0 };
    }

    // ------------------------------------------------------------------
    // DROPDOWN UI
    // ------------------------------------------------------------------
    function ensureBox() {
        if (sug.box) return sug.box;
        var box = document.createElement("div");
        box.id = "tanglish-suggest";
        box.className = "tanglish-suggest";
        box.style.display = "none";
        document.body.appendChild(box);
        sug.box = box;
        return box;
    }

    function showSuggestions(el, kind, win, word, options) {
        var box = ensureBox();
        sug.active = true;
        sug.el = el; sug.kind = kind; sug.win = win;
        sug.word = word; sug.options = options; sug.index = 0;

        box.innerHTML = "";
        options.forEach(function (opt, i) {
            var row = document.createElement("div");
            row.className = "tt-item" + (i === 0 ? " active" : "");
            row.setAttribute("data-i", i);
            var num = document.createElement("span");
            num.className = "tt-num";
            num.textContent = (i + 1);
            var txt = document.createElement("span");
            txt.className = "tt-txt";
            txt.textContent = opt;
            row.appendChild(num);
            row.appendChild(txt);
            row.addEventListener("mousedown", function (ev) {
                ev.preventDefault(); // keep caret
                chooseOption(i);
            });
            box.appendChild(row);
        });

        var pos = getCaretRect(el, kind, win);
        box.style.left = Math.max(4, pos.left) + "px";
        box.style.top = (pos.bottom + 4) + "px";
        box.style.display = "block";
    }

    function hideSuggestions() {
        sug.active = false;
        sug.options = [];
        if (sug.box) sug.box.style.display = "none";
    }

    function highlight(i) {
        if (!sug.box) return;
        var items = sug.box.querySelectorAll(".tt-item");
        for (var k = 0; k < items.length; k++) {
            items[k].className = "tt-item" + (k === i ? " active" : "");
        }
        sug.index = i;
    }

    function chooseOption(i) {
        if (!sug.active || !sug.options.length) return;
        var choice = sug.options[i];
        var info = readWordBeforeCaret(sug.el, sug.kind, sug.win);
        if (info && info.word === sug.word) {
            info.replace(choice);
        }
        hideSuggestions();
    }

    // ------------------------------------------------------------------
    // EVENT HANDLING
    // ------------------------------------------------------------------
    // As the user types, re-read the current word and refresh suggestions.
    function refreshSuggestions(el, kind, win) {
        var info = readWordBeforeCaret(el, kind, win);
        if (!info) { hideSuggestions(); return; }
        var opts = getSuggestions(info.word);
        // If the only option is the English word itself, hide.
        if (!opts.length || (opts.length === 1 && opts[0] === info.word)) {
            hideSuggestions();
            return;
        }
        showSuggestions(el, kind, win, info.word, opts);
    }

    function onInput(e) {
        if (!enabled) return;
        var el = e.target;
        var kind = isEditableTarget(el);
        if (!kind) { hideSuggestions(); return; }
        var win = (el.ownerDocument && el.ownerDocument.defaultView) || window;
        // Defer so the DOM reflects the just-typed character.
        setTimeout(function () { refreshSuggestions(el, kind, win); }, 0);
    }

    function onKeyDownSuggest(e) {
        if (!enabled || !sug.active || !sug.options.length) return;
        var key = e.key;

        // Number keys 1..9 -> pick that option
        if (/^[1-9]$/.test(key)) {
            var idx = parseInt(key, 10) - 1;
            if (idx < sug.options.length) {
                e.preventDefault();
                chooseOption(idx);
                return;
            }
        }

        if (key === "ArrowDown") {
            e.preventDefault();
            highlight((sug.index + 1) % sug.options.length);
        } else if (key === "ArrowUp") {
            e.preventDefault();
            highlight((sug.index - 1 + sug.options.length) % sug.options.length);
        } else if (key === "Enter" || key === "Tab") {
            e.preventDefault();
            chooseOption(sug.index);
        } else if (key === " ") {
            // Space picks the highlighted option, then lets the space through.
            chooseOption(sug.index);
            // don't preventDefault -> space still inserted after Tamil word
        } else if (key === "Escape") {
            e.preventDefault();
            hideSuggestions();
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
        if (!enabled) hideSuggestions();
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
    function bindDoc(doc) {
        if (!doc || doc.__tanglishBound) return;
        doc.addEventListener("input", onInput, true);
        // keydown must run BEFORE the editor handles it -> capture phase
        doc.addEventListener("keydown", onKeyDownSuggest, true);
        // hide on click / focus change
        doc.addEventListener("mousedown", function (e) {
            if (sug.box && e.target && sug.box.contains(e.target)) return;
            hideSuggestions();
        }, true);
        doc.__tanglishBound = true;
    }

    function init() {
        bindDoc(document);

        document.addEventListener("keydown", function (e) {
            if (e.ctrlKey && e.shiftKey && (e.key === "T" || e.key === "t")) {
                e.preventDefault();
                toggleEnabled();
            }
        });

        toggleBtn = buildToggle();
        attachToEditorIframes();
    }

    // Gutenberg iframe (newer versions) support - attach to any editor iframe
    function attachToEditorIframes() {
        var timer = setInterval(function () {
            var iframes = document.querySelectorAll('iframe');
            for (var i = 0; i < iframes.length; i++) {
                try {
                    bindDoc(iframes[i].contentDocument);
                } catch (err) { /* cross-origin - ignore */ }
            }
        }, 700);
        setTimeout(function () { clearInterval(timer); }, 60000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // Expose for console testing
    window.TanglishTyping = {
        convert: transliterateChunk,
        word: transliterateWord,
        suggestions: getSuggestions
    };
})();
