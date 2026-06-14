/**
 * Low-Poly Farm and Nature Scene built with pure Three.js geometries and colors.
 * Conforms precisely to the design rules, layout, lighting, and shadow constraints.
 * Features a single-mesh terrain to seamlessly integrate plains, hills, mountain, beach, and sea,
 * ensuring trees, fences, and buildings sit perfectly on the ground.
 */

// Helper function to calculate distance from a point to a line segment
function distToLine(x, z, x1, z1, x2, z2) {
    const A = x - x1;
    const B = z - z1;
    const C = x2 - x1;
    const D = z2 - z1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, zz;
    if (param < 0) {
        xx = x1;
        zz = z1;
    } else if (param > 1) {
        xx = x2;
        zz = z2;
    } else {
        xx = x1 + param * C;
        zz = z1 + param * D;
    }

    const dx = x - xx;
    const dz = z - zz;
    return Math.sqrt(dx * dx + dz * dz);
}

// Global math-based terrain height function
function getTerrainHeight(x, z) {
    let h = 0;
    
    // 1. Sandy Beach and Sea boundary (Z > 210, shifted out to the green line)
    if (z > 210) {
        const maxDepth = -5.5;
        if (z < 260) {
            // Slopes down from road level (0) to sea depth (-5.5)
            const t = (z - 210) / 50;
            let bh = THREE.MathUtils.lerp(0, maxDepth, t);
            // Add low-poly sand wave contours
            bh += Math.sin(x * 0.06) * Math.cos(z * 0.06) * 1.2;
            return bh;
        }
        // Sea floor
        return maxDepth + Math.sin(x * 0.04) * 0.5;
    }
    
    // 2. Background Mountain (Cone centered at x: 0, z: -360)
    const mDist = Math.sqrt(x * x + (z + 360) ** 2);
    if (mDist < 280) {
        // Tall cone height falloff
        let mh = 285 * (1 - mDist / 280);
        // Add low-poly rocky ridges/displacement noise
        mh += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 15;
        mh += Math.sin(x * 0.15) * 4;
        h = Math.max(h, mh);
    }
    
    // 3. Left and Right sloping midground hills
    const hills = [
        { cx: -180, cz: -120, r: 150, h: 60 },
        { cx: -220, cz: -60,  r: 120, h: 48 },
        { cx: 180,  cz: -120, r: 150, h: 60 },
        { cx: 230,  cz: -60,  r: 120, h: 48 }
    ];
    
    for (const hill of hills) {
        const d = Math.sqrt((x - hill.cx) ** 2 + (z - hill.cz) ** 2);
        if (d < hill.r) {
            // Cosine-based smooth slope
            const hh = hill.h * Math.cos((d / hill.r) * (Math.PI / 2));
            h = Math.max(h, hh);
        }
    }
    
    // 4. Smoothly flatten farm courtyard zone (centered around x: 0, z: -80)
    // Completely clears the farm courtyard to avoid clipping and leaves a massive open yard space
    const farmDistX = Math.abs(x);
    const farmDistZ = Math.abs(z + 80);
    if (farmDistX < 160 && farmDistZ < 110) {
        const fx = Math.min(Math.max((farmDistX - 110) / 50, 0), 1);
        const fz = Math.min(Math.max((farmDistZ - 75) / 35, 0), 1);
        const blend = Math.max(fx, fz); // Smooth interpolation at farm boundary
        h *= blend;
    }
    
    return h;
}

class TerrainSystem {
    constructor(containerId, statsOverlayId) {
        this.container = document.getElementById(containerId);
        this.statsOverlay = document.getElementById(statsOverlayId);
        
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        // Stats tracking
        this.fps = 60;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fpsUpdateTime = performance.now();

        this.initThree();
        this.initLights();
        
        // Build the scene step by step
        this.createTerrain();
        this.createWater();
        this.createRoads();
        this.createBuildings();
        this.createFences();
        this.createForest();
        this.createClouds();
        this.createWeather();

        // Setup window resize handler
        window.addEventListener('resize', () => this.onResize());

        // Kick off render loop
        this.animate();
    }

    initThree() {
        // Scene background (clear sky blue - made a bit lighter) and soft linear fog
        // Linear fog allows exact control over where fog starts and ends to prevent blocking the farm
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xb2e8fa); // Soft light blue sky
        this.scene.fog = new THREE.Fog(0xb2e8fa, 150, 1000);

