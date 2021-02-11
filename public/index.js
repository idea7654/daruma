import * as THREE from "https://unpkg.com/three/build/three.module.js";
import { ColladaLoader } from "https://threejs.org/examples/jsm/loaders/ColladaLoader.js";
let renderer = null;
let scene = null;
let camera = null;
let model = null;
let controller = null;
let gameStart = false;
let count = 0;
let countFlag = false;
let reverseHead = true;
let reverseFlag = false;
let playerVector = null;
let moveVector = null;
let moveSpeed = 7;
let turnFlag = true;
let gameCount = 0;
let goalFlag = false;
let currentTime = [
  { time: 1500, voice: "1s.mp3" },
  { time: 2000, voice: "1.5s.mp3" },
  { time: 2500, voice: "2s.mp3" },
  { time: 3000, voice: "2.5s.mp3" },
  { time: 3500, voice: "3s.mp3" },
];
let playTime = null;
let intervalFlag = true;
let gameEnd = false;
let voiceFlag = true;
let successTime;
const initScene = (gl, session) => {
  //-- scene, camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  //---
  //--- igloo model
  const loader = new ColladaLoader();
  loader.load("model.dae", (collada) => {
    const box = new THREE.Box3().setFromObject(collada.scene);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    collada.scene.children[0].children[1].remove(
      collada.scene.children[0].children[1].children[1]
    );
    collada.scene.children[0].children[1].remove(
      collada.scene.children[0].children[1].children[2]
    );
    collada.scene.position.set(-c.x, size.y / 2 - c.y, -c.z);
    model = new THREE.Object3D();
    model.add(collada.scene);
  });
  //---

  //--- light
  const light = new THREE.PointLight(0xffffff, 2, 100); // soft white light
  light.position.z = 1;
  light.position.y = 5;
  scene.add(light);
  //---
  // create and configure three.js renderer with XR support
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    autoClear: true,
    context: gl,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  renderer.xr.setSession(session);
  document.body.appendChild(renderer.domElement);
  //---

  controller = renderer.xr.getController(0);
  controller.addEventListener("select", placeObject);
  scene.add(controller);
};

// button to start XR experience
const xrButton = document.getElementById("xr-button");
// to display debug information
const info = document.getElementById("info");
// to control the xr session
let xrSession = null;
// reference space used within an application https://developer.mozilla.org/en-US/docs/Web/API/XRSession/requestReferenceSpace
let xrRefSpace = null;
// for hit testing with detected surfaces
let xrHitTestSource = null;

// Canvas OpenGL context used for rendering
let gl = null;

function checkXR() {
  if (!window.isSecureContext) {
    document.getElementById("warn").innerText =
      "WebXR unavailable. Please use secure context";
  }
  if (navigator.xr) {
    navigator.xr.addEventListener("devicechange", checkSupportedState);
    checkSupportedState();
  } else {
    document.getElementById("warn").innerText =
      "WebXR unavailable for this browser";
  }
}

function checkSupportedState() {
  navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
    if (supported) {
      xrButton.innerHTML = "Enter AR";
      xrButton.addEventListener("click", onButtonClicked);
    } else {
      xrButton.innerHTML = "AR not found";
    }
    xrButton.disabled = !supported;
  });
}

function onButtonClicked() {
  xrButton.style.visibility = "hidden";
  if (!xrSession) {
    navigator.xr
      .requestSession("immersive-ar", {
        optionalFeatures: ["dom-overlay"],
        requiredFeatures: ["local", "hit-test"],
        domOverlay: {
          root: document.body,
        },
      })
      .then(onSessionStarted, onRequestSessionError);
  } else {
    xrSession.end();
  }
}

function onSessionStarted(session) {
  document.getElementById("gameInfo").style.visibility = "hidden";
  xrSession = session;
  xrButton.innerHTML = "Exit AR";
  // Show which type of DOM Overlay got enabled (if any)
  if (session.domOverlayState) {
    info.innerHTML = "DOM Overlay type: " + session.domOverlayState.type;
    document.getElementById("warn").innerHTML = "클릭해서 술래를 설치해주세요!";
  }

  // create a canvas element and WebGL context for rendering
  session.addEventListener("end", onSessionEnded);
  let canvas = document.createElement("canvas");
  gl = canvas.getContext("webgl", {
    xrCompatible: true,
  });
  session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gl),
  });

  // here we ask for viewer reference space, since we will be casting a ray
  // from a viewer towards a detected surface. The results of ray and surface intersection
  // will be obtained via xrHitTestSource variable

  session.requestReferenceSpace("local").then((refSpace) => {
    xrRefSpace = refSpace;
    session.requestAnimationFrame(onXRFrame);
  });

  //document.getElementById("overlay").addEventListener("click", placeObject);

  // initialize three.js scene
  initScene(gl, session);
}

function placeObject() {
  if (model && controller) {
    model.position.set(0, 0, -7).applyMatrix4(controller.matrixWorld);
    model.quaternion.setFromRotationMatrix(controller.matrixWorld);
    scene.add(model);
    document.getElementById("warn").innerHTML = "";
    document.getElementById("gamestart").innerHTML = "게임 시작!!";
    document.getElementById("gamestart").addEventListener("click", startFunc);
    document.getElementById("gamestart").style.visibility = "visible";
    controller.removeEventListener("select", placeObject);
  }
}

