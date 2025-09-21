/**
 * Main Application
 * Initializes and coordinates all components
 */
class HordeKeyboard {
    constructor() {
        this.haptics = null;
        this.output = null;
        this.hive = null;
        this.horde = null;
        
        this.init();
        this.setupKeyboardShortcuts();
    }

    init() {
        // Initialize components in order
        this.haptics = new Haptics();
        this.output = new Output('output-text');
        this.hive = new Hive('hive-canvas', this.haptics, this.output);
        this.horde = new Horde('horde-canvas', this.haptics);
        
        console.log('Horde Keyboard initialized');
        
        // Set initial focus
        this.output.focus();
        
        // Add some initial instructions
        setTimeout(() => {
            this.showInstructions();
        }, 1000);
    }

    showInstructions() {
        const instructions = [
            "HORDE KEYBOARD ACTIVE",
            "",
            "LEFT HIVE: primary letters",
            "RIGHT HIVE: extended chars",
            "",
            "TAP: single character",
            "LONG PRESS: seed tile",
            "DRAG: select word",
            "",
            "WATCH THE SWARM"
        ];
        
        instructions.forEach((line, index) => {
            setTimeout(() => {
                this.output.currentText += line + '\n';
                this.output.updateDisplay();
            }, index * 200);
        });
        
        setTimeout(() => {
            this.output.currentText += '\n> ';
            this.output.updateDisplay();
        }, instructions.length * 200 + 500);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.output.clear();
                    break;
                    
                case 'Backspace':
                    e.preventDefault();
                    this.output.backspace();
                    this.haptics.tap();
                    break;
                    
                case ' ':
                    e.preventDefault();
                    this.output.addSpace();
                    this.haptics.tap();
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    this.output.commitWord();
                    this.output.currentText += '\n> ';
                    this.output.updateDisplay();
                    this.haptics.press();
                    break;
                    
                case 'h':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.haptics.toggle();
                        console.log('Haptics toggled:', this.haptics.enabled);
                    }
                    break;
                    
                case 'c':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.horde.toggleChorusMode();
                        console.log('Chorus mode:', this.horde.chorusMode);
                    }
                    break;
                    
                case '+':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.horde.addAgent();
                        console.log('Agent added, total:', this.horde.agents.length);
                    }
                    break;
                    
                case '-':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.horde.removeAgent();
                        console.log('Agent removed, total:', this.horde.agents.length);
                    }
                    break;
                    
                case 'd':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.horde.disperseSwarm();
                        console.log('Swarm dispersed');
                    }
                    break;
            }
        });
    }

    // Public methods for external control
    getState() {
        return {
            hapticsEnabled: this.haptics.enabled,
            chorusMode: this.horde.chorusMode,
            agentCount: this.horde.agents.length,
            currentText: this.output.getText()
        };
    }

    toggleHaptics() {
        this.haptics.toggle();
        return this.haptics.enabled;
    }

    toggleChorusMode() {
        this.horde.toggleChorusMode();
        return this.horde.chorusMode;
    }

    clearOutput() {
        this.output.clear();
    }

    addText(text) {
        this.output.currentText += text;
        this.output.updateDisplay();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hordeKeyboard = new HordeKeyboard();
    
    // Expose some controls to console for debugging
    window.hk = {
        state: () => window.hordeKeyboard.getState(),
        haptics: () => window.hordeKeyboard.toggleHaptics(),
        chorus: () => window.hordeKeyboard.toggleChorusMode(),
        clear: () => window.hordeKeyboard.clearOutput(),
        add: (text) => window.hordeKeyboard.addText(text),
        disperse: () => window.hordeKeyboard.horde.disperseSwarm()
    };
    
    console.log('Debug controls available as window.hk');
    console.log('Keyboard shortcuts:');
    console.log('  Esc: clear output');
    console.log('  Backspace: delete character');
    console.log('  Space: add space');
    console.log('  Enter: new line');
    console.log('  Ctrl+H: toggle haptics');
    console.log('  Ctrl+C: toggle chorus mode');
    console.log('  Ctrl++: add agent');
    console.log('  Ctrl+-: remove agent');
    console.log('  Ctrl+D: disperse swarm');
});