import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSM } from 'three/addons/csm/CSM.js';

/* =========================
   SCENE
========================= */
const scene = new THREE.Scene();

/* =========================
   MAIN RENDERER
========================= */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x87ceeb);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

/* =========================
   MINIMAP RENDERER
========================= */
const minimapContainer = document.getElementById('minimap');
const minimapRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
minimapRenderer.setSize(minimapContainer.clientWidth, minimapContainer.clientHeight);
minimapRenderer.setPixelRatio(window.devicePixelRatio);
minimapContainer.appendChild(minimapRenderer.domElement);

/* =========================
   CAMERAS
========================= */
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

const minimapCamera = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.1, 500);
minimapCamera.position.set(0, 50, 0);
minimapCamera.up.set(0, 0, -1);
minimapCamera.lookAt(0, 0, 0);

/* =========================
   LIGHTS
========================= */
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
/* =========================
   LOADING MANAGER
========================= */
const loadingManager = new THREE.LoadingManager();
const loader = new GLTFLoader(loadingManager);

const loadingContainer = document.querySelector('.progress-bar-container');
const progressBar = document.getElementById('progress-bar');

loadingManager.onStart = function () {
  loadingContainer.style.display = 'flex';
};

loadingManager.onProgress = function (url, loaded, total) {
  const percent = (loaded / total) * 100;
  progressBar.value = percent;
};

loadingManager.onLoad = function () {
  loadingContainer.style.display = 'none';
};
/* =========================
   CSM SHADOWS
========================= */
const csm = new CSM({
  maxFar: camera.far,
  cascades: 4,
  mode: 'practical',
  parent: scene,
  shadowMapSize: 2048,
  lightDirection: new THREE.Vector3(-1, -1, -1),
  camera
});

csm.lights.forEach(l => {
  l.shadow.bias = -0.0005;
  l.shadow.normalBias = 0.02;
});

/* =========================
   LOADER
========================= */
//const loader = new GLTFLoader();

/* =========================
   WORLD
========================= */
loader.load('public/models/newmap.glb', gltf => {
  const world = gltf.scene;
  world.scale.set(1, 1, 1);
  world.position.set(0, 0, 0);

  world.traverse(o => {
    if (o.isMesh) {
      o.receiveShadow = true;
      o.castShadow = true;
      csm.setupMaterial(o.material);
    }
  });

  scene.add(world);
});

/* =========================
   CHARACTER
========================= */
const character = new THREE.Object3D();
scene.add(character);
/* =========================
   PLAYER FOLLOW CIRCLE
========================= */
const followCircleGeo = new THREE.CircleGeometry(2);
const followCircleMat = new THREE.MeshBasicMaterial({
  color: 0x32CD32,
  transparent: true,
  opacity: 0.6,
  side: THREE.DoubleSide,
  depthWrite: false
});

const followCircle = new THREE.Mesh(followCircleGeo, followCircleMat);
followCircle.rotation.x = -Math.PI / 2;
followCircle.position.y = 49; // same as your ground height
scene.add(followCircle);
const edges = new THREE.EdgesGeometry(followCircleGeo);
const borderMaterial = new THREE.LineBasicMaterial({color:0x000000})
const border = new THREE.LineSegments(edges, borderMaterial);
border.scale.set(1.01,1.01,1.01);
followCircle.add(border);

let soldier, mixer;
const actions = {};
let currentAction;

loader.load('public/models/Soldier.glb', gltf => {
  soldier = gltf.scene;
  soldier.scale.set(2, 2, 2);
  soldier.position.set(0, 1.0, 0);
  soldier.rotation.y = Math.PI;

  soldier.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      csm.setupMaterial(o.material);
    }
  });

  character.add(soldier);

  mixer = new THREE.AnimationMixer(soldier);
  gltf.animations.forEach(clip => {
    actions[clip.name] = mixer.clipAction(clip);
  });

  currentAction = actions['Idle'] || Object.values(actions)[0];
  if (currentAction) currentAction.play();
});

/* =========================
   INPUT (DESKTOP)
========================= */
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

/* =========================
   CAMERA ROTATION (DESKTOP)
========================= */
let yaw = 0, pitch = 0, mouseDown = false;

