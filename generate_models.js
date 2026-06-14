const fs = require('fs');
const path = require('path');

const keepAlive = setInterval(() => {}, 1 << 30);

async function exportModel(modelGroup, name, THREE, GLTFExporter) {
    const exporter = new GLTFExporter();
    return new Promise((resolve, reject) => {
        try {
            exporter.parse(
                modelGroup,
                (gltf) => {
                    const outDir = path.join(__dirname, 'assets', 'models');
                    if (!fs.existsSync(outDir)) {
                        fs.mkdirSync(outDir, { recursive: true });
                    }
                    const buffer = Buffer.from(gltf);
                    fs.writeFileSync(path.join(outDir, `${name}.glb`), buffer);
                    console.log(`Successfully exported ${name}.glb`);
                    resolve();
                },
                (error) => {
                    console.error(`Error exporting ${name}:`, error);
                    reject(error);
                },
                { binary: true, animations: modelGroup.userData.animations || [] }
            );
        } catch (e) {
            console.error("Synchronous error in exporter.parse:", e);
            reject(e);
        }
    });
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function run() {
    const THREE = await import('three');
    global.self = global;
    global.window = global;
    // Mock FileReader for GLTFExporter in Node.js
    global.FileReader = class FileReader {
        constructor() {
            this.onload = null;
            this.onerror = null;
        }
        readAsDataURL(blob) {
            blob.arrayBuffer().then(buffer => {
                const base64 = Buffer.from(buffer).toString('base64');
                this.result = `data:${blob.type};base64,${base64}`;
                if (this.onload) this.onload({ target: this });
            }).catch(err => {
                if (this.onerror) this.onerror(err);
            });
        }
        readAsArrayBuffer(blob) {
            blob.arrayBuffer().then(buffer => {
                this.result = buffer;
                if (this.onload) {
                    try {
                        this.onload({ target: this });
                    } catch (e) {
                        console.error('Error in FileReader onload:', e);
                        if (this.onerror) this.onerror(e);
                    }
                }
                if (this.onloadend) {
                    try {
                        this.onloadend({ target: this });
                    } catch (e) {
                        console.error('Error in FileReader onloadend:', e);
                        if (this.onerror) this.onerror(e);
                    }
                }
            }).catch(err => {
                if (this.onerror) this.onerror(err);
            });
        }
    };
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    
    const tomato = createTomatoCrop(THREE);
    console.log("Exporting tomato...");
    await exportModel(tomato, 'crop_tomato', THREE, GLTFExporter).catch(e => console.error(e));
    
    clearInterval(keepAlive);
}

function createTomatoCrop(THREE) {
    const group = new THREE.Group();
    group.name = "tomato_crop";
    
    group.position.set(0, 0, 0);

    const scaleGroup = new THREE.Group();
    scaleGroup.name = "scale_group";
    scaleGroup.position.set(0, 0, 0);
    group.add(scaleGroup);

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.8 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.8, flatShading: true });
    const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.4 });

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.01, 0.015, 0.4, 5);
    stemGeo.translate(0, 0.2, 0);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    scaleGroup.add(stem);

    // Leaves and Branches
    for (let i = 0; i < 4; i++) {
        const height = 0.1 + i * 0.08;
        const angle = (i * Math.PI) / 2 + Math.random() * 0.5;
        
        const branchGroup = new THREE.Group();
        branchGroup.position.set(0, height, 0);
        branchGroup.rotation.y = angle;
        branchGroup.rotation.z = 0.3 + Math.random() * 0.2;

        const branchGeo = new THREE.CylinderGeometry(0.005, 0.008, 0.15, 4);
        branchGeo.translate(0, 0.075, 0);
        const branch = new THREE.Mesh(branchGeo, stemMat);
        branchGroup.add(branch);

        const leafGeo = new THREE.BoxGeometry(0.06, 0.005, 0.04);
        leafGeo.translate(0.03, 0, 0);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0, 0.15, 0);
        leaf.rotation.z = -0.2;
        branchGroup.add(leaf);

        scaleGroup.add(branchGroup);
    }

    // Tomatoes
    const tomatoGeo = new THREE.SphereGeometry(0.035, 8, 8);
    for(let i=0; i<3; i++) {
        const height = 0.15 + i * 0.1;
        const angle = (i * Math.PI * 2 / 3) + 0.5;
        
        const tomato = new THREE.Mesh(tomatoGeo, tomatoMat);
        const dist = 0.06;
        tomato.position.set(Math.cos(angle) * dist, height, Math.sin(angle) * dist);
        
        const stemlet = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.03), stemMat);
        stemlet.position.set(Math.cos(angle) * dist * 0.5, height + 0.02, Math.sin(angle) * dist * 0.5);
        stemlet.lookAt(tomato.position);
        
        scaleGroup.add(tomato);
        scaleGroup.add(stemlet);
    }

    const times = [0, 2];
    const s0 = new THREE.Vector3(0.01, 0.01, 0.01);
    const s1 = new THREE.Vector3(1, 1, 1);
    const values = [...s0.toArray(), ...s1.toArray()];
    
    const trackScale = new THREE.VectorKeyframeTrack('scale_group.scale', times, values);
    const clip = new THREE.AnimationClip('Grow', 2.0, [trackScale]);
    group.userData.animations = [clip];

    return group;
}

function createCarrotCrop(THREE) {
    const group = new THREE.Group();
    group.name = "carrot_crop";
    
    group.position.set(0, 0, 0);

    const scaleGroup = new THREE.Group();
    scaleGroup.name = "scale_group";
    scaleGroup.position.set(0, 0, 0);
    group.add(scaleGroup);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.8, flatShading: true });
    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.9 });

    const rootGeo = new THREE.ConeGeometry(0.06, 0.25, 6);
    rootGeo.rotateX(Math.PI);
    rootGeo.translate(0, -0.1, 0);
    const root = new THREE.Mesh(rootGeo, carrotMat);
    scaleGroup.add(root);

    const numLeaves = 5;
    for (let i = 0; i < numLeaves; i++) {
        const leafGroup = new THREE.Group();
        leafGroup.position.set(0, 0.02, 0);
        leafGroup.rotation.y = (i / numLeaves) * Math.PI * 2 + Math.random() * 0.5;

        const stemGeo = new THREE.BoxGeometry(0.01, 0.2, 0.01);
        stemGeo.translate(0, 0.1, 0);
        const stem = new THREE.Mesh(stemGeo, leafMat);
        stem.rotation.x = 0.3 + Math.random() * 0.2;
        leafGroup.add(stem);

        for(let j=0; j<3; j++) {
            const leafletGeo = new THREE.BoxGeometry(0.04, 0.08, 0.01);
            leafletGeo.translate(0, 0.04, 0);
            const leaflet = new THREE.Mesh(leafletGeo, leafMat);
            leaflet.position.y = 0.1 + j * 0.04;
            leaflet.rotation.x = 0.2;
            leaflet.rotation.y = (j%2===0 ? 0.2 : -0.2);
            stem.add(leaflet);
        }
        scaleGroup.add(leafGroup);
    }

    const times = [0, 2];
    const s0 = new THREE.Vector3(0.01, 0.01, 0.01);
    const s1 = new THREE.Vector3(1, 1, 1);
    const values = [...s0.toArray(), ...s1.toArray()];
    
    const trackScale = new THREE.VectorKeyframeTrack('scale_group.scale', times, values);
    const clip = new THREE.AnimationClip('Grow', 2.0, [trackScale]);
    group.userData.animations = [clip];

    return group;
}

function createRiceCrop(THREE) {
    const riceGroup = new THREE.Group();
    riceGroup.name = "rice_crop";
    
    riceGroup.position.set(0, 0, 0);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x8bc34a, roughness: 0.8, flatShading: true }); // Light yellowish green for rice
    const grainMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.6 }); // Golden yellow grain

    const scaleGroup = new THREE.Group();
    scaleGroup.name = "scale_group";
    scaleGroup.position.set(0, 0, 0); 
    riceGroup.add(scaleGroup);

    // Stalks (clusters)
    const numStalks = 5;
    for (let i = 0; i < numStalks; i++) {
        const stalkGroup = new THREE.Group();
        
        // Random spread for cluster
        const angle = (i / numStalks) * Math.PI * 2 + Math.random() * 0.5;
        const radius = Math.random() * 0.05;
        stalkGroup.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        
        // Slight tilt outwards
        stalkGroup.rotation.z = Math.random() * 0.1;
        stalkGroup.rotation.x = Math.random() * 0.1;

        // Stem
        const stalkHeight = 0.6 + Math.random() * 0.2;
        const stalkGeo = new THREE.CylinderGeometry(0.01, 0.02, stalkHeight, 5);
        stalkGeo.translate(0, stalkHeight / 2, 0);
        const stalk = new THREE.Mesh(stalkGeo, leafMat);
        stalkGroup.add(stalk);

        // Leaves
        const numLeaves = 3 + Math.floor(Math.random() * 2);
        for (let j = 0; j < numLeaves; j++) {
            const lHeight = (j + 1) * (stalkHeight / (numLeaves + 1));
            const lGeo = new THREE.BoxGeometry(0.02, 0.01, 0.3);
            lGeo.translate(0, 0, 0.15); // pivot at base
            const leaf = new THREE.Mesh(lGeo, leafMat);
            leaf.position.y = lHeight;
            leaf.rotation.y = Math.random() * Math.PI * 2;
            leaf.rotation.x = 0.3 + Math.random() * 0.4; // droop
            
            // Curve the leaf a bit
            leaf.geometry.computeBoundingBox();
            const positions = leaf.geometry.attributes.position;
            for (let k = 0; k < positions.count; k++) {
                const z = positions.getZ(k);
                if (z > 0.1) {
                    positions.setY(k, positions.getY(k) - (z - 0.1) * 0.5);
                }
            }
            leaf.geometry.computeVertexNormals();

            stalkGroup.add(leaf);
        }

        // Grain head (drooping down)
        const headGroup = new THREE.Group();
        headGroup.position.y = stalkHeight;
        headGroup.rotation.x = 1.0 + Math.random() * 0.5; // Droop heavily due to weight
        headGroup.rotation.y = Math.random() * Math.PI * 2;
        
        const headStem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.008, 0.2, 4), leafMat);
        headStem.position.y = 0.1;
        headGroup.add(headStem);

        const grainGeo = new THREE.ConeGeometry(0.015, 0.04, 4);
        grainGeo.rotateX(Math.PI / 2);
        
        for (let k = 0; k < 12; k++) {
            const gHeight = 0.05 + k * 0.012;
            const grain = new THREE.Mesh(grainGeo, grainMat);
            grain.position.set(0, gHeight, 0);
            grain.rotation.y = (k * Math.PI) / 3;
            grain.rotation.x = 0.2;
            headGroup.add(grain);
        }

        stalkGroup.add(headGroup);
        scaleGroup.add(stalkGroup);
    }

    const times = [0, 2];
    const s0 = new THREE.Vector3(0.01, 0.01, 0.01);
    const s1 = new THREE.Vector3(1, 1, 1);
    const values = [...s0.toArray(), ...s1.toArray()];
    
    const trackScale = new THREE.VectorKeyframeTrack('scale_group.scale', times, values);
    const clip = new THREE.AnimationClip('Grow', 2.0, [trackScale]);
    riceGroup.userData.animations = [clip];

    return riceGroup;
}

function createCornCrop(THREE) {
    const cornGroup = new THREE.Group();
    cornGroup.name = "corn_crop";
    
    // Position root at origin, remove offsets
    cornGroup.position.set(0, 0, 0);

    // Materials
    const stalkMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.85 }); // Dark green stalk
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.8, flatShading: true }); // Light green leaf
    const huskMat = new THREE.MeshStandardMaterial({ color: 0xa2d149, roughness: 0.9 }); // Husk green
    const silkMat = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.9 }); // Orange silk
    const kernelMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.6 }); // Yellow kernel

    // Base Group - This is what will scale up
    const scaleGroup = new THREE.Group();
    scaleGroup.name = "scale_group";
    // We adjust the whole plant down so that the roots are at y=0, originally stalk starts at y=0.92, length 1.3
    // Originally base of stalk is at 0.92 - 1.3/2 = 0.27.
    // If we want it planted directly in ground, we shift everything down by 0.27.
    scaleGroup.position.set(0, -0.27, 0); 
    cornGroup.add(scaleGroup);

    // Stalk
    const stalkGeo = new THREE.CylinderGeometry(0.03, 0.05, 1.3, 6);
    const stalk = new THREE.Mesh(stalkGeo, stalkMat);
    stalk.position.y = 0.92;
    scaleGroup.add(stalk);

    // Leaves
    function createCurvedLeaf(height, angleY, tiltAngle) {
        const leafGroup = new THREE.Group();
        leafGroup.position.y = height;
        leafGroup.rotation.y = angleY;

        const seg1Geo = new THREE.BoxGeometry(0.06, 0.015, 0.22);
        seg1Geo.translate(0, 0, 0.11);
        const seg1 = new THREE.Mesh(seg1Geo, leafMat);
        seg1.rotation.x = tiltAngle;
        leafGroup.add(seg1);

        const seg2Geo = new THREE.BoxGeometry(0.055, 0.012, 0.22);
        seg2Geo.translate(0, 0, 0.11);
        const seg2 = new THREE.Mesh(seg2Geo, leafMat);
        seg2.position.set(0, Math.sin(tiltAngle) * 0.22, Math.cos(tiltAngle) * 0.22);
        seg2.rotation.x = tiltAngle * 1.7;
        leafGroup.add(seg2);

        const seg3Geo = new THREE.ConeGeometry(0.035, 0.18, 4);
        seg3Geo.rotateX(Math.PI / 2);
        seg3Geo.translate(0, 0, 0.09);
        const seg3 = new THREE.Mesh(seg3Geo, leafMat);
        const s2Angle = tiltAngle * 1.7;
        const px = 0;
        const py = Math.sin(tiltAngle) * 0.22 + Math.sin(s2Angle) * 0.22;
        const pz = Math.cos(tiltAngle) * 0.22 + Math.cos(s2Angle) * 0.22;
        seg3.position.set(px, py, pz);
        seg3.rotation.x = s2Angle * 2.3;
        leafGroup.add(seg3);

        return leafGroup;
    }

    scaleGroup.add(createCurvedLeaf(0.5, 0, 0.45));
    scaleGroup.add(createCurvedLeaf(0.65, Math.PI * 0.6, 0.45));
    scaleGroup.add(createCurvedLeaf(0.8, -Math.PI * 0.6, 0.45));
    scaleGroup.add(createCurvedLeaf(0.95, Math.PI, 0.4));
    scaleGroup.add(createCurvedLeaf(1.1, Math.PI * 0.35, 0.35));
    scaleGroup.add(createCurvedLeaf(1.25, -Math.PI * 0.35, 0.3));

    // Top Leaf
    const topLeafGeo = new THREE.ConeGeometry(0.04, 0.3, 4);
    topLeafGeo.translate(0, 0.15, 0);
    const topLeaf = new THREE.Mesh(topLeafGeo, leafMat);
    topLeaf.position.set(0, 1.55, 0);
    topLeaf.rotation.z = 0.15;
    scaleGroup.add(topLeaf);

    // Corn Ears
    function createDetailedCornEar() {
        const earGroup = new THREE.Group();

        const stemGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.08, 5);
        stemGeo.rotateX(Math.PI / 2);
        const stem = new THREE.Mesh(stemGeo, stalkMat);
        stem.position.set(0, 0, -0.04);
        earGroup.add(stem);

        const huskGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.22, 6);
        const husk = new THREE.Mesh(huskGeo, huskMat);
        earGroup.add(husk);

        const huskLeafGeo = new THREE.ConeGeometry(0.03, 0.15, 4);
        huskLeafGeo.translate(0, 0.075, 0);

        const huskL = new THREE.Mesh(huskLeafGeo, huskMat);
        huskL.position.set(0.025, 0.04, 0.015);
        huskL.rotation.z = -0.3;
        huskL.rotation.y = Math.PI / 6;
        earGroup.add(huskL);

        const huskR = new THREE.Mesh(huskLeafGeo, huskMat);
        huskR.position.set(-0.025, 0.04, 0.015);
        huskR.rotation.z = 0.3;
        huskR.rotation.y = -Math.PI / 6;
        earGroup.add(huskR);

        const kernelGeo = new THREE.ConeGeometry(0.042, 0.14, 6);
        const kernel = new THREE.Mesh(kernelGeo, kernelMat);
        kernel.position.y = 0.11;
        earGroup.add(kernel);

        const seedGeo = new THREE.SphereGeometry(0.014, 4, 4);
        for (let r = 0; r < 3; r++) {
            const hY = 0.05 + r * 0.035;
            const rad = 0.04 - r * 0.008; 
            const count = 5;
            for (let i = 0; i < count; i++) {
                const rotY = (i / count) * Math.PI * 2;
                const seed = new THREE.Mesh(seedGeo, kernelMat);
                seed.position.set(Math.cos(rotY) * rad, hY, Math.sin(rotY) * rad);
                earGroup.add(seed);
            }
        }

        const silkGeo = new THREE.ConeGeometry(0.014, 0.08, 4);
        const silk = new THREE.Mesh(silkGeo, silkMat);
        silk.position.y = 0.19;
        earGroup.add(silk);

        return earGroup;
    }

    const ear1 = createDetailedCornEar();
    ear1.position.set(0.08, 0.8, 0.08);
    ear1.rotation.z = -0.6;
    ear1.rotation.y = Math.PI / 4;
    scaleGroup.add(ear1);

    const ear2 = createDetailedCornEar();
    ear2.position.set(-0.08, 1.0, -0.06);
    ear2.rotation.z = 0.6;
    ear2.rotation.y = -Math.PI * 0.75;
    scaleGroup.add(ear2);

    // Animation: Growth
    // We scale from 0.01 to 1 over 2 seconds
    const times = [0, 2];
    const s0 = new THREE.Vector3(0.01, 0.01, 0.01);
    const s1 = new THREE.Vector3(1, 1, 1);
    const values = [...s0.toArray(), ...s1.toArray()];
    
    const trackScale = new THREE.VectorKeyframeTrack('scale_group.scale', times, values);
    const clip = new THREE.AnimationClip('Grow', 2.0, [trackScale]);
    cornGroup.userData.animations = [clip];

    return cornGroup;
}

