document.addEventListener('DOMContentLoaded', () => {
    const ultimateBoard = document.getElementById('ultimate-board');
    const currentPlayerEl = document.getElementById('current-player');
    const resetButton = document.getElementById('reset-game');

    // Game state
    let currentPlayer = 'X';
    let nextBoardIndex = null; // Which board to play next (null means any board)
    let gameOver = false;

    // Track the state of small boards (null = not won yet, 'X' or 'O' = won by that player, 'tie' = full with no winner)
    const boardWinners = Array(9).fill(null);
    
    // Track the state of all small cells
    const boardStates = Array(9).fill().map(() => Array(9).fill(null));

    // Initialize the game board
    function initializeBoard() {
        ultimateBoard.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const largeCell = document.createElement('div');
            largeCell.classList.add('large-cell');
            largeCell.dataset.index = i;
            
            for (let j = 0; j < 9; j++) {
                const smallCell = document.createElement('div');
                smallCell.classList.add('small-cell');
                smallCell.dataset.largeIndex = i;
                smallCell.dataset.smallIndex = j;
                
                smallCell.addEventListener('click', () => handleCellClick(i, j));
                largeCell.appendChild(smallCell);
            }
            
            ultimateBoard.appendChild(largeCell);
        }
        
        updatePlayableCells();
    }

    // Check if there's a winner in a board (works for both small boards and the large board)
    function checkWinner(board) {
        // Winning combinations (rows, columns, diagonals)
        const winPatterns = [
            { pattern: [0, 1, 2], type: 'horizontal' }, // rows
            { pattern: [3, 4, 5], type: 'horizontal' },
            { pattern: [6, 7, 8], type: 'horizontal' },
            { pattern: [0, 3, 6], type: 'vertical' }, // columns
            { pattern: [1, 4, 7], type: 'vertical' },
            { pattern: [2, 5, 8], type: 'vertical' },
            { pattern: [0, 4, 8], type: 'diagonal' }, // diagonal
            { pattern: [2, 4, 6], type: 'reverse-diagonal' } // reverse diagonal
        ];
        
        for (const { pattern, type } of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c] && board[a] !== 'tie') {
                return { winner: board[a], pattern: pattern, type: type };
            }
        }
        
        return null;
    }

    // Handle cell click
    function handleCellClick(largeIndex, smallIndex) {
        // If game is over or cell is already played, do nothing
        if (gameOver || boardStates[largeIndex][smallIndex] !== null) {
            return;
        }
        
        // Check if we can play in this board
        if (nextBoardIndex !== null && nextBoardIndex !== largeIndex) {
            return;
        }
        
        // If the board is already won, do nothing
        if (boardWinners[largeIndex] !== null) {
            return;
        }
        
        // Make the move
        boardStates[largeIndex][smallIndex] = currentPlayer;
        
        // Update UI
        const smallCell = document.querySelector(`[data-large-index="${largeIndex}"][data-small-index="${smallIndex}"]`);
        smallCell.textContent = currentPlayer;
        smallCell.classList.add(currentPlayer.toLowerCase());
        
        // Check if the small board is won
        const smallBoardResult = checkWinner(boardStates[largeIndex]);
        if (smallBoardResult) {
            const { winner, pattern, type } = smallBoardResult;
            boardWinners[largeIndex] = winner;
            const largeCell = document.querySelector(`[data-index="${largeIndex}"]`);
            largeCell.classList.add(`won-${winner.toLowerCase()}`);
            largeCell.dataset.winner = winner;
            
            // Mark the winning cells in the small board
            pattern.forEach(index => {
                const winningCell = document.querySelector(`[data-large-index="${largeIndex}"][data-small-index="${index}"]`);
                winningCell.classList.add('winning-cell');
                
                // Set the appropriate data attribute based on the winning pattern type
                if (type === 'vertical') {
                    winningCell.dataset.vertical = 'true';
                } else if (type === 'diagonal') {
                    winningCell.dataset.diagonal = 'true';
                } else if (type === 'reverse-diagonal') {
                    winningCell.dataset.reverseDiagonal = 'true';
                }
            });
            
            // Check if the large board is won
            const largeBoardResult = checkWinner(boardWinners);
            if (largeBoardResult) {
                const { winner, pattern, type } = largeBoardResult;
                gameOver = true;
                document.querySelector('.game-status').textContent = `Player ${winner} wins the game!`;
                
                // Mark the winning cells in the large board
                pattern.forEach(index => {
                    const winningCell = document.querySelector(`[data-index="${index}"]`);
                    winningCell.classList.add('winning-cell');
                    
                    // Set the appropriate data attribute based on the winning pattern type
                    if (type === 'vertical') {
                        winningCell.dataset.vertical = 'true';
                    } else if (type === 'diagonal') {
                        winningCell.dataset.diagonal = 'true';
                    } else if (type === 'reverse-diagonal') {
                        winningCell.dataset.reverseDiagonal = 'true';
                    }
                });
                
                return;
            }
            
            // Check if the game is a tie
            if (boardWinners.filter(winner => winner !== null).length === 9) {
                gameOver = true;
                document.querySelector('.game-status').textContent = 'Game ends in a tie!';
                return;
            }
        } else if (!boardStates[largeIndex].includes(null)) {
            // Board is full but not won (tie)
            boardWinners[largeIndex] = 'tie';
        }
        
        // Determine the next board to play in
        const nextSmallBoardIndex = smallIndex;
        
        // If the next board is already won or full, player can go to any board
        if (boardWinners[nextSmallBoardIndex] !== null) {
            nextBoardIndex = null;
        } else {
            nextBoardIndex = nextSmallBoardIndex;
        }
        
        // Switch players
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        currentPlayerEl.textContent = currentPlayer;
        document.querySelector('.game-status').textContent = `Player ${currentPlayer}'s turn`;
        
        // Update playable cells
        updatePlayableCells();
    }

    // Update which cells are playable based on the current game state
    function updatePlayableCells() {
        // Remove previous playable indicators
        document.querySelectorAll('.small-cell.playable').forEach(cell => {
            cell.classList.remove('playable');
        });
        
        if (gameOver) return;
        
        if (nextBoardIndex === null) {
            // Can play in any non-won board
            for (let i = 0; i < 9; i++) {
                if (boardWinners[i] === null) {
                    document.querySelectorAll(`[data-large-index="${i}"]`).forEach(cell => {
                        if (boardStates[i][cell.dataset.smallIndex] === null) {
                            cell.classList.add('playable');
                        }
                    });
                }
            }
        } else {
            // Can only play in the specified board
            document.querySelectorAll(`[data-large-index="${nextBoardIndex}"]`).forEach(cell => {
                if (boardStates[nextBoardIndex][cell.dataset.smallIndex] === null) {
                    cell.classList.add('playable');
                }
            });
        }
    }

    // Reset the game
    function resetGame() {
        currentPlayer = 'X';
        nextBoardIndex = null;
        gameOver = false;
        boardWinners.fill(null);
        for (let i = 0; i < 9; i++) {
            boardStates[i].fill(null);
        }
        currentPlayerEl.textContent = currentPlayer;
        document.querySelector('.game-status').textContent = `Player ${currentPlayer}'s turn`;
        
        // Reset UI
        document.querySelectorAll('.large-cell').forEach(cell => {
            cell.classList.remove('won-x', 'won-o', 'winning-cell');
            delete cell.dataset.winner;
            delete cell.dataset.vertical;
            delete cell.dataset.diagonal;
            delete cell.dataset.reverseDiagonal;
        });
        
        document.querySelectorAll('.small-cell').forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'playable', 'winning-cell');
            delete cell.dataset.vertical;
            delete cell.dataset.diagonal;
            delete cell.dataset.reverseDiagonal;
        });
        
        updatePlayableCells();
    }

    // Event listener for reset button
    resetButton.addEventListener('click', resetGame);

    // Initialize the game
    initializeBoard();
}); 