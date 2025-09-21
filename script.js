// Horde Keyboard JavaScript
class HordeKeyboard {
    constructor() {
        this.currentMode = 'solo';
        this.isSeeded = false;
        this.currentPath = [];
        this.outputText = [];
        this.centerCell = null;
        this.isLongPressing = false;
        this.longPressTimer = null;
        this.isDragging = false;
        this.currentHoverCell = null;
        
        // Word collections for different impulses
        this.impulses = {
            explore: ['discover', 'search', 'wander', 'journey', 'seek', 'roam', 'venture'],
            question: ['what', 'why', 'how', 'when', 'where', 'who', 'wonder'],
            decide: ['choose', 'select', 'commit', 'resolve', 'determine', 'conclude', 'pick'],
            act: ['move', 'create', 'build', 'change', 'transform', 'shape', 'forge'],
            exist: ['be', 'become', 'remain', 'persist', 'endure', 'manifest', 'emerge']
        };
        
        // Expansion words for building terrain
        this.expansions = {
            connectors: ['and', 'but', 'or', 'yet', 'so', 'for', 'nor'],
            modifiers: ['deeply', 'gently', 'swiftly', 'quietly', 'boldly', 'softly', 'carefully'],
            objects: ['path', 'trail', 'bridge', 'door', 'window', 'garden', 'river'],
            feelings: ['joy', 'wonder', 'peace', 'hope', 'clarity', 'warmth', 'strength']
        };
        
        this.init();
    }
    
    init() {
        this.createHive();
        this.setupEventListeners();
        this.updateOutput();
    }
    
