// js/domain/models/Player.js
export class Player {
    constructor(gold = 100, energy = 100, maxEnergy = 100) {
        this.gold = gold;
        this.energy = energy;
        this.maxEnergy = maxEnergy;
        this.inventory = {
            seeds: {
                tomato: 5,
                carrot: 5,
                corn: 3
            },
            crops: {
                tomato: 0,
                carrot: 0,
                corn: 0
            }
        };
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = 0;
    }

    addGold(amount) {
        this.gold += amount;
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    consumeEnergy(amount) {
        if (this.energy >= amount) {
            this.energy -= amount;
            return true;
        }
        return false;
    }

    recoverEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }

    addSeed(type, amount = 1) {
        if (!this.inventory.seeds[type]) {
            this.inventory.seeds[type] = 0;
        }
        this.inventory.seeds[type] += amount;
    }

    spendSeed(type, amount = 1) {
        if (this.inventory.seeds[type] && this.inventory.seeds[type] >= amount) {
            this.inventory.seeds[type] -= amount;
            return true;
        }
        return false;
    }

    addCrop(type, amount = 1) {
        if (!this.inventory.crops[type]) {
            this.inventory.crops[type] = 0;
        }
        this.inventory.crops[type] += amount;
    }
}
