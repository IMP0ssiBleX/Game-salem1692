/**
 * Salem 1692 - Bot AI System
 * ระบบ AI สำหรับบอทเล่นอัตโนมัติ
 */

const BotAI = {
    // ความเร็วในการเล่นของบอท (ms)
    DELAY: {
        CHARACTER_SELECT: 1000,
        DRAW_CARDS: 1500,
        PLAY_CARD: 2000,
        END_TURN: 1000,
        NIGHT_ACTION: 2000
    },

    // Bot personality weights (affects decision making)
    PERSONALITY: {
        AGGRESSIVE: { accusation: 0.7, helper: 0.2, protection: 0.1 },
        DEFENSIVE: { accusation: 0.3, helper: 0.4, protection: 0.3 },
        BALANCED: { accusation: 0.5, helper: 0.3, protection: 0.2 }
    },

    // Initialize bot AI system
    init() {
        console.log('Bot AI System Initialized');
    },

    // Check if it's a bot's turn
    isBotTurn() {
        const currentPlayer = GameState.getCurrentPlayer();
        return currentPlayer && currentPlayer.isBot;
    },

    // Run bot turn automatically
    async runBotTurn() {
        if (!this.isBotTurn()) return;

        const bot = GameState.getCurrentPlayer();
        console.log(`🤖 Bot ${bot.name} is playing...`);

        // Decide action: Draw or Play
        // If hand empty or low cards, prioritize drawing
        const handSize = bot.handCards.length;
        const shouldDraw = handSize === 0 || (handSize < 3 && Math.random() < 0.7);

        if (shouldDraw) {
            // Step 1: Draw cards
            await this.delay(this.DELAY.DRAW_CARDS);
            const drawResult = this.botDrawCards(bot);

            // Handle special cards (Night, Malice)
            if (drawResult && drawResult.action === 'night') {
                UI.showToast(`🌙 ${bot.name} จั่วการ์ดค่ำคืน!`, 'info');
                GameState.startNight();
                await this.handleNightPhase();
                return;
            }

            if (drawResult && drawResult.action === 'malice') {
                UI.showToast(`🌀 ${bot.name} จั่วการ์ดเจตนาร้าย!`, 'info');
                GameState.handleMalice();
                // After malice, turn might continue or end? 
                // Usually allows to continue or end? 
                // Assuming end of "drawing" action.
            }
        } else {
            // Step 2: Play cards
            await this.delay(this.DELAY.PLAY_CARD);
            await this.botPlayCards(bot);
        }

        // Step 3: End turn
        await this.delay(this.DELAY.END_TURN);
        this.botEndTurn(bot);
    },

    // Bot draws cards
    botDrawCards(bot) {
        if (GameState.state.hasDrawn) return null;

        const result = GameState.drawCards(2);
        if (result.action === 'error') return null;

        GameState.state.hasDrawn = true;
        GameState.state.turnPhase = 'drawn';

        UI.showToast(`🤖 ${bot.name} จั่วการ์ด`, 'info');
        GameLog.logBot(bot.name, 'จั่ว 2 การ์ด');

        return result;
    },

    // Bot decides which cards to play
    async botPlayCards(bot) {
        const personality = this.selectPersonality(bot);
        const handCards = [...bot.handCards];

        // Witches play more carefully to avoid suspicion
        const isWitch = bot.isWitch;

        for (const card of handCards) {
            const target = this.selectTarget(bot, card, isWitch);

            if (target) {
                const result = GameState.playCard(card.id, target.id);

                if (result.success) {
                    UI.showToast(`🤖 ${bot.name} เล่น ${card.name} ใส่ ${target.name}`, 'info');

                    // Log bot action
                    if (card.type === 'red') {
                        GameLog.logAccuse(bot.name, target.name, card.value || 1);
                    } else {
                        GameLog.logBot(bot.name, `เล่น ${card.name} ใส่ ${target.name}`);
                    }

                    // Handle reveal tryal
                    if (result.result.action === 'reveal_tryal') {
                        const revealResult = GameState.revealTryalCard(target.id, bot.id);

                        if (revealResult.action === 'witch_revealed') {
                            UI.showToast(`🧙‍♀️ ${target.name} เป็นแม่มด!`, 'success');
                            GameLog.logReveal(target.name, 'witch');
                            Utils.vibrate([100, 50, 100]);
                        } else {
                            UI.showToast(`✨ ${target.name} ไม่ใช่แม่มด`, 'info');
                            GameLog.logReveal(target.name, 'not_witch');
                        }
                    }

                    await this.delay(500);
                }
            }
        }

        // Update UI
        if (GameState.state.localPlayerId) {
            const localPlayer = GameState.getLocalPlayer();
            if (localPlayer) {
                UI.updatePlayerScreen(localPlayer, GameState.state);
            }
        }
    },

    // Select target for a card
    selectTarget(bot, card, isWitch) {
        const alivePlayers = GameState.getAlivePlayers().filter(p => p.id !== bot.id);

        if (alivePlayers.length === 0) return null;

        // Witches avoid accusing other witches
        let validTargets = alivePlayers;

        if (isWitch && card.type === 'red') {
            // Avoid other witches (they know who)
            validTargets = alivePlayers.filter(p => !p.isWitch);

            // If all others are witches, don't play red cards
            if (validTargets.length === 0) return null;
        }

        // For green/helper cards, prioritize self or allies
        if (card.type === 'green') {
            // Alibi - target player with most accusations
            if (card.id.startsWith('alibi')) {
                const maxAccused = validTargets.reduce((max, p) =>
                    p.accusations > max.accusations ? p : max, validTargets[0]);
                return maxAccused.accusations > 0 ? maxAccused : null;
            }

            // Stocks - target player who's dangerous
            if (card.id.startsWith('stocks')) {
                return Utils.randomFrom(validTargets);
            }
        }

        // For blue cards - target self or allies
        if (card.type === 'blue') {
            // Can't target self normally, so pick random
            return Utils.randomFrom(validTargets);
        }

        // For red cards - target strategically
        if (card.type === 'red') {
            // Target player with highest accusations (close to reveal)
            const sortedByAccusations = validTargets.sort((a, b) => b.accusations - a.accusations);

            // Random chance to target highest or random
            if (Math.random() > 0.5 && sortedByAccusations[0].accusations > 0) {
                return sortedByAccusations[0];
            }

            return Utils.randomFrom(validTargets);
        }

        return Utils.randomFrom(validTargets);
    },

    // Bot ends turn
    botEndTurn(bot) {
        const nextPlayer = GameState.endTurn();
        UI.showToast(`เทิร์นของ ${nextPlayer.name}`, 'info');
        GameLog.logTurn(nextPlayer.name);

        // Update UI
        if (GameState.state.localPlayerId) {
            const localPlayer = GameState.getLocalPlayer();
            if (localPlayer) {
                UI.updatePlayerScreen(localPlayer, GameState.state);
            }
        }

        // Check game over
        const gameOver = GameState.checkGameOver();
        if (gameOver.over) {
            UI.showEndGame(gameOver.winner, GameState.state);
            return;
        }

        // If next player is also a bot, run their turn
        if (nextPlayer.isBot && nextPlayer.isAlive) {
            setTimeout(() => this.runBotTurn(), this.DELAY.DRAW_CARDS);
        }
    },

    // Handle night phase for bots
    async handleNightPhase() {
        await this.delay(this.DELAY.NIGHT_ACTION);

        // Find witch bots
        const witchBots = GameState.state.players.filter(p => p.isBot && p.isWitch && p.isAlive);

        for (const witch of witchBots) {
            // Witch selects target to kill
            const targets = GameState.getAlivePlayers().filter(p => !p.isWitch);

            if (targets.length > 0) {
                const target = Utils.randomFrom(targets);
                GameState.witchSelectTarget(target.id);
                console.log(`🧙‍♀️ Witch ${witch.name} targets ${target.name}`);
            }
        }

        // Find constable bots
        const constableBots = GameState.state.players.filter(p => p.isBot && p.isConstable && p.isAlive);

        for (const constable of constableBots) {
            // Constable protects random player
            const targets = GameState.getAlivePlayers().filter(p => p.id !== constable.id);

            if (targets.length > 0) {
                const target = Utils.randomFrom(targets);
                GameState.constableProtect(target.id);
                console.log(`👮 Constable ${constable.name} protects ${target.name}`);
            }
        }

        // Resolve night after delay
        await this.delay(this.DELAY.NIGHT_ACTION);

        const result = GameState.resolveNight();

        if (result.killed) {
            const victims = Array.isArray(result.killed) ? result.killed : [result.killed];
            victims.forEach(victim => {
                UI.showToast(`💀 ${victim.name} ถูกสังหารในคืนนี้...`, 'error');
            });
        } else {
            UI.showToast('ไม่มีใครถูกสังหารในคืนนี้', 'success');
        }

        // Check game over
        if (result.gameOver && result.gameOver.over) {
            UI.showEndGame(result.gameOver.winner, GameState.state);
            return;
        }

        // Return to day phase
        Screens.show('player');

        const localPlayer = GameState.getLocalPlayer();
        if (localPlayer) {
            UI.updatePlayerScreen(localPlayer, GameState.state);
        }

        // Continue with next player's turn
        const currentPlayer = GameState.getCurrentPlayer();
        if (currentPlayer && currentPlayer.isBot) {
            setTimeout(() => this.runBotTurn(), this.DELAY.DRAW_CARDS);
        }
    },

    // Bot selects character automatically
    botSelectCharacter(bot, availableCharacters) {
        const randomChar = Utils.randomFrom(availableCharacters);
        bot.characterId = randomChar.id;
        console.log(`🤖 ${bot.name} selected ${randomChar.name}`);
        return randomChar;
    },

    // Auto-select characters for all bots
    autoSelectBotCharacters() {
        const allCharacters = Characters.getSelectionPool(GameState.state.players.length);
        const usedIds = GameState.state.players.filter(p => p.characterId).map(p => p.characterId);
        const available = allCharacters.filter(c => !usedIds.includes(c.id));

        GameState.state.players.forEach(player => {
            if (player.isBot && !player.characterId && available.length > 0) {
                const char = available.shift();
                player.characterId = char.id;
                console.log(`🤖 ${player.name} auto-selected ${char.name}`);
            }
        });
    },

    // Select personality based on bot's role
    selectPersonality(bot) {
        if (bot.isWitch) {
            return this.PERSONALITY.DEFENSIVE;
        }
        return Math.random() > 0.5 ? this.PERSONALITY.AGGRESSIVE : this.PERSONALITY.BALANCED;
    },

    // Delay helper
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Export for use in other modules
window.BotAI = BotAI;
