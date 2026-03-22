import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// 여태껏 구현한걸 라이브러리 사용하기 (유지보수 쉽고, 개발속도 빠름)
import gsap from "gsap";

// Scene: 모든 게 올라가는 무대
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffd580);
scene.fog = new THREE.Fog(0xffd580, 15, 40);

// 바다 표현 - 평면 하나 추가
const seaGeometry = new THREE.PlaneGeometry(50, 50, 50, 50);
const seaMaterial = new THREE.MeshStandardMaterial({
  color: 0x0077be, // 바다색
  roughness: 0.3,
  metalness: 0.1,
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
const ambientLight = new THREE.AmbientLight("#ffecd2", 1.5);
scene.add(ambientLight);

// 태양처럼 특정 방향에서 평행하게 쏘는 조명
const directionalLight = new THREE.DirectionalLight("#f8b678", 3);
directionalLight.position.set(0, 20, 0.5);
scene.add(directionalLight);

// 반대편 보조 조명 추가
const fillLight = new THREE.DirectionalLight("#87ceeb", 1);
fillLight.position.set(-5, 2, -2);
scene.add(fillLight);

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
    model = gltf.scene;
    model.scale.set(0.2, 0.2, 0.2); // 크기 조절
    model.position.set(0, 0, 0); // 위치 조정
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

    // 배 흔들림 — 위아래로 천천히
    gsap.to(model.position, {
      y: 0.15,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1, // 무한 반복
    });

    // 배 기울기 — 좌우로 기울기
    gsap.to(model.rotation, {
      z: 0.05,
      duration: 2.5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  },
);

// 모래 바닥
loader.load("/patch-sand.glb", (gltf) => {
  const island = gltf.scene;
  island.scale.set(1.7, 1.7, 1.7);
  island.position.set(-18, -1.55, -20);
  island.traverse((child) => {
    if (child.isMesh) {
      child.material.map = texture;
      child.material.needsUpdate = true;
    }
  });
  scene.add(island);
});

// 야자수
loader.load("/palm-bend.glb", (gltf) => {
  const palm = gltf.scene;
  palm.scale.set(1, 1, 1);
  palm.position.set(-21, -1.3, -20); // 섬이랑 같은 위치
  palm.traverse((child) => {
    if (child.isMesh) {
      child.material.map = texture;
      child.material.needsUpdate = true;
    }
  });
  scene.add(palm);
});

// 창 크기 바뀔 때 대응
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let isSailing = false; //항해 중인지 상태
let positionX = 0; // 현재 x 위치

// 카메라 기준 화면 가로 끝 계산
function getScreenEdge() {
  const distance = camera.position.z;
  const vFov = (camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(vFov / 2) * distance;
  const width = height * camera.aspect;
  return width / 2; // 오른쪽 끝 x값
}

function sailAway() {
  if (isSailing) return; // 이미 항해 중이면 중복 실행 방지

  isSailing = true; // 항해 시작
  const edge = getScreenEdge();
  positionX += 1.5; // 클릭할 때마다 오른쪽으로 이동

  if (positionX >= edge) {
    // 화면 밖으로 나갔는지 체크
    gsap.to(model.position, {
      // 배 움직이기
      x: edge + 2,
      duration: 1,
      ease: "power2.in", // 처음엔 느리다가 빠르게
      onComplete: () => {
        positionX = -(edge - 0.5); // 왼쪽에서 대기
        gsap.set(model.position, { x: -(edge + 2) }); // 왼쪽에서 시작

        gsap.to(model.position, {
          x: positionX,
          duration: 1,
          ease: "power2.out",
          onComplete: () => {
            isSailing = false;
          },
        });
      },
    });
  } else {
    // 화면 안에서 조금씩 이동
    gsap.to(model.position, {
      x: positionX,
      duration: 0.8,
      ease: "power2.out",
      onComplete: () => {
        isSailing = false;
      },
    });
  }
}

// 매 프레임 실행되는 애니메이션 루프
function animate() {
  requestAnimationFrame(animate);

  // 물결 효과
  const time = Date.now() * 0.001; // 시간값 (초 단위)
  const position = seaGeometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    // 사인파로 각 꼭짓점 높이 계산
    const z =
      Math.sin(x * 0.5 + time) * 0.2 + Math.sin(y * 0.5 + time * 0.8) * 0.2;
    position.setZ(i, z);
  }
  position.needsUpdate = true;

  // 마우스 위치로 모델 회전
  if (model) {
    if (!isSailing) {
      // 회전
      model.rotation.y +=
        (mouse.x * 0.3 + Math.PI / 2 - model.rotation.y) * 0.05; // 좌우
      model.rotation.x += (mouse.y * 0.2 - model.rotation.x) * 0.05;
    }
  }
  renderer.render(scene, camera); // 화면에 그린다
}

animate();