function createDrone(THREE) {
    const group = new THREE.Group();
    group.name = "drone";
    
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.5 }); // White plastic/metal
    const armMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const propMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, transparent: true, opacity: 0.8 });
    const cameraMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 });
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, roughness: 0.1, metalness: 0.9 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
    
    const chassisGroup = new THREE.Group();
    chassisGroup.name = "chassis";
    group.add(chassisGroup);
    
    // Central body
    const bodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    chassisGroup.add(body);
    
    // Camera underneath
    const cameraGroup = new THREE.Group();
    cameraGroup.name = "camera_group";
    cameraGroup.position.set(0, -0.1, 0);
    chassisGroup.add(cameraGroup);
    
    const cameraBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), cameraMat);
    cameraGroup.add(cameraBody);
    
    const cameraLens = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8), lensMat);
    cameraLens.rotation.x = Math.PI / 2;
    cameraLens.position.set(0, 0, 0.06);
    cameraGroup.add(cameraLens);
    
    // Arms and propellers
    const armPositions = [
        { x: 0.25, z: 0.25, name: "prop_fl" },
        { x: -0.25, z: 0.25, name: "prop_fr" },
        { x: 0.25, z: -0.25, name: "prop_bl" },
        { x: -0.25, z: -0.25, name: "prop_br" }
    ];
    
    const props = [];
    
    armPositions.forEach(pos => {
        // Arm
        const armGeo = new THREE.BoxGeometry(0.3, 0.02, 0.02);
        const arm = new THREE.Mesh(armGeo, armMat);
        
        // Orient arm towards corner
        const angle = Math.atan2(pos.z, pos.x);
        arm.rotation.y = -angle;
        
        // Position arm midpoint
        arm.position.set(pos.x / 2, 0, pos.z / 2);
        chassisGroup.add(arm);
        
        // Motor
        const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8), armMat);
        motor.position.set(pos.x, 0.02, pos.z);
        chassisGroup.add(motor);
        
        // Light (under motor)
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), lightMat);
        light.position.set(pos.x, -0.02, pos.z);
        chassisGroup.add(light);
        
        // Propeller
        const propGroup = new THREE.Group();
        propGroup.name = pos.name;
        propGroup.position.set(pos.x, 0.05, pos.z);
        chassisGroup.add(propGroup);
        
        const bladeGeo = new THREE.BoxGeometry(0.25, 0.005, 0.02);
        const blade = new THREE.Mesh(bladeGeo, propMat);
        propGroup.add(blade);
        
        props.push(pos.name);
    });
    
    // Animation: Fast propeller spinning and slight bobbing
    const pTimes = [0, 0.5, 1.0, 1.5, 2.0];
    const q0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 2);
    const q3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 3);
    const q4 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 4);
    const propRotValuesExt = [...q0.toArray(), ...q1.toArray(), ...q2.toArray(), ...q3.toArray(), ...q4.toArray()];
    const propTracksExt = props.map(name => new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, pTimes, propRotValuesExt));

    const cTimes = [0, 1, 2];
    const pStartL = new THREE.Vector3(0, 0, 0);
    const pMidL = new THREE.Vector3(0, 0.1, 0);
    const bounceValuesL = [...pStartL.toArray(), ...pMidL.toArray(), ...pStartL.toArray()];
    const trackBounceL = new THREE.VectorKeyframeTrack('chassis.position', cTimes, bounceValuesL);

    // Camera sweeping
    const qC1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.5);
    const qC2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
    const camRotValues = [...qC1.toArray(), ...qC2.toArray(), ...qC1.toArray()];
    const trackCam = new THREE.QuaternionKeyframeTrack('camera_group.quaternion', cTimes, camRotValues);
    
    const clipFinal = new THREE.AnimationClip('DroneHover', 2.0, [...propTracksExt, trackBounceL, trackCam]);
    group.userData.animations = [clipFinal];
    
    return group;
}

function createWheelbarrow(THREE) {
    const group = new THREE.Group();
    group.name = "wheelbarrow";
    
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.5 });
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.7 }); // Blue tray
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    
    const chassisGroup = new THREE.Group();
    chassisGroup.name = "chassis";
    group.add(chassisGroup);
    
    // Frame
    const frameL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8), metalMat);
    frameL.position.set(-0.3, 0.4, 0);
    frameL.rotation.x = Math.PI / 2;
    frameL.rotation.y = 0.1;
    chassisGroup.add(frameL);
    
    const frameR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8), metalMat);
    frameR.position.set(0.3, 0.4, 0);
    frameR.rotation.x = Math.PI / 2;
    frameR.rotation.y = -0.1;
    chassisGroup.add(frameR);
    
    // Handles
    const handleL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.3), handleMat);
    handleL.position.set(-0.38, 0.4, -0.9);
    handleL.rotation.x = Math.PI / 2;
    handleL.rotation.y = 0.1;
    chassisGroup.add(handleL);
    
    const handleR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.3), handleMat);
    handleR.position.set(0.38, 0.4, -0.9);
    handleR.rotation.x = Math.PI / 2;
    handleR.rotation.y = -0.1;
    chassisGroup.add(handleR);
    
    // Legs
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5), metalMat);
    legL.position.set(-0.3, 0.15, -0.4);
    legL.rotation.x = 0.2;
    chassisGroup.add(legL);
    
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5), metalMat);
    legR.position.set(0.3, 0.15, -0.4);
    legR.rotation.x = 0.2;
    chassisGroup.add(legR);
    
    // Tray/Bucket
    const trayGeo = new THREE.CylinderGeometry(0.5, 0.3, 0.8, 4);
    const tray = new THREE.Mesh(trayGeo, trayMat);
    tray.position.set(0, 0.65, 0.1);
    tray.rotation.y = Math.PI / 4; // Rotate to make it a diamond shape or just rectangular if we stretch it
    tray.scale.set(1.2, 0.5, 1.5);
    chassisGroup.add(tray);
    
    // Front Wheel Assembly
    const wheelGroup = new THREE.Group();
    wheelGroup.name = "wheel_front";
    wheelGroup.position.set(0, 0.25, 0.8);
    chassisGroup.add(wheelGroup);
    
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16), wheelMat);
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);
    
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 8), metalMat);
    hub.rotation.z = Math.PI / 2;
    wheelGroup.add(hub);
    
    // Animation: Bobbing chassis and rotating wheel
    const times = [0, 0.5, 1.0, 1.5, 2.0];
    
    const qW0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const qW1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    const qW2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 2);
    const qW3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 3);
    const qW4 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 4);
    
    const wheelRotValues = [...qW0.toArray(), ...qW1.toArray(), ...qW2.toArray(), ...qW3.toArray(), ...qW4.toArray()];
    const trackWheel = new THREE.QuaternionKeyframeTrack('wheel_front.quaternion', times, wheelRotValues);
    
    // Bobbing and moving forward slightly
    const p0 = new THREE.Vector3(0, 0, 0);
    const p1 = new THREE.Vector3(0, 0.05, 0.2); // Lift slightly as if pushed
    const p2 = new THREE.Vector3(0, 0, 0.4);
    const p3 = new THREE.Vector3(0, 0.05, 0.6);
    const p4 = new THREE.Vector3(0, 0, 0.8);
    
    // Just simple up and down bob to simulate walking
    const b0 = new THREE.Vector3(0, 0, 0);
    const b1 = new THREE.Vector3(0, 0.05, 0);
    const b2 = new THREE.Vector3(0, 0, 0);
    const b3 = new THREE.Vector3(0, 0.05, 0);
    const b4 = new THREE.Vector3(0, 0, 0);
    
    const bounceValues = [...b0.toArray(), ...b1.toArray(), ...b2.toArray(), ...b3.toArray(), ...b4.toArray()];
    const trackBounce = new THREE.VectorKeyframeTrack('chassis.position', times, bounceValues);
    
    // Rocking motion
    const r0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const r1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.05); // Tilt back
    const r2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const r3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.05);
    const r4 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    
    const rockValues = [...r0.toArray(), ...r1.toArray(), ...r2.toArray(), ...r3.toArray(), ...r4.toArray()];
    const trackRock = new THREE.QuaternionKeyframeTrack('chassis.quaternion', times, rockValues);
    
    const clip = new THREE.AnimationClip('WheelbarrowMove', 2.0, [trackWheel, trackBounce, trackRock]);
    group.userData.animations = [clip];
    
    return group;
}

function createHarvester(THREE) {
    const group = new THREE.Group();
    group.name = "harvester";
    
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x228822, roughness: 0.6 }); // Green body
    const headerMat = new THREE.MeshStandardMaterial({ color: 0xdd2222, roughness: 0.7 }); // Red header
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xddcc33, metalness: 0.5 }); // Yellow hubs
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });
    
    const chassisGroup = new THREE.Group();
    chassisGroup.name = "chassis";
    group.add(chassisGroup);
    
    // Main Body
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.8, 1.2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.6, 0);
    chassisGroup.add(body);
    
    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.0), bodyMat);
    cabin.position.set(0.3, 1.3, 0);
    chassisGroup.add(cabin);
    
    // Glass
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.9), glassMat);
    frontGlass.position.set(0.71, 1.3, 0);
    chassisGroup.add(frontGlass);
    
    // Grain Tank
    const grainTank = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 1.0), metalMat);
    grainTank.position.set(-0.45, 1.2, 0);
    chassisGroup.add(grainTank);
    
    // Spout (Swinging pipe)
    const spoutGroup = new THREE.Group();
    spoutGroup.name = "spout_group";
    spoutGroup.position.set(-0.5, 1.0, 0.6); // Pivot
    chassisGroup.add(spoutGroup);
    
    const spoutPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8), metalMat);
    spoutPipe.position.set(0, 0.5, 0.5);
    spoutPipe.rotation.x = 1.0; 
    spoutGroup.add(spoutPipe);
    
    // Header
    const headerBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 2.4), headerMat);
    headerBase.position.set(1.0, 0.3, 0);
    chassisGroup.add(headerBase);
    
    const reelGroup = new THREE.Group();
    reelGroup.name = "reel_group";
    reelGroup.position.set(1.2, 0.45, 0);
    chassisGroup.add(reelGroup);
    
    const reelCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 8), metalMat);
    reelCenter.rotation.x = Math.PI / 2;
    reelGroup.add(reelCenter);
    
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 2.3), headerMat);
        blade.position.set(Math.cos(angle)*0.15, Math.sin(angle)*0.15, 0);
        blade.rotation.z = angle;
        reelGroup.add(blade);
    }
    
    const createWheel = (name, x, y, z, radius, width, hubRadius) => {
        const wGroup = new THREE.Group();
        wGroup.name = name;
        wGroup.position.set(x, y, z);
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), wheelMat);
        tire.rotation.x = Math.PI / 2;
        wGroup.add(tire);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(hubRadius, hubRadius, width + 0.02, 8), hubMat);
        hub.rotation.x = Math.PI / 2;
        wGroup.add(hub);
        return wGroup;
    };
    
    group.add(createWheel("wheel_fl", 0.4, 0.5, 0.7, 0.5, 0.3, 0.25));
    group.add(createWheel("wheel_fr", 0.4, 0.5, -0.7, 0.5, 0.3, 0.25));
    group.add(createWheel("wheel_bl", -0.6, 0.3, 0.6, 0.3, 0.2, 0.15));
    group.add(createWheel("wheel_br", -0.6, 0.3, -0.6, 0.3, 0.2, 0.15));
    
    const times = [0, 0.5, 1.0, 1.5, 2.0];
    const qW0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);
    const qW1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI);
    const qW2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 2);
    const qW3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 3);
    const qW4 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 4);
    const wRotValues = [...qW0.toArray(), ...qW1.toArray(), ...qW2.toArray(), ...qW3.toArray(), ...qW4.toArray()];
    
    const trackWFL = new THREE.QuaternionKeyframeTrack('wheel_fl.quaternion', times, wRotValues);
    const trackWFR = new THREE.QuaternionKeyframeTrack('wheel_fr.quaternion', times, wRotValues);
    const trackWBL = new THREE.QuaternionKeyframeTrack('wheel_bl.quaternion', times, wRotValues);
    const trackWBR = new THREE.QuaternionKeyframeTrack('wheel_br.quaternion', times, wRotValues);
    const trackReel = new THREE.QuaternionKeyframeTrack('reel_group.quaternion', times, wRotValues);
    
    const sTimes = [0, 1.0, 2.0];
    const qS0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    const qS1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
    const sRotValues = [...qS0.toArray(), ...qS1.toArray(), ...qS0.toArray()];
    const trackSpout = new THREE.QuaternionKeyframeTrack('spout_group.quaternion', sTimes, sRotValues);
    
    const clip = new THREE.AnimationClip('HarvesterAction', 2.0, [trackWFL, trackWFR, trackWBL, trackWBR, trackReel, trackSpout]);
    group.userData.animations = [clip];
    
    return group;
}

