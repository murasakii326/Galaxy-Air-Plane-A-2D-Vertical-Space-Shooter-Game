const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const hud = document.getElementById('hud');
const scoreVal = document.getElementById('score-val');
const livesVal = document.getElementById('lives-val');
const finalScoreVal = document.getElementById('final-score-val');
const explosionContainer = document.getElementById('explosion-container');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Assets
const assets = {
    images: {},
    audio: {}
};

let assetsLoaded = 0;
const totalAssets = 8; // 6 images, 2 audio

function loadAssets(callback) {
    const imagesToLoad = {
        player: 'me.png',
        enemy1: 'enemy1.png', // Type A
        enemy2: 'enemy2.png', // Type B
        enemy3: 'enemy3.png', // Boss 1
        enemy4: 'enemy4.png'  // Boss 2
    };

    const audioToLoad = {
        shoot: '미사일 소리.mp3',
        explode: '폭파하는 소리.mp3'
    };

    function checkLoad() {
        assetsLoaded++;
        if (assetsLoaded === totalAssets) {
            callback();
        }
    }

    for (let key in imagesToLoad) {
        let img = new Image();
        img.src = imagesToLoad[key];
        img.onload = checkLoad;
        assets.images[key] = img;
    }

    // Explosion gif is just the URL we will set as src
    assets.images.bomb = 'bomb.gif';
    checkLoad(); // pseudo-load for bomb

    for (let key in audioToLoad) {
        let aud = new Audio();
        aud.src = audioToLoad[key];
        aud.oncanplaythrough = () => {
            // Prevent multiple triggers
            if (!aud.loaded) {
                aud.loaded = true;
                checkLoad();
            }
        };
        // fallback in case oncanplaythrough doesn't fire fast enough
        setTimeout(() => {
            if (!aud.loaded) {
                aud.loaded = true;
                checkLoad();
            }
        }, 1000);
        assets.audio[key] = aud;
    }
}

// Play Audio Helper
function playSound(name) {
    if (assets.audio[name]) {
        // clone to allow multiple overlapping sounds
        const sound = assets.audio[name].cloneNode();
        sound.volume = 0.5;
        sound.play().catch(e => console.log('Audio play error:', e));
    }
}

// Display explosion gif overlay
function spawnExplosion(x, y) {
    const img = document.createElement('img');
    img.src = assets.images.bomb + '?t=' + Date.now(); // cache buster to restart gif
    img.className = 'explosion-gif';
    img.style.left = x + 'px';
    img.style.top = y + 'px';
    explosionContainer.appendChild(img);

    setTimeout(() => {
        if (img.parentNode) {
            img.parentNode.removeChild(img);
        }
    }, 500); // 0.5 seconds as per PRD
}

// Game State Variables
let state = 'start'; // start, playing, gameover
let score = 0;
let lives = 3;
let lastTime = 0;

let player;
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let stars = [];

// Input Handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

let isMouseDown = false;
let mouseX = 0;

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') keys.ArrowRight = true;
    if (e.code === 'Space') {
        if (!keys.Space && state === 'playing') {
            player.shoot();
        }
        keys.Space = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') keys.ArrowRight = false;
    if (e.code === 'Space') keys.Space = false;
});

// Mobile/Mouse support
canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    updateMousePos(e);
});
canvas.addEventListener('mousemove', (e) => {
    if (isMouseDown) updateMousePos(e);
});
canvas.addEventListener('mouseup', () => isMouseDown = false);
canvas.addEventListener('mouseleave', () => isMouseDown = false);

canvas.addEventListener('touchstart', (e) => {
    isMouseDown = true;
    updateTouchPos(e);
});
canvas.addEventListener('touchmove', (e) => {
    if (isMouseDown) updateTouchPos(e);
});
canvas.addEventListener('touchend', () => isMouseDown = false);

function updateMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    if (state === 'playing') player.targetX = mouseX;
}
function updateTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
    if (state === 'playing') player.targetX = mouseX;
}

// Classes
class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speed = Math.random() * 2 + 1;
        this.size = Math.random() * 2;
    }
    update(dt) {
        this.y += this.speed * dt * 60;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }
    draw(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class Player {
    constructor() {
        this.width = 64;
        this.height = 64;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height; // Set to bottom of the screen
        this.speed = 300; // pixels per sec
        this.lastShot = 0;
        this.shootDelay = 0.2; // sec
        this.targetX = null;
        this.invulnerable = 0;
    }

    update(dt) {
        if (keys.ArrowLeft) this.x -= this.speed * dt;
        if (keys.ArrowRight) this.x += this.speed * dt;

        if (this.targetX !== null) {
            const centerX = this.x + this.width/2;
            if (Math.abs(this.targetX - centerX) > 5) {
                if (this.targetX < centerX) this.x -= this.speed * dt;
                else this.x += this.speed * dt;
            }
        }

        // Auto shoot if mouse down
        if (isMouseDown) {
            this.shoot();
        }

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        this.lastShot += dt;
        if (this.invulnerable > 0) this.invulnerable -= dt;
    }

    draw(ctx) {
        if (this.invulnerable > 0 && Math.floor(this.invulnerable * 10) % 2 === 0) {
            return; // flicker effect
        }
        if (assets.images.player) {
            ctx.drawImage(assets.images.player, this.x, this.y, this.width, this.height);
        }
    }

    shoot() {
        if (this.lastShot >= this.shootDelay) {
            playerBullets.push(new Bullet(this.x + this.width / 2 - 4, this.y, -500, true));
            playSound('shoot');
            this.lastShot = 0;
        }
    }

    hit() {
        if (this.invulnerable > 0) return;
        lives--;
        playSound('explode');
        spawnExplosion(this.x + this.width/2, this.y + this.height/2);
        
        if (lives <= 0) {
            gameOver();
        } else {
            this.invulnerable = 2; // 2 seconds invulnerability
        }
    }
}

class Bullet {
    constructor(x, y, speed, isPlayer) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 20;
        this.speed = speed;
        this.isPlayer = isPlayer;
        this.active = true;
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y < -this.height || this.y > canvas.height) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.isPlayer ? '#0ff' : '#f00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.active = true;
        this.time = Math.random() * Math.PI * 2;
        this.startX = x;
        
        // Randomly assign one of the 4 images
        const randomImgKey = 'enemy' + (Math.floor(Math.random() * 4) + 1);
        this.img = assets.images[randomImgKey];

        if (type === 'A') {
            this.hp = 1;
            this.score = 100;
            this.shootRate = 2 + Math.random() * 2;
            this.speedY = 30 + Math.random() * 20;
            this.amplitude = 50;
        } else if (type === 'B') {
            this.hp = 2;
            this.score = 300;
            this.shootRate = 1.5 + Math.random() * 1.5;
            this.speedY = 40 + Math.random() * 20;
            this.amplitude = 100;
        } else { // Boss
            this.hp = 20;
            this.score = 5000;
            this.shootRate = 0.5 + Math.random() * 0.5;
            this.speedY = 10;
            this.amplitude = 200;
            this.width = 128;
            this.height = 128;
        }
        
        this.shootTimer = this.shootRate;
    }

    update(dt) {
        this.y += this.speedY * dt;
        this.time += dt * 2;
        this.x = this.startX + Math.sin(this.time) * this.amplitude;

        // Wrap around X
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;

        // Despawn if off screen bottom
        if (this.y > canvas.height) {
            this.active = false;
        }

        // Shooting
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = this.shootRate;
        }
    }

    draw(ctx) {
        if (this.img) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#f00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    shoot() {
        // Aim at player slightly
        enemyBullets.push(new Bullet(this.x + this.width / 2 - 4, this.y + this.height, 300, false));
    }

    hit() {
        this.hp--;
        if (this.hp <= 0) {
            this.active = false;
            score += this.score;
            playSound('explode');
            spawnExplosion(this.x + this.width/2, this.y + this.height/2);
        }
    }
}

