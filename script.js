const board = document.getElementById('chessboard');

const initialBoard = [
  '♜','♞','♝','♛','♚','♝','♞','♜',
  '♟','♟','♟','♟','♟','♟','♟','♟',
  '','','','','','','','',
  '','','','','','','','',
  '','','','','','','','',
  '','','','','','','','',
  '♙','♙','♙','♙','♙','♙','♙','♙',
  '♖','♘','♗','♕','♔','♗','♘','♖'
];

let selectedSquare = null;
let currentPlayer = 'white';
let scoreWhite = 0;
let scoreBlack = 0;
let historyStack = [];

let capturedByWhite = {};
let capturedByBlack = {};

const pieceValues = {
  '♟': 1, '♞': 3, '♝': 3, '♜': 5, '♛': 9, '♚': 100,
  '♙': 1, '♘': 3, '♗': 3, '♖': 5, '♕': 9, '♔': 100
};

function createBoard() {
  board.innerHTML = '';
  for (let i = 0; i < 64; i++) {
    const square = document.createElement('div');
    square.classList.add('square');
    square.classList.add((Math.floor(i / 8) + i) % 2 === 0 ? 'white' : 'black');
    square.dataset.index = i;

    const piece = initialBoard[i];
    square.textContent = piece;

    // Add piece color class
    if (['♙', '♖', '♘', '♗', '♕', '♔'].includes(piece)) {
      square.classList.add('white-piece');
    } else if (['♟', '♜', '♞', '♝', '♛', '♚'].includes(piece)) {
      square.classList.add('black-piece');
    }

    square.addEventListener('click', () => handleSquareClick(i));
    board.appendChild(square);
  }

  showTurnMessage();
  updateScore();
  updateCapturedDisplay();
}

function handleSquareClick(index) {
  const piece = initialBoard[index];

  if (selectedSquare === null) {
    if (isPlayersPiece(piece)) {
      selectedSquare = index;
      highlightSquare(index);
    }
  } else {
    const fromIndex = selectedSquare;
    const toIndex = index;
    const movingPiece = initialBoard[fromIndex];
    const isValid = isValidMove(movingPiece, fromIndex, toIndex);

    if (isValid) {
      historyStack.push({
        board: [...initialBoard],
        currentPlayer,
        scoreWhite,
        scoreBlack,
        capturedByWhite: { ...capturedByWhite },
        capturedByBlack: { ...capturedByBlack }
      });

      const captured = initialBoard[toIndex];
      if (captured !== '') {
        if (currentPlayer === 'white') {
          scoreWhite += pieceValues[captured] || 0;
          capturedByWhite[captured] = (capturedByWhite[captured] || 0) + 1;
        } else {
          scoreBlack += pieceValues[captured] || 0;
          capturedByBlack[captured] = (capturedByBlack[captured] || 0) + 1;
        }
      }

      initialBoard[toIndex] = movingPiece;
      initialBoard[fromIndex] = '';

      // Pawn promotion
      if (movingPiece === '♙' && Math.floor(toIndex / 8) === 0) {
        initialBoard[toIndex] = '♕'; // Promote to queen
      }
      if (movingPiece === '♟' && Math.floor(toIndex / 8) === 7) {
        initialBoard[toIndex] = '♛'; // Promote to queen
      }

      toggleTurn();
    }

    selectedSquare = null;
    createBoard();
    checkGameStatus();
  }
}

function isPlayersPiece(piece) {
  return currentPlayer === 'white'
    ? ['♙', '♖', '♘', '♗', '♕', '♔'].includes(piece)
    : ['♟', '♜', '♞', '♝', '♛', '♚'].includes(piece);
}

function toggleTurn() {
  currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
}

function highlightSquare(index) {
  const squares = document.querySelectorAll('.square');
  squares.forEach(square => square.classList.remove('highlight'));
  squares[index].classList.add('highlight');
}

function isValidMove(piece, from, to) {
  const fromRow = Math.floor(from / 8);
  const fromCol = from % 8;
  const toRow = Math.floor(to / 8);
  const toCol = to % 8;
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  const targetPiece = initialBoard[to];

  if (piece === '♙') {
    if (rowDiff === -1 && colDiff === 0 && targetPiece === '') return true;
    if (rowDiff === -2 && colDiff === 0 && fromRow === 6 && targetPiece === '' && initialBoard[to + 8] === '') return true;
    if (rowDiff === -1 && Math.abs(colDiff) === 1 && targetPiece !== '' && !isPlayersPiece(targetPiece)) return true;
  }

  if (piece === '♟') {
    if (rowDiff === 1 && colDiff === 0 && targetPiece === '') return true;
    if (rowDiff === 2 && colDiff === 0 && fromRow === 1 && targetPiece === '' && initialBoard[to - 8] === '') return true;
    if (rowDiff === 1 && Math.abs(colDiff) === 1 && targetPiece !== '' && !isPlayersPiece(targetPiece)) return true;
  }

  if (piece === '♘') return isValidKnightMove(from, to, 'white');
  if (piece === '♞') return isValidKnightMove(from, to, 'black');
  if (piece === '♖') return isValidLinearMove(from, to, 'white', 'rook');
  if (piece === '♜') return isValidLinearMove(from, to, 'black', 'rook');
  if (piece === '♗') return isValidLinearMove(from, to, 'white', 'bishop');
  if (piece === '♝') return isValidLinearMove(from, to, 'black', 'bishop');
  if (piece === '♕') return isValidLinearMove(from, to, 'white', 'queen');
  if (piece === '♛') return isValidLinearMove(from, to, 'black', 'queen');
  if (piece === '♔') return isValidKingMove(from, to, 'white');
  if (piece === '♚') return isValidKingMove(from, to, 'black');

  return false;
}

