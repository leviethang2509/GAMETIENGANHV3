import { WorkerPool } from './workerPool.js';
import { MeshBuilder } from './meshBuilder.js';

/**
 * ChunkManager manages the infinite streaming lifecycle of terrain chunks.
 * Uses an LRU cache system to prevent memory leaks and controls Worker concurrency.
 */
class ChunkManager {
    constructor(scene, chunkSize = 256, activeRadius = 6, maxSegments = 64) {
        this.scene = scene;
        this.chunkSize = chunkSize;
        this.activeRadius = activeRadius; // 5-7 chunks radius (we'll default to 6)
        this.maxSegments = maxSegments;   // Maximum base mesh resolution segments (LOD0 = maxSegments, LOD1 = maxSegments/2, LOD2 = maxSegments/4)

        // Web Worker Pool (Worker path relative to html: 'js/terrainWorker.js')
        this.workerPool = new WorkerPool('js/terrainWorker.js', 3);
        this.meshBuilder = new MeshBuilder();

        // Active chunk map: key: 'x,z' -> Chunk object
        this.activeChunks = new Map();

        // LRU Cache for heightmaps to avoid re-generating heightmap data when returning to a chunk.
        // Cache holds heightmap data { heightmap, gridPoints }. Limit cache to e.g. 256 heightmaps.
        this.heightmapCache = new Map();
        this.maxCacheSize = 256;

        // Queue for non-critical chunk destruction (unloading) to run in requestIdleCallback
        this.unloadQueue = [];

        // Track stats for visual display if needed
        this.stats = {
            loadedChunksCount: 0,
            pendingGenerationsCount: 0
        };
    }

    /**
     * Compute Level of Detail (LOD) based on distance from player chunk coordinates.
     * LOD0 (radius 0-1): high resolution
     * LOD1 (radius 2-3): medium density
     * LOD2 (radius 4-6): low poly far terrain
     */
    getLOD(dx, dz) {
        const dist = Math.max(Math.abs(dx), Math.abs(dz));
        if (dist <= 1) return 0; // LOD0
        if (dist <= 3) return 1; // LOD1
        return 2;                // LOD2 (dist <= activeRadius)
    }

    /**
     * Determine if a chunk should be active based on radius
     */
    isInRadius(cx, cz, playerX, playerZ) {
        const dx = Math.abs(cx - playerX);
        const dz = Math.abs(cz - playerZ);
        return (dx <= this.activeRadius && dz <= this.activeRadius);
    }

    /**
     * Main update loop called every frame from the renderer.
     * Computes the required set of chunks around player coordinate (px, pz)
     * and streams chunks in/out incrementally.
     */
    update(playerWorldX, playerWorldZ) {
        // 1. Calculate player's current chunk coordinate
        const playerCX = Math.floor((playerWorldX + this.chunkSize / 2) / this.chunkSize);
        const playerCZ = Math.floor((playerWorldZ + this.chunkSize / 2) / this.chunkSize);

        // 2. Identify the active set of chunks required
        const requiredKeys = new Set();
        const pendingJobs = [];

        for (let dz = -this.activeRadius; dz <= this.activeRadius; dz++) {
            const cz = playerCZ + dz;
            for (let dx = -this.activeRadius; dx <= this.activeRadius; dx++) {
                const cx = playerCX + dx;
                
                // Keep only circular/square chunk radius
                // A square radius fits perfect for standard infinite maps, let's keep it square or circular:
                // If dx^2 + dz^2 <= radius^2 (circular) to make it look nicer at the horizon:
                if (dx * dx + dz * dz > (this.activeRadius + 0.5) * (this.activeRadius + 0.5)) {
                    continue;
                }

                const key = `${cx},${cz}`;
                requiredKeys.add(key);

                const lod = this.getLOD(dx, dz);
                const currentChunk = this.activeChunks.get(key);

                if (currentChunk) {
                    // Chunk exists, check if its LOD needs to be updated (LOD transition)
                    if (currentChunk.lod !== lod && !currentChunk.isTransitioning) {
                        this.transitionChunkLOD(currentChunk, cx, cz, lod, playerWorldX, playerWorldZ);
                    }
                } else {
                    // Chunk doesn't exist, enqueue for generation
                    const distSq = dx * dx + dz * dz;
                    pendingJobs.push({ cx, cz, lod, distSq });
                }
            }
        }

        // 3. Enqueue missing chunks for generation with distance priority
        for (const job of pendingJobs) {
            this.generateChunk(job.cx, job.cz, job.lod, job.distSq);
        }

        // 4. Identify and unload chunks outside radius
        for (const [key, chunk] of this.activeChunks.entries()) {
            if (!requiredKeys.has(key)) {
                this.enqueueUnloadChunk(key, chunk);
            }
        }

        // 5. Trigger idle callback cleanup for queued unloads
        this.triggerCleanup();

        // Update stats
        this.stats.loadedChunksCount = this.activeChunks.size;
    }

    /**
     * Start generating a chunk at (cx, cz) with target LOD
     */
    generateChunk(cx, cz, lod, distSq) {
        const key = `${cx},${cz}`;
        
        // Mark chunk as loading/transitioning in the active set
        const loadingChunk = {
            cx,
            cz,
            lod,
            mesh: null,
            isTransitioning: true
        };
        this.activeChunks.set(key, loadingChunk);
        
        this.stats.pendingGenerationsCount++;

        // Check cache first
        const cacheKey = `${cx},${cz},${lod}`;
        const cachedData = this.getFromCache(cacheKey);
        
        if (cachedData) {
            // Instant build from cache
            this.buildChunkMesh(cx, cz, lod, cachedData.heightmap, cachedData.gridPoints);
            this.stats.pendingGenerationsCount--;
            return;
        }

        // Request heightmap from worker pool
        this.workerPool.requestChunk(
            cx, 
            cz, 
            lod, 
            this.chunkSize, 
            this.maxSegments, 
            distSq, 
            (data) => {
                // Once generated, save to LRU Cache
                this.putInCache(cacheKey, {
                    heightmap: data.heightmap,
                    gridPoints: data.gridPoints
                });

                // Build mesh
                this.buildChunkMesh(cx, cz, lod, data.heightmap, data.gridPoints);
                this.stats.pendingGenerationsCount--;
            }
        );
    }

