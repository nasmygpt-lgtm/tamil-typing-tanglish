/*
 * English Writing Check - standalone WordPress plugin
 * ---------------------------------------------------
 * A floating button ("Check English") scans the editor block you're working
 * in, sends the text to LanguageTool's free API, and shows spelling/grammar
 * issues in a clean side PANEL. Each issue lists its context + suggestion
 * buttons; clicking a suggestion applies the fix to that block.
 *
 * Independent of the Tamil plugin. No API key needed.
 */
(function () {
    "use strict";

    var LT_ENDPOINT = "https://api.languagetool.org/v2/check";

    var state = {
        on: false,        // English check mode on/off
        el: null,         // editable being checked
        kind: null,       // "editable" | "field"
        win: window,
        doc: document,
        baseText: "",     // exact text that was checked (offsets relative to this)
        matches: [],
        btn: null,
        panel: null,
        lastEditable: null
    };

    /* ---------------- editable detection ---------------- */
    function editableKind(el) {
        if (!el || !el.tagName) return null;
        var tag = el.tagName.toLowerCase();
        if (tag === "textarea" || (tag === "input" && (el.type === "text" || el.type === "search"))) {
            return "field";
        }
        if (el.isContentEditable) return "editable";
        return null;
    }

    function allDocs() {
        var docs = [document];
        var iframes = document.querySelectorAll("iframe");
        for (var i = 0; i < iframes.length; i++) {
            try { if (iframes[i].contentDocument) docs.push(iframes[i].contentDocument); }
            catch (e) {}
        }
        return docs;
    }

    // Remember the last editable the user focused (so Check works after
    // they click our button and the block loses focus).
    function trackFocus() {
        allDocs().forEach(function (d) {
            if (d.__ewcFocusBound) return;
            d.addEventListener("focusin", function (e) {
                var k = editableKind(e.target);
                if (k) {
                    state.lastEditable = {
                        el: e.target, kind: k,
                        win: d.defaultView || window, doc: d
                    };
                }
            }, true);
            d.__ewcFocusBound = true;
        });
    }

    function findEditable() {
        // 1) currently focused editable
        var docs = allDocs();
        for (var i = 0; i < docs.length; i++) {
            var ae = docs[i].activeElement;
            var k = editableKind(ae);
            if (k) return { el: ae, kind: k, win: docs[i].defaultView || window, doc: docs[i] };
        }
        // 2) last-focused editable we remembered
        if (state.lastEditable && state.lastEditable.el && state.lastEditable.el.isConnected) {
            return state.lastEditable;
        }
        // 3) first content block / textarea
        for (var j = 0; j < docs.length; j++) {
            var ce = docs[j].querySelector('.block-editor-rich-text__editable, [contenteditable="true"]');
            if (ce) return { el: ce, kind: "editable", win: docs[j].defaultView || window, doc: docs[j] };
            var ta = docs[j].querySelector("textarea");
            if (ta) return { el: ta, kind: "field", win: docs[j].defaultView || window, doc: docs[j] };
        }
        return null;
    }

    function getText(t) {
        return (t.kind === "field") ? (t.el.value || "") : (t.el.textContent || "");
    }

    /* ---------------- run check ---------------- */
    function runCheck() {
        if (!state.on) return;
        var target = findEditable();
        if (!target) { flash("Click inside the editor first"); return; }

        var text = getText(target);
        if (!text || !text.trim()) { flash("Type something first"); return; }

        state.el = target.el; state.kind = target.kind;
        state.win = target.win; state.doc = target.doc;
        state.baseText = text;

        flash("Checking...");

        var body = "text=" + encodeURIComponent(text) + "&language=en-US&level=default";
        fetch(LT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            body: body
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            state.matches = (data && data.matches) || [];
            renderPanel();
            flash(state.matches.length ? (state.matches.length + " issue(s)") : "\u2713 No mistakes!");
        })
        .catch(function () {
            flash("Check failed");
            renderError();
        });
    }

    function flash(msg) {
        if (!state.btn) return;
        state.btn.textContent = msg;
        setTimeout(function () {
            if (state.on) state.btn.textContent = "\u2713 Check English";
        }, 2500);
    }

    /* ---------------- panel UI ---------------- */
    function ensurePanel() {
        if (state.panel) return state.panel;
        var p = document.createElement("div");
        p.id = "ewc-panel";
        p.className = "ewc-panel";
        document.body.appendChild(p);
        state.panel = p;
        return p;
    }

    function esc(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function closePanel() { if (state.panel) state.panel.style.display = "none"; }

    function renderError() {
        var p = ensurePanel();
        p.innerHTML =
            '<div class="ewc-head">English Check<span class="ewc-x">&times;</span></div>' +
            '<div class="ewc-empty">Check failed. Internet illa, illa LanguageTool ' +
            'service reach aagala. Konja neram kazhichi try pannunga.</div>';
        wireClose(p);
        p.style.display = "block";
    }

    function renderPanel() {
        var p = ensurePanel();
        var m = state.matches;

        var head = '<div class="ewc-head">English Check' +
            (m.length ? (' &mdash; ' + m.length + ' issue(s)') : '') +
            '<span class="ewc-x">&times;</span></div>';

        if (!m.length) {
            p.innerHTML = head +
                '<div class="ewc-empty">\u2713 No spelling / grammar mistakes. Nalla ezhuthiteenga!</div>';
            wireClose(p);
            p.style.display = "block";
            return;
        }

        var body = '<div class="ewc-body">';
        for (var i = 0; i < m.length; i++) {
            var it = m[i];
            var ctx = it.context || {};
            var ct = ctx.text || "";
            var co = (typeof ctx.offset === "number") ? ctx.offset : 0;
            var cl = (typeof ctx.length === "number") ? ctx.length : 0;
            var before = esc(ct.slice(0, co));
            var bad = esc(ct.slice(co, co + cl));
            var after = esc(ct.slice(co + cl));

            body += '<div class="ewc-issue">';
            body += '<div class="ewc-msg">' + esc(it.shortMessage || it.message || "Issue") + '</div>';
            body += '<div class="ewc-ctx">' + before + '<span class="ewc-bad">' + bad + '</span>' + after + '</div>';

            var reps = (it.replacements || []).slice(0, 5);
            if (reps.length) {
                body += '<div class="ewc-fixes">';
                for (var r = 0; r < reps.length; r++) {
                    var val = reps[r].value;
                    body += '<button class="ewc-fix" data-idx="' + i + '" data-rep="' +
                        esc(val) + '">' + esc(val && val.length ? val : "(remove)") + '</button>';
                }
                body += '</div>';
            } else {
                body += '<div class="ewc-nofix">No auto-suggestion</div>';
            }
            body += '</div>';
        }
        body += '</div>';

        p.innerHTML = head + body;

        var btns = p.querySelectorAll(".ewc-fix");
        for (var b = 0; b < btns.length; b++) {
            btns[b].addEventListener("click", function () {
                applyFix(parseInt(this.getAttribute("data-idx"), 10), this.getAttribute("data-rep"));
            });
        }
        wireClose(p);
        p.style.display = "block";
    }

    function wireClose(p) {
        var x = p.querySelector(".ewc-x");
        if (x) x.addEventListener("click", closePanel);
    }

    /* ---------------- apply fix ---------------- */
    function applyFix(idx, replacement) {
        var m = state.matches[idx];
        if (!m) return;
        if (replacement == null) replacement = "";

        var current = (state.kind === "field")
            ? (state.el.value || "")
            : (state.el.textContent || "");

        if (current !== state.baseText) {
            flash("Text changed - re-checking");
            setTimeout(runCheck, 200);
            return;
        }

        var newText = state.baseText.slice(0, m.offset) +
            replacement + state.baseText.slice(m.offset + m.length);

        if (state.kind === "field") {
            state.el.value = newText;
            state.el.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
            replaceEditableText(state.el, state.doc, state.win, newText);
        }
        // re-check so remaining offsets refresh
        setTimeout(runCheck, 300);
    }

    function replaceEditableText(el, doc, win, newText) {
        try {
            el.focus();
            var sel = win.getSelection();
            var range = doc.createRange();
            range.selectNodeContents(el);
            sel.removeAllRanges();
            sel.addRange(range);
            doc.execCommand("insertText", false, newText);
        } catch (e) {}
    }

    /* ---------------- toggle button ---------------- */
    function buildButton() {
        var btn = document.createElement("div");
        btn.id = "ewc-btn";
        btn.className = "ewc-btn off";
        btn.textContent = "English Check: OFF";
        btn.title = "Toggle English check (Ctrl+Shift+E)";
        btn.addEventListener("click", toggleOn);
        document.body.appendChild(btn);
        state.btn = btn;
    }

    function toggleOn() {
        state.on = !state.on;
        if (!state.on) {
            closePanel();
            state.btn.className = "ewc-btn off";
            state.btn.textContent = "English Check: OFF";
        } else {
            state.btn.className = "ewc-btn on";
            state.btn.textContent = "\u2713 Check English";
        }
    }

    /* ---------------- init ---------------- */
    function init() {
        buildButton();
        trackFocus();

        // Re-track focus for iframes that mount later (Gutenberg)
        var t = setInterval(trackFocus, 900);
        setTimeout(function () { clearInterval(t); }, 60000);

        // Clicking the button IS the run trigger (only when ON)
        state.btn.addEventListener("click", function () {
            // toggleOn already ran (same click). If now ON, run a check.
            if (state.on) setTimeout(runCheck, 0);
        });

        // Keyboard: Ctrl+Shift+E toggles; when on, also runs a check
        document.addEventListener("keydown", function (e) {
            if (e.ctrlKey && e.shiftKey && (e.key === "E" || e.key === "e")) {
                e.preventDefault();
                toggleOn();
                if (state.on) setTimeout(runCheck, 0);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // expose for debugging
    window.EnglishWritingCheck = {
        check: runCheck,
        state: state
    };
})();
