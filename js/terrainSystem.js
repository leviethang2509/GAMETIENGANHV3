import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { ChunkManager } from './chunkManager.js';
import { InputController } from './inputController.js';

/**
 * Procedural Terrain System application entry point.
 * Coordinates rendering, chunk streaming, idle interaction camera controls,
 * lighting, and the Floating Origin technique to avoid precision issues.
 */
class TerrainSystem {
    constructor(containerId, statsOverlayId) {
        this.container = document.getElementById(containerId);
        this.statsOverlay = document.getElementById(statsOverlayId);
        
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        // Constants
        this.CHUNK_SIZE = 256;
        
        // Performance Stats
        this.fps = 60;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fpsUpdateTime = performance.now();

        // Floating Origin threshold: Shift world when camera goes too far from center
        this.originShiftThreshold = 1000;
        this.accumulatedShift = new THREE.Vector3(0, 0, 0);

        this.initThree();
        this.initLights();
        
        // Chunk Manager
        this.chunkManager = new ChunkManager(this.scene, this.CHUNK_SIZE, 6, 64);

        // Position camera initially in a suitable height above terrain
        this.camera.position.set(0, 100, 160);
        
        // Input Controller (manages click-to-glide camera interaction and auto-drift)
        this.inputController = new InputController(this.camera, this.scene, this.container);
        this.inputController.targetCameraPosition.copy(this.camera.position);

        // Window Resize
        window.addEventListener('resize', () => this.onResize());

        // Kick off render loop
        this.animate();
    }

    initThree() {
        // Scene with fog for depth cueing and horizon matching
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xb0e0e6); // Powder Blue sky
        this.scene.fog = new THREE.FogExp2(0xb0e0e6, 0.0006);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 8000);
        this.scene.add(this.camera);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        // Clear children and append renderer canvas
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);
    }

    initLights() {
        // Ambient Light for soft fills
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
        this.scene.add(ambientLight);

        // Directional Light (Sun)
        this.sun = new THREE.DirectionalLight(0xffffff, 0.85);
        this.sun.position.set(1000, 2000, 1000);
        this.scene.add(this.sun);

        // Hemisphere Light for sky and ground reflections
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
        hemiLight.position.set(0, 1, 0);
        this.scene.add(hemiLight);
    }

    onResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    /**
     * Floating Origin technique shifts the coordinate system back to (0,0,0)
     * when the camera travels far from the world center.
     * Prevents single-precision floating point rendering artifacts.
     */
    applyFloatingOrigin() {
        const camPos = this.camera.position;
        const distFromCenter = camPos.length();

        if (distFromCenter > this.originShiftThreshold) {
            const shift = camPos.clone();
            
            // Do not shift Y coordinate unless we climb very high
            shift.y = 0; 
            
            // Shift camera position back
            this.camera.position.sub(shift);

            // Shift target positions in the input controller
            if (this.inputController) {
                this.inputController.targetCameraPosition.sub(shift);
                this.inputController.targetLookAt.sub(shift);
                this.inputController.currentLookAt.sub(shift);
            }

            // Shift all terrain chunks in the scene
            this.scene.traverse((object) => {
                if (object.isMesh) {
                    object.position.sub(shift);
                    object.updateMatrix();
                }
            });

            // Track accumulated offset
            this.accumulatedShift.add(shift);
        }
    }

    updateFPS(now) {
        this.frameCount++;
        if (now > this.fpsUpdateTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsUpdateTime));
            this.frameCount = 0;
            this.fpsUpdateTime = now;
        }
    }

    updateUI() {
        if (!this.statsOverlay) return;

        // Calculate absolute position (including origin shifts)
        const absX = Math.round(this.camera.position.x + this.accumulatedShift.x);
        const absY = Math.round(this.camera.position.y + this.accumulatedShift.y);
        const absZ = Math.round(this.camera.position.z + this.accumulatedShift.z);

        const currentChunkX = Math.floor((absX + this.CHUNK_SIZE / 2) / this.CHUNK_SIZE);
        const currentChunkZ = Math.floor((absZ + this.CHUNK_SIZE / 2) / this.CHUNK_SIZE);

        this.statsOverlay.innerHTML = `
            <table class="info-table">
                <tr><td class="info-label">FPS</td><td class="info-value" style="color: ${this.fps >= 55 ? '#2b8a3e' : '#f59f00'}">${this.fps}</td></tr>
                <tr><td class="info-label">Camera Chunk</td><td class="info-value">${currentChunkX}, ${currentChunkZ}</td></tr>
                <tr><td class="info-label">Position</td><td class="info-value">X: ${absX} Y: ${absY} Z: ${absZ}</td></tr>
                <tr><td class="info-label">Active Chunks</td><td class="info-value">${this.chunkManager.stats.loadedChunksCount}</td></tr>
                <tr><td class="info-label">Pending Loads</td><td class="info-value">${this.chunkManager.stats.pendingGenerationsCount}</td></tr>
                <tr><td class="info-label">Origin Shift</td><td class="info-value">X: ${Math.round(this.accumulatedShift.x)}, Z: ${Math.round(this.accumulatedShift.z)}</td></tr>
            </table>
        `;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1); // Cap delta to prevent huge jumps
        this.lastFrameTime = now;

        this.updateFPS(now);

        // 1. Update Camera using click-to-glide & idle-drift logic
        if (this.inputController) {
            this.inputController.update(this.camera, delta);
        }

        // 2. Apply Floating Origin to keep rendering coordinates close to (0,0,0)
        this.applyFloatingOrigin();

        // 3. Update Terrain chunks based on the camera position
        // Chunk Manager needs the absolute coordinates to compute noise correctly!
        const absX = this.camera.position.x + this.accumulatedShift.x;
        const absZ = this.camera.position.z + this.accumulatedShift.z;
        this.chunkManager.update(absX, absZ);

        // 4. Position the Sun to follow the camera (keeps lighting consistent)
        this.sun.position.set(this.camera.position.x + 1000, 2000, this.camera.position.z + 1000);

        // 5. Render Scene
        this.renderer.render(this.scene, this.camera);

        // 6. Update UI Stats Overlay
        this.updateUI();
    }

    dispose() {
        this.chunkManager.dispose();
        this.renderer.dispose();
    }
}

export { TerrainSystem };
