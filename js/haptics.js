/**
 * Haptics Component
 * Provides vibration feedback using navigator.vibrate()
 */
class Haptics {
    constructor() {
        this.isSupported = 'vibrate' in navigator;
        this.enabled = this.isSupported;
    }

    // Light tap feedback
    tap() {
        if (this.enabled) {
            navigator.vibrate(50);
        }
    }

    // Medium press feedback
    press() {
        if (this.enabled) {
            navigator.vibrate(100);
        }
    }

    // Long press feedback
    longPress() {
        if (this.enabled) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    // Selection feedback
    select() {
        if (this.enabled) {
            navigator.vibrate([30, 20, 30, 20, 30]);
        }
    }

    // Error feedback
    error() {
        if (this.enabled) {
            navigator.vibrate([200, 100, 200]);
        }
    }

    // Swarm activity feedback (subtle)
    swarmActivity() {
        if (this.enabled) {
            navigator.vibrate(20);
        }
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}

// Export as global
window.Haptics = Haptics;