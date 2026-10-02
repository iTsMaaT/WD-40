class FilterManager {
    constructor(queue, filters = {}) {
        this._volume = 0.5;
        this.queue = queue;
        this.filters = filters;
        this.enabledFilters = new Map();
    }

    // Formatted in <FilterName::ffmpegProperty, value>
    _buildFilterChain() {
        const finalChain = [...this.enabledFilters.values()];

        if (this._volume < 1) finalChain.push(`volume=${this._volume}`);

        return finalChain.join(",");
    }

    isToggled(key) {
        return this.enabledFilters.has(key);
    }

    toggle(key) {
        const isToggled = this.enabledFilters.has(key);

        if (isToggled) {
            this.enabledFilters.delete(key);
        } else {
            const filterProperties = this.filters[key];
            if (!Array.isArray(filterProperties)) throw new Error(`Unknown audio filter: ${key}`);
            const joined = filterProperties.join(",");
            this.enabledFilters.set(key, joined);
        }

        this._applyFilterChain();

        return isToggled;
    }

    // Toggles several filters but only rebuilds the filter graph once
    toggleMany(keys) {
        const uniqueKeys = [...new Set(keys)];
        for (const key of uniqueKeys)
            if (!Array.isArray(this.filters[key])) throw new Error(`Unknown audio filter: ${key}`);

        const enabled = [];
        const disabled = [];
        for (const key of uniqueKeys) {
            if (this.enabledFilters.has(key)) {
                this.enabledFilters.delete(key);
                disabled.push(key);
            } else {
                this.enabledFilters.set(key, this.filters[key].join(","));
                enabled.push(key);
            }
        }

        this._applyFilterChain();

        return { enabled, disabled };
    }

    clear() {
        this.enabledFilters.clear();
        this._applyFilterChain();
    }

    _applyFilterChain() {
        if (!this.queue.metadata.changeFilter) throw new Error("No track is currently playing");

        const finalFilterChain = this._buildFilterChain();

        this.queue.metadata.changeFilter(finalFilterChain);
    }

    setVolume(volume) {
        if (volume < 0 || volume > 100) throw new Error("Volume must be between 1 and 100");

        this._volume = volume / 100;

        this._applyFilterChain();
    }

    get volume() {
        return Math.round(this._volume * 100);
    }

    getEnabled() {
        return [...this.enabledFilters.keys()];
    }
}

module.exports = { FilterManager };