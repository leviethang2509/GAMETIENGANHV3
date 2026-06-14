import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

/**
 * MeshBuilder converts Float32Array heightmaps to indexed BufferGeometry meshes.
 * Includes color generation based on elevation and skirt geometry for seamless LOD stitching.
 */
class MeshBuilder {
    constructor() {
        // Shared material for all terrain chunks.
        // Using MeshStandardMaterial with vertex colors enabled.
        this.terrainMaterial = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.85,
            metalness: 0.05,
            flatShading: true // Gives a low-poly aesthetic that highlights terrain contours
        });

        // Elevation colors gradient: deep green -> light green -> brown -> gray -> white for peaks
        this.colorGradient = [
            { height: -80, color: new THREE.Color(0x0a2f1d) }, // Deep Green
            { height: 0, color: new THREE.Color(0x2d6a4f) },   // Grass Green
            { height: 35, color: new THREE.Color(0x74c69d) },  // Light Green
            { height: 75, color: new THREE.Color(0x9c6644) },  // Brown (Hills)
            { height: 140, color: new THREE.Color(0x7f7f7f) }, // Gray (Mountains)
            { height: 210, color: new THREE.Color(0xffffff) }  // White (Peaks)
        ];
    }

    /**
     * Get interpolated vertex color based on elevation height.
     */
    getColorForElevation(height) {
        if (height <= this.colorGradient[0].height) return this.colorGradient[0].color.clone();
        if (height >= this.colorGradient[this.colorGradient.length - 1].height) {
            return this.colorGradient[this.colorGradient.length - 1].color.clone();
        }

        // Interpolate between key points
        for (let i = 0; i < this.colorGradient.length - 1; i++) {
            const low = this.colorGradient[i];
            const high = this.colorGradient[i + 1];
            if (height >= low.height && height <= high.height) {
                const factor = (height - low.height) / (high.height - low.height);
                return new THREE.Color().copy(low.color).lerp(high.color, factor);
            }
        }
        return this.colorGradient[1].color.clone();
    }

    /**
     * Builds a chunk mesh with a skirt to cover cracks.
     * Skirt extends down from chunk boundaries.
     * 
     * @param {Float32Array} heightmap Height values
     * @param {number} gridPoints Grid points size (e.g. 33 for 32 segments)
     * @param {number} chunkSize Total size of chunk in meters (e.g. 256)
     * @param {number} chunkX Grid X
     * @param {number} chunkZ Grid Z
     * @returns {THREE.Mesh} The generated mesh
     */
    buildMesh(heightmap, gridPoints, chunkSize, chunkX, chunkZ) {
        const geometry = new THREE.BufferGeometry();
        const segments = gridPoints - 1;
        const stepSize = chunkSize / segments;

        // Position coordinates, vertex colors, and index arrays.
        // We will generate the main heightmap grid and then append skirt vertices.
        // Main grid size: gridPoints * gridPoints
        const numGridVertices = gridPoints * gridPoints;
        
        // We'll add 4 skirts along the 4 borders:
        // Top edge: gridPoints vertices
        // Bottom edge: gridPoints vertices
        // Left edge: gridPoints vertices
        // Right edge: gridPoints vertices
        // Total skirt vertices = 4 * gridPoints * 2 (top and bottom of each skirt segment)
        // Let's create positions, colors, and indices.
        
        const vertices = [];
        const colors = [];
        const indices = [];

        // 1. Generate Main Grid Vertices
        for (let gz = 0; gz < gridPoints; gz++) {
            const z = gz * stepSize;
            for (let gx = 0; gx < gridPoints; gx++) {
                const x = gx * stepSize;
                const h = heightmap[gz * gridPoints + gx];
                
                vertices.push(x, h, z);
                
                // Color based on elevation
                const c = this.getColorForElevation(h);
                colors.push(c.r, c.g, c.b);
            }
        }

        // 2. Generate Main Grid Indices (Triangles)
        for (let gz = 0; gz < segments; gz++) {
            for (let gx = 0; gx < segments; gx++) {
                const a = gz * gridPoints + gx;
                const b = gz * gridPoints + (gx + 1);
                const c = (gz + 1) * gridPoints + gx;
                const d = (gz + 1) * gridPoints + (gx + 1);

                // Two triangles per grid cell
                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }

        // 3. Generate Skirt Vertices and Indices
        // Skirt depth (how far down it extends)
        const skirtDepth = 40.0;
        
        // Function to helper-add skirt segment
        // From vertex (x1, y1, z1) on terrain to (x2, y2, z2) on terrain
        const addSkirtSegment = (gIdx1, gIdx2) => {
            const startVIdx = vertices.length / 3;

            // Extract coordinates of existing terrain border vertices
            const x1 = vertices[gIdx1 * 3];
            const y1 = vertices[gIdx1 * 3 + 1];
            const z1 = vertices[gIdx1 * 3 + 2];

            const x2 = vertices[gIdx2 * 3];
            const y2 = vertices[gIdx2 * 3 + 1];
            const z2 = vertices[gIdx2 * 3 + 2];

            // Add duplicate vertices for the top of the skirt (using terrain height)
            vertices.push(x1, y1, z1);
            vertices.push(x2, y2, z2);

            // Add vertices for the bottom of the skirt (terrain height - skirtDepth)
            vertices.push(x1, y1 - skirtDepth, z1);
            vertices.push(x2, y2 - skirtDepth, z2);

            // Copy colors from the original terrain vertices
            colors.push(colors[gIdx1 * 3], colors[gIdx1 * 3 + 1], colors[gIdx1 * 3 + 2]);
            colors.push(colors[gIdx2 * 3], colors[gIdx2 * 3 + 1], colors[gIdx2 * 3 + 2]);
            colors.push(colors[gIdx1 * 3], colors[gIdx1 * 3 + 1], colors[gIdx1 * 3 + 2]);
            colors.push(colors[gIdx2 * 3], colors[gIdx2 * 3 + 1], colors[gIdx2 * 3 + 2]);

            // Indices for the two triangles forming the skirt quad
            // Quad layout:
            // startVIdx (Top Left), startVIdx+1 (Top Right)
            // startVIdx+2 (Bottom Left), startVIdx+3 (Bottom Right)
            indices.push(startVIdx, startVIdx + 2, startVIdx + 1);
            indices.push(startVIdx + 1, startVIdx + 2, startVIdx + 3);
        };

        // Top edge: gz = 0, gx moves from 0 to segments
        for (let gx = 0; gx < segments; gx++) {
            const idx1 = gx;
            const idx2 = gx + 1;
            addSkirtSegment(idx1, idx2);
        }

        // Bottom edge: gz = segments, gx moves from segments to 0
        for (let gx = segments; gx > 0; gx--) {
            const idx1 = segments * gridPoints + gx;
            const idx2 = segments * gridPoints + (gx - 1);
            addSkirtSegment(idx1, idx2);
        }

        // Left edge: gx = 0, gz moves from segments to 0
        for (let gz = segments; gz > 0; gz--) {
            const idx1 = gz * gridPoints;
            const idx2 = (gz - 1) * gridPoints;
            addSkirtSegment(idx1, idx2);
        }

        // Right edge: gx = segments, gz moves from 0 to segments
        for (let gz = 0; gz < segments; gz++) {
            const idx1 = gz * gridPoints + segments;
            const idx2 = (gz + 1) * gridPoints + segments;
            addSkirtSegment(idx1, idx2);
        }

        // Create buffer attributes
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);

        // Compute normals for shading
        geometry.computeVertexNormals();

        // Create mesh
        const mesh = new THREE.Mesh(geometry, this.terrainMaterial);
        
        // Chunk's world position is determined by chunkX, chunkZ
        mesh.position.set(chunkX * chunkSize, 0, chunkZ * chunkSize);
        
        // Set frustum culling per chunk mesh
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        mesh.matrixAutoUpdate = false; // Optimize static matrices
        mesh.updateMatrix();

        return mesh;
    }

    /**
     * Dispose of geometry and mesh materials.
     */
    disposeMesh(mesh) {
        if (mesh) {
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }
            // Material is shared, so we do not dispose it here.
        }
    }
}

export { MeshBuilder };
