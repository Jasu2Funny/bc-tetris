class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Game constants
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        // Game state
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        // Session storage for high score
        this.highScore = parseInt(sessionStorage.getItem('tetrisHighScore')) || 0;
        
        // Initialize
        this.initBoard();
        this.initPieces();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initBoard() {
        this.board = [];
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                this.board[y][x] = 0;
            }
        }
    }
    
    initPieces() {
        // Tetris pieces (I, O, T, S, Z, J, L)
        this.pieces = {
            I: {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00f5ff'
            },
            O: {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffff00'
            },
            T: {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#a000f0'
            },
            S: {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00f000'
            },
            Z: {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#f00000'
            },
            J: {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#0000f0'
            },
            L: {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#f0a000'
            }
        };
        
        this.pieceTypes = Object.keys(this.pieces);
    }
    
    createPiece(type) {
        const piece = this.pieces[type];
        return {
            type: type,
            shape: piece.shape,
            color: piece.color,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2),
            y: 0
        };
    }
    
    getRandomPiece() {
        const randomIndex = Math.floor(Math.random() * this.pieceTypes.length);
        return this.createPiece(this.pieceTypes[randomIndex]);
    }
    
    bindEvents() {
        // Button events
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyP') {
                e.preventDefault();
                if (this.gameRunning) {
                    this.togglePause();
                }
                return;
            }

            if (!this.gameRunning || this.gamePaused) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case 'Space':
                    e.preventDefault();
                    this.hardDrop();
                    break;
            }
        });
    }
    
    startGame() {
        this.initBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameOver = false;
        
        this.currentPiece = this.getRandomPiece();
        this.nextPiece = this.getRandomPiece();
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('gameOverlay').classList.remove('active');
        
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.gamePaused ? 'Resume' : 'Pause';
        
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.update();
        this.draw();
        
        setTimeout(() => {
            if (this.gameRunning && !this.gamePaused) {
                this.gameLoop();
            }
        }, this.getDropSpeed());
    }
    
    getDropSpeed() {
        return Math.max(50, 1000 - (this.level - 1) * 100);
    }
    
    update() {
        if (this.movePiece(0, 1)) {
            // Piece moved down successfully
        } else {
            // Piece couldn't move down, place it
            this.placePiece();
            this.clearLines();
            this.spawnNewPiece();
            
            if (this.isGameOver()) {
                this.endGame();
            }
        }
    }
    
    movePiece(dx, dy) {
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (this.isValidMove(this.currentPiece.shape, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        return false;
    }
    
    rotatePiece() {
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        if (this.isValidMove(rotated, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = rotated;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        
        return rotated;
    }
    
    hardDrop() {
        let cellsDropped = 0;
        while (this.movePiece(0, 1)) {
            cellsDropped++;
        }

        this.score += cellsDropped * 2;
        this.placePiece();
        this.clearLines();
        this.spawnNewPiece();

        if (this.isGameOver()) {
            this.endGame();
        } else {
            this.updateDisplay();
            this.draw();
        }
    }
    
    isValidMove(shape, x, y) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placePiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const x = this.currentPiece.x + col;
                    const y = this.currentPiece.y + row;
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.isLineFull(y)) {
                this.removeLine(y);
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;
            
            const lineScores = [0, 100, 300, 500, 800];
            this.score += lineScores[linesCleared] * this.level;
            
            this.updateDisplay();
        }
    }
    
    isLineFull(y) {
        return this.board[y].every(cell => cell !== 0);
    }
    
    removeLine(y) {
        this.board.splice(y, 1);
        this.board.unshift(new Array(this.BOARD_WIDTH).fill(0));
    }
    
    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.getRandomPiece();
    }
    
    isGameOver() {
        return !this.isValidMove(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y);
    }
    
    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            sessionStorage.setItem('tetrisHighScore', this.highScore.toString());
        }
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pause';
        
        // Show game over overlay
        document.getElementById('overlayTitle').textContent = 'Game Over!';
        document.getElementById('overlayMessage').textContent = `Final Score: ${this.score}\nPress Start to play again`;
        document.getElementById('gameOverlay').classList.add('active');
        
        this.updateDisplay();
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(this.ctx, x, y, this.board[y][x]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            this.drawPiece(this.ctx, this.currentPiece);
        }
        
        // Draw next piece
        this.drawNextPiece();
    }
    
    drawBlock(ctx, x, y, color) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        ctx.fillStyle = color;
        ctx.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(pixelX + 2, pixelY + 2, this.BLOCK_SIZE - 4, 4);
        ctx.fillRect(pixelX + 2, pixelY + 2, 4, this.BLOCK_SIZE - 4);
    }
    
    drawPiece(ctx, piece) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const x = piece.x + col;
                    const y = piece.y + row;
                    if (y >= 0) {
                        this.drawBlock(ctx, x, y, piece.color);
                    }
                }
            }
        }
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const blockSize = 20;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
            
            for (let row = 0; row < this.nextPiece.shape.length; row++) {
                for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                    if (this.nextPiece.shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;
                        
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(x, y, blockSize, blockSize);
                        
                        this.nextCtx.strokeStyle = '#333';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(x, y, blockSize, blockSize);
                    }
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
        document.getElementById('highScore').textContent = this.highScore;
    }
}

globalThis.Tetris = Tetris;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Tetris();
});
