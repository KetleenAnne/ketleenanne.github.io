import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
  initRenderer,
  initCamera,
  createGroundPlaneWired,
  onWindowResize,
  initDefaultBasicLight,
  getMaxSize
} from "../libs/util/util.js";
import { Buttons } from "../libs/other/buttons.js";
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';

//Manager
let assetManager = {
  // Properties ---------------------------------
  aviao: null,
  hbAviao: new THREE.Box3(),
}

// Add buttons
var buttons = new Buttons(onButtonDown, onButtonUp);
var pressedA = false;        
var pressedB = false;
 
// vars
let tiros = [];
let tirosHB = [];
let audioPath;
let posicaoAviao = new THREE.Vector3(0, 20, 0);
let scale = 5;
let previousScale = 0;
let size = 5;
let fwdValue = 0;
let bkdValue = 0;
let rgtValue = 0;
let lftValue = 0;
let tempVector = new THREE.Vector3();
let upVector = new THREE.Vector3(0, 1, 0);
let isMuted = false;

// Create a renderer and add it to the DOM.
var scene = new THREE.Scene();
var renderer = initRenderer();
renderer.setClearColor(0xbfd1e5);
var camera = initCamera(new THREE.Vector3(0, 30, 60));
var light = initDefaultBasicLight(scene, true, new THREE.Vector3(80, 80, 20), 400, 1024, 0.1, 300);
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

let audioLoader;
// Add OrbitControls so that we can pan around with the mouse.
var controls = new OrbitControls(camera, renderer.domElement);
//Listener
var listener = new THREE.AudioListener();
camera.add(listener);
// Add grid
var groundPlane = createGroundPlaneWired(200, 200, 40, 40, 2, "dimgray", "gainsboro"); // width and height
scene.add(groundPlane);

//Criando aviao
loadGLBFile('./objeto/', 'aviao', true, 13.0);


//criando mira
const tamanhoPequeno = 1.5;
const smallSquareGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-tamanhoPequeno, tamanhoPequeno, 0),
    new THREE.Vector3(tamanhoPequeno, tamanhoPequeno, 0),
    new THREE.Vector3(tamanhoPequeno, -tamanhoPequeno, 0),
    new THREE.Vector3(-tamanhoPequeno, -tamanhoPequeno, 0),
    new THREE.Vector3(-tamanhoPequeno, tamanhoPequeno, 0) // Fechar o loop
]);
const linhaInterna1 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-tamanhoPequeno, tamanhoPequeno, 0),
    new THREE.Vector3(-tamanhoPequeno / 2, tamanhoPequeno / 2, 0)
]);
const linhaInterna2 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(tamanhoPequeno, tamanhoPequeno, 0),
    new THREE.Vector3(tamanhoPequeno / 2, tamanhoPequeno / 2, 0)
]);
const linhaInterna3 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(tamanhoPequeno, -tamanhoPequeno, 0),
    new THREE.Vector3(tamanhoPequeno / 2, -tamanhoPequeno / 2, 0)
]);
const linhaInterna4 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-tamanhoPequeno, -tamanhoPequeno, 0),
    new THREE.Vector3(-tamanhoPequeno / 2, -tamanhoPequeno / 2, 0)
]);

const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });

const linhaverticeinterno1 = new THREE.Line(linhaInterna1, material);
const linhaverticeinterno2 = new THREE.Line(linhaInterna2, material);
const linhaverticeinterno3 = new THREE.Line(linhaInterna3, material);
const linhaverticeinterno4 = new THREE.Line(linhaInterna4, material);
const smallSquare = new THREE.Line(smallSquareGeometry, material);

smallSquare.add(linhaverticeinterno1);
smallSquare.add(linhaverticeinterno2);
smallSquare.add(linhaverticeinterno3);
smallSquare.add(linhaverticeinterno4);
smallSquare.position.set(0, 30, 0);
smallSquare.name = 'smallSquare';
smallSquare.move = true;
scene.add(smallSquare);

// Create ambient sound
// create a global audio source
const tiroSound = new THREE.Audio( listener );  
var audio = new THREE.AudioLoader();
audio.load('./sounds/tiroaviao.mp3', function (buffer) {
  tiroSound.setBuffer(buffer);
    tiroSound.setLoop(false);
    tiroSound.setVolume(0.1);
    //sound.play(); // Will play when start button is pressed
});
// Create ambient sound
const som = new THREE.Audio( listener );  
var audio = new THREE.AudioLoader();
audio.load('./sounds/ambiente.mp3', function (buffer) {
    som.setBuffer(buffer);
    som.setLoop(true);
    som.setVolume(0.1);
    som.play(); // Will play when start button is pressed
});

// Add joysticks to the scene
addJoysticks();
render();


// Renders the scene
function render() {
  updatePlayer();
  controls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera);
  executeIfKeyPressed();

}

