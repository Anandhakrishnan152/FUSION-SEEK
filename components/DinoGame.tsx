import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Play, Trophy, AlertTriangle } from 'lucide-react';

interface DinoGameProps {
    onClose: () => void;
}

export const DinoGame: React.FC<DinoGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER'>('START');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Game constants
    const DINO_WIDTH = 40;
    const DINO_HEIGHT = 40;
    const GRAVITY = 0.6;
    const JUMP_FORCE = -10;
    const SPEED = 5;

    // Refs for game loop to avoid stale state in closures
    const stateRef = useRef({
        dinoY: 200,
        dinoVy: 0,
        isJumping: false,
        obstacles: [] as { x: number; w: number; h: number }[],
        score: 0,
        gameSpeed: SPEED,
        frameCount: 0
    });

    const requestRef = useRef<number>();

    const initGame = () => {
        stateRef.current = {
            dinoY: 200,
            dinoVy: 0,
            isJumping: false,
            obstacles: [],
            score: 0,
            gameSpeed: SPEED,
            frameCount: 0
        };
        setScore(0);
        setGameState('PLAYING');
    };

    const jump = () => {
        if (!stateRef.current.isJumping && gameState === 'PLAYING') {
            stateRef.current.dinoVy = JUMP_FORCE;
            stateRef.current.isJumping = true;
        } else if (gameState !== 'PLAYING') {
            initGame();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const gameLoop = () => {
            // Update
            const state = stateRef.current;
            state.frameCount++;

            // Dino Physics
            state.dinoVy += GRAVITY;
            state.dinoY += state.dinoVy;

            // Ground collision
            const groundY = canvas.height - 50;
            if (state.dinoY > groundY - DINO_HEIGHT) {
                state.dinoY = groundY - DINO_HEIGHT;
                state.dinoVy = 0;
                state.isJumping = false;
            }

            // Spawn Obstacles
            if (state.frameCount % 100 === 0) { // Approx every 1.5-2 seconds
                if (Math.random() > 0.3) {
                    state.obstacles.push({
                        x: canvas.width,
                        w: 20 + Math.random() * 30,
                        h: 30 + Math.random() * 20
                    });
                }
            }

            // Update Obstacles
            state.obstacles.forEach(obs => {
                obs.x -= state.gameSpeed;
            });

            // Remove off-screen obstacles
            state.obstacles = state.obstacles.filter(obs => obs.x + obs.w > 0);

            // Collision Detection
            const dinoRect = { x: 50, y: state.dinoY, w: DINO_WIDTH - 10, h: DINO_HEIGHT - 10 }; // Hitbox slightly smaller

            for (const obs of state.obstacles) {
                const obsRect = { x: obs.x, y: groundY - obs.h, w: obs.w, h: obs.h };

                if (
                    dinoRect.x < obsRect.x + obsRect.w &&
                    dinoRect.x + dinoRect.w > obsRect.x &&
                    dinoRect.y < obsRect.y + obsRect.h &&
                    dinoRect.y + dinoRect.h > obsRect.y
                ) {
                    setGameState('GAME_OVER');
                    if (state.score > highScore) setHighScore(state.score);
                    cancelAnimationFrame(requestRef.current!);
                    return;
                }
            }

            // Score
            if (state.frameCount % 10 === 0) {
                state.score++;
                setScore(state.score);
                // Speed up slightly
                if (state.score % 100 === 0) state.gameSpeed += 0.5;
            }

            // Draw
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Ground
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, groundY, canvas.width, 2);

            // Dino (Cyber Style)
            ctx.fillStyle = '#6366f1'; // Indigo
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#6366f1';
            ctx.fillRect(50, state.dinoY, DINO_WIDTH, DINO_HEIGHT);
            // Eye
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
            ctx.fillRect(50 + DINO_WIDTH - 10, state.dinoY + 5, 4, 4);

            // Obstacles
            ctx.fillStyle = '#f43f5e'; // Rose
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#f43f5e';
            state.obstacles.forEach(obs => {
                ctx.fillRect(obs.x, groundY - obs.h, obs.w, obs.h);
            });

            requestRef.current = requestAnimationFrame(gameLoop);
        };

        requestRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, highScore]);

    // Initial Draw
    useEffect(() => {
        if (gameState === 'START') {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#1e293b';
                ctx.font = '20px "JetBrains Mono"';
                ctx.fillText("PRESS SPACE TO SYNC", 100, 150);
            }
        }
    }, [gameState]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#020617] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-amber-500 animate-pulse" />
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase">Sync Failure</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connection Lost</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SCORE</div>
                            <div className="text-2xl font-black text-white mono">{score.toString().padStart(5, '0')}</div>
                        </div>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={440}
                        height={250}
                        className="w-full bg-black/40 rounded-xl border border-white/5 mb-6 touch-none"
                        onClick={jump}
                    />

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Trophy className="text-emerald-400" size={16} />
                            <span className="text-xs font-bold text-indigo-400">HI: {highScore.toString().padStart(5, '0')}</span>
                        </div>

                        <div className="flex gap-4">
                            {gameState !== 'PLAYING' && (
                                <button
                                    onClick={initGame}
                                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    <Play size={14} /> {gameState === 'START' ? 'Start Protocol' : 'Retry Sync'}
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="text-slate-500 hover:text-white px-4 py-2 text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    {gameState === 'GAME_OVER' && (
                        <div className="absolute inset-0 top-20 flex flex-col items-center justify-center pointer-events-none">
                            <h2 className="text-4xl font-black text-rose-500 italic uppercase mb-2 drop-shadow-lg">SYNC FAILED</h2>
                            <p className="text-xs font-bold text-white mb-4 bg-black/50 px-3 py-1 rounded-full">COLLISION DETECTED</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
