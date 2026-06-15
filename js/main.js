// js/main.js
import { FEATURE_FLAGS, GAME_BALANCING } from './domain/config/GameSettings.js';
import { Player } from './domain/models/Player.js';
import { Crop } from './domain/models/Crop.js';
import { Plot } from './domain/models/Plot.js';
import { SoundSystem } from './infra/SoundSystem.js';
import { AssetPresenter } from './adapters/AssetPresenter.js';

class GameApp {
    constructor() {
        this.player = new Player(GAME_BALANCING.INITIAL_GOLD, GAME_BALANCING.INITIAL_ENERGY, GAME_BALANCING.MAX_ENERGY);
        this.plots = [];
        this.soundSystem = new SoundSystem();
        this.assetPresenter = null;
        this.terrainSystem = null;
        this.selectedSeed = 'tomato'; // default seed selected in UI
        this.selectedPlotIndex = 0; // selected plot for operations in UI
        this.currentWeedPlot = null; // Plot that is currently being targeted for weed typing minigame

        // English vocabulary bank for weed minigame
        this.englishWords = [
            'apple', 'banana', 'orange', 'grape', 'harvest', 'farming', 'garden',
            'nature', 'flower', 'water', 'sprout', 'carrot', 'tomato', 'potato',
            'pumpkin', 'sunflower', 'cow', 'sheep', 'chicken', 'duck', 'energy',
            'worker', 'valley', 'meadow', 'forest', 'wind', 'river', 'stone',
            'morning', 'evening', 'summer', 'winter', 'spring', 'autumn'
        ];

        this.lastTickTime = performance.now();
    }

