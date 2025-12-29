// Import Matter.js
import Matter from 'matter-js';

// Matter.js aliases
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Constraint = Matter.Constraint;
const Body = Matter.Body;
const Events = Matter.Events;
const Query = Matter.Query;

// Constants
const CORRECT_ANSWER = 10;
const BALL_RADIUS = 20;
const PUZZLE_NUMBER = 2;

// Game state
let engine, render, runner;
let mainScale, nestedScale;
let balls = {
    white1: null,
    red1: null,
    white2: null,
    red2: null,
    red3: null,
    red4: null,
    green: null
};
let isGameComplete = false;
let userAnswer = null;

// Ball weights (based on the puzzle logic)
const ballWeights = {
    white: 10,   // This is what the player needs to figure out
    red: 10,     // Red ball weight
    green: 30    // Green ball weight (given as hint)
};

// Initialize the game
function init() {
    const canvas = document.getElementById('physics-canvas');
    const canvasContainer = document.getElementById('canvas-container');
    
    // Create engine
    engine = Engine.create();
    engine.world.gravity.y = 1;
    
    // Create renderer
    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: canvasContainer.clientWidth,
            height: canvasContainer.clientHeight,
            wireframes: false,
            background: 'transparent'
        }
    });
    
    // Create scene
    createScene();
    
    // Create runner but don't start it yet - physics should be paused until user enters a guess
    runner = Runner.create();
    Render.run(render);
    
    // Setup UI event listeners
    setupEventListeners();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Make balls draggable
    setupDragging();
}

// Create the physics scene
function createScene() {
    const width = render.options.width;
    const height = render.options.height;
    
    // Ground (invisible)
    const ground = Bodies.rectangle(width / 2, height + 25, width, 50, { 
        isStatic: true,
        render: { visible: false }
    });
    Composite.add(engine.world, ground);
    
    // Main scale fulcrum (center support)
    const mainFulcrum = Bodies.rectangle(width / 2, height * 0.4, 20, 80, {
        isStatic: true,
        render: {
            fillStyle: '#6c5ce7',
            strokeStyle: '#ffffff',
            lineWidth: 2
        }
    });
    Composite.add(engine.world, mainFulcrum);
    
    // Main scale beam
    const mainBeam = Bodies.rectangle(width / 2, height * 0.4 - 50, 400, 15, {
        render: {
            fillStyle: '#fd79a8',
            strokeStyle: '#ffffff',
            lineWidth: 2
        }
    });
    Composite.add(engine.world, mainBeam);
    mainScale = mainBeam;
    
    // Pin constraint for main scale
    const mainPin = Constraint.create({
        bodyA: mainFulcrum,
        bodyB: mainBeam,
        pointA: { x: 0, y: -40 },
        pointB: { x: 0, y: 0 },
        length: 0,
        stiffness: 1
    });
    Composite.add(engine.world, mainPin);
    
    // Nested scale fulcrum (attached to right side of main scale beam, not static)
    const nestedFulcrum = Bodies.rectangle(width / 2 + 150, height * 0.4 - 30, 12, 50, {
        render: {
            fillStyle: '#4ecdc4',
            strokeStyle: '#ffffff',
            lineWidth: 2
        }
    });
    Composite.add(engine.world, nestedFulcrum);
    
    // Attach nested fulcrum to main beam so it moves with the main scale
    const nestedToMainConstraint = Constraint.create({
        bodyA: mainBeam,
        bodyB: nestedFulcrum,
        pointA: { x: 150, y: 20 },  // Right side of main beam
        pointB: { x: 0, y: -25 },    // Top of nested fulcrum
        length: 0,
        stiffness: 1
    });
    Composite.add(engine.world, nestedToMainConstraint);
    
    // Nested scale beam (smaller)
    const nestedBeam = Bodies.rectangle(width / 2 + 150, height * 0.4 - 60, 200, 10, {
        render: {
            fillStyle: '#ffe66d',
            strokeStyle: '#ffffff',
            lineWidth: 2
        }
    });
    Composite.add(engine.world, nestedBeam);
    nestedScale = nestedBeam;
    
    // Pin constraint for nested scale
    const nestedPin = Constraint.create({
        bodyA: nestedFulcrum,
        bodyB: nestedBeam,
        pointA: { x: 0, y: -30 },
        pointB: { x: 0, y: 0 },
        length: 0,
        stiffness: 1
    });
    Composite.add(engine.world, nestedPin);
    
    // Create balls on left side of main scale: white, red, white
    balls.white1 = createBall(width / 2 - 150, height * 0.4 - 100, BALL_RADIUS, '#ffffff', '⚪', ballWeights.white);
    balls.red1 = createBall(width / 2 - 100, height * 0.4 - 100, BALL_RADIUS, '#ff6b6b', '🔴', ballWeights.red);
    balls.white2 = createBall(width / 2 - 50, height * 0.4 - 100, BALL_RADIUS, '#ffffff', '⚪', ballWeights.white);
    
    // Create balls on left side of nested scale: red, red, red
    balls.red2 = createBall(width / 2 + 70, height * 0.4 - 100, BALL_RADIUS, '#ff6b6b', '🔴', ballWeights.red);
    balls.red3 = createBall(width / 2 + 100, height * 0.4 - 100, BALL_RADIUS, '#ff6b6b', '🔴', ballWeights.red);
    balls.red4 = createBall(width / 2 + 130, height * 0.4 - 100, BALL_RADIUS, '#ff6b6b', '🔴', ballWeights.red);
    
    // Create green ball on right side of nested scale with label
    balls.green = createBall(width / 2 + 230, height * 0.4 - 100, BALL_RADIUS, '#00b894', '🟢', ballWeights.green);
    
    // Add label to green ball: ensure font properties are set every frame before drawing
    const ctx = render.context;
    
    Events.on(render, 'afterRender', () => {
        ctx.font = 'bold 16px Vazirmatn';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('30', balls.green.position.x, balls.green.position.y);
    });
}

