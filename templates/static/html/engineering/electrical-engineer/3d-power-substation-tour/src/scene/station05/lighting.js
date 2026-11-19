// lighting.js — golden hour as a material (inventory §5). One low
// directional sun at 7° elevation from WNW (azimuth 287°), warm amber;
// a gradient sky dome (peach at the western horizon, dusty blue
// overhead, cool grey-blue east — never flat, never orange-everything);
// hemisphere fill so eastern faces stay cool; a warm haze for depth.
// The only artificial lights are two small warm points just switching
// on: the substation yard light and the O&M cabin window.

import * as THREE from 'three';
import { STATION05 } from '../../config/world.js';

const S05 = STATION05;

// Unit vector pointing TOWARD the sun, from azimuth/elevation.
// Bearing: (east, north) = (sin az, cos az); three.js: x = east,
// z = -north (south-positive), y = up.
export function sunDirection() {
  const az = THREE.MathUtils.degToRad(S05.sun.azimuthDeg);
  const el = THREE.MathUtils.degToRad(S05.sun.elevationDeg);
  const ch = Math.cos(el);
  return new THREE.Vector3(Math.sin(az) * ch, Math.sin(el), -Math.cos(az) * ch);
}

const SKY_VERT = /* glsl */`
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

// NOTE: plain ShaderMaterial, NO glslVersion (SCAFFOLD rule 3);
// tonemapping/colorspace chunks appended so the dome sits in the
// same colour pipeline as the lit scene.
const SKY_FRAG = /* glsl */`
  uniform vec3 sunDir;
  uniform vec3 zenith;
  uniform vec3 horizonWarm;
  uniform vec3 horizonCool;
  uniform vec3 groundCol;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    vec2 dxz = normalize(d.xz);
    vec2 sxz = normalize(sunDir.xz);
    float sunAmt = pow(clamp(dot(dxz, sxz) * 0.5 + 0.5, 0.0, 1.0), 2.2);
    vec3 horizon = mix(horizonCool, horizonWarm, sunAmt);
    vec3 col;
    if (d.y > 0.0) {
      col = mix(horizon, zenith, pow(clamp(d.y, 0.0, 1.0), 0.55));
    } else {
      col = mix(horizon, groundCol, clamp(-d.y * 3.5, 0.0, 1.0));
    }
    float g = max(dot(d, sunDir), 0.0);
    col += vec3(1.0, 0.60, 0.28) * (pow(g, 700.0) * 1.7 + pow(g, 24.0) * 0.30);
    // broad warm wash around the sun, hugging the horizon — the
    // golden in golden hour (kept localised so the sky stays calm)
    col += vec3(1.0, 0.52, 0.20) * pow(g, 6.0) * 0.13 * (1.0 - clamp(d.y * 2.0, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createLighting(scene) {
  const group = new THREE.Group();
  group.name = 's05-lighting';
  const sunDir = sunDirection();

  // --- sky dome ---
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: {
      sunDir: { value: sunDir },
      zenith: { value: new THREE.Color(S05.sky.zenith) },
      horizonWarm: { value: new THREE.Color(S05.sky.horizonWarm) },
      horizonCool: { value: new THREE.Color(S05.sky.horizonCool) },
      groundCol: { value: new THREE.Color(S05.sky.ground) },
    },
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), skyMat);
  dome.frustumCulled = false;
  dome.renderOrder = -10;
  group.add(dome);

  // --- the one sun (key lifted ~⅓ over the register value: at 7°
  // the grazing light needs the help, and the overview read murky)
  const sun = new THREE.DirectionalLight(S05.sun.color, S05.sun.intensity * 1.35);
  sun.position.copy(sunDir).multiplyScalar(700).add(new THREE.Vector3(40, 0, 0));
  sun.target.position.set(40, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -235;
  sun.shadow.camera.right = 235;
  sun.shadow.camera.top = 235;
  sun.shadow.camera.bottom = -235;
  sun.shadow.camera.near = 250;
  sun.shadow.camera.far = 1500;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 1.4;
  group.add(sun);
  group.add(sun.target);

  // --- hemisphere fill: cool sky, warm ground bounce ---
  const hemi = new THREE.HemisphereLight(S05.sun.hemiSky, S05.sun.hemiGround, S05.sun.hemiIntensity * 1.25);
  group.add(hemi);

  // --- cool eastern fill so shadow faces stay blue, not black ---
  const fill = new THREE.DirectionalLight(0x9fb4cc, 0.38);
  fill.position.set(500, 260, 220);
  group.add(fill);

  // --- first artificial lights (small, warm, just on) ---
  const yard = new THREE.PointLight(0xffc37a, 900, 60, 2);
  yard.position.set(S05.substation.yardLight[0], 6.2, S05.substation.yardLight[1]);
  group.add(yard);

  const cabin = new THREE.PointLight(0xffbe78, 260, 26, 2);
  cabin.position.set(S05.cabin.pos[0], 2.2, S05.cabin.pos[1] - 3.2);
  group.add(cabin);

  // Warm haze for aerial depth (turbines sit ~300 m from the heroes).
  scene.fog = new THREE.Fog(0xe6c69c, 420, 1900);

  return group;
}
