import { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [dir, setDir] = useState({ x: 0, y: -1 });
  const [food, setFood] = useState(INITIAL_FOOD);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  
  const touchStart = useRef(null);
  const gameLoopRef = useRef();

  const reset = () => {
    setSnake(INITIAL_SNAKE);
    setDir({ x: 0, y: -1 });
    setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
    setGameOver(false);
    setScore(0);
    setPlaying(true);
  };

  const handleKey = useCallback((e) => {
    if (['ArrowUp', 'w', 'W'].includes(e.key) && dir.y !== 1) setDir({ x: 0, y: -1 });
    if (['ArrowDown', 's', 'S'].includes(e.key) && dir.y !== -1) setDir({ x: 0, y: 1 });
    if (['ArrowLeft', 'a', 'A'].includes(e.key) && dir.x !== 1) setDir({ x: -1, y: 0 });
    if (['ArrowRight', 'd', 'D'].includes(e.key) && dir.x !== -1) setDir({ x: 1, y: 0 });
  }, [dir]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (!playing || gameOver) return;
    
    const move = () => {
      setSnake(prev => {
        const head = { x: prev[0].x + dir.x, y: prev[0].y + dir.y };
        
        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          return prev;
        }
        
        // Self collision
        if (prev.some(seg => seg.x === head.x && seg.y === head.y)) {
          setGameOver(true);
          return prev;
        }
        
        const newSnake = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 10);
          setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    };

    gameLoopRef.current = setInterval(move, 120);
    return () => clearInterval(gameLoopRef.current);
  }, [playing, gameOver, dir, food]);

  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '16px', color: '#fff', textAlign: 'center', width: 'fit-content', margin: '10px 0' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>🐍 Snake (Score: {score})</h3>
      
      <div 
        onTouchStart={(e) => {
          touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          if (!touchStart.current) return;
          const dx = e.changedTouches[0].clientX - touchStart.current.x;
          const dy = e.changedTouches[0].clientY - touchStart.current.y;
          if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30 && dir.x !== -1) setDir({ x: 1, y: 0 });
            else if (dx < -30 && dir.x !== 1) setDir({ x: -1, y: 0 });
          } else {
            if (dy > 30 && dir.y !== -1) setDir({ x: 0, y: 1 });
            else if (dy < -30 && dir.y !== 1) setDir({ x: 0, y: -1 });
          }
          touchStart.current = null;
        }}
        style={{ 
          width: `${GRID_SIZE * 15}px`, 
          height: `${GRID_SIZE * 15}px`, 
          background: '#111',
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          position: 'relative',
          margin: '0 auto',
          overflow: 'hidden',
          touchAction: 'none' // Prevent scrolling while playing
        }}
      >
        {/* Food */}
        <div style={{
          position: 'absolute',
          width: '15px', height: '15px',
          background: '#ff3b30',
          borderRadius: '50%',
          left: `${food.x * 15}px`, top: `${food.y * 15}px`
        }} />
        
        {/* Snake */}
        {snake.map((seg, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '15px', height: '15px',
            background: i === 0 ? '#34c759' : '#30d158',
            borderRadius: i === 0 ? '4px' : '2px',
            left: `${seg.x * 15}px`, top: `${seg.y * 15}px`
          }} />
        ))}

        {(!playing || gameOver) && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>{gameOver ? 'Game Over!' : 'Ready?'}</h4>
            <button 
              onClick={reset}
              style={{ padding: '8px 16px', background: '#0a84ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              {gameOver ? 'Play Again' : 'Start Game'}
            </button>
          </div>
        )}
      </div>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '10px' }}>Swipe or use WASD/Arrows to move</p>
    </div>
  );
};

export default SnakeGame;
