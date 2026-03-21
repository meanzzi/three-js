import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// 여태껏 구현한걸 라이브러리 사용하기 (유지보수 쉽고, 개발속도 빠름)
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Scene: 모든 게 올라가는 무대
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// 바다 표현 - 평면 하나 추가
const seaGeometry = new THREE.PlaneGeometry(50, 50);
const seaMaterial = new THREE.MeshStandardMaterial({
  color: 0x006994, // 바다색
  roughness: 0.8,
});
const sea = new THREE.Mesh(seaGeometry, seaMaterial);
sea.rotation.x = -Math.PI / 2; // 눕히기
sea.position.y = -1.5; // 아래로 내리기
scene.add(sea);

// Camera: 무대를 바라보는 시점
// PerspectiveCamera(시야각, 종횡비, 가까운 컷, 먼 컷)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 1, 3);

// 마우스 좌표 저장할 변수
// three.js 마우스 좌표는 -1~1 사이 (정중앙이 0, 오른쪽 끝이 1)
const mouse = { x: 0, y: 0 };

window.addEventListener("mousemove", (e) => {
  // 화면 크기 기준으로 -1 ~ 1 사이 값으로 반환
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
});

// 광선을 싸서 물체에 맞는지 감지하는 것
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

window.addEventListener("click", (e) => {
  // 마우스 위치 -1 ~ 1 사이로 변환
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  // 카메라 기준 광선 쏘기
  raycaster.setFromCamera(pointer, camera);

  if (model) {
    //광선에 맞은 물체들의 배열
    const intersects = raycaster.intersectObject(model, true);

    if (intersects.length > 0) {
      console.log("클릭");
      sailAway();
    }
  }
});

// Renderer: Scene + Camera → 화면
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Light
const ambientLight = new THREE.AmbientLight("#ffffff", 3);
scene.add(ambientLight);

// 태양처럼 특정 방향에서 평행하게 쏘는 조명
const directionalLight = new THREE.DirectionalLight("#ffffff", 5);
directionalLight.position.set(2, 4, 2);
scene.add(directionalLight);

// GLTFLoader - 모델 불러오기
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("/Textures/colormap.png");
texture.flipY = false; //텍스처 방향 문제 (이미지는 왼쭉 위 시작이지만 OpenGL은 왼쪽 아래가 시작점이어서)
texture.colorSpace = THREE.SRGBColorSpace; // 색상 밝기 문제

// 색상 먼저 불러내야함 (textLoader)
const loader = new GLTFLoader();
let model;

loader.load(
  // 어떤 파일 불러올 지
  "/ship-pirate-small.glb",
  (gltf) => {
    // 성공
    model = gltf.scene;
    model.scale.set(0.2, 0.2, 0.2); // 크기 조절
    model.position.set(0, -3, 0); // 위치 조정
    model.rotation.y = Math.PI / 2;
    // 모델에 색상 입히기
    model.traverse((child) => {
      // 여러 부품 꺼내서 확인
      if (child.isMesh) {
        //3d 물체인가
        child.material.map = texture; //색상 덮어씌우기
        child.material.needsUpdate = true; //다시 렌더링
      }
    });

    scene.add(model);

    gsap.to(model.position, {
      y: 0,
      duration: 2,
      ease: "power2.out",
    });

    // 스크롤하면 카메라 앞으로 이동
    gsap.to(camera.position, {
      z: 0.8, // 목표 z값 (얼마나 가까이 갈지)
      ease: "none", // 일정한 속도로
      scrollTrigger: {
        trigger: document.body, // 스크롤 감지할 요소
        start: "top top", // 페이지 맨 위에서 시작
        end: "bottom bottom", // 페이지 맨 아래에서 끝
        scrub: 1, // 스크롤에 따라 부드럽게 연동
      },
    });

    // 스크롤하면 모델 회전
    gsap.to(model.rotation, {
      y: Math.PI * 2, // 한 바퀴 회전
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
    });

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

function sailAway() {
  // 배 움직이는 효과 -> 옆으로 가게 하고 싶은데
  gsap.to(model.position, {
    x: 5,
    // z: -10,
    y: -0.5,
    duration: 2,
    ease: "power2.in", // 처음엔 느리다가 빠르게
  });

  // 동시에 카메라도 따라가기
  gsap.to(camera.position, {
    z: 0.5,
    duration: 2,
    ease: "power2.in",
  });

  // 배가 살짝 기울면서 가는 효과
  gsap.to(model.rotation, {
    x: -0.3,
    duration: 2,
    ease: "power2.in",
  });
}

// 매 프레임 실행되는 애니메이션 루프
function animate() {
  requestAnimationFrame(animate);

  // 마우스 위치로 모델 회전
  if (model) {
    // 0.3은 회전 강도 - 숫자 바꾸면 더 많이/적게 기울어짐
    model.rotation.y += (mouse.x * 0.3 - Math.PI / 2 - model.rotation.y) * 0.1; //좌우
    model.rotation.x += (mouse.y * 0.3 - model.rotation.x) * 0.1;
  }
  renderer.render(scene, camera); // 화면에 그린다
}

animate();
