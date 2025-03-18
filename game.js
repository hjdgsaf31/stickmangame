// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gravity = 0.5;
const friction = 0.8;

// Game state
let gameRunning = true;
let score = 0;
let level = 1;
let collectibles = [];
let goalReached = false;
let animationFrame = 0;
let frameCount = 0;

// Background
const background = {
    sky: '#87CEEB',
    clouds: [
        {x: 50, y: 50, width: 80, height: 40},
        {x: 200, y: 30, width: 100, height: 50},
        {x: 400, y: 70, width: 90, height: 45},
        {x: 600, y: 40, width: 110, height: 55}
    ],
    mountains: [
        {x: 0, y: 350, width: 300, height: 150},
        {x: 250, y: 350, width: 350, height: 200},
        {x: 550, y: 350, width: 250, height: 180}
    ]
};

// Stickman properties
const stickman = {
    x: 100,
    y: 300,
    width: 20,
    height: 50,
    speed: 5,
    velX: 0,
    velY: 0,
    jumping: false,
    grounded: false,
    color: '#000000',
    direction: 'right',
    animState: 'idle'
};

// Goal flag
const goal = {
    x: 700,
    y: 300,
    width: 30,
    height: 50,
    color: '#FF0000',
    waving: 0
};

// Platform properties
const platforms = [
    // Ground
    { x: 0, y: 350, width: 800, height: 50, color: '#8B4513' },
    // Platforms
    { x: 200, y: 250, width: 100, height: 20, color: '#8B4513' },
    { x: 400, y: 200, width: 100, height: 20, color: '#8B4513' },
    { x: 600, y: 250, width: 100, height: 20, color: '#8B4513' }
];

// Particle system for effects
let particles = [];

// Generate collectibles
function generateCollectibles() {
    collectibles = [
        { x: 250, y: 220, width: 15, height: 15, color: '#FFD700', collected: false, rotation: 0 },
        { x: 450, y: 170, width: 15, height: 15, color: '#FFD700', collected: false, rotation: 0 },
        { x: 650, y: 220, width: 15, height: 15, color: '#FFD700', collected: false, rotation: 0 },
        { x: 350, y: 300, width: 15, height: 15, color: '#FFD700', collected: false, rotation: 0 },
        { x: 550, y: 300, width: 15, height: 15, color: '#FFD700', collected: false, rotation: 0 }
    ];
}

// Controls
const keys = {
    right: false,
    left: false,
    up: false
};

// Event listeners for keyboard controls
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') {
        keys.right = true;
        stickman.direction = 'right';
    }
    if (e.key === 'ArrowLeft') {
        keys.left = true;
        stickman.direction = 'left';
    }
    if (e.key === 'ArrowUp') {
        keys.up = true;
    }
    // Restart game with 'R' key
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
    }
});

document.addEventListener('keyup', function(e) {
    if (e.key === 'ArrowRight') {
        keys.right = false;
    }
    if (e.key === 'ArrowLeft') {
        keys.left = false;
    }
    if (e.key === 'ArrowUp') {
        keys.up = false;
    }
});

