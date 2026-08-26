import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// The pen. One screen-space ink pass over depth + normals, so every object
// in the yard — kids, props, scatter, dust — is drawn with the same line.
// Then one grade: warmth, saturation, vignette. This pass IS the style.
// ─────────────────────────────────────────────────────────────
export const LOOK = {
  thickness: 1.3,      // px at 1x — scales with pixel ratio
  depthK:    0.012,    // relative depth jump that counts as a silhouette
  normalK:   0.55,     // normal disagreement that counts as a crease
  ink:       new THREE.Color(0x2a1a12),
  inkAmount: 0.9,
  saturation: 1.18,
  // Exposure + shoulder. The light rig is authored hot: measured through three's
  // toon path, a fully-lit white surface lands at ~1.44 linear before the grade
  // and ~1.48 after it, so ALL FIVE bands of the gradient ramp encoded to 255
  // and 72% of a white object was flat-clipped. Both team colours clipped too —
  // red on 92% of its normals — and because only one channel pins, that reads
  // as a hue shift under bright light rather than as lost shading.
  // Note this cannot be fixed with renderer.toneMapping: three force-disables
  // tone mapping whenever a render target is bound, and the only pass that
  // reaches the screen is an author-written shader that never includes the
  // tonemapping chunk. It has to be done here, by hand.
  exposure:  0.78,
  knee:      0.72,     // below this, untouched; above it, rolled into the last 0.28
  warmth:    0.35,
  vignette:  0.32,
  fadeNear:  55, fadeFar: 95,
  // ambient occlusion: soft contact shadow where things meet — what makes toys look solid
  aoRadius: 0.6, aoBias: 0.02, aoIntensity: 1.15, aoAmount: 0.8,
  // bloom: only the brightest things glow (lamps, gloss, confetti)
  bloomThreshold: 0.93, bloomAmount: 0.3,
};

