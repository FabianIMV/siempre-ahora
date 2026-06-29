/* ----------------------------------------------------------------
   Siempre ahora — fondo
   Niebla WebGL muy lenta y sutil (fbm noise) sobre #0a0c18.
   Degrada a gradiente CSS si no hay WebGL.
   + microelemento: un punto de luz que deja una estela tenue
     que se desvanece de inmediato ("el ahora no se queda").
----------------------------------------------------------------- */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =============================================================
     1. NIEBLA WEBGL
  ============================================================= */
  var fogCanvas = document.getElementById("fog");
  var gl = null;

  try {
    gl = fogCanvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: false })
       || fogCanvas.getContext("experimental-webgl");
  } catch (e) { gl = null; }

  var VERT = [
    "attribute vec2 p;",
    "void main(){ gl_Position = vec4(p, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform vec2  u_res;",
    "uniform float u_time;",
    "",
    "// hash / value noise",
    "float hash(vec2 p){",
    "  p = fract(p * vec2(123.34, 456.21));",
    "  p += dot(p, p + 45.32);",
    "  return fract(p.x * p.y);",
    "}",
    "float noise(vec2 p){",
    "  vec2 i = floor(p); vec2 f = fract(p);",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  float a = hash(i);",
    "  float b = hash(i + vec2(1.0, 0.0));",
    "  float c = hash(i + vec2(0.0, 1.0));",
    "  float d = hash(i + vec2(1.0, 1.0));",
    "  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);",
    "}",
    "float fbm(vec2 p){",
    "  float v = 0.0; float a = 0.5;",
    "  for(int i = 0; i < 4; i++){",
    "    v += a * noise(p);",
    "    p = p * 2.02 + vec2(11.3, 7.7);",
    "    a *= 0.5;",
    "  }",
    "  return v;",
    "}",
    "",
    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / u_res.xy;",
    "  vec2 q = uv;",
    "  q.x *= u_res.x / u_res.y;",
    "  float t = u_time * 0.015;",   // muy lento
    "",
    "  // dominio deformado para niebla orgánica",
    "  vec2 d = vec2(fbm(q * 1.6 + vec2(0.0, t)), fbm(q * 1.6 + vec2(5.2, -t)));",
    "  float f = fbm(q * 1.9 + d * 1.4 + vec2(t * 0.6, t * 0.3));",
    "",
    "  // paleta índigo",
    "  vec3 base   = vec3(0.039, 0.047, 0.094);",  // #0a0c18
    "  vec3 indigo = vec3(0.090, 0.105, 0.215);",
    "  vec3 violet = vec3(0.150, 0.140, 0.280);",
    "",
    "  vec3 col = mix(base, indigo, smoothstep(0.25, 0.85, f));",
    "  col = mix(col, violet, smoothstep(0.55, 1.0, f) * 0.5);",
    "",
    "  // halo superior tenue",
    "  float halo = smoothstep(0.95, 0.15, distance(uv, vec2(0.5, 0.16)));",
    "  col += vec3(0.05, 0.055, 0.10) * halo * 0.6;",
    "",
    "  // viñeta",
    "  float vig = smoothstep(1.25, 0.35, distance(uv, vec2(0.5)));",
    "  col *= 0.78 + 0.22 * vig;",
    "",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl = null; return null;
    }
    return s;
  }

  var prog, uRes, uTime, startT = performance.now();

  function initFog() {
    if (!gl) return false;
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; return false; }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uRes = gl.getUniformLocation(prog, "u_res");
    uTime = gl.getUniformLocation(prog, "u_time");
    return true;
  }

  function resizeFog() {
    if (!gl) return;
    // la niebla es de baja frecuencia: se renderiza a baja resolución
    // y el CSS la estira. Mucho más liviano en batería de móvil.
    var scale = 0.7;
    var w = Math.max(2, Math.floor(window.innerWidth * scale));
    var h = Math.max(2, Math.floor(window.innerHeight * scale));
    if (fogCanvas.width !== w || fogCanvas.height !== h) {
      fogCanvas.width = w; fogCanvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  var fogRunning = false;
  function renderFog() {
    if (!gl) return;
    resizeFog();
    gl.uniform2f(uRes, fogCanvas.width, fogCanvas.height);
    gl.uniform1f(uTime, (performance.now() - startT) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (reduceMotion) { return; } // un solo frame estático
    requestAnimationFrame(renderFog);
  }

  var fogOK = initFog();
  if (fogOK) {
    window.addEventListener("resize", function () {
      if (reduceMotion) { resizeFog(); renderFog(); }
    });
    if (!reduceMotion) { fogRunning = true; renderFog(); }
    else { renderFog(); }
  } else {
    // sin WebGL: el gradiente CSS de .bg ya cubre el fondo
    if (fogCanvas) fogCanvas.style.display = "none";
  }

  /* =============================================================
     2. ESTELA — punto de luz que no se queda
  ============================================================= */
  var trailCanvas = document.getElementById("trail");
  var tctx = trailCanvas ? trailCanvas.getContext("2d") : null;

  if (tctx && !reduceMotion) {
    var dpr2 = Math.min(window.devicePixelRatio || 1, 2);
    var W, H;

    function sizeTrail() {
      W = window.innerWidth; H = window.innerHeight;
      trailCanvas.width = Math.floor(W * dpr2);
      trailCanvas.height = Math.floor(H * dpr2);
      tctx.setTransform(dpr2, 0, 0, dpr2, 0, 0);
    }
    sizeTrail();
    window.addEventListener("resize", sizeTrail);

    var t0 = performance.now();
    function renderTrail() {
      var t = (performance.now() - t0) / 1000;

      // desvanecer lo anterior rápido: la estela no se queda
      tctx.globalCompositeOperation = "source-over";
      tctx.fillStyle = "rgba(10, 12, 24, 0.16)";
      tctx.fillRect(0, 0, W, H);

      // trayectoria lenta tipo Lissajous, centrada
      var cx = W * 0.5 + Math.sin(t * 0.11) * W * 0.30;
      var cy = H * 0.42 + Math.cos(t * 0.087) * H * 0.26;

      tctx.globalCompositeOperation = "lighter";
      var r = 2.2;
      var g = tctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      g.addColorStop(0, "rgba(205, 214, 255, 0.55)");
      g.addColorStop(0.25, "rgba(160, 170, 230, 0.18)");
      g.addColorStop(1, "rgba(160, 170, 230, 0)");
      tctx.fillStyle = g;
      tctx.beginPath();
      tctx.arc(cx, cy, 60, 0, Math.PI * 2);
      tctx.fill();

      tctx.fillStyle = "rgba(230, 236, 255, 0.7)";
      tctx.beginPath();
      tctx.arc(cx, cy, r, 0, Math.PI * 2);
      tctx.fill();

      requestAnimationFrame(renderTrail);
    }
    renderTrail();
  } else if (trailCanvas) {
    trailCanvas.style.display = "none";
  }
})();
