import { useEffect, useRef, useState, useCallback } from 'react';

export default function CarGame() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('start'); // 'start', 'playing', 'gameover'
  const [score, setScore] = useState(0);

  const reqRef = useRef();
  const state = useRef({
    playerX: 150, // Canvas width is 300
    enemies: [],
    speed: 4,
    roadOffset: 0,
    score: 0,
    keys: { left: false, right: false },
    touchDir: 0 // -1 left, 1 right, 0 none
  });

  const CAR_W = 30;
  const CAR_H = 50;
  const CANVAS_W = 300;
  const CANVAS_H = 400;

  const startGame = () => {
    state.current = {
      playerX: 150,
      enemies: [],
      speed: 4,
      roadOffset: 0,
      score: 0,
      keys: { left: false, right: false },
      touchDir: 0
    };
    setScore(0);
    setStatus('playing');
  };

  const drawCar = (ctx, x, y, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - CAR_W/2, y - CAR_H/2, CAR_W, CAR_H, 6);
    ctx.fill();
    // Windshield
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x - CAR_W/2 + 4, y - CAR_H/2 + 8, CAR_W - 8, 12, 3);
    ctx.fill();
    // Headlights
    ctx.fillStyle = '#fffc00';
    ctx.fillRect(x - CAR_W/2 + 2, y - CAR_H/2 + 2, 6, 4);
    ctx.fillRect(x + CAR_W/2 - 8, y - CAR_H/2 + 2, 6, 4);
  };

  const update = useCallback(() => {
    if (status !== 'playing') return;
    
    const ctx = canvasRef.current.getContext('2d');
    const s = state.current;

    // Movement
    if (s.keys.left || s.touchDir === -1) s.playerX -= 5;
    if (s.keys.right || s.touchDir === 1) s.playerX += 5;
    
    // Bounds
    if (s.playerX < CAR_W/2) s.playerX = CAR_W/2;
    if (s.playerX > CANVAS_W - CAR_W/2) s.playerX = CANVAS_W - CAR_W/2;

    // Road animation
    s.roadOffset += s.speed;
    if (s.roadOffset > 40) s.roadOffset = 0;

    // Spawn enemies
    if (Math.random() < 0.02 + (s.score * 0.0005)) { // gets slightly harder
      const lanes = [50, 150, 250]; // Left, Center, Right lanes roughly
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      // add some jitter
      const ex = lane + (Math.random() * 20 - 10);
      s.enemies.push({ x: Math.max(CAR_W/2, Math.min(CANVAS_W-CAR_W/2, ex)), y: -CAR_H });
    }

    // Update enemies
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      let e = s.enemies[i];
      e.y += s.speed;

      // Collision detection (AABB)
      const px = s.playerX - CAR_W/2;
      const py = CANVAS_H - 20 - CAR_H/2;
      const ex = e.x - CAR_W/2;
      const ey = e.y - CAR_H/2;

      if (px < ex + CAR_W && px + CAR_W > ex && py < ey + CAR_H && py + CAR_H > ey) {
        // Crash
        setStatus('gameover');
        return;
      }

      // Passed enemy
      if (e.y > CANVAS_H + CAR_H) {
        s.enemies.splice(i, 1);
        s.score += 10;
        setScore(s.score);
        if (s.score % 100 === 0) s.speed += 0.5; // increase speed
      }
    }

    // --- DRAWING ---
    // Grass background
    ctx.fillStyle = '#2d8a39';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Road
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 0, CANVAS_W - 40, CANVAS_H);

    // Road lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -s.roadOffset;
    
    // Left lane line
    ctx.beginPath();
    ctx.moveTo(100, 0); ctx.lineTo(100, CANVAS_H);
    ctx.stroke();
    // Right lane line
    ctx.beginPath();
    ctx.moveTo(200, 0); ctx.lineTo(200, CANVAS_H);
    ctx.stroke();
    
    ctx.setLineDash([]); // reset

    // Draw Enemies
    s.enemies.forEach(e => drawCar(ctx, e.x, e.y, '#ff3b30'));

    // Draw Player
    drawCar(ctx, s.playerX, CANVAS_H - 20, '#0a84ff');

    reqRef.current = requestAnimationFrame(update);
  }, [status]);

  useEffect(() => {
    if (status === 'playing') {
      reqRef.current = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(reqRef.current);
  }, [status, update]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') state.current.keys.left = true;
      if (e.key === 'ArrowRight') state.current.keys.right = true;
    };
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft') state.current.keys.left = false;
      if (e.key === 'ArrowRight') state.current.keys.right = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div style={{
      width: '100%', maxWidth: '350px', background: 'rgba(0,0,0,0.3)',
      borderRadius: '24px', padding: '16px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '16px', userSelect: 'none', touchAction: 'none', margin: '0 auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: '#fff' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Traffic Run</div>
        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#ffcc00' }}>{score} pts</div>
      </div>

      <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <canvas 
          ref={canvasRef}
          width={CANVAS_W} 
          height={CANVAS_H} 
          style={{ width: '100%', display: 'block', backgroundColor: '#333' }}
        />
        
        {/* Mobile touch overlays */}
        {status === 'playing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div 
              style={{ flex: 1 }} 
              onTouchStart={() => state.current.touchDir = -1}
              onTouchEnd={() => state.current.touchDir = 0}
              onMouseDown={() => state.current.touchDir = -1}
              onMouseUp={() => state.current.touchDir = 0}
              onMouseLeave={() => state.current.touchDir = 0}
            />
            <div 
              style={{ flex: 1 }} 
              onTouchStart={() => state.current.touchDir = 1}
              onTouchEnd={() => state.current.touchDir = 0}
              onMouseDown={() => state.current.touchDir = 1}
              onMouseUp={() => state.current.touchDir = 0}
              onMouseLeave={() => state.current.touchDir = 0}
            />
          </div>
        )}

        {status === 'start' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
            <button onClick={startGame} style={{ padding: '12px 32px', fontSize: '18px', fontWeight: 'bold', borderRadius: '30px', background: '#30d158', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Start Engine
            </button>
          </div>
        )}

        {status === 'gameover' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', gap: '16px' }}>
            <div style={{ color: '#ff3b30', fontSize: '28px', fontWeight: 'bold' }}>CRASHED!</div>
            <div style={{ color: '#fff', fontSize: '16px' }}>Final Score: {score}</div>
            <button onClick={startGame} style={{ padding: '12px 32px', fontSize: '18px', fontWeight: 'bold', borderRadius: '30px', background: '#0a84ff', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Play Again
            </button>
          </div>
        )}
      </div>

      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
        Tap Left/Right side of game to steer. <br/> Avoid the red cars!
      </div>
    </div>
  );
}