// Draw background
function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1E90FF');
    gradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Mountains (distant)
    background.mountains.forEach(function(mountain) {
        const mountainGradient = ctx.createLinearGradient(mountain.x, mountain.y - mountain.height, mountain.x, mountain.y);
        mountainGradient.addColorStop(0, '#6B8E23');
        mountainGradient.addColorStop(1, '#556B2F');
        
        ctx.fillStyle = mountainGradient;
        ctx.beginPath();
        ctx.moveTo(mountain.x, mountain.y);
        ctx.lineTo(mountain.x + mountain.width/2, mountain.y - mountain.height);
        ctx.lineTo(mountain.x + mountain.width, mountain.y);
        ctx.closePath();
        ctx.fill();
    });
    
    // Clouds
    ctx.fillStyle = '#FFFFFF';
    background.clouds.forEach(function(cloud) {
        // Move clouds slowly
        cloud.x -= 0.2;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
        }
        
        // Draw cloud
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.height/2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/3, cloud.y - cloud.height/4, cloud.height/2.5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/1.5, cloud.y, cloud.height/2.2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width, cloud.y - cloud.height/8, cloud.height/2.8, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Draw stickman function with animation
function drawStickman() {
    // Update animation frame
    if (frameCount % 5 === 0) {
        animationFrame = (animationFrame + 1) % 4;
    }
    
    // Determine animation state
    if (stickman.jumping) {
        stickman.animState = 'jump';
    } else if (Math.abs(stickman.velX) > 0.5) {
        stickman.animState = 'run';
    } else {
        stickman.animState = 'idle';
    }
    
    // Save context for rotation/flipping
    ctx.save();
    
    // Flip horizontally if facing left
    if (stickman.direction === 'left') {
        ctx.translate(stickman.x + stickman.width, 0);
        ctx.scale(-1, 1);
        ctx.translate(-stickman.x, 0);
    }
    
    // Head
    ctx.beginPath();
    ctx.arc(stickman.x + stickman.width/2, stickman.y + 10, 10, 0, Math.PI * 2);
    ctx.fillStyle = stickman.color;
    ctx.fill();
    ctx.closePath();
    
    // Body
    ctx.beginPath();
    ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 20);
    ctx.lineTo(stickman.x + stickman.width/2, stickman.y + 35);
    ctx.strokeStyle = stickman.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Arms animation
    ctx.beginPath();
    if (stickman.animState === 'run') {
        // Running arm animation
        const armSwing = Math.sin(animationFrame * Math.PI/2) * 5;
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 25);
        ctx.lineTo(stickman.x + stickman.width/2 - 10, stickman.y + 30 + armSwing);
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 25);
        ctx.lineTo(stickman.x + stickman.width/2 + 10, stickman.y + 30 - armSwing);
    } else if (stickman.animState === 'jump') {
        // Jumping arm position
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 25);
        ctx.lineTo(stickman.x + stickman.width/2 - 8, stickman.y + 20);
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 25);
        ctx.lineTo(stickman.x + stickman.width/2 + 8, stickman.y + 20);
    } else {
        // Idle arm position
        const idleArmMove = Math.sin(frameCount * 0.05) * 2;
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 25);
        ctx.lineTo(stickman.x + stickman.width/2 - 10, stickman.y + 30 + idleArmMove);
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 25);
        ctx.lineTo(stickman.x + stickman.width/2 + 10, stickman.y + 30 + idleArmMove);
    }
    ctx.stroke();
    
    // Legs animation
    ctx.beginPath();
    if (stickman.animState === 'run') {
        // Running leg animation
        const legSwing = Math.sin(animationFrame * Math.PI/2) * 5;
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 35);
        ctx.lineTo(stickman.x + stickman.width/2 - 10, stickman.y + 50 - legSwing);
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 35);
        ctx.lineTo(stickman.x + stickman.width/2 + 10, stickman.y + 50 + legSwing);
    } else if (stickman.animState === 'jump') {
        // Jumping leg position
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 35);
        ctx.lineTo(stickman.x + stickman.width/2 - 12, stickman.y + 45);
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 35);
        ctx.lineTo(stickman.x + stickman.width/2 + 12, stickman.y + 45);
    } else {
        // Idle leg position
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 35);
        ctx.lineTo(stickman.x + stickman.width/2 - 10, stickman.y + 50);
        ctx.moveTo(stickman.x + stickman.width/2, stickman.y + 35);
        ctx.lineTo(stickman.x + stickman.width/2 + 10, stickman.y + 50);
    }
    ctx.stroke();
    
    // Restore context
    ctx.restore();
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(stickman.x + stickman.width/2, stickman.y + 55, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
}

