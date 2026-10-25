import { buildAppHtml } from "./bridge";
import type { AppCatalogEntry } from "./types";

const CSS = `
  body {
    width: 100%;
    overflow-x: hidden;
    background: #080b1a;
    color: #ffffff;
    padding: 14px;
  }

  .app {
    width: 100%;
    max-width: 560px;
    margin: 0 auto;
    display: grid;
    gap: 14px;
    font-family: system-ui, sans-serif;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }

  .brand {
    color: #ffffff;
    font-size: clamp(25px, 6vw, 36px);
    font-weight: 950;
    letter-spacing: -1.5px;
  }

  .brand span {
    color: #7c83ff;
  }

  .scoreboard {
    display: flex;
    gap: 8px;
  }

  .score {
    min-width: 90px;
    padding: 8px;
    border: 1px solid #303b68;
    border-radius: 10px;
    background: #111832;
    text-align: center;
  }

  .score-label {
    display: block;
    color: #aeb9e8;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .score strong {
    font-size: 22px;
  }

  .red-text { color: #ff5577; }
  .yellow-text { color: #ffd84d; }

  .status {
    padding: 12px;
    border: 1px solid #303b68;
    border-radius: 10px;
    background: #111832;
    text-align: center;
    font-weight: 750;
    font-size: 15px;
  }

  .status.red {
    color: #ff8298;
    border-color: #79344a;
  }

  .status.yellow {
    color: #ffe477;
    border-color: #75652d;
  }

  .board-shell {
    padding: 10px;
    border: 2px solid #6674ff;
    border-radius: 18px;
    background: #283ed0;
    box-shadow: 0 7px 0 #17237f;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: clamp(4px, 1.5vw, 9px);
  }

  .column {
    display: grid;
    grid-template-rows: repeat(6, 1fr);
    gap: clamp(4px, 1.5vw, 9px);
    min-width: 0;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    touch-action: manipulation;
  }

  .column:focus-visible {
    outline: 3px solid #ffffff;
    outline-offset: 3px;
    border-radius: 50%;
  }

  .cell {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #111b64;
    box-shadow: inset 0 3px 5px #050a36;
    transition: background 120ms ease;
  }

  .cell.red {
    background: #ff5577;
    box-shadow: inset 0 3px 5px #b51d49,
                0 0 8px #ff557755;
  }

  .cell.yellow {
    background: #ffd84d;
    box-shadow: inset 0 3px 5px #c39316,
                0 0 8px #ffd84d55;
  }

  .cell.winner {
    outline: 3px solid #ffffff;
    outline-offset: -4px;
    animation: pulse 700ms infinite alternate;
  }

  @keyframes pulse {
    from { filter: brightness(1); }
    to { filter: brightness(1.5); }
  }

  .controls {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .controls button {
    padding: 10px 18px;
    border: 1px solid #5969d8;
    border-radius: 9px;
    background: #18234a;
    color: #ffffff;
    font-weight: 800;
    cursor: pointer;
    touch-action: manipulation;
  }

  .controls button.primary {
    border-color: #7c83ff;
    background: #5865f2;
  }

  .controls button:hover {
    filter: brightness(1.18);
  }

  .controls button:focus-visible {
    outline: 3px solid #ffffff;
    outline-offset: 3px;
  }

  .instructions {
    color: #aeb9e8;
    font-size: 13px;
    text-align: center;
    line-height: 1.5;
  }

  @media (max-width: 380px) {
    body { padding: 8px; }
    .board-shell { padding: 6px; }
    .score { min-width: 72px; padding: 6px; }
    .score strong { font-size: 19px; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;

const BODY = `
<main class="app">
  <header class="header">
    <div class="brand">CONNECT <span>4</span></div>

    <div class="scoreboard">
      <div class="score">
        <span class="score-label red-text">Red wins</span>
        <strong class="red-text" id="red-score">0</strong>
      </div>

      <div class="score">
        <span class="score-label yellow-text">Yellow wins</span>
        <strong class="yellow-text" id="yellow-score">0</strong>
      </div>
    </div>
  </header>

  <div class="status red" id="status" aria-live="polite">
    Red's turn! Choose a column.
  </div>

  <section class="board-shell" aria-label="Connect Four game board">
    <div class="board" id="board"></div>
  </section>

  <div class="controls">
    <button class="primary" id="new-game">New Game</button>
    <button id="reset-scores">Reset Scores</button>
  </div>

  <p class="instructions">
    Take turns dropping discs into the columns.<br>
    Connect four of your own color horizontally, vertically,
    or diagonally to win!
  </p>