    createHive() {
        const hive = document.getElementById('hive');
        const gridSize = 7; // 7x7 grid for hexagonal layout
        
        // Create hexagonal grid pattern
        hive.style.gridTemplateColumns = `repeat(${gridSize}, 60px)`;
        hive.style.gridTemplateRows = `repeat(${gridSize}, 52px)`;
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                // Skip cells to create hexagonal shape
                if (this.shouldSkipCell(row, col, gridSize)) continue;
                
                const cell = document.createElement('div');
                cell.className = 'hex-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Center cell is special
                if (row === 3 && col === 3) {
                    cell.className += ' center';
                    cell.textContent = '•';
                    this.centerCell = cell;
                } else {
                    // Assign words based on position
                    cell.textContent = this.getWordForPosition(row, col);
                }
                
                hive.appendChild(cell);
            }
        }
    }
    
    shouldSkipCell(row, col, gridSize) {
        const center = Math.floor(gridSize / 2);
        const distance = Math.abs(row - center) + Math.abs(col - center);
        return distance > 3;
    }
    
    getWordForPosition(row, col) {
        const center = 3;
        const deltaRow = row - center;
        const deltaCol = col - center;
        
        // First ring around center - impulses
        if (Math.abs(deltaRow) <= 1 && Math.abs(deltaCol) <= 1 && (deltaRow !== 0 || deltaCol !== 0)) {
            const impulseKeys = Object.keys(this.impulses);
            const index = ((deltaRow + 1) * 3 + (deltaCol + 1)) % impulseKeys.length;
            const impulse = impulseKeys[index];
            const words = this.impulses[impulse];
            return words[Math.floor(Math.random() * words.length)];
        }
        
        // Outer rings - expansions
        const expansionKeys = Object.keys(this.expansions);
        const keyIndex = (Math.abs(deltaRow) + Math.abs(deltaCol)) % expansionKeys.length;
        const category = this.expansions[expansionKeys[keyIndex]];
        return category[Math.floor(Math.random() * category.length)];
    }
    
    setupEventListeners() {
        const hive = document.getElementById('hive');
        const queenBtn = document.getElementById('queenMode');
        const echoBtn = document.getElementById('echoMode');
        const chorusBtn = document.getElementById('chorusMode');
        const clearBtn = document.getElementById('clearText');
        
        // Mode buttons
        queenBtn.addEventListener('click', () => this.setMode('queen'));
        echoBtn.addEventListener('click', () => this.setMode('echo'));
        chorusBtn.addEventListener('click', () => this.setMode('chorus'));
        clearBtn.addEventListener('click', () => this.clearAll());
        
        // Hive interactions
        hive.addEventListener('mousedown', (e) => this.handleStart(e));
        hive.addEventListener('mousemove', (e) => this.handleMove(e));
        hive.addEventListener('mouseup', (e) => this.handleEnd(e));
        hive.addEventListener('mouseleave', (e) => this.handleEnd(e));
        
        // Touch events for mobile
        hive.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e);
        });
        hive.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e);
        });
        hive.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd(e);
        });
    }
    
    handleStart(e) {
        const cell = e.target.closest('.hex-cell');
        if (!cell) return;
        
        if (cell === this.centerCell && !this.isSeeded) {
            // Long press to seed
            this.longPressTimer = setTimeout(() => {
                this.seedHive();
                this.isLongPressing = true;
            }, 500);
        } else if (this.isSeeded) {
            this.startDragging(cell);
        }
    }
    
    handleMove(e) {
        if (!this.isDragging && !this.isLongPressing) return;
        
        const elementUnder = document.elementFromPoint(
            e.clientX || e.touches[0].clientX,
            e.clientY || e.touches[0].clientY
        );
        const cell = elementUnder?.closest('.hex-cell');
        
        if (cell && cell !== this.currentHoverCell) {
            this.highlightCell(cell);
        }
    }
    
    handleEnd(e) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.isDragging && this.currentHoverCell) {
            this.selectCell(this.currentHoverCell);
        }
        
        this.isDragging = false;
        this.isLongPressing = false;
        this.currentHoverCell = null;
    }
    
    seedHive() {
        this.isSeeded = true;
        this.centerCell.classList.add('activated');
        this.addToOutput('•');
        
        // Add pulsing effect to nearby cells
        const cells = document.querySelectorAll('.hex-cell:not(.center)');
        cells.forEach(cell => {
            if (this.isAdjacent(cell, this.centerCell)) {
                cell.classList.add('pulsing');
            }
        });
    }
    
    startDragging(cell) {
        this.isDragging = true;
        this.highlightCell(cell);
    }
    
    highlightCell(cell) {
        // Remove previous highlight
        if (this.currentHoverCell) {
            this.currentHoverCell.classList.remove('activated');
        }
        
        this.currentHoverCell = cell;
        cell.classList.add('activated');
    }
    
    selectCell(cell) {
        if (!cell || cell === this.centerCell) return;
        
        const word = cell.textContent;
        this.currentPath.push(word);
        this.addToOutput(word);
        
        // Mark as part of trail
        cell.classList.remove('activated', 'pulsing');
        cell.classList.add('trail');
        
        // Apply mode effects
        this.applyModeEffects(cell);
        
        // Regenerate word for this cell
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        cell.textContent = this.getWordForPosition(row, col);
    }
    
    applyModeEffects(cell) {
        switch (this.currentMode) {
            case 'echo':
                // Echo mode: repeat patterns
                setTimeout(() => {
                    const lastWord = this.currentPath[this.currentPath.length - 1];
                    this.addToOutput(`(${lastWord})`);
                }, 1000);
                break;
                
            case 'chorus':
                // Chorus mode: add harmonizing words
                setTimeout(() => {
                    const harmonies = ['with', 'through', 'beyond', 'within'];
                    const harmony = harmonies[Math.floor(Math.random() * harmonies.length)];
                    this.addToOutput(harmony);
                }, 800);
                break;
                
            case 'queen':
                // Queen mode: bias toward beginnings
                if (Math.random() < 0.3) {
                    const beginnings = ['Once', 'When', 'Where', 'How', 'Why'];
                    const beginning = beginnings[Math.floor(Math.random() * beginnings.length)];
                    this.outputText.unshift(beginning);
                    this.updateOutput();
                }
                break;
        }
    }
    
    isAdjacent(cell1, cell2) {
        if (!cell1 || !cell2) return false;
        
        const row1 = parseInt(cell1.dataset.row);
        const col1 = parseInt(cell1.dataset.col);
        const row2 = parseInt(cell2.dataset.row);
        const col2 = parseInt(cell2.dataset.col);
        
        const deltaRow = Math.abs(row1 - row2);
        const deltaCol = Math.abs(col1 - col2);
        
        return deltaRow <= 1 && deltaCol <= 1 && (deltaRow + deltaCol > 0);
    }
    
    addToOutput(word) {
        this.outputText.push(word);
        this.updateOutput();
    }
    
    updateOutput() {
        const outputElement = document.getElementById('outputText');
        outputElement.textContent = this.outputText.join(' ');
    }
    
    setMode(mode) {
        // Remove active class from all mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected mode
        const button = document.getElementById(mode + 'Mode');
        if (button) button.classList.add('active');
        
        this.currentMode = mode;
    }
    
    clearAll() {
        this.isSeeded = false;
        this.currentPath = [];
        this.outputText = [];
        this.currentHoverCell = null;
        
        // Reset all cells
        document.querySelectorAll('.hex-cell').forEach(cell => {
            cell.classList.remove('activated', 'trail', 'pulsing');
            if (!cell.classList.contains('center')) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                cell.textContent = this.getWordForPosition(row, col);
            }
        });
        
        this.updateOutput();
    }
}

// Initialize the Horde Keyboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HordeKeyboard();
});