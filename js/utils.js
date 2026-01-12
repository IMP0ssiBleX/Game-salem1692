/**
 * Salem 1692 - Utility Functions
 */

const Utils = {
    // Generate random room code (4 characters)
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Shuffle array (Fisher-Yates)
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Get random element from array
    randomFrom(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // Get random number between min and max (inclusive)
    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Format time (seconds to MM:SS)
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Check if device is mobile
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // Get avatar emoji based on index
    getAvatarEmoji(index) {
        const avatars = ['👤', '👩', '👨', '👵', '👴', '🧔', '👱', '👩‍🦰', '👨‍🦳', '👩‍🦱', '🧑', '👧'];
        return avatars[index % avatars.length];
    },

    // Save to localStorage
    saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    },

    // Load from localStorage
    loadFromStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
            return null;
        }
    },

    // Remove from localStorage
    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Failed to remove from localStorage:', e);
        }
    },

    // Vibrate device (if supported)
    vibrate(pattern = 50) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    },

    // Play sound effect
    playSound(soundName) {
        // Sound effects will be implemented later
        console.log(`Playing sound: ${soundName}`);
    },

    // Create element with attributes
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key.startsWith('on')) {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else if (key.startsWith('data')) {
                element.dataset[key.slice(4).toLowerCase()] = value;
            } else {
                element.setAttribute(key, value);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Element) {
                element.appendChild(child);
            }
        });

        return element;
    },

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = this.createElement('div', {
            className: `toast ${type}`,
            textContent: message
        });

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Calculate positions in a circle
    getCirclePositions(count, radius = 45, centerX = 50, centerY = 50) {
        const positions = [];
        const angleStep = (2 * Math.PI) / count;
        const startAngle = -Math.PI / 2; // Start from top

        for (let i = 0; i < count; i++) {
            const angle = startAngle + (i * angleStep);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            positions.push({ x: `${x}%`, y: `${y}%` });
        }

        return positions;
    }
};

// Export for use in other modules
window.Utils = Utils;