// Draw goal flag with animation
function drawGoal() {
    // Pole
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(goal.x, goal.y, 5, goal.height);
    
    // Animate flag waving
    goal.waving = (goal.waving + 0.1) % (Math.PI * 2);
    const waveOffset = Math.sin(goal.waving) * 5;
    
    // Flag
    ctx.fillStyle = goal.color;
    ctx.beginPath();
    ctx.moveTo(goal.x + 5, goal.y);
    ctx.lineTo(goal.x + 30, goal.y + 15 + waveOffset);
    ctx.lineTo(goal.x + 5, goal.y + 30);
    ctx.fill();
}

// Draw platforms with texture
function drawPlatforms() {
    platforms.forEach(function(platform) {
        // Platform base
        const platformGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        platformGradient.addColorStop(0, '#8B4513');
        platformGradient.addColorStop(1, '#654321');
        ctx.fillStyle = platformGradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform top edge
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);
        
        // Platform texture (wood grain)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < platform.width; i += 15) {
            ctx.beginPath();
            ctx.moveTo(platform.x + i, platform.y);
            ctx.lineTo(platform.x + i, platform.y + platform.height);
            ctx.stroke();
        }
    });
}

// Draw collectibles with animation
function drawCollectibles() {
    collectibles.forEach(function(coin) {
        if (!coin.collected) {
            // Rotate coin
            coin.rotation += 0.05;
            
            // Draw coin with 3D effect
            const coinWidth = coin.width * Math.abs(Math.cos(coin.rotation));
            const gradient = ctx.createRadialGradient(
                coin.x + coin.width/2, coin.y + coin.height/2, 0,
                coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2
            );
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#DAA520');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(
                coin.x + coin.width/2, 
                coin.y + coin.height/2, 
                coinWidth/2, 
                coin.height/2, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.closePath();
            
            // Coin shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(
                coin.x + coin.width/2 - coin.width/5, 
                coin.y + coin.height/2 - coin.height/5, 
                coinWidth/6, 
                coin.height/6, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.closePath();
        }
    });
}

// Create particle effect
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 5 + 2,
            color: color,
            velX: Math.random() * 6 - 3,
            velY: Math.random() * -5 - 2,
            alpha: 1,
            life: Math.random() * 30 + 10
        });
    }
}

// Update and draw particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        p.x += p.velX;
        p.y += p.velY;
        p.velY += 0.2;
        p.alpha -= 1 / p.life;
        p.size *= 0.95;
        
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        if (p.alpha <= 0 || p.size <= 0.5) {
            particles.splice(i, 1);
        }
    }
}

// Draw score and level
function drawHUD() {
    // Score and level display with shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = '22px Arial';
    ctx.fillText('Score: ' + score, 22, 32);
    ctx.fillText('Level: ' + level, 22, 62);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '22px Arial';
    ctx.fillText('Score: ' + score, 20, 30);
    ctx.fillText('Level: ' + level, 20, 60);
    
    // Draw completion message if goal is reached
    if (goalReached) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Level complete text with glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Level ' + level + ' Complete!', canvas.width/2, canvas.height/2 - 30);
        
        ctx.shadowBlur = 5;
        ctx.font = '25px Arial';
        ctx.fillText('Score: ' + score, canvas.width/2, canvas.height/2 + 20);
        
        ctx.shadowBlur = 0;
        ctx.font = '20px Arial';
        ctx.fillText('Press R to play next level', canvas.width/2, canvas.height/2 + 60);
        ctx.textAlign = 'left';
    }
}

// Check for collisions
function checkCollisions() {
    stickman.grounded = false;
    
    // Platform collisions
    platforms.forEach(function(platform) {
        const direction = collisionCheck(stickman, platform);
        
        if (direction === 'left' || direction === 'right') {
            stickman.velX = 0;
        } else if (direction === 'bottom') {
            stickman.grounded = true;
            stickman.jumping = false;
        } else if (direction === 'top') {
            stickman.velY *= -1;
        }
    });
    
    if (stickman.grounded) {
        stickman.velY = 0;
    }
    
    // Collectible collisions
    collectibles.forEach(function(coin, index) {
        if (!coin.collected && isColliding(stickman, coin)) {
            coin.collected = true;
            score += 10;
            
            // Create particle effect for coin collection
            createParticles(
                coin.x + coin.width/2, 
                coin.y + coin.height/2, 
                '255, 215, 0', 
                15
            );
        }
    });
    
    // Goal collision
    if (isColliding(stickman, goal) && !goalReached) {
        goalReached = true;
        score += 50;
        gameRunning = false;
        
        // Create celebration particles
        createParticles(
            goal.x + goal.width/2, 
            goal.y + goal.height/2, 
            '255, 0, 0', 
            30
        );
    }
}

