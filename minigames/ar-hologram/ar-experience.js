import * as THREE from 'three';

// AR Experience State
const arState = {
    scene: null,
    camera: null,
    renderer: null,
    hologram: null,
    particles: [],
    video: null,
    videoTexture: null,
    isARActive: false,
    effectsEnabled: true,
    interactionTime: 0,
    rotationSpeed: 0.01,
    scale: 1,
    touch: {
        startX: 0,
        startY: 0,
        startDistance: 0,
        rotation: { x: 0, y: 0 }
    }
};

// Initialize AR Experience
async function initAR() {
    try {
        // Setup video stream from camera
        await setupCamera();
        
        // Initialize Three.js scene
        initScene();
        
        // Create holographic object
        createHologram();
        
        // Add particle effects
        createParticleSystem();
        
        // Setup interactions
        setupInteractions();
        
        // Start animation loop
        animate();
        
        // Hide loading, show instructions
        document.getElementById('loading').style.display = 'none';
        document.getElementById('instructions').style.display = 'flex';
        
    } catch (error) {
        console.error('AR initialization failed:', error);
        showError('خطا در دسترسی به دوربین. لطفاً دسترسی را تایید کنید.');
    }
}

// Setup Camera with rear-facing preference
async function setupCamera() {
    const container = document.getElementById('scene-container');
    
    // Create video element for camera feed
    arState.video = document.createElement('video');
    arState.video.setAttribute('autoplay', '');
    arState.video.setAttribute('playsinline', '');
    arState.video.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 1;
    `;
    
    // Request camera access (rear camera preferred)
    const constraints = {
        video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        },
        audio: false
    };
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        arState.video.srcObject = stream;
        arState.video.play();
        container.appendChild(arState.video);
        
        return new Promise((resolve) => {
            arState.video.onloadedmetadata = () => {
                resolve();
            };
        });
    } catch (error) {
        console.error('Camera access error:', error);
        throw error;
    }
}

// Initialize Three.js Scene
function initScene() {
    const container = document.getElementById('scene-container');
    
    // Scene
    arState.scene = new THREE.Scene();
    
    // Camera with perspective for AR
    const aspect = window.innerWidth / window.innerHeight;
    arState.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    arState.camera.position.z = 5;
    
    // Renderer with alpha for transparency
    arState.renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance'
    });
    arState.renderer.setSize(window.innerWidth, window.innerHeight);
    arState.renderer.setPixelRatio(window.devicePixelRatio);
    arState.renderer.setClearColor(0x000000, 0); // Transparent background
    arState.renderer.domElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        z-index: 2;
        pointer-events: none;
    `;
    container.appendChild(arState.renderer.domElement);
    
    // Lighting for holographic effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    arState.scene.add(ambientLight);
    
    // Multiple colored lights for holographic effect
    const colors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00];
    colors.forEach((color, i) => {
        const light = new THREE.PointLight(color, 1, 100);
        const angle = (i / colors.length) * Math.PI * 2;
        light.position.set(
            Math.cos(angle) * 5,
            Math.sin(angle) * 3,
            3
        );
        arState.scene.add(light);
    });
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Create Impressive Holographic Object
function createHologram() {
    // Create a complex geometric shape - Icosahedron for interesting facets
    const geometry = new THREE.IcosahedronGeometry(1.5, 1);
    
    // Custom shader material for holographic effect
    const hologramMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            glowColor: { value: new THREE.Color(0x00ffff) },
            rimPower: { value: 2.0 }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 glowColor;
            uniform float rimPower;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                // Fresnel effect for holographic look
                vec3 viewDirection = normalize(cameraPosition - vPosition);
                float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), rimPower);
                
                // Animated scan lines
                float scanline = sin(vPosition.y * 20.0 + time * 2.0) * 0.5 + 0.5;
                
                // Color pulse
                vec3 color = glowColor * (0.5 + 0.5 * sin(time));
                
                // Combine effects
                vec3 finalColor = color * fresnel * (0.7 + scanline * 0.3);
                float alpha = fresnel * 0.8;
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    // Create wireframe overlay for extra effect
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ffff,
        linewidth: 2,
        transparent: true,
        opacity: 0.6
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    
    // Create glow sphere
    const glowGeometry = new THREE.SphereGeometry(2, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            glowColor: { value: new THREE.Color(0x00ffff) }
        },
        vertexShader: `
            varying vec3 vNormal;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 glowColor;
            varying vec3 vNormal;
            
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                vec3 color = glowColor * intensity * (0.5 + 0.5 * sin(time * 2.0));
                gl_FragColor = vec4(color, intensity * 0.3);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    
    // Create main hologram object
    const mainMesh = new THREE.Mesh(geometry, hologramMaterial);
    
    // Group all parts together
    arState.hologram = new THREE.Group();
    arState.hologram.add(mainMesh);
    arState.hologram.add(wireframe);
    arState.hologram.add(glow);
    
    // Position in space
    arState.hologram.position.set(0, 0, 0);
    
    // Store references for animation
    arState.hologram.userData = {
        mainMesh,
        wireframe,
        glow,
        time: 0
    };
    
    arState.scene.add(arState.hologram);
}

// Create Particle System for extra visual flair
function createParticleSystem() {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        // Random position around hologram
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 3 + Math.random() * 2;
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        
        // Random velocity
        velocities.push({
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Particle material
    const material = new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData = { velocities };
    
    arState.particles.push(particles);
    arState.scene.add(particles);
}

// Setup Touch Interactions
function setupInteractions() {
    const renderer = arState.renderer.domElement;
    renderer.style.pointerEvents = 'auto';
    
    let touches = [];
    
    // Touch start
    renderer.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touches = Array.from(e.touches);
        
        if (touches.length === 1) {
            arState.touch.startX = touches[0].clientX;
            arState.touch.startY = touches[0].clientY;
        } else if (touches.length === 2) {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            arState.touch.startDistance = Math.sqrt(dx * dx + dy * dy);
        }
    });
    
    // Touch move
    renderer.addEventListener('touchmove', (e) => {
        e.preventDefault();
        touches = Array.from(e.touches);
        
        if (touches.length === 1) {
            // Single touch - rotate
            const deltaX = touches[0].clientX - arState.touch.startX;
            const deltaY = touches[0].clientY - arState.touch.startY;
            
            arState.touch.rotation.y += deltaX * 0.01;
            arState.touch.rotation.x += deltaY * 0.01;
            
            arState.touch.startX = touches[0].clientX;
            arState.touch.startY = touches[0].clientY;
            
        } else if (touches.length === 2) {
            // Two touches - scale
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const scaleChange = distance / arState.touch.startDistance;
            arState.scale *= scaleChange;
            arState.scale = Math.max(0.5, Math.min(2.5, arState.scale));
            
            arState.touch.startDistance = distance;
        }
    });
    
    // Touch end
    renderer.addEventListener('touchend', (e) => {
        touches = Array.from(e.touches);
        arState.interactionTime += 1;
        
        // Check for completion after significant interaction
        if (arState.interactionTime > 50) {
            setTimeout(() => showSuccess(), 1000);
        }
    });
    
    // Mouse support for desktop testing
    let isMouseDown = false;
    
    renderer.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        arState.touch.startX = e.clientX;
        arState.touch.startY = e.clientY;
    });
    
    renderer.addEventListener('mousemove', (e) => {
        if (isMouseDown) {
            const deltaX = e.clientX - arState.touch.startX;
            const deltaY = e.clientY - arState.touch.startY;
            
            arState.touch.rotation.y += deltaX * 0.01;
            arState.touch.rotation.x += deltaY * 0.01;
            
            arState.touch.startX = e.clientX;
            arState.touch.startY = e.clientY;
            
            arState.interactionTime += 1;
        }
    });
    
    renderer.addEventListener('mouseup', () => {
        isMouseDown = false;
    });
    
    // Wheel for scale on desktop
    renderer.addEventListener('wheel', (e) => {
        e.preventDefault();
        arState.scale += e.deltaY * -0.001;
        arState.scale = Math.max(0.5, Math.min(2.5, arState.scale));
    });
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    
    if (!arState.isARActive) return;
    
    const time = Date.now() * 0.001;
    
    // Update hologram
    if (arState.hologram) {
        // Apply user rotation
        arState.hologram.rotation.x = arState.touch.rotation.x;
        arState.hologram.rotation.y += arState.rotationSpeed;
        arState.hologram.rotation.y += arState.touch.rotation.y * 0.1;
        
        // Apply scale
        arState.hologram.scale.setScalar(arState.scale);
        
        // Floating animation
        arState.hologram.position.y = Math.sin(time * 0.5) * 0.3;
        
        // Update shader uniforms
        const userData = arState.hologram.userData;
        if (userData.mainMesh && userData.mainMesh.material.uniforms) {
            userData.mainMesh.material.uniforms.time.value = time;
        }
        if (userData.glow && userData.glow.material.uniforms) {
            userData.glow.material.uniforms.time.value = time;
        }
        
        // Pulse wireframe
        if (userData.wireframe) {
            userData.wireframe.material.opacity = 0.4 + Math.sin(time * 2) * 0.2;
        }
    }
    
    // Animate particles
    if (arState.effectsEnabled) {
        arState.particles.forEach(particleSystem => {
            const positions = particleSystem.geometry.attributes.position.array;
            const velocities = particleSystem.userData.velocities;
            
            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;
                
                // Orbit around hologram
                const distance = Math.sqrt(
                    positions[i * 3] ** 2 + 
                    positions[i * 3 + 1] ** 2 + 
                    positions[i * 3 + 2] ** 2
                );
                
                // Keep particles in sphere
                if (distance > 5 || distance < 2) {
                    velocities[i].x *= -1;
                    velocities[i].y *= -1;
                    velocities[i].z *= -1;
                }
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
            particleSystem.rotation.y += 0.001;
        });
    }
    
    arState.renderer.render(arState.scene, arState.camera);
}

// Window Resize Handler
function onWindowResize() {
    if (!arState.camera || !arState.renderer) return;
    
    arState.camera.aspect = window.innerWidth / window.innerHeight;
    arState.camera.updateProjectionMatrix();
    arState.renderer.setSize(window.innerWidth, window.innerHeight);
}

// UI Handlers
function setupUIHandlers() {
    // Start AR button
    document.getElementById('start-ar-btn').addEventListener('click', () => {
        document.getElementById('instructions').style.display = 'none';
        arState.isARActive = true;
        updateStatus('AR فعال است', true);
    });
    
    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
        stopAR();
        window.location.href = '../../index.html';
    });
    
    // Switch camera
    document.getElementById('switch-camera-btn').addEventListener('click', async () => {
        // Toggle between front and rear camera
        const currentFacingMode = arState.video.srcObject.getVideoTracks()[0].getSettings().facingMode;
        const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newFacingMode }
            });
            arState.video.srcObject = stream;
        } catch (error) {
            console.error('Camera switch failed:', error);
        }
    });
    
    // Take photo
    document.getElementById('take-photo-btn').addEventListener('click', () => {
        takeScreenshot();
    });
    
    // Toggle effects
    document.getElementById('toggle-effects-btn').addEventListener('click', () => {
        arState.effectsEnabled = !arState.effectsEnabled;
        arState.particles.forEach(p => {
            p.visible = arState.effectsEnabled;
        });
    });
    
    // Claim puzzle
    document.getElementById('claim-puzzle-btn').addEventListener('click', () => {
        // Store completion in localStorage
        const completedMinigame = {
            name: 'ar-hologram',
            timestamp: Date.now(),
            puzzleNumber: Math.floor(Math.random() * 9) + 1 // Random puzzle piece
        };
        localStorage.setItem('ar-minigame-completed', JSON.stringify(completedMinigame));
        
        // Return to main game
        window.location.href = '../../index.html';
    });
}

// Take Screenshot
function takeScreenshot() {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw video
    ctx.drawImage(arState.video, 0, 0, canvas.width, canvas.height);
    
    // Draw 3D scene
    ctx.drawImage(arState.renderer.domElement, 0, 0, canvas.width, canvas.height);
    
    // Create download link
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ar-hologram-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('عکس ذخیره شد! 📸');
    });
}

// Update Status
function updateStatus(text, active) {
    document.getElementById('status-text').textContent = text;
    const dot = document.querySelector('.status-dot');
    dot.style.backgroundColor = active ? '#00ff00' : '#ff0000';
}

// Show Success Modal
function showSuccess() {
    document.getElementById('success-modal').style.display = 'flex';
    // Play success sound effect if available
    playSuccessSound();
}

// Show Error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Show Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// Play Success Sound
function playSuccessSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.1, 0.2].forEach((delay, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const freq = 523.25 * Math.pow(1.5, i);
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + delay);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.4);
        
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + 0.4);
    });
}

// Stop AR
function stopAR() {
    arState.isARActive = false;
    
    // Stop camera
    if (arState.video && arState.video.srcObject) {
        arState.video.srcObject.getTracks().forEach(track => track.stop());
    }
    
    // Cleanup
    if (arState.renderer) {
        arState.renderer.dispose();
    }
}

// Initialize on load
window.addEventListener('load', () => {
    setupUIHandlers();
    initAR();
});

// Cleanup on unload
window.addEventListener('beforeunload', stopAR);