function createPigPen(THREE) {
    const group = new THREE.Group();
    group.name = "pigpen";
    
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
    const mudMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 1.0 });
    
    // Mud pit
    const mudPit = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 1.8), mudMat);
    mudPit.position.y = 0.025;
    group.add(mudPit);
    
    // Fences
    const fenceHGeo = new THREE.BoxGeometry(2.2, 0.1, 0.05);
    const fenceVGeo = new THREE.BoxGeometry(0.1, 0.6, 0.1);
    
    // Front and Back fences
    for (let z of [-0.9, 0.9]) {
        for (let y of [0.2, 0.4]) {
            const beam = new THREE.Mesh(fenceHGeo, wood);
            beam.position.set(0, y, z);
            group.add(beam);
        }
        for (let x of [-1.0, 0, 1.0]) {
            const post = new THREE.Mesh(fenceVGeo, wood);
            post.position.set(x, 0.3, z);
            group.add(post);
        }
    }
    
    // Side fences
    const fenceSideGeo = new THREE.BoxGeometry(0.05, 0.1, 1.8);
    for (let x of [-1.0, 1.0]) {
        for (let y of [0.2, 0.4]) {
            const beam = new THREE.Mesh(fenceSideGeo, wood);
            beam.position.set(x, y, 0);
            group.add(beam);
        }
    }
    
    // Small shelter
    const shelter = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.8), wood);
    shelter.position.set(-0.4, 0.3, -0.4);
    group.add(shelter);
    
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.9), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
    roof.position.set(-0.4, 0.6, -0.4);
    roof.rotation.x = 0.1;
    group.add(roof);

    // Mud Bubbles (Groups so we can animate scale and position if needed)
    const bubbleGeo = new THREE.SphereGeometry(0.1, 8, 8);
    
    const bubble1 = new THREE.Mesh(bubbleGeo, mudMat);
    bubble1.name = "bubble1";
    bubble1.position.set(0.5, 0.05, 0.5);
    group.add(bubble1);
    
    const bubble2 = new THREE.Mesh(bubbleGeo, mudMat);
    bubble2.name = "bubble2";
    bubble2.position.set(0.2, 0.05, 0.2);
    group.add(bubble2);
    
    // Animation: bubbles scale up and then "pop" (scale to 0)
    const times = [0, 1, 1.1, 2];
    const s0 = new THREE.Vector3(0.01, 0.01, 0.01); // practically 0
    const s1 = new THREE.Vector3(1, 1, 1);
    const s2 = new THREE.Vector3(0.01, 0.01, 0.01);
    
    // Bubble 1 animation
    const values1 = [
        ...s0.toArray(),
        ...s1.toArray(),
        ...s2.toArray(),
        ...s0.toArray()
    ];
    
    // Bubble 2 offset animation
    const times2 = [0, 0.9, 1.9, 2];
    const values2 = [
        ...s2.toArray(),
        ...s0.toArray(),
        ...s1.toArray(),
        ...s2.toArray()
    ];
    
    const track1 = new THREE.VectorKeyframeTrack('bubble1.scale', times, values1);
    const track2 = new THREE.VectorKeyframeTrack('bubble2.scale', times2, values2);
    const clip = new THREE.AnimationClip('Bubbling', 2.0, [track1, track2]);
    group.userData.animations = [clip];
    
    return group;
}

function createPickupTruck(THREE) {
    const group = new THREE.Group();
    group.name = "pickuptruck";
    
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2255cc, roughness: 0.6 }); // Blue body
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }); // Bumpers/bed liner
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xddddaa });
    const tailLightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa0000 });
    
    const chassisGroup = new THREE.Group();
    chassisGroup.name = "chassis";
    group.add(chassisGroup);
    
    // Main Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.4), bodyMat);
    cabin.position.set(0.2, 0.7, 0);
    chassisGroup.add(cabin);
    
    // Front Hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1.2), bodyMat);
    hood.position.set(1.2, 0.6, 0);
    chassisGroup.add(hood);
    
    // Truck Bed
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 1.4), bodyMat);
    bed.position.set(-1.1, 0.6, 0);
    chassisGroup.add(bed);
    
    // Bed inner liner
    const liner = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 1.2), darkMat);
    liner.position.set(-1.1, 0.65, 0);
    chassisGroup.add(liner);
    
    // Windows
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 1.2), glassMat);
    windshield.position.set(0.8, 0.8, 0);
    windshield.rotation.z = -0.3; // Slanted back
    chassisGroup.add(windshield);
    
    const backWindow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 1.2), glassMat);
    backWindow.position.set(-0.4, 0.8, 0);
    chassisGroup.add(backWindow);
    
    // Bumpers
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 1.3), darkMat);
    frontBumper.position.set(1.65, 0.45, 0);
    chassisGroup.add(frontBumper);
    
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 1.4), darkMat);
    rearBumper.position.set(-1.85, 0.45, 0);
    chassisGroup.add(rearBumper);
    
    // Headlights
    for (let z of [-0.4, 0.4]) {
        const light = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.2), lightMat);
        light.position.set(1.61, 0.65, z);
        chassisGroup.add(light);
    }
    
    // Taillights
    for (let z of [-0.6, 0.6]) {
        const tLight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.1), tailLightMat);
        tLight.position.set(-1.81, 0.65, z);
        chassisGroup.add(tLight);
    }
    
    // Wheels
    const createWheel = (name, x, y, z, radius, width) => {
        const wGroup = new THREE.Group();
        wGroup.name = name;
        wGroup.position.set(x, y, z);
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), wheelMat);
        tire.rotation.x = Math.PI / 2;
        wGroup.add(tire);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, width + 0.02, 8), hubMat);
        hub.rotation.x = Math.PI / 2;
        wGroup.add(hub);
        return wGroup;
    };
    
    group.add(createWheel("wheel_fl", 1.1, 0.35, 0.7, 0.35, 0.25));
    group.add(createWheel("wheel_fr", 1.1, 0.35, -0.7, 0.35, 0.25));
    group.add(createWheel("wheel_bl", -1.2, 0.35, 0.7, 0.35, 0.25));
    group.add(createWheel("wheel_br", -1.2, 0.35, -0.7, 0.35, 0.25));
    
    // Animation: Wheels rotating and chassis gentle suspension bounce
    const times = [0, 0.5, 1.0];
    
    const qStart = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);
    const qMid = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI);
    const qEnd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 2);
    const wRotValues = [...qStart.toArray(), ...qMid.toArray(), ...qEnd.toArray()];
    
    const trackWFL = new THREE.QuaternionKeyframeTrack('wheel_fl.quaternion', times, wRotValues);
    const trackWFR = new THREE.QuaternionKeyframeTrack('wheel_fr.quaternion', times, wRotValues);
    const trackWBL = new THREE.QuaternionKeyframeTrack('wheel_bl.quaternion', times, wRotValues);
    const trackWBR = new THREE.QuaternionKeyframeTrack('wheel_br.quaternion', times, wRotValues);
    
    const pStart = new THREE.Vector3(0, 0, 0);
    const pMid = new THREE.Vector3(0, -0.04, 0);
    const bounceValues = [...pStart.toArray(), ...pMid.toArray(), ...pStart.toArray()];
    const trackBounce = new THREE.VectorKeyframeTrack('chassis.position', times, bounceValues);
    
    const clip = new THREE.AnimationClip('TruckDrive', 1.0, [trackWFL, trackWFR, trackWBL, trackWBR, trackBounce]);
    group.userData.animations = [clip];
    
    return group;
}

function createTractor(THREE) {
    const group = new THREE.Group();
    group.name = "tractor";
    
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 });
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
    
    const chassisGroup = new THREE.Group();
    chassisGroup.name = "chassis";
    group.add(chassisGroup);
    
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.6), bodyMat);
    engine.position.set(0.6, 0.5, 0);
    chassisGroup.add(engine);
    
    const grill = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.5), engineMat);
    grill.position.set(1.0, 0.5, 0);
    chassisGroup.add(grill);
    
    const cabinBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), bodyMat);
    cabinBase.position.set(-0.2, 0.45, 0);
    chassisGroup.add(cabinBase);
    
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), bodyMat);
    roof.position.set(-0.2, 1.2, 0);
    chassisGroup.add(roof);
    
    for (let x of [-0.55, 0.15]) {
        for (let z of [-0.35, 0.35]) {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), engineMat);
            pillar.position.set(x, 0.85, z);
            chassisGroup.add(pillar);
        }
    }
    
    const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.7), glassMat);
    frontWindow.position.set(0.15, 0.85, 0);
    chassisGroup.add(frontWindow);
    
    const backWindow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.7), glassMat);
    backWindow.position.set(-0.55, 0.85, 0);
    chassisGroup.add(backWindow);
    
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), exhaustMat);
    exhaust.position.set(0.8, 1.0, 0.2);
    chassisGroup.add(exhaust);
    
    const flap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8), exhaustMat);
    flap.position.set(0.8, 1.4, 0.2);
    flap.rotation.z = 0.3;
    chassisGroup.add(flap);

    const createWheel = (name, x, y, z, radius, width, hubRadius) => {
        const wGroup = new THREE.Group();
        wGroup.name = name;
        wGroup.position.set(x, y, z);
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), wheelMat);
        tire.rotation.x = Math.PI / 2;
        wGroup.add(tire);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(hubRadius, hubRadius, width + 0.02, 8), hubMat);
        hub.rotation.x = Math.PI / 2;
        wGroup.add(hub);
        return wGroup;
    };

    group.add(createWheel("wheel_rr", -0.2, 0.4, -0.45, 0.4, 0.2, 0.2));
    group.add(createWheel("wheel_rl", -0.2, 0.4, 0.45, 0.4, 0.2, 0.2));
    group.add(createWheel("wheel_fr", 0.7, 0.25, -0.35, 0.25, 0.15, 0.12));
    group.add(createWheel("wheel_fl", 0.7, 0.25, 0.35, 0.25, 0.15, 0.12));
    
    const times = [0, 0.5, 1.0];
    const qStart = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);
    const qMid = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI);
    const qEnd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 2);
    const rotValues = [...qStart.toArray(), ...qMid.toArray(), ...qEnd.toArray()];
    
    const trackWRR = new THREE.QuaternionKeyframeTrack('wheel_rr.quaternion', times, rotValues);
    const trackWRL = new THREE.QuaternionKeyframeTrack('wheel_rl.quaternion', times, rotValues);
    const trackWFR = new THREE.QuaternionKeyframeTrack('wheel_fr.quaternion', times, rotValues);
    const trackWFL = new THREE.QuaternionKeyframeTrack('wheel_fl.quaternion', times, rotValues);
    
    const pStart = new THREE.Vector3(0, 0, 0);
    const pMid = new THREE.Vector3(0, -0.05, 0);
    const bounceValues = [...pStart.toArray(), ...pMid.toArray(), ...pStart.toArray()];
    const trackBounce = new THREE.VectorKeyframeTrack('chassis.position', times, bounceValues);
    
    const clip = new THREE.AnimationClip('TractorMove', 1.0, [trackWRR, trackWRL, trackWFR, trackWFL, trackBounce]);
    group.userData.animations = [clip];
    
    return group;
}

function createGrainTrough(THREE) {
    const group = new THREE.Group();
    group.name = "graintrough";
    
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 }); // Darker wood
    const metal = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 });
    const grain = new THREE.MeshStandardMaterial({ color: 0xd4b85c, roughness: 1.0 }); // Yellowish grain
    
    // Main Box (Trough base)
    const baseGeo = new THREE.BoxGeometry(1.6, 0.4, 0.6);
    const base = new THREE.Mesh(baseGeo, wood);
    base.position.y = 0.2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    // Legs
    for (let x of [-0.7, 0.7]) {
        for (let z of [-0.25, 0.25]) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), wood);
            leg.position.set(x, 0.15, z);
            group.add(leg);
        }
    }
    
    // Grain mound inside
    const grainMound = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.4), grain);
    grainMound.position.y = 0.4;
    group.add(grainMound);
    
    // Lid (Hinged at the back)
    const lidGroup = new THREE.Group();
    lidGroup.name = "lid_group";
    lidGroup.position.set(0, 0.4, -0.3); // Hinge position at back top edge
    
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.7), wood);
    lid.position.set(0, 0, 0.35); // Offset from hinge
    lidGroup.add(lid);
    
    // Handle on lid
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), metal);
    handle.position.set(0, 0.04, 0.65);
    lidGroup.add(handle);
    
    group.add(lidGroup);
    
    // Animation: Lid opening to reveal grain, then closing
    const times = [0, 2, 4, 6];
    
    const qClosed = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const qOpen = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -1.5); // Open back
    
    const values = [
        ...qClosed.toArray(),
        ...qOpen.toArray(),
        ...qOpen.toArray(),
        ...qClosed.toArray()
    ];
    
    const track = new THREE.QuaternionKeyframeTrack('lid_group.quaternion', times, values);
    const clip = new THREE.AnimationClip('LidCycle', 6.0, [track]);
    group.userData.animations = [clip];
    
    return group;
}

function createTractorShed(THREE) {
    const group = new THREE.Group();
    group.name = "tractorshed";
    
    const metalWall = new THREE.MeshStandardMaterial({ color: 0xa0a0a0, roughness: 0.6, metalness: 0.5 });
    const metalRoof = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.7 });
    const woodFrame = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    
    // Main Body (Open front)
    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.1), metalWall);
    backWall.position.set(0, 0.6, -0.95);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);
    
    // Side walls
    const sideWallL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.8), metalWall);
    sideWallL.position.set(-1.15, 0.6, -0.1);
    sideWallL.castShadow = true;
    sideWallL.receiveShadow = true;
    group.add(sideWallL);
    
    const sideWallR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.8), metalWall);
    sideWallR.position.set(1.15, 0.6, -0.1);
    sideWallR.castShadow = true;
    sideWallR.receiveShadow = true;
    group.add(sideWallR);
    
    // Roof (Slanted)
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 2.2), metalRoof);
    roof.position.set(0, 1.25, 0);
    roof.rotation.x = -0.1; // Slanted towards the back
    roof.castShadow = true;
    group.add(roof);
    
    // Pillars for front
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), woodFrame);
    pillarL.position.set(-1.15, 0.6, 0.8);
    group.add(pillarL);
    
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), woodFrame);
    pillarR.position.set(1.15, 0.6, 0.8);
    group.add(pillarR);
    
    // Garage Door (Rolling up)
    const doorGroup = new THREE.Group();
    doorGroup.name = "garage_door";
    doorGroup.position.set(0, 1.2, 0.8); // Top of the opening
    
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.05), metalWall);
    doorPanel.position.set(0, -0.6, 0); // Hang down from the top
    doorGroup.add(doorPanel);
    
    group.add(doorGroup);
    
    // Animation: Garage door rolling up (scaling Y and moving up)
    const times = [0, 2, 4, 6];
    
    // For scaling the door panel to simulate rolling up
    const sClosed = new THREE.Vector3(1, 1, 1);
    const sOpen = new THREE.Vector3(1, 0.1, 1); // Squished to the top
    
    const pClosed = new THREE.Vector3(0, 1.2, 0.8);
    const pOpen = new THREE.Vector3(0, 1.2, 0.8); // Position stays same, scale handles it, but need to offset panel inside group if needed.
    // Actually, scaling the group scales from its origin (top). So just scaling Y is perfect.
    
    const valuesS = [
        ...sClosed.toArray(),
        ...sOpen.toArray(),
        ...sOpen.toArray(),
        ...sClosed.toArray()
    ];
    
    const trackS = new THREE.VectorKeyframeTrack('garage_door.scale', times, valuesS);
    const clip = new THREE.AnimationClip('OpenDoor', 6.0, [trackS]);
    group.userData.animations = [clip];
    
    return group;
}

