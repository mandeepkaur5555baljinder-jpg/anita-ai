import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';

const PIECE_SYMBOLS = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
  P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔'
};

const PIECE_VALUES = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

const evaluateBoard = (chess) => {
  let totalEvaluation = 0;
  const board = chess.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const val = PIECE_VALUES[piece.type] || 0;
        totalEvaluation += piece.color === 'b' ? val : -val; // Black wants positive, White wants negative
      }
    }
  }
  return totalEvaluation;
};

const getBestMove = (chess) => {
  const possibleMoves = chess.moves({ verbose: true });
  if (possibleMoves.length === 0) return null;
  
  // 1-ply Minimax (just looks 1 move ahead)
  let bestMove = null;
  let bestValue = -9999;
  
  // Shuffle to prevent repetitive games
  possibleMoves.sort(() => Math.random() - 0.5);

  for (let i = 0; i < possibleMoves.length; i++) {
    const move = possibleMoves[i];
    chess.move(move);
    const boardValue = evaluateBoard(chess);
    chess.undo();
    
    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }
  
  return bestMove || possibleMoves[0];
};

const ChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [mode, setMode] = useState('computer'); // 'computer' or 'pvp'
  const [status, setStatus] = useState('White to move');
  
  const updateStatus = useCallback((cg) => {
    if (cg.isCheckmate()) return setStatus(`Checkmate! ${cg.turn() === 'w' ? 'Black' : 'White'} wins.`);
    if (cg.isDraw()) return setStatus('Draw!');
    if (cg.isCheck()) return setStatus(`Check! ${cg.turn() === 'w' ? 'White' : 'Black'} to move.`);
    setStatus(`${cg.turn() === 'w' ? 'White' : 'Black'} to move`);
  }, []);

  const makeMove = useCallback((move) => {
    try {
      const result = game.move(move);
      if (result) {
        const newGame = new Chess(game.fen());
        setGame(newGame);
        setBoard(newGame.board());
        updateStatus(newGame);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game, updateStatus]);

  // Computer's turn
  useEffect(() => {
    if (mode === 'computer' && game.turn() === 'b' && !game.isGameOver()) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(game);
        if (bestMove) makeMove(bestMove);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game, mode, makeMove]);

  const handleSquareClick = (square) => {
    if (game.isGameOver()) return;
    if (mode === 'computer' && game.turn() === 'b') return; // Wait for computer

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      
      const moved = makeMove({
        from: selectedSquare,
        to: square,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (moved) {
        setSelectedSquare(null);
      } else {
        // If invalid move but clicked own piece, select it instead
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
    setSelectedSquare(null);
    setStatus('White to move');
  };

  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '16px', color: '#fff', textAlign: 'center', width: 'fit-content', margin: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>♟️ Chess</h3>
        <select 
          value={mode} 
          onChange={e => { setMode(e.target.value); resetGame(); }}
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}
        >
          <option value="computer" style={{ color: '#000' }}>vs Computer</option>
          <option value="pvp" style={{ color: '#000' }}>2 Player</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#70c5ce' }}>{status}</div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 35px)',
        gridTemplateRows: 'repeat(8, 35px)',
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: '8px',
        overflow: 'hidden',
        margin: '0 auto',
        width: 'fit-content'
      }}>
        {board.map((row, r) => row.map((pieceObj, c) => {
          const file = String.fromCharCode(97 + c);
          const rank = 8 - r;
          const square = `${file}${rank}`;
          
          const isDark = (r + c) % 2 === 1;
          const isSelected = selectedSquare === square;
          
          // Check if it's a valid move target for highlighted hints
          let isHint = false;
          if (selectedSquare) {
            const validMoves = game.moves({ square: selectedSquare, verbose: true });
            isHint = validMoves.some(m => m.to === square);
          }

          let symbol = '';
          if (pieceObj) {
            const char = pieceObj.color === 'w' ? pieceObj.type.toUpperCase() : pieceObj.type.toLowerCase();
            symbol = PIECE_SYMBOLS[char];
          }

          return (
            <div
              key={square}
              onClick={() => handleSquareClick(square)}
              style={{
                width: '35px', height: '35px',
                background: isSelected ? '#ffcc00' : isDark ? '#769656' : '#eeeed2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', color: '#000', cursor: 'pointer',
                userSelect: 'none', touchAction: 'manipulation',
                position: 'relative'
              }}
            >
              {symbol}
              {isHint && (
                <div style={{ position: 'absolute', width: '10px', height: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '50%' }} />
              )}
            </div>
          );
        }))}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
        <button onClick={resetGame} style={{ padding: '6px 14px', background: '#ff3b30', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Reset Game
        </button>
      </div>
    </div>
  );
};

export default ChessGame;
