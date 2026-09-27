/*
 * English Writing Check - LIVE inline grammar/spell checker
 * ---------------------------------------------------------
 * As you type in a block, mistakes get a subtle underline
 * (spelling = red, grammar = blue). Click an underline to see the
 * correction(s) and apply with one click. Grammarly-style, but simple.
 *
 * Standalone plugin. Uses LanguageTool free API. No key needed.
 */
(function () {
    "use strict";

    var LT_ENDPOINT = "https://api.languagetool.org/v2/check";
    var DEBOUNCE_MS = 800;

    var S = {
        on: true,             // live checking enabled
        btn: null,
        layer: null,          // overlay layer for underlines
        popup: null,
        timer: null,
        current: null,        // { el, kind, win, doc } being checked
        baseText: "",         // text last checked
        matches: [],
        failCount: 0,
        disabled: false       // auto-disable after repeated failures
    };

    /* ---------------- editable detection ---------------- */
    function editableKind(el) {
        if (!el || !el.tagName) return null;
        var tag = el.tagName.toLowerCase();
        if (tag === "textarea" || (tag === "input" && (el.type === "text" || el.type === "search"))) return "field";
        if (el.isContentEditable) return "editable";
        return null;
    }

    function textOf(el, kind) {
        return kind === "field" ? (el.value || "") : (el.textContent || "");
    }

    /* ---------------- overlay layer ---------------- */
    function ensureLayer() {
        if (S.layer) return S.layer;
        var l = document.createElement("div");
        l.id = "ewc-layer";
        l.className = "ewc-layer";
        document.body.appendChild(l);
        S.layer = l;
        return l;
    }
    function clearMarks() {
        if (S.layer) S.layer.innerHTML = "";
    }

    /* ---------------- map char offset -> text node ---------------- */
    function nodeAtOffset(root, target) {
        if (root.nodeType === 3) {
            return target <= root.textContent.length ? { node: root, offset: target } : null;
        }
        var stack = [];
        for (var i = root.childNodes.length - 1; i >= 0; i--) stack.push(root.childNodes[i]);
        var count = 0;
        while (stack.length) {
            var n = stack.pop();
            if (n.nodeType === 3) {
                var len = n.textContent.length;
                if (count + len >= target) return { node: n, offset: target - count };
                count += len;
            } else if (n.nodeType === 1) {
                for (var j = n.childNodes.length - 1; j >= 0; j--) stack.push(n.childNodes[j]);
            }
        }
        return null;
    }

    function isSpelling(m) {
        var t = (m.rule && m.rule.issueType) || "";
        if (t === "misspelling") return true;
        return !!(m.rule && m.rule.category && m.rule.category.id === "TYPOS");
    }

    /* ---------------- draw underlines ---------------- */
    function drawMarks() {
        var layer = ensureLayer();
        layer.innerHTML = "";
        if (!S.current || S.current.kind !== "editable") return; // underlines only for rich blocks
        var el = S.current.el, doc = S.current.doc, win = S.current.win;

        // Verify text still matches what we checked
        if (textOf(el, "editable") !== S.baseText) return;

        S.matches.forEach(function (m, idx) {
            var start = nodeAtOffset(el, m.offset);
            var end = nodeAtOffset(el, m.offset + m.length);
            if (!start || !end) return;
            var rng;
            try {
                rng = doc.createRange();
                rng.setStart(start.node, start.offset);
                rng.setEnd(end.node, end.offset);
            } catch (e) { return; }
            var rects = rng.getClientRects();
            var fx = 0, fy = 0;
            try { if (win.frameElement) { var fr = win.frameElement.getBoundingClientRect(); fx = fr.left; fy = fr.top; } } catch (e) {}
            for (var r = 0; r < rects.length; r++) {
                var rect = rects[r];
                if (!rect.width) continue;
                var u = document.createElement("div");
                u.className = "ewc-u " + (isSpelling(m) ? "ewc-u-spell" : "ewc-u-grammar");
                u.style.left = (rect.left + fx) + "px";
                u.style.top = (rect.bottom + fy - 1) + "px";
                u.style.width = rect.width + "px";
                u.setAttribute("data-idx", idx);
                u.addEventListener("mousedown", function (ev) {
                    ev.preventDefault(); ev.stopPropagation();
                    var i = parseInt(this.getAttribute("data-idx"), 10);
                    var b = this.getBoundingClientRect();
                    showPopup(i, b.left, b.bottom);
                });
                layer.appendChild(u);
            }
        });
    }

    /* ---------------- suggestion popup ---------------- */
    function ensurePopup() {
        if (S.popup) return S.popup;
        var p = document.createElement("div");
        p.id = "ewc-pop";
        p.className = "ewc-pop";
        p.style.display = "none";
        document.body.appendChild(p);
        S.popup = p;
        return p;
    }
    function hidePopup() { if (S.popup) S.popup.style.display = "none"; }

    function esc(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function showPopup(idx, left, top) {
        var m = S.matches[idx];
        if (!m) return;
        var p = ensurePopup();
        var html = '<div class="ewc-pop-msg">' + esc(m.shortMessage || m.message || "Issue") + '</div>';
        var reps = (m.replacements || []).slice(0, 5);
        if (reps.length) {
            html += '<div class="ewc-pop-fixes">';
            for (var i = 0; i < reps.length; i++) {
                var v = reps[i].value;
                html += '<button class="ewc-pop-fix" data-idx="' + idx + '" data-rep="' + esc(v) +
                    '">' + esc(v && v.length ? v : "(remove)") + '</button>';
            }
            html += '</div>';
        } else {
            html += '<div class="ewc-pop-nofix">No suggestion</div>';
        }
        p.innerHTML = html;
        var btns = p.querySelectorAll(".ewc-pop-fix");
        for (var b = 0; b < btns.length; b++) {
            btns[b].addEventListener("mousedown", function (ev) {
                ev.preventDefault();
                applyFix(parseInt(this.getAttribute("data-idx"), 10), this.getAttribute("data-rep"));
            });
        }
        p.style.left = Math.max(6, left) + "px";
        p.style.top = (top + 4) + "px";
        p.style.display = "block";
    }

    /* ---------------- apply a fix ---------------- */
    function applyFix(idx, replacement) {
        var m = S.matches[idx];
        if (!m || !S.current) return;
        if (replacement == null) replacement = "";
        var el = S.current.el, kind = S.current.kind, doc = S.current.doc, win = S.current.win;

        if (textOf(el, kind) !== S.baseText) { hidePopup(); scheduleCheck(0); return; }

        var newText = S.baseText.slice(0, m.offset) + replacement + S.baseText.slice(m.offset + m.length);

        if (kind === "field") {
            el.value = newText;
            el.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
            try {
                var start = nodeAtOffset(el, m.offset);
                var end = nodeAtOffset(el, m.offset + m.length);
                if (start && end) {
                    var sel = win.getSelection();
                    var rng = doc.createRange();
                    rng.setStart(start.node, start.offset);
                    rng.setEnd(end.node, end.offset);
                    sel.removeAllRanges();
                    sel.addRange(rng);
                    doc.execCommand("insertText", false, replacement);
                }
            } catch (e) {}
        }
        hidePopup();
        clearMarks();
        scheduleCheck(300); // re-check to refresh remaining issues
    }

    /* ---------------- the check call ---------------- */
    function doCheck(el, kind, win, doc) {
        var text = textOf(el, kind);
        if (!text || !text.trim()) { S.matches = []; clearMarks(); return; }

        S.current = { el: el, kind: kind, win: win, doc: doc };
        S.baseText = text;
        setBtn("Checking...");

        var body = "text=" + encodeURIComponent(text) + "&language=en-US&level=default";
        fetch(LT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            body: body
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            S.failCount = 0;
            // ignore if text changed since request
            if (textOf(el, kind) !== S.baseText) return;
            S.matches = (data && data.matches) || [];
            drawMarks();
            setBtn(S.matches.length ? ("\u2713 " + S.matches.length + " issue(s)") : "\u2713 Clean");
        })
        .catch(function () {
            S.failCount++;
            if (S.failCount >= 5) { S.disabled = true; setBtn("Check off (no internet)"); }
            else setBtn("Check failed");
        });
    }

    function scheduleCheck(delay) {
        if (!S.on || S.disabled) return;
        if (S.timer) clearTimeout(S.timer);
        var d = (typeof delay === "number") ? delay : DEBOUNCE_MS;
        S.timer = setTimeout(function () {
            var t = S.current || lastFocused;
            if (!t) return;
            if (!t.el || !t.el.isConnected) return;
            doCheck(t.el, t.kind, t.win, t.doc);
        }, d);
    }

    /* ---------------- live typing hooks ---------------- */
    var lastFocused = null;

    function onInput(e) {
        if (!S.on || S.disabled) return;
        var kind = editableKind(e.target);
        if (!kind) return;
        var win = (e.target.ownerDocument && e.target.ownerDocument.defaultView) || window;
        var doc = e.target.ownerDocument || document;
        lastFocused = { el: e.target, kind: kind, win: win, doc: doc };
        S.current = lastFocused;
        clearMarks();       // clear stale underlines while typing
        hidePopup();
        scheduleCheck();    // debounced
    }

    function onFocusIn(e) {
        var kind = editableKind(e.target);
        if (!kind) return;
        var win = (e.target.ownerDocument && e.target.ownerDocument.defaultView) || window;
        var doc = e.target.ownerDocument || document;
        lastFocused = { el: e.target, kind: kind, win: win, doc: doc };
    }

    function repositionMarks() {
        // Redraw underlines at new positions (scroll/resize)
        if (S.on && !S.disabled && S.matches.length) drawMarks();
    }

    /* ---------------- toggle button ---------------- */
    function buildButton() {
        var b = document.createElement("div");
        b.id = "ewc-btn";
        b.className = "ewc-btn on";
        b.textContent = "\u2713 English Check: ON";
        b.title = "Live English check ON/OFF (Ctrl+Shift+E)";
        b.addEventListener("click", toggle);
        document.body.appendChild(b);
        S.btn = b;
    }
    function setBtn(msg) {
        if (!S.btn) return;
        S.btn.textContent = msg;
        clearTimeout(S.btn.__t);
        S.btn.__t = setTimeout(function () {
            if (S.on && !S.disabled) S.btn.textContent = "\u2713 English Check: ON";
        }, 2200);
    }
    function toggle() {
        S.on = !S.on;
        if (!S.on) {
            clearMarks(); hidePopup();
            S.btn.className = "ewc-btn off";
            S.btn.textContent = "English Check: OFF";
        } else {
            S.disabled = false; S.failCount = 0;
            S.btn.className = "ewc-btn on";
            S.btn.textContent = "\u2713 English Check: ON";
            scheduleCheck(200);
        }
    }

    /* ---------------- bind docs (main + iframes) ---------------- */
    function bindDoc(doc) {
        if (!doc || doc.__ewcBound) return;
        doc.addEventListener("input", onInput, true);
        doc.addEventListener("focusin", onFocusIn, true);
        doc.addEventListener("scroll", repositionMarks, true);
        doc.addEventListener("mousedown", function (e) {
            // click outside popup + not on an underline -> close popup
            if (S.popup && e.target && S.popup.contains(e.target)) return;
            if (e.target && e.target.className && String(e.target.className).indexOf("ewc-u") !== -1) return;
            hidePopup();
        }, true);
        doc.__ewcBound = true;
    }

    function init() {
        buildButton();
        bindDoc(document);
        window.addEventListener("scroll", repositionMarks, true);
        window.addEventListener("resize", repositionMarks);

        // Gutenberg mounts iframes later -> keep binding
        var t = setInterval(function () {
            var frames = document.querySelectorAll("iframe");
            for (var i = 0; i < frames.length; i++) {
                try { bindDoc(frames[i].contentDocument); } catch (e) {}
            }
        }, 900);
        setTimeout(function () { clearInterval(t); }, 60000);

        document.addEventListener("keydown", function (e) {
            if (e.ctrlKey && e.shiftKey && (e.key === "E" || e.key === "e")) {
                e.preventDefault();
                toggle();
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.EnglishWritingCheck = { state: S, check: function () { scheduleCheck(0); } };
})();
