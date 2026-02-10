import * as THREE from 'three';
import {}

/* =======================
   SCENE
======================= */
const scene = new THREE.Scene();

/* =======================
   CAMERA
======================= */
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

/* =======================
   LIGHT
======================= */
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

/* =======================
   RENDERER
======================= */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

/* =======================
   TEXTURE
======================= 
const textureLoader = new THREE.TextureLoader();

const texture = textureLoader.load(
  potatoImg,
  () => console.log('✅ texture loaded'),
  undefined,
  (err) => console.error('❌ texture failed', err)
);

texture.colorSpace = THREE.SRGBColorSpace;

/* =======================
   CAMERA SCROLL LOGIC
======================= */
let targetZ = camera.position.z;
const MIN_Z = -120;
const MAX_Z = 10;

window.addEventListener(
  'wheel',
  (event) => {
    if (event.deltaY < 0) targetZ -= 1.5;
    if (event.deltaY > 0) targetZ += 1.5;

    targetZ = THREE.MathUtils.clamp(targetZ, MIN_Z, MAX_Z);
  },
  { passive: true }
);

/* =======================
   PLANE 1
======================= */
const plane1 = new THREE.Mesh(
  new THREE.PlaneGeometry(5, 5),
  new THREE.MeshBasicMaterial({ color: 0xff00ff })
);
plane1.position.z = 0;
scene.add(plane1);

/* =======================
   PLANE 2
======================= */
const plane2 = new THREE.Mesh(
  new THREE.PlaneGeometry(7, 7),
  new THREE.MeshBasicMaterial({ color: 0x0000ff })
);
plane2.position.z = -50;
scene.add(plane2);

/* =======================
   PLANE 3 (TEXTURED)
======================= */
const plane3 = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 8),
  new THREE.MeshBasicMaterial({
   
    side: THREE.DoubleSide
  })
);
plane3.position.z = -100;
scene.add(plane3);

/* =======================
   ANIMATION LOOP
======================= */
function animate() {
  requestAnimationFrame(animate);

  // smooth camera movement
  camera.position.z += (targetZ - camera.position.z) * 0.1;

  renderer.render(scene, camera);
}

animate();

/* =======================
   HANDLE RESIZE
======================= */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