function createBarn(THREE) {
    const group = new THREE.Group();
    group.name = "barn";
    
    const redWood = new THREE.MeshStandardMaterial({ color: 0xaa2222, roughness: 0.9 });
    const whiteWood = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 });
    const darkRoof = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    
    // Main Body
    const bodyGeo = new THREE.BoxGeometry(2.4, 1.4, 2.0);
    const body = new THREE.Mesh(bodyGeo, redWood);
    body.position.y = 0.7;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Roof (Gambrel style using intersecting boxes/cylinders for simplicity, or just a large pitched roof)
    const roofBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 2.2), darkRoof);
    roofBase.position.y = 1.45;
    group.add(roofBase);
    
    const roofPeakGeo = new THREE.CylinderGeometry(1.3, 1.3, 2.2, 4);
    const roofPeak = new THREE.Mesh(roofPeakGeo, darkRoof);
    roofPeak.rotation.z = Math.PI / 4;
    roofPeak.rotation.x = Math.PI / 2;
    roofPeak.position.y = 1.45;
    roofPeak.scale.set(1, 1, 0.6);
    roofPeak.castShadow = true;
    group.add(roofPeak);
    
    // Front Trim (White X pattern and borders)
    const trimTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.05), whiteWood);
    trimTop.position.set(0, 1.35, 1.01);
    group.add(trimTop);
    
    // Barn Doors (Double doors opening outward)
    // Left Door
    const doorGroupL = new THREE.Group();
    doorGroupL.name = "door_l";
    doorGroupL.position.set(-0.4, 0.6, 1.01); // Hinge position
    
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 0.05), whiteWood);
    doorL.position.set(0.2, 0, 0); // Offset to hinge
    
    // X pattern on door L
    const x1L = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.06), redWood);
    x1L.position.set(0.2, 0, 0);
    x1L.rotation.z = 0.6;
    doorL.add(x1L);
    const x2L = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.06), redWood);
    x2L.position.set(0.2, 0, 0);
    x2L.rotation.z = -0.6;
    doorL.add(x2L);
    
    doorGroupL.add(doorL);
    group.add(doorGroupL);
    
    // Right Door
    const doorGroupR = new THREE.Group();
    doorGroupR.name = "door_r";
    doorGroupR.position.set(0.4, 0.6, 1.01); // Hinge position
    
    const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 0.05), whiteWood);
    doorR.position.set(-0.2, 0, 0); // Offset to hinge
    
    // X pattern on door R
    const x1R = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.06), redWood);
    x1R.position.set(-0.2, 0, 0);
    x1R.rotation.z = 0.6;
    doorR.add(x1R);
    const x2R = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.06), redWood);
    x2R.position.set(-0.2, 0, 0);
    x2R.rotation.z = -0.6;
    doorR.add(x2R);
    
    doorGroupR.add(doorR);
    group.add(doorGroupR);
    
    // Hayloft Door (Top)
    const loftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.05), whiteWood);
    loftDoor.position.set(0, 1.7, 1.01);
    group.add(loftDoor);
    
    // Animation: Double doors opening to let animals in/out
    const times = [0, 2, 4, 6];
    
    const qLClosed = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    const qLOpen = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 2.0); // Open outwards
    
    const qRClosed = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    const qROpen = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -2.0);
    
    const valuesL = [
        ...qLClosed.toArray(),
        ...qLOpen.toArray(),
        ...qLOpen.toArray(),
        ...qLClosed.toArray()
    ];
    
    const valuesR = [
        ...qRClosed.toArray(),
        ...qROpen.toArray(),
        ...qROpen.toArray(),
        ...qRClosed.toArray()
    ];
    
    const trackL = new THREE.QuaternionKeyframeTrack('door_l.quaternion', times, valuesL);
    const trackR = new THREE.QuaternionKeyframeTrack('door_r.quaternion', times, valuesR);
    const clip = new THREE.AnimationClip('DoorsOpen', 6.0, [trackL, trackR]);
    group.userData.animations = [clip];
    
    return group;
}

function createDogHouse(THREE) {
    const group = new THREE.Group();
    group.name = "doghouse";
    
    const wood = new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.9 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.95 });
    const redWood = new THREE.MeshStandardMaterial({ color: 0xb22222, roughness: 0.8 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    
    // Main Body
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 1.0);
    const body = new THREE.Mesh(bodyGeo, wood);
    body.position.y = 0.3;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Roof
    const roofBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 1.1), darkWood);
    roofBase.position.y = 0.6;
    group.add(roofBase);
    
    const roofPeak = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.1, 3), redWood);
    roofPeak.rotation.z = Math.PI / 2;
    roofPeak.rotation.x = Math.PI / 2;
    roofPeak.position.y = 0.6;
    roofPeak.scale.set(1, 1, 0.6);
    roofPeak.castShadow = true;
    group.add(roofPeak);
    
    // Door Opening Cutout (represented by a black box)
    const doorHole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), new THREE.MeshStandardMaterial({color: 0x000000}));
    doorHole.position.set(0, 0.25, 0.51);
    group.add(doorHole);
    
    // Door Flap (Swinging)
    const flapGroup = new THREE.Group();
    flapGroup.name = "flap_group";
    flapGroup.position.set(0, 0.45, 0.52); // Hinge position at the top
    
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.02), rubber);
    flap.position.y = -0.19; // Hang down from hinge
    flapGroup.add(flap);
    
    group.add(flapGroup);
    
    // Dog bowl outside
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.06, 12), rubber);
    bowl.position.set(0.3, 0.03, 0.6);
    group.add(bowl);
    
    // Animation: Flap swinging as if dog goes in/out or wind blows
    const times = [0, 1, 2, 3, 4];
    
    const qRest = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const qIn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.5);
    const qOut = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    
    const values = [
        ...qRest.toArray(),
        ...qIn.toArray(),
        ...qRest.toArray(),
        ...qOut.toArray(),
        ...qRest.toArray()
    ];
    
    const track = new THREE.QuaternionKeyframeTrack('flap_group.quaternion', times, values);
    const clip = new THREE.AnimationClip('Swing', 4.0, [track]);
    group.userData.animations = [clip];
    
    return group;
}

function createChickenCoop(THREE) {
    const group = new THREE.Group();
    group.name = "chickencoop";
    
    const wood = new THREE.MeshStandardMaterial({ color: 0xcdaa7d, roughness: 0.9 });
    const redWood = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.9 });
    const straw = new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 1.0 });
    const wire = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, wireframe: true });
    
    // Main Body (Raised box)
    const bodyGeo = new THREE.BoxGeometry(1.2, 0.8, 1.0);
    const body = new THREE.Mesh(bodyGeo, wood);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Legs
    for (let x of [-0.55, 0.55]) {
        for (let z of [-0.45, 0.45]) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), wood);
            leg.position.set(x, 0.3, z);
            leg.castShadow = true;
            group.add(leg);
        }
    }
    
    // Roof
    const roofBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 1.2), redWood);
    roofBase.position.y = 1.0;
    group.add(roofBase);
    
    const roofPeak = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 3), redWood);
    roofPeak.rotation.z = Math.PI / 2;
    roofPeak.rotation.x = Math.PI / 2;
    roofPeak.position.y = 1.0;
    roofPeak.scale.set(1, 1, 0.5);
    roofPeak.castShadow = true;
    group.add(roofPeak);
    
    // Nesting Box (side attachment)
    const nestGeo = new THREE.BoxGeometry(0.4, 0.4, 0.8);
    const nest = new THREE.Mesh(nestGeo, wood);
    nest.position.set(0.8, 0.5, 0);
    nest.castShadow = true;
    group.add(nest);
    
    const nestRoof = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.9), redWood);
    nestRoof.position.set(0.85, 0.75, 0);
    nestRoof.rotation.z = -0.3;
    group.add(nestRoof);
    
    // Ramp
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.8), wood);
    ramp.position.set(-0.75, 0.3, 0);
    ramp.rotation.z = 0.6;
    ramp.castShadow = true;
    group.add(ramp);
    
    // Door (Hinged to swing open/close)
    const doorGroup = new THREE.Group();
    doorGroup.name = "door_group";
    doorGroup.position.set(-0.6, 0.6, -0.2); // Hinge position
    
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.4), wood);
    door.position.set(0, 0, 0.2); // Offset from hinge
    doorGroup.add(door);
    group.add(doorGroup);
    
    // Straw pile on ground
    const strawPile = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.1, 8), straw);
    strawPile.position.set(0, 0.05, 0);
    group.add(strawPile);
    
    // Animation: Door opens in the morning, closes at night (simulated as repeating)
    const times = [0, 1.5, 3.0, 4.5, 6.0];
    
    const qClosed = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    const qOpen = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    
    const values = [
        ...qClosed.toArray(),
        ...qOpen.toArray(), // Open
        ...qOpen.toArray(), // Stay open
        ...qClosed.toArray(), // Close
        ...qClosed.toArray()
    ];
    
    const track = new THREE.QuaternionKeyframeTrack('door_group.quaternion', times, values);
    const clip = new THREE.AnimationClip('DoorCycle', 6.0, [track]);
    group.userData.animations = [clip];
    
    return group;
}

function createGreenhouse(THREE) {
    const group = new THREE.Group();
    group.name = "greenhouse";
    
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4, roughness: 0.1, metalness: 0.5 });
    const green = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.9 });
    
    // Frame base
    const baseFrame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.5), wood);
    baseFrame.position.y = 0.05;
    group.add(baseFrame);
    
    // Walls (Glass panels)
    const wallGeo = new THREE.BoxGeometry(1.9, 0.8, 1.4);
    const walls = new THREE.Mesh(wallGeo, glass);
    walls.position.y = 0.5;
    group.add(walls);
    
    // Corner pillars
    for (let x of [-0.95, 0.95]) {
        for (let z of [-0.7, 0.7]) {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), wood);
            pillar.position.set(x, 0.5, z);
            group.add(pillar);
        }
    }
    
    // Roof Frame
    const roofFrame = new THREE.Group();
    roofFrame.position.y = 1.0;
    
    const triangleGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 3);
    triangleGeo.rotateZ(Math.PI / 2);
    triangleGeo.rotateX(Math.PI / 2);
    
    const gableF = new THREE.Mesh(triangleGeo, wood);
    gableF.position.set(0, 0.2, 0.7);
    gableF.scale.set(1.9, 1, 0.4);
    roofFrame.add(gableF);
    
    const gableB = new THREE.Mesh(triangleGeo, wood);
    gableB.position.set(0, 0.2, -0.7);
    gableB.scale.set(1.9, 1, 0.4);
    roofFrame.add(gableB);
    
    group.add(roofFrame);
    
    // Roof Windows (Opening and closing)
    const windowGroupL = new THREE.Group();
    windowGroupL.name = "window_l";
    windowGroupL.position.set(0, 1.4, 0); // Ridge line
    
    const windowL = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.8), glass);
    windowL.position.set(0, -0.2, -0.35);
    windowL.rotation.x = 0.4;
    windowGroupL.add(windowL);
    group.add(windowGroupL);
    
    const windowGroupR = new THREE.Group();
    windowGroupR.name = "window_r";
    windowGroupR.position.set(0, 1.4, 0); // Ridge line
    
    const windowR = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.8), glass);
    windowR.position.set(0, -0.2, 0.35);
    windowR.rotation.x = -0.4;
    windowGroupR.add(windowR);
    group.add(windowGroupR);
    
    // Plants inside
    for (let i = 0; i < 4; i++) {
        const plant = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.05, 0.3, 5), green);
        plant.position.set((Math.random() - 0.5) * 1.5, 0.25, (Math.random() - 0.5) * 1.0);
        group.add(plant);
    }
    
    // Animation: Windows opening for ventilation
    const times = [0, 2, 4];
    
    const qLClosed = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const qLOpen = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);
    
    const qRClosed = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const qROpen = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    
    const valuesL = [
        ...qLClosed.toArray(),
        ...qLOpen.toArray(),
        ...qLClosed.toArray()
    ];
    
    const valuesR = [
        ...qRClosed.toArray(),
        ...qROpen.toArray(),
        ...qRClosed.toArray()
    ];
    
    const trackL = new THREE.QuaternionKeyframeTrack('window_l.quaternion', times, valuesL);
    const trackR = new THREE.QuaternionKeyframeTrack('window_r.quaternion', times, valuesR);
    
    const clip = new THREE.AnimationClip('Ventilate', 4.0, [trackL, trackR]);
    group.userData.animations = [clip];
    
    return group;
}

function createWaterWell(THREE) {
    const group = new THREE.Group();
    group.name = "waterwell";
    
    const stone = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 1.0 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });
    
    // Base ring (Stone wall)
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.6, 12, 1, true);
    const base = new THREE.Mesh(baseGeo, stone);
    base.position.y = 0.3;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    const innerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 12, 1, true), stone);
    innerBase.position.y = 0.3;
    group.add(innerBase);
    
    // Roof supports
    const supportL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.1), wood);
    supportL.position.set(-0.45, 0.7, 0);
    supportL.castShadow = true;
    group.add(supportL);
    
    const supportR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.1), wood);
    supportR.position.set(0.45, 0.7, 0);
    supportR.castShadow = true;
    group.add(supportR);
    
    // Roof
    const roofBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 1.2), wood);
    roofBase.position.y = 1.4;
    group.add(roofBase);
    
    const roofPeak = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.5, 4), wood);
    roofPeak.rotation.y = Math.PI / 4;
    roofPeak.position.y = 1.65;
    roofPeak.castShadow = true;
    group.add(roofPeak);
    
    // Winch cylinder
    const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8), wood);
    winch.rotation.z = Math.PI / 2;
    winch.position.set(0, 1.1, 0);
    group.add(winch);
    
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), wood);
    handle.position.set(0.5, 1.2, 0);
    group.add(handle);
    
    // Bucket Group (Moving up and down)
    const bucketGroup = new THREE.Group();
    bucketGroup.name = "bucket_group";
    bucketGroup.position.set(0, 0.8, 0);
    
    // Rope (Scaling/moving to simulate rolling)
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 4), ropeMat);
    rope.position.y = 0.5; // Offset to scale properly
    bucketGroup.add(rope);
    
    // Bucket
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.3, 8), wood);
    bucket.position.y = 0;
    bucket.castShadow = true;
    bucketGroup.add(bucket);
    
    const bucketHandle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 4, 8, Math.PI), metal);
    bucketHandle.position.y = 0.15;
    bucketGroup.add(bucketHandle);
    
    group.add(bucketGroup);
    
    // Animation: Bucket goes down, then up
    const times = [0, 2.0, 4.0];
    
    const pStart = new THREE.Vector3(0, 0.8, 0);
    const pMid = new THREE.Vector3(0, 0.1, 0); // Down into the well
    
    const values = [
        ...pStart.toArray(),
        ...pMid.toArray(),
        ...pStart.toArray()
    ];
    
    const track = new THREE.VectorKeyframeTrack('bucket_group.position', times, values);
    const clip = new THREE.AnimationClip('DrawWater', 4.0, [track]);
    group.userData.animations = [clip];
    
    return group;
}

