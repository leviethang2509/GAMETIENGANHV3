# CHAPTER 2 IMPLEMENTATION BLUEPRINT: ENHANCED INTERACTIONS & GAMEPLAY ENVIRONMENT

This document outlines the architecture, components, and integration steps for Chapter 2 of the Cozy Farming & English Puzzle game. Chapter 2 focuses on preloading/spawning environment models, completing the settings overlay panel wiring, correcting NPC interactions, and polishing UI layouts.

---

## 1. KEY SPECIFICATIONS & ARCHITECTURE

### 1.1. Models & Spawning Configuration
*   **Asset Keys**: `compostbin` and `waterpump`
*   **Asset Scaling**: `15.0` (Already mapped in `AssetPresenter.js` under `this.scaleMappings`)
*   **Asset Positioning**:
    *   `compostbin`: Spawned at `(15, height, -25)`
    *   `waterpump`: Spawned at `(-15, height, -28)`
    *   Both height values must be calculated using `getTerrainHeight(x, z)` to sit correctly on the terrain.
    *   These models will be registered, cached, preloaded, and spawned via `AssetPresenter` in the static setup phase.

### 1.2. Settings Control Event Mapping
*   **Weather Selector (`#settings-select-weather`)**: Triggers `terrainSystem.setWeather(mode)` when changed.
*   **Time of Day Selector (`#settings-select-time`)**: Triggers `terrainSystem.setTimeOfDay(time)` when changed.
*   **Mute Sound Button (`#btn-toggle-sound`)**:
    *   Toggles mute state in `soundSystem`.
    *   Updates the text dynamically (`Mute Sound` vs `Unmute Sound`).
    *   Uses a mute toggling method on `SoundSystem`. We'll verify or implement `toggleMute()` in `SoundSystem.js` that modifies the master gain node or loops.
*   **Toggle Gate Button (`#settings-btn-toggle-gate`)**:
    *   Triggers `terrainSystem.toggleGate()`.
    *   Updates the button label accordingly to show current state: "Open (Mở)" or "Closed (Đóng)".
*   **Reset Camera Button (`#settings-btn-reset-pos`)**:
    *   Resets the camera and control positions to initial values:
        *   `camera.position.set(0, 150, 250)`
        *   `controls.target.set(0, 0, 0)`
        *   Reset any accumulated shifts in the controls if needed.

### 1.3. NPC Interactions (Seedseller Click Trigger)
*   When the player clicks on the `npc_seedseller` model in the 3D scene (using raycasting):
    *   Switches the sidebar tab to `shop` (via `switchTab('shop')` or game-level toggle).
    *   Expands/opens the sidebar panel if it is currently collapsed (removes the `collapsed` class from `#sidebar-panel`).

### 1.4. Style Cleanup & UI Layout Polish
*   **Obsolete Buttons Removal**: Eliminate any leftover hamburger menu toggle buttons that clutter the layout or duplicate sidebar controls.
*   **Farming Skills Bar**:
    *   Ensure the `.skills-wheel-container` remains clean and completely horizontal.
    *   Ensure layout is centered at the bottom of the viewer canvas.

---

## 2. DETAILED IMPLEMENTATION STEPS

1.  **Modify `js/main.js`**:
    *   Add `compostbin` and `waterpump` paths to `glbAssets` dictionary in the `init()` method so they are preloaded.
    *   Update `spawnStaticEntities()` or add a new method to spawn compostbin at `(15, height, -25)` and waterpump at `(-15, height, -28)` with scale 5.0 using `AssetPresenter`.
    *   Register event listeners inside `setupUIEventHandlers()` for the settings panel elements:
        *   `#settings-select-weather` (change) -> `this.terrainSystem.setWeather(value)`
        *   `#settings-select-time` (change) -> `this.terrainSystem.setTimeOfDay(value)`
        *   `#btn-toggle-sound` (click) -> call `soundSystem.toggleMute()` and update button label
        *   `#settings-btn-toggle-gate` (click) -> call `this.terrainSystem.toggleGate()` and update label to "Open (Mở)" or "Closed (Đóng)"
        *   `#settings-btn-reset-pos` (click) -> reset camera position and target
    *   Refine `setupModelClickRaycaster()` to explicitly trigger the shop panel and expand sidebar when `npc_seedseller` (or other shop assets) are clicked.
2.  **Modify `js/infra/SoundSystem.js`**:
    *   Implement/verify `toggleMute()` method.
    *   Ensure it mutes or unmutes the `masterGain` or `BGMGain`/`SFXGain` and returns the new muted state.
3.  **Modify `index.html`**:
    *   Verify the existence of settings elements and ensure their IDs match the spec.
    *   Clean up any legacy, obsolete hamburger toggle buttons or scripts.
4.  **Modify `style.css`**:
    *   Update styling for `.skills-wheel-container` and buttons to align horizontally at the bottom center.
    *   Adjust settings overlay styling if needed.

---

## 3. SUCCESS CRITERIA

*   [x] `compostbin` GLB model is visible at `(15, height, -25)` on flat ground at scale `15.0`.
*   [x] `waterpump` GLB model is visible at `(-15, height, -28)` on flat ground at scale `15.0`.
*   [x] Weather dropdown works, updating rain/fog/snow effects in real-time.
*   [x] Time of day dropdown works, blending sky and light colors smoothly.
*   [x] Gate button opens and closes the gate doors in the 3D view with animated movement, updating the button text correctly.
*   [x] Reset camera button restores camera position to `(0, 150, 250)` and points the camera target back to origin.
*   [x] Raycasting on `seedseller` NPC switches the sidebar to "Shop" and expands it if collapsed.
*   [x] Skills bar layout is fully horizontal at the bottom center with no obsolete buttons.
