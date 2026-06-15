# CHAPTER 3 IMPLEMENTATION BLUEPRINT: CORE GAMEPLAY LOOPS, ENGLISH PUZZLE & SERIALIZATION

This document outlines the detailed architecture, directory layout, class specifications, and implementation steps for Chapter 3 of the Cozy Farming & English Puzzle game. Chapter 3 focuses on unifying the core farming loop, vocabulary puzzle systems, economy/progression mechanics, and state serialization within the strict boundaries of Clean Architecture.

---

## 1. SYSTEM OVERVIEW & ARCHITECTURAL GUIDELINES

Chapter 3 implements the complete gameplay engine. To ensure modularity and allow swapping out the English Puzzle mechanics or moving to multiplayer in the future, the system adheres to a strict **4-Layer Clean Architecture**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                    FRAMEWORKS & DRIVERS                     │
 │          (ThreeRenderer, SoundSystem, LocalStorage)         │
 │   ┌─────────────────────────────────────────────────────┐   │
 │   │                 INTERFACE ADAPTERS                  │   │
 │   │   (GameController, UIController, AssetPresenter)    │   │
 │   │   ┌─────────────────────────────────────────────┐   │   │
 │   │   │                  USE CASES                  │   │   │
 │   │   │    (PlowPlotAction, PlantCropAction, etc.)  │   │   │
 │   │   │   ┌─────────────────────────────────────┐   │   │   │
 │   │   │   │              ENTITIES               │   │   │   │
 │   │   │   │     (Player, Plot, Crop, Question)  │   │   │   │
 │   │   │   └─────────────────────────────────────┘   │   │   │
 │   │   └─────────────────────────────────────────────┘   │   │
 │   └─────────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────────┘
```

### 1.1 dependency Rules
1. **Entities** must not import or reference anything from outer layers (no Three.js, no DOM, no adapters, no Web Audio).
2. **Use Cases** interact only with Entities and Repository Interfaces (abstractions). They must be completely decoupled from the rendering loop and user interface.
3. **Adapters** coordinate the UI, handle user input (keyboard, mouse clicks, raycasting), and translate domain data into visual representation (Three.js meshes, DOM elements).
4. **Frameworks & Drivers** contain the external tools and platform APIs (Three.js Renderer, Web Audio API, `localStorage`).

---

## 2. DIRECTORY MAPPING & MODULE SCHEMAS

To support these Clean Architecture requirements, the workspace directory structure is mapped as follows:

```
js/
├── domain/                          # LAYER 1: ENTITIES
│   ├── config/
│   │   └── GameSettings.js          # Global Feature Flags & Balancing Config
│   └── models/
│       ├── Player.js                # Player state (gold, energy, inventory)
│       ├── Plot.js                  # Plot grid tile state & weeds
│       ├── Crop.js                  # Crop species, stage, and watered state
│       └── Question.js              # Word, meaning, choices, and audio cue data
│
├── usecases/                        # LAYER 2: USE CASES (BUSINESS LOGIC)
│   └── actions/
│       ├── PlowPlotAction.js        # Validates grass tile -> soil & consumes energy
│       ├── PlantCropAction.js       # Verifies seed inventory -> creates crop instance
│       ├── WaterCropAction.js       # Deducts energy -> waters crop
│       ├── HarvestCropAction.js     # Validates ripeness -> rewards player -> resets plot
│       ├── ClearWeedAction.js       # Resolves typing result / consumes energy to clear
│       ├── BuySeedAction.js         # Deducts gold -> adds seed to player inventory
│       ├── SellCropAction.js        # Deducts crop -> adds gold to player
│       ├── SaveGameAction.js        # Gathers domain state -> commits to storage
│       └── LoadGameAction.js        # Fetches raw data -> rebuilds entity graph
│
├── adapters/                        # LAYER 3: INTERFACE ADAPTERS
│   ├── GameController.js            # Key coordinator, handles ticks & command routing
│   ├── UIController.js              # Syncs DOM overlays, lists plots, prompts puzzles
│   ├── AssetPresenter.js            # Translates entities into Three.js models
│   └── StorageAdapter.js            # Serializes / deserializes entities to/from JSON
│
└── infra/                           # LAYER 4: FRAMEWORKS & DRIVERS
    ├── ThreeRenderer.js             # Scene, WebGL, lighting, camera, resize handlers
    ├── SoundSystem.js               # Web Audio API Graph & audio asset loader
    └── LocalStorageStore.js         # Directly reads/writes strings to browser storage