function createSilo(THREE) {
    const group = new THREE.Group();
    group.name = "silo";
    
    const metal = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.4, metalness: 0.8 });
    const redMetal = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.6, metalness: 0.5 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
    
    // Main body (Tall cylinder)
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.0, 16);
    const body = new THREE.Mesh(bodyGeo, metal);
    body.position.y = 1.0;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Roof (Dome/Cone)
    const roofGeo = new THREE.ConeGeometry(0.55, 0.4, 16);
    const roof = new THREE.Mesh(roofGeo, redMetal);
    roof.position.y = 2.2;
    roof.castShadow = true;
    group.add(roof);
    
    // Pipes / Details
    const pipeGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.0, 8);
    const pipe = new THREE.Mesh(pipeGeo, darkMetal);
    pipe.position.set(0.52, 1.0, 0);
    group.add(pipe);
    
    // Wind vane group (rotating)
    const vaneGroup = new THREE.Group();
    vaneGroup.name = "vane_group";
    vaneGroup.position.set(0, 2.45, 0);
    
    const vanePole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), darkMetal);
    vaneGroup.add(vanePole);
    
    const vaneArrowGeo = new THREE.BoxGeometry(0.2, 0.04, 0.02);
    const vaneArrow = new THREE.Mesh(vaneArrowGeo, redMetal);
    vaneArrow.position.y = 0.1;
    vaneGroup.add(vaneArrow);
    
    const vaneTailGeo = new THREE.BoxGeometry(0.08, 0.1, 0.01);
    const vaneTail = new THREE.Mesh(vaneTailGeo, redMetal);
    vaneTail.position.set(-0.1, 0.1, 0);
    vaneGroup.add(vaneTail);
    
    group.add(vaneGroup);
    
    // Animation: Wind vane spinning with the wind
    const times = [0, 1.5, 3];
    
    const qStart = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    const qMid = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    const qEnd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 2);
    
    const values = [
        ...qStart.toArray(),
        ...qMid.toArray(),
        ...qEnd.toArray()
    ];
    
    const track = new THREE.QuaternionKeyframeTrack('vane_group.quaternion', times, values);
    const clip = new THREE.AnimationClip('Spin', 3.0, [track]);
    group.userData.animations = [clip];
    
    return group;
}

function createWindmill(THREE) {
    const group = new THREE.Group();
    group.name = "windmill";
    
    const stone = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
    const whiteWood = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 });
    
    // Base tower (Hexagonal prism)
    const baseGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 6);
    const base = new THREE.Mesh(baseGeo, stone);
    base.position.y = 0.6;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    // Roof (Cone)
    const roofGeo = new THREE.ConeGeometry(0.35, 0.4, 6);
    const roof = new THREE.Mesh(roofGeo, wood);
    roof.position.y = 1.4;
    roof.castShadow = true;
    group.add(roof);
    
    // Rotor/Blades group
    const rotor = new THREE.Group();
    rotor.name = "rotor";
    rotor.position.set(0, 1.2, 0.35); // Front of the roof
    
    const hub = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), wood);
    rotor.add(hub);
    
    // 4 blades
    for (let i = 0; i < 4; i++) {
        const bladeGroup = new THREE.Group();
        bladeGroup.rotation.z = (Math.PI / 2) * i;
        
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.04), wood);
        arm.position.y = 0.4;
        bladeGroup.add(arm);
        
        const sail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.02), whiteWood);
        sail.position.set(0.1, 0.45, 0);
        bladeGroup.add(sail);
        
        rotor.add(bladeGroup);
    }
    
    group.add(rotor);
    
    // Animation: Rotating blades
    const times = [0, 1, 2];
    
    const qStart = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);
    const qMid = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
    const qEnd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 2);
    
    const values = [
        ...qStart.toArray(),
        ...qMid.toArray(),
        ...qEnd.toArray()
    ];
    
    const track = new THREE.QuaternionKeyframeTrack('rotor.quaternion', times, values);
    const clip = new THREE.AnimationClip('Spin', 2.0, [track]);
    group.userData.animations = [clip];
    
    return group;
}

function createRabbit(THREE) {
    const group = new THREE.Group();
    group.name = "rabbit";
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pink = new THREE.MeshStandardMaterial({ color: 0xffb6c1 });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.15), white);
    body.position.y = 0.12;
    group.add(body);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.2, 0.1);
    
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), white);
    headGroup.add(head);

    // Ears
    const earGeo = new THREE.BoxGeometry(0.02, 0.08, 0.02);
    const earL = new THREE.Mesh(earGeo, white);
    earL.position.set(-0.02, 0.08, 0);
    headGroup.add(earL);

    const earR = new THREE.Mesh(earGeo, white);
    earR.position.set(0.02, 0.08, 0);
    headGroup.add(earR);

    // Facial Features
    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.01, 0.01, 0.01);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.02, 0.01, 0.04);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.02, 0.01, 0.04);
    headGroup.add(eyeR);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), pink);
    nose.position.set(0, -0.01, 0.045);
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 0.01), black);
    mouth.position.set(0, -0.025, 0.04);
    headGroup.add(mouth);

    group.add(headGroup);

    // Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), white);
    tail.position.set(0, 0.15, -0.09);
    group.add(tail);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 4);
    
    const legFL = new THREE.Mesh(legGeo, white);
    legFL.name = "leg_fl";
    legFL.position.set(-0.03, 0.04, 0.05);
    group.add(legFL);

    const legFR = new THREE.Mesh(legGeo, white);
    legFR.name = "leg_fr";
    legFR.position.set(0.03, 0.04, 0.05);
    group.add(legFR);

    const legBL = new THREE.Mesh(legGeo, white);
    legBL.name = "leg_bl";
    legBL.position.set(-0.03, 0.04, -0.05);
    group.add(legBL);

    const legBR = new THREE.Mesh(legGeo, white);
    legBR.name = "leg_br";
    legBR.position.set(0.03, 0.04, -0.05);
    group.add(legBR);

    // Animation: Hop/Walk
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    const qForward = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.4);
    const qBackward = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.4);
    const qIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const valuesFront = [
        ...qIdle.toArray(),
        ...qForward.toArray(),
        ...qIdle.toArray(),
        ...qBackward.toArray(),
        ...qIdle.toArray()
    ];
    
    const valuesBack = [
        ...qIdle.toArray(),
        ...qBackward.toArray(),
        ...qIdle.toArray(),
        ...qForward.toArray(),
        ...qIdle.toArray()
    ];

    const trackFL = new THREE.QuaternionKeyframeTrack('leg_fl.quaternion', times, valuesFront);
    const trackFR = new THREE.QuaternionKeyframeTrack('leg_fr.quaternion', times, valuesFront);
    const trackBL = new THREE.QuaternionKeyframeTrack('leg_bl.quaternion', times, valuesBack);
    const trackBR = new THREE.QuaternionKeyframeTrack('leg_br.quaternion', times, valuesBack);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackFL, trackFR, trackBL, trackBR]);
    group.userData.animations = [clip];

    return group;
}

function createCat(THREE) {
    const group = new THREE.Group();
    group.name = "cat";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffa500 }); // Orange cat
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const pink = new THREE.MeshStandardMaterial({ color: 0xff69b4 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.2), skin);
    body.position.y = 0.15;
    group.add(body);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.25, 0.12);
    
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), skin);
    headGroup.add(head);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.02, 0.04, 4);
    const earL = new THREE.Mesh(earGeo, skin);
    earL.position.set(-0.03, 0.07, 0);
    headGroup.add(earL);
    
    const earR = new THREE.Mesh(earGeo, skin);
    earR.position.set(0.03, 0.07, 0);
    headGroup.add(earR);

    // Facial Features
    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.01);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.025, 0.01, 0.05);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.025, 0.01, 0.05);
    headGroup.add(eyeR);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), pink);
    nose.position.set(0, -0.01, 0.055);
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 0.01), black);
    mouth.position.set(0, -0.03, 0.05);
    headGroup.add(mouth);

    group.add(headGroup);

    // Tail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.15, 4), skin);
    tail.position.set(0, 0.18, -0.15);
    tail.rotation.x = -Math.PI / 4;
    group.add(tail);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 4);
    
    const legFL = new THREE.Mesh(legGeo, white);
    legFL.name = "leg_fl";
    legFL.position.set(-0.04, 0.05, 0.08);
    group.add(legFL);

    const legFR = new THREE.Mesh(legGeo, white);
    legFR.name = "leg_fr";
    legFR.position.set(0.04, 0.05, 0.08);
    group.add(legFR);

    const legBL = new THREE.Mesh(legGeo, white);
    legBL.name = "leg_bl";
    legBL.position.set(-0.04, 0.05, -0.08);
    group.add(legBL);

    const legBR = new THREE.Mesh(legGeo, white);
    legBR.name = "leg_br";
    legBR.position.set(0.04, 0.05, -0.08);
    group.add(legBR);

    // Animation: Walk
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    const qForward = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);
    const qBackward = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    const qIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const valuesFL = [
        ...qIdle.toArray(),
        ...qForward.toArray(),
        ...qIdle.toArray(),
        ...qBackward.toArray(),
        ...qIdle.toArray()
    ];
    const valuesFR = [
        ...qIdle.toArray(),
        ...qBackward.toArray(),
        ...qIdle.toArray(),
        ...qForward.toArray(),
        ...qIdle.toArray()
    ];
    // Back legs opposite to front legs
    const valuesBL = valuesFR;
    const valuesBR = valuesFL;

    const trackFL = new THREE.QuaternionKeyframeTrack('leg_fl.quaternion', times, valuesFL);
    const trackFR = new THREE.QuaternionKeyframeTrack('leg_fr.quaternion', times, valuesFR);
    const trackBL = new THREE.QuaternionKeyframeTrack('leg_bl.quaternion', times, valuesBL);
    const trackBR = new THREE.QuaternionKeyframeTrack('leg_br.quaternion', times, valuesBR);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackFL, trackFR, trackBL, trackBR]);
    group.userData.animations = [clip];

    return group;
}

function createGoose(THREE) {
    const group = new THREE.Group();
    group.name = "goose";
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const orange = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.16), white);
    body.position.y = 0.15;
    group.add(body);

    // Neck & Head
    const neckHeadGroup = new THREE.Group();
    neckHeadGroup.position.set(0, 0.2, 0.08);

    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), white);
    neck.position.set(0, 0.06, 0);
    neckHeadGroup.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.08), white);
    head.position.set(0, 0.15, 0.02);
    neckHeadGroup.add(head);

    // Beak
    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.06), orange);
    beak.position.set(0, 0.14, 0.09);
    neckHeadGroup.add(beak);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.01, 0.01, 0.01);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.031, 0.16, 0.04);
    neckHeadGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.031, 0.16, 0.04);
    neckHeadGroup.add(eyeR);

    // Nostrils
    const nostrilGeo = new THREE.BoxGeometry(0.005, 0.005, 0.005);
    const nostrilL = new THREE.Mesh(nostrilGeo, black);
    nostrilL.position.set(-0.01, 0.145, 0.12);
    neckHeadGroup.add(nostrilL);

    const nostrilR = new THREE.Mesh(nostrilGeo, black);
    nostrilR.position.set(0.01, 0.145, 0.12);
    neckHeadGroup.add(nostrilR);

    group.add(neckHeadGroup);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 4);
    const legL = new THREE.Mesh(legGeo, orange);
    legL.name = "leg_l";
    legL.position.set(-0.03, 0.05, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, orange);
    legR.name = "leg_r";
    legR.position.set(0.03, 0.05, 0);
    group.add(legR);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.02, 0.08, 0.12);
    const wingL = new THREE.Mesh(wingGeo, white);
    wingL.name = "wing_l";
    wingL.position.set(-0.07, 0.16, 0);
    group.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, white);
    wingR.name = "wing_r";
    wingR.position.set(0.07, 0.16, 0);
    group.add(wingR);

    // Animation: Walk and Wing Flap
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    // Legs
    const qForward = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.4);
    const qBackward = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.4);
    const qIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const valuesL = [
        ...qIdle.toArray(),
        ...qForward.toArray(),
        ...qIdle.toArray(),
        ...qBackward.toArray(),
        ...qIdle.toArray()
    ];
    const valuesR = [
        ...qIdle.toArray(),
        ...qBackward.toArray(),
        ...qIdle.toArray(),
        ...qForward.toArray(),
        ...qIdle.toArray()
    ];

    const trackLegL = new THREE.QuaternionKeyframeTrack('leg_l.quaternion', times, valuesL);
    const trackLegR = new THREE.QuaternionKeyframeTrack('leg_r.quaternion', times, valuesR);

    // Wings Flap
    const qWingUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.3);
    const qWingDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.3);
    const qWingIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);
    const qWingRUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.3);
    const qWingRDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.3);

    const wingLValues = [
        ...qWingIdle.toArray(),
        ...qWingUp.toArray(),
        ...qWingIdle.toArray(),
        ...qWingDown.toArray(),
        ...qWingIdle.toArray()
    ];

    const wingRValues = [
        ...qWingIdle.toArray(),
        ...qWingRUp.toArray(),
        ...qWingIdle.toArray(),
        ...qWingRDown.toArray(),
        ...qWingIdle.toArray()
    ];

    const trackWingL = new THREE.QuaternionKeyframeTrack('wing_l.quaternion', times, wingLValues);
    const trackWingR = new THREE.QuaternionKeyframeTrack('wing_r.quaternion', times, wingRValues);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackLegL, trackLegR, trackWingL, trackWingR]);
    group.userData.animations = [clip];

    return group;
}

