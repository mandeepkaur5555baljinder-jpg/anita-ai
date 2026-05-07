import { useState, useEffect, useRef } from 'react';

// Constants
const path = [
  [0,6], [1,6], [2,6], [3,6], [4,6], [5,6],
  [6,5], [6,4], [6,3], [6,2], [6,1], [6,0],
  [7,0], [8,0],
  [8,1], [8,2], [8,3], [8,4], [8,5],
  [9,6], [10,6], [11,6], [12,6], [13,6], [14,6],
  [14,7], [14,8],
  [13,8], [12,8], [11,8], [10,8], [9,8],
  [8,9], [8,10], [8,11], [8,12], [8,13], [8,14],
  [7,14], [6,14],
  [6,13], [6,12], [6,11], [6,10], [6,9],
  [5,8], [4,8], [3,8], [2,8], [1,8], [0,8],
  [0,7]
];

const PLAYER_INFO = [
  { 
    id: 0, color: '#ff3b30', name: 'Red', startIndex: 1, endIndex: 50, 
    homeRun: [[1,7], [2,7], [3,7], [4,7], [5,7]], 
    base: [2.5, 2.5], 
    spots: [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]]
  },
  { 
    id: 1, color: '#34c759', name: 'Green', startIndex: 14, endIndex: 11, 
    homeRun: [[7,1], [7,2], [7,3], [7,4], [7,5]], 
    base: [11.5, 2.5], 
    spots: [[10.5, 1.5], [12.5, 1.5], [10.5, 3.5], [12.5, 3.5]]
  },
  { 
    id: 2, color: '#ffcc00', name: 'Yellow', startIndex: 27, endIndex: 24, 
    homeRun: [[13,7], [12,7], [11,7], [10,7], [9,7]], 
    base: [11.5, 11.5], 
    spots: [[10.5, 10.5], [12.5, 10.5], [10.5, 12.5], [12.5, 12.5]]
  },
  { 
    id: 3, color: '#007aff', name: 'Blue', startIndex: 40, endIndex: 37, 
    homeRun: [[7,13], [7,12], [7,11], [7,10], [7,9]], 
    base: [2.5, 11.5], 
    spots: [[1.5, 10.5], [3.5, 10.5], [1.5, 12.5], [3.5, 12.5]]
  }
];

const SAFE_SPOTS = [1, 9, 14, 22, 27, 35, 40, 48];

const getInitialTokens = () => {
  const tokens = [];
  for (let p = 0; p < 4; p++) {
    for (let t = 0; t < 4; t++) {
      tokens.push({ id: `p${p}-t${t}`, player: p, state: 'home', pos: -1, runPos: -1 });
    }
  }
  return tokens;
};

