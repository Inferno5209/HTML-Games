// Ultimate Tic Tac Toe Game Logic
class UltimateTicTacToe {
    constructor() {
        this.currentPlayer = 'X';
        this.activeBoard = null; // null means can play anywhere
        this.miniBoards = Array(9).fill(null).map(() => Array(9).fill(null));
        this.miniWinners = Array(9).fill(null);
        this.gameOver = false;
        this.scores = { X: 0, O: 0 };
        
        this.init();
    }

    init() {
        this.createBoard();
        this.createParticles();
        this.attachEventListeners();
        this.updateDisplay();
        this.loadScores();
    }

    createBoard() {
        const ultimateBoard = document.getElementById('ultimateBoard');
        ultimateBoard.innerHTML = '';

        for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
            const miniBoard = document.createElement('div');
            miniBoard.className = 'mini-board';
            miniBoard.dataset.board = boardIndex;

            for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.board = boardIndex;
                cell.dataset.cell = cellIndex;
                cell.addEventListener('click', () => this.handleCellClick(boardIndex, cellIndex));
                miniBoard.appendChild(cell);
            }

            ultimateBoard.appendChild(miniBoard);
        }

        this.highlightActiveBoards();
    }

    createParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 10}s`;
            particle.style.animationDuration = `${5 + Math.random() * 10}s`;
            particlesContainer.appendChild(particle);
        }
    }

    attachEventListeners() {
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
    }

    handleCellClick(boardIndex, cellIndex) {
        // Check if the game is over
        if (this.gameOver) {
            this.showStatus('Game over! Start a new game.');
            return;
        }

        // Check if this board is won
        if (this.miniWinners[boardIndex]) {
            this.showStatus('This mini-board is already won! Choose another.');
            return;
        }

        // Check if the cell is already taken
        if (this.miniBoards[boardIndex][cellIndex]) {
            this.showStatus('Cell already taken!');
            return;
        }

        // Check if this is a valid board to play on
        if (this.activeBoard !== null && this.activeBoard !== boardIndex) {
            this.showStatus(`You must play on the highlighted board!`);
            return;
        }

        // Make the move
        this.makeMove(boardIndex, cellIndex);
    }

    makeMove(boardIndex, cellIndex) {
        // Place the move
        this.miniBoards[boardIndex][cellIndex] = this.currentPlayer;
        
        // Update the UI
        const cell = document.querySelector(`[data-board="${boardIndex}"][data-cell="${cellIndex}"]`);
        cell.textContent = this.currentPlayer;
        cell.classList.add('taken', this.currentPlayer.toLowerCase());

        // Check if this mini-board is won
        if (this.checkMiniWin(boardIndex)) {
            this.miniWinners[boardIndex] = this.currentPlayer;
            this.highlightWonBoard(boardIndex);
            
            // Check if the game is won
            if (this.checkUltimateWin()) {
                this.endGame(this.currentPlayer);
                return;
            }
        }

        // Check for draw in mini-board
        if (this.isMiniDraw(boardIndex)) {
            this.miniWinners[boardIndex] = 'DRAW';
            this.highlightDrawBoard(boardIndex);
        }

        // Determine next active board
        this.activeBoard = cellIndex;
        
        // If the next board is won or drawn, allow playing anywhere
        if (this.miniWinners[this.activeBoard]) {
            this.activeBoard = null;
        }

        // Switch player
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        
        // Update display
        this.updateDisplay();
        this.highlightActiveBoards();
    }

    checkMiniWin(boardIndex) {
        const board = this.miniBoards[boardIndex];
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]              // Diagonals
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return board[a] && board[a] === board[b] && board[a] === board[c];
        });
    }

    isMiniDraw(boardIndex) {
        return this.miniBoards[boardIndex].every(cell => cell !== null);
    }

    checkUltimateWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]              // Diagonals
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return this.miniWinners[a] && 
                   this.miniWinners[a] !== 'DRAW' &&
                   this.miniWinners[a] === this.miniWinners[b] && 
                   this.miniWinners[a] === this.miniWinners[c];
        });
    }

    highlightWonBoard(boardIndex) {
        const miniBoard = document.querySelector(`.mini-board[data-board="${boardIndex}"]`);
        const winner = this.miniWinners[boardIndex];
        miniBoard.classList.add(`won-${winner.toLowerCase()}`, 'win-animation');
        miniBoard.dataset.winner = winner;
        
        // Disable the board
        miniBoard.classList.add('disabled');
    }

    highlightDrawBoard(boardIndex) {
        const miniBoard = document.querySelector(`.mini-board[data-board="${boardIndex}"]`);
        miniBoard.classList.add('disabled');
        miniBoard.style.opacity = '0.3';
    }

    highlightActiveBoards() {
        // Remove all active classes
        document.querySelectorAll('.mini-board').forEach(board => {
            board.classList.remove('active');
        });

        // If activeBoard is null, highlight all non-won boards
        if (this.activeBoard === null) {
            document.querySelectorAll('.mini-board').forEach(board => {
                const boardIndex = parseInt(board.dataset.board);
                if (!this.miniWinners[boardIndex]) {
                    board.classList.add('active');
                }
            });
        } else {
            // Highlight only the active board
            const activeBoard = document.querySelector(`.mini-board[data-board="${this.activeBoard}"]`);
            if (activeBoard && !this.miniWinners[this.activeBoard]) {
                activeBoard.classList.add('active');
            }
        }
    }

    updateDisplay() {
        const currentPlayerEl = document.getElementById('currentPlayer');
        currentPlayerEl.textContent = this.currentPlayer;
        currentPlayerEl.className = `current-player ${this.currentPlayer.toLowerCase()}`;

        if (this.activeBoard === null) {
            this.showStatus(`Player ${this.currentPlayer}'s turn - Play on any available board!`);
        } else {
            this.showStatus(`Player ${this.currentPlayer}'s turn - Play on the highlighted board!`);
        }
    }

    showStatus(message) {
        const statusEl = document.getElementById('gameStatus');
        statusEl.textContent = message;
    }

    endGame(winner) {
        this.gameOver = true;
        this.scores[winner]++;
        this.saveScores();
        this.updateScores();
        
        this.showStatus(`🎉 Player ${winner} wins the Ultimate Game! 🎉`);
        
        // Celebration effect
        this.celebrate();
    }

    celebrate() {
        // Add celebration particles
        const particlesContainer = document.getElementById('particles');
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'particle';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.top = '-10px';
            confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
            confetti.style.animation = `float ${1 + Math.random() * 2}s ease-out forwards`;
            particlesContainer.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    resetGame() {
        this.currentPlayer = 'X';
        this.activeBoard = null;
        this.miniBoards = Array(9).fill(null).map(() => Array(9).fill(null));
        this.miniWinners = Array(9).fill(null);
        this.gameOver = false;
        
        this.createBoard();
        this.updateDisplay();
        this.showStatus('Game reset! Make your move on any mini-board!');
    }

    newGame() {
        this.resetGame();
        this.scores = { X: 0, O: 0 };
        this.updateScores();
        this.saveScores();
        this.showStatus('New game started! Scores reset!');
    }

    updateScores() {
        document.getElementById('scoreX').textContent = this.scores.X;
        document.getElementById('scoreO').textContent = this.scores.O;
    }

    saveScores() {
        localStorage.setItem('ultimateTTTScores', JSON.stringify(this.scores));
    }

    loadScores() {
        const saved = localStorage.getItem('ultimateTTTScores');
        if (saved) {
            this.scores = JSON.parse(saved);
            this.updateScores();
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new UltimateTicTacToe();
});