function createBee(THREE) {
    const group = new THREE.Group();
    group.name = "bee";
    const yellow = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });

    // Body Group
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, 0.1, 0);

    // Body segments
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), black);
    head.position.set(0, 0, 0.06);
    bodyGroup.add(head);

    // Facial features
    const eyeGeo = new THREE.BoxGeometry(0.01, 0.01, 0.01);
    const eyeL = new THREE.Mesh(eyeGeo, white);
    eyeL.position.set(-0.015, 0.01, 0.08);
    bodyGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, white);
    eyeR.position.set(0.015, 0.01, 0.08);
    bodyGroup.add(eyeR);

    // Antennae
    const antennaGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.03, 4);
    const antL = new THREE.Mesh(antennaGeo, black);
    antL.position.set(-0.01, 0.04, 0.07);
    antL.rotation.x = 0.5;
    antL.rotation.z = 0.3;
    bodyGroup.add(antL);

    const antR = new THREE.Mesh(antennaGeo, black);
    antR.position.set(0.01, 0.04, 0.07);
    antR.rotation.x = 0.5;
    antR.rotation.z = -0.3;
    bodyGroup.add(antR);

    // Thorax (Yellow)
    const thorax = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), yellow);
    thorax.position.set(0, 0, 0.01);
    bodyGroup.add(thorax);

    // Abdomen (Striped)
    const abd1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), black);
    abd1.position.set(0, 0, -0.035);
    bodyGroup.add(abd1);

    const abd2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), yellow);
    abd2.position.set(0, 0, -0.065);
    bodyGroup.add(abd2);

    const abd3 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.03), black);
    abd3.position.set(0, 0, -0.095);
    bodyGroup.add(abd3);

    // Stinger
    const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.04, 4), black);
    stinger.position.set(0, 0, -0.12);
    stinger.rotation.x = -Math.PI / 2;
    bodyGroup.add(stinger);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.08, 0.01, 0.04);
    
    const wingL = new THREE.Mesh(wingGeo, white);
    wingL.name = "wing_l";
    wingL.position.set(-0.05, 0.04, 0.01);
    bodyGroup.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, white);
    wingR.name = "wing_r";
    wingR.position.set(0.05, 0.04, 0.01);
    bodyGroup.add(wingR);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.04, 4);
    
    // Front legs
    const legFL = new THREE.Mesh(legGeo, black);
    legFL.position.set(-0.02, -0.04, 0.03);
    legFL.rotation.z = -0.2;
    bodyGroup.add(legFL);

    const legFR = new THREE.Mesh(legGeo, black);
    legFR.position.set(0.02, -0.04, 0.03);
    legFR.rotation.z = 0.2;
    bodyGroup.add(legFR);

    // Mid legs
    const legML = new THREE.Mesh(legGeo, black);
    legML.position.set(-0.02, -0.04, 0);
    legML.rotation.z = -0.2;
    bodyGroup.add(legML);

    const legMR = new THREE.Mesh(legGeo, black);
    legMR.position.set(0.02, -0.04, 0);
    legMR.rotation.z = 0.2;
    bodyGroup.add(legMR);

    // Back legs
    const legBL = new THREE.Mesh(legGeo, black);
    legBL.position.set(-0.02, -0.04, -0.03);
    legBL.rotation.z = -0.2;
    bodyGroup.add(legBL);

    const legBR = new THREE.Mesh(legGeo, black);
    legBR.position.set(0.02, -0.04, -0.03);
    legBR.rotation.z = 0.2;
    bodyGroup.add(legBR);

    group.add(bodyGroup);

    // Animation: Flying bob and wing flap
    const times = [0, 0.1, 0.2];

    // Wing flapping
    const qWingUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.5);
    const qWingDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.5);
    const qWingIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);
    
    const qWingRUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.5);
    const qWingRDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.5);

    const wingLValues = [
        ...qWingDown.toArray(),
        ...qWingUp.toArray(),
        ...qWingDown.toArray()
    ];

    const wingRValues = [
        ...qWingRDown.toArray(),
        ...qWingRUp.toArray(),
        ...qWingRDown.toArray()
    ];

    const trackWingL = new THREE.QuaternionKeyframeTrack('wing_l.quaternion', times, wingLValues);
    const trackWingR = new THREE.QuaternionKeyframeTrack('wing_r.quaternion', times, wingRValues);

    const clip = new THREE.AnimationClip('Fly', 0.2, [trackWingL, trackWingR]);
    group.userData.animations = [clip];

    return group;
}

function createCompostBin(THREE) {
    const group = new THREE.Group();
    group.name = "compostbin";
    const wood = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const dirt = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.95 });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    // Bin box
    const bin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.34, 0.55), wood);
    bin.position.y = 0.17;
    bin.castShadow = true;
    bin.receiveShadow = true;
    group.add(bin);
    
    // Compost dirt inside
    const dirtMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.48), dirt);
    dirtMesh.position.y = 0.28;
    group.add(dirtMesh);
    
    // Open lid
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.02, 0.56), wood);
    lid.position.set(0, 0.36, -0.1);
    lid.rotation.x = -0.8;
    group.add(lid);
    
    // Flies group (flying around bin)
    const flyGroup = new THREE.Group();
    flyGroup.name = "fly_group";
    const flyGeo = new THREE.BoxGeometry(0.012, 0.012, 0.012);
    for (let i = 0; i < 4; i++) {
        const fly = new THREE.Mesh(flyGeo, black);
        fly.position.set((Math.random() - 0.5) * 0.4, 0.4 + Math.random() * 0.15, (Math.random() - 0.5) * 0.4);
        flyGroup.add(fly);
    }
    group.add(flyGroup);
    
    return group;
}

function createWaterPump(THREE) {
    const group = new THREE.Group();
    group.name = "waterpump";
    const green = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.5, metalness: 0.4 });
    const silver = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const water = new THREE.MeshStandardMaterial({ color: 0x3a86c8, transparent: true, opacity: 0.7 });
    
    // Stand cylinder
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 8), green);
    stand.position.y = 0.25;
    stand.castShadow = true;
    stand.receiveShadow = true;
    group.add(stand);
    
    // Main Chamber
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8), green);
    chamber.position.y = 0.55;
    chamber.castShadow = true;
    group.add(chamber);
    
    // Spout
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.16, 6), green);
    spout.rotation.x = Math.PI / 3;
    spout.position.set(0, 0.52, 0.1);
    group.add(spout);
    
    // Catch Basin
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8), silver);
    basin.position.set(0, 0.04, 0.18);
    basin.castShadow = true;
    group.add(basin);
    
    // Pump Handle (rocking animation)
    const handleGroup = new THREE.Group();
    handleGroup.name = "pump_handle";
    handleGroup.position.set(0, 0.65, -0.06);
    
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.44), silver);
    handle.position.z = -0.18;
    handle.rotation.x = 0.1;
    handle.castShadow = true;
    handleGroup.add(handle);
    group.add(handleGroup);
    
    // Water spray particle
    const waterSpray = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), water);
    waterSpray.name = "water_spray";
    waterSpray.position.set(0, 0.32, 0.18);
    group.add(waterSpray);
    
    return group;
}

function createBeehive(THREE) {
    const group = new THREE.Group();
    group.name = "beehive";
    const pastel = new THREE.MeshStandardMaterial({ color: 0xfff8dc, roughness: 0.8 }); // Cream
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const black = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const yellow = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    
    // Stands
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.38), wood);
    stand.position.y = 0.05;
    group.add(stand);
    
    // Hive boxes stacked
    const hive1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.32), pastel);
    hive1.position.y = 0.2;
    hive1.castShadow = true;
    hive1.receiveShadow = true;
    group.add(hive1);
    
    const hive2 = hive1.clone();
    hive2.position.y = 0.4;
    group.add(hive2);
    
    // Slot entrance
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.02), black);
    slot.position.set(0, 0.12, 0.161);
    group.add(slot);
    
    // Bees flying group
    const beeGroup = new THREE.Group();
    beeGroup.name = "bee_group";
    const beeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.02);
    for (let i = 0; i < 4; i++) {
        const bee = new THREE.Mesh(beeGeo, yellow);
        bee.position.set((Math.random() - 0.5) * 0.6, 0.3 + Math.random() * 0.3, (Math.random() - 0.5) * 0.6);
        beeGroup.add(bee);
    }
    group.add(beeGroup);
    
    return group;
}

function createToolShed(THREE) {
    const group = new THREE.Group();
    group.name = "toolshed";
    const wood = new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.85 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.7 });
    
    // Main shed box
    const shed = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.72, 0.65), wood);
    shed.position.y = 0.36;
    shed.castShadow = true;
    shed.receiveShadow = true;
    group.add(shed);
    
    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.75), darkWood);
    roof.position.y = 0.74;
    roof.rotation.x = 0.08;
    roof.castShadow = true;
    group.add(roof);
    
    // Door Sway (hinged door)
    const doorSway = new THREE.Group();
    doorSway.name = "door_sway";
    doorSway.position.set(-0.25, 0.32, 0.326); // Pivot at the side
    
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.5, 0.02), darkWood);
    doorMesh.position.x = 0.12; // offset so hinge is at 0
    doorMesh.castShadow = true;
    doorSway.add(doorMesh);
    
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 4), metal);
    handle.position.set(0.2, 0, 0.02);
    doorSway.add(handle);
    
    group.add(doorSway);
    return group;
}

function createWoodpile(THREE) {
    const group = new THREE.Group();
    group.name = "woodpile";
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, metalness: 0.8, roughness: 0.2 });
    
    // Pile of logs (stacked cylinders)
    const logGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 6);
    logGeo.rotateX(Math.PI / 2);
    
    // Stack structure
    const logCoords = [
        [-0.18, 0.06, 0], [0, 0.06, 0], [0.18, 0.06, 0],
        [-0.09, 0.15, 0], [0.09, 0.15, 0],
        [0, 0.24, 0]
    ];
    logCoords.forEach((coord, idx) => {
        const log = new THREE.Mesh(logGeo, wood);
        log.position.set(coord[0], coord[1], coord[2]);
        log.castShadow = true;
        log.receiveShadow = true;
        group.add(log);
    });
    
    // Chopping block
    const block = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 8), wood);
    block.position.set(0.3, 0.09, 0.1);
    block.castShadow = true;
    group.add(block);
    
    // Axe (swing animation)
    const axeGroup = new THREE.Group();
    axeGroup.name = "axe";
    axeGroup.position.set(0.3, 0.28, 0.1);
    
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.24, 0.03), wood);
    handle.position.y = 0.08;
    handle.rotation.z = -0.3;
    axeGroup.add(handle);
    
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), metal);
    blade.position.set(-0.04, 0.18, 0);
    axeGroup.add(blade);
    
    group.add(axeGroup);
    return group;
}

// =================== NPCS ===================
function createFarmer(THREE) {
    const group = new THREE.Group();
    group.name = "farmer";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4, roughness: 0.6 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x1e88e5 });
    const black = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const straw = new THREE.MeshStandardMaterial({ color: 0xffe082, roughness: 0.9 });
    
    // Legs & Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.12), blue);
    body.position.y = 0.36;
    body.castShadow = true;
    group.add(body);
    
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6);
    for (let x of [-0.06, 0.06]) {
        const leg = new THREE.Mesh(legGeo, black);
        leg.position.set(x, 0.1, 0);
        group.add(leg);
    }
    
    // Head & Straw Hat
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skin);
    head.position.y = 0.58;
    group.add(head);
    
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.08, 8), straw);
    hat.position.set(0, 0.66, 0);
    group.add(hat);
    
    // Arm Left (swing animation)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armL.name = "arm_l";
    armL.position.set(-0.12, 0.44, 0.04);
    armL.rotation.x = -0.5;
    group.add(armL);
    
    // Arm Right (swing animation)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.12, 0.44, 0.04);
    armR.rotation.x = -0.5;
    group.add(armR);
    
    // Hoe Tool (animated with arms)
    const tool = new THREE.Group();
    tool.name = "tool";
    tool.position.set(0.06, 0.32, 0.18);
    tool.rotation.x = -0.3;
    
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.44, 6), wood);
    handle.rotation.x = Math.PI / 2;
    tool.add(handle);
    
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.06), black);
    blade.position.set(0, 0, 0.22);
    tool.add(blade);
    group.add(tool);
    
    return group;
}

function createFarmer(THREE) {
    const group = new THREE.Group();
    group.name = "farmer";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4, roughness: 0.6 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x1e88e5 });
    const black = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const straw = new THREE.MeshStandardMaterial({ color: 0xffe082, roughness: 0.9 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pink = new THREE.MeshStandardMaterial({ color: 0xffb6c1 });
    
    // Legs & Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.12), blue);
    body.position.y = 0.36;
    body.castShadow = true;
    group.add(body);
    
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6);
    
    const legL = new THREE.Mesh(legGeo, black);
    legL.name = "leg_l";
    legL.position.set(-0.06, 0.1, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, black);
    legR.name = "leg_r";
    legR.position.set(0.06, 0.1, 0);
    group.add(legR);
    
    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.58, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skin);
    headGroup.add(head);

    // Facial features
    const eyeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.03, 0.02, 0.07);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.03, 0.02, 0.07);
    headGroup.add(eyeR);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.02), skin);
    nose.position.set(0, 0, 0.075);
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), black);
    mouth.position.set(0, -0.03, 0.07);
    headGroup.add(mouth);
    
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.08, 8), straw);
    hat.position.set(0, 0.08, 0);
    headGroup.add(hat);

    group.add(headGroup);
    
    // Arm Left (swing animation)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armL.name = "arm_l";
    armL.position.set(-0.12, 0.44, 0.04);
    armL.rotation.x = -0.5;
    group.add(armL);
    
    // Arm Right (swing animation)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.12, 0.44, 0.04);
    armR.rotation.x = -0.5;
    group.add(armR);
    
    // Hoe Tool (animated with arms)
    const tool = new THREE.Group();
    tool.name = "tool";
    tool.position.set(0.06, 0.32, 0.18);
    tool.rotation.x = -0.3;
    
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.44, 6), wood);
    handle.rotation.x = Math.PI / 2;
    tool.add(handle);
    
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.06), black);
    blade.position.set(0, 0, 0.22);
    tool.add(blade);
    group.add(tool);
    
    // Animation: Walk & Hoe Swing
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    // Legs
    const qLegFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);
    const qLegBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    const qLegIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const legLValues = [
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray()
    ];
    
    const legRValues = [
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackLegL = new THREE.QuaternionKeyframeTrack('leg_l.quaternion', times, legLValues);
    const trackLegR = new THREE.QuaternionKeyframeTrack('leg_r.quaternion', times, legRValues);

    // Arms
    const qArmUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.8);
    const qArmDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.2);
    
    const armLValues = [
        ...qArmDown.toArray(),
        ...qArmUp.toArray(),
        ...qArmDown.toArray(),
        ...qArmDown.toArray(),
        ...qArmDown.toArray()
    ];

    const armRValues = [
        ...qArmDown.toArray(),
        ...qArmDown.toArray(),
        ...qArmDown.toArray(),
        ...qArmUp.toArray(),
        ...qArmDown.toArray()
    ];

    const trackArmL = new THREE.QuaternionKeyframeTrack('arm_l.quaternion', times, armLValues);
    const trackArmR = new THREE.QuaternionKeyframeTrack('arm_r.quaternion', times, armRValues);

    // Tool
    const qToolUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.6);
    const qToolDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.1);

    const toolValues = [
        ...qToolDown.toArray(),
        ...qToolDown.toArray(),
        ...qToolDown.toArray(),
        ...qToolUp.toArray(),
        ...qToolDown.toArray()
    ];

    const trackTool = new THREE.QuaternionKeyframeTrack('tool.quaternion', times, toolValues);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackLegL, trackLegR, trackArmL, trackArmR, trackTool]);
    group.userData.animations = [clip];

    return group;
}

function createMerchant(THREE) {
    const group = new THREE.Group();
    group.name = "merchant";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const gile = new THREE.MeshStandardMaterial({ color: 0x8d6e63 }); // Brown vest
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 }); // Dark brown
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    
    // Body & Legs
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.12), gile);
    body.position.y = 0.36;
    body.castShadow = true;
    group.add(body);
    
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6);
    for (let x of [-0.06, 0.06]) {
        const leg = new THREE.Mesh(legGeo, hatMat);
        leg.position.set(x, 0.1, 0);
        group.add(leg);
    }
    
    // Head (gật gù)
    const headGroup = new THREE.Group();
    headGroup.name = "head";
    headGroup.position.set(0, 0.58, 0);
    const head = new THREE.Mesh(headGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14), skin);
    headGroup.add(head);
    
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8), hatMat);
    hat.position.y = 0.08;
    headGroup.add(hat);
    group.add(headGroup);
    
    // Arm Left (holding bag)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armL.position.set(-0.12, 0.44, 0.02);
    armL.rotation.z = 0.2;
    group.add(armL);
    
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 5), gold);
    bag.position.set(-0.14, 0.28, 0.05);
    group.add(bag);
    
    // Arm Right (waving animation)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.12, 0.44, 0);
    group.add(armR);
    
    return group;
}

