// js/domain/models/Plot.js
export class Plot {
    constructor(id, x, z) {
        this.id = id;
        this.position = { x, z }; // Grid coordinates
        this.crop = null; // Crop object or null
        this.status = 'grass'; // 'grass', 'soil'
        this.hasWeed = false;
        this.weedWord = ''; // Word to type if ENABLE_WEED_TYPING_MINIGAME
    }

    plow() {
        if (this.status === 'grass') {
            this.status = 'soil';
            return true;
        }
        return false;
    }

    plant(crop) {
        if (this.status === 'soil' && !this.crop) {
            this.crop = crop;
            return true;
        }
        return false;
    }

    water() {
        if (this.crop) {
            this.crop.water();
            return true;
        }
        return false;
    }

    harvest() {
        if (this.crop && this.crop.isRipe()) {
            const harvestedType = this.crop.type;
            this.crop = null;
            return harvestedType;
        }
        return null;
    }

    spawnWeed(word = '') {
        this.hasWeed = true;
        this.weedWord = word;
    }

    clearWeed() {
        this.hasWeed = false;
        this.weedWord = '';
    }
}
