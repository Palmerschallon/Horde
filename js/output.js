/**
 * Output Component
 * Manages the textarea where typed text appears
 */
class Output {
    constructor(textareaId) {
        this.textarea = document.getElementById(textareaId);
        this.currentText = '';
        this.wordBuffer = '';
    }

    // Add a character to the buffer
    addCharacter(char) {
        this.wordBuffer += char;
        this.updateDisplay();
    }

    // Commit the current word buffer to the text
    commitWord() {
        if (this.wordBuffer.trim()) {
            if (this.currentText && !this.currentText.endsWith(' ')) {
                this.currentText += ' ';
            }
            this.currentText += this.wordBuffer;
            this.wordBuffer = '';
            this.updateDisplay();
        }
    }

    // Add a space
    addSpace() {
        this.commitWord();
        if (this.currentText && !this.currentText.endsWith(' ')) {
            this.currentText += ' ';
            this.updateDisplay();
        }
    }

    // Backspace functionality
    backspace() {
        if (this.wordBuffer) {
            this.wordBuffer = this.wordBuffer.slice(0, -1);
        } else if (this.currentText) {
            this.currentText = this.currentText.slice(0, -1);
        }
        this.updateDisplay();
    }

    // Clear all text
    clear() {
        this.currentText = '';
        this.wordBuffer = '';
        this.updateDisplay();
    }

    // Update the textarea display
    updateDisplay() {
        const displayText = this.currentText + this.wordBuffer;
        this.textarea.value = displayText;
        // Auto-scroll to bottom
        this.textarea.scrollTop = this.textarea.scrollHeight;
    }

    // Get current text
    getText() {
        return this.currentText + this.wordBuffer;
    }

    // Set cursor position at end
    focus() {
        this.textarea.focus();
        this.textarea.setSelectionRange(this.textarea.value.length, this.textarea.value.length);
    }
}

// Export as global
window.Output = Output;