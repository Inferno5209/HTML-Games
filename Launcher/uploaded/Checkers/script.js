document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const status = document.getElementById('status');
    const capturedRed = document.getElementById('captured-red');
    const capturedBlack = document.getElementById('captured-black');
    const restartBtn = document.getElementById('restart-btn');
    const undoBtn = document.getElementById('undo-btn');
    const vsPlayerBtn = document.getElementById('vs-player');
    const vsAIBtn = document.getElementById('vs-ai');
    const movesList = document.getElementById('moves-list');

    // Game state
    let boardState = [];
    let currentPlayer = 'black'; // black goes first
    let selectedPiece = null;
    let validMoves = [];
    let jumpMoves = [];
    let multiJump = false;
    let multiJumpPiece = null;
    let capturedCount = { red: 0, black: 0 };
    let gameMode = 'player'; // player or ai
    let aiColor = 'red'; // AI plays as red
    let aiThinking = false;
    let moveHistory = [];
    let gameHistory = []; // For undo functionality
    let lastMoveSquares = []; // Track last move for highlighting

    // Switch game mode
    vsPlayerBtn.addEventListener('click', () => {
        if (gameMode !== 'player') {
            gameMode = 'player';
            vsPlayerBtn.classList.add('active');
            vsAIBtn.classList.remove('active');
            initBoard();
        }
    });

    vsAIBtn.addEventListener('click', () => {
        if (gameMode !== 'ai') {
            gameMode = 'ai';
            vsAIBtn.classList.add('active');
            vsPlayerBtn.classList.remove('active');
            initBoard();
        }
    });

    // Undo last move
    undoBtn.addEventListener('click', undoMove);

    function undoMove() {
        if (gameHistory.length === 0) return;
        
        // If in AI mode and it's AI's turn, need to undo two moves (player's and AI's)
        if (gameMode === 'ai' && currentPlayer === aiColor) {
            if (gameHistory.length >= 2) {
                // Undo AI's move first
                applyGameState(gameHistory.pop());
                // Then undo player's move
                applyGameState(gameHistory.pop());
            } else {
                // Just undo the single available move
                applyGameState(gameHistory.pop());
            }
        } else {
            // In player vs player mode, or it's player's turn in AI mode
            applyGameState(gameHistory.pop());
        }
        
        // Remove the last move(s) from move history
        if (moveHistory.length > 0) {
            moveHistory.pop();
            updateMoveHistoryDisplay();
        }
        
        // Disable undo button if no more moves to undo
        undoBtn.disabled = gameHistory.length === 0;
        
        // Clear last move highlights
        clearLastMoveHighlights();
    }

    function applyGameState(gameState) {
        // Clear the board
        board.innerHTML = '';
        
        // Restore game state
        boardState = JSON.parse(JSON.stringify(gameState.boardState));
        currentPlayer = gameState.currentPlayer;
        capturedCount = { ...gameState.capturedCount };
        
        // Update captured pieces display
        capturedRed.textContent = capturedCount.red;
        capturedBlack.textContent = capturedCount.black;
        
        // Reset other states
        selectedPiece = null;
        validMoves = [];
        jumpMoves = [];
        multiJump = false;
        multiJumpPiece = null;
        
        // Rebuild the board from boardState
        recreateBoardFromState();
        
        // Update status display
        status.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
        
        // Check for forced jumps
        checkForForcedJumps();
    }

    function recreateBoardFromState() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Add pieces according to the board state
                if (boardState[row][col]) {
                    const piece = document.createElement('div');
                    piece.classList.add('piece', boardState[row][col].color);
                    if (boardState[row][col].isKing) {
                        piece.classList.add('king');
                    }
                    piece.dataset.row = row;
                    piece.dataset.col = col;
                    square.appendChild(piece);
                }
                
                // Add event listener to the square
                square.addEventListener('click', handleSquareClick);
                
                board.appendChild(square);
            }
        }
    }

    // Save the current game state for undo
    function saveGameState() {
        // Create a deep copy of the board state
        const boardStateCopy = JSON.parse(JSON.stringify(boardState));
        
        gameHistory.push({
            boardState: boardStateCopy,
            currentPlayer: currentPlayer,
            capturedCount: { ...capturedCount }
        });
        
        // Enable undo button
        undoBtn.disabled = false;
    }

    // Record a move in the move history
    function recordMove(fromRow, fromCol, toRow, toCol, isJump, capturedPiece) {
        const pieceColor = boardState[toRow][toCol].color;
        const isKing = boardState[toRow][toCol].isKing;
        const moveNumber = moveHistory.length + 1;
        
        const fromSquareName = getSquareName(fromRow, fromCol);
        const toSquareName = getSquareName(toRow, toCol);
        
        let moveText = `${pieceColor.charAt(0).toUpperCase() + pieceColor.slice(1)} ${isKing ? 'K' : ''} ${fromSquareName} to ${toSquareName}`;
        
        if (isJump) {
            moveText += ` captures ${capturedPiece}`;
        }
        
        moveHistory.push({
            number: moveNumber,
            text: moveText,
            fromRow,
            fromCol,
            toRow,
            toCol
        });
        
        updateMoveHistoryDisplay();
    }

    // Update the move history display
    function updateMoveHistoryDisplay() {
        movesList.innerHTML = '';
        
        for (const move of moveHistory) {
            const moveEntry = document.createElement('div');
            moveEntry.classList.add('move-entry');
            
            const moveNumber = document.createElement('span');
            moveNumber.classList.add('move-number');
            moveNumber.textContent = `${move.number}.`;
            
            const moveText = document.createElement('span');
            moveText.textContent = move.text;
            
            moveEntry.appendChild(moveNumber);
            moveEntry.appendChild(moveText);
            movesList.appendChild(moveEntry);
        }
        
        // Scroll to the bottom to show the latest move
        movesList.scrollTop = movesList.scrollHeight;
    }

    // Convert row/col to checkers notation (e.g., A1, B2)
    function getSquareName(row, col) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        return `${letters[col]}${8 - row}`;
    }

    // Highlight the last move
    function highlightLastMove(fromRow, fromCol, toRow, toCol) {
        // Clear previous highlights
        clearLastMoveHighlights();
        
        // Add highlights to the from and to squares
        const fromSquare = getSquareElement(fromRow, fromCol);
        const toSquare = getSquareElement(toRow, toCol);
        
        if (fromSquare) fromSquare.classList.add('last-move');
        if (toSquare) toSquare.classList.add('last-move');
        
        // Remember these squares for later clearing
        lastMoveSquares = [fromSquare, toSquare];
    }

    // Clear last move highlights
    function clearLastMoveHighlights() {
        for (const square of lastMoveSquares) {
            if (square) square.classList.remove('last-move');
        }
        lastMoveSquares = [];
    }

    // Initialize the board
    function initBoard() {
        board.innerHTML = '';
        boardState = Array(8).fill().map(() => Array(8).fill(null));
        capturedCount = { red: 0, black: 0 };
        capturedRed.textContent = '0';
        capturedBlack.textContent = '0';
        currentPlayer = 'black';
        selectedPiece = null;
        validMoves = [];
        jumpMoves = [];
        multiJump = false;
        multiJumpPiece = null;
        aiThinking = false;
        moveHistory = [];
        gameHistory = [];
        lastMoveSquares = [];
        undoBtn.disabled = true;
        movesList.innerHTML = '';
        status.textContent = "Black's turn";

        // Create the squares
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Add pieces to the board
                if ((row + col) % 2 !== 0) { // Only on dark squares
                    if (row < 3) {
                        // Red pieces
                        createPiece(square, 'red', row, col);
                        boardState[row][col] = { color: 'red', isKing: false };
                    } else if (row > 4) {
                        // Black pieces
                        createPiece(square, 'black', row, col);
                        boardState[row][col] = { color: 'black', isKing: false };
                    }
                }
                
                // Add event listener to the square
                square.addEventListener('click', handleSquareClick);
                
                board.appendChild(square);
            }
        }

        // If playing against AI and AI is black, make AI move first
        if (gameMode === 'ai' && currentPlayer === aiColor) {
            setTimeout(makeAIMove, 750);
        }
    }

    // Create a piece and add it to the square
    function createPiece(square, color, row, col) {
        const piece = document.createElement('div');
        piece.classList.add('piece', color);
        piece.dataset.row = row;
        piece.dataset.col = col;
        square.appendChild(piece);
    }

    // Handle click on a square
    function handleSquareClick(event) {
        // Don't process clicks when AI is thinking
        if (aiThinking) return;
        
        // Don't process clicks for AI's pieces in AI mode
        if (gameMode === 'ai' && currentPlayer === aiColor) return;

        const square = event.target.classList.contains('square') 
            ? event.target 
            : event.target.parentElement;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        // If multi-jump is in progress, only allow the jumping piece to move
        if (multiJump && multiJumpPiece) {
            const [multiRow, multiCol] = multiJumpPiece;
            if (row !== multiRow || col !== multiCol) {
                // Check if this is a valid next jump
                const isValidJump = jumpMoves.some(move => 
                    move.toRow === row && move.toCol === col
                );

                if (isValidJump) {
                    // Make the jump
                    makeMove(multiRow, multiCol, row, col);
                }
                return;
            }
        }

        // If clicked on a piece
        if (boardState[row][col] && boardState[row][col].color === currentPlayer) {
            // Clear previous selection
            clearHighlights();
            
            // Select this piece
            selectedPiece = [row, col];
            square.querySelector('.piece').classList.add('highlight');
            
            // Calculate valid moves
            calculateValidMoves(row, col);
            
            // Show valid moves
            showValidMoves();
        } 
        // If clicked on an empty square and a piece is selected
        else if (selectedPiece && !boardState[row][col]) {
            const [selectedRow, selectedCol] = selectedPiece;
            
            // Check if this move is valid
            const isValidMove = validMoves.some(move => 
                move.toRow === row && move.toCol === col
            );
            
            if (isValidMove) {
                // Save game state before making the move (for undo)
                saveGameState();
                
                // Make the move
                makeMove(selectedRow, selectedCol, row, col);
            }
        }
    }

    // Calculate valid moves for a piece
    function calculateValidMoves(row, col) {
        validMoves = [];
        jumpMoves = [];
        
        const piece = boardState[row][col];
        if (!piece) return;
        
        // Direction of movement (based on color and king status)
        const directions = [];
        
        // Kings can move in all 4 diagonal directions
        if (piece.isKing) {
            directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
        } else {
            // Regular pieces can only move forward based on their color
            if (piece.color === 'black') {
                directions.push([-1, -1], [-1, 1]); // Black moves up
            } else {
                directions.push([1, -1], [1, 1]); // Red moves down
            }
        }
        
        // Check for jumps first
        for (const [dRow, dCol] of directions) {
            const intermediateRow = row + dRow;
            const intermediateCol = col + dCol;
            const jumpRow = row + dRow * 2;
            const jumpCol = col + dCol * 2;
            
            // Check if jump is valid
            if (
                jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && // Within board
                boardState[intermediateRow] && boardState[intermediateRow][intermediateCol] && // There's a piece to jump over
                boardState[intermediateRow][intermediateCol].color !== piece.color && // It's an opponent's piece
                !boardState[jumpRow][jumpCol] // Landing square is empty
            ) {
                jumpMoves.push({
                    toRow: jumpRow,
                    toCol: jumpCol,
                    jumpedRow: intermediateRow,
                    jumpedCol: intermediateCol
                });
            }
        }
        
        // If there are jump moves, those are the only valid moves
        if (jumpMoves.length > 0) {
            validMoves = [...jumpMoves];
            return;
        }
        
        // If no jumps, check for regular moves
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            // Check if move is valid
            if (
                newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && // Within board
                !boardState[newRow][newCol] // Square is empty
            ) {
                validMoves.push({
                    toRow: newRow,
                    toCol: newCol
                });
            }
        }
    }

    // Show valid moves on the board
    function showValidMoves() {
        for (const move of validMoves) {
            const square = getSquareElement(move.toRow, move.toCol);
            const indicator = document.createElement('div');
            indicator.classList.add('valid-move');
            square.appendChild(indicator);
        }
    }

    // Make a move on the board
    function makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = boardState[fromRow][fromCol];
        if (!piece) return;
        
        // Re-calculate valid moves to ensure jump detection is accurate
        calculateValidMoves(fromRow, fromCol);
        
        // Find if this is a jump move
        const jumpMove = jumpMoves.find(move => 
            move.toRow === toRow && move.toCol === toCol
        );
        
        let capturedPieceColor = null;
        
        // If it's a jump, remove the jumped piece
        if (jumpMove) {
            const jumpedRow = jumpMove.jumpedRow;
            const jumpedCol = jumpMove.jumpedCol;
            const jumpedPiece = boardState[jumpedRow][jumpedCol];
            
            if (!jumpedPiece) {
                console.error('Error: No piece found to jump at', jumpedRow, jumpedCol);
            } else {
                capturedPieceColor = jumpedPiece.color;
                
                // Remove the piece from the board state
                boardState[jumpedRow][jumpedCol] = null;
                
                // Remove the piece element from the DOM
                const jumpedSquare = getSquareElement(jumpedRow, jumpedCol);
                jumpedSquare.innerHTML = '';
                
                // Update captured count
                if (jumpedPiece.color === 'red') {
                    capturedCount.red++;
                    capturedRed.textContent = capturedCount.red;
                } else {
                    capturedCount.black++;
                    capturedBlack.textContent = capturedCount.black;
                }
            }
        }
        
        // Move the piece in the board state
        boardState[toRow][toCol] = piece;
        boardState[fromRow][fromCol] = null;
        
        // Update the piece element in the DOM
        const fromSquare = getSquareElement(fromRow, fromCol);
        const toSquare = getSquareElement(toRow, toCol);
        const pieceElement = fromSquare.querySelector('.piece');
        fromSquare.removeChild(pieceElement);
        pieceElement.dataset.row = toRow;
        pieceElement.dataset.col = toCol;
        toSquare.appendChild(pieceElement);
        
        // Record this move in history
        recordMove(
            fromRow, 
            fromCol, 
            toRow, 
            toCol, 
            !!jumpMove, 
            capturedPieceColor ? `${capturedPieceColor} piece` : null
        );
        
        // Highlight the move
        highlightLastMove(fromRow, fromCol, toRow, toCol);
        
        // Check if the piece becomes a king
        if (
            (piece.color === 'black' && toRow === 0) ||
            (piece.color === 'red' && toRow === 7)
        ) {
            piece.isKing = true;
            pieceElement.classList.add('king');
        }
        
        // Clear highlights
        clearHighlights();
        
        // Check for multiple jumps
        if (jumpMove) {
            // Calculate if there are additional jumps available
            calculateValidMoves(toRow, toCol);
            
            if (jumpMoves.length > 0) {
                // Continue with multi-jump
                multiJump = true;
                multiJumpPiece = [toRow, toCol];
                selectedPiece = [toRow, toCol];
                pieceElement.classList.add('highlight');
                pieceElement.classList.add('jumping-indicator');
                showValidMoves();

                // If it's AI's turn and in multi-jump, let AI continue after a delay
                if (gameMode === 'ai' && currentPlayer === aiColor) {
                    setTimeout(() => {
                        if (multiJump && currentPlayer === aiColor) {
                            continueAIJump();
                        }
                    }, 750);
                }
                return;
            }
        }
        
        // Reset multi-jump state
        multiJump = false;
        multiJumpPiece = null;
        
        // Switch player
        currentPlayer = currentPlayer === 'black' ? 'red' : 'black';
        status.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
        
        // Check for forced jumps in the next turn
        checkForForcedJumps();
        
        // Check for end of game
        checkGameEnd();

        // If it's AI's turn and the game is still going, make AI move
        if (gameMode === 'ai' && currentPlayer === aiColor && !checkIfGameEnded()) {
            setTimeout(makeAIMove, 750);
        }
    }

    // Continue AI's multi-jump
    function continueAIJump() {
        if (!multiJump || !multiJumpPiece) return;
        
        const [row, col] = multiJumpPiece;
        
        // Recalculate valid jumps to ensure we have the latest state
        calculateValidMoves(row, col);
        
        // Find a valid jump move
        if (jumpMoves.length > 0) {
            console.log(`AI continuing multi-jump from [${row},${col}] with ${jumpMoves.length} possible jumps`);
            
            // First, prioritize jumps that create kings
            let selectedMove = null;
            const kingRow = aiColor === 'red' ? 7 : 0;
            
            for (const move of jumpMoves) {
                if (move.toRow === kingRow) {
                    selectedMove = move;
                    console.log(`AI selected king-making jump to [${move.toRow},${move.toCol}]`);
                    break;
                }
            }
            
            // If no king-making jump found, pick a random jump
            if (!selectedMove) {
                const randomIndex = Math.floor(Math.random() * jumpMoves.length);
                selectedMove = jumpMoves[randomIndex];
                console.log(`AI selected random jump to [${selectedMove.toRow},${selectedMove.toCol}]`);
            }
            
            // Make the selected jump move
            makeMove(row, col, selectedMove.toRow, selectedMove.toCol);
        } else {
            console.error('Error: No valid jumps available in continueAIJump');
            // Force end of turn to avoid getting stuck
            multiJump = false;
            multiJumpPiece = null;
            currentPlayer = currentPlayer === 'black' ? 'red' : 'black';
            status.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
        }
    }

    // Check if the current player has any forced jumps
    function checkForForcedJumps() {
        let forcedJumps = [];
        let forcedPieces = [];
        
        // Reset prior calculations
        validMoves = [];
        jumpMoves = [];
        
        // Check each piece of the current player
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = boardState[row][col];
                if (piece && piece.color === currentPlayer) {
                    // Calculate valid moves for this piece
                    calculateValidMoves(row, col);
                    
                    // If there are jumps, add to forced jumps
                    if (jumpMoves.length > 0) {
                        forcedJumps.push(...jumpMoves);
                        forcedPieces.push([row, col]);
                    }
                }
            }
        }
        
        // If there are forced jumps, highlight those pieces
        if (forcedJumps.length > 0) {
            status.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} MUST jump`;
            
            // Highlight pieces that can jump, but only if it's not AI's turn
            if (!(gameMode === 'ai' && currentPlayer === aiColor)) {
                for (const [row, col] of forcedPieces) {
                    const square = getSquareElement(row, col);
                    if (square) {
                        const pieceElement = square.querySelector('.piece');
                        if (pieceElement) {
                            pieceElement.classList.add('jumping-indicator');
                        }
                    }
                }
            }
            
            return true;
        }
        
        return false;
    }

    // Check if the game has ended
    function checkGameEnd() {
        let blackPieces = 0;
        let redPieces = 0;
        let blackCanMove = false;
        let redCanMove = false;
        
        // Count pieces and check for possible moves
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = boardState[row][col];
                if (piece) {
                    if (piece.color === 'black') {
                        blackPieces++;
                        if (!blackCanMove) {
                            calculateValidMoves(row, col);
                            if (validMoves.length > 0) {
                                blackCanMove = true;
                            }
                        }
                    } else {
                        redPieces++;
                        if (!redCanMove) {
                            calculateValidMoves(row, col);
                            if (validMoves.length > 0) {
                                redCanMove = true;
                            }
                        }
                    }
                }
            }
        }
        
        // Game end conditions
        if (blackPieces === 0) {
            status.textContent = "Red wins! All black pieces captured.";
            disableBoard();
            return true;
        } else if (redPieces === 0) {
            status.textContent = "Black wins! All red pieces captured.";
            disableBoard();
            return true;
        } else if (currentPlayer === 'black' && !blackCanMove) {
            status.textContent = "Red wins! Black has no valid moves.";
            disableBoard();
            return true;
        } else if (currentPlayer === 'red' && !redCanMove) {
            status.textContent = "Black wins! Red has no valid moves.";
            disableBoard();
            return true;
        }
        
        return false;
    }

    // Helper function to check if the game has ended
    function checkIfGameEnded() {
        let blackPieces = 0;
        let redPieces = 0;
        let blackCanMove = false;
        let redCanMove = false;
        
        // Count pieces and check for possible moves
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = boardState[row][col];
                if (piece) {
                    if (piece.color === 'black') {
                        blackPieces++;
                        if (!blackCanMove) {
                            calculateValidMoves(row, col);
                            if (validMoves.length > 0) {
                                blackCanMove = true;
                            }
                        }
                    } else {
                        redPieces++;
                        if (!redCanMove) {
                            calculateValidMoves(row, col);
                            if (validMoves.length > 0) {
                                redCanMove = true;
                            }
                        }
                    }
                }
            }
        }
        
        return blackPieces === 0 || redPieces === 0 || 
               (currentPlayer === 'black' && !blackCanMove) || 
               (currentPlayer === 'red' && !redCanMove);
    }

    // Disable the board after game end
    function disableBoard() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            square.removeEventListener('click', handleSquareClick);
        });
    }

    // Clear highlights and indicators
    function clearHighlights() {
        // Clear piece highlights
        const highlightedPieces = document.querySelectorAll('.piece.highlight, .piece.jumping-indicator');
        highlightedPieces.forEach(piece => {
            piece.classList.remove('highlight', 'jumping-indicator');
        });
        
        // Clear move indicators
        const moveIndicators = document.querySelectorAll('.valid-move');
        moveIndicators.forEach(indicator => {
            indicator.parentElement.removeChild(indicator);
        });
        
        // Reset selection
        selectedPiece = null;
    }

    // Get the square element at a given position
    function getSquareElement(row, col) {
        return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
    }

    // Restart the game
    restartBtn.addEventListener('click', initBoard);

    // Make an AI move
    function makeAIMove() {
        if (currentPlayer !== aiColor) return;
        
        aiThinking = true;
        status.textContent = `${aiColor.charAt(0).toUpperCase() + aiColor.slice(1)} is thinking...`;
        
        setTimeout(() => {
            // Save game state before making the move (for undo)
            saveGameState();
            
            // Gather all pieces that can move
            let allPossibleMoves = [];
            let forcedPieces = [];
            
            // First, check for pieces that can jump
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const piece = boardState[row][col];
                    if (piece && piece.color === aiColor) {
                        // Clear previous calculations
                        validMoves = [];
                        jumpMoves = [];
                        
                        calculateValidMoves(row, col);
                        
                        if (jumpMoves.length > 0) {
                            console.log(`AI found jump at [${row},${col}] with ${jumpMoves.length} jumps available`);
                            forcedPieces.push({
                                row,
                                col,
                                moves: [...jumpMoves]
                            });
                        } else if (validMoves.length > 0) {
                            allPossibleMoves.push({
                                row,
                                col,
                                moves: [...validMoves]
                            });
                        }
                    }
                }
            }
            
            let selectedMove;
            
            // If there are forced jumps, select one
            if (forcedPieces.length > 0) {
                console.log(`AI has ${forcedPieces.length} pieces with forced jumps`);
                
                // First, look for jumps that create kings
                for (const piece of forcedPieces) {
                    const pieceObj = boardState[piece.row][piece.col];
                    
                    // If not already a king
                    if (!pieceObj.isKing) {
                        // For red, check if any jump reaches row 7
                        // For black, check if any jump reaches row 0
                        const kingRow = aiColor === 'red' ? 7 : 0;
                        
                        for (const move of piece.moves) {
                            if (move.toRow === kingRow) {
                                selectedMove = {
                                    fromRow: piece.row,
                                    fromCol: piece.col,
                                    toRow: move.toRow,
                                    toCol: move.toCol
                                };
                                console.log(`AI selected king-making jump from [${piece.row},${piece.col}] to [${move.toRow},${move.toCol}]`);
                                break;
                            }
                        }
                        if (selectedMove) break;
                    }
                }
                
                // If no king-making jump found, pick a random jump
                if (!selectedMove) {
                    const pieceIndex = Math.floor(Math.random() * forcedPieces.length);
                    const piece = forcedPieces[pieceIndex];
                    const moveIndex = Math.floor(Math.random() * piece.moves.length);
                    const move = piece.moves[moveIndex];
                    
                    selectedMove = {
                        fromRow: piece.row,
                        fromCol: piece.col,
                        toRow: move.toRow,
                        toCol: move.toCol
                    };
                    console.log(`AI selected random jump from [${piece.row},${piece.col}] to [${move.toRow},${move.toCol}]`);
                }
            }
            // Otherwise, select a regular move
            else if (allPossibleMoves.length > 0) {
                // First, prioritize moves that make kings
                for (const piece of allPossibleMoves) {
                    const pieceObj = boardState[piece.row][piece.col];
                    
                    // If not already a king
                    if (!pieceObj.isKing) {
                        // For red, check if any move reaches row 7
                        // For black, check if any move reaches row 0
                        const kingRow = aiColor === 'red' ? 7 : 0;
                        
                        for (const move of piece.moves) {
                            if (move.toRow === kingRow) {
                                selectedMove = {
                                    fromRow: piece.row,
                                    fromCol: piece.col,
                                    toRow: move.toRow,
                                    toCol: move.toCol
                                };
                                break;
                            }
                        }
                        if (selectedMove) break;
                    }
                }
                
                // If no king-making move found, pick a random move
                if (!selectedMove) {
                    const pieceIndex = Math.floor(Math.random() * allPossibleMoves.length);
                    const piece = allPossibleMoves[pieceIndex];
                    const moveIndex = Math.floor(Math.random() * piece.moves.length);
                    const move = piece.moves[moveIndex];
                    
                    selectedMove = {
                        fromRow: piece.row,
                        fromCol: piece.col,
                        toRow: move.toRow,
                        toCol: move.toCol
                    };
                }
            }
            
            // Make the selected move
            if (selectedMove) {
                console.log(`AI executing move from [${selectedMove.fromRow},${selectedMove.fromCol}] to [${selectedMove.toRow},${selectedMove.toCol}]`);
                makeMove(selectedMove.fromRow, selectedMove.fromCol, selectedMove.toRow, selectedMove.toCol);
            } else {
                console.error('Error: AI could not find a valid move');
            }
            
            aiThinking = false;
        }, 500);
    }

    // Initialize the game
    initBoard();
}); 