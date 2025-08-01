let scene, camera, renderer, controls;
let bullets = [];
let enemies = [];
let score = 0;
let health = 100;
const enemyCount = 10;
const keys = {};
let gameOver = false;

init();
animate();

// ========== INITIALIZE ==========
function init() {
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.y = 2;

  // Lights
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 3, 2);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Pointer Lock
  controls = new THREE.PointerLockControls(camera, renderer.domElement);
  document.addEventListener("click", () => { if (!gameOver) controls.lock(); });

  // Input
  document.addEventListener("keydown", (e) => (keys[e.code] = true));
  document.addEventListener("keyup", (e) => (keys[e.code] = false));

  // Shooting
  document.addEventListener("mousedown", shoot);

  // Reset button
  document.getElementById("resetBtn").addEventListener("click", resetGame);

  // Enemies
  spawnEnemies();
}

// ========== ENEMY SPAWN ==========
function spawnEnemies() {
  enemies.forEach(e => scene.remove(e));
  enemies = [];
  for (let i = 0; i < enemyCount; i++) {
    const enemy = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    enemy.position.set(Math.random() * 100 - 50, 1, Math.random() * 100 - 50);
    scene.add(enemy);
    enemies.push(enemy);
  }
}

// ========== RESET GAME ==========
function resetGame() {
  bullets.forEach(b => scene.remove(b));
  bullets = [];
  score = 0;
  health = 100;
  gameOver = false;
  document.getElementById("scoreboard").innerText = `Score: ${score}`;
  document.getElementById("health").innerText = `Health: ${health}`;
  document.getElementById("gameOver").style.display = "none";
  document.getElementById("youWin").style.display = "none";
  spawnEnemies();
}

// ========== MOVEMENT ==========
function movePlayer() {
  const moveSpeed = 0.15;
  const moveX = (keys["KeyD"] ? 1 : 0) - (keys["KeyA"] ? 1 : 0);
  const moveZ = (keys["KeyS"] ? 1 : 0) - (keys["KeyW"] ? 1 : 0);
  if (moveZ !== 0) controls.moveForward(-moveZ * moveSpeed);
  if (moveX !== 0) controls.moveRight(-moveX * moveSpeed);
}

// ========== SHOOT ==========
function shoot() {
  if (!controls.isLocked || gameOver) return;
  const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
  bullet.position.copy(camera.position);
  bullet.quaternion.copy(camera.quaternion);
  bullet.userData.velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).multiplyScalar(0.7);
  bullets.push(bullet);
  scene.add(bullet);
}

// ========== UPDATE ==========
function update() {
  if (controls.isLocked && !gameOver) {
    movePlayer();
  }

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].position.add(bullets[i].userData.velocity);
    if (Math.abs(bullets[i].position.x) > 200 || Math.abs(bullets[i].position.z) > 200) {
      scene.remove(bullets[i]);
      bullets.splice(i, 1);
      continue;
    }

    enemies.forEach((enemy, index) => {
      if (bullets[i] && bullets[i].position.distanceTo(enemy.position) < 1) {
        scene.remove(enemy);
        enemies.splice(index, 1);
        scene.remove(bullets[i]);
        bullets.splice(i, 1);
        score += 10;
        document.getElementById("scoreboard").innerText = `Score: ${score}`;

        // YOU WIN CHECK
        if (enemies.length === 0 && !gameOver) {
          document.getElementById("youWin").style.display = "block";
          gameOver = true;
        }
      }
    });
  }

  // Enemy AI
  enemies.forEach((enemy) => {
    const dir = new THREE.Vector3().subVectors(camera.position, enemy.position).normalize();
    enemy.position.add(dir.multiplyScalar(0.02));

    if (enemy.position.distanceTo(camera.position) < 1.5 && !gameOver) {
      health -= 0.1;
      document.getElementById("health").innerText = `Health: ${Math.max(0, Math.floor(health))}`;
      if (health <= 0) endGame();
    }
  });
}

// ========== GAME OVER ==========
function endGame() {
  gameOver = true;
  document.getElementById("gameOver").style.display = "block";
}

// ========== MAIN LOOP ==========
function animate() {
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}

// ========== RESIZE ==========
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