</main>
`;

const JS = `
var ROWS = 6;
var COLS = 7;

var board = [];
var currentPlayer = 1;
var gameOver = false;
var redWins = 0;
var yellowWins = 0;
var winningCells = [];

var boardEl = document.getElementById("board");
var statusEl = document.getElementById("status");
var redScoreEl = document.getElementById("red-score");
var yellowScoreEl = document.getElementById("yellow-score");

function newBoard() {
  board = [];

  for (var r = 0; r < ROWS; r++) {
    board.push([0, 0, 0, 0, 0, 0, 0]);
  }

  currentPlayer = 1;
  gameOver = false;
  winningCells = [];

  updateStatus();
  renderBoard();
  saveGame();
}

function updateStatus(message) {
  if (message) {
    statusEl.textContent = message;
  } else if (gameOver) {
    statusEl.textContent = "Game over! Start a new game.";
  } else {
    statusEl.textContent =
      (currentPlayer === 1 ? "Red" : "Yellow") +
      "'s turn! Choose a column.";
  }

  statusEl.className = "status " +
    (currentPlayer === 1 ? "red" : "yellow");
}

function updateScores() {
  redScoreEl.textContent = String(redWins);
  yellowScoreEl.textContent = String(yellowWins);
}

function renderBoard() {
  var html = "";

  for (var c = 0; c < COLS; c++) {
    html += '<button class="column" data-col="' + c +
      '" aria-label="Drop disc in column ' + (c + 1) + '"' +
      (gameOver ? ' disabled' : '') + '>';

    for (var r = 0; r < ROWS; r++) {
      var value = board[r][c];
      var color = value === 1 ? " red" :
                  value === 2 ? " yellow" : "";

      var isWinner = winningCells.some(function(cell) {
        return cell.r === r && cell.c === c;
      });

      html += '<span class="cell' + color +
        (isWinner ? ' winner' : '') + '"></span>';
    }

    html += '</button>';
  }

  boardEl.innerHTML = html;

  boardEl.querySelectorAll("[data-col]").forEach(function(button) {
    button.addEventListener("click", function() {
      var col = Number(button.getAttribute("data-col"));
      dropDisc(col);
    });
  });

  mcpApp.resize(
    Math.ceil(document.body.scrollWidth),
    Math.ceil(document.body.scrollHeight)
  );
}

function dropDisc(col) {
  if (gameOver || col < 0 || col >= COLS) return;

  var row = -1;

  // Find the lowest empty space in the selected column.
  for (var r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      row = r;
      break;
    }
  }

  if (row === -1) {
    updateStatus("That column is full! Choose another.");
    return;
  }

  board[row][col] = currentPlayer;

  // Check whether this move wins the game.
  var winningLine = findWinningLine(row, col);

  if (winningLine.length >= 4) {
    gameOver = true;
    winningCells = winningLine;

    if (currentPlayer === 1) {
      redWins++;
      updateStatus("Red wins! Four in a row! 🎉");
    } else {
      yellowWins++;
      updateStatus("Yellow wins! Four in a row! 🎉");
    }

    updateScores();
    renderBoard();
    saveGame();
    return;
  }

  // If every cell is filled, the game is a draw.
  var full = true;

  for (var rr = 0; rr < ROWS; rr++) {
    for (var cc = 0; cc < COLS; cc++) {
      if (board[rr][cc] === 0) full = false;
    }
  }

  if (full) {
    gameOver = true;
    updateStatus("It's a draw! Great game!");
    renderBoard();
    saveGame();
    return;
  }

  // Switch to the other player.
  currentPlayer = currentPlayer === 1 ? 2 : 1;

  updateStatus();
  renderBoard();
  saveGame();
}

