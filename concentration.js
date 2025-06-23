class EchoesGame {
    constructor() {
        this.difficulty = 'easy';
        this.health = 100;
        this.gold = 0;
        this.round = 1;
        this.startTime = null;
        this.timerInterval = null;
        this.gameRunning = false;
        this.board = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.cardsToMatch = 2;
        this.maxPossibleMatches = 0; // Track maximum possible matches for this chamber
        
        this.difficultySettings = {
            easy: { 
                rows: 2, 
                cols: 4, 
                mismatchCost: 1, 
                matchReward: 10, 
                startHealth: 100,
                description: "A gentle introduction to the dungeon's mysteries. Small chamber with forgiving curses."
            },
            medium: { 
                rows: 4, 
                cols: 4, 
                mismatchCost: 2, 
                matchReward: 25, 
                startHealth: 100,
                description: "The dungeon reveals more of its secrets. Moderate chamber with stronger curses, but greater rewards."
            },
            hard: { 
                rows: 4, 
                cols: 6, 
                mismatchCost: 5, 
                matchReward: 100, 
                startHealth: 100,
                description: "Face the dungeon's full wrath. Vast chamber with deadly curses, but legendary treasures await."
            }
        };

        this.ancientRunes = ['⚔️', '🏺', '💎', '🗝️', '🕯️', '📜', '🔮', '⚱️', '🏛️', '🗿', '💀', '👑', '🛡️', '⚖️', '🕊️', '🐍', '🦅', '🌙', '⭐', '🔱', '🎭', '🎪', '🎨', '🎯'];

        this.bindEvents();
        this.updateDisplay();
    }

    bindEvents() {
        document.getElementById('enterDungeon').addEventListener('click', () => this.enterGame());
        document.getElementById('startQuest').addEventListener('click', () => this.startGame());
        document.getElementById('resetQuest').addEventListener('click', () => this.resetGame());
        document.getElementById('returnBtn').addEventListener('click', () => this.resetGame());

        document.querySelectorAll('.rune-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.gameRunning) {
                    document.querySelectorAll('.rune-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.difficulty = e.target.dataset.difficulty;
                    this.updateDifficulty();
                    this.updateDifficultyDescription();
                }
            });
        });
    }

    enterGame() {
        document.getElementById('titleScreen').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        this.updateDifficultyDescription();
    }

    startGame() {
        this.gameRunning = true;
        this.startTime = Date.now();
        this.health = this.difficultySettings[this.difficulty].startHealth;
        this.gold = 0;
        this.round = 1;
        this.cardsToMatch = 2;
        this.startTimer();
        this.createBoard();
        this.updateDisplay();
        document.getElementById('startQuest').style.display = 'none';
        document.querySelector('.difficulty-chamber').style.display = 'none';
    }

    resetGame() {
        this.gameRunning = false;
        this.health = this.difficultySettings[this.difficulty].startHealth;
        this.gold = 0;
        this.round = 1;
        this.cardsToMatch = 2;
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.stopTimer();
        this.clearBoard();
        this.updateDisplay();
        document.getElementById('deathPortal').classList.add('hidden');
        document.getElementById('startQuest').style.display = 'inline-block';
        document.querySelector('.difficulty-chamber').style.display = 'block';
        // Reset to title screen
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('titleScreen').style.display = 'flex';
    }

    createBoard() {
        const settings = this.difficultySettings[this.difficulty];
        const totalCards = settings.rows * settings.cols;
        
        // Check if cards to match exceeds total cards
        if (this.cardsToMatch >= totalCards) {
            this.gameOver();
            return;
        }
        
        // Calculate maximum possible matches for this round
        this.maxPossibleMatches = Math.floor(totalCards / this.cardsToMatch);
        this.totalPairs = this.maxPossibleMatches; // Update total pairs to reflect actual achievable matches
        
        const dungeonBoard = document.getElementById('dungeonBoard');
        dungeonBoard.style.gridTemplateColumns = `repeat(${settings.cols}, 1fr)`;
        dungeonBoard.style.gridTemplateRows = `repeat(${settings.rows}, 1fr)`;
        
        // Create groups of matching symbols
        const cardSymbols = [];
        const symbolsNeeded = this.maxPossibleMatches; // Only create symbols for achievable matches
        
        for (let i = 0; i < symbolsNeeded; i++) {
            for (let j = 0; j < this.cardsToMatch; j++) {
                cardSymbols.push(this.ancientRunes[i % this.ancientRunes.length]);
            }
        }
        
        // Fill remaining slots with random symbols (these will be unmatched)
        const remainingSlots = totalCards - (symbolsNeeded * this.cardsToMatch);
        for (let i = 0; i < remainingSlots; i++) {
            // Use symbols that don't have enough pairs to match
            const randomSymbol = this.ancientRunes[(symbolsNeeded + i) % this.ancientRunes.length];
            cardSymbols.push(randomSymbol);
        }
        
        // Shuffle the symbols
        cardSymbols.sort(() => Math.random() - 0.5);
        
        // Create board
        this.board = [];
        dungeonBoard.innerHTML = '';
        
        for (let i = 0; i < totalCards; i++) {
            const tile = document.createElement('div');
            tile.className = 'dungeon-tile';
            tile.dataset.index = i;
            tile.dataset.symbol = cardSymbols[i];
            tile.addEventListener('click', () => this.flipTile(i));
            dungeonBoard.appendChild(tile);
            
            this.board.push({
                element: tile,
                symbol: cardSymbols[i],
                flipped: false,
                matched: false
            });
        }
    }

    flipTile(index) {
        if (!this.gameRunning || this.board[index].flipped || this.board[index].matched) return;
        if (this.flippedCards.length >= this.cardsToMatch) return;

        const tile = this.board[index];
        tile.flipped = true;
        tile.element.classList.add('revealed');
        tile.element.textContent = tile.symbol;
        this.flippedCards.push(index);

        if (this.flippedCards.length === this.cardsToMatch) {
            setTimeout(() => this.checkMatch(), 1000);
        }
    }

    checkMatch() {
        const symbols = this.flippedCards.map(index => this.board[index].symbol);
        const isMatch = symbols.every(symbol => symbol === symbols[0]);

        if (isMatch) {
            // Match found
            this.flippedCards.forEach(index => {
                this.board[index].matched = true;
                this.board[index].element.classList.add('matched');
            });
            
            this.health += 1;
            this.gold += this.difficultySettings[this.difficulty].matchReward;
            this.matchedPairs++;
            
            // Check if we've reached the maximum possible matches for this round
            if (this.matchedPairs >= this.maxPossibleMatches) {
                this.completeRound();
            }
        } else {
            // No match - cursed tiles
            this.flippedCards.forEach(index => {
                const tile = this.board[index];
                tile.element.classList.add('cursed');
                setTimeout(() => {
                    tile.flipped = false;
                    tile.element.classList.remove('revealed', 'cursed');
                    tile.element.textContent = '';
                }, 600);
            });
            
            this.health -= this.difficultySettings[this.difficulty].mismatchCost;
            
            if (this.health <= 0) {
                this.gameOver();
                return;
            }
        }

        this.flippedCards = [];
        this.updateDisplay();
    }

    completeRound() {
        this.health += 5;
        this.gold += this.difficultySettings[this.difficulty].matchReward;
        this.round++;
        this.matchedPairs = 0;
        
        // Increase cards to match every 5 rounds
        if (this.round > 5 && (this.round - 1) % 5 === 0) {
            this.cardsToMatch++;
        }
        
        setTimeout(() => {
            this.createBoard();
            this.updateDisplay();
        }, 2000);
    }

    gameOver() {
        this.gameRunning = false;
        this.stopTimer();
        
        // Show final stats
        document.getElementById('finalRounds').textContent = this.round;
        document.getElementById('finalGold').textContent = this.gold;
        document.getElementById('finalTime').textContent = this.getFormattedTime();
        
        // Show death portal
        document.getElementById('deathPortal').classList.remove('hidden');
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        if (this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('timer').textContent = this.formatTime(elapsed);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    getFormattedTime() {
        if (this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            return this.formatTime(elapsed);
        }
        return '00:00';
    }

    clearBoard() {
        const dungeonBoard = document.getElementById('dungeonBoard');
        dungeonBoard.innerHTML = '';
        this.board = [];
    }

    updateDifficultyDescription() {
        // Create or update difficulty description element
        let descriptionElement = document.getElementById('difficultyDescription');
        if (!descriptionElement) {
            descriptionElement = document.createElement('div');
            descriptionElement.id = 'difficultyDescription';
            descriptionElement.className = 'difficulty-description';
            
            // Insert after the difficulty buttons
            const difficultyRunes = document.querySelector('.difficulty-runes');
            difficultyRunes.parentNode.insertBefore(descriptionElement, difficultyRunes.nextSibling);
        }
        
        const currentSettings = this.difficultySettings[this.difficulty];
        descriptionElement.innerHTML = `
            <p class="difficulty-desc-text">${currentSettings.description}</p>
            <div class="difficulty-stats">
                <span>Chamber Size: ${currentSettings.cols}×${currentSettings.rows}</span><br>
                <span>Curse Damage: ${currentSettings.mismatchCost} life</span><br>
                <span>Chamber Clear Reward: ${currentSettings.matchReward} gold</span>
            </div>
        `;
    }

    updateDifficulty() {
        // Update the health to match new difficulty's starting health
        this.health = this.difficultySettings[this.difficulty].startHealth;
        this.updateDisplay();
    }

    updateDisplay() {
        document.getElementById('health').textContent = this.health;
        document.getElementById('gold').textContent = this.gold;
        document.getElementById('round').textContent = this.round;
        document.getElementById('matchRequirement').textContent = `Match ${this.cardsToMatch} ancient runes at a time`;
        
        // Update health color based on current health
        const healthDisplay = document.getElementById('health');
        if (this.health <= 3) {
            healthDisplay.style.color = '#dc143c';
        } else if (this.health <= 6) {
            healthDisplay.style.color = '#ffa500';
        } else {
            healthDisplay.style.color = '#d4af37';
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new EchoesGame();
});