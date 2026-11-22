/* Goodness Kitchen — realistic open-top hexagonal kraft box (three.js r128) */
window.GoodnessBox = function (canvas, opts) {
  opts = opts || {};
  const T = THREE;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 2.9, 5.6);
  camera.lookAt(0, 0.42, 0);

  // ---------- procedural kraft paper ----------
  function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function kraftCanvas(w, h, base, seed) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); const r = rand(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    // blotchy tone variation
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = r() * h, rad = 40 + r() * 220;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      const a = 0.05 + r() * 0.06, dark = r() > 0.5;
      gr.addColorStop(0, dark ? `rgba(90,60,25,${a})` : `rgba(255,235,200,${a})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // fibres
    for (let i = 0; i < (w * h) / 260; i++) {
      const x = r() * w, y = r() * h, len = 4 + r() * 22, ang = (r() - 0.5) * 0.9;
      g.strokeStyle = r() > 0.55 ? `rgba(70,45,15,${0.08 + r() * 0.14})` : `rgba(255,240,210,${0.06 + r() * 0.12})`;
      g.lineWidth = 0.6 + r() * 1.1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); g.stroke();
    }
    // fine grain
    const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8; }
    g.putImageData(id, 0, 0);
    return c;
  }
  function bumpCanvas(w, h, seed) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); const r = rand(seed);
    const id = g.createImageData(w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (r() - 0.5) * 90; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(id, 0, 0);
    for (let i = 0; i < (w * h) / 300; i++) {
      const x = r() * w, y = r() * h, len = 4 + r() * 18, ang = (r() - 0.5) * 0.9;
      g.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); g.stroke();
    }
    return c;
  }
  const INK = '#1C3A1F', LEAF = '#5E9A2E', KRAFT = '#B98C5A';
  function seal(g, cx, cy, R) {
    g.save(); g.globalCompositeOperation = 'multiply';
    g.fillStyle = INK; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    g.restore();
    g.save();
    g.strokeStyle = 'rgba(214,180,135,.85)'; g.lineWidth = R * 0.03;
    g.beginPath(); g.arc(cx, cy, R * 0.88, 0, Math.PI * 2); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#8CC152';
    g.font = `700 ${R * 0.3}px Caveat, cursive`; g.fillText('The', cx - R * 0.28, cy - R * 0.36);
    g.font = `700 ${R * 0.56}px Caveat, cursive`; g.fillText('Goodness', cx, cy + R * 0.02);
    g.fillStyle = 'rgba(225,195,150,.95)';
    g.font = `700 ${R * 0.13}px Manrope, sans-serif`;
    spaced(g, 'KITCHEN', cx, cy + R * 0.42, R * 0.05);
    // leaf
    g.fillStyle = '#8CC152';
    g.beginPath(); g.ellipse(cx + R * 0.42, cy - R * 0.48, R * 0.12, R * 0.055, -0.6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx + R * 0.56, cy - R * 0.52, R * 0.09, R * 0.04, 0.5, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function spaced(g, txt, cx, cy, sp) {
    const w = [...txt].reduce((a, ch) => a + g.measureText(ch).width + sp, -sp);
    let x = cx - w / 2; g.textAlign = 'left';
    for (const ch of txt) { g.fillText(ch, x, cy); x += g.measureText(ch).width + sp; }
    g.textAlign = 'center';
  }
  function inkText(g, txt, cx, cy, size, sp, weight) {
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = INK;
    g.font = `${weight || 700} ${size}px Manrope, sans-serif`; g.textBaseline = 'middle';
    spaced(g, txt, cx, cy, sp); g.restore();
  }

  function wallTexture() {
    const P = 512, c = kraftCanvas(P * 6, P, KRAFT, 11), g = c.getContext('2d');
    for (let i = 0; i < 6; i++) {
      const cx = P * i + P / 2;
      if (i === 0 || i === 3) {
        seal(g, cx, P * 0.44, P * 0.27);
        inkText(g, 'GOOD FOOD · GOOD MOOD · GOODNESS', cx, P * 0.83, 17, 3);
      } else if (i === 1 || i === 5) {
        inkText(g, 'MADE WITH', cx, P * 0.4, 30, 8, 600);
        g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = INK;
        g.font = `700 ${78}px Caveat, cursive`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('love', cx, P * 0.53); g.restore();
        inkText(g, 'HEALTHY · DELICIOUS', cx, P * 0.68, 18, 5);
      } else {
        inkText(g, 'FAST · FRESH · DELIVERED', cx, P * 0.5, 22, 5);
        inkText(g, 'thegoodness.lk', cx, P * 0.62, 18, 2, 500);
      }
    }
    // bottom fold shading / top edge wear
    const gr = g.createLinearGradient(0, 0, 0, P);
    gr.addColorStop(0, 'rgba(255,240,215,.10)'); gr.addColorStop(0.85, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(60,35,10,.22)');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, P);
    for (let i = 1; i < 6; i++) { g.fillStyle = 'rgba(70,45,15,.18)'; g.fillRect(P * i - 2, 0, 4, P); } // creases
    return c;
  }
  function lidTexture() {
    const w = 1024, h = Math.round(1024 * Math.sqrt(3) / 2), c = kraftCanvas(w, h, KRAFT, 23), g = c.getContext('2d');
    seal(g, w / 2, h / 2, h * 0.3);
    inkText(g, 'GOOD FOOD · GOOD MOOD · GOODNESS', w / 2, h * 0.86, 24, 4);
    return c;
  }
  function tex(c, srgb = true) {
    const t = new T.CanvasTexture(c); if (srgb) t.encoding = T.sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
  }

  // ---------- build ----------
  const Rt = 1.0, Rb = 0.84, Hh = 0.92, TH0 = -Math.PI / 6;
  const box = new T.Group(); scene.add(box);
  const wallTex = tex(wallTexture());
  const bump = tex(bumpCanvas(1024, 512, 5), false); bump.wrapS = bump.wrapT = T.RepeatWrapping;
  const innerTex = tex(kraftCanvas(1536, 256, '#C79A66', 31));
  const outerMat = new T.MeshStandardMaterial({ map: wallTex, roughness: 0.93, metalness: 0, bumpMap: bump, bumpScale: 0.006 });
  const innerMat = new T.MeshStandardMaterial({ map: innerTex, roughness: 0.95, side: T.BackSide, bumpMap: bump, bumpScale: 0.005 });
  const outer = new T.Mesh(new T.CylinderGeometry(Rt, Rb, Hh, 6, 1, true, TH0), outerMat);
  outer.position.y = Hh / 2; outer.castShadow = true; outer.receiveShadow = true; box.add(outer);
  const inner = new T.Mesh(new T.CylinderGeometry(Rt * 0.985, Rb * 0.98, Hh * 0.995, 6, 1, true, TH0), innerMat);
  inner.position.y = Hh / 2 + 0.002; inner.receiveShadow = true; box.add(inner);
  const base = new T.Mesh(new T.CircleGeometry(Rb * 0.99, 6, TH0 + Math.PI / 2), new T.MeshStandardMaterial({ map: innerTex, roughness: 0.95 }));
  base.rotation.x = -Math.PI / 2; base.position.y = 0.004; base.receiveShadow = true; box.add(base);

  function hexPts(R) { const a = []; for (let i = 0; i < 6; i++) { const th = TH0 + i * Math.PI / 3; a.push([R * Math.sin(th), R * Math.cos(th)]); } return a; }
  // rim (thickness edge)
  {
    const s = new T.Shape(), o = hexPts(Rt), h = new T.Path(), n = hexPts(Rt * 0.982);
    o.forEach((p, i) => (i ? s.lineTo(p[0], -p[1]) : s.moveTo(p[0], -p[1])));
    n.slice().reverse().forEach((p, i) => (i ? h.lineTo(p[0], -p[1]) : h.moveTo(p[0], -p[1])));
    s.holes.push(h);
    const rim = new T.Mesh(new T.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }), new T.MeshStandardMaterial({ color: 0xC9A06E, roughness: 0.9 }));
    rim.rotation.x = -Math.PI / 2; rim.position.y = Hh - 0.006; rim.castShadow = true; box.add(rim);
  }

  function normUV(geo, minX, maxX, minY, maxY) {
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - minX) / (maxX - minX), (p.getY(i) - minY) / (maxY - minY));
    uv.needsUpdate = true;
  }
  const flapOuter = new T.MeshStandardMaterial({ map: tex(kraftCanvas(512, 256, KRAFT, 41)), roughness: 0.93, bumpMap: bump, bumpScale: 0.006, side: T.FrontSide });
  const flapInner = new T.MeshStandardMaterial({ map: innerTex, roughness: 0.95, bumpMap: bump, bumpScale: 0.005, side: T.BackSide });
  const wallLean = Math.atan(((Rt - Rb) * Math.sqrt(3) / 2) / Hh);
  const flaps = [];
  let lidPivot;
  for (let i = 0; i < 6; i++) {
    const thA = TH0 + i * Math.PI / 3, thB = thA + Math.PI / 3, thC = (thA + thB) / 2;
    const pivot = new T.Group();
    pivot.position.set(Rt * Math.cos(Math.PI / 6) * Math.sin(thC), Hh, Rt * Math.cos(Math.PI / 6) * Math.cos(thC));
    pivot.rotation.y = thC; box.add(pivot);
    const L = Rt; // side length
    if (i === 3) {
      // hinged hex lid on the back edge
      const a = L * Math.sqrt(3) / 2, s = new T.Shape([
        new T.Vector2(-L / 2, 0), new T.Vector2(L / 2, 0), new T.Vector2(L, a), new T.Vector2(L / 2, 2 * a), new T.Vector2(-L / 2, 2 * a), new T.Vector2(-L, a)]);
      const geo = new T.ShapeGeometry(s); normUV(geo, -L, L, 0, 2 * a);
      const lid = new T.Group();
      const lo = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tex(lidTexture()), roughness: 0.92, bumpMap: bump, bumpScale: 0.006, side: T.FrontSide }));
      const li = new T.Mesh(geo, flapInner);
      lo.castShadow = li.castShadow = true; lo.receiveShadow = li.receiveShadow = true;
      lid.add(lo, li); pivot.add(lid); lidPivot = lid;
      // small tuck tab on lid front edge
      const tab = new T.Shape([new T.Vector2(-L * 0.3, 0), new T.Vector2(L * 0.3, 0), new T.Vector2(L * 0.22, 0.1), new T.Vector2(-L * 0.22, 0.1)]);
      const tg = new T.ShapeGeometry(tab); normUV(tg, -L * 0.3, L * 0.3, 0, 0.1);
      const tabG = new T.Group(); tabG.position.y = 2 * a; tabG.rotation.x = 0.5;
      tabG.add(new T.Mesh(tg, flapOuter), new T.Mesh(tg, flapInner)); lid.add(tabG);
    } else {
      const hgt = 0.26, s = new T.Shape([new T.Vector2(-L / 2, 0), new T.Vector2(L / 2, 0), new T.Vector2(L * 0.36, hgt), new T.Vector2(-L * 0.36, hgt)]);
      const geo = new T.ShapeGeometry(s); normUV(geo, -L / 2, L / 2, 0, hgt);
      const f = new T.Group();
      const mo = new T.Mesh(geo, flapOuter), mi = new T.Mesh(geo, flapInner);
      mo.receiveShadow = mi.receiveShadow = true;
      f.add(mo, mi); pivot.add(f);
      flaps.push({ g: f, base: wallLean, open: 0.95 + (i % 2) * 0.12 + (i === 0 ? 0.15 : 0) });
    }
  }

  // ---------- food ----------
  const yF = Hh * 0.78, RF = Rb + (Rt - Rb) * 0.78;
  const foodCanvas = document.createElement('canvas'); foodCanvas.width = foodCanvas.height = 1024;
  const mask = document.createElement('canvas'); mask.width = mask.height = 512;
  {
    const g = mask.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512); g.fillStyle = '#fff'; g.beginPath();
    hexPts(250 * 0.975).forEach((p, i) => { const x = 256 + p[0], y = 256 + p[1]; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.fill();
  }
  const foodTex = tex(foodCanvas), dispTex = tex(foodCanvas, false), maskTex = tex(mask, false);
  const foodGeo = new T.PlaneGeometry(RF * 2, RF * 2, 160, 160);
  { const p = foodGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / RF, y = p.getY(i) / RF, rr = x * x + y * y; p.setZ(i, 0.09 * Math.max(0, 1 - rr)); } foodGeo.computeVertexNormals(); }
  const food = new T.Mesh(foodGeo, new T.MeshStandardMaterial({ map: foodTex, roughness: 0.55, displacementMap: dispTex, displacementScale: 0.07, displacementBias: -0.03, alphaMap: maskTex, alphaTest: 0.5 }));
  food.rotation.x = -Math.PI / 2; food.position.y = yF; food.receiveShadow = true; food.castShadow = true; box.add(food);
  function setFood(img, crop) {
    const g = foodCanvas.getContext('2d');
    if (img) { const [sx, sy, sw, sh] = crop || [0, 0, img.width, img.height]; g.drawImage(img, sx, sy, sw, sh, 0, 0, 1024, 1024); }
    else { // procedural placeholder: rice + garnish
      const r = rand(9); g.fillStyle = '#d9b77a'; g.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 9000; i++) { g.fillStyle = `hsl(${35 + r() * 12},${45 + r() * 20}%,${55 + r() * 25}%)`; g.save(); g.translate(r() * 1024, r() * 1024); g.rotate(r() * 6); g.fillRect(-7, -2.5, 14, 5); g.restore(); }
      g.fillStyle = '#fff6e6'; g.beginPath(); g.ellipse(560, 470, 210, 180, 0.3, 0, 7); g.fill();
      g.fillStyle = '#f2a516'; g.beginPath(); g.arc(590, 470, 80, 0, 7); g.fill();
    }
    foodTex.needsUpdate = dispTex.needsUpdate = true;
  }
  setFood(null);

  // ---------- steam ----------
  const steamC = document.createElement('canvas'); steamC.width = steamC.height = 128;
  { const g = steamC.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const steamTex = new T.CanvasTexture(steamC);
  const steam = [];
  for (let i = 0; i < 18; i++) {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0 }));
    sp.userData = { ph: i / 18, x: (Math.random() - 0.5) * 0.9, z: (Math.random() - 0.5) * 0.7, s: 0.5 + Math.random() * 0.5 };
    box.add(sp); steam.push(sp);
  }

  // ---------- lights & ground ----------
  scene.add(new T.HemisphereLight(0xfff1dc, 0x203a22, 0.75));
  const key = new T.DirectionalLight(0xfff0d8, 1.9); key.position.set(3.2, 5.5, 3.6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = key.shadow.camera.bottom = -3; key.shadow.camera.right = key.shadow.camera.top = 3;
  key.shadow.radius = 6; key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02; scene.add(key);
  const rim = new T.DirectionalLight(0xb8e08a, 0.7); rim.position.set(-3.5, 2.5, -4); scene.add(rim);
  const fill = new T.DirectionalLight(0xffe2c0, 0.35); fill.position.set(-4, 1.5, 3); scene.add(fill);
  const bounce = new T.PointLight(0xffd6a0, 0.55, 3.2); bounce.position.set(0, Hh + 0.9, 0.3); box.add(bounce);
  const ground = new T.Mesh(new T.PlaneGeometry(14, 14), new T.ShadowMaterial({ opacity: 0.42 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // ---------- state & loop ----------
  const state = opts.state || { rot: -0.35, lid: 0 };
  const ease = x => (x = Math.min(Math.max(x, 0), 1), x * x * (3 - 2 * x));
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const narrow = w / h < 0.9; camera.fov = narrow ? 42 : 28; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();
  let running = true, t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    box.rotation.y = state.rot + Math.sin(t * 0.6) * 0.04;
    box.position.y = Math.sin(t * 1.1) * 0.015;
    const L = ease(state.lid);
    if (lidPivot) lidPivot.rotation.x = -Math.PI / 2 + (Math.PI / 2 + 0.42) * L;
    flaps.forEach(f => { const k = ease(state.lid * 1.35 - 0.05); f.g.rotation.x = (-Math.PI / 2 + 0.12) * (1 - k) + (f.base + f.open) * k; });
    steam.forEach(sp => {
      const u = (t * 0.22 + sp.userData.ph) % 1;
      sp.position.set(sp.userData.x * (0.6 + u * 0.4) + Math.sin(t + sp.userData.ph * 9) * 0.08, yF + 0.1 + u * 1.5, sp.userData.z);
      const sc = (0.35 + u * 0.9) * sp.userData.s; sp.scale.set(sc, sc, 1);
      sp.material.opacity = Math.sin(Math.PI * u) * 0.32 * ease((state.lid - 0.55) / 0.4);
    });
    renderer.render(scene, camera);
    if (running) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {
    state, setFood,
    pause() { running = false; }, play() { if (!running) { running = true; requestAnimationFrame(frame); } },
    render() { renderer.render(scene, camera); }
  };
};
