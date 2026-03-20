import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// 1. Scene: 모든 게 올라가는 무대
const scene = new THREE.Scene();
scene.background = new THREE.Color("#111111"); //배경색 지정

// 2. Camera: 무대를 바라보는 시점
// PerspectiveCamera(시야각, 종횡비, 가까운 컷, 먼 컷)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 1, 3);

// 3. Renderer: Scene + Camera → 화면
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 4. Mesh = Geometry(형태) + Material(재질)
// const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 32);
// const material = new THREE.MeshStandardMaterial({
//   color: "#89deff",
//   metalness: 0.3,
//   roughness: 0.4,
// });
// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh); // 무대에 올린다

// 5. Light
const ambientLight = new THREE.AmbientLight("#ffffff", 1);
scene.add(ambientLight);

// 전구처럼 한 점에서 사방으로 빛이 퍼지는 조명 (단순한 도형엔 괜찮)
// const pointLight = new THREE.PointLight("#ffffff", 30);
// pointLight.position.set(3, 3, 3);
// scene.add(pointLight);

// 태양처럼 특정 방향에서 평행하게 쏘는 조명
const directionLight = new THREE.DirectionalLight("#ffffff", 3);
directionLight.position.set(2, 4, 2);
scene.add(directionLight);

// OrbitControls — 마우스로 돌려볼 수 있게
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 관성 효과

// GLTFLoader - 모델 불러오기
const loader = new GLTFLoader();

loader.load(
  // 어떤 파일 불러올 지
  "/ship-pirate-small.glb",
  (gltf) => {
    // 성공
    const model = gltf.scene;
    model.scale.set(0.2, 0.2, 0.2); // 크기 조절
    model.position.set(0, -1, 0); // 위치 조정
    scene.add(model);
    console.log("모델 로드 완료");
  },
  (progress) => {
    //로딩
    console.log("로딩 중", (progress.loaded / progress.total) * 100);
  },
  (error) => {
    //에러
    console.error("로드 실패: ", error);
  },
);

// 창 크기 바뀔 때 대응
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 매 프레임 실행되는 애니메이션 루프
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // 관성 계산
  renderer.render(scene, camera); // 화면에 그린다
}

animate();
