import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// ── 1. Scene: 모든 게 올라가는 무대
const scene = new THREE.Scene();

// ── 2. Camera: 무대를 바라보는 시점
//    PerspectiveCamera(시야각, 종횡비, 가까운 컷, 먼 컷)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.z = 3;

// ── 3. Renderer: Scene + Camera → 화면
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// ── 4. Mesh = Geometry(형태) + Material(재질)
const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 32);
const material = new THREE.MeshStandardMaterial({
  color: "#6c63ff",
  metalness: 0.3,
  roughness: 0.4,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh); // 무대에 올린다

// ── 5. Light: 조명이 없으면 MeshStandardMaterial은 까맣게 보인다
const ambientLight = new THREE.AmbientLight("#ffffff", 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight("#ffffff", 30);
pointLight.position.set(3, 3, 3);
scene.add(pointLight);

// ── 보너스: OrbitControls — 마우스로 돌려볼 수 있게
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 관성 효과

// ── 창 크기 바뀔 때 대응
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── 매 프레임 실행되는 애니메이션 루프
function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.x += 0.005; // 천천히 회전
  mesh.rotation.y += 0.008;
  controls.update(); // 관성 계산
  renderer.render(scene, camera); // 화면에 그린다
}

animate();
