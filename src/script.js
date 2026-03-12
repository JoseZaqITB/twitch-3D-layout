import * as THREE from "three";
import { Brush, SUBTRACTION, Evaluator } from "three-bvh-csg";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { GLTFLoader } from "three/examples/jsm/Addons.js";
import portalVertex from "./shaders/portal/vertex.glsl";
import portalFragment from "./shaders/portal/fragment.glsl";

import { RapierPhysics } from "three/examples/jsm/Addons.js";

import gsap from "gsap";

/** vars */
let arista = 5;
let physics;
const objsToUpte = [];
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  ratio: window.innerHeight / window.innerWidth,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Scene
 *   */
const scene = new THREE.Scene();

/* models */
const gltfLoader = new GLTFLoader();

/** ---------- STUFF ----------- */
/** LIGHTS */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, -0.1, 1);
scene.add(directionalLight);

/** MATERIALS */
const portalLightMaterial = new THREE.ShaderMaterial({
  vertexShader: portalVertex,
  fragmentShader: portalFragment,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uColorStart: new THREE.Uniform(new THREE.Color("#bbbbff")),
    uColorEnd: new THREE.Uniform(new THREE.Color("#eeeeff")),
  },
  transparent: true,
});

/* MESH */

// portal
const portalGeometry = new THREE.CircleGeometry(0.5, 32);
const portal = new THREE.Mesh(portalGeometry, portalLightMaterial);

portal.scale.set(0.01, 0.01, 0.01);
portal.rotation.y = (Math.PI * 2) / 5;
portal.position.x = -2.25;
portal.position.y = -(5 * sizes.ratio) / 2 + 0.6;
// Cinema Room
const evaluator = new Evaluator();
const cinemaFill = new Brush(
  new THREE.BoxGeometry(arista, arista * sizes.ratio, arista),
);
const cinemaHole = new Brush(
  new THREE.BoxGeometry(
    arista * 0.98,
    arista * 0.95 * sizes.ratio,
    arista * 1.25,
  ),
);

const cinemaRoom = evaluator.evaluate(cinemaFill, cinemaHole, SUBTRACTION);
cinemaRoom.geometry.clearGroups();

cinemaRoom.material = new THREE.MeshStandardMaterial({
  color: 0xeeeefa,
  roughness: 0.7,
  metalness: 0,
});

cinemaRoom.userData.physics = { mass: 0 };

scene.add(cinemaRoom);

// cat
let cat = new THREE.Group();
gltfLoader.load("/models/cat.glb", (gltf) => {
  cat = gltf.scene.children[0];
});

/** RAPIER PHYSICS */
initPhysics();
/** BUTTONS */
const catButton = document.createElement("button");
catButton.style.width = "100px";
catButton.style.height = "16px";
catButton.style.position = "absolute";

catButton.onclick = handleClick;

document.body.appendChild(catButton);

/* --- FINISH STUFF */

/* CANVAS */
const canvas = document.querySelector("canvas.webgl");

/**
 * Camera
 */
// Base camera
const camera = new THREE.OrthographicCamera(
  -1,
  1,
  1 * sizes.ratio,
  -1 * sizes.ratio,
  0.01,
  1000,
);
camera.zoom = 0.4;
camera.position.z = 10;
camera.updateProjectionMatrix();
/* const camera = new THREE.PerspectiveCamera(
  50,
  sizes.width / sizes.height,
  0.1,
  100,
); */
scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
/* renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; */
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**  CONTROLS */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  // shaders
  portal.material.uniforms.uTime.value = elapsedTime;
  // update physics
  // controls
  controls.update();
  // render
  renderer.render(scene, camera);
  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

/** RAPIER PHYSICS */
async function initPhysics() {
  physics = await RapierPhysics();
  // add scene
  physics.addScene(scene);
  //createCat(cat.clone(), new THREE.Vector3(0, 0, 0));
}

function createCat(model, position) {
  const impulse = 5;

  model.position.copy(position);
  scene.add(model);
  // physics
  model.userData.physics = { mass: 1, restitution: 0 };
  if (physics) {
    physics.addMesh(model, 1, 0.5);
    physics.setMeshVelocity(model, new THREE.Vector3(impulse, 0, 0));

    //console.log(physics.world.bodies.map);
  }
}

function createPortal(portalDuration) {
  scene.add(portal);

  gsap.to(portal.scale, { duration: 1, x: 1 });
  gsap.to(portal.scale, { duration: 1, y: 1 });
  gsap.to(portal.scale, { duration: 1, z: 1 });

  gsap.to(portal.scale, {
    duration: 1,
    delay: portalDuration / 1000 - 1,
    x: 0.01,
  });
  gsap.to(portal.scale, {
    duration: 1,
    delay: portalDuration / 1000 - 1,
    y: 0.01,
  });
  gsap.to(portal.scale, {
    duration: 1,
    delay: portalDuration / 1000 - 1,
    z: 0.01,
  });
  // set timeout
  setTimeout(() => {
    scene.remove(portal);
  }, portalDuration);
}

function handleClick() {
  // portal
  const portalDuration = 5000;
  createPortal(portalDuration);
  // cat
  setTimeout(() => createCat(cat.clone(), portal.position), portalDuration / 2);
}

/* RUN */
tick();
