import * as THREE from 'three';

// Pooled dust puffs. Never allocates during play.
export function makeFX(scene) {
  const N = 220;
  const geo = new THREE.SphereGeometry(1, 7, 5);
  const mat = new THREE.MeshBasicMaterial({ color: 0xe6d9b8, transparent: true, opacity: 0.75 });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const P = Array.from({ length: N }, () => ({ life: 0, x:0, y:0, z:0, vx:0, vy:0, vz:0, s:0 }));
  let head = 0;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();

  function spawn(x, z, vx, vz, size) {
    const p = P[head++ % N];
    p.life = 0.45 + Math.random()*0.25;
    p.x = x + (Math.random()-0.5)*0.4; p.y = 0.12 + Math.random()*0.2; p.z = z + (Math.random()-0.5)*0.4;
    p.vx = vx*(0.5+Math.random()) + (Math.random()-0.5)*1.4;
    p.vy = 0.7 + Math.random()*1.1;
    p.vz = vz*(0.5+Math.random()) + (Math.random()-0.5)*1.4;
    p.s = size * (0.7 + Math.random()*0.6);
  }

  return {
    burst(x, z, dx, dz, n = 8) { for (let i = 0; i < n; i++) spawn(x, z, dx*2.4, dz*2.4, 0.22); },
    trail(x, z, dx, dz)        { spawn(x, z, dx*0.8, dz*0.8, 0.17); },
    update(dt) {
      for (let i = 0; i < N; i++) {
        const p = P[i];
        if (p.life <= 0) { S.set(0,0,0); }
        else {
          p.life -= dt;
          p.x += p.vx*dt; p.y += p.vy*dt; p.z += p.vz*dt;
          p.vy -= 3.4*dt; p.vx *= 0.94; p.vz *= 0.94;
          if (p.y < 0.05) { p.y = 0.05; p.vy = 0; }
          const k = Math.max(0, p.life) * p.s;
          S.set(k, k, k);
        }
        V.set(p.x, p.y, p.z);
        M.compose(V, Q, S);
        mesh.setMatrixAt(i, M);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  };
}
