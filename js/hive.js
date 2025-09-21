/**
 * Hive Component
 * Dual hive of hexagonal tiles for input
 */
class Hive {
    constructor(canvasId, haptics, output) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.haptics = haptics;
        this.output = output;
        
        this.setupCanvas();
        this.setupInteraction();
        
        // Hex grid properties
        this.hexRadius = 25;
        this.hexRows = 8;
        this.hexCols = 12;
        this.hexes = [];
        
        // Interaction state
        this.isPressed = false;
        this.pressStartTime = 0;
        this.longPressThreshold = 500;
        this.currentHex = null;
        this.selectedPath = [];
        this.isSelecting = false;
        
        // Character mapping for hex tiles
        this.setupCharacterMap();
        this.generateHexGrid();
        
        this.render();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Resize handler
        window.addEventListener('resize', () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * window.devicePixelRatio;
            this.canvas.height = rect.height * window.devicePixelRatio;
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            this.generateHexGrid();
            this.render();
        });
    }

    setupCharacterMap() {
        // Left hive: letters
        this.leftChars = [
            'q', 'w', 'e', 'r', 't', 'y',
            'a', 's', 'd', 'f', 'g', 'h',
            'z', 'x', 'c', 'v', 'b', 'n',
            '1', '2', '3', '4', '5', '6'
        ];
        
        // Right hive: letters and symbols
        this.rightChars = [
            'u', 'i', 'o', 'p', '[', ']',
            'j', 'k', 'l', ';', "'", '\\',
            'm', ',', '.', '/', '?', '!',
            '7', '8', '9', '0', '-', '='
        ];
    }

    generateHexGrid() {
        this.hexes = [];
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        const hexWidth = this.hexRadius * 2;
        const hexHeight = this.hexRadius * Math.sqrt(3);
        
        // Calculate grid dimensions to fit canvas
        const cols = Math.floor(width / (hexWidth * 0.75));
        const rows = Math.floor(height / hexHeight) - 1;
        
        const startX = (width - (cols * hexWidth * 0.75)) / 2;
        const startY = hexHeight / 2;
        
        let charIndex = 0;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const offsetX = (row % 2) * (hexWidth * 0.375);
                const x = startX + col * (hexWidth * 0.75) + offsetX;
                const y = startY + row * hexHeight;
                
                // Determine which hive (left or right half)
                const isLeftHive = x < width / 2;
                const chars = isLeftHive ? this.leftChars : this.rightChars;
                const hiveCharIndex = charIndex % chars.length;
                
                this.hexes.push({
                    x: x,
                    y: y,
                    radius: this.hexRadius,
                    char: chars[hiveCharIndex],
                    isLeftHive: isLeftHive,
                    isActive: false,
                    isSeeded: false,
                    seedTime: 0,
                    row: row,
                    col: col
                });
                
                charIndex++;
            }
        }
    }

    setupInteraction() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleEnd(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd(e);
        });
    }

    getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    getHexAtPos(x, y) {
        for (let hex of this.hexes) {
            const distance = Math.sqrt((x - hex.x) ** 2 + (y - hex.y) ** 2);
            if (distance <= hex.radius) {
                return hex;
            }
        }
        return null;
    }

    handleStart(e) {
        const pos = this.getEventPos(e);
        const hex = this.getHexAtPos(pos.x, pos.y);
        
        if (hex) {
            this.isPressed = true;
            this.pressStartTime = Date.now();
            this.currentHex = hex;
            this.selectedPath = [hex];
            
            hex.isActive = true;
            this.haptics.tap();
            this.render();
            
            // Start long press timer
            setTimeout(() => {
                if (this.isPressed && this.currentHex === hex) {
                    this.handleLongPress(hex);
                }
            }, this.longPressThreshold);
        }
    }

    handleMove(e) {
        if (!this.isPressed) return;
        
        const pos = this.getEventPos(e);
        const hex = this.getHexAtPos(pos.x, pos.y);
        
        if (hex && hex !== this.currentHex) {
            // Started selecting
            if (!this.isSelecting) {
                this.isSelecting = true;
                this.haptics.press();
            }
            
            // Add to selection path if not already selected
            if (!this.selectedPath.includes(hex)) {
                this.selectedPath.push(hex);
                hex.isActive = true;
                this.haptics.tap();
                this.render();
            }
        }
    }

    handleEnd(e) {
        if (!this.isPressed) return;
        
        this.isPressed = false;
        
        if (this.isSelecting) {
            // Commit selected word
            this.commitSelection();
        } else if (this.currentHex && !this.currentHex.isSeeded) {
            // Single tap - add character
            this.output.addCharacter(this.currentHex.char);
            this.haptics.tap();
        }
        
        // Reset state
        this.selectedPath.forEach(hex => hex.isActive = false);
        this.selectedPath = [];
        this.currentHex = null;
        this.isSelecting = false;
        
        this.render();
    }

    handleLongPress(hex) {
        if (!hex.isSeeded) {
            hex.isSeeded = true;
            hex.seedTime = Date.now();
            this.haptics.longPress();
            this.render();
        }
    }

    commitSelection() {
        const word = this.selectedPath.map(hex => hex.char).join('');
        this.output.addCharacter(word);
        this.output.addSpace();
        this.haptics.select();
    }

    render() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Draw hexes
        this.hexes.forEach(hex => this.drawHex(hex));
        
        // Draw selection path
        if (this.selectedPath.length > 1) {
            this.drawSelectionPath();
        }
    }

    drawHex(hex) {
        const ctx = this.ctx;
        
        // Determine colors based on state
        let fillColor = '#1a1a1a';
        let strokeColor = '#333';
        let textColor = '#666';
        
        if (hex.isSeeded) {
            fillColor = '#2a2a00';
            strokeColor = '#666600';
            textColor = '#ffff99';
        }
        
        if (hex.isActive) {
            fillColor = '#333';
            strokeColor = '#666';
            textColor = '#fff';
        }
        
        // Draw hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = hex.x + hex.radius * Math.cos(angle);
            const y = hex.y + hex.radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw character
        ctx.fillStyle = textColor;
        ctx.font = '14px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hex.char.toUpperCase(), hex.x, hex.y);
    }

    drawSelectionPath() {
        if (this.selectedPath.length < 2) return;
        
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(this.selectedPath[0].x, this.selectedPath[0].y);
        
        for (let i = 1; i < this.selectedPath.length; i++) {
            ctx.lineTo(this.selectedPath[i].x, this.selectedPath[i].y);
        }
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Export as global
window.Hive = Hive;