export default function LudoGame() {
  const [setupMode, setSetupMode] = useState(true);
  const [humanCount, setHumanCount] = useState(1);
  const [tokens, setTokens] = useState(getInitialTokens());
  const [turn, setTurn] = useState(0); // 0 to 3
  const [dice, setDice] = useState(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [message, setMessage] = useState("Your turn! Roll the dice.");
  const [winner, setWinner] = useState(null);
  
  // To handle AI delays cleanly without stale closures
  const stateRef = useRef({ tokens, turn, dice, hasRolled, winner });
  useEffect(() => {
    stateRef.current = { tokens, turn, dice, hasRolled, winner };
  }, [tokens, turn, dice, hasRolled, winner]);

  // Roll Dice logic
  const rollDice = () => {
    if (hasRolled || winner || turn >= humanCount) return;
    const val = Math.floor(Math.random() * 6) + 1;
    setDice(val);
    setHasRolled(true);
    processTurn(val, turn);
  };

  const processTurn = (rollVal, pIndex) => {
    const currentTokens = stateRef.current.tokens;
    const myTokens = currentTokens.filter(t => t.player === pIndex);
    
    // Find valid moves
    const validMoves = myTokens.filter(t => {
      if (t.state === 'won') return false;
      if (t.state === 'home') return rollVal === 6;
      if (t.state === 'active') {
        let distanceRemaining;
        if (t.pos <= PLAYER_INFO[pIndex].endIndex && t.pos >= PLAYER_INFO[pIndex].startIndex) {
          // Hasn't crossed 51-0 boundary if applicable, or just standard diff
          distanceRemaining = (PLAYER_INFO[pIndex].endIndex - t.pos + 52) % 52;
        } else {
          // Complicated logic simplified:
          // How many steps taken on main path?
          let stepsTaken = (t.pos - PLAYER_INFO[pIndex].startIndex + 52) % 52;
          distanceRemaining = 50 - stepsTaken;
        }
        if (distanceRemaining < 0) return false; // Already in home run
        return true;
      }
      if (t.state === 'run') {
        return t.runPos + rollVal <= 5; // 5 is the exact center
      }
      return false;
    });

    if (validMoves.length === 0) {
      setMessage(pIndex < humanCount ? "No moves possible." : `${PLAYER_INFO[pIndex].name} rolled ${rollVal}. No moves.`);
      setTimeout(() => nextTurn(false), 1500);
      return;
    }

    if (pIndex < humanCount) {
      setMessage(`You rolled a ${rollVal}. Select a piece to move.`);
    } else {
      // AI automatically picks a move after a delay
      setMessage(`${PLAYER_INFO[pIndex].name} rolled a ${rollVal}...`);
      setTimeout(() => {
        // AI logic: Prioritize captures, then home-outs, then closest to win
        const chosen = validMoves[Math.floor(Math.random() * validMoves.length)];
        moveToken(chosen.id, rollVal);
      }, 1000);
    }
  };

  const moveToken = (tokenId, rollVal) => {
    const { tokens, turn } = stateRef.current;
    const tIndex = tokens.findIndex(t => t.id === tokenId);
    const t = tokens[tIndex];
    if (!t) return;
    
    const pInfo = PLAYER_INFO[t.player];
    let newState = t.state;
    let newPos = t.pos;
    let newRunPos = t.runPos;
    let earnsExtraTurn = rollVal === 6;
    let capturedSomeone = false;

    if (t.state === 'home') {
      newState = 'active';
      newPos = pInfo.startIndex;
    } else if (t.state === 'active') {
      let stepsTaken = (t.pos - pInfo.startIndex + 52) % 52;
      let newSteps = stepsTaken + rollVal;
      
      if (newSteps > 50) {
        // Enters home run
        newState = 'run';
        newRunPos = newSteps - 51; // 51 -> runPos 0
        if (newRunPos === 5) {
          newState = 'won';
          earnsExtraTurn = true;
        }
      } else {
        newPos = (t.pos + rollVal) % 52;
      }
    } else if (t.state === 'run') {
      newRunPos += rollVal;
      if (newRunPos === 5) {
        newState = 'won';
        earnsExtraTurn = true;
      }
    }

    let nextTokens = [...tokens];
    nextTokens[tIndex] = { ...t, state: newState, pos: newPos, runPos: newRunPos };

    // Check Captures
    if (newState === 'active' && !SAFE_SPOTS.includes(newPos)) {
      // Find enemies at newPos
      const enemies = nextTokens.filter(enemy => enemy.player !== t.player && enemy.state === 'active' && enemy.pos === newPos);
      if (enemies.length > 0) {
        // Capture! Send them home.
        enemies.forEach(e => {
          const eIdx = nextTokens.findIndex(x => x.id === e.id);
          nextTokens[eIdx] = { ...e, state: 'home', pos: -1, runPos: -1 };
        });
        capturedSomeone = true;
        earnsExtraTurn = true;
      }
    }

    setTokens(nextTokens);
    
    // Check Win
    const playerWon = nextTokens.filter(x => x.player === t.player && x.state === 'won').length === 4;
    if (playerWon) {
      setWinner(t.player);
      setMessage(`${PLAYER_INFO[t.player].name} Wins!`);
      return;
    }

    if (earnsExtraTurn) {
      setMessage(`${PLAYER_INFO[t.player].name} gets another turn!`);
      setHasRolled(false);
      setDice(null);
      if (t.player >= humanCount) {
        setTimeout(() => aiTurn(t.player), 1200);
      }
    } else {
      nextTurn(false);
    }
  };

  const nextTurn = (extraTurn = false) => {
    const { turn } = stateRef.current;
    if (extraTurn) {
      setHasRolled(false);
      setDice(null);
      if (turn >= humanCount) setTimeout(() => aiTurn(turn), 1000);
      return;
    }
    
    const nxt = (turn + 1) % 4;
    setTurn(nxt);
    setHasRolled(false);
    setDice(null);
    setMessage(nxt < humanCount ? `${PLAYER_INFO[nxt].name}, your turn! Roll the dice.` : `${PLAYER_INFO[nxt].name}'s turn...`);
    
    if (nxt >= humanCount) {
      setTimeout(() => aiTurn(nxt), 1200);
    }
  };

  const aiTurn = (pIndex) => {
    if (stateRef.current.winner !== null || stateRef.current.turn !== pIndex) return;
    const val = Math.floor(Math.random() * 6) + 1;
    setDice(val);
    setHasRolled(true);
    processTurn(val, pIndex);
  };

  // Human interaction
  const handleTokenClick = (t) => {
    const { turn, hasRolled, dice, winner } = stateRef.current;
    if (winner || turn >= humanCount || !hasRolled || t.player !== turn) return;
    
    // Validate if this specific token can move
    if (t.state === 'won') return;
    if (t.state === 'home' && dice !== 6) return;
    if (t.state === 'run' && t.runPos + dice > 5) return;
    
    moveToken(t.id, dice);
  };

  // Rendering helpers
  const getTokenCoords = (t) => {
    if (t.state === 'home') {
      const idx = parseInt(t.id.split('-t')[1], 10);
      return PLAYER_INFO[t.player].spots[idx];
    }
    if (t.state === 'active') {
      return path[t.pos];
    }
    if (t.state === 'run') {
      return PLAYER_INFO[t.player].homeRun[t.runPos];
    }
    // Won
    return [7.5, 7.5]; // Center
  };

  if (setupMode) {
    return (
      <div style={{
        background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
        color: '#fff', textAlign: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '22px' }}>Ludo Setup</h3>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>How many human players?</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              onClick={() => setHumanCount(num)}
              style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: humanCount === num ? '#0a84ff' : 'rgba(255,255,255,0.1)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {num}
            </button>
          ))}
        </div>
        <p style={{ margin: 0, opacity: 0.6, fontSize: '12px' }}>
          Remaining {4 - humanCount} players will be AI.
        </p>
        <button
          onClick={() => {
            setSetupMode(false);
            setMessage(humanCount > 0 ? `${PLAYER_INFO[0].name}, your turn! Roll the dice.` : `AI is playing...`);
            if (humanCount === 0) setTimeout(() => aiTurn(0), 1000); // If 0 humans (AI only mode possible?)
          }}
          style={{
            marginTop: '8px', padding: '14px 32px', background: '#30d158',
            color: '#fff', border: 'none', borderRadius: '24px',
            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
      userSelect: 'none', touchAction: 'none'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <div style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>{message}</div>
        
        <div 
          onClick={rollDice}
          style={{ 
            width: '42px', height: '42px', background: '#fff', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 'bold', color: '#000',
            cursor: (!hasRolled && turn < humanCount && !winner) ? 'pointer' : 'default',
            opacity: (!hasRolled && turn < humanCount && !winner) ? 1 : 0.6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'transform 0.1s'
          }}
        >
          {dice || '?'}
        </div>
      </div>

      <div style={{
        position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '1/1',
        background: '#fff', borderRadius: '12px', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <svg viewBox="0 0 15 15" width="100%" height="100%">
          {/* Base Grid */}
          <rect width="15" height="15" fill="#f0f0f0" />
          
          {/* 4 Home Squares */}
          <rect x="0" y="0" width="6" height="6" fill="#ff3b30" />
          <rect x="9" y="0" width="6" height="6" fill="#34c759" />
          <rect x="9" y="9" width="6" height="6" fill="#ffcc00" />
          <rect x="0" y="9" width="6" height="6" fill="#007aff" />
          
          {/* Inner Home White Squares */}
          <rect x="1" y="1" width="4" height="4" fill="#fff" rx="0.5" />
          <rect x="10" y="1" width="4" height="4" fill="#fff" rx="0.5" />
          <rect x="10" y="10" width="4" height="4" fill="#fff" rx="0.5" />
          <rect x="1" y="10" width="4" height="4" fill="#fff" rx="0.5" />

          {/* Draw Grid Lines for paths */}
          {Array.from({length: 15}).map((_, i) => (
            <g key={`grid-${i}`}>
              <line x1={i} y1="0" x2={i} y2="15" stroke="rgba(0,0,0,0.1)" strokeWidth="0.05" />
              <line x1="0" y1={i} x2="15" y2={i} stroke="rgba(0,0,0,0.1)" strokeWidth="0.05" />
            </g>
          ))}

          {/* Home Runs (Colored Paths to Center) */}
          {PLAYER_INFO[0].homeRun.map(([x, y]) => <rect key={`hr0-${x}-${y}`} x={x} y={y} width="1" height="1" fill="#ff3b30" opacity="0.6"/>)}
          {PLAYER_INFO[1].homeRun.map(([x, y]) => <rect key={`hr1-${x}-${y}`} x={x} y={y} width="1" height="1" fill="#34c759" opacity="0.6"/>)}
          {PLAYER_INFO[2].homeRun.map(([x, y]) => <rect key={`hr2-${x}-${y}`} x={x} y={y} width="1" height="1" fill="#ffcc00" opacity="0.6"/>)}
          {PLAYER_INFO[3].homeRun.map(([x, y]) => <rect key={`hr3-${x}-${y}`} x={x} y={y} width="1" height="1" fill="#007aff" opacity="0.6"/>)}

          {/* Safe Spots */}
          {SAFE_SPOTS.map((idx, i) => {
            const [x,y] = path[idx];
            return (
              <circle key={`safe-${i}`} cx={x+0.5} cy={y+0.5} r="0.3" fill="rgba(0,0,0,0.15)" />
            )
          })}

          {/* Center Triangle/Square */}
          <polygon points="6,6 9,6 7.5,7.5" fill="#34c759" />
          <polygon points="9,6 9,9 7.5,7.5" fill="#ffcc00" />
          <polygon points="6,9 9,9 7.5,7.5" fill="#007aff" />
          <polygon points="6,6 6,9 7.5,7.5" fill="#ff3b30" />

          {/* Draw Tokens */}
          {tokens.map(t => {
            if (t.state === 'won') return null; // Hide won tokens in center to avoid clutter
            const [x, y] = getTokenCoords(t);
            const isMyTurn = turn < humanCount && t.player === turn && hasRolled;
            const canMove = isMyTurn && (
              (t.state === 'home' && dice === 6) ||
              (t.state === 'active') ||
              (t.state === 'run' && t.runPos + dice <= 5)
            );

            // Slightly offset tokens that share the same spot
            const sharingTokens = tokens.filter(x => x.state !== 'home' && x.state !== 'won' && x.pos === t.pos && x.runPos === t.runPos);
            const shareIndex = sharingTokens.findIndex(x => x.id === t.id);
            let ox = 0, oy = 0;
            if (sharingTokens.length > 1 && t.state !== 'home') {
              ox = (shareIndex % 2 === 0 ? -0.15 : 0.15);
              oy = (shareIndex < 2 ? -0.15 : 0.15);
            }

            return (
              <circle
                key={t.id}
                cx={x + (t.state === 'home' ? 0 : 0.5) + ox}
                cy={y + (t.state === 'home' ? 0 : 0.5) + oy}
                r="0.35"
                fill={PLAYER_INFO[t.player].color}
                stroke="#fff"
                strokeWidth="0.08"
                onClick={() => handleTokenClick(t)}
                style={{
                  cursor: canMove ? 'pointer' : 'default',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  filter: canMove ? 'drop-shadow(0px 0px 2px rgba(255,255,255,0.8))' : 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))',
                  transformOrigin: `${x+0.5}px ${y+0.5}px`,
                  animation: canMove ? 'pulseToken 1.5s infinite' : 'none'
                }}
              />
            )
          })}
        </svg>
      </div>
      
      {winner !== null && (
        <button 
          onClick={() => { setSetupMode(true); setTokens(getInitialTokens()); setWinner(null); setTurn(0); setHasRolled(false); setDice(null); }}
          style={{ padding: '12px 24px', background: '#0a84ff', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Play Again
        </button>
      )}

      <style>{`
        @keyframes pulseToken {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
