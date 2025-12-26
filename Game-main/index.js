class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.gameMode = 'pvc'; // Only PvC mode
        this.timerMode = 'blitz'; // Only 5-second blitz mode
        this.moveTimeLimit = 3; // Fixed 3 seconds
        this.isComputerTurn = false;
        
        // Initialize game logger
        this.logger = new GameLogger();
        
        // Hidden birthday rule tracking
        this.loseDrawCount = 0; // Track consecutive losses/draws
        
        // Color protection system
        this.colorProtectedCells = Array(9).fill(false); // Prevent color changes on recently clicked cells
        
        // Color system - 4 boxes at once (reduced for 3x3)
        this.cellColors = Array(9).fill('white');
        this.colorTimers = Array(9).fill(null);
        this.colors = ['red', 'blue', 'purple']; // Only 3 active colors + white
        this.gameStartTime = null;
        this.colorChangeInterval = null;
        
        // Sequential color cycling system - 4 boxes at once for 3x3
        this.currentCyclingCells = []; // Array to hold 4 cycling cells
        this.colorCycleTimers = []; // Array to hold timers for each cycling cell
        this.cellQueue = [];
        this.isCycling = false;
        
        // Bomb system
        this.bombs = Array(9).fill(null); // stores bomb info: {player, turnsLeft}
        this.turnCount = 0;
        
        // Shield system
        this.shields = Array(9).fill(false); // tracks which cells are shielded
        
        // End game rule tracking
        this.swapHappenedThisTurn = false;
        this.explosionHappenedThisTurn = false;
        this.pendingExplosions = 0;
        
        // Timer system
        this.moveTimer = null;
        this.timeLeft = 3;
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerFill = document.getElementById('timerFill');
        this.timerContainer = document.getElementById('timerContainer');
        
        this.statusElement = document.getElementById('status');
        this.gameBoardElement = document.getElementById('gameBoard');
        this.gameBoardContainer = document.getElementById('gameBoardContainer');
        this.gameInfoElement = document.getElementById('gameInfo');
        this.gameModesElement = document.getElementById('gameModes');
        this.resetButton = document.getElementById('resetBtn');
        this.backButton = document.getElementById('backBtn');
        this.pvcBlitzBtn = document.getElementById('pvcBlitzBtn');
        
        this.rulesButton = document.getElementById('rulesBtn');
        this.rulesMenu = document.getElementById('rulesMenu');
        this.backToMenuButton = document.getElementById('backToMenuBtn');
        
        // Stats elements (hidden/optional)
        this.statsButton = document.getElementById('statsBtn');
        this.statsMenu = document.getElementById('statsMenu');
        this.statsDisplay = document.getElementById('statsDisplay');
        this.exportLogBtn = document.getElementById('exportLogBtn');
        this.clearStatsBtn = document.getElementById('clearStatsBtn');
        this.backFromStatsBtn = document.getElementById('backFromStatsBtn');
        
        // End game overlay elements
        this.gameEndOverlay = document.getElementById('gameEndOverlay');
        this.endGameIcon = document.getElementById('endGameIcon');
        this.endGameTitle = document.getElementById('endGameTitle');
        this.endGameMessage = document.getElementById('endGameMessage');
        this.tryAgainBtn = document.getElementById('tryAgainBtn');
        
        this.winningConditions = [
            // Horizontal rows
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            // Vertical columns
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            // Diagonal lines
            [0, 4, 8],
            [2, 4, 6]
        ];
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.gameBoardElement.addEventListener('click', this.handleCellClick.bind(this));
        this.resetButton.addEventListener('click', this.resetGame.bind(this));
        this.backButton.addEventListener('click', this.backToMenu.bind(this));
        
        // Only PvC Blitz mode button
        this.pvcBlitzBtn.addEventListener('click', () => this.startGame());
        
        this.rulesButton.addEventListener('click', this.showRules.bind(this));
        this.backToMenuButton.addEventListener('click', this.hideRules.bind(this));
        this.tryAgainBtn.addEventListener('click', this.tryAgain.bind(this));
        
        // Stats event listeners (only if elements exist)
        if (this.statsButton) {
            this.statsButton.addEventListener('click', this.showStats.bind(this));
        }
        if (this.backFromStatsBtn) {
            this.backFromStatsBtn.addEventListener('click', this.hideStats.bind(this));
        }
        if (this.exportLogBtn) {
            this.exportLogBtn.addEventListener('click', this.exportLog.bind(this));
        }
        if (this.clearStatsBtn) {
            this.clearStatsBtn.addEventListener('click', this.clearStats.bind(this));
        }
    }
    
    startGame() {
        this.gameModesElement.style.display = 'none';
        this.gameInfoElement.style.display = 'block';
        this.gameBoardContainer.style.display = 'block';
        
        // Start game timer and color changing system
        this.gameStartTime = Date.now();
        this.startProgressiveColorSystem();
        
        // Start logging for this game
        this.logger.startGame();
        
        this.updateStatus('You are X, Computer is O. Your turn!');
        this.startMoveTimer(); // Start timer for first player
    }
    
    backToMenu() {
        // Clear all timers
        this.clearAllTimers();
        
        // Hide end game overlay if it's showing
        this.hideEndGameOverlay();
        
        this.resetGame(false); // Don't start the game when going back to menu
        this.gameModesElement.style.display = 'block';
        this.gameInfoElement.style.display = 'none';
        this.gameBoardContainer.style.display = 'none';
        this.rulesMenu.style.display = 'none';
    }
    
    showRules() {
        this.gameModesElement.style.display = 'none';
        this.rulesMenu.style.display = 'block';
    }
    
    hideRules() {
        this.rulesMenu.style.display = 'none';
        this.gameModesElement.style.display = 'block';
    }
    
    showStats() {
        if (!this.statsMenu) return; // Stats UI is hidden
        this.gameModesElement.style.display = 'none';
        this.statsMenu.style.display = 'block';
        this.updateStatsDisplay();
    }
    
    hideStats() {
        if (!this.statsMenu) return; // Stats UI is hidden
        this.statsMenu.style.display = 'none';
        this.gameModesElement.style.display = 'block';
    }
    
    updateStatsDisplay() {
        if (!this.statsDisplay) return; // Stats UI is hidden
        const stats = this.logger.getStats();
        const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
        
        this.statsDisplay.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Games Played:</span>
                <span class="stat-value">${stats.gamesPlayed}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Wins:</span>
                <span class="stat-value win">${stats.wins} (${this.logger.getPercentage(stats.wins, stats.gamesPlayed)}%)</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Losses:</span>
                <span class="stat-value loss">${stats.losses} (${this.logger.getPercentage(stats.losses, stats.gamesPlayed)}%)</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Draws:</span>
                <span class="stat-value draw">${stats.draws} (${this.logger.getPercentage(stats.draws, stats.gamesPlayed)}%)</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Timeouts:</span>
                <span class="stat-value timeout">${stats.timeouts} (${this.logger.getPercentage(stats.timeouts, stats.gamesPlayed)}%)</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Play Time:</span>
                <span class="stat-value">${stats.currentSessionTime}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Average Game Time:</span>
                <span class="stat-value">${this.logger.formatDuration(stats.averageGameTime)}</span>
            </div>
        `;
    }
    
    exportLog() {
        this.logger.exportLog();
    }
    
    clearStats() {
        if (confirm('Are you sure you want to clear all statistics and logs? This cannot be undone.')) {
            this.logger.clearLogs();
            this.updateStatsDisplay();
        }
    }
    
    handleCellClick(event) {
        const clickedCell = event.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
        
        if (this.board[clickedCellIndex] !== '' || !this.gameActive || this.isComputerTurn) {
            return;
        }
        
        this.makeMove(clickedCellIndex, clickedCell);
        
        // Computer moves after a short delay
        if (this.gameActive && this.currentPlayer === 'O') {
            this.isComputerTurn = true;
            setTimeout(() => {
                if (this.gameActive) {
                    this.makeComputerMove();
                }
                this.isComputerTurn = false;
            }, 1000);
        }
    }
    
    makeMove(index, cellElement) {
        // Clear the current move timer
        this.clearMoveTimer();
        
        // Reset turn-based flags
        this.swapHappenedThisTurn = false;
        this.explosionHappenedThisTurn = false;
        
        const color = this.cellColors[index];
        console.log(`🎯 Cell ${index} clicked with color: ${color}, visual class: ${cellElement.className}`);
        console.log(`📋 Board before move:`, this.board);
        
        // Protect this cell from color changes for a short time
        this.colorProtectedCells[index] = true;
        setTimeout(() => {
            this.colorProtectedCells[index] = false;
        }, 1000);
        
        // Check if it's a red cell - place bomb instead of X/O
        if (color === 'red') {
            this.placeBombDirectly(index, cellElement);
        } else {
            // Normal move - place X or O
            this.board[index] = this.currentPlayer;
            cellElement.textContent = this.currentPlayer;
            cellElement.classList.add(this.currentPlayer.toLowerCase());
            
            // Handle other color effects (blue, purple)
            this.handleColorEffect(index, cellElement);
        }
        
        // Increment turn count and check bombs
        this.turnCount++;
        console.log(`📋 Board after move:`, this.board);
        console.log(`🎮 Turn ${this.turnCount} completed by ${this.currentPlayer}`);
        
        this.checkBombExplosions();
        
        this.checkResult();
    }
    
    checkResult() {
        let roundWon = false;
        let winningCells = [];
        
        for (let i = 0; i < this.winningConditions.length; i++) {
            const [a, b, c] = this.winningConditions[i];
            // Only check for X and O wins, not bomb emojis
            if (this.board[a] && 
                (this.board[a] === 'X' || this.board[a] === 'O') &&
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                roundWon = true;
                winningCells = [a, b, c];
                break;
            }
        }
        
        if (roundWon) {
            // Check if swap or explosion happened this turn - if so, continue game
            if (this.swapHappenedThisTurn || this.explosionHappenedThisTurn) {
                console.log(`🎮 Win detected but ${this.swapHappenedThisTurn ? 'swap' : 'explosion'} happened this turn - game continues!`);
                this.switchPlayer();
                return;
            }
            
            // Normal win condition
            this.highlightWinningCells(winningCells);
            this.gameActive = false;
            this.gameBoardElement.classList.add('game-over');
            this.clearMoveTimer(); // Stop timer when game ends
            
            if (this.currentPlayer === 'X') {
                this.addVanishEffect('O'); // Computer's pieces vanish
                this.showWinningAnimation();
                this.loseDrawCount = 0; // Reset counter on win
                this.logger.endGame('win', '3 in a row victory');
                this.showBirthdayCelebration('You Win!', 'Happy Birthday Mish! 🎂 You got 3 in a row!');
            } else {
                this.addVanishEffect('X'); // Player's pieces vanish
                this.showLosingAnimation();
                this.loseDrawCount++;
                this.logger.endGame('lose', 'Computer got 3 in a row');
                this.checkHiddenRule('lose', 'You Lose!', 'Computer got 3 in a row. Better luck next time!', '😢');
            }
            return;
        }
        
        // Enhanced draw detection with debug logging
        const emptyCount = this.board.filter(cell => cell === '').length;
        const filledCount = this.board.filter(cell => cell !== '').length;
        console.log(`🔍 Draw check: Empty cells: ${emptyCount}, Filled cells: ${filledCount}, Board:`, this.board);
        
        if (!this.board.includes('')) {
            console.log(`🤝 Draw detected! Board is completely full. Board state:`, this.board);
            this.gameActive = false;
            this.gameBoardElement.classList.add('game-over');
            this.clearMoveTimer(); // Stop timer when game ends
            this.loseDrawCount++;
            this.logger.endGame('draw', 'Board is full');
            this.checkHiddenRule('draw', "It's a Draw!", 'The board is full! No one wins this time.', '🤝');
            return;
        } else {
            console.log(`🎮 Game continues - ${emptyCount} empty cells remaining`);
        }
        
        this.switchPlayer();
    }
    
    highlightWinningCells(cells) {
        cells.forEach(index => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            cell.classList.add('winner');
        });
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        
        if (this.currentPlayer === 'X') {
            this.updateStatus('Your turn! (3s)');
            this.startMoveTimer(); // Start timer for human player
        } else {
            this.updateStatus("Computer's turn...");
            // Don't start timer for computer, it will move automatically
        }
    }
    
    updateStatus(message) {
        this.statusElement.textContent = message;
    }
    
    makeComputerMove() {
        // Simple AI: Try to win, then block player, then random
        let bestMove = this.findBestMove();
        
        if (bestMove !== -1) {
            const cell = document.querySelector(`[data-index="${bestMove}"]`);
            this.makeMove(bestMove, cell);
        }
    }
    
    findBestMove() {
        // Check if computer can win
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                if (this.checkWinner('O')) {
                    this.board[i] = '';
                    return i;
                }
                this.board[i] = '';
            }
        }
        
        // Check if computer needs to block player
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'X';
                if (this.checkWinner('X')) {
                    this.board[i] = '';
                    return i;
                }
                this.board[i] = '';
            }
        }
        
        // Take center if available
        if (this.board[4] === '') {
            return 4;
        }
        
        // Take corners
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => this.board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Take any available spot
        const availableSpots = [];
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                availableSpots.push(i);
            }
        }
        
        return availableSpots.length > 0 ? 
            availableSpots[Math.floor(Math.random() * availableSpots.length)] : -1;
    }
    
    checkWinner(player) {
        return this.winningConditions.some(condition => {
            return condition.every(index => this.board[index] === player);
        });
    }
    
    startProgressiveColorSystem() {
        // Initialize the cell queue with all empty cells
        this.initializeCellQueue();
        
        // Start the new color cycling system
        this.startNextCellCycle();
    }
    
    initializeCellQueue() {
        // Get all empty cells and shuffle them
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                emptyCells.push(i);
            }
        }
        this.cellQueue = this.shuffleArray([...emptyCells]);
    }
    
    startCellColorCycle(cellIndex, cycleId = 0) {
        if (this.board[cellIndex] !== '') return;
        
        // Start with white (default state)
        this.changeCellColor(cellIndex, 'white');
        
        // Random color system: white -> random color -> white
        const availableColors = ['red', 'blue', 'purple'];
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        
        let currentStep = 0; // 0: white, 1: random color, 2: white (end)
        
        const cycleNextColor = () => {
            // Check if cell is still empty
            if (this.board[cellIndex] !== '' || !this.gameActive) {
                this.completeCellCycle(cycleId);
                return;
            }
            
            if (currentStep === 0) {
                // Step 1: Change to random color
                this.changeCellColor(cellIndex, randomColor);
                currentStep++;
                
                // Random delay for the color display (1-3 seconds)
                const colorDisplayTime = Math.random() * 2000 + 1000;
                this.colorCycleTimers[cycleId] = setTimeout(cycleNextColor, colorDisplayTime);
            } else if (currentStep === 1) {
                // Step 2: Change back to white and complete cycle
                this.changeCellColor(cellIndex, 'white');
                currentStep++;
                
                // Brief delay before completing cycle
                const finalDelay = 200;
                this.colorCycleTimers[cycleId] = setTimeout(() => {
                    this.completeCellCycle(cycleId);
                }, finalDelay);
            }
        };
        
        // Start the color sequence after initial white
        const initialDelay = Math.random() * 800 + 400;
        this.colorCycleTimers[cycleId] = setTimeout(cycleNextColor, initialDelay);
    }
    
    completeCellCycle(cycleId) {
        // Clear the timer for this specific cycle
        if (this.colorCycleTimers[cycleId]) {
            clearTimeout(this.colorCycleTimers[cycleId]);
            this.colorCycleTimers[cycleId] = null;
        }
        
        // Remove the cell from current cycling cells
        if (cycleId < this.currentCyclingCells.length) {
            this.currentCyclingCells[cycleId] = null;
        }
        
        // Check if all 4 cycles are complete
        const activeCycles = this.currentCyclingCells.filter(cell => cell !== null);
        if (activeCycles.length === 0) {
            this.isCycling = false;
            
            // Start next batch of cells after a brief pause
            setTimeout(() => {
                if (this.gameActive) {
                    this.startNextCellCycle();
                }
            }, 500);
        }
    }
    
    startNextCellCycle() {
        if (this.isCycling) return;
        
        this.isCycling = true;
        this.currentCyclingCells = [null, null, null, null]; // 4 cells
        this.colorCycleTimers = [null, null, null, null]; // 4 timers
        
        // Find up to 4 available empty cells for 3x3 board
        const availableCells = [];
        
        // First try to find cells from the queue
        for (let i = 0; i < this.cellQueue.length && availableCells.length < 4; i++) {
            if (this.board[this.cellQueue[i]] === '') {
                availableCells.push(this.cellQueue[i]);
            }
        }
        
        // Remove selected cells from queue
        availableCells.forEach(cellIndex => {
            const queueIndex = this.cellQueue.indexOf(cellIndex);
            if (queueIndex > -1) {
                this.cellQueue.splice(queueIndex, 1);
            }
        });
        
        // If we don't have enough cells, refresh the queue
        if (availableCells.length < 4) {
            this.initializeCellQueue();
            
            // Add more cells from refreshed queue
            for (let i = 0; i < this.cellQueue.length && availableCells.length < 4; i++) {
                const cellIndex = this.cellQueue[i];
                if (this.board[cellIndex] === '' && !availableCells.includes(cellIndex)) {
                    availableCells.push(cellIndex);
                }
            }
            
            // Remove newly selected cells from queue
            availableCells.forEach(cellIndex => {
                const queueIndex = this.cellQueue.indexOf(cellIndex);
                if (queueIndex > -1) {
                    this.cellQueue.splice(queueIndex, 1);
                }
            });
        }
        
        // Start cycling the available cells
        if (availableCells.length > 0) {
            availableCells.forEach((cellIndex, index) => {
                if (this.board[cellIndex] === '') {
                    this.currentCyclingCells[index] = cellIndex;
                    this.startCellColorCycle(cellIndex, index);
                }
            });
        } else {
            // No empty cells available, stop cycling
            this.isCycling = false;
            
            // Only retry if there are actually empty cells on the board
            const hasEmptyCells = this.board.some(cell => cell === '');
            if (hasEmptyCells) {
                setTimeout(() => {
                    if (this.gameActive) {
                        this.startNextCellCycle();
                    }
                }, 1000);
            }
        }
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    changeCellColor(index, color) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (!cell || this.board[index] !== '' || !this.gameActive) return;
        
        // Don't change color if cell is protected (recently clicked)
        if (this.colorProtectedCells[index]) {
            console.log(`🛡️ Cell ${index} is protected from color change`);
            return;
        }
        
        // Remove all color classes
        const allColors = ['red', 'blue', 'purple', 'green', 'yellow'];
        allColors.forEach(c => {
            cell.classList.remove(`color-${c}`);
        });
        
        // Add new color (only if not white)
        this.cellColors[index] = color;
        if (color !== 'white') {
            cell.classList.add(`color-${color}`);
        }
        
        console.log(`🎨 Cell ${index} changed to ${color}`);
    }
    
    placeShield(index, cellElement) {
        // Place shield that protects the cell from bomb explosions
        this.shields[index] = true;
        cellElement.classList.add('shielded');
        console.log(`🪵 ${this.currentPlayer} placed a shield at position ${index}!`);
    }
    
    swapWithRandomPiece(index, cellElement) {
        // Find a random cell to exchange with (any cell except the current one)
        const availableCells = [];
        for (let i = 0; i < 9; i++) {
            if (i !== index) { // Exclude the current cell
                availableCells.push(i);
            }
        }
        
        if (availableCells.length === 0) {
            console.log(`🟣 No other cells available for exchange! Placing ${this.currentPlayer} normally.`);
            // Place normally if no other cells available
            this.board[index] = this.currentPlayer;
            cellElement.textContent = this.currentPlayer;
            cellElement.classList.add(this.currentPlayer.toLowerCase());
            return;
        }
        
        // Select a random cell to exchange with
        const randomCellIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
        const randomCellElement = document.querySelector(`[data-index="${randomCellIndex}"]`);
        
        // Get the content of the random cell (could be empty, X, O, or bomb)
        const randomCellContent = this.board[randomCellIndex];
        
        // Set swap flag for end game rule
        this.swapHappenedThisTurn = true;
        
        // Place current player's piece in the selected cell first
        this.board[index] = this.currentPlayer;
        cellElement.textContent = this.currentPlayer;
        cellElement.classList.add(this.currentPlayer.toLowerCase());
        
        // Show black hole effect between the selected cell and random cell
        this.createPurpleExchangeLine(index, randomCellIndex);
        
        // Start exchange animation between the selected cell and random cell
        this.animateCellExchange(index, randomCellIndex, cellElement, randomCellElement, this.currentPlayer, randomCellContent);
        
        console.log(`🟣 ${this.currentPlayer} triggered exchange! Cell ${index} (${this.currentPlayer}) ↔ Cell ${randomCellIndex} (${randomCellContent || 'empty'})`);
    }
    
    createPurpleExchangeLine(index1, index2) {
        // Create a black hole effect showing the exchange between cells
        const cell1 = document.querySelector(`[data-index="${index1}"]`);
        const cell2 = document.querySelector(`[data-index="${index2}"]`);
        
        // Check if both cells exist
        if (!cell1 || !cell2) {
            console.warn(`⚠️ Cannot create exchange effect - missing cell elements`);
            return;
        }
        
        const rect1 = cell1.getBoundingClientRect();
        const rect2 = cell2.getBoundingClientRect();
        
        // Calculate midpoint between the two cells for black hole center
        const centerX1 = rect1.left + rect1.width / 2;
        const centerY1 = rect1.top + rect1.height / 2;
        const centerX2 = rect2.left + rect2.width / 2;
        const centerY2 = rect2.top + rect2.height / 2;
        
        const midX = (centerX1 + centerX2) / 2;
        const midY = (centerY1 + centerY2) / 2;
        
        // Create black hole element
        const blackHole = document.createElement('div');
        blackHole.className = 'black-hole-effect';
        blackHole.style.cssText = `
            position: fixed;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            z-index: 30;
            left: ${midX - 40}px;
            top: ${midY - 40}px;
            animation: black-hole-animation 3s ease-in-out;
            pointer-events: none;
        `;
        
        document.body.appendChild(blackHole);
        
        // Create gravitational pull effects on both cells
        cell1.classList.add('black-hole-pull');
        cell2.classList.add('black-hole-pull');
        
        // Remove black hole and effects after animation
        setTimeout(() => {
            if (blackHole.parentNode) {
                blackHole.parentNode.removeChild(blackHole);
            }
            cell1.classList.remove('black-hole-pull');
            cell2.classList.remove('black-hole-pull');
        }, 3000);
    }
    
    animateCellExchange(index1, index2, cell1, cell2, piece1, piece2) {
        // Add exchange animation classes
        cell1.classList.add('enhanced-swap');
        cell2.classList.add('enhanced-swap');
        
        // Add trail effect to both cells
        cell1.classList.add('swap-trail');
        cell2.classList.add('swap-trail');
        
        // Perform the actual exchange after animation starts
        setTimeout(() => {
            // Exchange the contents of the two cells
            this.board[index1] = piece2;
            this.board[index2] = piece1;
            
            // Update visual representation for cell1 (receives piece2)
            cell1.textContent = piece2;
            cell1.classList.remove('x', 'o', 'bomb-active');
            if (piece2 !== '' && piece2 !== '💣') {
                cell1.classList.add(piece2.toLowerCase());
            } else if (piece2 === '💣') {
                cell1.classList.add('bomb-active');
            }
            
            // Update visual representation for cell2 (receives piece1)
            cell2.textContent = piece1;
            cell2.classList.remove('x', 'o', 'bomb-active');
            if (piece1 !== '' && piece1 !== '💣') {
                cell2.classList.add(piece1.toLowerCase());
            } else if (piece1 === '💣') {
                cell2.classList.add('bomb-active');
            }
            
            // Exchange any special properties (bombs, shields)
            this.exchangeSpecialProperties(index1, index2);
            
            // Check for win condition after exchange is complete
            console.log(`🔄 Exchange completed, checking for wins...`);
            this.checkResultAfterExchange();
        }, 1250); // Halfway through enhanced animation
        
        // Remove animation classes after animation completes
        setTimeout(() => {
            cell1.classList.remove('enhanced-swap', 'swap-trail');
            cell2.classList.remove('enhanced-swap', 'swap-trail');
        }, 2500); // Full enhanced animation duration
    }
    
    checkResultAfterExchange() {
        // Check for win condition after exchange is complete
        let roundWon = false;
        let winningCells = [];
        
        for (let i = 0; i < this.winningConditions.length; i++) {
            const [a, b, c] = this.winningConditions[i];
            // Only check for X and O wins, not bomb emojis
            if (this.board[a] && 
                (this.board[a] === 'X' || this.board[a] === 'O') &&
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                roundWon = true;
                winningCells = [a, b, c];
                break;
            }
        }
        
        if (roundWon) {
            // Win detected after exchange - end the game
            const winner = this.board[winningCells[0]];
            this.highlightWinningCells(winningCells);
            this.gameActive = false;
            this.gameBoardElement.classList.add('game-over');
            this.clearMoveTimer();
            
            if (winner === 'X') {
                this.addVanishEffect('O'); // Computer's pieces vanish
                this.showWinningAnimation();
                this.loseDrawCount = 0; // Reset counter on win
                this.logger.endGame('win', '3-in-a-row after exchange');
                this.showBirthdayCelebration('You Win!', 'Happy Birthday Mish! 🎂 Amazing 3-in-a-row exchange victory!');
            } else {
                this.addVanishEffect('X'); // Player's pieces vanish
                this.showLosingAnimation();
                this.loseDrawCount++;
                this.logger.endGame('lose', 'Computer won after exchange');
                this.checkHiddenRule('lose', 'You Lose!', 'Computer won after the exchange!', '😢');
                this.loseDrawCount++;
                this.checkHiddenRule('lose', 'You Lose!', 'Computer won after the exchange!', '😢');
            }
            return;
        }
        
        // Check for draw after exchange
        const emptyCountAfterExchange = this.board.filter(cell => cell === '').length;
        console.log(`🔍 Draw check after exchange: Empty cells: ${emptyCountAfterExchange}, Board:`, this.board);
        
        if (!this.board.includes('')) {
            console.log(`🤝 Draw detected after exchange! Board state:`, this.board);
            this.gameActive = false;
            this.gameBoardElement.classList.add('game-over');
            this.clearMoveTimer();
            this.loseDrawCount++;
            this.logger.endGame('draw', 'Board full after exchange');
            this.checkHiddenRule('draw', "It's a Draw!", 'The board is full after the exchange!', '🤝');
            return;
        }
        
        // No win or draw, continue the game
        // Reset the swap flag since we've now checked for wins after the exchange
        this.swapHappenedThisTurn = false;
    }
    
    exchangeSpecialProperties(index1, index2) {
        // Exchange bomb properties
        const tempBomb = this.bombs[index1];
        this.bombs[index1] = this.bombs[index2];
        this.bombs[index2] = tempBomb;
        
        // Exchange shield properties
        const tempShield = this.shields[index1];
        this.shields[index1] = this.shields[index2];
        this.shields[index2] = tempShield;
        
        // Update visual classes for special properties
        const cell1 = document.querySelector(`[data-index="${index1}"]`);
        const cell2 = document.querySelector(`[data-index="${index2}"]`);
        
        if (!cell1 || !cell2) return;
        
        // Handle bomb classes
        if (this.bombs[index1]) {
            cell1.classList.add('bomb-active');
        } else {
            cell1.classList.remove('bomb-active');
        }
        
        if (this.bombs[index2]) {
            cell2.classList.add('bomb-active');
        } else {
            cell2.classList.remove('bomb-active');
        }
        
        // Handle shield classes
        if (this.shields[index1]) {
            cell1.classList.add('shielded');
        } else {
            cell1.classList.remove('shielded');
        }
        
        if (this.shields[index2]) {
            cell2.classList.add('shielded');
        } else {
            cell2.classList.remove('shielded');
        }
    }
    
    startMoveTimer() {
        if (!this.gameActive) return;
        
        // Clear any existing timer first
        this.clearMoveTimer();
        
        this.timeLeft = this.moveTimeLimit;
        this.updateTimerDisplay();
        
        // Set timer bar color for blitz mode
        if (this.timerFill) {
            this.timerFill.classList.remove('bullet-mode', 'blitz-mode', 'rapid-mode');
            this.timerFill.classList.add('blitz-mode');
        }
        
        this.moveTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            // Warning state at 1 second left
            if (this.timeLeft === 1) {
                if (this.timerContainer) this.timerContainer.classList.add('warning');
                if (this.timerDisplay) this.timerDisplay.classList.add('warning');
                if (this.timerFill) this.timerFill.classList.add('warning');
                
                console.log(`⚠️ WARNING: ${this.timeLeft} second(s) left! You will lose if time runs out!`);
            }
            
            // Time's up
            if (this.timeLeft <= 0) {
                this.handleTimeOut();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        if (this.timerDisplay) {
            this.timerDisplay.textContent = this.timeLeft;
        }
        if (this.timerFill) {
            const percentage = (this.timeLeft / this.moveTimeLimit) * 100;
            this.timerFill.style.width = `${percentage}%`;
        }
    }
    
    handleTimeOut() {
        this.clearMoveTimer();
        
        // Only handle timeout if game is still active and not computer's turn
        if (!this.gameActive || this.isComputerTurn) return;
        
        // Player loses the game due to timeout
        console.log(`⏰ Time's up! ${this.currentPlayer} loses due to timeout!`);
        
        this.gameActive = false;
        this.gameBoardElement.classList.add('game-over');
        
        if (this.currentPlayer === 'X') {
            // Human player timed out - computer wins
            this.addVanishEffect('X'); // Player's pieces vanish
            this.showLosingAnimation();
            this.loseDrawCount++;
            this.logger.endGame('timeout', 'Player ran out of time');
            this.checkHiddenRule('lose', 'Time\'s Up!', 'You ran out of time! Computer wins.', '⏰');
        } else {
            // Computer timed out (shouldn't happen, but just in case)
            this.addVanishEffect('O'); // Computer's pieces vanish
            this.showWinningAnimation();
            this.loseDrawCount = 0; // Reset counter on win
            this.logger.endGame('win', 'Computer timed out');
            this.showBirthdayCelebration('Computer Timeout!', 'Happy Birthday Mish! 🎂 Computer ran out of time for 3-in-a-row!');
            this.showBirthdayCelebration('Computer Timeout!', 'Happy Birthday Mish! 🎂 Computer ran out of time for 3-in-a-row!');
        }
    }
    
    showWinningAnimation() {
        // Add winning animation to the game board
        this.gameBoardElement.classList.add('winning-animation');
        
        // Add celebration effects to all cells
        document.querySelectorAll('.cell').forEach((cell, index) => {
            setTimeout(() => {
                cell.classList.add('celebration');
            }, index * 100); // Stagger the animation
        });
        
        // Create confetti effect
        this.createConfetti();
        
        // Remove animation classes after animation completes
        setTimeout(() => {
            this.gameBoardElement.classList.remove('winning-animation');
            document.querySelectorAll('.cell').forEach(cell => {
                cell.classList.remove('celebration');
            });
        }, 3000);
    }
    
    showLosingAnimation() {
        // Add losing animation to the game board
        this.gameBoardElement.classList.add('losing-animation');
        
        // Add defeat effects to all cells
        document.querySelectorAll('.cell').forEach((cell, index) => {
            setTimeout(() => {
                cell.classList.add('defeat');
            }, index * 80); // Stagger the animation
        });
        
        // Create rain effect
        this.createRainEffect();
        
        // Remove animation classes after animation completes
        setTimeout(() => {
            this.gameBoardElement.classList.remove('losing-animation');
            document.querySelectorAll('.cell').forEach(cell => {
                cell.classList.remove('defeat');
            });
        }, 3000);
    }
    
    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    left: ${Math.random() * 100}vw;
                    top: -10px;
                    z-index: 1000;
                    border-radius: 50%;
                    animation: confetti-fall 3s linear forwards;
                    transform: rotate(${Math.random() * 360}deg);
                `;
                
                document.body.appendChild(confetti);
                
                // Remove confetti after animation
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3000);
            }, i * 50);
        }
    }
    
    createRainEffect() {
        const rainColors = ['#6c7b7f', '#95a5a6', '#7f8c8d'];
        
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const raindrop = document.createElement('div');
                raindrop.className = 'raindrop';
                raindrop.style.cssText = `
                    position: fixed;
                    width: 2px;
                    height: 20px;
                    background: ${rainColors[Math.floor(Math.random() * rainColors.length)]};
                    left: ${Math.random() * 100}vw;
                    top: -20px;
                    z-index: 1000;
                    border-radius: 2px;
                    animation: rain-fall 2s linear forwards;
                    opacity: 0.7;
                `;
                
                document.body.appendChild(raindrop);
                
                // Remove raindrop after animation
                setTimeout(() => {
                    if (raindrop.parentNode) {
                        raindrop.parentNode.removeChild(raindrop);
                    }
                }, 2000);
            }, i * 60);
        }
    }
    
    addVanishEffect(losingPlayer) {
        // Find all cells with the losing player's pieces and add vanish effect
        document.querySelectorAll('.cell').forEach((cell, index) => {
            const cellContent = this.board[index];
            
            // Check if this cell contains the losing player's piece
            if (cellContent === losingPlayer) {
                setTimeout(() => {
                    cell.classList.add('vanish');
                    
                    // Create vanish particles for each disappearing piece
                    setTimeout(() => {
                        this.createVanishParticles(cell);
                    }, 500); // Delay particles to sync with vanish animation
                }, 500 + index * 150); // Start vanish effect after a brief delay, then stagger
            }
        });
        
        // Remove vanish classes after animation completes
        setTimeout(() => {
            document.querySelectorAll('.cell').forEach(cell => {
                cell.classList.remove('vanish');
            });
        }, 3000);
    }
    
    createVanishParticles(cell) {
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create 8 particles that spread out from the cell
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'vanish-particle';
                
                // Calculate direction for particle spread
                const angle = (i / 8) * 2 * Math.PI;
                const distance = 50 + Math.random() * 30;
                const endX = centerX + Math.cos(angle) * distance;
                const endY = centerY + Math.sin(angle) * distance;
                
                particle.style.cssText = `
                    position: fixed;
                    width: 4px;
                    height: 4px;
                    background: #e74c3c;
                    left: ${centerX}px;
                    top: ${centerY}px;
                    z-index: 1000;
                    border-radius: 50%;
                    pointer-events: none;
                    animation: vanish-particle 1.5s ease-out forwards;
                    --end-x: ${endX}px;
                    --end-y: ${endY}px;
                `;
                
                document.body.appendChild(particle);
                
                // Remove particle after animation
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 1500);
            }, i * 50);
        }
    }
    
    clearMoveTimer() {
        if (this.moveTimer) {
            clearInterval(this.moveTimer);
            this.moveTimer = null;
        }
        
        // Reset timer visual state
        if (this.timerContainer) this.timerContainer.classList.remove('warning');
        if (this.timerDisplay) this.timerDisplay.classList.remove('warning');
        if (this.timerFill) this.timerFill.classList.remove('warning');
    }
    
    clearAllTimers() {
        // Clear move timer
        this.clearMoveTimer();
        
        // Clear color change interval
        if (this.colorChangeInterval) {
            clearInterval(this.colorChangeInterval);
            this.colorChangeInterval = null;
        }
        
        // Clear color cycle timers for both cells
        this.colorCycleTimers.forEach(timer => {
            if (timer) {
                clearTimeout(timer);
            }
        });
        this.colorCycleTimers = [];
        
        // Clear individual color timers
        this.colorTimers.forEach(timer => {
            if (timer) clearTimeout(timer);
        });
        this.colorTimers = Array(9).fill(null);
        
        // Reset cycling state
        this.isCycling = false;
        this.currentCyclingCells = [];
        
        // Reset color protection
        this.colorProtectedCells = Array(9).fill(false);
        
        // Clean up any remaining firework effects
        this.cleanupFireworkEffects();
    }
    
    cleanupFireworkEffects() {
        // Remove any remaining firework elements
        const fireworkElements = document.querySelectorAll('.firework-burst, .firework-star, .firework-finale, .birthday-confetti, .birthday-balloon');
        fireworkElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Remove screen shake if it's still active
        document.body.style.animation = '';
        
        // Remove fireworks-active class from modal
        const modal = document.querySelector('.end-game-modal');
        if (modal) {
            modal.classList.remove('fireworks-active');
        }
    }
    
    handleColorEffect(index, cellElement) {
        const color = this.cellColors[index];
        
        switch (color) {
            case 'blue':
                this.placeShield(index, cellElement);
                break;
            case 'purple':
                this.swapWithRandomPiece(index, cellElement);
                break;
            // Red is handled separately in makeMove function
        }
        
        // Clear color timer for this cell
        if (this.colorTimers[index]) {
            clearTimeout(this.colorTimers[index]);
            this.colorTimers[index] = null;
        }
        
        // Remove color classes and reset color state
        this.colors.forEach(color => {
            cellElement.classList.remove(`color-${color}`);
        });
        this.cellColors[index] = 'white';
    }
    
    placeBombDirectly(index, cellElement) {
        // Place bomb icon directly instead of X/O on red cells
        this.board[index] = '💣'; // Use bomb emoji as the piece
        cellElement.textContent = '💣';
        cellElement.classList.add('bomb-active');
        
        // Set bomb properties with random timing
        const randomTurns = Math.random() < 0.5 ? 2 : 3;
        this.bombs[index] = {
            player: this.currentPlayer,
            turnsLeft: randomTurns // Will explode after random 2 or 3 turns
        };
        
        // Remove color classes
        const allColors = ['red', 'blue', 'purple', 'green', 'yellow'];
        allColors.forEach(color => {
            cellElement.classList.remove(`color-${color}`);
        });
        
        console.log(`💣 ${this.currentPlayer} placed a bomb directly at position ${index}! Explodes in ${randomTurns} turn(s)`);
    }
    
    checkBombExplosions() {
        const explodingBombs = [];
        
        for (let i = 0; i < 9; i++) {
            if (this.bombs[i]) {
                this.bombs[i].turnsLeft--;
                
                if (this.bombs[i].turnsLeft <= 0) {
                    explodingBombs.push(i);
                }
            }
        }
        
        // If bombs are exploding, track them and check for wins after all explosions complete
        if (explodingBombs.length > 0) {
            this.pendingExplosions = explodingBombs.length;
            explodingBombs.forEach(index => {
                this.explodeBomb(index);
            });
        }
    }
    
    explodeBomb(index) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        const bomb = this.bombs[index];
        
        // Set explosion flag for end game rule
        this.explosionHappenedThisTurn = true;
        
        console.log(`💥 Bomb explodes at position ${index}!`);
        
        // Explosion animation
        cell.classList.add('exploding');
        cell.classList.remove('bomb-active');
        
        setTimeout(() => {
            // Determine explosion pattern (horizontal or vertical line)
            const row = Math.floor(index / 3);
            const col = index % 3;
            const isHorizontal = Math.random() < 0.5;
            
            if (isHorizontal) {
                // Clear horizontal line (row)
                for (let c = 0; c < 3; c++) {
                    const targetIndex = row * 3 + c;
                    this.clearCell(targetIndex);
                }
                console.log(`💥 Horizontal explosion cleared row ${row}!`);
            } else {
                // Clear vertical line (column)
                for (let r = 0; r < 3; r++) {
                    const targetIndex = r * 3 + col;
                    this.clearCell(targetIndex);
                }
                console.log(`💥 Vertical explosion cleared column ${col}!`);
            }
            
            cell.classList.remove('exploding');
            this.bombs[index] = null;
            
            // Decrement pending explosions counter
            if (this.pendingExplosions) {
                this.pendingExplosions--;
                
                // Check for win condition only after all explosions are complete
                if (this.pendingExplosions === 0) {
                    console.log(`💥 All explosions completed, checking for wins...`);
                    this.checkResultAfterExplosion();
                }
            }
        }, 600);
    }
    
    checkResultAfterExplosion() {
        // Check for win condition after explosion clears cells
        let roundWon = false;
        let winningCells = [];
        
        for (let i = 0; i < this.winningConditions.length; i++) {
            const [a, b, c] = this.winningConditions[i];
            // Only check for X and O wins, not bomb emojis
            if (this.board[a] && 
                (this.board[a] === 'X' || this.board[a] === 'O') &&
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                roundWon = true;
                winningCells = [a, b, c];
                break;
            }
        }
        
        if (roundWon) {
            // Win detected after explosion - end the game
            const winner = this.board[winningCells[0]];
            this.highlightWinningCells(winningCells);
            this.gameActive = false;
            this.gameBoardElement.classList.add('game-over');
            this.clearMoveTimer();
            
            if (winner === 'X') {
                this.addVanishEffect('O'); // Computer's pieces vanish
                this.showWinningAnimation();
                this.loseDrawCount = 0; // Reset counter on win
                this.logger.endGame('win', '3-in-a-row after explosion');
                this.showBirthdayCelebration('You Win!', 'Happy Birthday Mish! 🎂 Explosive 3-in-a-row victory!');
            } else {
                this.addVanishEffect('X'); // Player's pieces vanish
                this.showLosingAnimation();
                this.loseDrawCount++;
                this.logger.endGame('lose', 'Computer won after explosion');
                this.checkHiddenRule('lose', 'You Lose!', 'Computer won after the explosion!', '😢');
            }
            return;
        }
        
        // Check for draw after explosion
        const emptyCountAfterExplosion = this.board.filter(cell => cell === '').length;
        console.log(`🔍 Draw check after explosion: Empty cells: ${emptyCountAfterExplosion}, Board:`, this.board);
        
        if (!this.board.includes('')) {
            console.log(`🤝 Draw detected after explosion! Board state:`, this.board);
            this.gameActive = false;
            this.gameBoardElement.classList.add('game-over');
            this.clearMoveTimer();
            this.loseDrawCount++;
            this.logger.endGame('draw', 'Board full after explosion');
            this.checkHiddenRule('draw', "It's a Draw!", 'The board is full after the explosion!', '🤝');
            return;
        }
        
        // No win or draw, continue the game
        // Reset the explosion flag since we've now checked for wins after the explosion
        this.explosionHappenedThisTurn = false;
    }
    
    clearCell(index) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        
        // Check if cell element exists
        if (!cell) {
            console.warn(`⚠️ Cell element not found for index ${index}`);
            return;
        }
        
        // Check if cell is shielded
        if (this.shields[index]) {
            console.log(`🪵 Cell ${index} shield absorbs the explosion and shatters!`);
            
            // Add glass break effect
            cell.classList.add('shield-breaking', 'glass-shards');
            
            // Remove shield after it breaks
            this.shields[index] = false;
            
            // Remove shield visual effects after animation
            setTimeout(() => {
                cell.classList.remove('shielded', 'shield-breaking', 'glass-shards');
            }, 1000);
            
            return; // Shield protects the cell from being cleared this time, but breaks
        }
        
        if (this.board[index] !== '') {
            this.board[index] = '';
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'bomb-active', 'shielded');
            
            // Remove shield if it was cleared
            this.shields[index] = false;
            
            // Clear any bomb data
            this.bombs[index] = null;
            
            // Add cleared cell back to the queue for color cycling
            if (!this.cellQueue.includes(index)) {
                this.cellQueue.push(index);
            }
            
            console.log(`🧹 Cleared cell ${index}`);
        }
    }
    
    resetGame(startGame = true) {
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.isComputerTurn = false;
        this.turnCount = 0;
        
        // Reset end game rule flags
        this.swapHappenedThisTurn = false;
        this.explosionHappenedThisTurn = false;
        this.pendingExplosions = 0;
        
        // Clear all timers
        this.clearAllTimers();
        
        // Reset 3x3 specific properties
        this.board = Array(9).fill('');
        this.cellColors = Array(9).fill('white');
        this.bombs = Array(9).fill(null);
        this.shields = Array(9).fill(false);
        this.colorProtectedCells = Array(9).fill(false);
        this.gameStartTime = Date.now();
        
        // Clear board visually
        document.querySelectorAll('.cell').forEach((cell, index) => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'winner', 'bomb-active', 'shielded', 'vanish');
            const allColors = ['red', 'blue', 'purple', 'green', 'yellow'];
            allColors.forEach(color => {
                cell.classList.remove(`color-${color}`);
            });
        });
        
        this.gameBoardElement.classList.remove('game-over');
        
        // Only start game systems if requested
        if (startGame) {
            this.updateStatus('You are X, Computer is O. Your turn! (BLITZ - 3s)');
            this.startProgressiveColorSystem();
            this.startMoveTimer();
        }
    }
    showEndGameOverlay(type, title, message, icon) {
        // Prevent duplicate overlays
        if (this.gameEndOverlay.classList.contains('show')) {
            console.log('🎮 End game overlay already showing, skipping duplicate');
            return;
        }
        
        // Set content
        this.endGameTitle.textContent = title;
        this.endGameMessage.textContent = message;
        this.endGameIcon.textContent = icon;
        
        // Set modal style based on result
        const modal = this.gameEndOverlay.querySelector('.end-game-modal');
        modal.classList.remove('win', 'lose', 'draw');
        modal.classList.add(type);
        
        // Show overlay with animation
        this.gameEndOverlay.style.display = 'flex';
        
        // Delay to ensure display is set before animation
        setTimeout(() => {
            this.gameEndOverlay.classList.add('show');
            this.createEndGameParticles(type);
            
            // Auto return to menu after 15 seconds for lose/draw
            if (type === 'lose' || type === 'draw') {
                this.startAutoReturnCountdown(15);
            }
        }, 50);
    }
    
    hideEndGameOverlay() {
        // Clear auto return countdown if active
        if (this.autoReturnInterval) {
            clearInterval(this.autoReturnInterval);
            this.autoReturnInterval = null;
        }
        
        // Remove countdown element
        const countdown = document.querySelector('.auto-return-countdown');
        if (countdown && countdown.parentNode) {
            countdown.parentNode.removeChild(countdown);
        }
        
        this.gameEndOverlay.classList.remove('show');
        
        // Hide after animation completes
        setTimeout(() => {
            this.gameEndOverlay.style.display = 'none';
        }, 600);
    }
    
    createEndGameParticles(type) {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'end-game-particles';
        this.gameEndOverlay.appendChild(particleContainer);
        
        const colors = {
            win: ['#ffd700', '#ffed4e', '#4CAF50', '#45a049'],
            lose: ['#ff6b6b', '#ff4757', '#f44336', '#d32f2f'],
            draw: ['#ff9800', '#ffa726', '#f57c00', '#ffeb3b']
        };
        
        const particleColors = colors[type] || colors.win;
        
        // Create 20 particles
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.background = particleColors[Math.floor(Math.random() * particleColors.length)];
                particle.style.animationDelay = Math.random() * 2 + 's';
                
                particleContainer.appendChild(particle);
                
                // Remove particle after animation
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 3000);
            }, i * 100);
        }
        
        // Remove particle container after all particles are done
        setTimeout(() => {
            if (particleContainer.parentNode) {
                particleContainer.parentNode.removeChild(particleContainer);
            }
        }, 5000);
    }
    
    tryAgain() {
        // Hide overlay first
        this.hideEndGameOverlay();
        
        // Reset and start new game after overlay animation
        setTimeout(() => {
            this.resetGame();
        }, 300);
    }
    
    checkHiddenRule(type, title, message, icon) {
        if (this.loseDrawCount >= 3) {
            // Trigger "anyway" animation followed by birthday celebration
            this.showAnywayAnimation(() => {
                this.loseDrawCount = 0; // Reset counter
                this.showBirthdayCelebration('HeHe 😏...', 'Happy Birthday Mish! 🎂');
            });
        } else {
            // Show normal end game overlay
            this.showEndGameOverlay(type, title, message, icon);
        }
    }
    
    showAnywayAnimation(callback) {
        // Create "anyway" overlay
        const anywayOverlay = document.createElement('div');
        anywayOverlay.className = 'anyway-overlay';
        anywayOverlay.innerHTML = `
            <div class="anyway-content">
                <div class="anyway-text">LOL...</div>
            </div>
        `;
        
        document.body.appendChild(anywayOverlay);
        
        // Show with animation
        setTimeout(() => {
            anywayOverlay.classList.add('show');
        }, 50);
        
        // Hide after 2 seconds and trigger callback
        setTimeout(() => {
            anywayOverlay.classList.remove('show');
            setTimeout(() => {
                if (anywayOverlay.parentNode) {
                    anywayOverlay.parentNode.removeChild(anywayOverlay);
                }
                callback();
            }, 600);
        }, 2000);
    }
    
    showBirthdayCelebration(title, message) {
        // Prevent duplicate celebrations
        if (this.gameEndOverlay.classList.contains('show')) {
            console.log('🎂 Birthday celebration already showing, skipping duplicate');
            return;
        }
        
        // Set content for birthday celebration
        this.endGameTitle.textContent = title;
        this.endGameMessage.textContent = message;
        this.endGameIcon.textContent = '🎂';
        
        // Set birthday style
        const modal = this.gameEndOverlay.querySelector('.end-game-modal');
        modal.classList.remove('win', 'lose', 'draw');
        modal.classList.add('birthday');
        
        // Show overlay with animation
        this.gameEndOverlay.style.display = 'flex';
        
        // Delay to ensure display is set before animation
        setTimeout(() => {
            this.gameEndOverlay.classList.add('show');
            this.createBirthdayEffects();
            
            // Add fireworks class to modal for enhanced glow
            modal.classList.add('fireworks-active');
            
            // Remove fireworks class after celebration
            setTimeout(() => {
                modal.classList.remove('fireworks-active');
            }, 10000);
            
            // Auto return to menu after 15 seconds with countdown
            this.startAutoReturnCountdown(15);
        }, 50);
    }
    
    startAutoReturnCountdown(seconds) {
        let timeLeft = seconds;
        
        // Create countdown element
        const countdown = document.createElement('div');
        countdown.className = 'auto-return-countdown';
        countdown.textContent = `Returning to menu in ${timeLeft}s...`;
        
        const modal = this.gameEndOverlay.querySelector('.end-game-modal');
        modal.appendChild(countdown);
        
        // Update countdown every second
        const countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                countdown.textContent = `Returning to menu in ${timeLeft}s...`;
            } else {
                clearInterval(countdownInterval);
                this.autoReturnToMenu();
            }
        }, 1000);
        
        // Store interval for cleanup
        this.autoReturnInterval = countdownInterval;
    }
    
    autoReturnToMenu() {
        // Clear countdown interval if it exists
        if (this.autoReturnInterval) {
            clearInterval(this.autoReturnInterval);
            this.autoReturnInterval = null;
        }
        
        // Hide overlay first
        this.hideEndGameOverlay();
        
        // Return to menu after overlay animation
        setTimeout(() => {
            this.backToMenu();
        }, 600);
    }
    
    createBirthdayEffects() {
        // Create birthday-specific effects
        this.createBirthdayConfetti();
        this.createBirthdayCandles();
        this.createBirthdayBalloons();
        this.createFireworks();
    }
    
    createBirthdayConfetti() {
        const colors = ['#ff69b4', '#ffd700', '#ff6347', '#98fb98', '#87ceeb', '#dda0dd'];
        
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'birthday-confetti';
                confetti.style.cssText = `
                    position: fixed;
                    width: ${Math.random() * 10 + 5}px;
                    height: ${Math.random() * 10 + 5}px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    left: ${Math.random() * 100}vw;
                    top: -20px;
                    z-index: 1001;
                    border-radius: 50%;
                    animation: birthday-confetti-fall ${Math.random() * 3 + 2}s linear forwards;
                    transform: rotate(${Math.random() * 360}deg);
                `;
                
                document.body.appendChild(confetti);
                
                // Remove confetti after animation
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 5000);
            }, i * 30);
        }
    }
    
    createBirthdayCandles() {
        const modal = this.gameEndOverlay.querySelector('.end-game-modal');
        const candleContainer = document.createElement('div');
        candleContainer.className = 'birthday-candles';
        
        // Create 5 candles
        for (let i = 0; i < 5; i++) {
            const candle = document.createElement('div');
            candle.className = 'birthday-candle';
            candle.innerHTML = '🕯️';
            candle.style.animationDelay = `${i * 0.2}s`;
            candleContainer.appendChild(candle);
        }
        
        modal.appendChild(candleContainer);
        
        // Remove candles after celebration
        setTimeout(() => {
            if (candleContainer.parentNode) {
                candleContainer.parentNode.removeChild(candleContainer);
            }
        }, 8000);
    }
    
    createBirthdayBalloons() {
        const balloonColors = ['🎈', '🎈', '🎈', '🎈', '🎈'];
        const balloonEmojis = ['🎈', '🎉', '🎊', '🎁', '🎂'];
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const balloon = document.createElement('div');
                balloon.className = 'birthday-balloon';
                balloon.textContent = balloonEmojis[Math.floor(Math.random() * balloonEmojis.length)];
                balloon.style.cssText = `
                    position: fixed;
                    font-size: 2rem;
                    left: ${Math.random() * 90 + 5}%;
                    bottom: -50px;
                    z-index: 1001;
                    animation: birthday-balloon-float ${Math.random() * 2 + 3}s ease-out forwards;
                    animation-delay: ${Math.random() * 1}s;
                `;
                
                document.body.appendChild(balloon);
                
                // Remove balloon after animation
                setTimeout(() => {
                    if (balloon.parentNode) {
                        balloon.parentNode.removeChild(balloon);
                    }
                }, 6000);
            }, i * 200);
        }
    }
    
    createFireworks() {
        // Create multiple firework bursts at different times and positions
        const fireworkColors = [
            ['#ff0040', '#ff4080', '#ff80c0'],  // Pink burst
            ['#0080ff', '#40a0ff', '#80c0ff'],  // Blue burst
            ['#ff8000', '#ffa040', '#ffc080'],  // Orange burst
            ['#8000ff', '#a040ff', '#c080ff'],  // Purple burst
            ['#00ff80', '#40ffa0', '#80ffc0'],  // Green burst
            ['#ffff00', '#ffff40', '#ffff80'],  // Yellow burst
            ['#ff0080', '#ff4080', '#ff80a0'],  // Magenta burst
            ['#00ffff', '#40ffff', '#80ffff']   // Cyan burst
        ];
        
        // Create 12 firework bursts over 8 seconds
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                this.createSingleFirework(fireworkColors[i % fireworkColors.length]);
            }, i * 600 + Math.random() * 400);
        }
        
        // Add twinkling stars throughout the celebration
        this.createTwinklingStars();
        
        // Grand finale at the end
        setTimeout(() => {
            this.createGrandFinale(fireworkColors);
        }, 7000);
    }
    
    createSingleFirework(colors) {
        // Random position for firework burst
        const x = Math.random() * 80 + 10; // 10% to 90% of screen width
        const y = Math.random() * 60 + 20; // 20% to 80% of screen height
        
        // Create firework container
        const firework = document.createElement('div');
        firework.className = 'firework-burst';
        firework.style.cssText = `
            position: fixed;
            left: ${x}%;
            top: ${y}%;
            z-index: 1002;
            pointer-events: none;
        `;
        
        document.body.appendChild(firework);
        
        // Create multiple particles for the burst (20-30 particles)
        const particleCount = Math.random() * 10 + 20;
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                this.createFireworkParticle(firework, colors, i, particleCount);
            }, i * 20);
        }
        
        // Create the initial flash
        this.createFireworkFlash(firework, colors[0]);
        
        // Remove firework container after animation
        setTimeout(() => {
            if (firework.parentNode) {
                firework.parentNode.removeChild(firework);
            }
        }, 3000);
    }
    
    createFireworkFlash(container, color) {
        const flash = document.createElement('div');
        flash.className = 'firework-flash';
        flash.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, ${color} 0%, transparent 70%);
            border-radius: 50%;
            left: -10px;
            top: -10px;
            animation: firework-flash 0.3s ease-out;
        `;
        
        container.appendChild(flash);
        
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 300);
    }
    
    createFireworkParticle(container, colors, index, totalParticles) {
        const particle = document.createElement('div');
        particle.className = 'firework-particle';
        
        // Calculate direction for particle spread (360 degrees)
        const angle = (index / totalParticles) * 2 * Math.PI;
        const velocity = Math.random() * 100 + 50; // Random velocity
        const size = Math.random() * 4 + 2; // Random size 2-6px
        
        // Calculate end position
        const endX = Math.cos(angle) * velocity;
        const endY = Math.sin(angle) * velocity;
        
        // Random color from the color set
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            left: -${size/2}px;
            top: -${size/2}px;
            box-shadow: 0 0 6px ${color};
            animation: firework-particle ${Math.random() * 1 + 1.5}s ease-out forwards;
            --end-x: ${endX}px;
            --end-y: ${endY}px;
        `;
        
        container.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 2500);
    }
    
    createTwinklingStars() {
        // Create 15 twinkling stars at random positions
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const star = document.createElement('div');
                star.className = 'firework-star';
                star.style.cssText = `
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    animation-delay: ${Math.random() * 2}s;
                    animation-duration: ${Math.random() * 1 + 1.5}s;
                `;
                
                document.body.appendChild(star);
                
                // Remove star after animation
                setTimeout(() => {
                    if (star.parentNode) {
                        star.parentNode.removeChild(star);
                    }
                }, 4000);
            }, i * 200);
        }
    }
    
    createGrandFinale(fireworkColors) {
        // Create finale background glow
        const finale = document.createElement('div');
        finale.className = 'firework-finale';
        document.body.appendChild(finale);
        
        // Add screen shake effect for dramatic impact
        document.body.style.animation = 'screen-shake 0.5s ease-in-out';
        
        // Create 6 simultaneous firework bursts for grand finale
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                this.createSingleFirework(fireworkColors[i % fireworkColors.length]);
            }, i * 100);
        }
        
        // Remove finale background after animation
        setTimeout(() => {
            if (finale.parentNode) {
                finale.parentNode.removeChild(finale);
            }
            // Remove screen shake
            document.body.style.animation = '';
        }, 3000);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
