# Siempre ahora

Una experiencia guiada de ~2 minutos, en español, que invita a **verificar por
ti mismo** que no se puede encontrar un borde en el tiempo: el pasado es un
recuerdo presente, el futuro un pensamiento presente, y el «ahora» no tiene un
contorno localizable. *Nunca has estado en otro momento que este.*

No afirma una cosmología. Te apunta de vuelta a tu propia experiencia, que es la
autoridad final. Tercera pieza de una trilogía honesta junto a
[rostro-original](https://fabianimv.github.io/rostro-original/) («Mira por ti
mismo») y [youniverse](https://fabianimv.github.io/youniverse/).

## Cómo está hecho

Sitio **estático de una sola página**, sin backend, sin login, sin tracking.

- `index.html` en la raíz — listo para GitHub Pages.
- `css/style.css` — estilos (mobile-first, alto contraste, `prefers-reduced-motion`).
- `js/fog.js` — fondo de niebla WebGL muy lento y sutil, con degradación a
  gradiente CSS si no hay WebGL; más el microelemento de luz que deja una estela
  que se desvanece de inmediato.
- `js/main.js` — el recorrido por escenas. El avance es **deliberado**
  (tap / clic / tecla); la pausa forzada en cada pregunta es donde ocurre el
  notar.
- `assets/og-image.png` — imagen para compartir (1200×630).

### Librerías (vía CDN, sin build)

GSAP + ScrollTrigger y Lenis se cargan desde CDN. Si GSAP no está disponible, el
recorrido cae con elegancia a transiciones CSS, así que la experiencia funciona
igual.

### La regla de timing

En cada escena con una pregunta, la pregunta queda **sola en pantalla, en
silencio, ~6 segundos**. Recién después aparece (fade ~1.5s) la observación que
la acompaña, y sólo entonces el botón para avanzar. Nunca se sopla la respuesta
antes de la pausa. Con `prefers-reduced-motion` la espera baja a ~3s y sólo se
usa fade de opacidad.

## Publicar en GitHub Pages

1. Sube estos archivos a la raíz del repositorio `siempre-ahora` (rama
   principal, p. ej. `main`).
2. En GitHub: **Settings → Pages**.
3. En **Build and deployment → Source**, elige **Deploy from a branch**.
4. Selecciona la rama (`main`) y la carpeta **`/ (root)`**. Guarda.
5. En un minuto estará en `https://<tu-usuario>.github.io/siempre-ahora/`.

No hace falta ningún paso de compilación: es HTML/CSS/JS plano.

> Las URLs de Open Graph en `index.html` apuntan a
> `https://fabianimv.github.io/siempre-ahora/`. Si lo publicas en otro dominio o
> usuario, ajústalas para que la tarjeta al compartir (WhatsApp, etc.) muestre
> bien la imagen.

## Regenerar la imagen de Open Graph (opcional)

La tarjeta se genera a partir de `assets/og-template.html` con una captura de
Chromium a 1200×630. No es necesario para publicar; sólo si quieres cambiar el
texto o el diseño de la imagen compartida.

## Probado

- Móvil (viewport iPhone) y desktop.
- Teclado: `Enter` / `Espacio` / `→` para avanzar; foco visible en botones y
  enlaces.
- `prefers-reduced-motion`.
- Sin WebGL (degrada a gradiente CSS) y sin GSAP (degrada a transiciones CSS).

---

En la tradición de la indagación directa. De uso libre.