function onRequestSessionError(ex) {
  info.innerHTML = "Failed to start AR session.";
  console.error(ex.message);
}

function onSessionEnded(event) {
  xrSession = null;
  xrButton.innerHTML = "Enter AR";
  info.innerHTML = "";
  gl = null;
}

function startFunc() {
  document.getElementById("gamestart").innerHTML = "";
  document.getElementById("gamestart").removeEventListener("click", startFunc);
  gameStart = true;
  document.getElementById("gamestart").style.visibility = "hidden";
}

// Utility function to update animated objects
function updateAnimation() {
  if (!gameStart && !gameEnd) {
    gameCount = Date.now();
    if (count < 50 && !countFlag) {
      if (count > 0) {
        model.rotateZ((-count * Math.PI) / 180 / 100);
      } else {
        model.rotateZ((count * Math.PI) / 180 / 100);
      }
      count++;
    }
    if (count === 50 || count === -50) {
      countFlag = !countFlag;
    }
    if (count >= -50 && countFlag) {
      if (count > 0) {
        model.rotateZ((count * Math.PI) / 180 / 100);
      } else {
        model.rotateZ((-count * Math.PI) / 180 / 100);
      }
      count--;
    }
  }
  if (gameStart && !gameEnd) {
    successTime = 0;
    if (!goalFlag) {
      successTime = Date.now() - gameCount;
    }
    model.rotation.z = 0;
    if (turnFlag) {
      playTime = currentTime.sort(() => {
        return Math.random() - Math.random();
      })[0];
      moveSpeed = Math.ceil(Math.random() * 5) + 5;
      turnFlag = false;
    }

    if (reverseHead) {
      if (model.rotation.y < Math.PI) {
        model.rotation.y += Math.PI / moveSpeed; //20 -> 초값.
      } else {
        model.rotation.y = Math.PI;
        if (voiceFlag) {
          const audio = new Audio(playTime.voice);
          audio.play();
          voiceFlag = false;
        }
      }
      if (playerVector) {
        if (playerVector.distanceTo(model.position) < 5) {
          //터치할 수 있는 로직
          xrSession.end();
          document.getElementById("gameOver").innerHTML = `걸린시간 : ${
            successTime / 1000
          }초`;
          document.getElementById("submitServe").style.visibility = "visible";
          document.getElementById("gameOver").style.visibility = "visible";
          goalFlag = true;
        }
      }

      if (intervalFlag) {
        setTimeout(function () {
          reverseHead = false;
          intervalFlag = true;
          voiceFlag = true;
        }, playTime.time);
        intervalFlag = false;
      }
    } else {
      if (model.rotation.y > 0) {
        model.rotation.y -= Math.PI / moveSpeed;
      } else {
        model.rotation.y = 0;
      }
      if (model.rotation.y < 0.1) {
        if (!reverseFlag && playerVector) {
          moveVector = playerVector;
          reverseFlag = true;
        }
        if (playerVector && moveVector) {
          const playermove = playerVector.distanceTo(moveVector);
          if (playermove > 0.1) {
            gameEnd = true;
          }
        }
        //움직이면 죽는 로직
      }
      if (intervalFlag) {
        setTimeout(function () {
          reverseHead = true;
          moveVector = null;
          reverseFlag = false;
          if (!turnFlag) {
            turnFlag = true;
          }
          intervalFlag = true;
        }, playTime.time); // 3000 -> 초값 랜덤.
        intervalFlag = false;
      }
    }
  }
  if (gameEnd) {
    model.rotation.x = 0;
    model.rotation.z = 0;
    model.rotation.y = 0;
    model.position.set(
      playerVector.x,
      playerVector.y - 1,
      playerVector.z - 1.5
    );
    setTimeout(function () {
      xrSession.end();
      document.getElementById("gameOver").style.visibility = "visible";
    }, 1000);
  }
}

function onXRFrame(t, frame) {
  let session = frame.session;
  let xrViewerPose = frame.getViewerPose(xrRefSpace);
  if (xrViewerPose) {
    const viewPos = xrViewerPose.views[0].transform.position;
    playerVector = new THREE.Vector3(viewPos.x, viewPos.y, viewPos.z);
  }
  session.requestAnimationFrame(onXRFrame);
  // update object animation
  updateAnimation();
  // bind our gl context that was created with WebXR to threejs renderer
  gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer);
  // render the scene
  renderer.render(scene, camera);
}

checkXR();

document.getElementById("ranking").addEventListener("click", rankingFunc);
document.getElementById("exit").addEventListener("click", exitFunc);
document.getElementById("btServer").addEventListener("click", submitFunc);
function rankingFunc() {
  document.getElementById("rankingInfo").style.visibility = "visible";
  axios.get("https://mwgame.site/api/ranking").then((res) => {
    const rankList = document.getElementById("rankList");
    for (let i in res.data) {
      rankList.append(`${res.data[i].nick}: ${res.data[i].time}`);
    }
  });
}

function exitFunc() {
  document.getElementById("rankingInfo").style.visibility = "hidden";
}

function submitFunc() {
  const nick = document.getElementById("submitInput").value;
  let body = {
    nick: nick,
    time: successTime / 1000,
  };
  axios.post("https://mwgame.site/api/ranking", body).then((res) => {
    console.log(res);
  });
}
