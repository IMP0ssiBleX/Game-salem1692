/**
 * Salem 1692 - Screen Manager
 */

const Screens = {
    // Current screen
    current: null,

    // Screen IDs mapping
    screens: {
        'loading': 'loading-screen',
        'menu': 'menu-screen',
        'create-room': 'create-room-screen',
        'join-room': 'join-room-screen',
        'lobby': 'lobby-screen',
        'character': 'character-screen',
        'host': 'host-screen',
        'player': 'player-screen',
        'night': 'night-screen',
        'end': 'end-screen',
        'howto': 'howto-screen'
    },

    // Initialize
    init() {
        this.current = 'loading';
    },

    // Show a screen
    show(screenName, options = {}) {
        const screenId = this.screens[screenName];
        if (!screenId) {
            console.error(`Screen not found: ${screenName}`);
            return;
        }

        // Hide all screens
        Object.values(this.screens).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('active');
            }
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');

            // Add animation if specified
            if (options.animate) {
                targetScreen.classList.add('screen-enter');
                setTimeout(() => {
                    targetScreen.classList.remove('screen-enter');
                }, 300);
            }
        }

        this.current = screenName;

        // Trigger screen-specific callbacks
        this.onScreenChange(screenName, options);
    },

    // Handle screen change
    onScreenChange(screenName, options) {
        switch (screenName) {
            case 'menu':
                // Reset any game state
                break;

            case 'lobby':
                // Update lobby display
                if (GameState.state) {
                    UI.elements.lobbyRoomCode.textContent = GameState.state.roomCode;
                    UI.updateLobbyPlayers(GameState.state.players);

                    // Show/hide host controls
                    const isHost = GameState.state.isHost;
                    UI.elements.btnStartGame.style.display = isHost ? 'block' : 'none';
                }
                break;

            case 'character':
                // Show character selection
                const characters = Characters.getSelectionPool(GameState.state.players.length);
                UI.updateCharacterGrid(characters);
                this.startCharacterTimer();
                break;

            case 'host':
                // Update host screen
                UI.updateHostScreen(GameState.state);
                break;

            case 'player':
                // Update player screen
                const localPlayer = GameState.getLocalPlayer();
                if (localPlayer) {
                    UI.updatePlayerScreen(localPlayer, GameState.state);
                }
                break;

            case 'night':
                // Update night screen
                const player = GameState.getLocalPlayer();
                if (player) {
                    UI.updateNightScreen(player, GameState.state);
                }
                break;
        }
    },

    // Start character selection timer
    startCharacterTimer() {
        let seconds = 30;
        const timerEl = UI.elements.charTimer;

        const interval = setInterval(() => {
            seconds--;
            timerEl.textContent = seconds;

            if (seconds <= 0) {
                clearInterval(interval);
                // Auto-select if not selected
                App.autoSelectCharacter();
            }
        }, 1000);

        // Store interval to clear if needed
        this.characterTimer = interval;
    },

    // Stop character timer
    stopCharacterTimer() {
        if (this.characterTimer) {
            clearInterval(this.characterTimer);
            this.characterTimer = null;
        }
    },

    // Check if on a specific screen
    isOn(screenName) {
        return this.current === screenName;
    }
};

// Export for use in other modules
window.Screens = Screens;
