/* =========================================================
   shaders.js — custom GLSL layer
   Image planes are driven by real DOM rectangles, so the
   WebGL image always sits exactly where the layout puts it.
   Distortion reacts to scroll velocity, hover and focus.
   ========================================================= */
(function () {
  window.JL = window.JL || {};

  JL.vertexShader = /* glsl */ `
    varying vec2 vUv;

    uniform float uTime;
    uniform float uVel;
    uniform float uHover;
    uniform float uSeed;
    uniform float uBoost;

    void main() {
      vUv = uv;
      vec3 p = position;

      // horizontal ribbon bend across the picture
      float w1 = sin(uv.y * 3.14159265 + uTime * 0.85 + uSeed) * 0.5;
      float w2 = sin(uv.x * 3.14159265 * 1.3 - uTime * 0.62 + uSeed * 2.0) * 0.5;
      float amp = 0.012 + abs(uVel) * 0.055 + uHover * 0.012;

      p.x += w1 * amp;
      p.y += w2 * amp * 0.55;

      p.xy *= uBoost;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;

  JL.fragmentShader = /* glsl */ `
    precision highp float;

    varying vec2 vUv;

    uniform sampler2D uTex;
    uniform vec2  uUvScale;
    uniform vec2  uMouse;
    uniform float uTime;
    uniform float uVel;
    uniform float uHover;
    uniform float uFocus;
    uniform float uAlpha;
    uniform float uSeed;
    uniform float uExposure;
    uniform float uVig;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = vUv;
      float vel = clamp(uVel, -1.0, 1.0);
      float amt = abs(vel);

      /* --- wave bend: ribbon-like ripple, stronger with speed --------- */
      float waveA = sin(uv.y * 6.28318 + uTime * 0.75 + uSeed) * 0.5;
      float waveB = sin(uv.y * 12.5663 - uTime * 0.42 + uSeed * 2.0) * 0.25;
      uv.x += (waveA + waveB) * (0.0022 + amt * 0.024 + uHover * 0.006);

      /* --- velocity shear: the image leans into the scroll ------------ */
      uv.x += vel * (uv.y - 0.5) * 0.11;
      uv.y += vel * (uv.x - 0.5) * 0.03;

      /* --- hover magnifies toward the pointer ------------------------- */
      vec2 zoom = mix(vec2(0.5), uMouse * 0.5 + 0.5, 0.55);
      float z = 1.0 + uHover * 0.06;
      uv = (uv - zoom) / z + zoom;

      /* --- cover fit --------------------------------------------------- */
      vec2 st = (uv - 0.5) * uUvScale + 0.5;
      st = clamp(st, 0.0015, 0.9985);

      /* --- RGB split ---------------------------------------------------- */
      float shift = 0.0007 + amt * 0.0082 + uHover * 0.0036;
      vec2 dir = normalize(vec2(1.0, 0.35));
      vec3 col;
      col.r = texture2D(uTex, st + dir * shift).r;
      col.g = texture2D(uTex, st).g;
      col.b = texture2D(uTex, st - dir * shift * 1.25).b;

      /* --- motion trail ghost ------------------------------------------- */
      if (amt > 0.002) {
        vec3 ghost = texture2D(uTex, st - vec2(vel * 0.045, vel * 0.012)).rgb;
        col = mix(col, max(col, ghost), amt * 0.22);
      }

      /* --- grade --------------------------------------------------------- */
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(lum), col, 0.82 + uHover * 0.18);
      col *= mix(0.34, 1.0, uFocus);
      col *= 1.0 + uHover * 0.05;

      col *= uExposure;

      /* vignette */
      vec2 vg = (vUv - 0.5) * vec2(1.0, 0.92);
      col *= 1.0 - dot(vg, vg) * uVig;

      /* fine grain */
      col += (hash21(vUv * 900.0 + uTime * 2.7 + uSeed) - 0.5) * 0.022;

      /* hairline fade at the plane border: hides edge smearing from the
         velocity shear / RGB split sampling past the texture */
      float edge = smoothstep(0.0, 0.007, vUv.x) * smoothstep(1.0, 0.993, vUv.x)
                 * smoothstep(0.0, 0.007, vUv.y) * smoothstep(1.0, 0.993, vUv.y);

      gl_FragColor = vec4(col, uAlpha * edge);
    }
  `;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  JL.ShaderLayer = class ShaderLayer {
    constructor(canvas) {
      this.canvas = canvas;
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
        powerPreference: 'high-performance'
      });
      this.renderer.setClearColor(0x000000, 0);
      if (THREE.SRGBColorSpace !== undefined) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      }
      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);
      this.geometry = new THREE.PlaneGeometry(1, 1, 40, 40);
      this.items = [];
      this.time = 0;
      this.velocity = 0;
      this.boost = 1;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      this.renderer.setPixelRatio(this.dpr);
      this.renderer.setSize(this.w, this.h, false);
      this.camera.left = 0;
      this.camera.right = this.w;
      this.camera.top = 0;
      this.camera.bottom = -this.h;
      this.camera.updateProjectionMatrix();
    }

    add(el, texture, opts = {}) {
      const uniforms = {
        uTex: { value: texture },
        uUvScale: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uTime: { value: 0 },
        uVel: { value: 0 },
        uHover: { value: 0 },
        uFocus: { value: opts.full ? 1 : 0.34 },
        uAlpha: { value: 0 },
        uSeed: { value: Math.random() * 6.2831 },
        uExposure: { value: opts.exposure || 1.0 },
        uVig: { value: opts.vig === undefined ? 0.6 : opts.vig },
        uBoost: { value: 1 }
      };

      const material = new THREE.ShaderMaterial({
        vertexShader: JL.vertexShader,
        fragmentShader: JL.fragmentShader,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.frustumCulled = false;
      mesh.visible = false;
      this.scene.add(mesh);

      const item = {
        el,
        texture,
        mesh,
        uniforms,
        full: !!opts.full,
        fade: opts.fade !== false,
        hover: 0,
        focus: opts.full ? 1 : 0.34,
        alpha: 0,
        rect: { x: 0, y: 0, w: 0, h: 0 },
        imageAspect:
          (texture && texture.image && texture.image.width && texture.image.height)
            ? texture.image.width / texture.image.height
            : 1.5
      };
      this.items.push(item);
      return item;
    }

    setVelocity(v) {
      this.velocity = v;
    }

    render() {
      const vw = this.w;
      const vh = this.h;

      for (const it of this.items) {
        const r = it.el.getBoundingClientRect();
        const visible = r.width > 0 && r.height > 0 && r.right > -4 && r.left < vw + 4 && r.bottom > -4 && r.top < vh + 4;
        it.mesh.visible = visible;
        if (!visible) {
          it.alpha = 0;
          continue;
        }

        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        it.mesh.position.set(cx, -cy, 0);
        it.mesh.scale.set(r.width, r.height, 1);

        // cover-fit the texture inside the slot
        const slotAspect = r.width / r.height;
        const a = it.imageAspect / slotAspect;
        const sx = a > 1 ? 1 / a : 1;
        const sy = a > 1 ? 1 : a;
        it.uniforms.uUvScale.value.set(sx, sy);

        // focus: 1 when the plane sits at the centre of the screen
        const targetFocus = it.full ? 1 : 1 - clamp(Math.abs(cx - vw / 2) / (vw * 0.58), 0, 1);
        it.focus = lerp(it.focus, targetFocus, 0.12);
        it.uniforms.uFocus.value = 0.34 + it.focus * 0.66;

        // fade out as it leaves the viewport (hero especially)
        let targetAlpha = 1;
        if (it.fade) {
          const edge = clamp(Math.min(r.bottom, vh) - Math.max(r.top, 0), 0, 1);
          targetAlpha = edge > 0 ? 1 : 0;
          if (it.full) {
            const byRect = clamp((Math.min(r.bottom, vh) - Math.max(r.top, 0)) / (vh * 0.55), 0, 1);
            const byScroll = clamp(1 - (window.scrollY || 0) / (vh * 0.7), 0, 1);
            targetAlpha = Math.min(byRect, byScroll);
          }
        }
        it.alpha = lerp(it.alpha, targetAlpha, 0.18);
        it.uniforms.uAlpha.value = it.alpha;

        // pointer position inside the plane (for hover zoom centre)
        it.uniforms.uMouse.value.set(
          clamp((window.__mouseX - r.left) / r.width, 0, 1),
          clamp(1 - (window.__mouseY - r.top) / r.height, 0, 1)
        );

        it.uniforms.uHover.value = it.hover;
        it.uniforms.uBoost.value = 1 + it.focus * 0.018;
        it.uniforms.uVel.value = this.velocity;
        it.uniforms.uTime.value = this.time;
      }

      this.renderer.render(this.scene, this.camera);
    }
  };

  JL.loadTexture = function (url, renderer) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        url,
        (tex) => {
          if (THREE.SRGBColorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
          else if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          if (renderer && renderer.capabilities) {
            tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
          }
          resolve(tex);
        },
        undefined,
        reject
      );
    });
  };
})();
