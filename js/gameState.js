/**
 * Salem 1692 - Game State Management
 */

const GameState = {
    // Current state
    state: null,

    // Game phases
    PHASES: {
        LOBBY: 'lobby',
        CHARACTER_SELECT: 'character_select',
        PLAYING: 'playing',
        NIGHT: 'night',
        GAME_OVER: 'game_over'
    },

    // Initialize new game state
    init() {
        this.state = {
            // Room info
            roomCode: '',
            hostId: '',

            // Game phase
            phase: this.PHASES.LOBBY,

            // Players
            players: [],

            // Current turn
            currentPlayerIndex: 0,
            turnPhase: 'choose', // 'choose', 'drawn', 'played', 'end'
            hasDrawn: false,
            hasPlayed: false,

            // Decks
            playingDeck: [],
            discardPile: [],

            // Revealed witches
            revealedWitches: [],

            // Special states
            nightTarget: null,
            protectedPlayer: null,
            skipNextTurn: [], // Player IDs to skip
            linkedPlayers: [], // [[id1, id2], ...] for Matchmaker

            // Game stats
            totalWitches: 0,
            gameStartTime: null,

            // Local player info
            localPlayerId: '',
            isHost: false
        };

        return this.state;
    },

    // Create a player object
    createPlayer(id, name, isHost = false) {
        return {
            id,
            name,
            avatar: Utils.getAvatarEmoji(this.state.players.length),
            isHost,

            // Game state
            isAlive: true,
            isWitch: false,
            wasWitch: false, // New rule: Once a witch, always a witch
            isConstable: false,

            // Cards
            tryalCards: [],
            handCards: [],
            blueCards: [], // Persistent cards in front

            // Accusations
            accusations: 0,

            // Character
            characterId: null,

            // Turn state
            isSkipped: false
        };
    },

    // Add player to game
    addPlayer(name, isHost = false) {
        const id = Utils.generateId();
        const player = this.createPlayer(id, name, isHost);
        this.state.players.push(player);
        return player;
    },

    // Remove player from game
    removePlayer(playerId) {
        const index = this.state.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            this.state.players.splice(index, 1);
        }
    },

    // Get player by ID
    getPlayer(playerId) {
        return this.state.players.find(p => p.id === playerId);
    },

    // Get local player
    getLocalPlayer() {
        return this.getPlayer(this.state.localPlayerId);
    },

    // Get current player (whose turn)
    getCurrentPlayer() {
        return this.state.players[this.state.currentPlayerIndex];
    },

    // Get alive players
    getAlivePlayers() {
        return this.state.players.filter(p => p.isAlive);
    },

    // Get alive witches
    getAliveWitches() {
        return this.state.players.filter(p => p.isAlive && p.isWitch);
    },

    // Get alive villagers
    getAliveVillagers() {
        return this.state.players.filter(p => p.isAlive && !p.isWitch);
    },

    // Setup game (distribute cards)
    setupGame() {
        const playerCount = this.state.players.length;
        const config = Cards.getSetupConfig(playerCount);

        // Create and shuffle Tryal deck
        const tryalDeck = Cards.createTryalDeck(playerCount);

        // Distribute Tryal cards
        this.state.players.forEach((player, index) => {
            const start = index * config.tryalPerPlayer;
            const playerTryals = tryalDeck.slice(start, start + config.tryalPerPlayer);

            player.tryalCards = playerTryals.map(card => ({
                ...card,
                revealed: false
            }));

            // Check if player is witch or constable
            player.isWitch = playerTryals.some(c => c.isWitch);
            player.wasWitch = player.isWitch;
            player.isConstable = playerTryals.some(c => c.type === 'constable');
        });

        // Count total witches
        this.state.totalWitches = config.witchCount;

        // Create playing deck
        this.state.playingDeck = Cards.createPlayingDeck();

        // Determine first player (with Black Cat)
        this.state.currentPlayerIndex = Math.floor(Math.random() * playerCount);

        // Give Black Cat to first player
        const blackCat = Cards.blackCards.find(c => c.id === 'black_cat');
        this.getCurrentPlayer().handCards.push({ ...blackCat });

        // Set game start time
        this.state.gameStartTime = Date.now();

        // Change phase
        this.state.phase = this.PHASES.CHARACTER_SELECT;

        return this.state;
    },

    // Start playing phase
    startPlaying() {
        this.state.phase = this.PHASES.PLAYING;
        this.state.turnPhase = 'choose';
        this.state.hasDrawn = false;
        this.state.hasPlayed = false;
    },

    // Draw cards for current player
    drawCards(count = 2) {
        if (this.state.hasPlayed) {
            return { action: 'error', message: 'ไม่สามารถจั่วการ์ดได้หลังจากเล่นการ์ดแล้ว' };
        }

        const player = this.getCurrentPlayer();
        const drawn = [];

        for (let i = 0; i < count && this.state.playingDeck.length > 0; i++) {
            const card = this.state.playingDeck.shift();

            // Handle special black cards
            if (card.type === 'black') {
                if (card.id === 'night') {
                    // Night card - trigger night phase
                    return { action: 'night', card };
                } else if (card.id === 'malice') {
                    // Malice card - reveal and pass Tryal cards
                    return { action: 'malice', card };
                }
            }

            player.handCards.push(card);
            drawn.push(card);
        }

        this.state.hasDrawn = true;
        this.state.turnPhase = 'drawn';

        return { action: 'drawn', cards: drawn };
    },

    // Play a card on a target
    playCard(cardId, targetPlayerId, secondTargetId = null) {
        if (this.state.hasDrawn) {
            return { success: false, error: 'ไม่สามารถเล่นการ์ดได้หลังจากจั่วการ์ดแล้ว' };
        }

        const player = this.getCurrentPlayer();
        const cardIndex = player.handCards.findIndex(c => c.id === cardId);

        if (cardIndex === -1) return { success: false, error: 'ไม่พบการ์ด' };

        const card = player.handCards[cardIndex];
        const target = this.getPlayer(targetPlayerId);

        if (!target) return { success: false, error: 'ไม่พบเป้าหมาย' };
        if (!target.isAlive) return { success: false, error: 'เป้าหมายเสียชีวิตแล้ว' };

        // Check if can target self
        const canTargetSelf = Characters.applyAbility(player.characterId, 'can_target_self', this.state);
        if (targetPlayerId === player.id && !canTargetSelf) {
            return { success: false, error: 'ไม่สามารถเลือกตัวเองได้' };
        }

        // Check blue card protections
        if (card.type === 'red') {
            const hasShelter = target.blueCards.some(c => c.id.startsWith('shelter'));
            const hasFaith = target.blueCards.some(c => c.id.startsWith('faith'));
            if (hasShelter || hasFaith) {
                return { success: false, error: 'เป้าหมายได้รับการปกป้อง' };
            }
        }

        // Remove card from hand
        player.handCards.splice(cardIndex, 1);

        // Apply card effect
        const result = this.applyCardEffect(card, target, secondTargetId);

        // Add to discard pile (except blue cards)
        if (card.type !== 'blue') {
            this.state.discardPile.push(card);
        }

        this.state.hasPlayed = true;
        this.state.turnPhase = 'played';

        return { success: true, result };
    },

    // Apply card effect
    applyCardEffect(card, target, secondTargetId = null) {
        const player = this.getCurrentPlayer();

        switch (card.type) {
            case 'red':
                // Accusation cards
                let value = card.value || 1;

                // Ann Putnam bonus
                const bonus = Characters.applyAbility(player.characterId, 'accusation_bonus', this.state);
                if (bonus) value += bonus;

                target.accusations += value;

                // Check if reached threshold
                const threshold = Characters.applyAbility(target.characterId, 'accusation_threshold', this.state) || 7;

                if (target.accusations >= threshold) {
                    return {
                        action: 'reveal_tryal',
                        playerId: target.id,
                        triggeredBy: player.id
                    };
                }

                return { action: 'accused', value, total: target.accusations };

            case 'green':
                return this.applyGreenCard(card, target, secondTargetId);

            case 'blue':
                // Special handling for Matchmaker
                if (card.id.startsWith('matchmaker')) {
                    if (secondTargetId) {
                        this.state.linkedPlayers.push([target.id, secondTargetId]);
                        // Visual: Add to first target
                        target.blueCards.push(card);
                        return { action: 'matchmaker', target1: target.name, target2: this.getPlayer(secondTargetId).name };
                    }
                    return { success: false, error: 'Second target required for Matchmaker' };
                }

                // Add to target's persistent cards
                target.blueCards.push(card);
                return { action: 'attached', cardName: card.name };

            default:
                return { action: 'played' };
        }
    },

    // Apply green card effect
    applyGreenCard(card, target, secondTargetId = null) {
        // Check Sarah Osborne immunity
        if (Characters.applyAbility(target.characterId, 'green_card_immunity', this.state)) {
            return { action: 'blocked', reason: 'Sarah Osborne immunity' };
        }

        switch (card.id.replace(/_\d+$/, '')) { // Remove number suffix
            case 'alibi':
                // Remove all red cards (accusations)
                const removed = target.accusations;
                target.accusations = 0;
                return { action: 'alibi', removed };

            case 'stocks':
                // Skip next turn
                target.isSkipped = true;
                this.state.skipNextTurn.push(target.id);
                return { action: 'stocks' };

            case 'scapegoat':
                // Transfer accusations and blue/green cards to another player
                const secondTarget = this.getPlayer(secondTargetId);
                if (secondTarget) {
                    // Transfer Accusations
                    const transferredAccusations = target.accusations;
                    secondTarget.accusations += transferredAccusations;
                    target.accusations = 0;

                    // Transfer Blue Cards
                    const transferredBlue = [...target.blueCards];
                    secondTarget.blueCards.push(...transferredBlue);
                    target.blueCards = [];

                    return {
                        action: 'scapegoat',
                        from: target.id,
                        to: secondTargetId,
                        details: {
                            accusations: transferredAccusations,
                            blueCards: transferredBlue.length
                        }
                    };
                }
                return { success: false, error: 'Second target required' };

            case 'arson':
                // Discard all hand cards
                const burned = target.handCards.length;
                target.handCards = [];
                return { action: 'arson', burned };

            case 'curse':
                // Move all blue cards to another player
                const curseTarget = this.getPlayer(secondTargetId);
                if (curseTarget) {
                    const movedBlue = [...target.blueCards];
                    curseTarget.blueCards.push(...movedBlue);
                    target.blueCards = [];
                    return { action: 'curse', moved: movedBlue.length, to: secondTargetId };
                }
                // Fallback if no target (discard)
                const cursed = target.blueCards.length;
                target.blueCards = [];
                return { action: 'curse', removed: cursed };

            case 'robbery':
                // Move ALL cards from hand to another player
                const robTarget = this.getPlayer(secondTargetId);
                if (robTarget) {
                    const stolenCards = [...target.handCards];
                    robTarget.handCards.push(...stolenCards);
                    target.handCards = [];
                    return { action: 'robbery', count: stolenCards.length, to: secondTargetId };
                }
                return { success: false, error: 'Second target required' };

            default:
                return { action: 'green_effect' };
        }
    },

    // Reveal a Tryal card
    revealTryalCard(playerId, revealer) {
        const player = this.getPlayer(playerId);
        const hiddenCards = player.tryalCards.filter(c => !c.revealed);

        if (hiddenCards.length === 0) return null;

        // Reveal first hidden card (or let Bridget Bishop choose)
        const cardToReveal = hiddenCards[0];
        cardToReveal.revealed = true;

        if (cardToReveal.isWitch) {
            this.state.revealedWitches.push({
                playerId: player.id,
                playerName: player.name,
                revealedBy: revealer
            });

            // Check if all witches revealed
            if (this.state.revealedWitches.length >= this.state.totalWitches) {
                return { action: 'witch_revealed', gameOver: true, winner: 'villagers' };
            }

            return { action: 'witch_revealed', card: cardToReveal };
        }

        // Check if all Tryal cards revealed (innocent killed)
        const allRevealed = player.tryalCards.every(c => c.revealed);
        if (allRevealed && !player.isWitch) {
            player.isAlive = false;
            this.checkGameOver();
            return { action: 'innocent_killed', player: player.name };
        }

        // Rebecca Nurse ability
        if (Characters.applyAbility(player.characterId, 'tryal_revealed_innocent', this.state)) {
            return { action: 'not_witch', triggerAbility: 'rebecca_nurse' };
        }

        return { action: 'not_witch', card: cardToReveal };
    },

    // End current turn
    endTurn() {
        // Find next alive player
        let nextIndex = this.state.currentPlayerIndex;
        let attempts = 0;
        const playerCount = this.state.players.length;

        do {
            nextIndex = (nextIndex + 1) % playerCount;
            attempts++;

            const nextPlayer = this.state.players[nextIndex];

            // Skip dead players
            if (!nextPlayer.isAlive) continue;

            // Skip players in stocks
            if (this.state.skipNextTurn.includes(nextPlayer.id)) {
                this.state.skipNextTurn = this.state.skipNextTurn.filter(id => id !== nextPlayer.id);
                nextPlayer.isSkipped = false;
                continue;
            }

            break;
        } while (attempts < playerCount);

        this.state.currentPlayerIndex = nextIndex;
        this.state.turnPhase = 'choose';
        this.state.hasDrawn = false;
        this.state.hasPlayed = false;

        return this.getCurrentPlayer();
    },

    // Start night phase
    startNight() {
        this.state.phase = this.PHASES.NIGHT;
        this.state.nightTarget = null;
        this.state.protectedPlayer = null;
    },

    // Witch selects target
    witchSelectTarget(targetId) {
        this.state.nightTarget = targetId;
    },

    // Constable protects player
    constableProtect(targetId) {
        this.state.protectedPlayer = targetId;
    },

    // Resolve night phase
    resolveNight() {
        let killed = null;

        if (this.state.nightTarget) {
            const target = this.getPlayer(this.state.nightTarget);

            // Check if protected
            const hasShelter = target.blueCards.some(c => c.id.startsWith('shelter'));

            if (this.state.nightTarget !== this.state.protectedPlayer && !hasShelter) {
                // Check Cotton Mather ability
                const survives = Characters.applyAbility(target.characterId, 'night_death', this.state);

                if (survives && survives.action === 'survive_once') {
                    this.state.cottonUsedAbility = true;
                } else {
                    target.isAlive = false;
                    killed = target;

                    // Martha Corey ability
                    const marthaAbility = Characters.applyAbility(target.characterId, 'night_death', this.state);
                    if (marthaAbility && marthaAbility.action === 'reveal_other_tryal') {
                        // Return ability trigger for UI to handle
                        return { killed, triggerAbility: 'martha_corey' };
                    }

                    // Check matchmaker linked players
                    for (const link of this.state.linkedPlayers) {
                        if (link.includes(target.id)) {
                            const linkedId = link.find(id => id !== target.id);
                            const linkedPlayer = this.getPlayer(linkedId);
                            if (linkedPlayer && linkedPlayer.isAlive) {
                                linkedPlayer.isAlive = false;
                                killed = [target, linkedPlayer];
                            }
                        }
                    }
                }
            }
        }

        // Reset night state
        this.state.nightTarget = null;
        this.state.protectedPlayer = null;
        this.state.phase = this.PHASES.PLAYING;

        // Check game over
        const gameOver = this.checkGameOver();

        return { killed, gameOver };
    },

    // Handle Malice card
    handleMalice() {
        const players = this.getAlivePlayers();
        const reveals = [];

        // 1. Black Cat holder reveals 1 Tryal
        const blackCatHolder = players.find(p => p.handCards.some(c => c.id === 'black_cat'));
        if (blackCatHolder) {
            const revealed = this.revealTryalCard(blackCatHolder.id, 'game');
            if (revealed) reveals.push({ playerId: blackCatHolder.id, card: revealed.card });
        }

        // 2. Current Player (Drawer) reveals 1 Tryal
        const currentPlayer = this.getCurrentPlayer();
        // Check if already revealed by Black Cat (if same person)
        // Usually effects stack or happen sequentially. Assuming reveal ANOTHER one?
        // Logic: Reveal 1 card.
        // If same person and already revealed, reveal another?
        // revealTryalCard reveals the FIRST hidden card. So calling it again reveals the next one.
        const revealedCurrent = this.revealTryalCard(currentPlayer.id, 'game');
        if (revealedCurrent) reveals.push({ playerId: currentPlayer.id, card: revealedCurrent.card });

        // 3. Pass cards to left
        const newTryals = [];

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const leftPlayer = players[(i + 1) % players.length];

            // Get random hidden Tryal from left player
            const hiddenCards = leftPlayer.tryalCards.filter(c => !c.revealed);
            if (hiddenCards.length > 0) {
                const randomCard = hiddenCards[Math.floor(Math.random() * hiddenCards.length)];
                newTryals.push({ playerId: player.id, card: randomCard, fromId: leftPlayer.id });
            }
        }

        // Apply transfers
        for (const transfer of newTryals) {
            const player = this.getPlayer(transfer.playerId);
            const fromPlayer = this.getPlayer(transfer.fromId);

            // Remove from original player
            fromPlayer.tryalCards = fromPlayer.tryalCards.filter(c => c.id !== transfer.card.id);

            // Add to new player
            player.tryalCards.push(transfer.card);

            // Check if received witch card - sticky status
            if (transfer.card.isWitch) {
                player.wasWitch = true;
            }

            // Update witch status
            player.isWitch = player.wasWitch || player.tryalCards.some(c => c.isWitch);

            // Check previous owner status
            // If they lost their only witch card, are they still a witch?
            // Rule: "Player who GETS a witch card must be witch until end".
            // Doesn't say "Player who LOSES...".
            // Typically in Salem, once you are a witch, you remain one.
            fromPlayer.isWitch = fromPlayer.wasWitch || fromPlayer.tryalCards.some(c => c.isWitch);
        }

        return { reveals, transfers: newTryals };
    },

    // Check if game is over
    checkGameOver() {
        const aliveWitches = this.getAliveWitches();
        const aliveVillagers = this.getAliveVillagers();

        // All witches revealed/dead
        if (aliveWitches.length === 0 || this.state.revealedWitches.length >= this.state.totalWitches) {
            this.state.phase = this.PHASES.GAME_OVER;
            return { over: true, winner: 'villagers' };
        }

        // All villagers dead
        if (aliveVillagers.length === 0) {
            this.state.phase = this.PHASES.GAME_OVER;
            return { over: true, winner: 'witches' };
        }

        return { over: false };
    },

    // Get state for syncing
    getStateForSync() {
        return Utils.deepClone(this.state);
    },

    // Apply synced state
    applySyncedState(newState) {
        this.state = Utils.deepClone(newState);
    }
};

// Export for use in other modules
window.GameState = GameState;