        // Camera setup: positioned high and back (lookAt set at roundabout intersection initially)
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 2000);
        this.camera.position.set(0, 150, 250);

        // Renderer with soft shadows enabled and high-performance hints
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls for easy navigation and viewing
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground level
        this.controls.minDistance = 50;
        this.controls.maxDistance = 500;
        this.controls.target.set(0, 0, -50);
        this.controls.update();
    }

    initLights() {
        // Soft ambient light to fill shadows (intensity: 0.6)
        const ambientLight = new THREE.AmbientLight(0xdff9fb, 0.65);
        this.scene.add(ambientLight);

        // Directional Light (Warm Sunlight) - casts high-res soft shadows
        this.sun = new THREE.DirectionalLight(0xfff8e7, 1.5);
        this.sun.position.set(-150, 250, 150);
        this.sun.castShadow = true;

        // Shadow configuration to balance detail and performance
        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;
        this.sun.shadow.camera.near = 0.5;
        this.sun.shadow.camera.far = 1000;
        
        const d = 300;
        this.sun.shadow.camera.left = -d;
        this.sun.shadow.camera.right = d;
        this.sun.shadow.camera.top = d;
        this.sun.shadow.camera.bottom = -d;
        this.sun.shadow.bias = -0.0005;

        this.scene.add(this.sun);

        // 3D Stylized Low-Poly Sun visual sphere
        const sunGlowGeo = new THREE.SphereGeometry(14, 8, 8);
        const sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
        this.sunVisual = new THREE.Mesh(sunGlowGeo, sunGlowMat);
        this.sunVisual.position.copy(this.sun.position);
        this.scene.add(this.sunVisual);

        // Stylized rays/rings surrounding the sun
        const rayGeo = new THREE.TorusGeometry(22, 1.2, 4, 16);
        const rayMat = new THREE.MeshBasicMaterial({ color: 0xfff6e0, transparent: true, opacity: 0.35 });
        this.sunRay = new THREE.Mesh(rayGeo, rayMat);
        this.sunRay.position.copy(this.sun.position);
        this.sunRay.lookAt(new THREE.Vector3(0, 0, 0));
        this.scene.add(this.sunRay);
    }

    createTerrain() {
        // Unified single-mesh terrain to avoid overlapping seams and float issues
        const size = 800;
        const segments = 160; // 160x160 grid creates highly optimized low-poly faces
        const plainsGeo = new THREE.PlaneGeometry(size, size, segments, segments);
        plainsGeo.rotateX(-Math.PI / 2); // Rotate to ground plane

        const posAttr = plainsGeo.attributes.position;
        const colors = [];
        
        // Custom low-poly color gradients based on height
        const grassColor = new THREE.Color(0x6bb33b);     // Vibrant green plains
        const hillColor = new THREE.Color(0x5b9e32);      // Darker sloping hill green
        const mountainColor = new THREE.Color(0x6d744b);  // Rocky mountain brownish-green
        const peakColor = new THREE.Color(0x8a7b5d);      // Warm peak brown
        const sandColor = new THREE.Color(0xf5cd79);      // Sandy yellow beach (#f5cd79)
        const seaFloorColor = new THREE.Color(0xd2af62);  // Wet dark sand for sea floor

        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const z = posAttr.getZ(i); // Z coordinate is mapped to depth post-rotation
            
            const h = getTerrainHeight(x, z);
            posAttr.setY(i, h); // Displace height

            // Color based on height and Z position (beach zone)
            let col = grassColor.clone();
            if (z > 210) {
                if (z < 260) {
                    col.copy(sandColor);
                } else {
                    col.copy(seaFloorColor);
                }
            } else if (h > 0) {
                if (h > 60) {
                    const factor = Math.min((h - 60) / 100, 1);
                    col.copy(mountainColor).lerp(peakColor, factor);
                } else {
                    const factor = Math.min(h / 60, 1);
                    col.copy(grassColor).lerp(hillColor, factor);
                }
            }
            colors.push(col.r, col.g, col.b);
        }
        
        plainsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        plainsGeo.computeVertexNormals();

        const plainsMat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.9,
            metalness: 0.05,
            flatShading: true // Low-poly styling
        });

        const plainsMesh = new THREE.Mesh(plainsGeo, plainsMat);
        plainsMesh.receiveShadow = true;
        plainsMesh.castShadow = true;
        this.scene.add(plainsMesh);
    }

    createWater() {
        // Animated low-poly sea waves in the foreground (Z: 250 to 450)
        const seaWidth = 800;
        const seaLength = 200;
        this.seaGeo = new THREE.PlaneGeometry(seaWidth, seaLength, 40, 12);
        this.seaGeo.rotateX(-Math.PI / 2);

        this.waterMat = new THREE.MeshPhysicalMaterial({
            color: 0x3498db, // Beautiful transparent water blue
            roughness: 0.15,
            metalness: 0.15,
            transmission: 0.65,
            thickness: 1.5,
            transparent: true,
            opacity: 0.85,
            flatShading: true // Keeps the water low-poly faceted!
        });

        this.seaMesh = new THREE.Mesh(this.seaGeo, this.waterMat);
        // Sea level is at Y: -2.2, extending to Z: 350 (centered)
        this.seaMesh.position.set(0, -2.2, 350);
        this.seaMesh.receiveShadow = true;
        this.scene.add(this.seaMesh);

        // Keep a copy of original Y vertices to animate them relative to base
        const posAttr = this.seaGeo.attributes.position;
        this.seaOriginalY = new Float32Array(posAttr.count);
        for (let i = 0; i < posAttr.count; i++) {
            this.seaOriginalY[i] = posAttr.getY(i);
        }
    }

    createRoads() {
        // High-contrast Asphalt grey for traffic roads to make them stand out
        const asphaltMat = new THREE.MeshStandardMaterial({
            color: 0x3d4b53, // Asphalt grey
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });

        // 1. Foreground Horizontal Highway (moved further out to Z: 200, matching the green line)
        const horizRoadGeo = new THREE.PlaneGeometry(800, 20);
        horizRoadGeo.rotateX(-Math.PI / 2);
        const horizRoad = new THREE.Mesh(horizRoadGeo, asphaltMat);
        horizRoad.position.set(0, 0.1, 200);
        horizRoad.receiveShadow = true;
        this.scene.add(horizRoad);

        // 2. Vertical Entrance Road leading from the gate at Z: 185 back to the farm roundabout at Z: -60
        const vertRoadGeo = new THREE.PlaneGeometry(16, 260);
        vertRoadGeo.rotateX(-Math.PI / 2);
        const vertRoad = new THREE.Mesh(vertRoadGeo, asphaltMat);
        vertRoad.position.set(0, 0.1, 62.5); // Spans from z: -67.5 to 192.5
        vertRoad.receiveShadow = true;
        this.scene.add(vertRoad);

        // 3. Circular Roundabout in front of the farm stone walls (centered at x: 0, z: -60)
        const roundaboutGeo = new THREE.RingGeometry(12, 24, 16);
        roundaboutGeo.rotateX(-Math.PI / 2);
        const roundabout = new THREE.Mesh(roundaboutGeo, asphaltMat);
        roundabout.position.set(0, 0.12, -60);
        roundabout.receiveShadow = true;
        this.scene.add(roundabout);

        // 4. Driveway loop entering the stone gate (roundabout to buildings entrance Z: -70)
        const farmPathGeo = new THREE.PlaneGeometry(16, 12);
        farmPathGeo.rotateX(-Math.PI / 2);
        const farmPath = new THREE.Mesh(farmPathGeo, asphaltMat);
        farmPath.position.set(0, 0.11, -66);
        farmPath.receiveShadow = true;
        this.scene.add(farmPath);

        // --- Traffic Line Markings (Dashed Yellow Lines down center of roads) ---
        const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
        const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const markerGroup = new THREE.Group();

        // Horizontal Road Lines (along Z: 200)
        for (let x = -380; x <= 380; x += 30) {
            if (Math.abs(x) < 20) continue; // Skip gate entry intersection
            const line = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.4), yellowMat);
            line.rotateX(-Math.PI / 2);
            line.position.set(x, 0.13, 200);
            markerGroup.add(line);
        }

        // Vertical Road Lines (along X: 0)
        for (let z = -35; z <= 175; z += 20) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 6), yellowMat);
            line.rotateX(-Math.PI / 2);
            line.position.set(0, 0.13, z);
            markerGroup.add(line);
        }

        // Solid Yellow Road Shoulder Border Lines (Z: 190 and Z: 210) to clarify road boundaries
        const topBorder = new THREE.Mesh(new THREE.PlaneGeometry(800, 0.5), whiteMat);
        topBorder.rotateX(-Math.PI / 2);
        topBorder.position.set(0, 0.13, 190.1);
        markerGroup.add(topBorder);

        const bottomBorder = new THREE.Mesh(new THREE.PlaneGeometry(800, 0.5), yellowMat);
        bottomBorder.rotateX(-Math.PI / 2);
        bottomBorder.position.set(0, 0.13, 209.9);
        markerGroup.add(bottomBorder);

        this.scene.add(markerGroup);
    }

    createFences() {
        const fenceGroup = new THREE.Group();
        
        const postGeo = new THREE.BoxGeometry(1.2, 4.5, 1.2);
        const railGeo = new THREE.BoxGeometry(10.2, 0.5, 0.3);
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x7f5a3c, // Warm wooden brown
            roughness: 0.9,
            metalness: 0.05,
            flatShading: true
        });

        // Function to create fences dynamically following terrain height at each post
        const addFenceSection = (x1, z1, x2, z2) => {
            const dx = x2 - x1;
            const dz = z2 - z1;
            const length = Math.sqrt(dx*dx + dz*dz);
            const angle = Math.atan2(dz, dx);
            const numSegments = Math.round(length / 10);
            const stepX = dx / numSegments;
            const stepZ = dz / numSegments;

            for (let i = 0; i <= numSegments; i++) {
                const px = x1 + i * stepX;
                const pz = z1 + i * stepZ;
                
                // Align post to actual terrain height dynamically to follow slopes
                const ty = getTerrainHeight(px, pz);
                const post = new THREE.Mesh(postGeo, woodMat);
                post.position.set(px, ty + 2.25, pz);
                post.castShadow = true;
                post.receiveShadow = true;
                fenceGroup.add(post);

                if (i < numSegments) {
                    const rx = px + stepX / 2;
                    const rz = pz + stepZ / 2;
                    const try1 = getTerrainHeight(px, pz);
                    const try2 = getTerrainHeight(px + stepX, pz + stepZ);
                    const tryMid = (try1 + try2) / 2;

                    // Calculate inclination angle for slope rails
                    const slopeAngle = Math.atan2(try2 - try1, 10);

                    // Lower rail
                    const rail1 = new THREE.Mesh(railGeo, woodMat);
                    rail1.position.set(rx, tryMid + 1.2, rz);
                    rail1.rotation.y = -angle;
                    rail1.rotation.z = slopeAngle;
                    rail1.castShadow = true;
                    rail1.receiveShadow = true;
                    fenceGroup.add(rail1);

                    // Upper rail
                    const rail2 = rail1.clone();
                    rail2.position.y = tryMid + 2.8;
                    fenceGroup.add(rail2);
                }
            }
        };

        // --- Fences matching the exact layout of the reference screenshot ---
        // 1. Horizontal Front Fence right behind the main highway (runs along Z: 185, matching green line)
        // Leaving an archway opening at the center X: -8 to X: 8
        addFenceSection(-350, 185, -8, 185);
        addFenceSection(8, 185, 350, 185);

        // 2. Left and Right side fences climbing the sloping hills (from Z: 185 outwards to Z: -80)
        // Left side fence climbing the hill outwards
        addFenceSection(-150, 185, -350, -80);
        // Right side fence climbing the hill outwards
        addFenceSection(150, 185, 350, -80);

        this.scene.add(fenceGroup);

        // --- HEDGES / BUSHES along the front boundary fences (Z: 185) ---
        const hedgeMat = new THREE.MeshStandardMaterial({
            color: 0x2d6a4f, // Dark green hedge color
            roughness: 0.9,
            flatShading: true
        });
        const hedgeGroup = new THREE.Group();
        
        const spawnHedgeLine = (xStart, xEnd) => {
            const step = 6;
            for (let hx = xStart; hx <= xEnd; hx += step) {
                const r = 1.8 + Math.random() * 0.8;
                const hedgeMesh = new THREE.Mesh(new THREE.SphereGeometry(r, 5, 4), hedgeMat);
                const ty = getTerrainHeight(hx, 185);
                hedgeMesh.position.set(hx + (Math.random() - 0.5) * 2, ty + 0.5 + (Math.random() - 0.5) * 0.3, 185 + (Math.random() - 0.5) * 1.5);
                hedgeMesh.scale.set(1.2, 0.9, 1.2);
                hedgeMesh.castShadow = true;
                hedgeGroup.add(hedgeMesh);
            }
        };
        spawnHedgeLine(-150, -10);
        spawnHedgeLine(10, 150);
        this.scene.add(hedgeGroup);

        // --- 3D GATE ARCHWAY with "HINTFRAM" Plaque (at Z: 185, next to main road) ---
        const gateGroup = new THREE.Group();
        gateGroup.position.set(0, 0, 185); // Placed at the front gate entrance next to highway (Z: 185)

        // Two large wooden gate pillars
        const pillarGeo = new THREE.BoxGeometry(1.6, 16, 1.6);
        const leftPillar = new THREE.Mesh(pillarGeo, woodMat);
        leftPillar.position.set(-8, 8, 0);
        leftPillar.castShadow = true;
        leftPillar.receiveShadow = true;
        gateGroup.add(leftPillar);

        const rightPillar = leftPillar.clone();
        rightPillar.position.x = 8;
        gateGroup.add(rightPillar);

        // Archway crossbeam linking the pillars
        const beamGeo = new THREE.BoxGeometry(18, 2.5, 1.6);
        const crossBeam = new THREE.Mesh(beamGeo, woodMat);
        crossBeam.position.set(0, 16, 0);
        crossBeam.castShadow = true;
        crossBeam.receiveShadow = true;
        gateGroup.add(crossBeam);

        // Custom plaque texture with name "HINTFRAM" drawn via 2D Canvas to avoid CORS issues
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 492, 108);

        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 64px Quicksand, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HINTFRAM', 256, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const textMat = new THREE.MeshBasicMaterial({ map: texture });
        
        const textPlateGeo = new THREE.PlaneGeometry(15, 3.5);
        const textPlateFront = new THREE.Mesh(textPlateGeo, textMat);
        textPlateFront.position.set(0, 16, 0.82);
        gateGroup.add(textPlateFront);

        const textPlateBack = textPlateFront.clone();
        textPlateBack.position.z = -0.82;
        textPlateBack.rotation.y = Math.PI;
        gateGroup.add(textPlateBack);

        // --- TWO GATE DOORS (Half-Open) ---
        const gateDoorGeo = new THREE.BoxGeometry(7, 5, 0.5);
        
        const leftGateDoor = new THREE.Mesh(gateDoorGeo, woodMat);
        leftGateDoor.position.set(-4.5, 3, 0);
        leftGateDoor.rotation.y = Math.PI / 4; // Swung open inwards
        leftGateDoor.castShadow = true;
        gateGroup.add(leftGateDoor);

        const rightGateDoor = new THREE.Mesh(gateDoorGeo, woodMat);
        rightGateDoor.position.set(4.5, 3, 0);
        rightGateDoor.rotation.y = -Math.PI / 4; // Swung open inwards
        rightGateDoor.castShadow = true;
        gateGroup.add(rightGateDoor);

        this.scene.add(gateGroup);

        // --- GREY STONE WALLS enclosing the inner house/barn courtyard (shifted further out to Z: -20) ---
        // Pushing the front wall to Z: -20 and side walls from Z: -115 to Z: -20 creates a massive empty lawn space
        // inside the courtyard for crops and animal pens, exactly as requested!
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x95a5a6, // Stone grey
            roughness: 0.95,
            flatShading: true
        });

        const addStoneWall = (x, z, width, depth, rotationY = 0) => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 3.5, depth), stoneMat);
            wall.position.set(x, 1.75, z);
            wall.rotation.y = rotationY;
            wall.castShadow = true;
            wall.receiveShadow = true;
            this.scene.add(wall);
        };

        const addStonePillar = (x, z) => {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 4.5, 2), stoneMat);
            pillar.position.set(x, 2.25, z);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);
        };

        // Encloses buildings inside courtyard from Z -115 to Z -20, and X -100 to X 100
        // Left wall (length 95, from z: -115 to z: -20)
        addStoneWall(-100, -67.5, 95, 1.2, Math.PI / 2);
        // Right wall (length 95, from z: -115 to z: -20)
        addStoneWall(100, -67.5, 95, 1.2, Math.PI / 2);
        // Back wall (width 200, at z: -115)
        addStoneWall(0, -115, 200, 1.2);
        // Front wall Left (from x: -100 to x: -10 at z: -20)
        addStoneWall(-55, -20, 90, 1.2);
        // Front wall Right (from x: 10 to x: 100 at z: -20)
        addStoneWall(55, -20, 90, 1.2);

        // Corner and Gate pillars
        addStonePillar(-100, -115);
        addStonePillar(100, -115);
        addStonePillar(-100, -20);
        addStonePillar(100, -20);
        addStonePillar(-10, -20);
        addStonePillar(10, -20);

        // Paved driveway inside the courtyard loop leading up to the farm buildings (Z: -20 to Z: -60)
        const insideDrivewayGeo = new THREE.PlaneGeometry(16, 40);
        insideDrivewayGeo.rotateX(-Math.PI / 2);
        const insideDriveway = new THREE.Mesh(insideDrivewayGeo, new THREE.MeshStandardMaterial({
            color: 0x3d4b53, // Asphalt grey
            roughness: 0.9,
            flatShading: true
        }));
        insideDriveway.position.set(0, 0.11, -40);
        insideDriveway.receiveShadow = true;
        this.scene.add(insideDriveway);

        // --- HAY BALE & PROPS (Nấc rơm & Hàng rào chắn) ---
        const hayBale = new THREE.Mesh(new THREE.BoxGeometry(7, 4.5, 4.5), new THREE.MeshStandardMaterial({
            color: 0xf1c40f, // Straw yellow
            roughness: 0.95,
            flatShading: true
        }));
        hayBale.position.set(-24, 2.25, -25);
        hayBale.rotation.y = 0.2;
        hayBale.castShadow = true;
        this.scene.add(hayBale);

        const barrier = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 0.6), woodMat);
        barrier.position.set(24, 1.5, -25);
        barrier.rotation.y = -0.15;
        barrier.castShadow = true;
        this.scene.add(barrier);

        // --- BEACH PROPS (Palm trees and wooden benches on left/right beach) ---
        // Helper function to build low-poly palm trees
        const buildPalmTree = (x, z) => {
            const palmGroup = new THREE.Group();
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8e7c6e, roughness: 0.95, flatShading: true });
            const leafMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.85, flatShading: true });

            // Curved Trunk using segments
            let currentY = getTerrainHeight(x, z);
            let currentX = x;
            let currentZ = z;
            
            const segments = 6;
            for (let i = 0; i < segments; i++) {
                const segGeo = new THREE.CylinderGeometry(0.7 - i * 0.05, 0.8 - i * 0.05, 3.5, 5);
                const seg = new THREE.Mesh(segGeo, trunkMat);
                segGeo.translate(0, 1.75, 0); // Align pivot to bottom
                seg.position.set(currentX, currentY, currentZ);
                
                // Curve trunk outwards towards the sea (+Z)
                const bend = 0.08 * i;
                seg.rotation.x = bend; 
                seg.castShadow = true;
                seg.receiveShadow = true;
                palmGroup.add(seg);
                
                currentY += 3.5 * Math.cos(bend);
                currentZ += 3.5 * Math.sin(bend);
            }

            // Palms leaves
            const numLeaves = 6;
            const leafGeo = new THREE.BoxGeometry(10, 0.2, 2.5);
            leafGeo.translate(5, 0, 0); // Pivot at trunk
            
            for (let i = 0; i < numLeaves; i++) {
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.set(currentX, currentY, currentZ);
                leaf.rotation.y = (i / numLeaves) * Math.PI * 2;
                leaf.rotation.z = -0.2 - Math.random() * 0.15;
                leaf.castShadow = true;
                palmGroup.add(leaf);
            }

            this.scene.add(palmGroup);
        };

        // Spawn Palm Trees on the beach area (Z: 140 - 150)
        buildPalmTree(-180, 140);
        buildPalmTree(-220, 150);
        buildPalmTree(180, 140);
        buildPalmTree(220, 150);

        // Spawn Benches on the beach next to the road/fences
        const benchMat = new THREE.MeshStandardMaterial({ color: 0x8e5c3c, roughness: 0.9, flatShading: true });
        const spawnBench = (x, z, rotY) => {
            const bench = new THREE.Group();
            // Seat
            const seat = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 2.5), benchMat);
            seat.position.y = 1.8;
            seat.castShadow = true;
            bench.add(seat);
            // Backrest
            const back = new THREE.Mesh(new THREE.BoxGeometry(8, 1.8, 0.4), benchMat);
            back.position.set(0, 2.7, -1.25);
            back.castShadow = true;
            bench.add(back);
            // Legs
            const legGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
            const l1 = new THREE.Mesh(legGeo, benchMat);
            l1.position.set(-3.5, 0.9, 0.8);
            l1.castShadow = true;
            bench.add(l1);
            const l2 = l1.clone(); l2.position.x = 3.5; bench.add(l2);
            const l3 = l1.clone(); l3.position.z = -0.8; bench.add(l3);
            const l4 = l2.clone(); l4.position.z = -0.8; bench.add(l4);

            bench.position.set(x, getTerrainHeight(x, z), z);
            bench.rotation.y = rotY;
            this.scene.add(bench);
        };
        spawnBench(-140, 128, 0);
        spawnBench(140, 128, 0);
    }

    createBuildings() {
        const farmGroup = new THREE.Group();
        farmGroup.position.set(0, 0, -80);

        // Materials
        const stuccoMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, roughness: 0.8, flatShading: true }); // light stucco
        const brickMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.75, flatShading: true }); // tiled red
        const barnRedMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.85, flatShading: true }); // wood red
        const silverMat = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.4, metalness: 0.6, flatShading: true }); // Silo silver
        const trimWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
        const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9, flatShading: true });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.1, metalness: 0.9, flatShading: true });

        // --- 1. MAIN HOUSE (Right side) ---
        const houseGroup = new THREE.Group();
        houseGroup.position.set(22, 0, 0);

        const houseBase = new THREE.Mesh(new THREE.BoxGeometry(28, 18, 20), stuccoMat);
        houseBase.position.y = 9;
        houseBase.castShadow = true;
        houseBase.receiveShadow = true;
        houseGroup.add(houseBase);

        const roofGeo = new THREE.ConeGeometry(22, 14, 4);
        roofGeo.rotateY(Math.PI / 4);
        const houseRoof = new THREE.Mesh(roofGeo, brickMat);
        houseRoof.position.set(0, 25, 0);
        houseRoof.scale.set(1.0, 1.0, 1.05);
        houseRoof.castShadow = true;
        houseGroup.add(houseRoof);

        // Window Details
        const windowGeo = new THREE.BoxGeometry(4, 5, 0.4);
        const w1 = new THREE.Mesh(windowGeo, glassMat);
        w1.position.set(-6, 12, 10.1);
        houseGroup.add(w1);
        const w2 = w1.clone();
        w2.position.x = 6;
        houseGroup.add(w2);

        // Door Details
        const door = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 0.4), darkWoodMat);
        door.position.set(0, 5, 10.1);
        door.castShadow = true;
        houseGroup.add(door);

        // Stone Chimney
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(3.5, 16, 3.5), darkWoodMat);
        chimney.position.set(10, 20, -5);
        chimney.castShadow = true;
        houseGroup.add(chimney);

        farmGroup.add(houseGroup);

        // --- 2. BARN (Left side) ---
        const barnGroup = new THREE.Group();
        barnGroup.position.set(-22, 0, 0);

        const barnBase = new THREE.Mesh(new THREE.BoxGeometry(22, 16, 26), barnRedMat);
        barnBase.position.y = 8;
        barnBase.castShadow = true;
        barnBase.receiveShadow = true;
        barnGroup.add(barnBase);

        const barnRoofGeo = new THREE.CylinderGeometry(0, 16, 10, 4, 1);
        barnRoofGeo.rotateY(Math.PI / 4);
        const barnRoof = new THREE.Mesh(barnRoofGeo, darkWoodMat);
        barnRoof.position.set(0, 21, 0);
        barnRoof.scale.set(1.05, 1.0, 1.25);
        barnRoof.castShadow = true;
        barnGroup.add(barnRoof);

        // White Cross door pattern
        const barnDoorGroup = new THREE.Group();
        barnDoorGroup.position.set(0, 5, 13.1);

        const whiteFrame = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 0.2), trimWhiteMat);
        barnDoorGroup.add(whiteFrame);

        const redFill = new THREE.Mesh(new THREE.BoxGeometry(9, 9, 0.3), barnRedMat);
        redFill.position.z = 0.1;
        barnDoorGroup.add(redFill);

        const crossGeo = new THREE.BoxGeometry(1.2, 12, 0.4);
        const cLeft = new THREE.Mesh(crossGeo, trimWhiteMat);
        cLeft.rotation.z = Math.PI / 4;
        cLeft.position.z = 0.2;
        barnDoorGroup.add(cLeft);

        const cRight = cLeft.clone();
        cRight.rotation.z = -Math.PI / 4;
        barnDoorGroup.add(cRight);

        barnGroup.add(barnDoorGroup);
        farmGroup.add(barnGroup);

        // --- 3. SILO (Middle) ---
        const siloGroup = new THREE.Group();
        siloGroup.position.set(0, 0, -5);

        const tower = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 30, 8), silverMat);
        tower.position.y = 15;
        tower.castShadow = true;
        tower.receiveShadow = true;
        siloGroup.add(tower);

        const dome = new THREE.Mesh(new THREE.SphereGeometry(5.5, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), silverMat);
        dome.position.y = 30;
        dome.castShadow = true;
        siloGroup.add(dome);

        farmGroup.add(siloGroup);

        this.scene.add(farmGroup);
    }

    createClouds() {
        this.clouds = [];
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: true,
            transparent: true,
            opacity: 0.9
        });

        const numClouds = 14;
        for (let i = 0; i < numClouds; i++) {
            const cloud = new THREE.Group();
            
            // Build a puffy low-poly cloud from 4-6 overlapping squashed spheres
            const numSpheres = 4 + Math.floor(Math.random() * 3);
            for (let j = 0; j < numSpheres; j++) {
                const r = 10 + Math.random() * 12;
                const sphereGeo = new THREE.SphereGeometry(r, 6, 5);
                const sphere = new THREE.Mesh(sphereGeo, cloudMat);
                
                sphere.position.set(
                    (j - numSpheres/2) * 12 + (Math.random() - 0.5) * 8,
                    (Math.random() - 0.2) * 6,
                    (Math.random() - 0.5) * 8
                );
                sphere.scale.set(1.4, 0.8, 1.0);
                cloud.add(sphere);
            }

            // Position cloud in the sky
            const cx = -300 + Math.random() * 600;
            const cy = 130 + Math.random() * 50;
            const cz = -350 + Math.random() * 550;
            cloud.position.set(cx, cy, cz);
            
            // Speed of drift
            cloud.userData = { speed: 2.0 + Math.random() * 4.0 };

            this.scene.add(cloud);
            this.clouds.push(cloud);
        }
    }

    createWeather() {
        // 1. Stylized falling rain particles system (LineSegments) - reduced count and opacity to prevent blocking view
        const rainCount = 250;
        const rainPos = [];
        const rainVels = [];
        for (let i = 0; i < rainCount; i++) {
            rainPos.push(
                -300 + Math.random() * 600,
                Math.random() * 220,
                -350 + Math.random() * 650
            );
            rainVels.push(130 + Math.random() * 60); // Faster fall speed
        }

        const rainLines = [];
        for (let i = 0; i < rainCount; i++) {
            const idx = i * 3;
            rainLines.push(rainPos[idx], rainPos[idx+1], rainPos[idx+2]);
            rainLines.push(rainPos[idx], rainPos[idx+1] - 10, rainPos[idx+2]);
        }

        this.rainGeo = new THREE.BufferGeometry();
        this.rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rainLines, 3));
        const rainMat = new THREE.LineBasicMaterial({ color: 0xa8c5db, transparent: true, opacity: 0.25 }); // Low opacity
        this.rainMesh = new THREE.LineSegments(this.rainGeo, rainMat);
        this.rainMesh.visible = false; // Hidden in sunny mode
        this.scene.add(this.rainMesh);

        this.rainData = { positions: new Float32Array(rainPos), velocities: rainVels, count: rainCount };

        // 2. Stylized falling snow particles system (Points) - reduced count and size
        const snowCount = 250;
        const snowPos = [];
        const snowVels = [];
        for (let i = 0; i < snowCount; i++) {
            snowPos.push(
                -300 + Math.random() * 600,
                Math.random() * 220,
                -350 + Math.random() * 650
            );
            snowVels.push(18 + Math.random() * 12);
        }

        this.snowGeo = new THREE.BufferGeometry();
        this.snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(snowPos, 3));
        const snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.5 }); // Subtle snow
        this.snowMesh = new THREE.Points(this.snowGeo, snowMat);
        this.snowMesh.visible = false; // Hidden in sunny mode
        this.scene.add(this.snowMesh);

        this.snowData = { positions: new Float32Array(snowPos), velocities: snowVels, count: snowCount };

        // 3. Floating Sun-Dust / Pollen particles (sunny weather mood)
        const dustCount = 200;
        const dustPos = [];
        const dustVels = [];
        for (let i = 0; i < dustCount; i++) {
            dustPos.push(
                -250 + Math.random() * 500,
                Math.random() * 80,
                -300 + Math.random() * 550
            );
            dustVels.push(1.5 + Math.random() * 2);
        }

        this.dustGeo = new THREE.BufferGeometry();
        this.dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPos, 3));
        const dustMat = new THREE.PointsMaterial({ color: 0xfff6c1, size: 1.8, transparent: true, opacity: 0.65 });
        this.dustMesh = new THREE.Points(this.dustGeo, dustMat);
        this.scene.add(this.dustMesh); // Visible in sunny mode

        this.dustData = { positions: new Float32Array(dustPos), velocities: dustVels, count: dustCount };

        // 4. Horizontal Wind Streaks (foggy weather mood)
        const windCount = 15;
        const windPos = [];
        const windVels = [];
        for (let i = 0; i < windCount; i++) {
            windPos.push(
                -300 + Math.random() * 600,
                15 + Math.random() * 45,
                -300 + Math.random() * 500
            );
            windVels.push(40 + Math.random() * 30);
        }

        const windLines = [];
        for (let i = 0; i < windCount; i++) {
            const idx = i * 3;
            windLines.push(windPos[idx], windPos[idx+1], windPos[idx+2]);
            windLines.push(windPos[idx] - 30, windPos[idx+1], windPos[idx+2]); // Long lines
        }

        this.windGeo = new THREE.BufferGeometry();
        this.windGeo.setAttribute('position', new THREE.Float32BufferAttribute(windLines, 3));
        const windMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
        this.windMesh = new THREE.LineSegments(this.windGeo, windMat);
        this.windMesh.visible = false; // Hidden in sunny mode
        this.scene.add(this.windMesh);

        this.windData = { positions: new Float32Array(windPos), velocities: windVels, count: windCount };
    }

    setWeather(mode) {
        this.currentWeather = mode;

        const cloudMat = this.clouds && this.clouds[0] ? this.clouds[0].children[0].material : null;

        if (mode === 'sunny') {
            // Sunny sky & lighting
            this.scene.background.setHex(0xb2e8fa);
            this.scene.fog.color.setHex(0xb2e8fa);
            
            // Clear view
            this.scene.fog.near = 350;
            this.scene.fog.far = 1500;
            
            this.sun.intensity = 1.5;
            this.sun.color.setHex(0xfff8e7);
            
            if (this.sunVisual) this.sunVisual.material.color.setHex(0xfff6e0);
            if (this.sunRay) this.sunRay.visible = true;

            // Puffy cloud color: white
            if (cloudMat) cloudMat.color.setHex(0xffffff);

            // Particles toggling
            if (this.rainMesh) this.rainMesh.visible = false;
            if (this.snowMesh) this.snowMesh.visible = false;
            if (this.dustMesh) this.dustMesh.visible = true;
            if (this.windMesh) this.windMesh.visible = false;
        } 
        else if (mode === 'rainy') {
            // Dark rainy sky & lighting
            this.scene.background.setHex(0x6e7882);
            this.scene.fog.color.setHex(0x6e7882);
            
            // Light rainy fog
            this.scene.fog.near = 250;
            this.scene.fog.far = 1200;

            this.sun.intensity = 0.35;
            this.sun.color.setHex(0xa8b5c2);

            if (this.sunVisual) this.sunVisual.material.color.setHex(0x95a5a6);
            if (this.sunRay) this.sunRay.visible = false;

            // Clouds turn dark grey
            if (cloudMat) cloudMat.color.setHex(0x50575e);

            // Particles toggling
            if (this.rainMesh) this.rainMesh.visible = true;
            if (this.snowMesh) this.snowMesh.visible = false;
            if (this.dustMesh) this.dustMesh.visible = false;
            if (this.windMesh) this.windMesh.visible = false;
        }
        else if (mode === 'snowy') {
            // Greyish-white snowy sky & lighting
            this.scene.background.setHex(0xdce6eb);
            this.scene.fog.color.setHex(0xdce6eb);
            
            // Soft snow fog
            this.scene.fog.near = 250;
            this.scene.fog.far = 1200;

            this.sun.intensity = 0.6;
            this.sun.color.setHex(0xdff9fb);

            if (this.sunVisual) this.sunVisual.material.color.setHex(0xeaeaea);
            if (this.sunRay) this.sunRay.visible = false;

            // Clouds turn light grey
            if (cloudMat) cloudMat.color.setHex(0xbdc3c7);

            // Particles toggling
            if (this.rainMesh) this.rainMesh.visible = false;
            if (this.snowMesh) this.snowMesh.visible = true;
            if (this.dustMesh) this.dustMesh.visible = false;
            if (this.windMesh) this.windMesh.visible = false;
        }
        else if (mode === 'foggy') {
            // Thick fog sky & lighting
            this.scene.background.setHex(0xc8d6e5);
            this.scene.fog.color.setHex(0xc8d6e5);
            
            // Soft fog starting at 200 and ending at 900
            // This leaves the foreground roundabout and farm house fully visible, while the background mountain peak is nicely misty
            this.scene.fog.near = 200;
            this.scene.fog.far = 900;

            this.sun.intensity = 0.25;
            this.sun.color.setHex(0xa5b1be);

            if (this.sunVisual) this.sunVisual.material.color.setHex(0xb2bec3);
            if (this.sunRay) this.sunRay.visible = false;

            // Clouds turn grey
            if (cloudMat) cloudMat.color.setHex(0x95a5a6);

            // Particles toggling
            if (this.rainMesh) this.rainMesh.visible = false;
            if (this.snowMesh) this.snowMesh.visible = false;
            if (this.dustMesh) this.dustMesh.visible = false;
            if (this.windMesh) this.windMesh.visible = true;
        }
    }

    createForest() {
        // Forest setup using InstancedMesh for pine and deciduous trees
        const numPines = 200;
        const pineTrunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
        const pineLeavesMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.85, flatShading: true });

        // Cones stacked to form pine trees
        const pineTrunkInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.8, 1.2, 5, 5), pineTrunkMat, numPines);
        const pineLeaves1Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(8, 8, 5), pineLeavesMat, numPines);
        const pineLeaves2Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(6.5, 7, 5), pineLeavesMat, numPines);
        const pineLeaves3Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(5, 6, 5), pineLeavesMat, numPines);

        pineTrunkInst.castShadow = true;
        pineTrunkInst.receiveShadow = true;
        pineLeaves1Inst.castShadow = true;
        pineLeaves2Inst.castShadow = true;
        pineLeaves3Inst.castShadow = true;

        let pineIdx = 0;
        const dummy = new THREE.Object3D();

        while (pineIdx < numPines) {
            let tx = 0;
            let tz = 0;
            
            const rand = Math.random();
            if (rand < 0.35) {
                // Left hills
                tx = -140 - Math.random() * 120;
                tz = -160 + Math.random() * 200;
            } else if (rand < 0.7) {
                // Right hills
                tx = 140 + Math.random() * 120;
                tz = -160 + Math.random() * 200;
            } else {
                // Mountain base
                tx = -250 + Math.random() * 500;
                tz = -260 + Math.random() * 100;
                if (Math.abs(tx) < 40) continue;
            }

            // Exclude trees blocking the house/silo/barn view
            if (Math.abs(tx) < 65 && tz > -130 && tz < 20) continue;

            // Exclude trees inside the sea
            if (tz > 245) continue;

            // Fetch absolute height of single-mesh terrain at this coordinate
            const ty = getTerrainHeight(tx, tz);
            const scale = 0.8 + Math.random() * 0.7;
            
            // Set position relative to the exact terrain height (ty)
            dummy.position.set(tx, ty + 2.5 * scale, tz);
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            pineTrunkInst.setMatrixAt(pineIdx, dummy.matrix);

            dummy.position.set(tx, ty + 7.0 * scale, tz);
            dummy.updateMatrix();
            pineLeaves1Inst.setMatrixAt(pineIdx, dummy.matrix);

            dummy.position.set(tx, ty + 10.0 * scale, tz);
            dummy.updateMatrix();
            pineLeaves2Inst.setMatrixAt(pineIdx, dummy.matrix);

            dummy.position.set(tx, ty + 13.0 * scale, tz);
            dummy.updateMatrix();
            pineLeaves3Inst.setMatrixAt(pineIdx, dummy.matrix);

            pineIdx++;
        }

        this.scene.add(pineTrunkInst);
        this.scene.add(pineLeaves1Inst);
        this.scene.add(pineLeaves2Inst);
        this.scene.add(pineLeaves3Inst);

        // Deciduous Trees (Bright green and yellow autumn hints)
        const numDec = 120;
        const decTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
        const greenMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.85, flatShading: true });
        const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.85, flatShading: true });
        
        const decTrunkInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.7, 1.0, 6, 5), decTrunkMat, numDec);
        const decLeaves1Inst = new THREE.InstancedMesh(new THREE.SphereGeometry(6, 5, 4), greenMat, numDec);
        const decLeaves2Inst = new THREE.InstancedMesh(new THREE.SphereGeometry(5.2, 5, 4), yellowMat, numDec);

        decTrunkInst.castShadow = true;
        decTrunkInst.receiveShadow = true;
        decLeaves1Inst.castShadow = true;
        decLeaves2Inst.castShadow = true;

        let decIdx = 0;
        while (decIdx < numDec) {
            let tx = -180 + Math.random() * 360;
            let tz = -180 + Math.random() * 140;

            // Prevent trees from spawning inside water channels or roads
            const leftCanalX = -80 + (tz - (-200)) * (-80 / 400); 
            const rightCanalX = 80 - (tz - (-200)) * (80 / 400); 
            if (Math.abs(tx - leftCanalX) < 18 || Math.abs(tx - rightCanalX) < 18) continue;

            if (Math.abs(tz - 20) < 18) continue; // Horizontal road
            if (Math.abs(tx) < 18 && tz > -120) continue; // Vertical road

            // Exclude trees blocking the house/silo/barn view (wider protection zone)
            if (Math.abs(tx) < 65 && tz > -130 && tz < 20) continue;

            // Exclude trees inside the sea
            if (tz > 245) continue;

            const ty = getTerrainHeight(tx, tz);
            const scale = 0.8 + Math.random() * 0.6;
            
            dummy.position.set(tx, ty + 3.0 * scale, tz);
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            decTrunkInst.setMatrixAt(decIdx, dummy.matrix);

            dummy.position.set(tx, ty + 7.0 * scale, tz);
            dummy.scale.set(scale, scale * 1.1, scale);
            dummy.updateMatrix();
            decLeaves1Inst.setMatrixAt(decIdx, dummy.matrix);

            dummy.position.set(tx + 2.5 * scale, ty + 9.0 * scale, tz - 1.5 * scale);
            dummy.scale.set(scale * 0.7, scale * 0.7, scale * 0.7);
            dummy.updateMatrix();
            decLeaves2Inst.setMatrixAt(decIdx, dummy.matrix);

            decIdx++;
        }

        this.scene.add(decTrunkInst);
        this.scene.add(decLeaves1Inst);
        this.scene.add(decLeaves2Inst);
    }

    onResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
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

        this.statsOverlay.innerHTML = `
            <table class="info-table">
                <tr><td class="info-label">FPS</td><td class="info-value" style="color: ${this.fps >= 55 ? '#2b8a3e' : '#f59f00'}">${this.fps}</td></tr>
                <tr><td class="info-label">Render Engine</td><td class="info-value" style="color: #4dabf7;">Three.js PCFSoft</td></tr>
                <tr><td class="info-label">Scene Poly Count</td><td class="info-value">~35,000 polys</td></tr>
                <tr><td class="info-label">Vegetation Type</td><td class="info-value">InstancedMesh</td></tr>
                <tr><td class="info-label">Active Lights</td><td class="info-value">Sun + Ambient</td></tr>
                <tr><td class="info-label">Shadow Maps</td><td class="info-value">Enabled (2048x2048)</td></tr>
            </table>
        `;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = now;

        this.updateFPS(now);

        if (this.controls) {
            this.controls.update();
        }

        // 1. Slow drift for low-poly sky clouds
        if (this.clouds) {
            for (const cloud of this.clouds) {
                cloud.position.x += cloud.userData.speed * delta;
                if (cloud.position.x > 400) {
                    cloud.position.x = -400;
                    cloud.position.z = -350 + Math.random() * 550;
                }
            }
        }

        // 2. Slow rotation of the visual sun ray torus
        if (this.sunRay) {
            this.sunRay.rotation.z += 0.08 * delta;
        }

        // 3. Animated low-poly sea waves deformation
        if (this.seaGeo && this.seaMesh && this.seaOriginalY) {
            const posAttr = this.seaGeo.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                const vx = posAttr.getX(i);
                const vz = posAttr.getZ(i);
                // Wavy low-poly displacement
                const wave = Math.sin(vx * 0.04 + now * 0.0018) * Math.cos(vz * 0.04 + now * 0.0018) * 1.3;
                posAttr.setY(i, this.seaOriginalY[i] + wave);
            }
            // computeVertexNormals belongs to BufferGeometry, not the attribute
            this.seaGeo.computeVertexNormals();
            posAttr.needsUpdate = true;
        }

        // 4. Falling weather rain streaks update
        if (this.rainMesh && this.rainMesh.visible && this.rainData && this.rainGeo) {
            const posAttr = this.rainGeo.attributes.position;
            const data = this.rainData;
            
            for (let i = 0; i < data.count; i++) {
                const idx = i * 3;
                let ry = data.positions[idx + 1];
                
                ry -= data.velocities[i] * delta;
                
                if (ry < -5) {
                    ry = 220;
                    data.positions[idx] = -300 + Math.random() * 600;
                    data.positions[idx + 2] = -350 + Math.random() * 650;
                }
                
                data.positions[idx + 1] = ry;

                const posIdx = i * 6;
                const rx = data.positions[idx];
                const rz = data.positions[idx + 2];
                
                posAttr.setXYZ(posIdx, rx, ry, rz);
                posAttr.setXYZ(posIdx + 1, rx, ry - 8, rz);
            }
            posAttr.needsUpdate = true;
        }

        // 5. Falling snowy flakes update
        if (this.snowMesh && this.snowMesh.visible && this.snowData && this.snowGeo) {
            const posAttr = this.snowGeo.attributes.position;
            const data = this.snowData;
            
            for (let i = 0; i < data.count; i++) {
                const idx = i * 3;
                let rx = data.positions[idx];
                let ry = data.positions[idx + 1];
                let rz = data.positions[idx + 2];
                
                ry -= data.velocities[i] * delta;
                // Add horizontal sine sway to simulate floating snow
                rx += Math.sin(ry * 0.05 + i) * 6 * delta;

                if (ry < -5) {
                    ry = 220;
                    rx = -300 + Math.random() * 600;
                    rz = -350 + Math.random() * 650;
                }

                data.positions[idx] = rx;
                data.positions[idx + 1] = ry;
                data.positions[idx + 2] = rz;

                posAttr.setXYZ(i, rx, ry, rz);
            }
            posAttr.needsUpdate = true;
        }

        // 6. Sunny dust / pollen floating drift
        if (this.dustMesh && this.dustMesh.visible && this.dustData && this.dustGeo) {
            const posAttr = this.dustGeo.attributes.position;
            const data = this.dustData;
            
            for (let i = 0; i < data.count; i++) {
                const idx = i * 3;
                let rx = data.positions[idx];
                let ry = data.positions[idx + 1];
                let rz = data.positions[idx + 2];

                // Drift slowly in 3D
                ry -= data.velocities[i] * delta * 0.8;
                rx += Math.sin(now * 0.001 + i) * 2 * delta;
                rz += Math.cos(now * 0.001 + i) * 2 * delta;

                if (ry < -2) {
                    ry = 80;
                    rx = -250 + Math.random() * 500;
                    rz = -300 + Math.random() * 550;
                }

                data.positions[idx] = rx;
                data.positions[idx + 1] = ry;
                data.positions[idx + 2] = rz;

                posAttr.setXYZ(i, rx, ry, rz);
            }
            posAttr.needsUpdate = true;
        }

        // 7. Foggy wind streaks update
        if (this.windMesh && this.windMesh.visible && this.windData && this.windGeo) {
            const posAttr = this.windGeo.attributes.position;
            const data = this.windData;
            
            for (let i = 0; i < data.count; i++) {
                const idx = i * 3;
                let rx = data.positions[idx];
                
                rx += data.velocities[i] * delta;
                
                if (rx > 300) {
                    rx = -300;
                    data.positions[idx + 1] = 15 + Math.random() * 45;
                    data.positions[idx + 2] = -300 + Math.random() * 500;
                }
                
                data.positions[idx] = rx;

                const posIdx = i * 6;
                const ry = data.positions[idx + 1];
                const rz = data.positions[idx + 2];
                
                posAttr.setXYZ(posIdx, rx, ry, rz);
                posAttr.setXYZ(posIdx + 1, rx - 30, ry, rz);
            }
            posAttr.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
        this.updateUI();
    }
}

// Expose TerrainSystem globally so it can be instantiated in index.html
window.TerrainSystem = TerrainSystem;