function createMerchant(THREE) {
    const group = new THREE.Group();
    group.name = "merchant";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const gile = new THREE.MeshStandardMaterial({ color: 0x8d6e63 }); // Brown vest
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 }); // Dark brown
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    // Body & Legs
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.12), gile);
    body.position.y = 0.36;
    body.castShadow = true;
    group.add(body);
    
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6);
    
    const legL = new THREE.Mesh(legGeo, hatMat);
    legL.name = "leg_l";
    legL.position.set(-0.06, 0.1, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, hatMat);
    legR.name = "leg_r";
    legR.position.set(0.06, 0.1, 0);
    group.add(legR);
    
    // Head (gật gù)
    const headGroup = new THREE.Group();
    headGroup.name = "head";
    headGroup.position.set(0, 0.58, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skin);
    headGroup.add(head);

    // Facial features
    const eyeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.03, 0.02, 0.07);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.03, 0.02, 0.07);
    headGroup.add(eyeR);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.02), skin);
    nose.position.set(0, 0, 0.075);
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), black);
    mouth.position.set(0, -0.03, 0.07);
    headGroup.add(mouth);
    
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8), hatMat);
    hat.position.y = 0.08;
    headGroup.add(hat);
    group.add(headGroup);
    
    // Arm Left (holding bag)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armL.position.set(-0.12, 0.44, 0.02);
    armL.rotation.z = 0.2;
    group.add(armL);
    
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 5), gold);
    bag.position.set(-0.14, 0.28, 0.05);
    group.add(bag);
    
    // Arm Right (waving animation)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.12, 0.44, 0);
    group.add(armR);

    // Animation: Walk & Wave & Nod
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    // Legs
    const qLegFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);
    const qLegBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    const qLegIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const legLValues = [
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray()
    ];
    
    const legRValues = [
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackLegL = new THREE.QuaternionKeyframeTrack('leg_l.quaternion', times, legLValues);
    const trackLegR = new THREE.QuaternionKeyframeTrack('leg_r.quaternion', times, legRValues);

    // Right Arm Waving
    const qArmWaveOut = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0, -0.6));
    const qArmWaveIn = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0, -0.2));

    const armRValues = [
        ...qArmWaveOut.toArray(),
        ...qArmWaveIn.toArray(),
        ...qArmWaveOut.toArray(),
        ...qArmWaveIn.toArray(),
        ...qArmWaveOut.toArray()
    ];

    const trackArmR = new THREE.QuaternionKeyframeTrack('arm_r.quaternion', times, armRValues);

    // Head Nodding
    const qHeadNodUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.1);
    const qHeadNodDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.1);

    const headValues = [
        ...qHeadNodDown.toArray(),
        ...qHeadNodUp.toArray(),
        ...qHeadNodDown.toArray(),
        ...qHeadNodUp.toArray(),
        ...qHeadNodDown.toArray()
    ];

    const trackHead = new THREE.QuaternionKeyframeTrack('head.quaternion', times, headValues);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackLegL, trackLegR, trackArmR, trackHead]);
    group.userData.animations = [clip];
    
    return group;
}

function createShepherd(THREE) {
    const group = new THREE.Group();
    group.name = "shepherd";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const wool = new THREE.MeshStandardMaterial({ color: 0xeeeeee }); // wool vest
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const black = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    // Body & Legs
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.12), wool);
    body.position.y = 0.36;
    group.add(body);
    
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6);
    for (let x of [-0.06, 0.06]) {
        const leg = new THREE.Mesh(legGeo, black);
        leg.position.set(x, 0.1, 0);
        group.add(leg);
    }
    
    // Head Group
    const headGroup = new THREE.Group();
    headGroup.name = "head";
    headGroup.position.set(0, 0.58, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skin);
    headGroup.add(head);
    group.add(headGroup);
    
    // Arm Left
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armL.position.set(-0.12, 0.44, 0);
    group.add(armL);
    
    // Arm Right (raises staff)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.12, 0.44, 0.02);
    armR.rotation.x = -0.6;
    group.add(armR);
    
    // Shepherd crook/gậy
    const staff = new THREE.Group();
    staff.position.set(0.14, 0.46, 0.14);
    staff.rotation.x = -0.6;
    const crook = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), wood);
    staff.add(crook);
    const bend = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 4, 8, Math.PI), wood);
    bend.position.y = 0.25;
    staff.add(bend);
    group.add(staff);
    
    return group;
}

function createShepherd(THREE) {
    const group = new THREE.Group();
    group.name = "shepherd";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const wool = new THREE.MeshStandardMaterial({ color: 0xeeeeee }); // wool vest
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const black = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    // Body & Legs
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.12), wool);
    body.position.y = 0.36;
    group.add(body);
    
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6);

    const legL = new THREE.Mesh(legGeo, black);
    legL.name = "leg_l";
    legL.position.set(-0.06, 0.1, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, black);
    legR.name = "leg_r";
    legR.position.set(0.06, 0.1, 0);
    group.add(legR);
    
    // Head Group
    const headGroup = new THREE.Group();
    headGroup.name = "head";
    headGroup.position.set(0, 0.58, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skin);
    headGroup.add(head);

    // Facial features
    const eyeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.03, 0.02, 0.07);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.03, 0.02, 0.07);
    headGroup.add(eyeR);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.02), skin);
    nose.position.set(0, 0, 0.075);
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), black);
    mouth.position.set(0, -0.03, 0.07);
    headGroup.add(mouth);

    group.add(headGroup);
    
    // Arm Left
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armL.name = "arm_l";
    armL.position.set(-0.12, 0.44, 0);
    group.add(armL);
    
    // Arm Right (raises staff)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.12, 0.44, 0.02);
    armR.rotation.x = -0.6;
    group.add(armR);
    
    // Shepherd crook/gậy
    const staff = new THREE.Group();
    staff.name = "staff";
    staff.position.set(0.14, 0.46, 0.14);
    staff.rotation.x = -0.6;
    const crook = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), wood);
    staff.add(crook);
    const bend = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 4, 8, Math.PI), wood);
    bend.position.y = 0.25;
    staff.add(bend);
    group.add(staff);
    
    // Animation: Walk
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    const qLegFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);
    const qLegBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    const qLegIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const legLValues = [
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray()
    ];
    
    const legRValues = [
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackLegL = new THREE.QuaternionKeyframeTrack('leg_l.quaternion', times, legLValues);
    const trackLegR = new THREE.QuaternionKeyframeTrack('leg_r.quaternion', times, legRValues);

    const qArmFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.2);
    const qArmBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.2);

    const armLValues = [
        ...qLegIdle.toArray(),
        ...qArmBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qArmFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackArmL = new THREE.QuaternionKeyframeTrack('arm_l.quaternion', times, armLValues);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackLegL, trackLegR, trackArmL]);
    group.userData.animations = [clip];

    return group;
}

function createBlacksmith(THREE) {
    const group = new THREE.Group();
    group.name = "blacksmith";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const apron = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.95 }); // Leather apron
    const iron = new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.8, roughness: 0.2 });
    const fire = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 2.0 });
    
    // Body & Legs
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.14), apron);
    body.position.y = 0.36;
    group.add(body);
    
    const legGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.2, 6);
    for (let x of [-0.07, 0.07]) {
        const leg = new THREE.Mesh(legGeo, iron);
        leg.position.set(x, 0.1, 0);
        group.add(leg);
    }
    
    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skin);
    head.position.y = 0.58;
    group.add(head);
    
    // Arm Left (holding item on anvil)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 5), skin);
    armL.position.set(-0.14, 0.44, 0.06);
    armL.rotation.x = -0.8;
    group.add(armL);
    
    // Arm Right (hammer hand)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.14, 0.44, 0.04);
    armR.rotation.x = -1.2;
    
    // Hammer
    const hammer = new THREE.Group();
    hammer.position.set(0, 0.12, 0.05);
    hammer.rotation.x = Math.PI / 2;
    const hStick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 4), apron);
    hammer.add(hStick);
    const hHead = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.03), iron);
    hHead.position.y = 0.08;
    hammer.add(hHead);
    armR.add(hammer);
    group.add(armR);
    
    // Anvil & Spark Group
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.14), iron);
    anvil.position.set(0, 0.11, 0.22);
    anvil.castShadow = true;
    group.add(anvil);
    
    const sparkGroup = new THREE.Group();
    sparkGroup.name = "spark_group";
    const sparkGeo = new THREE.SphereGeometry(0.015, 4, 4);
    for (let i = 0; i < 3; i++) {
        const spark = new THREE.Mesh(sparkGeo, fire);
        spark.position.set(0, 0.23, 0.22);
        sparkGroup.add(spark);
    }
    group.add(sparkGroup);
    
    return group;
}

function createBlacksmith(THREE) {
    const group = new THREE.Group();
    group.name = "blacksmith";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const apron = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.95 }); // Leather apron
    const iron = new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.8, roughness: 0.2 });
    const fire = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 2.0 });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    // Body & Legs
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.14), apron);
    body.position.y = 0.36;
    group.add(body);
    
    const legGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.2, 6);
    
    const legL = new THREE.Mesh(legGeo, iron);
    legL.name = "leg_l";
    legL.position.set(-0.07, 0.1, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, iron);
    legR.name = "leg_r";
    legR.position.set(0.07, 0.1, 0);
    group.add(legR);
    
    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.58, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skin);
    headGroup.add(head);

    // Facial features
    const eyeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.03, 0.02, 0.07);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.03, 0.02, 0.07);
    headGroup.add(eyeR);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.02), skin);
    nose.position.set(0, 0, 0.075);
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), black);
    mouth.position.set(0, -0.03, 0.07);
    headGroup.add(mouth);

    group.add(headGroup);
    
    // Arm Left (holding item on anvil)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 5), skin);
    armL.name = "arm_l";
    armL.position.set(-0.14, 0.44, 0.06);
    armL.rotation.x = -0.8;
    group.add(armL);
    
    // Arm Right (hammer hand)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.14, 0.44, 0.04);
    armR.rotation.x = -1.2;
    
    // Hammer
    const hammer = new THREE.Group();
    hammer.position.set(0, 0.12, 0.05);
    hammer.rotation.x = Math.PI / 2;
    const hStick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 4), apron);
    hammer.add(hStick);
    const hHead = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.03), iron);
    hHead.position.y = 0.08;
    hammer.add(hHead);
    armR.add(hammer);
    group.add(armR);
    
    // Anvil & Spark Group
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.14), iron);
    anvil.position.set(0, 0.11, 0.22);
    anvil.castShadow = true;
    group.add(anvil);
    
    const sparkGroup = new THREE.Group();
    sparkGroup.name = "spark_group";
    const sparkGeo = new THREE.SphereGeometry(0.015, 4, 4);
    for (let i = 0; i < 3; i++) {
        const spark = new THREE.Mesh(sparkGeo, fire);
        spark.position.set(0, 0.23, 0.22);
        sparkGroup.add(spark);
    }
    group.add(sparkGroup);
    
    // Animation: Walk & Hammer
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    // Legs
    const qLegFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);
    const qLegBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    const qLegIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const legLValues = [
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray()
    ];
    
    const legRValues = [
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackLegL = new THREE.QuaternionKeyframeTrack('leg_l.quaternion', times, legLValues);
    const trackLegR = new THREE.QuaternionKeyframeTrack('leg_r.quaternion', times, legRValues);

    // Arm Right (Hammering)
    const qArmUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -1.5);
    const qArmDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.5);

    const armRValues = [
        ...qArmDown.toArray(),
        ...qArmUp.toArray(),
        ...qArmDown.toArray(),
        ...qArmUp.toArray(),
        ...qArmDown.toArray()
    ];

    const trackArmR = new THREE.QuaternionKeyframeTrack('arm_r.quaternion', times, armRValues);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackLegL, trackLegR, trackArmR]);
    group.userData.animations = [clip];

    return group;
}

function createSeedSeller(THREE) {
    const group = new THREE.Group();
    group.name = "seedseller";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const brown = new THREE.MeshStandardMaterial({ color: 0x8d6e63 }); // Ao ba ba
    const basketMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.9 });
    const green = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
    
    // Body & Legs
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.12), brown);
    body.position.y = 0.36;
    group.add(body);
    
    const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.2, 6);
    for (let x of [-0.05, 0.05]) {
        const leg = new THREE.Mesh(legGeo, brown);
        leg.position.set(x, 0.1, 0);
        group.add(leg);
    }
    
    // Head & Hair
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), skin);
    head.position.y = 0.575;
    group.add(head);
    
    // Arm Left (holding seed tray/basket)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 5), skin);
    armL.name = "arm_l";
    armL.position.set(-0.11, 0.42, 0.08);
    armL.rotation.x = -0.8;
    armL.rotation.y = 0.3;
    group.add(armL);
    
    // Arm Right (holding basket)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.11, 0.42, 0.08);
    armR.rotation.x = -0.8;
    armR.rotation.y = -0.3;
    group.add(armR);
    
    // Seed Basket/Tray
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.06, 8), basketMat);
    tray.position.set(0, 0.38, 0.18);
    tray.castShadow = true;
    group.add(tray);
    
    const seeds = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 8), green);
    seeds.position.set(0, 0.4, 0.18);
    group.add(seeds);
    
    return group;
}

function createSeedSeller(THREE) {
    const group = new THREE.Group();
    group.name = "seedseller";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const brown = new THREE.MeshStandardMaterial({ color: 0x8d6e63 }); // Ao ba ba
    const basketMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.9 });
    const green = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    // Body & Legs
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.12), brown);
    body.position.y = 0.36;
    group.add(body);
    
    const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.2, 6);
    
    const legL = new THREE.Mesh(legGeo, brown);
    legL.name = "leg_l";
    legL.position.set(-0.05, 0.1, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, brown);
    legR.name = "leg_r";
    legR.position.set(0.05, 0.1, 0);
    group.add(legR);
    
    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.575, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), skin);
    headGroup.add(head);

    // Facial features
    const eyeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.03, 0.02, 0.065);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.03, 0.02, 0.065);
    headGroup.add(eyeR);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.02), skin);
    nose.position.set(0, 0, 0.07);
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), black);
    mouth.position.set(0, -0.03, 0.065);
    headGroup.add(mouth);

    group.add(headGroup);
    
    // Arm Left (holding seed tray/basket)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 5), skin);
    armL.name = "arm_l";
    armL.position.set(-0.11, 0.42, 0.08);
    armL.rotation.x = -0.8;
    armL.rotation.y = 0.3;
    group.add(armL);
    
    // Arm Right (holding basket)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.11, 0.42, 0.08);
    armR.rotation.x = -0.8;
    armR.rotation.y = -0.3;
    group.add(armR);
    
    // Seed Basket/Tray
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.06, 8), basketMat);
    tray.position.set(0, 0.38, 0.18);
    tray.castShadow = true;
    group.add(tray);
    
    const seeds = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 8), green);
    seeds.position.set(0, 0.4, 0.18);
    group.add(seeds);
    
    // Animation: Walk
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    const qLegFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);
    const qLegBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    const qLegIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const legLValues = [
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray()
    ];
    
    const legRValues = [
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackLegL = new THREE.QuaternionKeyframeTrack('leg_l.quaternion', times, legLValues);
    const trackLegR = new THREE.QuaternionKeyframeTrack('leg_r.quaternion', times, legRValues);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackLegL, trackLegR]);
    group.userData.animations = [clip];

    return group;
}