export function makePost(renderer, scene, camera) {
  let w = 1, h = 1;
  renderer.shadowMap.autoUpdate = false;      // paired with needsUpdate in render()
  const depthTex = new THREE.DepthTexture(1, 1);
  depthTex.type = THREE.UnsignedIntType;
  // 4x multisampled scene + normal targets: geometry edges arrive smooth, so
  // the edge detector sees clean silhouettes instead of staircases
  const SAMPLES = renderer.capabilities.isWebGL2 ? 4 : 0;
  // The depth texture hangs off the NORMAL target, not the colour one. Layer 1
  // means "no ink", but the colour pass renders every layer — so when depth came
  // from there, layer-1 objects still wrote depth, still got outlined, and still
  // poisoned SSAO (depth said "firefly", the normal buffer said "lawn"). The
  // normal pass already runs with layer 1 masked off, so taking depth from it
  // makes the rule true by construction for every object at once, instead of
  // depending on each material remembering depthWrite:false.
  const rtColor = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: true, samples: SAMPLES });
  const rtNormal = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthTexture: depthTex, depthBuffer: true, samples: SAMPLES });
  // the inked, graded frame lands here, then FXAA resolves it to the screen
  const rtComp = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  // half-res ambient occlusion, quarter-res bloom chain
  const rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const rtBloomA = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const rtBloomB = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  rtAO.texture.minFilter = rtAO.texture.magFilter = THREE.LinearFilter;
  rtBloomA.texture.minFilter = rtBloomA.texture.magFilter = THREE.LinearFilter;
  rtBloomB.texture.minFilter = rtBloomB.texture.magFilter = THREE.LinearFilter;

  // SSAO kernel: hemisphere samples, denser near the origin
  const KN = 16, kernel = [];
  for (let i = 0; i < KN; i++) {
    const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()).normalize();
    let s = i / KN; s = 0.1 + 0.9 * s * s;
    kernel.push(v.multiplyScalar(Math.random() * s));
  }
  const noiseData = new Uint8Array(16 * 4);
  for (let i = 0; i < 16; i++) { noiseData[i*4] = Math.random() * 255; noiseData[i*4+1] = Math.random() * 255; noiseData[i*4+2] = 128; noiseData[i*4+3] = 255; }
  const noiseTex = new THREE.DataTexture(noiseData, 4, 4);
  noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping; noiseTex.minFilter = noiseTex.magFilter = THREE.NearestFilter; noiseTex.needsUpdate = true;

  const aoMat = new THREE.ShaderMaterial({
    uniforms: {
      tDepth: { value: depthTex }, tNormal: { value: rtNormal.texture }, tNoise: { value: noiseTex },
      res: { value: new THREE.Vector2(1, 1) }, proj: { value: new THREE.Matrix4() }, projInv: { value: new THREE.Matrix4() },
      kernel: { value: kernel }, radius: { value: 0.6 }, bias: { value: 0.02 }, intensity: { value: 1.15 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDepth, tNormal, tNoise; uniform vec2 res; uniform mat4 proj, projInv;
      uniform vec3 kernel[${KN}]; uniform float radius, bias, intensity; varying vec2 vUv;
      vec3 viewPos(vec2 uv){ float d = texture2D(tDepth, uv).r; vec4 c = vec4(uv*2.0-1.0, d*2.0-1.0, 1.0); vec4 v = projInv * c; return v.xyz / v.w; }
      void main(){
        float d0 = texture2D(tDepth, vUv).r;
        if (d0 > 0.9999) { gl_FragColor = vec4(1.0); return; }
        vec3 p = viewPos(vUv);
        vec3 n = normalize(texture2D(tNormal, vUv).rgb * 2.0 - 1.0);
        vec3 rnd = normalize(texture2D(tNoise, vUv * res / 4.0).xyz * 2.0 - 1.0);
        vec3 t = normalize(rnd - n * dot(rnd, n)); vec3 b = cross(n, t); mat3 TBN = mat3(t, b, n);
        float occ = 0.0;
        for (int i = 0; i < ${KN}; i++) {
          vec3 s = p + TBN * kernel[i] * radius;
          vec4 o = proj * vec4(s, 1.0); o.xy = o.xy / o.w * 0.5 + 0.5;
          float sz = viewPos(o.xy).z;
          float rangeCheck = smoothstep(0.0, 1.0, radius / abs(p.z - sz));
          occ += (sz >= s.z + bias ? 1.0 : 0.0) * rangeCheck;
        }
        float ao = 1.0 - clamp(occ / float(${KN}) * intensity, 0.0, 1.0);
        gl_FragColor = vec4(vec3(ao), 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  const aoQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), aoMat);
  const aoScene = new THREE.Scene(); aoScene.add(aoQuad);

  // bloom: bright extract (into A), then a separable blur A->B->A
  const brightMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: rtComp.texture }, threshold: { value: 0.8 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `uniform sampler2D tSrc; uniform float threshold; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tSrc, vUv).rgb; float l = dot(c, vec3(0.299,0.587,0.114));
        float k = smoothstep(threshold, threshold + 0.25, l); gl_FragColor = vec4(c * k, 1.0); }`,
    depthTest: false, depthWrite: false,
  });
  const blurMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, dir: { value: new THREE.Vector2(1, 0) }, res: { value: new THREE.Vector2(1, 1) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `uniform sampler2D tSrc; uniform vec2 dir, res; varying vec2 vUv;
      void main(){ vec2 px = dir / res; vec3 s = texture2D(tSrc, vUv).rgb * 0.227;
        s += (texture2D(tSrc, vUv + px*1.384).rgb + texture2D(tSrc, vUv - px*1.384).rgb) * 0.316;
        s += (texture2D(tSrc, vUv + px*3.230).rgb + texture2D(tSrc, vUv - px*3.230).rgb) * 0.070;
        gl_FragColor = vec4(s, 1.0); }`,
    depthTest: false, depthWrite: false,
  });
  const fxQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), brightMat);
  const fxScene = new THREE.Scene(); fxScene.add(fxQuad);
  const normalMat = new THREE.MeshNormalMaterial();

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: rtColor.texture }, tDepth: { value: depthTex }, tNormal: { value: rtNormal.texture },
      tAO: { value: null }, aoAmount: { value: 0.8 },
      res: { value: new THREE.Vector2(1, 1) }, near: { value: camera.near }, far: { value: camera.far },
      thick: { value: 1 }, depthK: { value: LOOK.depthK }, normalK: { value: LOOK.normalK },
      ink: { value: LOOK.ink }, inkAmount: { value: LOOK.inkAmount },
      sat: { value: LOOK.saturation }, warmth: { value: LOOK.warmth }, vig: { value: LOOK.vignette },
      exposure: { value: LOOK.exposure }, knee: { value: LOOK.knee },
      fadeNear: { value: LOOK.fadeNear }, fadeFar: { value: LOOK.fadeFar },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tColor, tDepth, tNormal, tAO;
      uniform vec2 res; uniform float near, far, thick, depthK, normalK, inkAmount, sat, warmth, vig, fadeNear, fadeFar, aoAmount;
      uniform float exposure, knee;
      float aoAt(vec2 uv){ vec2 px = 2.0 / res; float s = 0.0;
        for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) s += texture2D(tAO, uv + vec2(float(i), float(j)) * px).r;
        return s / 9.0; }
      uniform vec3 ink;
      varying vec2 vUv;
      float lin(float d){ float z = d*2.0-1.0; return (2.0*near*far)/(far+near-z*(far-near)); }
      float depthAt(vec2 uv){ return lin(texture2D(tDepth, uv).r); }
      vec3 normAt(vec2 uv){ return texture2D(tNormal, uv).rgb*2.0-1.0; }
      void main(){
        vec2 px = thick / res;
        float dC = depthAt(vUv);
        float dL = depthAt(vUv - vec2(px.x,0.0)), dR = depthAt(vUv + vec2(px.x,0.0));
        float dU = depthAt(vUv + vec2(0.0,px.y)), dD = depthAt(vUv - vec2(0.0,px.y));
        // second-derivative style: a plane seen at a grazing angle has a smooth
        // gradient (no line); a silhouette has a jump
        float de = (abs(dL + dR - 2.0*dC) + abs(dU + dD - 2.0*dC)) / dC;
        float edgeD = smoothstep(depthK, depthK*2.2, de);
        vec3 nC = normAt(vUv);
        float ne = (1.0-dot(nC,normAt(vUv - vec2(px.x,0.0)))) + (1.0-dot(nC,normAt(vUv + vec2(px.x,0.0))))
                 + (1.0-dot(nC,normAt(vUv + vec2(0.0,px.y)))) + (1.0-dot(nC,normAt(vUv - vec2(0.0,px.y))));
        float edgeN = smoothstep(normalK, normalK*1.8, ne);
        float edge = max(edgeD, edgeN * 0.8);
        edge *= 1.0 - smoothstep(fadeNear, fadeFar, dC);

        vec3 col = texture2D(tColor, vUv).rgb * exposure;
        col *= mix(1.0, aoAt(vUv), aoAmount);
        float l = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(vec3(l), col, sat);
        col = mix(col, col * vec3(1.06, 1.0, 0.92), warmth);
        vec2 q = vUv - 0.5;
        col *= 1.0 - vig * dot(q, q) * 1.7;
        // Soft shoulder, applied AFTER saturation because saturation is what
        // pushes a team colour past white: it drives the dominant channel away
        // from luma, so red peaks higher than a white surface does.
        vec3 over = max(col - knee, 0.0);
        col = min(col, vec3(knee)) + (1.0 - knee) * (1.0 - exp(-over / max(1e-4, 1.0 - knee)));
        col = mix(col, ink, edge * inkAmount);
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  const quadScene = new THREE.Scene(); quadScene.add(quad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // FXAA resolve: softens every remaining hard edge — ink lines included —
  // and does the final linear -> sRGB conversion
  const aaMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: rtComp.texture }, tBloom: { value: null }, bloomAmount: { value: 0.32 }, res: { value: new THREE.Vector2(1, 1) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse, tBloom; uniform vec2 res; uniform float bloomAmount; varying vec2 vUv;
      #define REDUCE_MIN (1.0/128.0)
      #define REDUCE_MUL (1.0/8.0)
      #define SPAN_MAX 8.0
      void main(){
        vec2 inv = 1.0 / res;
        vec3 rgbNW = texture2D(tDiffuse, vUv + vec2(-1.0,-1.0)*inv).rgb;
        vec3 rgbNE = texture2D(tDiffuse, vUv + vec2( 1.0,-1.0)*inv).rgb;
        vec3 rgbSW = texture2D(tDiffuse, vUv + vec2(-1.0, 1.0)*inv).rgb;
        vec3 rgbSE = texture2D(tDiffuse, vUv + vec2( 1.0, 1.0)*inv).rgb;
        vec3 rgbM  = texture2D(tDiffuse, vUv).rgb;
        vec3 luma = vec3(0.299, 0.587, 0.114);
        float lNW = dot(rgbNW, luma), lNE = dot(rgbNE, luma), lSW = dot(rgbSW, luma), lSE = dot(rgbSE, luma), lM = dot(rgbM, luma);
        float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
        float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
        vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
        float dirReduce = max((lNW + lNE + lSW + lSE) * (0.25 * REDUCE_MUL), REDUCE_MIN);
        float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
        dir = min(vec2(SPAN_MAX), max(vec2(-SPAN_MAX), dir * rcp)) * inv;
        vec3 rgbA = 0.5 * (texture2D(tDiffuse, vUv + dir * (1.0/3.0 - 0.5)).rgb + texture2D(tDiffuse, vUv + dir * (2.0/3.0 - 0.5)).rgb);
        vec3 rgbB = rgbA * 0.5 + 0.25 * (texture2D(tDiffuse, vUv + dir * -0.5).rgb + texture2D(tDiffuse, vUv + dir * 0.5).rgb);
        float lB = dot(rgbB, luma);
        vec3 col = (lB < lMin || lB > lMax) ? rgbA : rgbB;
        col += texture2D(tBloom, vUv).rgb * bloomAmount;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false,
  });
  const aaQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), aaMat);
  const aaScene = new THREE.Scene(); aaScene.add(aaQuad);

  function resize(width, height) {
    const pr = renderer.getPixelRatio();
    w = Math.floor(width * pr); h = Math.floor(height * pr);
    rtColor.setSize(w, h); rtNormal.setSize(w, h); rtComp.setSize(w, h);
    rtAO.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1));
    rtBloomA.setSize(Math.max(1, w >> 2), Math.max(1, h >> 2)); rtBloomB.setSize(Math.max(1, w >> 2), Math.max(1, h >> 2));
    mat.uniforms.res.value.set(w, h);
    aaMat.uniforms.res.value.set(w, h);
    aoMat.uniforms.res.value.set(w >> 1, h >> 1);
    blurMat.uniforms.res.value.set(w >> 2, h >> 2);
    mat.uniforms.thick.value = LOOK.thickness * Math.max(1, pr * 0.75);
  }

  function render(sc = scene, cam = camera) {
    // The scene is rendered twice below (colour, then normals) and three redraws
    // the shadow map inside every renderer.render(). Only the colour pass
    // samples shadows, so drive it manually: one depth pass per frame.
    renderer.shadowMap.needsUpdate = true;
    const u = mat.uniforms;
    u.near.value = cam.near; u.far.value = cam.far;
    u.depthK.value = LOOK.depthK; u.normalK.value = LOOK.normalK; u.inkAmount.value = LOOK.inkAmount;
    u.sat.value = LOOK.saturation; u.warmth.value = LOOK.warmth; u.vig.value = LOOK.vignette;
    u.exposure.value = LOOK.exposure; u.knee.value = LOOK.knee;

    // Everything below must act on the camera we were HANDED, not the closure
    // one. Two callers pass their own (the art bake and the showcase), and a
    // fresh PerspectiveCamera has layers.mask = 1 — so every layer-1 object was
    // dropped from their frames, and the ink depth range was linearised against
    // the wrong near/far.
    const mask = cam.layers.mask;
    cam.layers.enableAll();
    renderer.setRenderTarget(rtColor);
    renderer.render(sc, cam);
    cam.layers.set(0);                            // layer 1 = no ink (ghosts, streaks)

    const bg = sc.background, fog = sc.fog;
    sc.background = null; sc.fog = null;
    sc.overrideMaterial = normalMat;
    renderer.setRenderTarget(rtNormal);
    renderer.setClearColor(0x8080ff, 1);         // "facing camera" normal for the sky
    renderer.clear();
    renderer.render(sc, cam);
    sc.overrideMaterial = null;
    sc.background = bg; sc.fog = fog;
    cam.layers.mask = mask;

    // ambient occlusion from depth + normals
    aoMat.uniforms.proj.value.copy(cam.projectionMatrix);
    aoMat.uniforms.projInv.value.copy(cam.projectionMatrixInverse);
    aoMat.uniforms.radius.value = LOOK.aoRadius; aoMat.uniforms.bias.value = LOOK.aoBias; aoMat.uniforms.intensity.value = LOOK.aoIntensity;
    renderer.setRenderTarget(rtAO);
    renderer.render(aoScene, quadCam);
    mat.uniforms.tAO.value = rtAO.texture; mat.uniforms.aoAmount.value = LOOK.aoAmount;

    renderer.setRenderTarget(rtComp);
    renderer.render(quadScene, quadCam);

    // bloom chain at quarter res
    brightMat.uniforms.threshold.value = LOOK.bloomThreshold;
    fxQuad.material = brightMat; renderer.setRenderTarget(rtBloomA); renderer.render(fxScene, quadCam);
    fxQuad.material = blurMat;
    blurMat.uniforms.tSrc.value = rtBloomA.texture; blurMat.uniforms.dir.value.set(1, 0);
    renderer.setRenderTarget(rtBloomB); renderer.render(fxScene, quadCam);
    blurMat.uniforms.tSrc.value = rtBloomB.texture; blurMat.uniforms.dir.value.set(0, 1);
    renderer.setRenderTarget(rtBloomA); renderer.render(fxScene, quadCam);
    aaMat.uniforms.tBloom.value = rtBloomA.texture; aaMat.uniforms.bloomAmount.value = LOOK.bloomAmount;

    renderer.setRenderTarget(null);
    renderer.render(aaScene, quadCam);
  }
  return { resize, render };
}