// Create a ball with emoji rendering
function createBall(x, y, radius, color, emoji, weight) {
    const ball = Bodies.circle(x, y, radius, {
        restitution: 0.3,
        friction: 0.1,
        density: weight / (Math.PI * radius * radius),
        render: {
            fillStyle: color,
            strokeStyle: '#ffffff',
            lineWidth: 2
        }
    });
    
    ball.emoji = emoji;
    Composite.add(engine.world, ball);
    
    return ball;
}

// Setup dragging functionality
function setupDragging() {
    let selectedBody = null;
    let mouseConstraint = null;
    
    const canvas = document.getElementById('physics-canvas');
    
    const getMousePos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };
    
    const handleStart = (e) => {
        e.preventDefault();
        const pos = getMousePos(e);
        
        // Use Query.point for efficient collision detection
        const bodies = Query.point(Composite.allBodies(engine.world), pos);
        
        // Find the first ball (body with emoji property)
        for (let body of bodies) {
            if (body.emoji) {
                selectedBody = body;
                
                // Create constraint
                mouseConstraint = Constraint.create({
                    bodyB: selectedBody,
                    pointB: { x: 0, y: 0 },
                    pointA: pos,
                    stiffness: 0.1,
                    render: { visible: false }
                });
                Composite.add(engine.world, mouseConstraint);
                break;
            }
        }
    };
    
    const handleMove = (e) => {
        if (!selectedBody || !mouseConstraint) return;
        e.preventDefault();
        const pos = getMousePos(e);
        mouseConstraint.pointA = pos;
    };
    
    const handleEnd = (e) => {
        if (mouseConstraint) {
            Composite.remove(engine.world, mouseConstraint);
            mouseConstraint = null;
        }
        selectedBody = null;
    };
    
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);
}

// Setup UI event listeners
function setupEventListeners() {
    const submitBtn = document.getElementById('submit-btn');
    const answerInput = document.getElementById('answer-input');
    
    submitBtn.addEventListener('click', handleSubmit);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    });
}

