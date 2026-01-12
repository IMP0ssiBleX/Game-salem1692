/**
 * Salem 1692 - Game Log System
 * ระบบบันทึกเหตุการณ์ในเกม
 */

const GameLog = {
    // Max entries to keep in memory
    MAX_ENTRIES: 50,

    // Log entries array
    entries: [],

    // DOM element reference
    element: null,

    // Initialize
    init() {
        // Initial clean up
        this.clear();
    },

    // Add a log entry
    add(message, type = 'system') {
        const time = this.getTimeString();

        const entry = {
            time,
            message,
            type,
            timestamp: Date.now()
        };

        this.entries.unshift(entry);

        // Keep max entries
        if (this.entries.length > this.MAX_ENTRIES) {
            this.entries.pop();
        }

        // Update DOM
        this.render();

        return entry;
    },

    // Log types with icons
    logTypes: {
        system: { icon: 'ℹ️', prefix: '' },
        turn: { icon: '🎯', prefix: 'เทิร์น: ' },
        draw: { icon: '🃏', prefix: '' },
        accuse: { icon: '☝️', prefix: '' },
        helper: { icon: '🕊️', prefix: '' },
        reveal: { icon: '👁️', prefix: '' },
        witch: { icon: '🧙‍♀️', prefix: '' },
        death: { icon: '💀', prefix: '' },
        night: { icon: '🌙', prefix: '' },
        bot: { icon: '🤖', prefix: '' },
        win: { icon: '🏆', prefix: '' }
    },

    // Helper methods for common log types
    logTurn(playerName) {
        this.add(`เทิร์นของ ${playerName}`, 'turn');
    },

    logDraw(playerName, count = 2) {
        this.add(`${playerName} จั่ว ${count} การ์ด`, 'draw');
    },

    logAccuse(playerName, targetName, value) {
        this.add(`${playerName} กล่าวหา ${targetName} (+${value})`, 'accuse');
    },

    logHelper(playerName, cardName, targetName) {
        this.add(`${playerName} เล่น ${cardName} ใส่ ${targetName}`, 'helper');
    },

    logReveal(playerName, cardType) {
        if (cardType === 'witch') {
            this.add(`${playerName} ถูกเปิดเผย - เป็นแม่มด!`, 'witch');
        } else {
            this.add(`${playerName} ถูกเปิด Tryal - ไม่ใช่แม่มด`, 'reveal');
        }
    },

    logDeath(playerName, cause) {
        this.add(`${playerName} ${cause}`, 'death');
    },

    logNight(message) {
        this.add(message, 'night');
    },

    logBot(botName, action) {
        this.add(`${botName} ${action}`, 'bot');
    },

    logWin(side) {
        if (side === 'villagers') {
            this.add('🎉 ชาวบ้านชนะ! แม่มดถูกจับหมดแล้ว!', 'win');
        } else {
            this.add('💀 แม่มดชนะ! ชาวบ้านถูกสังหารหมด!', 'win');
        }
    },

    logGameStart(playerCount, witchCount) {
        this.add(`เกมเริ่ม! ผู้เล่น ${playerCount} คน, แม่มด ${witchCount} คน`, 'system');
    },

    // Get current time string
    getTimeString() {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    },

    // Render log to DOM
    render() {
        const elements = document.querySelectorAll('.game-log');
        if (elements.length === 0) return;

        // Take only recent entries for display
        const displayEntries = this.entries.slice(0, 20);

        const html = displayEntries.map(entry => `
            <div class="log-entry log-${entry.type}">
                <span class="log-time">${entry.time}</span>
                <span class="log-message">${entry.message}</span>
            </div>
        `).join('');

        elements.forEach(el => {
            el.innerHTML = html;
            el.scrollTop = 0; // Scroll to top (newest first)
        });
    },

    // Clear all logs
    clear() {
        this.entries = [];
        const elements = document.querySelectorAll('.game-log');

        const emptyHtml = `
            <div class="log-entry log-system">
                <span class="log-time">--:--</span>
                <span class="log-message">รอเริ่มเกม...</span>
            </div>
        `;

        elements.forEach(el => {
            el.innerHTML = emptyHtml;
        });
    },

    // Export logs (for debugging)
    export() {
        return JSON.stringify(this.entries, null, 2);
    }
};

// Export for use in other modules
window.GameLog = GameLog;
