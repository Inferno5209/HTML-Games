# Checkers Game

A fully functional Checkers game for the browser that follows all standard rules.

## How to Play

1. Open the `index.html` file in a web browser to start playing.
2. Choose whether to play against another player or against the AI.
3. The game is played between two players: Black and Red, with Black going first.
4. Move your pieces by clicking on them and then clicking on a valid move location.
5. Capture opponent pieces by jumping over them.
6. When a piece reaches the opponent's back row, it becomes a "king" and can move both forward and backward.
7. The game ends when one player has no pieces left or cannot make a valid move.

## Game Modes

- **Player vs Player**: Play against another human player on the same device
- **Player vs AI**: Play against a computer opponent (AI plays as Red)

## Game Rules

### Setup
- The game is played on an 8x8 checkered board.
- Each player starts with 12 pieces placed on the dark squares in the first three rows closest to them.
- Black pieces start from the bottom, red from the top.

### Movement
- Regular pieces can only move diagonally forward one square at a time.
- Kings can move diagonally in any direction (forward or backward), but still only one square at a time for regular moves.
- Players must make a capture move if one is available.

### Capturing
- Jumps are made by moving over an opponent's piece to an empty square immediately beyond it.
- Multiple jumps are allowed and required in a single turn if available.
- If a jump is available, the player must take it.

### Kings
- When a piece reaches the opponent's back row, it becomes a king.
- Kings are indicated by a crown symbol.
- Kings can move and jump diagonally in any direction (forward or backward).

### Winning the Game
- A player wins by capturing all of the opponent's pieces.
- A player also wins if the opponent cannot make a legal move on their turn.

## Features

- Two game modes: Player vs Player and Player vs AI
- Move history with notation
- Undo move functionality
- Visual indicators for valid moves and previous moves
- Highlights for pieces that must jump
- Automatic detection of game end
- Piece counter to track captured pieces
- Restart button to begin a new game

## Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla, no frameworks)

## Credits

Made by Team Reilleux

## License

This project is open source and available for anyone to use and modify. 