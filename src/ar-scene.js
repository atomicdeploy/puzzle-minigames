import * as THREE from 'three';

/**
 * AR Scene Manager
 * Handles AR.js integration with Three.js scene
 */

let arToolkitSource = null;
let arToolkitContext = null;
let camera = null;
let scene = null;
let renderer = null;
let markerRoot = null;
let arEnabled = false;

/**
 * Initialize AR.js with Three.js
 * @param {HTMLElement} container - DOM container for the AR view
 * @returns {Object} AR scene objects
 */
export function initARScene(container) {
    // Scene
    scene = new THREE.Scene();
    
    // Camera
    camera = new THREE.Camera();
    scene.add(camera);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    renderer.setSize(640, 480);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    container.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    return { scene, camera, renderer };
}

/**
 * Initialize AR.js toolkit
 * @param {THREE.Renderer} rendererInstance
 * @param {THREE.Camera} cameraInstance
 * @param {THREE.Scene} sceneInstance
 */
export function initARToolkit(rendererInstance, cameraInstance, sceneInstance) {
    renderer = rendererInstance;
    camera = cameraInstance;
    scene = sceneInstance;
    
    // Create AR source (webcam)
    arToolkitSource = new window.THREEx.ArToolkitSource({
        sourceType: 'webcam',
    });
    
    // Handle resize
    function onResize() {
        arToolkitSource.onResizeElement();
        arToolkitSource.copyElementSizeTo(renderer.domElement);
        if (arToolkitContext.arController !== null) {
            arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
        }
    }
    
    arToolkitSource.init(function onReady() {
        onResize();
    });
    
    // Handle resize
    window.addEventListener('resize', function() {
        onResize();
    });
    
    // Create AR context
    arToolkitContext = new window.THREEx.ArToolkitContext({
        cameraParametersUrl: 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/camera_para.dat',
        detectionMode: 'mono'
    });
    
    // Initialize context
    arToolkitContext.init(function onCompleted() {
        // Copy projection matrix to camera
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });
    
    // Create marker root (where AR objects will be attached)
    markerRoot = new THREE.Group();
    scene.add(markerRoot);
    
    // Setup marker tracking - using Hiro marker (default)
    const markerControls = new window.THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
        type: 'pattern',
        patternUrl: 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/patt.hiro'
    });
    
    arEnabled = true;
    
    return { arToolkitSource, arToolkitContext, markerRoot };
}

/**
 * Update AR scene (call in animation loop)
 */
export function updateAR() {
    if (!arEnabled || !arToolkitSource || !arToolkitContext) return;
    
    if (arToolkitSource.ready !== false) {
        arToolkitContext.update(arToolkitSource.domElement);
    }
}

/**
 * Add 3D object to AR marker
 * @param {THREE.Object3D} object - Three.js object to add
 */
export function addObjectToMarker(object) {
    if (!markerRoot) {
        console.warn('AR marker not initialized');
        return;
    }
    markerRoot.add(object);
}

/**
 * Create a treasure chest model for AR
 * @param {number} number - Chest number
 * @returns {THREE.Group} Chest 3D model
 */
export function createARTreasureChest(number) {
    const group = new THREE.Group();
    
    // Chest body
    const bodyGeometry = new THREE.BoxGeometry(1, 0.8, 0.6);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        shininess: 30
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    group.add(body);
    
    // Chest lid
    const lidGeometry = new THREE.BoxGeometry(1.05, 0.2, 0.65);
    const lid = new THREE.Mesh(lidGeometry, bodyMaterial);
    lid.position.y = 0.9;
    group.add(lid);
    
    // Gold trim
    const trimGeometry = new THREE.BoxGeometry(1.1, 0.1, 0.7);
    const trimMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFD700,
        shininess: 100,
        emissive: 0x886600
    });
    const trim = new THREE.Mesh(trimGeometry, trimMaterial);
    trim.position.y = 0.8;
    group.add(trim);
    
    // Lock
    const lockGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.1);
    const lock = new THREE.Mesh(lockGeometry, trimMaterial);
    lock.position.set(0, 0.5, 0.35);
    group.add(lock);
    
    // Number label (canvas texture)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    
    // Draw number
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
    });
    const labelGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, 0.5, 0.31);
    group.add(label);
    
    // Position the group at a visible height
    group.position.y = 0.5;
    
    return group;
}

/**
 * Create a puzzle piece model for AR
 * @param {number} number - Piece number
 * @returns {THREE.Group} Puzzle piece 3D model
 */
export function createARPuzzlePiece(number) {
    const group = new THREE.Group();
    
    // Puzzle piece base
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL((number * 0.1) % 1, 0.7, 0.6),
        emissive: new THREE.Color().setHSL((number * 0.1) % 1, 0.5, 0.3),
        shininess: 100
    });
    const piece = new THREE.Mesh(geometry, material);
    group.add(piece);
    
    // Number label
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Draw number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
    });
    const labelGeometry = new THREE.PlaneGeometry(0.4, 0.4);
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.z = 0.06;
    group.add(label);
    
    // Add floating animation
    group.userData.animationOffset = Math.random() * Math.PI * 2;
    
    return group;
}

/**
 * Animate AR objects
 * @param {number} time - Current time
 */
export function animateARObjects(time) {
    if (!markerRoot) return;
    
    markerRoot.children.forEach((child) => {
        if (child.userData.animationOffset !== undefined) {
            // Floating animation
            child.position.y = Math.sin(time * 0.001 + child.userData.animationOffset) * 0.1 + 0.5;
            // Rotation
            child.rotation.y = time * 0.001;
        }
    });
}

/**
 * Check if AR is enabled
 * @returns {boolean}
 */
export function isAREnabled() {
    return arEnabled;
}

/**
 * Get marker root for adding custom objects
 * @returns {THREE.Group}
 */
export function getMarkerRoot() {
    return markerRoot;
}

/**
 * Render the AR scene
 */
export function renderAR() {
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
}

/**
 * Cleanup AR resources
 */
export function cleanupAR() {
    if (arToolkitSource && arToolkitSource.domElement) {
        const video = arToolkitSource.domElement;
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
    }
    
    arEnabled = false;
    arToolkitSource = null;
    arToolkitContext = null;
}
