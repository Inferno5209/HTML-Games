// Connect 4 Game JavaScript
class Connect4Game {
    constructor() {
        this.board = Array.from({ length: 6 }, () => Array(7).fill(""));
        this.currentPlayer = "red";
        this.gameOver = false;
        this.scores = { red: 0, yellow: 0 };
        this.winningCells = [];
        this.boardElement = document.getElementById("board");
        this.statusElement = document.getElementById("status");
        this.isMoving = false; // Prevent moves during animation
        this.cooldownActive = false; // Prevent spamming
        this.cooldownDuration = 500; // 0.5 seconds in milliseconds
        this.init();
    }

    init() {
        this.createBoard();
        this.updateStatus();
        this.updateScoreboard();
    }

    createBoard() {
        this.boardElement.innerHTML = "";
        
        // Create board cells
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener("click", (e) => this.handleCellClick(e));
                this.boardElement.appendChild(cell);
            }
        }
    }

    handleCellClick(event) {
        if (this.gameOver || this.isMoving || this.cooldownActive) return;
        
        const col = parseInt(event.target.dataset.col);
        this.makeMove(col);
    }

    async makeMove(col) {
        if (this.gameOver || this.isMoving || this.cooldownActive) return;

        // Find the lowest available row in the column
        let targetRow = -1;
        for (let row = 5; row >= 0; row--) {
            if (this.board[row][col] === "") {
                targetRow = row;
                break;
            }
        }

        if (targetRow === -1) return; // Column is full

        // Set moving state to prevent multiple moves
        this.isMoving = true;
        this.boardElement.classList.add("moving");
        this.updateStatusWithCooldown("Moving...");

        // Create falling chip animation
        await this.animateChipDrop(col, targetRow);

        // Update game state
        this.board[targetRow][col] = this.currentPlayer;
        this.placeChip(targetRow, col);

        // Check for winner
        if (this.checkWinner(targetRow, col)) {
            this.isMoving = false;
            this.boardElement.classList.remove("moving");
            this.handleWin();
            return;
        }

        // Check for tie
        if (this.isBoardFull()) {
            this.isMoving = false;
            this.boardElement.classList.remove("moving");
            this.handleTie();
            return;
        }

        // Switch players
        this.currentPlayer = this.currentPlayer === "red" ? "yellow" : "red";
        
        // Start cooldown period
        this.startCooldown();
    }

    startCooldown() {
        this.cooldownActive = true;
        this.isMoving = false;
        this.boardElement.classList.remove("moving");
        this.boardElement.classList.add("cooldown");
        
        let remainingTime = this.cooldownDuration / 1000; // Convert to seconds
        
        // Update status with countdown
        const countdownInterval = setInterval(() => {
            this.updateStatusWithCooldown(`⏰ Wait ${remainingTime}s before next move...`);
            remainingTime--;
            
            if (remainingTime < 0) {
                clearInterval(countdownInterval);
                this.cooldownActive = false;
                this.boardElement.classList.remove("cooldown");
                this.updateStatus();
            }
        }, 1000);
    }

    updateStatusWithCooldown(message) {
        this.statusElement.textContent = message;
    }

    async animateChipDrop(col, targetRow) {
        return new Promise((resolve) => {
            const boardRect = this.boardElement.getBoundingClientRect();
            const fallingChip = document.createElement("div");
            fallingChip.classList.add("falling-chip", this.currentPlayer);

            // Position the chip at the top of the column
            const startX = 15 + col * 68 + 30; // Center of column
            const startY = -60; // Start above the board
            const endY = 15 + targetRow * 68 + 30; // Target cell center

            fallingChip.style.position = "absolute";
            fallingChip.style.left = `${startX - 26}px`; // Center the chip
            fallingChip.style.top = `${startY}px`;
            fallingChip.style.setProperty('--start-y', `${startY}px`);
            fallingChip.style.setProperty('--end-y', `${endY}px`);

            // Calculate fall duration based on distance
            const fallDistance = endY - startY;
            const fallDuration = Math.max(0.3, Math.min(1.0, fallDistance / 400));
            fallingChip.style.setProperty('--fall-duration', `${fallDuration}s`);

            this.boardElement.parentElement.appendChild(fallingChip);

            // Start animation
            fallingChip.classList.add("falling-animation");

            // Remove falling chip after animation
            setTimeout(() => {
                fallingChip.remove();
                resolve();
            }, fallDuration * 1000);
        });
    }

    async animateAllPiecesFalling() {
        return new Promise((resolve) => {
            const allChips = this.boardElement.querySelectorAll('.chip');
            
            if (allChips.length === 0) {
                resolve();
                return;
            }

            // Disable all interactions during animation
            this.isMoving = true;
            this.boardElement.classList.add("falling-reset");
            this.updateStatusWithCooldown("🎢 Pieces falling...");
            
            // Disable buttons during animation
            const resetBtn = document.getElementById("reset-btn");
            const newGameBtn = document.getElementById("new-game-btn");
            resetBtn.disabled = true;
            newGameBtn.disabled = true;

            const boardRect = this.boardElement.getBoundingClientRect();
            const controlsElement = document.querySelector('.controls');
            const controlsRect = controlsElement.getBoundingClientRect();
            
            // Calculate the distance to fall (to the controls section)
            const fallDistance = controlsRect.top - boardRect.bottom + 100;

            let animationsCompleted = 0;
            const totalAnimations = allChips.length;

            // Play falling sound effect
            this.playFallingSound();

            allChips.forEach((chip, index) => {
                // Add some randomness to timing only
                const randomDelay = Math.random() * 300; // 0-300ms random delay
                
                setTimeout(() => {
                    const chipRect = chip.getBoundingClientRect();
                    
                    // Create a falling chip that will animate outside the board
                    const fallingChip = chip.cloneNode(true);
                    fallingChip.style.position = 'fixed';
                    fallingChip.style.left = `${chipRect.left}px`;
                    fallingChip.style.top = `${chipRect.top}px`;
                    fallingChip.style.zIndex = '1000';
                    fallingChip.style.pointerEvents = 'none';
                    fallingChip.style.transition = 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    
                    document.body.appendChild(fallingChip);
                    
                    // Hide the original chip
                    chip.style.opacity = '0';
                    
                    // Animate the falling straight down
                    requestAnimationFrame(() => {
                        fallingChip.style.transform = `translateY(${fallDistance}px)`;
                        fallingChip.style.opacity = '0';
                    });
                    
                    // Clean up after animation
                    setTimeout(() => {
                        fallingChip.remove();
                        animationsCompleted++;
                        
                        if (animationsCompleted === totalAnimations) {
                            this.boardElement.classList.remove("falling-reset");
                            resetBtn.disabled = false;
                            newGameBtn.disabled = false;
                            resolve();
                        }
                    }, 1200);
                    
                }, randomDelay);
            });
            
            // If no chips to animate, resolve immediately
            if (totalAnimations === 0) {
                this.boardElement.classList.remove("falling-reset");
                resetBtn.disabled = false;
                newGameBtn.disabled = false;
                resolve();
            }
        });
    }

    placeChip(row, col) {
        const cellIndex = row * 7 + col;
        const cell = this.boardElement.children[cellIndex];
        cell.classList.add("filled");

        const chip = document.createElement("div");
        chip.classList.add("chip", this.currentPlayer, "bounce");
        cell.appendChild(chip);

        // Add sound effect (if audio context is available)
        this.playDropSound();
    }

    playDropSound() {
        // Simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio context not available, skip sound
        }
    }

    playFallingSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a cascading sound effect for multiple pieces falling
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    // Descending tones to simulate falling
                    const baseFreq = 600 - (i * 80);
                    oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, audioContext.currentTime + 0.3);
                    
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                }, i * 100);
            }
        } catch (e) {
            // Audio context not available, skip sound
        }
    }

    checkWinner(row, col) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1]   // diagonal /
        ];

        for (const [dx, dy] of directions) {
            const cells = this.getConnectedCells(row, col, dx, dy);
            if (cells.length >= 4) {
                this.winningCells = cells;
                return true;
            }
        }
        return false;
    }

    getConnectedCells(row, col, dx, dy) {
        const color = this.board[row][col];
        const cells = [[row, col]];

        // Check in positive direction
        let r = row + dx, c = col + dy;
        while (r >= 0 && r < 6 && c >= 0 && c < 7 && this.board[r][c] === color) {
            cells.push([r, c]);
            r += dx;
            c += dy;
        }

        // Check in negative direction
        r = row - dx;
        c = col - dy;
        while (r >= 0 && r < 6 && c >= 0 && c < 7 && this.board[r][c] === color) {
            cells.unshift([r, c]);
            r -= dx;
            c -= dy;
        }

        return cells;
    }

    handleWin() {
        this.gameOver = true;
        this.scores[this.currentPlayer]++;
        this.updateScoreboard();
        this.highlightWinningCells();
        this.statusElement.textContent = `🎉 Player ${this.currentPlayer.toUpperCase()} Wins! 🎉`;
        this.playWinSound();
    }

    handleTie() {
        this.gameOver = true;
        this.statusElement.textContent = "🤝 It's a Tie! 🤝";
    }

    highlightWinningCells() {
        this.winningCells.forEach(([row, col]) => {
            const cellIndex = row * 7 + col;
            const cell = this.boardElement.children[cellIndex];
            cell.classList.add("winner-highlight");
        });
    }

    playWinSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C octave
            
            notes.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                }, index * 100);
            });
        } catch (e) {
            // Audio context not available, skip sound
        }
    }

    isBoardFull() {
        return this.board[0].every(cell => cell !== "");
    }

    updateStatus() {
        if (!this.gameOver) {
            this.statusElement.textContent = `Player ${this.currentPlayer.toUpperCase()}'s Turn`;
        }
    }

    updateScoreboard() {
        document.getElementById("red-score").textContent = this.scores.red;
        document.getElementById("yellow-score").textContent = this.scores.yellow;
        
        // Highlight active player
        document.querySelectorAll(".player-score").forEach(score => {
            score.classList.remove("active");
        });
        
        if (!this.gameOver) {
            document.getElementById(`${this.currentPlayer}-player`).classList.add("active");
        }
    }

    async resetGame() {
        // Animate all pieces falling down before reset
        await this.animateAllPiecesFalling();
        
        this.board = Array.from({ length: 6 }, () => Array(7).fill(""));
        this.currentPlayer = "red";
        this.gameOver = false;
        this.winningCells = [];
        this.isMoving = false;
        this.cooldownActive = false;
        
        // Recreate board
        this.createBoard();
        this.updateStatus();
        this.updateScoreboard();
    }

    async newGame() {
        // Animate all pieces falling down before new game
        await this.animateAllPiecesFalling();
        
        this.scores = { red: 0, yellow: 0 };
        this.isMoving = false;
        this.cooldownActive = false;
        
        // Reset the board without animation since we already animated
        this.board = Array.from({ length: 6 }, () => Array(7).fill(""));
        this.currentPlayer = "red";
        this.gameOver = false;
        this.winningCells = [];
        
        // Recreate board
        this.createBoard();
        this.updateStatus();
        this.updateScoreboard();
    }
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    const game = new Connect4Game();
    
    // Add event listeners for buttons
    document.getElementById("reset-btn").addEventListener("click", () => {
        if (!game.isMoving) game.resetGame();
    });
    document.getElementById("new-game-btn").addEventListener("click", () => {
        if (!game.isMoving) game.newGame();
    });
    
    // Add keyboard support
    document.addEventListener("keydown", (e) => {
        if (e.key >= "1" && e.key <= "7") {
            const col = parseInt(e.key) - 1;
            if (!game.gameOver && !game.isMoving && !game.cooldownActive) {
                game.makeMove(col);
            }
        } else if (e.key === "r" || e.key === "R") {
            game.resetGame();
        }
    });
});
