// js/domain/models/Crop.js
export class Crop {
    constructor(id, type, growthTime = 10) {
        this.id = id;
        this.type = type; // 'tomato', 'carrot', 'corn'
        this.growthStage = 0; // 0: Seed, 1: Sprout, 2: Growing, 3: Ripe
        this.watered = false;
        this.growthProgress = 0.0; // 0.0 to 1.0
        this.growthTime = growthTime; // Time needed to grow in seconds (under normal conditions)
    }

    updateGrowth(deltaTime, requireWatering = true) {
        if (this.growthProgress >= 1.0) {
            this.growthProgress = 1.0;
            this.growthStage = 3;
            return;
        }

        // Under normal settings, watering is required. If requirement is bypassed or crop is watered:
        const canGrow = !requireWatering || this.watered;
        
        if (canGrow) {
            // If watered, grow at normal speed, otherwise if requireWatering is false but not watered, grow slower
            const multiplier = this.watered ? 1.0 : 0.5;
            this.growthProgress += (deltaTime / this.growthTime) * multiplier;
            
            if (this.growthProgress >= 1.0) {
                this.growthProgress = 1.0;
                this.growthStage = 3;
            } else if (this.growthProgress >= 0.6) {
                this.growthStage = 2;
            } else if (this.growthProgress >= 0.2) {
                this.growthStage = 1;
            }
        }
    }

    water() {
        this.watered = true;
    }

    resetWatering() {
        this.watered = false;
    }

    isRipe() {
        return this.growthProgress >= 1.0;
    }
}