// Spawner
let waveTimer = 0;
let bossSpawned = false;

function spawnEnemies(dt) {
    waveTimer -= dt;
    if (waveTimer <= 0) {
        // Spawn a wave
        let type = Math.random() > 0.3 ? 'A' : 'B';
        let count = Math.floor(Math.random() * 3) + 2;
        
        // Spawn boss if score > 5000 and not spawned recently
        if (score > 5000 && !bossSpawned && Math.random() > 0.8) {
            type = 'Boss';
            count = 1;
            bossSpawned = true;
            setTimeout(() => bossSpawned = false, 20000); // Allow another boss after 20s
        }

        let spacing = canvas.width / (count + 1);
        for (let i = 0; i < count; i++) {
            enemies.push(new Enemy(type, spacing * (i + 1) - 32, -64));
        }

        waveTimer = 3 + Math.random() * 2;
    }
}

// Collision Detection
function checkCollisions() {
    // Player bullets vs Enemies
    playerBullets.forEach(pb => {
        if (!pb.active) return;
        enemies.forEach(enemy => {
            if (!enemy.active) return;
            if (isColliding(pb, enemy)) {
                pb.active = false;
                enemy.hit();
            }
        });
    });

    // Enemy bullets vs Player
    enemyBullets.forEach(eb => {
        if (!eb.active) return;
        if (isColliding(eb, player)) {
            eb.active = false;
            player.hit();
        }
    });

    // Player vs Enemies
    enemies.forEach(enemy => {
        if (!enemy.active) return;
        if (isColliding(enemy, player)) {
            enemy.hit();
            player.hit();
        }
    });
}

function isColliding(a, b) {
    // simple AABB
    let shrink = 10; // hitbox shrink
    return (
        a.x < b.x + b.width - shrink &&
        a.x + a.width > b.x + shrink &&
        a.y < b.y + b.height - shrink &&
        a.y + a.height > b.y + shrink
    );
}

// Game Loop
function init() {
    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }
}

function startGame() {
    state = 'playing';
    score = 0;
    lives = 3;
    player = new Player();
    enemies = [];
    playerBullets = [];
    enemyBullets = [];
    waveTimer = 1;
    bossSpawned = false;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    
    lastTime = performance.now();
    requestAnimationFrame(update);
}

function gameOver() {
    state = 'gameover';
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScoreVal.innerText = score;
}

function update(time) {
    if (state !== 'playing') return;

    let dt = (time - lastTime) / 1000;
    lastTime = time;
    if (dt > 0.1) dt = 0.1; // cap dt

    // Update
    stars.forEach(s => s.update(dt));
    player.update(dt);
    
    spawnEnemies(dt);

    enemies.forEach(e => e.update(dt));
    playerBullets.forEach(b => b.update(dt));
    enemyBullets.forEach(b => b.update(dt));

    checkCollisions();

    // Cleanup
    enemies = enemies.filter(e => e.active);
    playerBullets = playerBullets.filter(b => b.active);
    enemyBullets = enemyBullets.filter(b => b.active);

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(s => s.draw(ctx));
    player.draw(ctx);
    enemies.forEach(e => e.draw(ctx));
    playerBullets.forEach(b => b.draw(ctx));
    enemyBullets.forEach(b => b.draw(ctx));

    // Update UI
    scoreVal.innerText = score;
    livesVal.innerText = lives;

    requestAnimationFrame(update);
}

// Setup Buttons
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start Asset Loading
loadAssets(() => {
    startBtn.innerText = "Start Game";
    init();
    // initial render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => s.draw(ctx));
});
startBtn.innerText = "Loading...";