```

---

## 3. CORE GAMEPLAY SYSTEMS SPECIFICATION

### 3.1. The Farming Loop & Growth Mechanics
* **Plowing**: Triggered via UI click or keyboard shortcut `[P]`. Transforms plot status from `'grass'` to `'soil'`. Consumes `5` energy.
* **Planting**: Triggered via UI click or keyboard shortcut `[L]`. Requires selecting a seed (`tomato`, `carrot`, `corn`) and having it in the inventory. Creates a `Crop` instance attached to the target `Plot`.
* **Watering**: Triggered via UI click or keyboard shortcut `[K]`. If `FEATURE_FLAGS.REQUIRE_WATERING` is enabled, crops will grow at `50%` speed if unwatered, and `100%` speed if watered. Watering consumes `3` energy.
* **Fertilizing**: Optional action costing `5` gold that instantly increases growth progress by `20%` (updates growthStage accordingly).
* **Growth Stages**:
  * `Stage 0 (Seed)`: Growth Progress $0\% \le p < 20\%$. Model scale: `0.15`.
  * `Stage 1 (Sprout)`: Growth Progress $20\% \le p < 60\%$. Model scale: `0.40`.
  * `Stage 2 (Growing)`: Growth Progress $60\% \le p < 100\%$. Model scale: `0.70`.
  * `Stage 3 (Ripe)`: Growth Progress $p \ge 100\%$. Model scale: `1.00`.
* **Harvesting**: Triggered via UI click or keyboard shortcut `[H]`. Only allowed when the crop is in `Stage 3`. Clears the crop from the plot, yields `1` crop of that type to the player inventory, rewards gold instantly based on balancing parameters, and recovers `5` player energy.

### 3.2. English Puzzle Integration & Feature Flag Behaviors
The system adapts its workflow dynamically depending on configuration flags in `GameSettings.js`:

#### Scenario A: `ENABLE_ENGLISH_PUZZLE` is Enabled (`true`)
1. **Interactive Shop Gates**: Clicking on the merchant or seedseller does not open the shop immediately. Instead, a multiple-choice English vocabulary dialog modal pops up.
2. **Puzzle Layout**: An overlay shows a question (e.g., "Translate 'Harvest' to Vietnamese"), a hint, and 4 choices.
3. **Action Execution (`SubmitAnswerAction`)**:
   * **Correct Answer**: Plays `correct.wav`, rewards `10` gold, and unlocks access to the shop panel.
   * **Incorrect Answer**: Plays `wrong.wav`, deducts `5` energy (or gold if energy is depleted), shakes the modal frame, and generates a new question.

#### Scenario B: `ENABLE_ENGLISH_PUZZLE` is Disabled (`false`)
1. Clicking on shop NPCs directly expands the sidebar panel and switches the tab to `'shop'`.

#### Weed Typing Minigame (`ENABLE_WEED_TYPING_MINIGAME`)
* **When `true`**: Plots have a chance (`WEED_GROW_CHANCE`) to grow weeds with a target English word from the vocabulary bank. 
  * The player must toggle weeding mode, type the exact word in the input text box, and submit.
  * Success: Clears weeds, awards `10` gold, recovers `2` energy, and plays `correct.wav`.
  * Failure: Shakes input field, plays `wrong.wav`.
* **When `false`**: Clicking a weedy plot directly clears the weed while consuming `5` energy.

### 3.3. Economy & Progression
* **Seed Purchasing**: Seeds are bought in the Shop using gold.
  * Tomato Seed: Cost `10` gold.
  * Carrot Seed: Cost `15` gold.
  * Corn Seed: Cost `25` gold.
* **Crop Trading**: Harvested crops can be sold in the Shop.
  * Tomato Crop: Yields `15` gold.
  * Carrot Crop: Yields `20` gold.
  * Corn Crop: Yields `35` gold.
* **Energy Management**: 
  * The player has a max energy pool of `100`.
  * Energy recovers at a passive rate of `0.1` per second.
  * Attempting actions with insufficient energy is blocked, prompting a visual error message and playing `wrong.wav`.

### 3.4. Save / Load Serialization
State persistence prevents progress loss on page refresh.
* **State Struct**:
  ```json
  {
    "player": {
      "gold": 120,
      "energy": 85,
      "inventory": {
        "seeds": { "tomato": 4, "carrot": 2, "corn": 1 },
        "crops": { "tomato": 2, "carrot": 0, "corn": 0 }
      }
    },
    "plots": [
      {
        "id": 1,
        "status": "soil",
        "hasWeed": false,
        "weedWord": "",
        "crop": {
          "type": "tomato",
          "growthStage": 2,
          "watered": true,
          "growthProgress": 0.65,
          "growthTime": 10
        }
      }
    ]
  }
  ```
* **Serialization Adapter (`StorageAdapter.js`)**: Converts active domain models into clean JSON strings, omitting non-serializable elements (such as Three.js Groups, timers, event listeners).
* **Drivers (`LocalStorageStore.js`)**: Encapsulates direct reading/writing to `localStorage` key `'cozy_farm_v3_savestate'` within a `try/catch` wrapper to handle write failures or corrupted states.
* **Autosave Cycle**: Triggered automatically in the main game loop every `30` seconds or immediately after a successful transaction (crop harvest or seed purchase).

### 3.5. Dynamic Data Administration (In-Game Admin System)
To support real-time data management without modifying or redeploying the source code, an administrative interface allows the CRUD configuration of primary game objects:
* **Admin Control Center Overlay**: Accessible via a special toggled keyboard shortcut (e.g., `[Ctrl + Shift + A]`) or an obscure settings panel option, presenting:
  * **Question Editor**: Administrators can dynamically insert, update, or remove vocabulary questions, choice arrays, Vietnamese translations, and reference hints.
  * **Item & Seed Registry**: Configure seed properties (growth time, price, selling reward, and resource scaling factor) on the fly.
  * **Model Path Mapping**: Inject or modify GLB model resource links, base scale parameters, and assign models to newly registered items/crops.
  * **Live Event Manager**: Toggle globally active gameplay modifiers such as Double Gold Events, Energy Cost Reductions, or High Weed Spawn triggers.
* **Data Flow & Hydration**:
  * Any administrative modification triggers a save to a secondary local storage key (`'cozy_farm_v3_adminconfig'`).
  * On launch, the game hydrator loads this configuration block and overwrites default arrays/properties in `WordBank`, `GameSettings`, and `AssetPresenter`.
  * Dynamically added models are asynchronously fetched and registered on the fly using `AssetPresenter.preloadModel()`.

---

## 4. GRAPHICS & THREE.JS INTERACTION PIPELINE

To match the low-poly cozy aesthetic, the rendering loop utilizes custom visual techniques built on top of Three.js.

### 4.1. Raycasting & Mouse Interaction
1. A mouse listener on the `#canvas-container` translates mouse coordinates to Normalized Device Coordinates (NDC).
2. `raycaster.setFromCamera(mouse, camera)` projects a ray into the scene.
3. Meshes are mapped to entity IDs using a lookup map in `AssetPresenter.js`. 
4. Raycast hits on `plot_visual_X` select plot $X$ in the GUI. Hits on `npc_seedseller` or `npc_merchant` initiate dialogue and shop/puzzle triggers.

