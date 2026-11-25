// 3D Kbros burger: sesame bun, patty, cheese, tomato, lettuce, bottom bun.
// Spins two full turns when the page opens, then keeps a slow idle spin
// and follows the pointer (mouse or touch).
(function () {
  const el = document.getElementById('logo3d');
  if (!el || !window.THREE) return;

  const COLORS = {
    bun: 0xd9a56b,      // light brown
    bunDark: 0xb9824a,
    patty: 0x5a3418,
    cheese: 0xf2b53a,
    tomato: 0xd62300,   // red
    lettuce: 0x4f9d3a,
    seed: 0xfff6e6,
    blue: 0x0a3d8f      // blue ring
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.2, 9.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(3, 5, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe9c8, 0.4);
  fill.position.set(-4, -2, 3);
  scene.add(fill);

  const mat = (color, opts = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...opts });

  const burger = new THREE.Group();
  scene.add(burger);

  const R = 1.5; // radius of the burger

  // Dome profile for a bun: returns a LatheGeometry. Flat base at y=0.
  function bunGeometry(height, flatBottom) {
    const pts = [];
    if (flatBottom) {
      // bottom bun: rounded edge, flat underside
      pts.push(new THREE.Vector2(0, 0));
      pts.push(new THREE.Vector2(R * 0.92, 0));
      pts.push(new THREE.Vector2(R * 1.0, height * 0.35));
      pts.push(new THREE.Vector2(R * 0.97, height * 0.75));
      pts.push(new THREE.Vector2(R * 0.85, height));
      pts.push(new THREE.Vector2(0, height));
    } else {
      // top bun: smooth dome
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * (Math.PI / 2);
        pts.push(new THREE.Vector2(R * Math.cos(a), height * Math.sin(a)));
      }
      pts.push(new THREE.Vector2(0, 0));
    }
    return new THREE.LatheGeometry(pts, 64);
  }

  // Bottom bun
  const bottomBun = new THREE.Mesh(bunGeometry(0.42, true), mat(COLORS.bunDark, { side: THREE.DoubleSide }));
  bottomBun.position.y = -1.55;
  burger.add(bottomBun);

  // Patty
  const patty = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.3, 64), mat(COLORS.patty));
  patty.position.y = -1.08;
  burger.add(patty);

  // Cheese: a slightly wavy slab
  const cheese = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.0, R * 1.0, 0.07, 64), mat(COLORS.cheese, { roughness: 0.35 }));
  cheese.position.y = -0.85;
  cheese.rotation.y = 0.4;
  burger.add(cheese);

  // Tomato
  const tomato = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.86, 0.12, 48), mat(COLORS.tomato, { roughness: 0.4 }));
  tomato.position.y = -0.7;
  burger.add(tomato);

  // Lettuce: a ruffled ring
  const lettuce = new THREE.Mesh(new THREE.TorusGeometry(R * 0.82, 0.18, 14, 48), mat(COLORS.lettuce));
  lettuce.rotation.x = Math.PI / 2;
  lettuce.scale.set(1, 1, 0.55);
  lettuce.position.y = -0.52;
  burger.add(lettuce);

  // Top bun
  const topBun = new THREE.Mesh(bunGeometry(1.05, false), mat(COLORS.bun, { side: THREE.DoubleSide }));
  topBun.position.y = -0.4;
  burger.add(topBun);

  // Sesame seeds placed on the dome surface
  const seedGeo = new THREE.SphereGeometry(0.075, 12, 8);
  const seedMat = mat(COLORS.seed, { roughness: 0.6 });
  for (let i = 0; i < 26; i++) {
    const ring = i % 3;                 // three latitude rings
    const a = 0.35 + ring * 0.42;       // angle up the dome
    const around = (i / 26) * Math.PI * 2 + ring * 0.6;
    const r = R * 0.8 * Math.cos(a) * 0.95;
    const y = 1.05 * Math.sin(a) * 0.95;
    const seed = new THREE.Mesh(seedGeo, seedMat);
    seed.position.set(Math.cos(around) * r * 0.85, y - 0.4, Math.sin(around) * r * 0.85);
    seed.scale.set(1.4, 0.7, 1);
    seed.rotation.set(Math.random(), Math.random(), Math.random());
    burger.add(seed);
  }

  // Blue orbit ring with a red dot, the brand's two colours
  const ringMesh = new THREE.Mesh(
    new THREE.TorusGeometry(3.4, 0.03, 16, 140),
    mat(COLORS.blue, { roughness: 0.3, metalness: 0.2 })
  );
  ringMesh.rotation.x = Math.PI / 2.4;
  scene.add(ringMesh);

  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), mat(COLORS.tomato));
  scene.add(dot);

  // Pointer / touch tilt
  let mx = 0, my = 0;
  const onPointer = (x, y) => {
    mx = x / window.innerWidth - 0.5;
    my = y / window.innerHeight - 0.5;
  };
  window.addEventListener('pointermove', (e) => onPointer(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) onPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  function resize() {
    const w = el.clientWidth || 300, h = el.clientHeight || 300;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = w + 'px';
    renderer.domElement.style.height = h + 'px';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(el);
  resize();

  // Intro spin: two full turns with ease-out, then a slow continuous spin
  const INTRO = 2.6;
  const start = performance.now();
  let tiltX = 0, tiltY = 0;

  function animate(now) {
    const t = (now - start) / 1000;
    const p = Math.min(t / INTRO, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const spin = ease * Math.PI * 4 + Math.max(0, t - INTRO) * 0.3;

    tiltY += ((mx * 0.6) - tiltY) * 0.06;
    tiltX += ((my * 0.35) - tiltX) * 0.06;

    burger.rotation.y = spin + Math.sin(t * 0.7) * 0.1 + tiltY;
    burger.rotation.x = tiltX;
    burger.position.y = Math.sin(t * 1.2) * 0.1 + 0.25;

    ringMesh.rotation.z = t * 0.2;
    const a = t * 0.5;
    dot.position.set(Math.cos(a) * 3.4, 0.25, Math.sin(a) * 3.4);
    dot.position.applyEuler(ringMesh.rotation);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();
