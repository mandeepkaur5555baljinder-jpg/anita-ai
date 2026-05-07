import { useState, useEffect, useRef } from 'react';

const GRAVITY = 0.5;
const JUMP = -7;
const PIPE_SPEED = 3;
const PIPE_WIDTH = 50;
const PIPE_GAP = 130;
const BIRD_SIZE = 24;
const TICK_RATE = 20; // 50fps fixed

const FlappyBird = () => {
  const [uiState, setUiState] = useState({ playing: false, gameOver: false, score: 0 });
  const [birdPos, setBirdPos] = useState(200);
  const [pipes, setPipes] = useState([]);
  
  const stateRef = useRef({
    birdPos: 200,
    birdVelocity: 0,
    pipes: [],
    score: 0,
    playing: false,
    gameOver: false
  });

  const loopRef = useRef();

  const jump = () => {
    if (!stateRef.current.playing || stateRef.current.gameOver) return;
    stateRef.current.birdVelocity = JUMP;
  };

  const start = () => {
    stateRef.current = {
      birdPos: 200,
      birdVelocity: JUMP,
      pipes: [{ x: 400, topH: Math.floor(Math.random() * 200) + 50, passed: false }],
      score: 0,
      playing: true,
      gameOver: false
    };
    setUiState({ playing: true, gameOver: false, score: 0 });
    setBirdPos(200);
    setPipes(stateRef.current.pipes);
  };

  const stopGame = () => {
    stateRef.current.playing = false;
    stateRef.current.gameOver = true;
    setUiState(s => ({ ...s, playing: false, gameOver: true }));
  };

  useEffect(() => {
    loopRef.current = setInterval(() => {
      const state = stateRef.current;
      if (!state.playing || state.gameOver) return;

      // Physics
      state.birdVelocity += GRAVITY;
      state.birdPos += state.birdVelocity;

      // Pipe movement & generation
      let newPipes = [...state.pipes];
      for (let i = 0; i < newPipes.length; i++) {
        newPipes[i].x -= PIPE_SPEED;
      }

      // Remove off-screen
      if (newPipes[0] && newPipes[0].x < -PIPE_WIDTH) {
        newPipes.shift();
      }

      // Add new pipe at strict intervals
      const lastPipe = newPipes[newPipes.length - 1];
      if (lastPipe && lastPipe.x <= 200) { // exactly 200px apart
        newPipes.push({ 
          x: lastPipe.x + 200, 
          topH: Math.floor(Math.random() * 200) + 50, 
          passed: false 
        });
      }
      
      state.pipes = newPipes;

      // Collision Detection
      if (state.birdPos > 380 || state.birdPos < -20) {
        stopGame();
        return;
      }

      const birdRect = { 
        left: 50, right: 50 + BIRD_SIZE, 
        top: state.birdPos, bottom: state.birdPos + BIRD_SIZE 
      };

      for (let p of state.pipes) {
        const pipeRects = [
          { left: p.x, right: p.x + PIPE_WIDTH, top: 0, bottom: p.topH },
          { left: p.x, right: p.x + PIPE_WIDTH, top: p.topH + PIPE_GAP, bottom: 400 }
        ];

        for (let rect of pipeRects) {
          if (
            birdRect.right > rect.left &&
            birdRect.left < rect.right &&
            birdRect.bottom > rect.top &&
            birdRect.top < rect.bottom
          ) {
            stopGame();
            return;
          }
        }

        // Score logic
        if (!p.passed && p.x + PIPE_WIDTH < 50) {
          p.passed = true;
          state.score += 1;
          setUiState(s => ({ ...s, score: state.score }));
        }
      }

      // Sync visual state 50 times a second
      setBirdPos(state.birdPos);
      setPipes(state.pipes);

    }, TICK_RATE);

    return () => clearInterval(loopRef.current);
  }, []);

  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '16px', color: '#fff', textAlign: 'center', width: 'fit-content', margin: '10px 0' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>🐦 Flappy Bird (Score: {uiState.score})</h3>
      
      <div 
        onPointerDown={(e) => { e.preventDefault(); jump(); }}
        style={{ 
          width: '100%', maxWidth: '300px', height: '400px', 
          background: '#70c5ce',
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          position: 'relative',
          margin: '0 auto',
          overflow: 'hidden',
          cursor: uiState.playing && !uiState.gameOver ? 'pointer' : 'default',
          userSelect: 'none',
          touchAction: 'none'
        }}
      >
        {/* Bird */}
        <div style={{
          position: 'absolute',
          width: BIRD_SIZE, height: BIRD_SIZE,
          background: '#ffcc00', borderRadius: '50%',
          left: '50px', top: birdPos + 'px',
          boxShadow: 'inset -2px -2px 0px rgba(0,0,0,0.2)',
          transition: 'top 0.02s linear'
        }} />

        {/* Pipes */}
        {pipes.map((p, i) => (
          <div key={i}>
            <div style={{ position: 'absolute', left: p.x, top: 0, width: PIPE_WIDTH, height: p.topH, background: '#74bf2e', border: '2px solid #558a22' }} />
            <div style={{ position: 'absolute', left: p.x, top: p.topH + PIPE_GAP, width: PIPE_WIDTH, height: 400 - (p.topH + PIPE_GAP), background: '#74bf2e', border: '2px solid #558a22' }} />
          </div>
        ))}

        {/* Ground */}
        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '20px', background: '#ded895', borderTop: '2px solid #73bf2e' }} />

        {(!uiState.playing || uiState.gameOver) && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 10
          }}>
            <h2 style={{ margin: '0 0 10px 0', textShadow: '2px 2px 0 #000' }}>{uiState.gameOver ? 'Game Over!' : 'Flappy Bird'}</h2>
            <button 
              onClick={(e) => { e.stopPropagation(); start(); }}
              style={{ padding: '10px 24px', fontSize: '16px', background: '#ff3b30', color: 'white', border: '2px solid #fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {uiState.gameOver ? 'Play Again' : 'Tap to Start'}
            </button>
          </div>
        )}
      </div>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '10px' }}>Tap or click the screen to flap!</p>
    </div>
  );
};

export default FlappyBird;