// Sky: a 2D gradient drawn as the background — deep azure up top, warm haze
// at the horizon where the fence meets it.
// The sky is PAINTED, clouds and all. Cloud geometry gets outlined by the ink
// pass and reads as grey smudges; painting them into the background means
// nothing can outline them and they always look like sky.
export function skyTexture(cols = ['#5fb3ff', '#a9dcff', '#e8f3ff'], cloudAmt = 1, cloudTint = '#ffffff') {
  // Rendered as an EQUIRECT skybox, not a flat backdrop. As a plain background
  // texture, three draws it glued to the screen — passable from the fixed
  // broadcast tilt, but in first person the clouds were enormous static blobs
  // that ignored where you looked. Equirect anchors the sky to the world, so it
  // pans with the camera in every mode. y runs zenith (0) to nadir (H).
  const W = 2048, H = 1024;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0.0, cols[0]);
  g.addColorStop(0.45, cols[1]);
  g.addColorStop(1.0, cols[2]);
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  if (cloudAmt > 0.01) {
    let s = 20260822;
    const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296); };
    // soft edges, so a cloud is a cloud and not a pile of circles
    const puff = (cx, cy, r, fill, alpha, blur = 18) => {
      x.globalAlpha = alpha; x.fillStyle = fill;
      x.shadowColor = fill; x.shadowBlur = blur;
      x.beginPath(); x.arc(cx, cy, r * 0.82, 0, 7); x.fill();
      x.shadowBlur = 0;
    };
    const n = Math.round(9 * Math.min(1.6, cloudAmt));
    for (let i = 0; i < n; i++) {
      const cx = rnd() * W;
      const cy = H * 0.10 + rnd() * (H * 0.34);  // zenith band down to just above the horizon
      const scale = (0.7 + rnd() * 0.9) * (1 - cy / H * 0.35);
      const lobes = 4 + ((rnd() * 4) | 0);
      // soft under-shadow first, then the bright body — gives them volume
      for (let j = 0; j < lobes; j++) {
        const ox = (j - lobes / 2) * 34 * scale + (rnd() - 0.5) * 14;
        const r = (30 + rnd() * 26) * scale;
        puff(cx + ox, cy + r * 0.34, r * 0.94, '#cfe0ef', 0.4 * Math.min(1, cloudAmt), 26);
      }
      for (let j = 0; j < lobes; j++) {
        const ox = (j - lobes / 2) * 34 * scale + (rnd() - 0.5) * 12;
        const r = (30 + rnd() * 26) * scale;
        puff(cx + ox, cy, r, cloudTint, 0.8 * Math.min(1, cloudAmt), 22);
      }
      // wrap the ones that run off the right edge
      if (cx > W - 140) for (let j = 0; j < lobes; j++) {
        const ox = (j - lobes / 2) * 34 * scale;
        puff(cx - W + ox, cy, (30 + rnd() * 26) * scale, cloudTint, 0.8 * Math.min(1, cloudAmt), 22);
      }
    }
    x.globalAlpha = 1;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}