window.addEventListener('mousedown', () => mouseDown = true);
window.addEventListener('mouseup', () => mouseDown = false);
window.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  yaw -= e.movementX * 0.008;
  pitch -= e.movementY * 0.002;
  pitch = THREE.MathUtils.clamp(pitch, -0.6, 0.4);
});

/* =========================
   MOBILE CONTROLS (GTA STYLE)
========================= */
let joyActive = false;
let runActive = false;
let joyStart = new THREE.Vector2();
let joyDelta = new THREE.Vector2();

let touchCamActive = false;
let camLast = new THREE.Vector2();

const joystick = document.getElementById('joystick');
const stick = joystick?.querySelector('.stick');
const runBtn = document.getElementById('runBtn');

if (joystick) {
  joystick.addEventListener('touchstart', e => {
    joyActive = true;
    const t = e.touches[0];
    joyStart.set(t.clientX, t.clientY);
  });

  joystick.addEventListener('touchmove', e => {
    if (!joyActive) return;
    const t = e.touches[0];
    joyDelta.set(
      t.clientX - joyStart.x,
      t.clientY - joyStart.y
    );

    const max = 50;
    const clamped = joyDelta.clone().clampLength(0, max);
    if (stick) {
      stick.style.transform = `translate(${clamped.x}px, ${clamped.y}px)`;
    }
  });

  joystick.addEventListener('touchend', () => {
    joyActive = false;
    joyDelta.set(0, 0);
    if (stick) stick.style.transform = `translate(-50%, -50%)`;
  });
}

if (runBtn) {
  runBtn.addEventListener('touchstart', () => runActive = true);
  runBtn.addEventListener('touchend', () => runActive = false);
}

// Camera touch anywhere else
window.addEventListener('touchstart', e => {
  if (e.target.closest('#joystick') || e.target.closest('#runBtn')) return;

  touchCamActive = true;
  const t = e.touches[0];
  camLast.set(t.clientX, t.clientY);
});

window.addEventListener('touchmove', e => {
  if (!touchCamActive) return;

  const t = e.touches[0];
  const dx = t.clientX - camLast.x;
  const dy = t.clientY - camLast.y;

  yaw -= dx * 0.005;
  pitch -= dy * 0.003;
  pitch = THREE.MathUtils.clamp(pitch, -0.6, 0.4);

  camLast.set(t.clientX, t.clientY);
});

