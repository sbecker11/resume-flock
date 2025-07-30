// modules/core/abstracts/BaseComponent.mjs
// Minimal BaseComponent for compatibility with recovered controllers

export class BaseComponent {
    constructor(name) {
        this.name = name;
        this.isInitialized = false;
    }

    initialize() {
        this.isInitialized = true;
    }

    isReady() {
        return this.isInitialized;
    }

    getDependencies() {
        return [];
    }
}