### 4.2. Dynamic Pivot Alignment
Some downloaded model files do not have their pivot points centered at their bottom boundary, causing them to float or sink into the terrain. `AssetPresenter` forces bottom-center alignment:
```javascript
const box = new THREE.Box3().setFromObject(meshGroup);
const bottomY = box.min.y;
meshGroup.traverse((child) => {
    if (child.isMesh) {
        child.position.y -= bottomY; // Shift child meshes down relative to group origin
    }
});
```

### 4.3. Wind Sway Animation
Crops and tree leaves fluctuate dynamically to simulate wind. The vertex displacement is driven by a trigonometric phase offset based on world positions:
```javascript
// Inside the main render tick loop:
const time = performance.now() * 0.0015;
swayGroup.forEach((mesh) => {
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    // Unique phase offset per object prevents uniform synchronized motion
    const phase = worldPos.x * 0.4 + worldPos.z * 0.3;
    mesh.rotation.z = Math.sin(time + phase) * 0.05; // Max 2.8 degrees sway
    mesh.rotation.x = Math.cos(time * 0.8 + phase) * 0.03;
});
```

---

## 5. WEB AUDIO ROUTING SPECIFICATIONS

To deliver spatial feedback and clear interactive loops, the `SoundSystem` routes audio signals through a dedicated Node Graph using the Web Audio API.

```
                  ┌─────────────────┐
                  │   AudioBuffer   │
                  └────────┬────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ AudioBufferSource │
                 └─────────┬─────────┘
                           │
             ┌─────────────┼──────────────┬──────────────────┐
             ▼             ▼              ▼                  ▼
      ┌────────────┐┌────────────┐ ┌────────────┐     ┌────────────┐
      │  BGM Node  ││  SFX Node  │ │ Voice Node │     │ 3D Spatial │
      └──────┬─────┘└──────┬─────┘ └──────┬─────┘     └──────┬─────┘
             │             │              │                  │
             │             │              │                  ▼
             │             │              │             ┌──────────┐
             │             │              │             │PannerNode│
             │             │              │             └────┬─────┘
             ▼             ▼              ▼                  │
      ┌────────────┐┌────────────┐ ┌────────────┐            │
      │  BGM Gain  ││  SFX Gain  │ │ Voice Gain │            │
      └──────┬─────┘└──────┬─────┘ └──────┬─────┘            │
             │             │              │                  │
             └─────────────┼──────────────┴──────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   Master Gain   │
                  └────────┬────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │AudioContext.dest  │
                 └───────────────────┘
```