function createDeliveryBoy(THREE) {
    const group = new THREE.Group();
    group.name = "deliveryboy";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const red = new THREE.MeshStandardMaterial({ color: 0xe53935 }); // Red shirt/cap
    const orange = new THREE.MeshStandardMaterial({ color: 0xfb8c00 }); // Balo cam
    const blue = new THREE.MeshStandardMaterial({ color: 0x1e88e5 }); // Blue pants
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.11), red);
    body.position.y = 0.36;
    body.castShadow = true;
    group.add(body);
    
    // Balo
    const balo = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.08), orange);
    balo.position.set(0, 0.36, -0.09);
    group.add(balo);
    
    // Legs (stepping animation)
    const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 6);
    
    const legL = new THREE.Mesh(legGeo, blue);
    legL.name = "leg_l";
    legL.position.set(-0.05, 0.11, 0);
    group.add(legL);
    
    const legR = new THREE.Mesh(legGeo, blue);
    legR.name = "leg_r";
    legR.position.set(0.05, 0.11, 0);
    group.add(legR);
    
    // Head Group & Cap
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.56, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), skin);
    headGroup.add(head);
    
    // Facial features
    const eyeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.03, 0.02, 0.065);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.03, 0.02, 0.065);
    headGroup.add(eyeR);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.02), skin);
    nose.position.set(0, 0, 0.07);
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), black);
    mouth.position.set(0, -0.03, 0.065);
    headGroup.add(mouth);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.15), red);
    cap.position.set(0, 0.07, 0.02);
    headGroup.add(cap);

    group.add(headGroup);
    
    // Arms (holding newspaper)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 5), skin);
    armL.name = "arm_l";
    armL.position.set(-0.1, 0.42, 0);
    group.add(armL);
    
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.1, 0.42, 0.06);
    armR.rotation.x = -0.6;
    group.add(armR);
    
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), white);
    paper.position.set(0.11, 0.32, 0.14);
    paper.rotation.y = 0.2;
    group.add(paper);
    
    // Animation: Walk & Arm Swing
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    const qLegFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);
    const qLegBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    const qLegIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const legLValues = [
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray()
    ];
    
    const legRValues = [
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackLegL = new THREE.QuaternionKeyframeTrack('leg_l.quaternion', times, legLValues);
    const trackLegR = new THREE.QuaternionKeyframeTrack('leg_r.quaternion', times, legRValues);

    const qArmFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.2);
    const qArmBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.2);

    const armLValues = [
        ...qLegIdle.toArray(),
        ...qArmBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qArmFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackArmL = new THREE.QuaternionKeyframeTrack('arm_l.quaternion', times, armLValues);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackLegL, trackLegR, trackArmL]);
    group.userData.animations = [clip];

    return group;
}

function createGrandpa(THREE) {
    const group = new THREE.Group();
    group.name = "grandpa";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffe0bd });
    const blue = new THREE.MeshStandardMaterial({ color: 0x455a64 }); // Ao ba ba xam
    const beardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }); // Râu toc bac
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    // Body (running / shaky animation)
    const bodyGroup = new THREE.Group();
    bodyGroup.name = "body";
    bodyGroup.position.y = 0.35;
    
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.12), blue);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);
    
    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.21, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), skin);
    headGroup.add(head);

    // Facial features
    const eyeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.03, 0.02, 0.065);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.03, 0.02, 0.065);
    headGroup.add(eyeR);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.02), skin);
    nose.position.set(0, 0, 0.07);
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), black);
    mouth.position.set(0, -0.03, 0.065);
    headGroup.add(mouth);
    
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.15), beardMat);
    hair.position.set(0, 0.06, -0.02);
    headGroup.add(hair);
    
    // Beard (swing / shake animation)
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 4), beardMat);
    beard.name = "beard";
    beard.position.set(0, -0.13, 0.07);
    beard.rotation.x = -0.2;
    headGroup.add(beard);

    bodyGroup.add(headGroup);
    
    group.add(bodyGroup);
    
    // Legs
    const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.2, 6);
    
    const legL = new THREE.Mesh(legGeo, blue);
    legL.name = "leg_l";
    legL.position.set(-0.05, 0.1, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, blue);
    legR.name = "leg_r";
    legR.position.set(0.05, 0.1, 0);
    group.add(legR);
    
    // Staff/Gậy chống
    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.46, 5), wood);
    cane.name = "cane";
    cane.position.set(0.13, 0.23, 0.1);
    cane.rotation.x = 0.1;
    group.add(cane);
    
    // Animation: Walk & Shake
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    const qLegFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);
    const qLegBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    const qLegIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const legLValues = [
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray()
    ];
    
    const legRValues = [
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackLegL = new THREE.QuaternionKeyframeTrack('leg_l.quaternion', times, legLValues);
    const trackLegR = new THREE.QuaternionKeyframeTrack('leg_r.quaternion', times, legRValues);

    // Body Shake
    const qBodyLeft = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.05);
    const qBodyRight = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.05);
    const qBodyIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);

    const bodyValues = [
        ...qBodyIdle.toArray(),
        ...qBodyLeft.toArray(),
        ...qBodyIdle.toArray(),
        ...qBodyRight.toArray(),
        ...qBodyIdle.toArray()
    ];

    const trackBody = new THREE.QuaternionKeyframeTrack('body.quaternion', times, bodyValues);

    // Cane
    const qCaneFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.2);
    const qCaneBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const caneValues = [
        ...qCaneBwd.toArray(),
        ...qCaneFwd.toArray(),
        ...qCaneBwd.toArray(),
        ...qCaneFwd.toArray(),
        ...qCaneBwd.toArray()
    ];

    const trackCane = new THREE.QuaternionKeyframeTrack('cane.quaternion', times, caneValues);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackLegL, trackLegR, trackBody, trackCane]);
    group.userData.animations = [clip];

    return group;
}

function createScarecrowNPC(THREE) {
    const group = new THREE.Group();
    group.name = "scarecrow_npc";
    const straw = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.9 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0x00bcd4 });
    const patch = new THREE.MeshStandardMaterial({ color: 0xe91e63 });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const orange = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    
    // Body (jumping animation)
    const bodyGroup = new THREE.Group();
    bodyGroup.name = "body";
    bodyGroup.position.y = 0.42;
    
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.14), shirt);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);
    
    const patchMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.01), patch);
    patchMesh.position.set(0.06, 0.05, 0.071);
    bodyGroup.add(patchMesh);
    
    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.04), wood);
    crossBar.position.y = 0.1;
    bodyGroup.add(crossBar);
    
    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.22, 0);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), straw);
    headGroup.add(head);

    // Facial features
    const eyeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.03, 0.02, 0.07);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.03, 0.02, 0.07);
    headGroup.add(eyeR);

    // Nose (carrot-like)
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.04, 4), orange);
    nose.position.set(0, 0, 0.08);
    nose.rotation.x = Math.PI / 2;
    headGroup.add(nose);

    // Mouth (stitched)
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.005, 0.01), black);
    mouth.position.set(0, -0.03, 0.07);
    headGroup.add(mouth);

    bodyGroup.add(headGroup);
    
    group.add(bodyGroup);
    
    // Peg Leg (jumping leg animation)
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 6), wood);
    legL.name = "leg_l";
    legL.position.set(0, 0.14, 0);
    group.add(legL);
    
    // Animation: Jump
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    // Body Jump
    const posUp = new THREE.Vector3(0, 0.52, 0);
    const posDown = new THREE.Vector3(0, 0.42, 0);

    const bodyValues = [
        ...posDown.toArray(),
        ...posUp.toArray(),
        ...posDown.toArray(),
        ...posUp.toArray(),
        ...posDown.toArray()
    ];

    const trackBody = new THREE.VectorKeyframeTrack('body.position', times, bodyValues);

    // Leg Swing
    const qLegFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.2);
    const qLegBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.2);
    const qLegIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const legValues = [
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackLeg = new THREE.QuaternionKeyframeTrack('leg_l.quaternion', times, legValues);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackBody, trackLeg]);
    group.userData.animations = [clip];

    return group;
}

function createFisher(THREE) {
    const group = new THREE.Group();
    group.name = "fisher";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0x009688 }); // Teal shirt
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x3f51b5 }); // Float blue
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const black = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.14), shirt);
    body.position.y = 0.36;
    body.castShadow = true;
    group.add(body);
    
    // Legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6);
    
    const legL = new THREE.Mesh(legGeo, blue);
    legL.name = "leg_l";
    legL.position.set(-0.05, 0.1, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, blue);
    legR.name = "leg_r";
    legR.position.set(0.05, 0.1, 0);
    group.add(legR);
    
    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.58, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), skin);
    headGroup.add(head);

    // Facial features
    const eyeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.03, 0.02, 0.065);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.03, 0.02, 0.065);
    headGroup.add(eyeR);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.02), skin);
    nose.position.set(0, 0, 0.07);
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), black);
    mouth.position.set(0, -0.03, 0.065);
    headGroup.add(mouth);

    group.add(headGroup);

    // Arm Left
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armL.name = "arm_l";
    armL.position.set(-0.11, 0.44, 0);
    group.add(armL);
    
    // Arm Right (holding rod)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.11, 0.44, 0.06);
    armR.rotation.x = -0.5;
    group.add(armR);
    
    // Fishing Rod
    const rod = new THREE.Group();
    rod.name = "rod";
    rod.position.set(0.14, 0.34, 0.16);
    rod.rotation.x = -0.4;
    
    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.52, 6), wood);
    cane.position.z = 0.22;
    cane.rotation.x = Math.PI / 3;
    rod.add(cane);
    
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.44, 4), white);
    line.position.set(0, -0.15, 0.44);
    rod.add(line);
    
    // Float on water (attached to the line end)
    const float = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), blue);
    float.name = "float";
    float.position.set(0, -0.37, 0.44);
    rod.add(float);

    group.add(rod);
    
    // Animation: Walk & Rod Bob
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    const qLegFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);
    const qLegBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    const qLegIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const legLValues = [
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray()
    ];
    
    const legRValues = [
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackLegL = new THREE.QuaternionKeyframeTrack('leg_l.quaternion', times, legLValues);
    const trackLegR = new THREE.QuaternionKeyframeTrack('leg_r.quaternion', times, legRValues);

    const qArmFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.2);
    const qArmBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.2);

    const armLValues = [
        ...qLegIdle.toArray(),
        ...qArmBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qArmFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackArmL = new THREE.QuaternionKeyframeTrack('arm_l.quaternion', times, armLValues);

    const qRodUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.5);
    const qRodDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);

    const rodValues = [
        ...qRodDown.toArray(),
        ...qRodUp.toArray(),
        ...qRodDown.toArray(),
        ...qRodUp.toArray(),
        ...qRodDown.toArray()
    ];

    const trackRod = new THREE.QuaternionKeyframeTrack('rod.quaternion', times, rodValues);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackLegL, trackLegR, trackArmL, trackRod]);
    group.userData.animations = [clip];

    return group;
}

function createLumberjack(THREE) {
    const group = new THREE.Group();
    group.name = "lumberjack";
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const plaid = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.9 }); // Red checkered gile
    const black = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x757575, metalness: 0.8 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    // Body & Legs
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.14), plaid);
    body.position.y = 0.36;
    body.castShadow = true;
    group.add(body);
    
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6);

    const legL = new THREE.Mesh(legGeo, black);
    legL.name = "leg_l";
    legL.position.set(-0.06, 0.1, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, black);
    legR.name = "leg_r";
    legR.position.set(0.06, 0.1, 0);
    group.add(legR);
    
    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.58, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skin);
    headGroup.add(head);

    // Facial features
    const eyeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
    const eyeL = new THREE.Mesh(eyeGeo, black);
    eyeL.position.set(-0.03, 0.02, 0.07);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, black);
    eyeR.position.set(0.03, 0.02, 0.07);
    headGroup.add(eyeR);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.02), skin);
    nose.position.set(0, 0, 0.075);
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), black);
    mouth.position.set(0, -0.03, 0.07);
    headGroup.add(mouth);

    // Beard
    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), black);
    beard.position.set(0, -0.06, 0.06);
    headGroup.add(beard);

    group.add(headGroup);
    
    // Arm Left (holding axe)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armL.name = "arm_l";
    armL.position.set(-0.12, 0.44, 0.04);
    armL.rotation.x = -0.5;
    group.add(armL);
    
    // Arm Right (holding axe)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), skin);
    armR.name = "arm_r";
    armR.position.set(0.12, 0.44, 0.04);
    armR.rotation.x = -0.5;
    group.add(armR);
    
    // Axe (swing chop animation)
    const axe = new THREE.Group();
    axe.name = "axe";
    axe.position.set(0, 0.36, 0.18);
    axe.rotation.x = -0.3;
    
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.48, 6), wood);
    shaft.rotation.x = Math.PI / 2;
    axe.add(shaft);
    
    const headM = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.14), metal);
    headM.position.set(0, 0, 0.24);
    axe.add(headM);
    group.add(axe);
    
    // Animation: Walk & Chop
    const times = [0, 0.25, 0.5, 0.75, 1.0];

    // Legs
    const qLegFwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);
    const qLegBwd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
    const qLegIdle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const legLValues = [
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray()
    ];
    
    const legRValues = [
        ...qLegIdle.toArray(),
        ...qLegBwd.toArray(),
        ...qLegIdle.toArray(),
        ...qLegFwd.toArray(),
        ...qLegIdle.toArray()
    ];

    const trackLegL = new THREE.QuaternionKeyframeTrack('leg_l.quaternion', times, legLValues);
    const trackLegR = new THREE.QuaternionKeyframeTrack('leg_r.quaternion', times, legRValues);

    // Arms (Chopping)
    const qArmUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -1.2);
    const qArmDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.5);

    const armValues = [
        ...qArmDown.toArray(),
        ...qArmUp.toArray(),
        ...qArmDown.toArray(),
        ...qArmDown.toArray(),
        ...qArmDown.toArray()
    ];

    const trackArmL = new THREE.QuaternionKeyframeTrack('arm_l.quaternion', times, armValues);
    const trackArmR = new THREE.QuaternionKeyframeTrack('arm_r.quaternion', times, armValues);

    // Axe
    const qAxeUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -1.0);
    const qAxeDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);

    const axeValues = [
        ...qAxeDown.toArray(),
        ...qAxeUp.toArray(),
        ...qAxeDown.toArray(),
        ...qAxeDown.toArray(),
        ...qAxeDown.toArray()
    ];

    const trackAxe = new THREE.QuaternionKeyframeTrack('axe.quaternion', times, axeValues);

    const clip = new THREE.AnimationClip('Walk', 1.0, [trackLegL, trackLegR, trackArmL, trackArmR, trackAxe]);
    group.userData.animations = [clip];

    return group;
}

run().catch(err => {
    console.error("Generator execution failed:", err);
    clearInterval(keepAlive);
    process.exit(1);
});