    /**
     * Transition LOD of a chunk that is already loaded
     */
    transitionChunkLOD(chunk, cx, cz, newLod, px, pz) {
        chunk.isTransitioning = true;
        const key = `${cx},${cz}`;
        
        // Priority distance based on current camera offset
        const dx = cx - Math.floor(px / this.chunkSize);
        const dz = cz - Math.floor(pz / this.chunkSize);
        const distSq = dx * dx + dz * dz;

        const cacheKey = `${cx},${cz},${newLod}`;
        const cachedData = this.getFromCache(cacheKey);

        if (cachedData) {
            // Fast transition using cache
            this.replaceChunkMesh(chunk, newLod, cachedData.heightmap, cachedData.gridPoints);
            return;
        }

        this.workerPool.requestChunk(
            cx, 
            cz, 
            newLod, 
            this.chunkSize, 
            this.maxSegments, 
            distSq, 
            (data) => {
                this.putInCache(cacheKey, {
                    heightmap: data.heightmap,
                    gridPoints: data.gridPoints
                });

                this.replaceChunkMesh(chunk, newLod, data.heightmap, data.gridPoints);
            }
        );
    }

    /**
     * Create the mesh and add it to the Three.js scene
     */
    buildChunkMesh(cx, cz, lod, heightmap, gridPoints) {
        const key = `${cx},${cz}`;
        const chunk = this.activeChunks.get(key);
        
        if (!chunk) return; // Might have been unloaded before load completed

        // Build the Three.js mesh
        const mesh = this.meshBuilder.buildMesh(heightmap, gridPoints, this.chunkSize, cx, cz);
        
        chunk.mesh = mesh;
        chunk.lod = lod;
        chunk.isTransitioning = false;
        
        this.scene.add(mesh);
    }

    /**
     * Replaces an existing chunk mesh with a new LOD mesh
     */
    replaceChunkMesh(chunk, newLod, heightmap, gridPoints) {
        // Remove old mesh
        if (chunk.mesh) {
            this.scene.remove(chunk.mesh);
            this.meshBuilder.disposeMesh(chunk.mesh);
        }

        // Build new mesh
        const mesh = this.meshBuilder.buildMesh(heightmap, gridPoints, this.chunkSize, chunk.cx, chunk.cz);
        
        chunk.mesh = mesh;
        chunk.lod = newLod;
        chunk.isTransitioning = false;

        this.scene.add(mesh);
    }

    /**
     * Enqueue chunk for unloading (outside active radius)
     */
    enqueueUnloadChunk(key, chunk) {
        // Cancel active generation/load requests for this chunk
        this.workerPool.cancelRequest(chunk.cx, chunk.cz, chunk.lod);
        
        this.activeChunks.delete(key);
        this.unloadQueue.push(chunk);
    }

    /**
     * Process unloading in non-critical CPU time using requestIdleCallback
     */
    triggerCleanup() {
        if (this.unloadQueue.length === 0) return;

        const processQueue = (deadline) => {
            while (this.unloadQueue.length > 0 && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
                const chunk = this.unloadQueue.shift();
                if (chunk && chunk.mesh) {
                    this.scene.remove(chunk.mesh);
                    this.meshBuilder.disposeMesh(chunk.mesh);
                }
            }
        };

        if (window.requestIdleCallback) {
            window.requestIdleCallback((deadline) => processQueue(deadline), { timeout: 200 });
        } else {
            // Fallback for browsers that don't support requestIdleCallback
            setTimeout(() => {
                const deadline = {
                    timeRemaining: () => 10, // dummy positive value
                    didTimeout: true
                };
                processQueue(deadline);
            }, 0);
        }
    }

    // --- LRU Cache Implementation ---

    getFromCache(key) {
        if (!this.heightmapCache.has(key)) return null;

        // Move key to the end of the Map to represent most recently used (LRU pattern)
        const value = this.heightmapCache.get(key);
        this.heightmapCache.delete(key);
        this.heightmapCache.set(key, value);
        return value;
    }

    putInCache(key, value) {
        if (this.heightmapCache.has(key)) {
            this.heightmapCache.delete(key);
        } else if (this.heightmapCache.size >= this.maxCacheSize) {
            // Delete least recently used (first item in insertion order)
            const firstKey = this.heightmapCache.keys().next().value;
            this.heightmapCache.delete(firstKey);
        }
        this.heightmapCache.set(key, value);
    }

    /**
     * Unload all chunks and terminate worker pool
     */
    dispose() {
        // Clean up loaded chunks
        for (const [key, chunk] of this.activeChunks.entries()) {
            if (chunk.mesh) {
                this.scene.remove(chunk.mesh);
                this.meshBuilder.disposeMesh(chunk.mesh);
            }
        }
        this.activeChunks.clear();

        // Clean up unload queue
        for (const chunk of this.unloadQueue) {
            if (chunk.mesh) {
                this.scene.remove(chunk.mesh);
                this.meshBuilder.disposeMesh(chunk.mesh);
            }
        }
        this.unloadQueue = [];

        // Terminate Web Workers
        this.workerPool.terminate();
        this.heightmapCache.clear();
    }
}

export { ChunkManager };
