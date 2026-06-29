/* ----------------------------------------------------------------
   Siempre ahora — recorrido
   Avance DELIBERADO escena por escena (tap / clic / botón).
   Regla de timing: en cada escena con pregunta, la pregunta queda
   SOLA ~6s en silencio; recién después aparece la observación
   (fade ~1.5s); y sólo entonces el botón para avanzar.
   prefers-reduced-motion: espera ~3s y sólo fade de opacidad.
----------------------------------------------------------------- */
(function () {
  "use strict";

  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Timing (ms / s)
  var PAUSE     = REDUCE ? 3000 : 6000;   // silencio con la pregunta sola
  var OBS_FADE  = REDUCE ? 0.45 : 1.5;    // fade-in de la observación (s)
  var SCENE_IN  = REDUCE ? 0.4  : 1.2;    // entrada de escena (s)
  var SCENE_OUT = REDUCE ? 0.3  : 0.8;    // salida de escena (s)

  var hasGSAP = typeof window.gsap !== "undefined";

  var scenes   = Array.prototype.slice.call(document.querySelectorAll(".scene"));
  var hint     = document.getElementById("hint");
  var progress = document.getElementById("progress");

  var current = -1;
  var canAdvance = false;
  var isBusy = false;
  var pendingTimers = [];

  /* ---------- utilidades de animación ---------- */
  function fade(el, to, dur, onDone) {
    if (!el) { if (onDone) onDone(); return; }
    if (hasGSAP) {
      window.gsap.to(el, {
        opacity: to,
        duration: dur,
        ease: "power2.out",
        onComplete: onDone || null
      });
    } else {
      el.style.transition = "opacity " + dur + "s ease";
      el.style.opacity = to;
      if (onDone) setTimeout(onDone, dur * 1000);
    }
  }

  function clearTimers() {
    pendingTimers.forEach(clearTimeout);
    pendingTimers = [];
  }
  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    pendingTimers.push(id);
    return id;
  }

  /* ---------- progreso ---------- */
  function buildProgress() {
    // un punto por cada escena "look" (1..5)
    var looks = scenes.filter(function (s) { return s.dataset.type === "look"; });
    looks.forEach(function () {
      var dot = document.createElement("span");
      progress.appendChild(dot);
    });
  }

  function updateProgress(scene) {
    var dots = progress.querySelectorAll("span");
    var type = scene.dataset.type;
    if (type === "look") {
      progress.classList.add("is-visible");
      var idx = parseInt(scene.dataset.scene, 10) - 1; // look 1 -> dot 0
      dots.forEach(function (d, i) {
        d.classList.toggle("is-on", i === idx);
        d.classList.toggle("is-done", i < idx);
      });
    } else {
      progress.classList.remove("is-visible");
    }
  }

  /* ---------- pista "toca para continuar" ---------- */
  function showHint() { hint.classList.add("is-visible"); }
  function hideHint() { hint.classList.remove("is-visible"); }

  /* ---------- entrar a una escena ---------- */
  function enterScene(i) {
    current = i;
    var scene = scenes[i];
    var type = scene.dataset.type;

    canAdvance = false;
    hideHint();
    clearTimers();

    scene.hidden = false;
    // reset de elementos internos
    var obs = scene.querySelector("[data-observation]");
    var btn = scene.querySelector("[data-advance]");
    if (obs) obs.style.opacity = 0;
    if (btn && btn.classList.contains("btn--ghost")) {
      btn.style.opacity = 0;
      btn.style.pointerEvents = "none";
    }

    updateProgress(scene);

    // entrada de la escena (la pregunta / ancla)
    scene.classList.add("is-active");
    fade(scene, 1, SCENE_IN, function () {
      onSceneShown(scene, type);
    });
  }

  function onSceneShown(scene, type) {
    if (type === "threshold") {
      canAdvance = true;
      focusBtn(scene);
      return;
    }

    if (type === "close") {
      // secuencia de cierre, sin avance posterior
      revealClose(scene);
      return;
    }

    // type === "look": regla de timing
    // 1) la pregunta queda sola PAUSE ms en silencio
    later(function () {
      var obs = scene.querySelector("[data-observation]");
      fade(obs, 1, OBS_FADE, function () {
        // 2) tras la observación, aparece el botón / la pista
        var btn = scene.querySelector("[data-advance]");
        if (btn) {
          btn.style.pointerEvents = "auto";
          fade(btn, 1, REDUCE ? 0.3 : 0.8);
        }
        canAdvance = true;
        showHint();
        focusBtn(scene);
      });
    }, PAUSE);
  }

  function revealClose(scene) {
    var anchor = scene.querySelector(".anchor");
    var subtext = scene.querySelector(".subtext");
    var nav = scene.querySelector(".crosslinks");
    var credit = scene.querySelector(".credit");

    [subtext, nav, credit].forEach(function (el) { if (el) el.style.opacity = 0; });

    var step = REDUCE ? 350 : 1100;
    later(function () { fade(subtext, 1, REDUCE ? 0.4 : 1.4); }, step);
    later(function () { fade(nav, 1, REDUCE ? 0.4 : 1.4); }, step * 2);
    later(function () { fade(credit, 1, REDUCE ? 0.4 : 1.4); }, step * 3);
  }

  function focusBtn(scene) {
    var btn = scene.querySelector("[data-advance]");
    if (btn) { try { btn.focus({ preventScroll: true }); } catch (e) { btn.focus(); } }
  }

  /* ---------- avanzar ---------- */
  function advance() {
    if (!canAdvance || isBusy) return;
    if (current >= scenes.length - 1) return; // cierre: no hay más
    isBusy = true;
    canAdvance = false;
    hideHint();

    var leaving = scenes[current];
    fade(leaving, 0, SCENE_OUT, function () {
      leaving.classList.remove("is-active");
      leaving.hidden = true;
      isBusy = false;
      enterScene(current + 1);
    });
  }

  /* ---------- escucha de entrada ---------- */
  function onClick(e) {
    // los enlaces cruzados (cierre) deben funcionar normalmente
    if (e.target.closest("a")) return;
    advance();
  }

  function onKey(e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar" ||
        e.key === "ArrowRight" || e.key === "ArrowDown") {
      // si el foco está en un enlace, respetarlo
      if (e.target.closest && e.target.closest("a")) return;
      e.preventDefault();
      advance();
    }
  }

  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);

  /* ---------- arranque ---------- */
  buildProgress();
  // pequeña espera para que las fuentes/fondo asienten
  later(function () { enterScene(0); }, REDUCE ? 60 : 300);
})();
