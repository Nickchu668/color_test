import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Heart, RefreshCw, Trophy, Clock, Globe, Eye, EyeOff, Share2, ExternalLink, Zap, X as XIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

import { Language, LEVELS, TRANSLATIONS } from './types.ts';
import { audioManager } from './utils/audio.ts';
import { generateColors } from './utils/color.ts';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.ZH);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'passed' | 'failed' | 'finished'>('start');
  const [levelIndex, setLevelIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [timer, setTimer] = useState(0);
  const [bestLevel, setBestLevel] = useState(0);
  const [isColorBlind, setIsColorBlind] = useState(false);
  const [gridData, setGridData] = useState<{ base: string; odd: string; oddIndex: number } | null>(null);
  const [highlightOdd, setHighlightOdd] = useState(false);
  const [shake, setShake] = useState(false);
  const [wrongIndices, setWrongIndices] = useState<number[]>([]);

  const timerRef = useRef<number | null>(null);
  const currentLevel = LEVELS[levelIndex];
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const saved = localStorage.getItem('seeclinic_best_level');
    if (saved) setBestLevel(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    const isModalOpen = gameState === 'passed' || gameState === 'failed' || gameState === 'finished';
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [gameState]);

  const initLevel = useCallback(() => {
    const config = LEVELS[levelIndex];
    const { baseColor, oddColor } = generateColors(config.level, config.difficulty);
    const oddIndex = Math.floor(Math.random() * (config.rows * config.cols));
    setGridData({ base: baseColor, odd: oddColor, oddIndex });
    setHighlightOdd(false);
    setWrongIndices([]);
    setGameState('playing');
    setLives(3);
  }, [levelIndex]);

  const handleStart = () => {
    setLevelIndex(0);
    setTimer(0);
    setLives(3);
    initLevel();
  };

  const updateBest = useCallback((score: number) => {
    if (score > bestLevel) {
      setBestLevel(score);
      localStorage.setItem('seeclinic_best_level', score.toString());
    }
  }, [bestLevel]);

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing') return;
    if (wrongIndices.includes(index)) return;

    if (index === gridData?.oddIndex) {
      audioManager.playSuccess();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      if (levelIndex === LEVELS.length - 1) {
        setGameState('finished');
        updateBest(levelIndex + 1);
      } else {
        setGameState('passed');
      }
    } else {
      audioManager.playError();
      setShake(true);
      setWrongIndices(prev => [...prev, index]);
      setTimeout(() => setShake(false), 500);
      
      const newLives = lives - 1;
      setLives(newLives);
      
      if (newLives <= 0) {
        setHighlightOdd(true);
        setTimeout(() => {
          setGameState('failed');
          audioManager.playGameOver();
          updateBest(levelIndex);
        }, 1800);
      }
    }
  };

  const handleNextLevel = () => {
    setLevelIndex(prev => prev + 1);
    initLevel();
  };

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
    const ss = (seconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const reachedCount = gameState === 'finished' ? levelIndex + 1 : levelIndex;

  const downloadResultImage = async () => {
    const element = document.getElementById('game-result-card');
    if (!element) return;
    const canvas = await html2canvas(element, { 
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true 
    });
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `color-test-result-level-${reachedCount}.png`;
    link.click();
  };

  const shareResult = async () => {
    const shareText = lang === Language.ZH 
      ? `我在「色感大測試」達到了第 ${reachedCount} 關！你能比我強嗎？快來挑戰：` 
      : `I reached Level ${reachedCount} in the Color Vision Test! Can you beat me? Challenge yourself here: `;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await downloadResultImage();
        }
      }
    } else {
      await downloadResultImage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 max-w-2xl mx-auto">
      <header className="w-full flex flex-col gap-4 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t.title}</h1>
          <div className="flex gap-2">
             <button 
              onClick={() => setLang(lang === Language.ZH ? Language.EN : Language.ZH)}
              className="p-3 bg-white rounded-full shadow-lg hover:bg-slate-50 transition active:scale-90 border border-slate-100"
              title="Switch Language"
            >
              <Globe size={20} className="text-blue-600" />
            </button>
            <button 
              onClick={() => setIsColorBlind(!isColorBlind)}
              className={`p-3 rounded-full shadow-lg transition active:scale-90 border ${isColorBlind ? 'bg-orange-100 border-orange-200' : 'bg-white border-slate-100'}`}
              title={t.colorBlindMode}
            >
              {isColorBlind ? <EyeOff size={20} className="text-orange-500" /> : <Eye size={20} className="text-slate-400" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="bg-white p-3 rounded-2xl shadow-sm flex items-center justify-between border border-slate-100">
            <span className="text-slate-400 font-bold">{t.level}</span>
            <span className="font-black text-blue-600">{levelIndex + 1}/10</span>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm flex items-center justify-between border border-slate-100">
            <span className="text-slate-400 font-bold flex items-center gap-1"><Clock size={14}/> {t.time}</span>
            <span className="font-mono font-black text-slate-700">{formatTime(timer)}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm flex items-center justify-between border border-slate-100">
            <span className="text-slate-400 font-bold flex items-center gap-1"><Heart size={14} className="text-red-500" /> {t.lives}</span>
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <Heart key={i} size={14} className={`${i < lives ? 'fill-red-500 text-red-500' : 'text-slate-200'}`} />
              ))}
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm flex items-center justify-between border border-slate-100">
            <span className="text-slate-400 font-bold flex items-center gap-1"><Trophy size={14} className="text-yellow-500" /> {t.best}</span>
            <span className="font-black text-slate-700">{bestLevel}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {gameState === 'start' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="text-center w-full max-w-md"
            >
              <div className="p-12 bg-gradient-to-br from-white to-blue-50/30 rounded-[3.5rem] border-[6px] border-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                
                <div className="flex justify-center mb-10">
                  <motion.div 
                    animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="p-6 bg-blue-600 rounded-[2rem] shadow-2xl text-white"
                  >
                    <Zap size={56} fill="white" />
                  </motion.div>
                </div>

                <h2 className="text-4xl font-black text-slate-800 mb-6 leading-tight tracking-tight">
                  {lang === Language.ZH ? "色感大測試" : "Color Vision Test"}
                </h2>
                
                <p className="text-slate-500 mb-12 font-bold text-xl leading-relaxed px-4">
                  {t.normal}
                </p>

                <motion.button 
                  whileHover={{ scale: 1.05, y: -4, boxShadow: "0 25px 50px -12px rgba(37, 99, 235, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStart}
                  className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-blue-200 transition-all tracking-widest uppercase"
                >
                  {t.start}
                </motion.button>
              </div>
            </motion.div>
          )}

          {(gameState === 'playing' || highlightOdd) && gridData && (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`grid gap-2 p-5 bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[500px] aspect-square transition-transform ${shake ? 'animate-shake' : ''}`}
              style={{
                gridTemplateColumns: `repeat(${currentLevel.cols}, 1fr)`,
                gridTemplateRows: `repeat(${currentLevel.rows}, 1fr)`
              }}
            >
              {[...Array(currentLevel.rows * currentLevel.cols)].map((_, i) => (
                <motion.button
                  key={i}
                  whileHover={(!highlightOdd && gameState === 'playing') ? { scale: 1.05, zIndex: 10 } : {}}
                  whileTap={(!highlightOdd && gameState === 'playing') ? { scale: 0.95 } : {}}
                  onClick={() => handleTileClick(i)}
                  className={`rounded-2xl shadow-inner relative overflow-hidden transition-all duration-300 border border-black/5 ${highlightOdd && i === gridData.oddIndex ? 'ring-4 ring-green-500 ring-offset-4 z-20' : ''}`}
                  style={{ backgroundColor: i === gridData.oddIndex ? gridData.odd : gridData.base }}
                >
                  {wrongIndices.includes(i) && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[1px]"
                    >
                      <XIcon className="text-white w-3/4 h-3/4 drop-shadow-md" strokeWidth={6} />
                    </motion.div>
                  )}

                  {isColorBlind && (
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      {i === gridData.oddIndex ? (
                        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #000 20%, transparent 20%)', backgroundSize: '12px 12px' }} />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '12px 12px' }} />
                      )}
                    </div>
                  )}

                  {highlightOdd && i === gridData.oddIndex && (
                    <motion.div 
                      animate={{ y: [0, -20, 0], scale: [1, 1.4, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5, ease: "backOut" }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <span className="text-green-500 drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)] text-6xl font-black">↑</span>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {(gameState === 'passed' || gameState === 'failed' || gameState === 'finished') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 50 }}
              className="relative w-full max-w-sm my-auto"
            >
              <div id="game-result-card" className="bg-white p-10 rounded-[4rem] shadow-2xl border-[8px] border-white w-full text-center relative overflow-hidden">
                {gameState === 'passed' ? (
                  <>
                    <h2 className="text-5xl font-black text-green-500 mb-8 tracking-tighter drop-shadow-sm italic">{t.passed}</h2>
                    <p className="text-slate-600 mb-12 font-black text-2xl">{t.levelReached.replace('{n}', (levelIndex + 1).toString())}</p>
                    <button 
                      onClick={handleNextLevel}
                      className="w-full py-7 bg-green-500 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-green-100 hover:shadow-green-200 transition-all active:scale-95"
                    >
                      {t.next}
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-black text-slate-800 mb-6">{t.gameOver}</h2>
                    <div className="bg-slate-50 p-10 rounded-[3rem] mb-10 border border-slate-100 shadow-inner">
                      <p className="text-8xl font-black text-blue-600 mb-2 drop-shadow-sm">{reachedCount}</p>
                      <p className="text-slate-400 uppercase tracking-[0.4em] text-sm font-black">{t.level}</p>
                    </div>

                    {reachedCount < 6 && (
                      <div className="mb-10 p-10 bg-red-50 text-red-700 rounded-[3rem] text-center border-4 border-red-100/50 shadow-sm">
                        <p className="font-black text-2xl leading-tight mb-10 text-red-600">
                          ⚠️ 閣下色感判斷比較弱, <br />
                          <span className="text-lg font-bold opacity-80">建議給眼科醫生作檢查</span>
                        </p>
                        <div className="flex flex-col gap-5">
                          <a 
                            href="https://seeclinic.hk/ophthalmology_center.asp?class_list_id=23" 
                            target="_blank" 
                            className="flex items-center justify-center gap-4 py-5 px-5 bg-red-600 text-white rounded-[1.5rem] font-black text-xl shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                          >
                            <ExternalLink size={24} strokeWidth={4} /> {t.seeClinic}
                          </a>
                          <a 
                            href="https://www.seedoctor.com.hk/ophthalmology-specialty-doctor.asp?class_list_id=28" 
                            target="_blank" 
                            className="flex items-center justify-center gap-4 py-5 px-5 bg-white text-red-600 border-[4px] border-red-600 rounded-[1.5rem] font-black text-xl shadow-sm hover:bg-red-50 transition-all active:scale-95"
                          >
                            <ExternalLink size={24} strokeWidth={4} /> {t.seeDoctor}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button 
                        onClick={handleStart}
                        className="flex-[2] py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-blue-100 hover:shadow-blue-200 transition-all active:scale-95"
                      >
                        {t.retry}
                      </button>
                      <button 
                        onClick={shareResult}
                        className="flex-1 bg-slate-100 text-slate-500 rounded-[2rem] hover:bg-slate-200 transition-all active:scale-95 border border-slate-200 flex items-center justify-center"
                        title={lang === Language.ZH ? '分享成績及遊戲連結' : 'Share result and link'}
                      >
                        <Share2 size={36} strokeWidth={3} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="w-full mt-12 py-8 border-t border-slate-100 text-center">
        <div className="flex justify-center gap-8 mb-8">
          <button 
            onClick={handleStart}
            className="flex items-center gap-3 px-8 py-3 text-slate-400 hover:text-blue-600 transition font-black bg-white rounded-full shadow-lg border border-slate-50 active:scale-95"
          >
            <RefreshCw size={20} /> {t.reset}
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase">{t.copyright}</p>
          <p className="text-slate-300 text-[9px] font-bold tracking-[0.3em] uppercase opacity-60">All rights reserved • Optimized for Plesk VPS</p>
        </div>
      </footer>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-12px); }
          30% { transform: translateX(12px); }
          45% { transform: translateX(-12px); }
          60% { transform: translateX(12px); }
          75% { transform: translateX(-8px); }
          85% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default App;