window.addEventListener('touchend', () => {
  touchCamActive = false;
});
/* ====================
   MISSION STOPS (MULTIPLE)
==================== */
const missionStops = [];
function createMissionStop(x, y, z) {

  const group = new THREE.Group();
  group.position.set(x, y, z);
  scene.add(group);

  // MAIN VICE CITY COLUMN
  const columnGeo = new THREE.CylinderGeometry(0.6, 0.6, 2, 32, 1, true);
  const columnMat = new THREE.MeshBasicMaterial({
    color: 0xff2fd5,          // Vice City pink
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const column = new THREE.Mesh(columnGeo, columnMat);
  column.position.y = 0;
  group.add(column);

  // INNER GLOW
  const innerGlowGeo = new THREE.CylinderGeometry(0.7, 0.7, 2.2, 32, 1, true);
  const innerGlowMat = new THREE.MeshBasicMaterial({
    color: 0xff66ff,
    transparent: true,
    opacity: 0.25,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
  innerGlow.position.y = 0;
  group.add(innerGlow);

  // OUTER AURA RING (GROUND GLOW)
  const ringGeo = new THREE.RingGeometry(0.8, 1.2, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff2fd5,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0;
  group.add(ring);

  // store for animation + detection
  missionStops.push({
    group,
    column,
    innerGlow,
    ring,
    baseY: y
  });

  return group;
}
createMissionStop(7,-0.5,7);
createMissionStop(-4,-0.5,-72);
createMissionStop(7,-0.5,50);
createMissionStop(-60,-0.5,-10);
createMissionStop(35,-0.5,-30);
createMissionStop(-97,-0.5,80);
/* =========================
   ANIMATE LOOP
========================= */
const clock = new THREE.Clock();

const MOVE_SPEED = 5;
const RUN_MULTIPLIER = 2;


/* =========================
   CAMERA SMOOTH FOLLOW
========================= */
const cameraOffset = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const lookAtPos = new THREE.Vector3();

const CAMERA_DISTANCE = 8;
const CAMERA_HEIGHT = 3;
const CAMERA_LERP = 0.1; // smoothing factor

function updateCamera() {
  // Compute offset from yaw and pitch
  cameraOffset.set(
    Math.sin(yaw) * CAMERA_DISTANCE,
    CAMERA_HEIGHT + pitch * 2, // reduce multiplier for smooth vertical movement
    Math.cos(yaw) * CAMERA_DISTANCE
  );

  // Target is slightly above character for lookAt
  cameraTarget.copy(character.position).add(new THREE.Vector3(0, 1.5, 0));

  // Smoothly move camera toward target + offset
  camera.position.lerp(cameraTarget.clone().add(cameraOffset), CAMERA_LERP);

  // Smooth lookAt
  lookAtPos.copy(cameraTarget);
  camera.lookAt(lookAtPos);
}

/* =========================
   ANIMATE LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  /* MOVEMENT */
  const camDir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
  const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();
  const moveDir = new THREE.Vector3();

  // keyboard
  if (keys.w) moveDir.add(camDir);
  if (keys.s) moveDir.sub(camDir);
  if (keys.a) moveDir.sub(camRight);
  if (keys.d) moveDir.add(camRight);

  // joystick
  if (joyActive) {
    const deadZone = 10;
    const maxDist = 60;

    const dx = THREE.MathUtils.clamp(joyDelta.x, -maxDist, maxDist);
    const dy = THREE.MathUtils.clamp(joyDelta.y, -maxDist, maxDist);

    if (Math.abs(dx) > deadZone || Math.abs(dy) > deadZone) {
      moveDir
        .addScaledVector(camRight, dx / maxDist)
        .addScaledVector(camDir, -dy / maxDist);
    }
  }

  if (moveDir.lengthSq()) {
    moveDir.normalize();

    let speed = MOVE_SPEED * delta;
    if (keys.shift || runActive) speed *= RUN_MULTIPLIER;

    character.position.addScaledVector(moveDir, speed);
    character.rotation.y = Math.atan2(moveDir.x, moveDir.z);

    const next = (keys.shift || runActive)
      ? actions.Run || actions.Walk
      : actions.Walk || actions.Run;

    if (next && currentAction !== next) {
      if (currentAction) currentAction.fadeOut(0.15);
      next.reset().fadeIn(0.15).play();
      currentAction = next;
    }
  } else if (actions.Idle && currentAction !== actions.Idle) {
    if (currentAction) currentAction.fadeOut(0.15);
    actions.Idle.reset().fadeIn(0.15).play();
    currentAction = actions.Idle;
  }

  /* KEEP PLAYER ON GROUND */
  character.position.y = -1.8;

  /* CAMERA FOLLOW */
  updateCamera();

  /* MINIMAP FOLLOW */
  minimapCamera.position.x = character.position.x;
  minimapCamera.position.z = character.position.z;
  minimapCamera.lookAt(character.position.x, 0, character.position.z);

  /* PLAYER FOLLOW CIRCLE UPDATE */
  followCircle.position.x = character.position.x;
  followCircle.position.z = character.position.z;

  /* MISSION STOPS ANIMATION */
  const time = performance.now() * 0.004;
  missionStops.forEach(ms => {
    const floatY = Math.sin(time + ms.group.position.x) * 0.2;
    ms.group.position.y = ms.baseY + floatY;

    const pulse = Math.sin(time * 2) * 0.15 + 1;
    ms.column.scale.set(pulse, 1, pulse);
    ms.innerGlow.scale.set(pulse * 1.2, 1, pulse * 1.2);

    ms.column.material.opacity = 0.25 + Math.sin(time * 2) * 0.1;
    ms.innerGlow.material.opacity = 0.2 + Math.sin(time * 3) * 0.1;

    ms.group.rotation.y += 0.005;
  });

  /* RENDER */
  csm.update();
  renderer.render(scene, camera);

  renderer.clearDepth();
  minimapRenderer.render(scene, minimapCamera);
}

animate();


animate();

/* =========================
   RESIZE
========================= */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  minimapRenderer.setSize(minimapContainer.clientWidth, minimapContainer.clientHeight);
});