function updatePlayer() {
  // move the player
  const angle = controls.getAzimuthalAngle()
  if (assetManager.aviao) {
    if (fwdValue > 0) {
      tempVector
        .set(0, 0, -fwdValue)
        .applyAxisAngle(upVector, angle)
      assetManager.aviao.position.addScaledVector(
        tempVector,
        1
      )
    }

    if (bkdValue > 0) {
      tempVector
        .set(0, 0, bkdValue)
        .applyAxisAngle(upVector, angle)
      assetManager.aviao.position.addScaledVector(
        tempVector,
        1
      )
    }

    if (lftValue > 0) {
      tempVector
        .set(-lftValue, 0, 0)
        .applyAxisAngle(upVector, angle)
      assetManager.aviao.position.addScaledVector(
        tempVector,
        1
      )
    }

    if (rgtValue > 0) {
      tempVector
        .set(rgtValue, 0, 0)
        .applyAxisAngle(upVector, angle)
      assetManager.aviao.position.addScaledVector(
        tempVector,
        1
      )
    }

    assetManager.aviao.updateMatrixWorld();

    assetManager.aviao.scale.set(scale, scale, scale);
    assetManager.aviao.position.y = 5 * scale / 2.0;
  }
  // reposition camera
  camera.position.sub(controls.target)
  if (assetManager.aviao) {
    controls.target.copy(assetManager.aviao.position)
    camera.position.add(assetManager.aviao.position)
  }
};

function addJoysticks() {

  // Details in the link bellow:
  // https://yoannmoi.net/nipplejs/

  let joystickL = nipplejs.create({
    zone: document.getElementById('joystickWrapper1'),
    mode: 'static',
    position: { top: '-80px', left: '80px' }
  });

  joystickL.on('move', function (evt, data) {
    const forward = data.vector.y
    const turn = data.vector.x
    fwdValue = bkdValue = lftValue = rgtValue = 0;

    if (forward > 0)
      fwdValue = Math.abs(forward)
    else if (forward < 0)
      bkdValue = Math.abs(forward)

    if (turn > 0)
      rgtValue = Math.abs(turn)
    else if (turn < 0)
      lftValue = Math.abs(turn)
  })

  joystickL.on('end', function (evt) {
    bkdValue = 0
    fwdValue = 0
    lftValue = 0
    rgtValue = 0
  })

  let joystickR = nipplejs.create({
    zone: document.getElementById('joystickWrapper2'),
    mode: 'static',
    lockY: true, // only move on the Y axis
    position: { top: '-80px', right: '80px' },
  });

  joystickR.on('move', function (evt, data) {
    const changeScale = data.vector.y;

    if (changeScale > previousScale) scale += 0.1;
    if (changeScale < previousScale) scale -= 0.1;
    if (scale > 4.0) scale = 4.0;
    if (scale < 0.5) scale = 0.5;

    previousScale = changeScale;
  })
}
function onButtonDown(event) {
  switch (event.target.id) {
    case "A":
      pressedA = true;
     break;
     case "B":
      pressedB = true;
      break;
    case "full":
      buttons.setFullScreen();
      break;
  }
}
function onButtonUp(event) {
  pressedA = pressedB = false;
}
function loadGLBFile(modelPath, modelName, visibility, desiredScale) {
  var loader = new GLTFLoader();
  loader.load(modelPath + modelName + '.glb', function (gltf) {
    obj = gltf.scene;
    obj.name = modelName;
    obj.visible = visibility;
    obj.traverse(function (child) {
      if (child) {
        child.castShadow = true;
      }
    });
    obj.traverse(function (node) {
      if (node.material) node.material.side = THREE.DoubleSide;
    });

    var obj = normalizeAndRescale(obj, desiredScale);
    var obj = fixPosition(obj);
    obj.updateMatrixWorld(true);
    if (obj.name == 'aviao') {
      // obj.rotateY(3.13);
      obj.position.copy(posicaoAviao);
      obj.layers.set(1);
      assetManager.hbAviao.setFromObject(obj);
    }
    if (obj.name == 'torreta') {
      obj.rotateY(1.57);
      obj.userData.collidable = true;
      obj.position.set(THREE.MathUtils.randFloat(-45, 45), 1.5, THREE.MathUtils.randFloat(-500, 45))
      assetManager.hbTorreta = new THREE.Box3().setFromObject(obj);
      torretas.push(obj);
      hbtorretas.push(new THREE.Box3().setFromObject(obj));
      obj.receiveShadow = true;
    }

    obj.castShadow = true;
    assetManager[modelName] = obj;
    scene.add(obj);
  });
}
function normalizeAndRescale(obj, newScale) {
  var scale = getMaxSize(obj);
  obj.scale.set(newScale * (1.0 / scale),
    newScale * (1.0 / scale),
    newScale * (1.0 / scale));
  return obj;
}

function fixPosition(obj) {
  // Fix position of the object over the ground plane
  var box = new THREE.Box3().setFromObject(obj);
  if (box.min.y > 0)
    obj.translateY(-box.min.y);
  else
    obj.translateY(-1 * box.min.y);
  return obj;
}
function executeIfKeyPressed()
{
  if(pressedA)
  {
    let tiro = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 4), new THREE.MeshPhongMaterial({ color: 'blue' }));
    tiro.castShadow = true;
    tiro.receiveShadow = true;

    let pos = new THREE.Vector3();
    assetManager.aviao.getWorldPosition(pos);
    tiro.position.copy(pos);

    tiro.lookAt(smallSquare.position);
    scene.add(tiro);
    tiros.push(tiro);
    let tiroHB = new THREE.Box3().setFromObject(tiro);
    tirosHB.push(tiroHB);

    tiro.userData = {};
    tiro.userData.initialPosition = new THREE.Vector3().copy(tiro.position);
    if(isMuted){
      tiroSound.play();
    }   
  }
  if(pressedB)
  {
    unMuted(); 
  }
}
function unMuted() {
  isMuted = !isMuted;
  // Lógica para mutar/desmutar os sons
  if (isMuted) {
      som.pause();
      tiroSound.pause();
    } else {
      som.play();
  }
}