function findWinningLine(row, col) {
  var player = board[row][col];

  // Horizontal, vertical, and both diagonal directions.
  var directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
  ];

  for (var i = 0; i < directions.length; i++) {
    var dir = directions[i];
    var line = [{ r: row, c: col }];

    // Search in one direction.
    for (var step = 1; step < 4; step++) {
      var r1 = row + dir.dr * step;
      var c1 = col + dir.dc * step;

      if (
        r1 < 0 || r1 >= ROWS ||
        c1 < 0 || c1 >= COLS ||
        board[r1][c1] !== player
      ) break;

      line.push({ r: r1, c: c1 });
    }

    // Search in the opposite direction.
    for (var step2 = 1; step2 < 4; step2++) {
      var r2 = row - dir.dr * step2;
      var c2 = col - dir.dc * step2;

      if (
        r2 < 0 || r2 >= ROWS ||
        c2 < 0 || c2 >= COLS ||
        board[r2][c2] !== player
      ) break;

      line.push({ r: r2, c: c2 });
    }

    if (line.length >= 4) return line;
  }

  return [];
}

function saveGame() {
  mcpApp.save({
    board: board,
    currentPlayer: currentPlayer,
    gameOver: gameOver,
    redWins: redWins,
    yellowWins: yellowWins,
    winningCells: winningCells
  });
}

function restoreGame(saved) {
  if (!saved || !Array.isArray(saved.board)) return;

  if (
    saved.board.length !== ROWS ||
    !saved.board.every(function(row) {
      return Array.isArray(row) && row.length === COLS;
    })
  ) return;

  board = saved.board.map(function(row) {
    return row.map(function(cell) {
      return cell === 1 || cell === 2 ? cell : 0;
    });
  });

  currentPlayer = saved.currentPlayer === 2 ? 2 : 1;
  gameOver = saved.gameOver === true;
  redWins = Number(saved.redWins) || 0;
  yellowWins = Number(saved.yellowWins) || 0;

  winningCells = Array.isArray(saved.winningCells)
    ? saved.winningCells
    : [];

  updateScores();

  if (gameOver) {
    var hasRedWin = winningCells.length >= 4 &&
      winningCells.some(function(cell) {
        return board[cell.r] && board[cell.r][cell.c] === 1;
      });

    var hasYellowWin = winningCells.length >= 4 &&
      winningCells.some(function(cell) {
        return board[cell.r] && board[cell.r][cell.c] === 2;
      });

    if (hasRedWin) {
      updateStatus("Red wins! Four in a row! 🎉");
    } else if (hasYellowWin) {
      updateStatus("Yellow wins! Four in a row! 🎉");
    } else {
      updateStatus("It's a draw! Great game!");
    }
  } else {
    updateStatus();
  }

  renderBoard();
}

document.getElementById("new-game").addEventListener("click", function() {
  newBoard();
});

document.getElementById("reset-scores").addEventListener("click", function() {
  redWins = 0;
  yellowWins = 0;
  updateScores();
  newBoard();
});

window.addEventListener("resize", function() {
  mcpApp.resize(
    Math.ceil(document.body.scrollWidth),
    Math.ceil(document.body.scrollHeight)
  );
});

newBoard();
updateScores();

mcpApp.ready()
  .then(function() {
    return mcpApp.load();
  })
  .then(restoreGame);
`;

export const htmlConnect4 = buildAppHtml({
  appId: "connect4",
  title: "Connect 4",
  css: CSS,
  body: BODY,
  js: JS
});

export const appConnect4: AppCatalogEntry = {
  id: "connect4",
  name: "Connect 4",
  description:
    "Challenge a friend in classic two-player Connect 4. Drop red and yellow discs into a seven-column board and connect four horizontally, vertically, or diagonally to win.",
  seo: {
    title: "Play Connect 4 Online Free | Vibe Fun Plus",
    description:
      "Play Connect 4 online for free with two-player local multiplayer, red and yellow discs, win detection, draw detection, and a responsive game board.",
    intro:
      "Challenge a friend to Connect 4. Take turns dropping discs into the board and try to connect four of your own color before your opponent does.",
    sections: [
      {
        heading: "How to play",
        body:
          "Choose a column to drop a disc into it. Discs fall to the lowest available space. Red plays first, followed by Yellow."
      },
      {
        heading: "How to win",
        body:
          "Connect four discs of your color in a horizontal, vertical, or diagonal line. If the board fills without a winner, the game is a draw."
      },
      {
        heading: "Play together",
        body:
          "Connect 4 supports two players taking turns on the same board. Start a new game to play another round, and track each player's wins."
      }
    ]
  },
  version: "1.0.0",
  updatedAt: "2026-10-25",
  toolName: "play_connect4",
  uiResourceUri: "ui://apps/connect4",
  suggestedSize: { width: 620, height: 760 },
  maxHtmlBytes: 96 * 1024,
  html: htmlConnect4
};
