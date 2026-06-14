// Coherent Noise implementation (Simplex or Perlin noise)
// We'll implement a clean, fast Perlin/Simplex noise in 2D for heightmap generation.

// Improved Noise (Ken Perlin)
const permutation = new Uint8Array([
    151,160,137,91,90,15,
    131,13,201,95,96,53,194,233, 7,225,140,36,103,30, 69,142, 8,99,37,240,21,10,23,
    190, 6,148,247,120,234,75,  0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
    88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
    77,146,158,231,83,111,229,122, 60,211,133,230,220,105,92,41,55,46,245,40,244,
    102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
    135,130,116,188,189,134,207,46,211,208,250,140,92,141,245,255, 95,228,172,120,
    74,251,185,80,242,100,29,158,224,220,206,120,224,114, 58,10,29,203,197,128,201,
    115,28,97,223,124,196,167,82,59,223,40,84,250,25,48,178,254,127,24,111,121,
    114, 18,109,226,137,39,10,252,188,246, 51,250,221,114, 49,228,24,172,216,99,
    250,195,119,161,29,164,152, 52,191,138,110,109,115,223,127,186,190,189,129,223,
    254, 46,105, 12,111,244,119,114, 99, 3,244,220,112, 57, 24,220, 29,228, 49,228,
    22, 12,110,246,121,114,244, 46, 12,111, 46, 12,111, 46, 12,111, 46, 12,111, 46,
    12,111, 46, 12,111, 46, 12,111, 46, 12,111, 46, 12,111, 46, 12,111, 46, 12,111,
    46, 12,111, 46, 12,111, 46, 12,111, 46, 12,111, 46, 12,111, 46, 12,111, 46, 12
]);

const p = new Uint8Array(512);
for (let i = 0; i < 256; i++) {
    p[i] = permutation[i];
    p[i + 256] = permutation[i];
}

function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t, a, b) {
    return a + t * (b - a);
}

function grad(hash, x, y) {
    // 2D grad: hash the lower 4 bits to get 8 directions
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
}

function perlin2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = fade(x);
    const v = fade(y);

    const A = p[X] + Y;
    const B = p[X + 1] + Y;

    return lerp(v, lerp(u, grad(p[A], x, y),
                         grad(p[B], x - 1, y)),
                   lerp(u, grad(p[A + 1], x, y - 1),
                         grad(p[B + 1], x - 1, y - 1)));
}

// Layered Coherent Noise
function getNoise(x, y) {
    // 1. Domain warping to distort the input coordinates
    const warpX = perlin2D(x * 0.002, y * 0.002) * 80;
    const warpY = perlin2D(x * 0.002 + 10.5, y * 0.002 + 20.3) * 80;
    
    const nx = x + warpX;
    const ny = y + warpY;

    // 2. Low-frequency domain noise for continent shaping
    // frequency: 0.0002, amplitude: 250
    let continent = perlin2D(nx * 0.0002, ny * 0.0002) * 200;
    
    // 3. Medium-frequency noise for hills and valleys
    // We make hills dependent on the continent level (valleys stay flat, high areas get rougher mountains)
    const hillTreshold = Math.max(0, continent + 20) / 220; // 0 to 1+
    
    let hills = 0;
    let hillFreq = 0.0015;
    let hillAmp = 100;
    for (let i = 0; i < 3; i++) {
        hills += perlin2D(nx * hillFreq, ny * hillFreq) * hillAmp;
        hillFreq *= 2.0;
        hillAmp *= 0.5;
    }
    
    // Apply threshold to make hills prominent on higher continent areas
    hills *= hillTreshold;

    // 4. High-frequency noise for surface roughness
    let roughness = 0;
    let roughFreq = 0.01;
    let roughAmp = 6.0;
    for (let i = 0; i < 3; i++) {
        roughness += perlin2D(nx * roughFreq, ny * roughFreq) * roughAmp;
        roughFreq *= 2.2;
        roughAmp *= 0.45;
    }

    // Combined height
    return continent + hills + roughness;
}

// Handle messages in Worker
self.onmessage = function(e) {
    const { x: chunkX, z: chunkZ, lod, chunkSize, segments } = e.data;
    
    // LOD determines step size between heights
    // LOD 0: step = 1 (segments+1 x segments+1 grid)
    // LOD 1: step = 2
    // LOD 2: step = 4
    const step = Math.pow(2, lod);
    
    // We need to resolve height for (segments + 1) * (segments + 1) vertices.
    // However, to ensure seamless margins, we can generate a border of extra vertices, 
    // or just calculate the exact boundary values.
    // To generate the heightmap, size is (segments / step) + 1. Let's call it gridPoints.
    const gridPoints = (segments / step) + 1;
    
    // heightmap will be Float32Array
    const heightmap = new Float32Array(gridPoints * gridPoints);
    
    // The chunk's size in world coordinates is chunkSize (256)
    // The top-left corner of the chunk in world coordinates is:
    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;
    
    // Distance between vertices in world space
    const vertDistance = chunkSize / segments;
    const stepDistance = vertDistance * step;
    
    let idx = 0;
    for (let gz = 0; gz < gridPoints; gz++) {
        const worldZ = startZ + gz * stepDistance;
        for (let gx = 0; gx < gridPoints; gx++) {
            const worldX = startX + gx * stepDistance;
            
            // Calculate procedural height
            heightmap[idx++] = getNoise(worldX, worldZ);
        }
    }
    
    // Return buffer and coordinates
    self.postMessage({
        x: chunkX,
        z: chunkZ,
        lod: lod,
        heightmap: heightmap,
        gridPoints: gridPoints
    }, [heightmap.buffer]);
};