    async init() {
        console.log("GameApp: Initializing Chapter 1 integration...");

        // 1. Initialize SoundSystem
        this.soundSystem.init();

        // Preload sounds
        const audioAssets = {
            bgm: 'assets/audio/bgm_relaxing.wav',
            dig: 'assets/audio/dig.wav',
            seed: 'assets/audio/seed.wav',
            water: 'assets/audio/water_spray.wav',
            harvest: 'assets/audio/harvest.wav',
            correct: 'assets/audio/correct.wav',
            wrong: 'assets/audio/wrong.wav',
            click: 'assets/audio/click.wav',
            victory: 'assets/audio/victory.wav'
        };

        for (const [key, path] of Object.entries(audioAssets)) {
            await this.soundSystem.preloadAudio(key, path);
        }

        // Play relaxing BGM loop
        this.soundSystem.playBGM('bgm', true);

        // 2. Initialize Terrain System and Viewer
        this.terrainSystem = new TerrainSystem('canvas-container', 'terrain-stats');

        // Pass SoundSystem instance to terrain system to enable listener update
        this.terrainSystem.soundSystem = this.soundSystem;

        // 3. Initialize AssetPresenter with Three scene
        this.assetPresenter = new AssetPresenter(this.terrainSystem.scene);
        this.terrainSystem.assetPresenter = this.assetPresenter;

        // Preload essential 3D assets
        const glbAssets = {
            farmer: 'assets/models/farmer.glb',
            tomato: 'assets/models/tomato.glb',
            carrot: 'assets/models/carrot.glb',
            corn: 'assets/models/corn.glb',
            tree: 'assets/models/tree.glb',
            grandpa: 'assets/models/grandpa.glb',
            merchant: 'assets/models/merchant.glb',
            seedseller: 'assets/models/seedseller.glb',
            cow: 'assets/models/cow.glb',
            sheep: 'assets/models/sheep.glb',
            chicken: 'assets/models/chicken.glb',
            duck: 'assets/models/duck.glb',
            barn: 'assets/models/barn.glb',
            silo: 'assets/models/silo.glb',
            compostbin: 'assets/models/compostbin.glb',
            waterpump: 'assets/models/waterpump.glb'
        };

        for (const [key, path] of Object.entries(glbAssets)) {
            await this.assetPresenter.preloadModel(key, path);
        }

        // Place NPCs, Player models, animals, and buildings onto the scene at appropriate locations
        this.spawnStaticEntities();
        this.spawnAnimalsAndBuildings();

        // 4. Initialize Plot Grid
        // Generate a 3x3 plot grid around the main base area (offset slightly from center)
        let plotId = 1;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                // Positions centered near (x: -20, z: -20) on flat ground
                const px = -20 + c * 8;
                const pz = -20 + r * 8;
                const plot = new Plot(plotId++, px, pz);
                this.plots.push(plot);

                // Start some plots as plowed soil, some as grass
                if (r === 0) {
                    plot.plow();
                }
            }
        }

        // Spawn visual representations for plots
        this.refreshPlotsVisuals();

        // 5. Connect UI controls
        this.setupUIEventHandlers();

        // 6. Start game logical update loop (TICK)
        setInterval(() => this.gameTick(), GAME_BALANCING.TICK_RATE);

        // Energy recover interval
        setInterval(() => {
            this.player.recoverEnergy(GAME_BALANCING.ENERGY_RECOVER_RATE);
            this.updatePlayerHUD();
        }, 1000);

        // First UI draw
        this.updatePlayerHUD();
        this.updatePlotDetailsUI();

        console.log("GameApp: Chapter 1 Integration Completed successfully.");
    }

    spawnStaticEntities() {
        // Grandfather guide NPC near the path
        const grandpaPos = { x: 5, y: getTerrainHeight(5, -20), z: -20 };
        const grandpaGroup = this.assetPresenter.createModelInstance('grandpa', 'npc_grandpa');
        if (grandpaGroup) {
            grandpaGroup.position.set(grandpaPos.x, grandpaPos.y, grandpaPos.z);
            grandpaGroup.rotation.y = Math.PI / 4;
            this.terrainSystem.scene.add(grandpaGroup);
        }

        // Merchant NPC near the main house entrance
        const merchantPos = { x: -35, y: getTerrainHeight(-35, 10), z: 10 };
        const merchantGroup = this.assetPresenter.createModelInstance('merchant', 'npc_merchant');
        if (merchantGroup) {
            merchantGroup.position.set(merchantPos.x, merchantPos.y, merchantPos.z);
            merchantGroup.rotation.y = -Math.PI / 2;
            this.terrainSystem.scene.add(merchantGroup);
        }

        // Seed Seller NPC near the plot area
        const seedsellerPos = { x: -40, y: getTerrainHeight(-40, -15), z: -15 };
        const seedsellerGroup = this.assetPresenter.createModelInstance('seedseller', 'npc_seedseller');
        if (seedsellerGroup) {
            seedsellerGroup.position.set(seedsellerPos.x, seedsellerPos.y, seedsellerPos.z);
            seedsellerGroup.rotation.y = Math.PI / 2;
            this.terrainSystem.scene.add(seedsellerGroup);
        }

        // Player model (farmer) positioned near the center plot
        const playerPos = { x: -10, y: getTerrainHeight(-10, -10), z: -10 };
        const farmerGroup = this.assetPresenter.createModelInstance('farmer', 'player_farmer');
        if (farmerGroup) {
            farmerGroup.position.set(playerPos.x, playerPos.y, playerPos.z);
            this.terrainSystem.scene.add(farmerGroup);

            // Play idle/walk animation if available
            if (farmerGroup.userData && farmerGroup.userData.mixer && farmerGroup.userData.animations.length > 0) {
                // Play first animation as loop
                const action = farmerGroup.userData.mixer.clipAction(farmerGroup.userData.animations[0]);
                action.play();
            }
        }

        // Spawn Compost Bin at (15, getTerrainHeight(15, -25), -25)
        const binPos = { x: 15, y: getTerrainHeight(15, -25), z: -25 };
        const binGroup = this.assetPresenter.createModelInstance('compostbin', 'building_compostbin');
        if (binGroup) {
            binGroup.position.set(binPos.x, binPos.y, binPos.z);
            this.terrainSystem.scene.add(binGroup);
        }

        // Spawn Water Pump at (-15, getTerrainHeight(-15, -28), -28)
        const pumpPos = { x: -15, y: getTerrainHeight(-15, -28), z: -28 };
        const pumpGroup = this.assetPresenter.createModelInstance('waterpump', 'building_waterpump');
        if (pumpGroup) {
            pumpGroup.position.set(pumpPos.x, pumpPos.y, pumpPos.z);
            this.terrainSystem.scene.add(pumpGroup);
        }
    }

    spawnAnimalsAndBuildings() {
        // Place barn at (x: 40, z: -35)
        const barnPos = { x: 40, y: getTerrainHeight(40, -35), z: -35 };
        const barnGroup = this.assetPresenter.createModelInstance('barn', 'building_barn');
        if (barnGroup) {
            barnGroup.position.set(barnPos.x, barnPos.y, barnPos.z);
            barnGroup.rotation.y = Math.PI;
            this.terrainSystem.scene.add(barnGroup);
        }

        // Place silo at (x: 55, z: -30)
        const siloPos = { x: 55, y: getTerrainHeight(55, -30), z: -30 };
        const siloGroup = this.assetPresenter.createModelInstance('silo', 'building_silo');
        if (siloGroup) {
            siloGroup.position.set(siloPos.x, siloPos.y, siloPos.z);
            this.terrainSystem.scene.add(siloGroup);
        }

        // Cows grazing in the meadow pasture (e.g. x: 25 to 50, z: 10 to 40)
        const cowPositions = [
            { x: 30, z: 20 },
            { x: 45, z: 25 },
            { x: 35, z: 40 }
        ];
        cowPositions.forEach((pos, idx) => {
            const cowGroup = this.assetPresenter.createModelInstance('cow', `animal_cow_${idx}`);
            if (cowGroup) {
                cowGroup.position.set(pos.x, getTerrainHeight(pos.x, pos.z), pos.z);
                cowGroup.rotation.y = Math.random() * Math.PI * 2;
                this.terrainSystem.scene.add(cowGroup);
            }
        });

        // Sheep grazing near the hills (e.g. x: -45, z: -45)
        const sheepPositions = [
            { x: -45, z: -45 },
            { x: -55, z: -35 }
        ];
        sheepPositions.forEach((pos, idx) => {
            const sheepGroup = this.assetPresenter.createModelInstance('sheep', `animal_sheep_${idx}`);
            if (sheepGroup) {
                sheepGroup.position.set(pos.x, getTerrainHeight(pos.x, pos.z), pos.z);
                sheepGroup.rotation.y = Math.random() * Math.PI * 2;
                this.terrainSystem.scene.add(sheepGroup);
            }
        });

        // Chickens near the merchant area
        const chickenPositions = [
            { x: -28, z: 15 },
            { x: -32, z: 20 },
            { x: -25, z: 8 }
        ];
        chickenPositions.forEach((pos, idx) => {
            const chickenGroup = this.assetPresenter.createModelInstance('chicken', `animal_chicken_${idx}`);
            if (chickenGroup) {
                chickenGroup.position.set(pos.x, getTerrainHeight(pos.x, pos.z), pos.z);
                chickenGroup.rotation.y = Math.random() * Math.PI * 2;
                this.terrainSystem.scene.add(chickenGroup);
            }
        });

        // Ducks floating in the river/canal (e.g. canal runs near x: -80 & 80, sea at z: > 245)
        // Let's place ducks on the water surface at z: 230
        const duckPositions = [
            { x: -40, z: 230 },
            { x: 0, z: 220 },
            { x: 40, z: 235 }
        ];
        duckPositions.forEach((pos, idx) => {
            const duckGroup = this.assetPresenter.createModelInstance('duck', `animal_duck_${idx}`);
            if (duckGroup) {
                // Water surface height is exactly 0 or getTerrainHeight on sea (low wave line)
                duckGroup.position.set(pos.x, 1.0, pos.z); 
                duckGroup.rotation.y = Math.random() * Math.PI * 2;
                this.terrainSystem.scene.add(duckGroup);
            }
        });
    }

    refreshPlotsVisuals() {
        this.plots.forEach((plot) => {
            const visualId = `plot_visual_${plot.id}`;
            const cropVisualId = `crop_visual_${plot.id}`;
            const weedVisualId = `weed_visual_${plot.id}`;

            // Remove existing visuals to draw fresh ones
            this.assetPresenter.removeAsset(visualId);
            this.assetPresenter.removeAsset(cropVisualId);
            this.assetPresenter.removeAsset(weedVisualId);

            // 1. Draw Plot Base (Soil or Grass)
            // Use simple Cylinder primitives assembled dynamic structure representing terracotta pot/patch
            const py = getTerrainHeight(plot.position.x, plot.position.z);
            
            const plotGroup = new THREE.Group();
            
            // Build terracotta rim pot visual representation
            const rimGeo = new THREE.CylinderGeometry(3.5, 3.0, 0.6, 8);
            const rimMat = new THREE.MeshStandardMaterial({ 
                color: plot.status === 'soil' ? 0x8d5b4c : 0x27ae60, 
                roughness: 0.9 
            });
            const rimMesh = new THREE.Mesh(rimGeo, rimMat);
            rimMesh.position.y = 0.3;
            rimMesh.receiveShadow = true;
            rimMesh.castShadow = true;
            plotGroup.add(rimMesh);

            // If soil and watered, draw darker center soil layer
            const soilGeo = new THREE.CylinderGeometry(3.2, 3.2, 0.1, 8);
            const soilColor = plot.crop && plot.crop.watered ? 0x2e1911 : 0x5c3c35;
            const soilMat = new THREE.MeshStandardMaterial({ 
                color: plot.status === 'soil' ? soilColor : 0x2ecc71, 
                roughness: 1.0 
            });
            const soilMesh = new THREE.Mesh(soilGeo, soilMat);
            soilMesh.position.y = 0.6;
            soilMesh.receiveShadow = true;
            plotGroup.add(soilMesh);

            // Keep reference in AssetPresenter activeAssets map
            plotGroup.position.set(plot.position.x, py, plot.position.z);
            this.assetPresenter.activeAssets.set(visualId, plotGroup);
            this.terrainSystem.scene.add(plotGroup);

            // 2. Draw Plant/Crop if seeded
            if (plot.crop) {
                const cropModelKey = plot.crop.type; // tomato, carrot, corn
                const cropGroup = this.assetPresenter.createModelInstance(cropModelKey, cropVisualId);
                if (cropGroup) {
                    cropGroup.position.set(plot.position.x, py + 0.6, plot.position.z);
                    
                    // Set scale according to growth stage
                    // 0: Seed, 1: Sprout, 2: Growing, 3: Ripe
                    let growthScale = 0.15; // default sprout/seed scale
                    if (plot.crop.growthStage === 1) growthScale = 0.4;
                    else if (plot.crop.growthStage === 2) growthScale = 0.7;
                    else if (plot.crop.growthStage === 3) growthScale = 1.0;

                    // Locate scale group inside or default to whole group
                    let scaleNode = null;
                    cropGroup.traverse((child) => {
                        if (child.name && child.name.includes('scale_group')) {
                            scaleNode = child;
                        }
                    });
                    const targetNode = scaleNode || cropGroup;
                    targetNode.scale.set(growthScale, growthScale, growthScale);

                    this.terrainSystem.scene.add(cropGroup);
                }
            }

            // 3. Draw weed if plot has weed
            if (plot.hasWeed) {
                // Use simple small green cones for weed visual Representation
                const weedGroup = new THREE.Group();
                const coneGeo = new THREE.ConeGeometry(0.8, 2.0, 4);
                const coneMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.9 });
                
                // Group of three weeds
                for (let i = 0; i < 3; i++) {
                    const weedMesh = new THREE.Mesh(coneGeo, coneMat);
                    const wx = (Math.random() - 0.5) * 3;
                    const wz = (Math.random() - 0.5) * 3;
                    weedMesh.position.set(wx, 1.0, wz);
                    weedMesh.rotation.z = (Math.random() - 0.5) * 0.4;
                    weedMesh.castShadow = true;
                    weedGroup.add(weedMesh);
                }
                
                weedGroup.position.set(plot.position.x, py, plot.position.z);
                this.assetPresenter.activeAssets.set(weedVisualId, weedGroup);
                this.terrainSystem.scene.add(weedGroup);
            }
        });
    }

    gameTick() {
        const now = performance.now();
        const deltaTime = (now - this.lastTickTime) / 1000;
        this.lastTickTime = now;

        // Process crop growth logic for each plot
        this.plots.forEach((plot) => {
            if (plot.crop) {
                // Update crop growth
                plot.crop.updateGrowth(deltaTime, FEATURE_FLAGS.REQUIRE_WATERING);
            }

            // Spawn weed randomly if flags enabled
            if (FEATURE_FLAGS.ENABLE_WEED_TYPING_MINIGAME && !plot.hasWeed && plot.status === 'soil') {
                if (Math.random() < GAME_BALANCING.WEED_GROW_CHANCE) {
                    // Choose a random word
                    const word = this.englishWords[Math.floor(Math.random() * this.englishWords.length)];
                    plot.spawnWeed(word);
                    console.log(`Plot ${plot.id} grows a weed with word: "${word}"`);
                }
            }
        });

        // Redraw visuals and update status overlays
        this.refreshPlotsVisuals();
        this.updatePlotDetailsUI();
        this.updatePlayerHUD();
    }

    updatePlayerHUD() {
        const goldVal = document.getElementById('player-gold-val');
        const energyVal = document.getElementById('player-energy-val');
        const seedsVal = document.getElementById('player-seeds-val');
        const cropsVal = document.getElementById('player-crops-val');

        if (goldVal) goldVal.innerText = Math.floor(this.player.gold);
        if (energyVal) {
            energyVal.innerText = `${Math.floor(this.player.energy)}/${this.player.maxEnergy}`;
            // Progress bar
            const bar = document.getElementById('player-energy-bar');
            if (bar) {
                bar.style.width = `${(this.player.energy / this.player.maxEnergy) * 100}%`;
            }
        }

        if (seedsVal) {
            seedsVal.innerHTML = `
                🍅 Tomato: ${this.player.inventory.seeds.tomato} | 
                🥕 Carrot: ${this.player.inventory.seeds.carrot} | 
                🌽 Corn: ${this.player.inventory.seeds.corn}
            `;
        }

        if (cropsVal) {
            cropsVal.innerHTML = `
                🍅 Tomato: ${this.player.inventory.crops.tomato} | 
                🥕 Carrot: ${this.player.inventory.crops.carrot} | 
                🌽 Corn: ${this.player.inventory.crops.corn}
            `;
        }
    }

    updatePlotDetailsUI() {
        const detailsContainer = document.getElementById('farming-plot-details');
        if (!detailsContainer) return;

        let html = '<div class="plots-grid-ui">';
        this.plots.forEach((plot, index) => {
            const isSelected = this.selectedPlotIndex === index;
            let cropInfo = 'Empty';
            let stageInfo = '';
            
            if (plot.crop) {
                const stages = ['Seed', 'Sprout', 'Growing', 'Ripe 🍅'];
                cropInfo = `${plot.crop.type.toUpperCase()}`;
                stageInfo = `${stages[plot.crop.growthStage]} (${Math.round(plot.crop.growthProgress * 100)}%)`;
                if (plot.crop.watered) stageInfo += ' [Watered]';
            }

            let weedStatus = '';
            if (plot.hasWeed) {
                weedStatus = `<span class="badge badge-weed">Weeds: "${plot.weedWord}"</span>`;
            }

            html += `
                <div class="plot-ui-card ${isSelected ? 'selected' : ''}" onclick="window.gameApp.selectPlot(${index})">
                    <div class="plot-header">Plot #${plot.id} (${plot.status})</div>
                    <div class="plot-body">
                        <strong>Crop:</strong> ${cropInfo}<br>
                        ${stageInfo ? `<strong>Progress:</strong> ${stageInfo}<br>` : ''}
                        ${weedStatus}
                    </div>
                </div>
            `;
        });
        html += '</div>';

        // Add action buttons for the selected plot
        const selectedPlot = this.plots[this.selectedPlotIndex];
        html += `
            <div class="plot-actions-panel" style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
                <h3>Plot #${selectedPlot.id} Actions</h3>
                <div style="display: flex; gap: 8px;">
                    <button class="action-btn" onclick="window.gameApp.handlePlow()" ${selectedPlot.status === 'soil' ? 'disabled' : ''}>Plow [P] (Cuốc đất -5⚡)</button>
                    <button class="action-btn" onclick="window.gameApp.handlePlant()" ${selectedPlot.status === 'grass' || selectedPlot.crop ? 'disabled' : ''}>Plant [L] (Gieo hạt)</button>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="action-btn" onclick="window.gameApp.handleWater()" ${!selectedPlot.crop || selectedPlot.crop.watered ? 'disabled' : ''}>Water [K] (Tưới nước -3⚡)</button>
                    <button class="action-btn" onclick="window.gameApp.handleHarvest()" ${!selectedPlot.crop || !selectedPlot.crop.isRipe() ? 'disabled' : ''}>Harvest [H] (Thu hoạch)</button>
                </div>
            </div>
        `;

        // Update weed typing minigame section
        if (FEATURE_FLAGS.ENABLE_WEED_TYPING_MINIGAME) {
            const weedPlots = this.plots.filter(p => p.hasWeed);
            const weedInputContainer = document.getElementById('weed-minigame-container');
            if (weedInputContainer) {
                if (weedPlots.length > 0) {
                    if (!this.currentWeedPlot || !this.currentWeedPlot.hasWeed) {
                        this.currentWeedPlot = weedPlots[0];
                    }
                    weedInputContainer.style.display = 'block';
                    document.getElementById('weed-target-word').innerText = this.currentWeedPlot.weedWord;
                    document.getElementById('weed-plot-number').innerText = this.currentWeedPlot.id;
                } else {
                    this.currentWeedPlot = null;
                    weedInputContainer.style.display = 'none';
                }
            }
        }

        detailsContainer.innerHTML = html;
    }

    selectPlot(index) {
        this.soundSystem.playSFX('click');
        this.selectedPlotIndex = index;
        this.updatePlotDetailsUI();
    }

    handlePlow() {
        const plot = this.plots[this.selectedPlotIndex];
        if (plot.status === 'grass') {
            if (this.player.consumeEnergy(5)) {
                plot.plow();
                this.soundSystem.playSFX('dig');
                this.refreshPlotsVisuals();
                this.updatePlotDetailsUI();
                this.updatePlayerHUD();
                console.log(`Plot ${plot.id} plowed.`);
            } else {
                alert("No energy left!");
                this.soundSystem.playSFX('wrong');
            }
        }
    }

    handlePlant() {
        const plot = this.plots[this.selectedPlotIndex];
        if (plot.status === 'soil' && !plot.crop) {
            if (this.player.inventory.seeds[this.selectedSeed] > 0) {
                if (this.player.spendSeed(this.selectedSeed, 1)) {
                    // Create crop (tomato/carrot: 10s, corn: 15s)
                    const growTime = this.selectedSeed === 'corn' ? 15 : 10;
                    const crop = new Crop(Date.now(), this.selectedSeed, growTime);
                    plot.plant(crop);
                    
                    this.soundSystem.playSFX('seed');
                    this.assetPresenter.triggerGrowth(`crop_visual_${plot.id}`, 2.0); // quick growth entrance visual scale

                    this.refreshPlotsVisuals();
                    this.updatePlotDetailsUI();
                    this.updatePlayerHUD();
                    console.log(`Planted ${this.selectedSeed} on Plot ${plot.id}.`);
                }
            } else {
                alert(`You do not have any ${this.selectedSeed} seeds! Purchase some seeds from the shop first.`);
                this.soundSystem.playSFX('wrong');
            }
        }
    }

    handleWater() {
        const plot = this.plots[this.selectedPlotIndex];
        if (plot.crop && !plot.crop.watered) {
            if (this.player.consumeEnergy(3)) {
                plot.water();
                this.soundSystem.playSFX('water');
                this.refreshPlotsVisuals();
                this.updatePlotDetailsUI();
                this.updatePlayerHUD();
                console.log(`Plot ${plot.id} crop watered.`);
            } else {
                alert("No energy left!");
                this.soundSystem.playSFX('wrong');
            }
        }
    }

    handleHarvest() {
        const plot = this.plots[this.selectedPlotIndex];
        if (plot.crop && plot.crop.isRipe()) {
            const cropType = plot.crop.type;
            const harvested = plot.harvest();
            if (harvested) {
                this.player.addCrop(cropType, 1);
                // Reward gold instantly too
                const rewardGold = cropType === 'tomato' ? 15 : (cropType === 'carrot' ? 20 : 35);
                this.player.addGold(rewardGold);
                this.player.recoverEnergy(5); // slightly recover energy on harvest

                this.soundSystem.playSFX('harvest');
                this.refreshPlotsVisuals();
                this.updatePlotDetailsUI();
                this.updatePlayerHUD();
                console.log(`Harvested ripe ${cropType} from Plot ${plot.id}. Gained ${rewardGold} gold.`);
            }
        }
    }

    toggleWeedingMode() {
        // Toggle side menu open & focus on weed minigame input
        const sidebar = document.getElementById('sidebar-panel');
        if (sidebar && sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
        }
        
        // Find weed input
        const inputField = document.getElementById('weed-typing-input');
        if (inputField) {
            inputField.focus();
            this.soundSystem.playSFX('click');
        }
    }

    handleFertilizing() {
        // Fertilizing costs 5 gold and increases crop growth progress instantly by 20%
        const plot = this.plots[this.selectedPlotIndex];
        if (plot.crop && !plot.crop.isRipe()) {
            if (this.player.spendGold(5)) {
                plot.crop.growthProgress = Math.min(1.0, plot.crop.growthProgress + 0.2);
                if (plot.crop.growthProgress >= 1.0) {
                    plot.crop.growthStage = 3;
                } else if (plot.crop.growthProgress >= 0.6) {
                    plot.crop.growthStage = 2;
                } else if (plot.crop.growthProgress >= 0.2) {
                    plot.crop.growthStage = 1;
                }
                this.soundSystem.playSFX('seed');
                this.refreshPlotsVisuals();
                this.updatePlotDetailsUI();
                this.updatePlayerHUD();
                console.log(`Plot ${plot.id} fertilized.`);
            } else {
                alert("Not enough gold to purchase fertilizer (costs 5 gold)!");
                this.soundSystem.playSFX('wrong');
            }
        } else {
            alert("No growing crop on this plot to fertilize!");
            this.soundSystem.playSFX('wrong');
        }
    }

    submitWeedTyping() {
        const inputField = document.getElementById('weed-typing-input');
        if (!inputField || !this.currentWeedPlot) return;

        const typedVal = inputField.value.trim().toLowerCase();
        const targetVal = this.currentWeedPlot.weedWord.toLowerCase();

        if (typedVal === targetVal) {
            // Success! Clear weed
            this.currentWeedPlot.clearWeed();
            
            // Add rewards
            this.player.addGold(10);
            this.player.recoverEnergy(2);

            this.soundSystem.playSFX('correct');
            inputField.value = '';
            this.currentWeedPlot = null;
            
            this.refreshPlotsVisuals();
            this.updatePlotDetailsUI();
            this.updatePlayerHUD();
            console.log("Weed cleared successfully. Gained 10 gold!");
        } else {
            // Failed
            this.soundSystem.playSFX('wrong');
            inputField.classList.add('error-shake');
            setTimeout(() => inputField.classList.remove('error-shake'), 400);
            console.log("Wrong typing! Try again.");
        }
    }

    setupUIEventHandlers() {
        // Handle seed select button clicks
        const seedTomato = document.getElementById('btn-seed-tomato');
        const seedCarrot = document.getElementById('btn-seed-carrot');
        const seedCorn = document.getElementById('btn-seed-corn');

        const selectSeedType = (type, btn) => {
            this.soundSystem.playSFX('click');
            this.selectedSeed = type;
            [seedTomato, seedCarrot, seedCorn].forEach(b => b?.classList.remove('active'));
            btn?.classList.add('active');
        };

        if (seedTomato) seedTomato.addEventListener('click', () => selectSeedType('tomato', seedTomato));
        if (seedCarrot) seedCarrot.addEventListener('click', () => selectSeedType('carrot', seedCarrot));
        if (seedCorn) seedCorn.addEventListener('click', () => selectSeedType('corn', seedCorn));

        // Weed minigame input event handler
        const weedInput = document.getElementById('weed-typing-input');
        if (weedInput) {
            weedInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.submitWeedTyping();
                }
            });
        }
        
        const weedSubmitBtn = document.getElementById('btn-weed-submit');
        if (weedSubmitBtn) {
            weedSubmitBtn.addEventListener('click', () => this.submitWeedTyping());
        }

        // Shop purchase buttons
        const buyTomatoSeed = document.getElementById('btn-buy-tomato');
        const buyCarrotSeed = document.getElementById('btn-buy-carrot');
        const buyCornSeed = document.getElementById('btn-buy-corn');

        const buySeed = (type, cost) => {
            this.soundSystem.playSFX('click');
            if (this.player.spendGold(cost)) {
                this.player.addSeed(type, 1);
                this.updatePlayerHUD();
                console.log(`Bought 1 ${type} seed.`);
            } else {
                alert("Not enough gold!");
                this.soundSystem.playSFX('wrong');
            }
        };

        if (buyTomatoSeed) buyTomatoSeed.addEventListener('click', () => buySeed('tomato', 10));
        if (buyCarrotSeed) buyCarrotSeed.addEventListener('click', () => buySeed('carrot', 15));
        if (buyCornSeed) buyCornSeed.addEventListener('click', () => buySeed('corn', 25));

        // Sell crops buttons
        const sellTomato = document.getElementById('btn-sell-tomato');
        const sellCarrot = document.getElementById('btn-sell-carrot');
        const sellCorn = document.getElementById('btn-sell-corn');

        const sellCrop = (type, price) => {
            this.soundSystem.playSFX('click');
            if (this.player.inventory.crops[type] > 0) {
                this.player.inventory.crops[type]--;
                this.player.addGold(price);
                this.updatePlayerHUD();
                console.log(`Sold 1 ${type} crop for ${price} gold.`);
            } else {
                alert(`No harvested ${type} in inventory!`);
                this.soundSystem.playSFX('wrong');
            }
        };

        if (sellTomato) sellTomato.addEventListener('click', () => sellCrop('tomato', 15));
        if (sellCarrot) sellCarrot.addEventListener('click', () => sellCrop('carrot', 20));
        if (sellCorn) sellCorn.addEventListener('click', () => sellCrop('corn', 35));

        // Close button handler for sidebar-panel
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
        if (sidebarCloseBtn) {
            sidebarCloseBtn.addEventListener('click', () => {
                this.soundSystem.playSFX('click');
                const sidebar = document.getElementById('sidebar-panel');
                if (sidebar) {
                    sidebar.classList.add('collapsed');
                }
            });
        }

        // Auto-hide sidebar when user tabs out of the page or changes browser tabs
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                const sidebar = document.getElementById('sidebar-panel');
                if (sidebar) {
                    sidebar.classList.add('collapsed');
                }
            }
        });

        window.addEventListener('blur', () => {
            const sidebar = document.getElementById('sidebar-panel');
            if (sidebar) {
                sidebar.classList.add('collapsed');
            }
        });

        // Setup Settings Panel event handlers
        this.setupSettingsPanelHandlers();

        // Setup Keyboard Hotkeys for farming actions and Shop model clicking
        this.setupKeyboardHotkeys();
        this.setupModelClickRaycaster();
    }

    setupSettingsPanelHandlers() {
        // 1. Weather Select Select
        const weatherSelect = document.getElementById('settings-select-weather');
        if (weatherSelect) {
            weatherSelect.addEventListener('change', (e) => {
                this.soundSystem.playSFX('click');
                this.terrainSystem.setWeather(e.target.value);
            });
        }

        // 2. Time of Day Select
        const timeSelect = document.getElementById('settings-select-time');
        if (timeSelect) {
            timeSelect.addEventListener('change', (e) => {
                this.soundSystem.playSFX('click');
                this.terrainSystem.setTimeOfDay(e.target.value);
            });
        }

        // 3. Sound Toggle Button
        const toggleSoundBtn = document.getElementById('btn-toggle-sound');
        if (toggleSoundBtn) {
            toggleSoundBtn.addEventListener('click', () => {
                const isMuted = this.soundSystem.toggleMute();
                toggleSoundBtn.innerText = isMuted ? "Unmute Sound" : "Mute Sound";
            });
        }

        // 4. Gate Toggle Button
        const toggleGateBtn = document.getElementById('settings-btn-toggle-gate');
        if (toggleGateBtn) {
            toggleGateBtn.addEventListener('click', () => {
                this.soundSystem.playSFX('click');
                this.terrainSystem.toggleGate();
                // gateState: starts as 'open' in code, gets toggled to 'closed' or back
                const nextState = this.terrainSystem.gateState === 'open' ? 'Open (Mở)' : 'Closed (Đóng)';
                toggleGateBtn.innerText = nextState;
            });
        }

        // 5. Reset Camera Button
        const resetCameraBtn = document.getElementById('settings-btn-reset-pos');
        if (resetCameraBtn) {
            resetCameraBtn.addEventListener('click', () => {
                this.soundSystem.playSFX('click');
                if (this.terrainSystem.camera && this.terrainSystem.controls) {
                    this.terrainSystem.camera.position.set(0, 150, 250);
                    this.terrainSystem.controls.target.set(0, 0, 0);
                    this.terrainSystem.controls.update();
                }
                if (this.terrainSystem.accumulatedShift) {
                    this.terrainSystem.accumulatedShift.set(0, 0, 0);
                }
            });
        }
    }

    setupKeyboardHotkeys() {
        window.addEventListener('keydown', (e) => {
            // Check if user is typing in the weed minigame input field
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                return; // let typing flow normally
            }

            const key = e.key.toLowerCase();
            if (key === '1') {
                this.soundSystem.playSFX('click');
                this.selectedSeed = 'tomato';
                document.getElementById('btn-seed-tomato')?.click();
            } else if (key === '2') {
                this.soundSystem.playSFX('click');
                this.selectedSeed = 'carrot';
                document.getElementById('btn-seed-carrot')?.click();
            } else if (key === '3') {
                this.soundSystem.playSFX('click');
                this.selectedSeed = 'corn';
                document.getElementById('btn-seed-corn')?.click();
            } else if (key === 'p') {
                // Plow keybind
                this.handlePlow();
            } else if (key === 'l') {
                // Plant keybind
                this.handlePlant();
            } else if (key === 'k') {
                // Water keybind
                this.handleWater();
            } else if (key === 'h') {
                // Harvest keybind
                this.handleHarvest();
            }
        });
    }

    setupModelClickRaycaster() {
        const container = document.getElementById('canvas-container');
        if (!container) return;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        container.addEventListener('click', (e) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, this.terrainSystem.camera);

            // Intersect with active assets
            const intersectableObjects = [];
            const assetToEntityMap = new Map();

            this.assetPresenter.activeAssets.forEach((group, entityId) => {
                intersectableObjects.push(group);
                // Also map children to the entityId
                group.traverse(child => {
                    if (child.isMesh) {
                        assetToEntityMap.set(child, entityId);
                    }
                });
            });

            const intersects = raycaster.intersectObjects(intersectableObjects, true);
            if (intersects.length > 0) {
                // Get top parent or mapped entityId
                let targetMesh = intersects[0].object;
                const entityId = assetToEntityMap.get(targetMesh);

                if (entityId) {
                    console.log("Clicked 3D model entity:", entityId);
                    if (entityId.includes('merchant') || entityId.includes('seedseller') || entityId.includes('barn')) {
                        // Open the Shop panel tab
                        this.soundSystem.playSFX('click');
                        switchTab('shop');
                        // Ensure sidebar is open to see the shop
                        const sidebar = document.getElementById('sidebar-panel');
                        if (sidebar && sidebar.classList.contains('collapsed')) {
                            sidebar.classList.remove('collapsed');
                        }
                    } else if (entityId.includes('plot_visual')) {
                        // Select this plot index
                        const plotIdStr = entityId.replace('plot_visual_', '');
                        const idVal = parseInt(plotIdStr, 10);
                        const idx = this.plots.findIndex(p => p.id === idVal);
                        if (idx !== -1) {
                            this.selectPlot(idx);
                        }
                    }
                }
            }
        });
    }
}

// Global hook for events
window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new GameApp();
    window.gameApp.init().catch((err) => {
        console.error("GameApp: Failed to initialize GameApp", err);
    });
});