function isValidLinearMove(from, to, player, type) {
  const rowFrom = Math.floor(from / 8), colFrom = from % 8;
  const rowTo = Math.floor(to / 8), colTo = to % 8;
  const dRow = rowTo - rowFrom, dCol = colTo - colFrom;
  const absRow = Math.abs(dRow), absCol = Math.abs(dCol);
  const isDiagonal = absRow === absCol, isStraight = dRow === 0 || dCol === 0;

  const targetPiece = initialBoard[to];
  const isOpponent = !isPlayersPiece(targetPiece);

  if (
    (type === 'rook' && !isStraight) ||
    (type === 'bishop' && !isDiagonal) ||
    (type === 'queen' && !(isStraight || isDiagonal))
  ) return false;

  const steps = Math.max(absRow, absCol);
  const stepRow = dRow === 0 ? 0 : dRow / absRow;
  const stepCol = dCol === 0 ? 0 : dCol / absCol;

  for (let i = 1; i < steps; i++) {
    const r = rowFrom + i * stepRow;
    const c = colFrom + i * stepCol;
    const intermediateIndex = r * 8 + c;
    if (initialBoard[intermediateIndex] !== '') return false;
  }

  return targetPiece === '' || isOpponent;
}

function isValidKnightMove(from, to, player) {
  const rowFrom = Math.floor(from / 8), colFrom = from % 8;
  const rowTo = Math.floor(to / 8), colTo = to % 8;
  const rowDiff = Math.abs(rowFrom - rowTo), colDiff = Math.abs(colFrom - colTo);
  const isLShape = (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  const targetPiece = initialBoard[to];
  const isOpponent = !isPlayersPiece(targetPiece);
  return isLShape && (targetPiece === '' || isOpponent);
}

function isValidKingMove(from, to, player) {
  const rowFrom = Math.floor(from / 8), colFrom = from % 8;
  const rowTo = Math.floor(to / 8), colTo = to % 8;
  const dRow = Math.abs(rowFrom - rowTo), dCol = Math.abs(colFrom - colTo);
  const isOneStep = dRow <= 1 && dCol <= 1;
  const targetPiece = initialBoard[to];
  const isOpponent = !isPlayersPiece(targetPiece);
  return isOneStep && (targetPiece === '' || isOpponent);
}

function updateScore() {
  document.getElementById('score-white').textContent = `Score: ${scoreWhite}`;
  document.getElementById('score-black').textContent = `Score: ${scoreBlack}`;
}

function updateCapturedDisplay() {
  const blackList = document.getElementById('captured-black');
  const whiteList = document.getElementById('captured-white');

  blackList.innerHTML = Object.entries(capturedByWhite).map(
    ([piece, count]) => `<span>${piece} × ${count}</span>`
  ).join('');

  whiteList.innerHTML = Object.entries(capturedByBlack).map(
    ([piece, count]) => `<span>${piece} × ${count}</span>`
  ).join('');
}

function showTurnMessage() {
  const turnMsg = document.getElementById('turn-message');
  if (turnMsg) {
    turnMsg.textContent = `Turn: ${currentPlayer.toUpperCase()}`;
  } else {
    const msg = document.createElement('div');
    msg.id = 'turn-message';
    msg.style.marginTop = '10px';
    msg.style.fontSize = '20px';
    msg.textContent = `Turn: ${currentPlayer.toUpperCase()}`;
    board.parentNode.appendChild(msg);
  }
}

function checkGameStatus() {
  const king = currentPlayer === 'white' ? '♚' : '♔';
  const kingIndex = initialBoard.indexOf(king);

  document.querySelectorAll('.square').forEach(sq => sq.classList.remove('check'));
  if (kingIndex === -1) {
    alert(`${currentPlayer === 'white' ? 'Black' : 'White'} wins by checkmate!`);
    location.reload();
  } else {
    const kingSquare = document.querySelector(`.square[data-index='${kingIndex}']`);
    if (kingSquare) kingSquare.classList.add('check');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
  });

  document.getElementById('undoBtn').addEventListener('click', () => {
    if (historyStack.length > 0) {
      const prev = historyStack.pop();
      initialBoard.splice(0, 64, ...prev.board);
      currentPlayer = prev.currentPlayer;
      scoreWhite = prev.scoreWhite;
      scoreBlack = prev.scoreBlack;
      capturedByWhite = { ...prev.capturedByWhite };
      capturedByBlack = { ...prev.capturedByBlack };
      createBoard();
    }
  });
});

createBoard();