* **Master Gain Node**: Controls overall system volume (allows global muting).
* **Sub-Gains (BGM Gain, SFX Gain, Voice Gain)**: Allows adjusting relative balance (e.g., lower BGM volume during dialogue play).
* **PannerNode (3D Positional Audio)**: Attaches sound sources (cows, ducks, running river water) to 3D points. 
  * Sound attenuation matches standard inverse-distance parameters.
  * The audio listener position is updated in sync with the Three.js camera position and orientation inside the render tick:
  ```javascript
  const pos = camera.position;
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  
  listener.positionX.value = pos.x;
  listener.positionY.value = pos.y;
  listener.positionZ.value = pos.z;
  listener.forwardX.value = forward.x;
  listener.forwardY.value = forward.y;
  listener.forwardZ.value = forward.z;
  listener.upX.value = up.x;
  listener.upY.value = up.y;
  listener.upZ.value = up.z;
  ```

---

## 6. IMPLEMENTATION STEPS

These steps detail the sequence of tasks required to transition the prototype into a fully featured Clean Architecture structure:

### Phase 1: Establish Domain Entities & Base State
1. **Define Entities**: Create/verify domain models under `js/domain/models/` for `Player.js`, `Plot.js`, and `Crop.js`. Ensure they contain raw state property definitions, constructors, and mutators but no outer-layer classes.
2. **Establish Game Settings**: Review `js/domain/config/GameSettings.js` to verify standard game balancing coefficients (initial gold/energy, weed growth rates, ticks).
3. **Assemble Word Database**: Create a vocabulary bank in `js/domain/models/Question.js` or `js/domain/config/WordBank.js` detailing matching terms, Vietnamese definitions, hints, and sound path cues.

### Phase 2: Create Action Use Cases
4. **Implement `PlowPlotAction`**: Write a logic class checking plot state, subtracting energy from player, and setting plot status to `'soil'`.
5. **Implement `PlantCropAction`**: Write an action checking if plot is plowed, deducting seed inventory, and attaching a new `Crop` model.
6. **Implement `WaterCropAction`**: Write an action checking for crop presence, updating `watered` state, and deducting energy.
7. **Implement `HarvestCropAction`**: Write an action verifying crop growth completion ($p \ge 1.0$), clearing the crop instance, and updating player gold, energy, and crop inventory.
8. **Implement `BuySeedAction`**: Write a use case class validating player gold balance against seed costs and adjusting inventory count.
9. **Implement `SellCropAction`**: Write a use case validating crop inventories, executing sales, and updating gold balance.
10. **Implement `ClearWeedAction`**: Write a class verifying typed text matches the weed's target word, awarding gold, and clearing plot weed state.
11. **Implement `SaveGameAction` & `LoadGameAction`**: Create serialization classes that serialize entities to JSON strings and rebuild the domain model graphs from stored states.

### Phase 3: Setup Adapters & Drivers
12. **Create `StorageAdapter` & `LocalStorageStore`**: Build the interface mapping raw storage data into JS objects and saving string output.
13. **Construct `GameController`**: Write the central adapter class that manages game initialization, clock tick triggers, features flag switches, and coordinates keyboard and mouse interactions with Use Case actions.
14. **Construct `UIController`**: Map DOM elements, manage modals, draw plot layout grids, and handle error prompt shake animations.
15. **Integrate Graphics & Audio in `AssetPresenter`**: Wire dynamic scaling, wind sway trigonometric calculations, pivot alignments, and link positional panner nodes.

### Phase 4: Verification & Integration Testing
16. **Run System Integration Loop**: Ensure gameplay updates correctly on tick rate frequency, state autosaves periodically, and components degrade gracefully when feature flags are toggled.

---

## 7. SUCCESS CRITERIA

* [ ] **Clean Architecture Compliance**: No files under `js/domain/` contain Three.js or DOM imports.
* [ ] **Farming Loop Integration**: Soil can be plowed, planted with selected seeds, watered (with visual indicator changes), and harvested when ripe.
* [ ] **Dynamic English Puzzle Gates**: If `ENABLE_ENGLISH_PUZZLE` is true, clicking shop NPCs opens a multiple-choice vocabulary quiz. Solving it successfully gives gold and grants access to shop trading. If false, clicking shop NPCs directly opens the shop.
* [ ] **Weed Typing Minigame**: Weeds spawn randomly on plowed soil with vocabulary words. Typing the word correctly clears the weed and plays `correct.wav`.
* [ ] **Audio routing setup**: Web Audio Graph operates with a functional master gain, and BGM/SFX sub-nodes react to settings panels.
* [ ] **Save/Load Serialization**: Page refresh restores player gold, inventory, and crops growth progress back to active state.
* [ ] **Dynamic Data Administration**: Admin console overlay allows in-game updates of questions, seeds/items, model mappings, and events, saved under `'cozy_farm_v3_adminconfig'`.