// Simple collision detection for collectibles and goal
function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Collision detection function
function collisionCheck(character, platform) {
    // Get the vectors to check against
    const vX = (character.x + (character.width / 2)) - (platform.x + (platform.width / 2));
    const vY = (character.y + (character.height / 2)) - (platform.y + (platform.height / 2));
    
    // Half widths and half heights of the objects
    const hWidths = (character.width / 2) + (platform.width / 2);
    const hHeights = (character.height / 2) + (platform.height / 2);
    let direction = null;
    
    // Check for collision
    if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
        // Calculate overlap on both axes
        const oX = hWidths - Math.abs(vX);
        const oY = hHeights - Math.abs(vY);
        
        // Determine collision direction based on overlap
        if (oX >= oY) {
            if (vY > 0) {
                direction = 'top';
                character.y += oY;
            } else {
                direction = 'bottom';
                character.y -= oY;
            }
        } else {
            if (vX > 0) {
                direction = 'left';
                character.x += oX;
            } else {
                direction = 'right';
                character.x -= oX;
            }
        }
    }
    
    return direction;
}

// Reset game for next level
function resetGame() {
    if (goalReached) {
        level++;
        stickman.x = 100;
        stickman.y = 300;
        stickman.velX = 0;
        stickman.velY = 0;
        generateCollectibles();
        goalReached = false;
        gameRunning = true;
        particles = [];
    } else {
        // Reset if player wants to restart current level
        stickman.x = 100;
        stickman.y = 300;
        stickman.velX = 0;
        stickman.velY = 0;
        generateCollectibles();
        gameRunning = true;
    }
}

// Update game state
function update() {
    if (!gameRunning) return;
    
    // Apply controls
    if (keys.right) {
        if (stickman.velX < stickman.speed) {
            stickman.velX++;
        }
    }
    
    if (keys.left) {
        if (stickman.velX > -stickman.speed) {
            stickman.velX--;
        }
    }
    
    if (keys.up && !stickman.jumping && stickman.grounded) {
        stickman.jumping = true;
        stickman.grounded = false;
        stickman.velY = -12;
        
        // Jump dust effect
        createParticles(
            stickman.x + stickman.width/2, 
            stickman.y + stickman.height, 
            '150, 150, 150', 
            8
        );
    }
    
    // Apply physics
    stickman.velX *= friction;
    stickman.velY += gravity;
    
    // Update position
    stickman.x += stickman.velX;
    stickman.y += stickman.velY;
    
    // Check boundaries
    if (stickman.x <= 0) {
        stickman.x = 0;
    } else if (stickman.x + stickman.width >= canvas.width) {
        stickman.x = canvas.width - stickman.width;
    }
    
    // Check for collisions
    checkCollisions();
    
    // Running dust effect
    if (Math.abs(stickman.velX) > 2 && stickman.grounded && frameCount % 10 === 0) {
        createParticles(
            stickman.x + stickman.width/2, 
            stickman.y + stickman.height, 
            '150, 150, 150', 
            2
        );
    }
    
    // Update frame counter for animations
    frameCount++;
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Update game state
    update();
    
    // Draw everything
    drawPlatforms();
    drawCollectibles();
    drawGoal();
    drawStickman();
    updateParticles();
    drawHUD();
    
    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Initialize the game when the page loads
window.onload = function() {
    // Wait for the canvas to be available
    canvas.width = 800;
    canvas.height = 400;
    
    // Generate initial collectibles
    generateCollectibles();
    
    // Start the game loop
    gameLoop();
};