// Handle answer submission
function handleSubmit() {
    if (isGameComplete) return;
    
    const answerInput = document.getElementById('answer-input');
    const answer = parseInt(answerInput.value);
    
    if (isNaN(answer) || answer <= 0) {
        showFeedback('لطفا یک عدد معتبر وارد کنید', 'error');
        return;
    }
    
    userAnswer = answer;
    
    // Start the physics engine when user submits their first answer
    if (!runner.enabled) {
        Runner.run(runner, engine);
    }
    
    if (answer === CORRECT_ANSWER) {
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer(answer);
    }
}

// Handle correct answer
function handleCorrectAnswer() {
    isGameComplete = true;
    
    showFeedback('🎉 آفرین! پاسخ صحیح است! 🎉', 'success');
    playConfetti();
    
    // Disable input
    document.getElementById('answer-input').disabled = true;
    document.getElementById('submit-btn').disabled = true;
    
    // Notify parent window
    setTimeout(() => {
        window.parent.postMessage({
            type: 'minigame-complete',
            success: true,
            puzzleNumber: PUZZLE_NUMBER,
            answer: CORRECT_ANSWER
        }, window.location.origin);
    }, 3000);
}

// Handle incorrect answer
function handleIncorrectAnswer(answer) {
    showFeedback('❌ پاسخ اشتباه است! ترازو از تعادل خارج می‌شود...', 'error');
    
    // Update ball weights based on user's answer
    updateBallWeights(answer);
    
    // Shake animation for scales
    setTimeout(() => {
        Body.applyForce(mainScale, mainScale.position, { x: 0.05, y: 0 });
        Body.applyForce(nestedScale, nestedScale.position, { x: -0.03, y: 0 });
    }, 500);
}

// Update ball weights based on user answer
function updateBallWeights(whiteWeight) {
    // Update the density of white balls
    const newDensity = whiteWeight / (Math.PI * BALL_RADIUS * BALL_RADIUS);
    
    Body.setDensity(balls.white1, newDensity);
    Body.setDensity(balls.white2, newDensity);
    
    // Apply force to show the imbalance
    setTimeout(() => {
        Body.applyForce(balls.white1, balls.white1.position, { x: 0, y: -0.01 });
        Body.applyForce(balls.white2, balls.white2.position, { x: 0, y: -0.01 });
    }, 100);
}

// Show feedback message
function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
    
    setTimeout(() => {
        feedback.classList.add('hidden');
    }, 3000);
}

// Play confetti animation
function playConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confetti = [];
    const confettiCount = 150;
    const colors = ['#6c5ce7', '#fd79a8', '#00b894', '#4ecdc4', '#ffe66d', '#ff6b6b'];
    
    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * confettiCount,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncrement: Math.random() * 0.07 + 0.05,
            tiltAngle: 0
        });
    }
    
    function drawConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < confetti.length; i++) {
            const c = confetti[i];
            ctx.beginPath();
            ctx.lineWidth = c.r / 2;
            ctx.strokeStyle = c.color;
            ctx.moveTo(c.x + c.tilt + c.r / 4, c.y);
            ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 4);
            ctx.stroke();
        }
        
        updateConfetti();
    }
    
    function updateConfetti() {
        let stillActive = false;
        
        for (let i = 0; i < confetti.length; i++) {
            const c = confetti[i];
            c.tiltAngle += c.tiltAngleIncrement;
            c.y += (Math.cos(c.d) + 3 + c.r / 2) / 2;
            c.x += Math.sin(c.d);
            c.tilt = Math.sin(c.tiltAngle - i / 3) * 15;
            
            if (c.y <= canvas.height) {
                stillActive = true;
            }
        }
        
        if (stillActive) {
            requestAnimationFrame(drawConfetti);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    drawConfetti();
}

// Handle window resize
function handleResize() {
    const canvasContainer = document.getElementById('canvas-container');
    render.canvas.width = canvasContainer.clientWidth;
    render.canvas.height = canvasContainer.clientHeight;
    render.options.width = canvasContainer.clientWidth;
    render.options.height = canvasContainer.clientHeight;
}

// Initialize game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
