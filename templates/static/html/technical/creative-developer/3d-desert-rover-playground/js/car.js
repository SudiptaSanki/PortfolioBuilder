/* ============================================================
   DUNE ROVER® — Playground / the toy car
   A rounded little rover with arcade physics: acceleration, drift,
   ramp launches, suspension, landing squash and wheel dust.
   ============================================================ */
(function () {
  'use strict';

  const Car = (window.Car = {});

  const P = {
    accel: 17.5,
    reverseAccel: 9,
    brake: 30,
    maxSpeed: 17,
    maxReverse: 7.2,
    drag: 0.72,
    rollFriction: 1.35,
    turnRate: 2.15,
    grip: 5.6,
    gravity: 30,
  };

  const C = {
    body: 0xffe9c8,
    bodyShadow: 0xe9cfa9,
    cabin: 0xc2674a,
    glass: 0x5f7d8a,
    tyre: 0x3c3230,
    hub: 0xf2d9ad,
    trim: 0xe99673,
    light: 0xfff3cd,
    tail: 0xd2543f,
  };

  function std(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.04 }, opts || {}));
  }

  function roundedBoxGeo(w, h, d, r) {
    // w along z (length), h along y, d along x (width) after rotation
    const shape = new THREE.Shape();
    const hw = w / 2 - r, hh = h / 2 - r;
    shape.moveTo(-hw, -h / 2);
    shape.lineTo(hw, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -hh);
    shape.lineTo(w / 2, hh);
    shape.quadraticCurveTo(w / 2, h / 2, hw, h / 2);
    shape.lineTo(-hw, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, hh);
    shape.lineTo(-w / 2, -hh);
    shape.quadraticCurveTo(-w / 2, -h / 2, -hw, -h / 2);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1, bevelSegments: 3, curveSegments: 8,
    });
    geo.translate(0, 0, -d / 2);
    geo.rotateY(Math.PI / 2);
    geo.computeVertexNormals();
    return geo;
  }

  Car.create = function (scene) {
    const root = new THREE.Group();       // ground plane position + heading
    const body = new THREE.Group();       // suspension pitch / roll
    root.add(body);

    /* chassis */
    const chassis = new THREE.Mesh(roundedBoxGeo(3.35, 0.64, 1.78, 0.24), std(C.body, { roughness: 0.42 }));
    chassis.position.y = 0.66;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    body.add(chassis);

    /* side skirt / accent line */
    const skirt = new THREE.Mesh(roundedBoxGeo(2.5, 0.22, 1.84, 0.1), std(C.trim, { roughness: 0.5 }));
    skirt.position.y = 0.42;
    skirt.castShadow = true;
    body.add(skirt);

    /* cabin */
    const cabin = new THREE.Mesh(roundedBoxGeo(1.66, 0.72, 1.5, 0.22), std(C.cabin, { roughness: 0.46 }));
    cabin.position.set(0, 1.2, -0.18);
    cabin.castShadow = true;
    body.add(cabin);

    /* glass band */
    const glassMat = std(C.glass, { roughness: 0.16, metalness: 0.35 });
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.5, 0.08), glassMat);
    windshield.position.set(0, 1.25, 0.62);
    body.add(windshield);
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.44, 0.08), glassMat);
    rearGlass.position.set(0, 1.25, -1.0);
    body.add(rearGlass);
    [-1, 1].forEach((s) => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 1.16), glassMat);
      side.position.set(s * 0.76, 1.26, -0.2);
      body.add(side);
    });

    /* roof rack + tiny flag */
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.9), std(C.bodyShadow));
    rack.position.set(0, 1.58, -0.2);
    body.add(rack);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.5, 6), std(0x8d6a52));
    pole.position.set(-0.5, 2.3, -1.2);
    body.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.34), new THREE.MeshStandardMaterial({ color: 0xf4d488, side: THREE.DoubleSide, roughness: 0.9 }));
    flag.position.set(-0.19, 2.85, -1.2);
    body.add(flag);

    /* bumpers */
    [-1, 1].forEach((s) => {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.7, 10), std(C.bodyShadow, { roughness: 0.4 }));
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 0.5, s * 1.72);
      bar.castShadow = true;
      body.add(bar);
    });

    /* lights */
    [-1, 1].forEach((s) => {
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), new THREE.MeshStandardMaterial({ color: C.light, emissive: 0xffe3a0, emissiveIntensity: 0.55, roughness: 0.25 }));
      hl.position.set(s * 0.58, 0.78, 1.72);
      body.add(hl);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.06), new THREE.MeshStandardMaterial({ color: C.tail, emissive: 0x8e2415, emissiveIntensity: 0.5, roughness: 0.4 }));
      tl.position.set(s * 0.62, 0.82, -1.72);
      body.add(tl);
    });

    /* grille teeth — gives the car a face */
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 0.05), std(0x6d5145, { roughness: 0.6 }));
    grille.position.set(0, 0.62, 1.73);
    body.add(grille);
    for (let i = 0; i < 3; i++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.07), std(C.body));
      tooth.position.set(-0.24 + i * 0.24, 0.62, 1.75);
      body.add(tooth);
    }

    /* wheels */
    const wheels = [];
    const tyreGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.34, 22);
    const hubGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.36, 14);
    const treadGeo = new THREE.TorusGeometry(0.44, 0.05, 8, 24);
    const positions = [
      [-0.95, 0.44, 1.06, true],
      [0.95, 0.44, 1.06, true],
      [-0.95, 0.44, -1.12, false],
      [0.95, 0.44, -1.12, false],
    ];
    positions.forEach(([x, y, z, isFront]) => {
      const pivot = new THREE.Group();          // steering
      pivot.position.set(x, y, z);
      const spin = new THREE.Group();           // rolling
      pivot.add(spin);

      const tyre = new THREE.Mesh(tyreGeo, std(C.tyre, { roughness: 0.85 }));
      tyre.rotation.z = Math.PI / 2;
      tyre.castShadow = true;
      spin.add(tyre);

      const hub = new THREE.Mesh(hubGeo, std(C.hub, { roughness: 0.35, metalness: 0.1 }));
      hub.rotation.z = Math.PI / 2;
      spin.add(hub);

      const tread = new THREE.Mesh(treadGeo, std(0x534743, { roughness: 0.95 }));
      tread.rotation.y = Math.PI / 2;
      spin.add(tread);

      // mudguard
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.72), std(C.bodyShadow, { roughness: 0.6 }));
      guard.position.set(x * 1.02, 0.86, z);
      body.add(guard);

      body.add(pivot);
      wheels.push({ pivot, spin, front: isFront, side: x > 0 ? 1 : -1, z });
    });

    /* dust particles */
    const dustCount = 44;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustData = [];
    for (let i = 0; i < dustCount; i++) {
      dustData.push({ life: 0, max: 1, vx: 0, vy: 0, vz: 0, size: 0 });
      dustPos[i * 3 + 1] = -999;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 64;
      const ctx = cv.getContext('2d');
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,238,214,0.9)');
      g.addColorStop(1, 'rgba(235,200,160,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      const t = new THREE.CanvasTexture(cv);
      t.encoding = THREE.sRGBEncoding;
      return t;
    })();
    const dustMat = new THREE.PointsMaterial({
      size: 0.9, map: dustTex, transparent: true, depthWrite: false,
      opacity: 0.75, sizeAttenuation: true, blending: THREE.NormalBlending,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    dust.frustumCulled = false;
    scene.add(dust);

    const car = {
      root, body, wheels, flag,
      pos: new THREE.Vector3(0, 0, 4),
      heading: Math.PI,
      speed: 0,
      steer: 0,
      hitT: 0,
      vy: 0,
      airborne: false,
      accelSmooth: 0,
      bobT: 0,
      squash: 0,
      radius: 1.5,
      vel: new THREE.Vector3(),
      dust, dustData, dustPos, dustGeo, dustMat,
      wheelSpin: 0,
      airborneTime: 0,
      landedAt: 0,
      headlights: [],
    };

    root.scale.setScalar(1.12);
    root.position.copy(car.pos);
    root.rotation.y = car.heading;
    scene.add(root);

    Car.reset(car, 0, 4, Math.PI);
    return car;
  };

  Car.reset = function (car, x, z, heading) {
    car.pos.set(x, World.groundHeight(x, z), z);
    car.heading = heading;
    car.speed = 0;
    car.steer = 0;
    car.vy = 0;
    car.airborne = false;
    car.hitT = 0;
    car.root.position.copy(car.pos);
    car.root.rotation.y = heading;
    car.body.rotation.set(0, 0, 0);
    car.body.position.y = 0;
    car.dustData.forEach((d, i) => { d.life = 0; car.dustPos[i * 3 + 1] = -999; });
    car.dustGeo.attributes.position.needsUpdate = true;
  };

  Car.bounce = function (car, factor) {
    car.speed *= 1 - Math.min(0.55, factor * 0.55);
  };

  const _fwd = new THREE.Vector3();
  const _vel = new THREE.Vector3();
  const _hit = { nx: 0, nz: 0, depth: 0, hits: 0 };
  const HULL_R = 1.2;      // collision hull radius in world units
  const MAX_STEP = 0.34;   // how high a wheel can climb in one step

  /* A ramp's side or back wall shows up as a sudden rise in the ground height
     field. Treat anything steeper than MAX_STEP as solid: keep the movement
     tangential to the slope so the car slides along the wall instead of
     teleporting up onto the deck. */
  function wallStep(car, px, pz, sdt) {
    const gh = World.groundHeight(car.pos.x, car.pos.z);
    if (gh - car.pos.y <= MAX_STEP) return false;
    const e = 0.45;
    const gx = (World.groundHeight(car.pos.x + e, car.pos.z) - World.groundHeight(car.pos.x - e, car.pos.z)) / (2 * e);
    const gz = (World.groundHeight(car.pos.x, car.pos.z + e) - World.groundHeight(car.pos.x, car.pos.z - e)) / (2 * e);
    let nx = -gx, nz = -gz;
    const nl = Math.hypot(nx, nz);
    if (nl < 1e-4) { nx = -_fwd.x; nz = -_fwd.z; }
    else { nx /= nl; nz /= nl; }

    const vx = _fwd.x * car.speed, vz = _fwd.z * car.speed;
    const vn = vx * nx + vz * nz;
    const tx = vx - nx * vn, tz = vz - nz * vn;
    const nxp = px + tx * sdt, nzp = pz + tz * sdt;
    if (World.groundHeight(nxp, nzp) - car.pos.y <= MAX_STEP) {
      car.pos.x = nxp; car.pos.z = nzp;
    } else {
      car.pos.x = px; car.pos.z = pz;
    }
    car.speed = tx * _fwd.x + tz * _fwd.z;
    if (Math.abs(car.speed) < 0.4) car.speed = 0;
    return true;
  }

  Car.update = function (dt, car, input, t) {
    const thr = input.throttle || 0;
    const steerInput = input.steer || 0;
    if (car.hitT > 0) car.hitT = Math.max(0, car.hitT - dt);

    /* ── longitudinal ── */
    const speedAbs = Math.abs(car.speed);
    if (thr > 0) {
      if (car.speed < -0.2) car.speed += P.brake * thr * dt;
      else car.speed += P.accel * thr * dt * (1 - Math.min(1, car.speed / (P.maxSpeed * 1.12)));
    } else if (thr < 0) {
      if (car.speed > 0.2) car.speed += P.brake * thr * dt;
      else car.speed += P.reverseAccel * thr * dt * (1 - Math.min(1, -car.speed / (P.maxReverse * 1.15)));
    } else {
      car.speed -= car.speed * P.drag * dt;
      if (Math.abs(car.speed) < 0.35) car.speed = 0;
    }
    // rolling friction on sand
    car.speed -= car.speed * P.rollFriction * dt * (car.airborne ? 0.05 : 0.32);
    car.speed = Math.max(-P.maxReverse, Math.min(P.maxSpeed, car.speed));

    /* ── steering ──
       +steer = the driver's right. Rotating the model about +Y with a rising
       heading sweeps its nose toward its own LEFT, so subtract. */
    const steerTarget = Math.max(-1, Math.min(1, steerInput));
    car.steer += (steerTarget - car.steer) * Math.min(1, dt * 9);
    const gripFactor = car.airborne ? 0.25 : Math.min(1, speedAbs / 3.4);
    const dir = car.speed >= 0 ? 1 : -1;
    car.heading -= car.steer * P.turnRate * gripFactor * dir * dt;

    /* ── integrate position (substepped so nothing is tunneled) ── */
    _fwd.set(Math.sin(car.heading), 0, Math.cos(car.heading));
    const prevX = car.pos.x, prevZ = car.pos.z;
    const travelled = Math.abs(car.speed * dt);
    const steps = Math.max(1, Math.min(10, Math.ceil(travelled / 0.38)));
    const sdt = dt / steps;
    for (let s = 0; s < steps; s++) {
      const px = car.pos.x, pz = car.pos.z;
      car.pos.x += _fwd.x * car.speed * sdt;
      car.pos.z += _fwd.z * car.speed * sdt;

      /* island edge — soft fence */
      const r = Math.hypot(car.pos.x, car.pos.z);
      const bound = World.BOUNDS || 42.5;
      if (r > bound) {
        const k = bound / r;
        car.pos.x *= k; car.pos.z *= k;
        car.speed *= -0.25;
        car.steer *= -0.4;
      }

      /* solid obstacles: trees, houses, rocks, hay rolls, billboards, boards,
         signposts. Push out, then bleed off the speed that was heading into it
         so the car slides along the surface instead of sticking or passing through. */
      if (World.resolveCircle) {
        const res = World.resolveCircle(car.pos, HULL_R, _hit);
        if (res) {
          const into = _fwd.x * res.nx + _fwd.z * res.nz;
          if (car.speed * into < 0) {
            const before = Math.abs(car.speed);
            car.speed *= 1 - 1.35 * into * into;
            if (before > 6 && into < -0.65 && !(car.hitT > 0)) {
              car.hitT = 0.3;
              if (window.App && App.onHit) App.onHit(before);
            }
          }
        }
      }

      /* a slope that rises too steeply for a wheel is a wall, not a ramp */
      if (!car.airborne && wallStep(car, px, pz, sdt)) {
        if (Math.abs(car.speed) < 0.5) car.speed = 0;
      }
    }

    /* ── vertical: ramps, jumps, landings ── */
    const gh = World.groundHeight(car.pos.x, car.pos.z);
    const prevGh = World.groundHeight(prevX, prevZ);
    car.airborneTime += dt;

    if (!car.airborne) {
      const climb = (gh - prevGh) / Math.max(dt, 0.0001);
      if (gh > car.pos.y + 0.001) {
        // riding up the ramp
        car.pos.y = gh;
        car.vy = Math.max(0, climb);
      } else if (gh < car.pos.y - 0.06) {
        // left the ramp lip
        car.airborne = true;
        car.vy = Math.max(car.vy, Math.min(9.5, speedAbs * 0.42));
        car.airborneTime = 0;
      } else {
        car.pos.y = gh;
        car.vy = 0;
      }
    } else {
      car.vy -= P.gravity * dt;
      car.pos.y += car.vy * dt;
      if (car.pos.y <= gh) {
        const impact = -car.vy;
        car.pos.y = gh;
        car.vy = 0;
        car.airborne = false;
        car.squash = Math.min(0.32, impact * 0.024);
        car.landedAt = t;
        if (impact > 5 && window.App && App.onLand) App.onLand(impact);
      }
    }

    /* ── visual ── */
    car.root.position.copy(car.pos);
    car.root.rotation.y = car.heading;

    car.accelSmooth += ((thr > 0 ? -1 : thr < 0 ? 1 : 0) * Math.min(1, speedAbs / 8) - car.accelSmooth) * Math.min(1, dt * 4);

    car.bobT += dt * (4 + speedAbs * 0.9);
    const bob = Math.sin(car.bobT) * 0.012 * Math.min(1, speedAbs / 6);
    car.squash *= 1 - Math.min(1, dt * 7);

    car.body.position.y = bob - car.squash * 0.4;
    car.body.scale.set(1 + car.squash * 0.24, 1 - car.squash * 0.55, 1 + car.squash * 0.2);
    car.body.rotation.x = car.accelSmooth * 0.07 + (car.airborne ? Math.max(-0.16, Math.min(0.16, -car.vy * 0.014)) : 0);
    car.body.rotation.z = -car.steer * Math.min(1, speedAbs / 9) * 0.16;

    /* wheels */
    car.wheelSpin += (car.speed / 0.44) * dt;
    car.wheels.forEach((w) => {
      w.spin.rotation.x = car.wheelSpin;
      if (w.front) w.pivot.rotation.y = -car.steer * 0.5;
      w.pivot.position.y = 0.44 + (car.airborne ? 0.02 : 0);
    });

    /* flag flutter */
    if (car.flag) car.flag.rotation.y = Math.sin(t * 6 + car.speed) * 0.25;

    /* velocity for prop impulses */
    _vel.set(_fwd.x * car.speed, car.vy, _fwd.z * car.speed);
    car.vel.copy(_vel);

    /* dust */
    if (!car.airborne && speedAbs > 4.5 && Math.random() < Math.min(0.9, speedAbs / 14)) {
      const slot = car.dustData.findIndex((d) => d.life <= 0);
      if (slot >= 0) {
        const d = car.dustData[slot];
        d.life = d.max = 0.5 + Math.random() * 0.4;
        d.vx = -_fwd.x * Math.random() * 2 + (Math.random() - 0.5) * 1.4;
        d.vz = -_fwd.z * Math.random() * 2 + (Math.random() - 0.5) * 1.4;
        d.vy = 0.8 + Math.random() * 1.2;
        const back = car.wheels[2 + (Math.random() > 0.5 ? 1 : 0)];
        const wx = car.pos.x + (Math.random() - 0.5) * 1.4;
        const wz = car.pos.z - _fwd.z * 1.2 + (Math.random() - 0.5) * 0.7;
        car.dustPos[slot * 3] = wx;
        car.dustPos[slot * 3 + 1] = car.pos.y + 0.2;
        car.dustPos[slot * 3 + 2] = wz;
      }
    }
    for (let i = 0; i < car.dustData.length; i++) {
      const d = car.dustData[i];
      if (d.life > 0) {
        d.life -= dt;
        car.dustPos[i * 3] += d.vx * dt;
        car.dustPos[i * 3 + 1] += d.vy * dt;
        car.dustPos[i * 3 + 2] += d.vz * dt;
        d.vy -= 1.4 * dt;
        if (d.life <= 0) car.dustPos[i * 3 + 1] = -999;
      }
    }
    car.dustGeo.attributes.position.needsUpdate = true;
    car.dustMat.opacity = 0.55;

    return car;
  };

  Car.speedKmh = function (car) {
    return Math.round(Math.abs(car.speed) * 4.4);
  };
})();
