const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

class CanvasContextStub {
  clearRect() {}
  fillRect() {}
  strokeRect() {}
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
}

class ElementStub {
  constructor(id, width = 300, height = 600) {
    this.id = id;
    this.width = width;
    this.height = height;
    this.textContent = '';
    this.disabled = false;
    this.classList = {
      add() {},
      remove() {},
      contains() { return false; }
    };
    this.className = '';
    this.ctx = new CanvasContextStub();
  }

  addEventListener() {}

  getContext() {
    return this.ctx;
  }
}

const ids = ['gameCanvas', 'nextCanvas', 'score', 'lines', 'level', 'highScore', 'startBtn', 'pauseBtn', 'gameOverlay', 'overlayTitle', 'overlayMessage'];
const elements = new Map();
for (const id of ids) {
  if (id === 'gameCanvas') {
    elements.set(id, new ElementStub('gameCanvas', 300, 600));
  } else if (id === 'nextCanvas') {
    elements.set(id, new ElementStub('nextCanvas', 120, 120));
  } else {
    elements.set(id, new ElementStub(id));
  }
}

elements.get('gameOverlay').classList = {
  add() {},
  remove() {}
};

elements.get('startBtn').textContent = 'Start Game';
elements.get('pauseBtn').textContent = 'Pause';

const context = {
  console,
  document: {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, new ElementStub(id));
      }
      return elements.get(id);
    },
    addEventListener() {}
  },
  sessionStorage: {
    getItem() {
      return null;
    },
    setItem() {}
  },
  setTimeout() {},
  globalThis: undefined
};
context.globalThis = context;

// Expose same global API shape as a browser page would have.
context.Tetris = context.globalThis.Tetris;

elements.get('gameOverlay').classList = {
  add() {},
  remove() {}
};

vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), 'tetris.js'), 'utf8'), context);

assert(context.globalThis.Tetris, 'Tetris class should be exposed on globalThis');

function loadGame() {
  return new context.globalThis.Tetris();
}

function makeFullRow() {
  return new Array(10).fill('#000000');
}

function caseFor(linesToClear, expectedScore, expectedLines) {
  const game = loadGame();
  game.initBoard();
  game.score = 0;
  game.lines = 0;
  game.level = 1;

  for (let y = 0; y < linesToClear; y++) {
    game.board[game.BOARD_HEIGHT - 1 - y] = makeFullRow();
  }

  game.clearLines();

  assert.strictEqual(game.lines, expectedLines, 'The number of cleared lines is tracked correctly');
  assert.strictEqual(game.score, expectedScore, `Expected ${expectedScore} points for ${linesToClear} cleared lines`);
}

const cases = [
  { linesToClear: 2, expectedScore: 300, expectedLines: 2 },
  { linesToClear: 3, expectedScore: 500, expectedLines: 3 },
  { linesToClear: 4, expectedScore: 800, expectedLines: 4 }
];

for (const item of cases) {
  caseFor(item.linesToClear, item.expectedScore, item.expectedLines);
}

console.log('All line-clear scoring tests passed: 2-line=300, 3-line=500, 4-line=800 points.');
