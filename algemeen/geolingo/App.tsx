import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  RefreshCw, 
  Trophy, 
  Info, 
  Map as MapIcon, 
  ChevronRight, 
  History,
  Settings,
  HelpCircle,
  X,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GEOGRAPHY_WORDS, GEOGRAPHY_CATEGORIES, type GeoWord } from './data/words';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MAX_GUESSES = 5;

type GameStatus = 'playing' | 'won' | 'lost';

interface Guess {
  word: string;
  result: ('correct' | 'present' | 'absent')[];
}

export default function App() {
  const [targetWord, setTargetWord] = useState<GeoWord | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle Categorieën');
  const [wordLength, setWordLength] = useState<number>(5);
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem('geolingo_score');
    return saved ? parseInt(saved) : 0;
  });
  const [showDefinition, setShowDefinition] = useState(false);
  const [shake, setShake] = useState(false);

  // Persistence for score
  useEffect(() => {
    localStorage.setItem('geolingo_score', score.toString());
  }, [score]);

  // Initialize game
  const startNewGame = useCallback(() => {
    const filteredWords = GEOGRAPHY_WORDS.filter(w => 
      (selectedCategory === 'Alle Categorieën' || w.category === selectedCategory) &&
      w.word.length === wordLength
    );
    
    let randomWord: GeoWord;
    if (filteredWords.length === 0) {
      const anyWordOfLength = GEOGRAPHY_WORDS.filter(w => w.word.length === wordLength);
      randomWord = anyWordOfLength[Math.floor(Math.random() * anyWordOfLength.length)];
    } else {
      randomWord = filteredWords[Math.floor(Math.random() * filteredWords.length)];
    }
    
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess('');
    setStatus('playing');
    setShowDefinition(false);
  }, [selectedCategory, wordLength]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const checkGuess = (guess: string, target: string) => {
    const result: ('correct' | 'present' | 'absent')[] = Array(target.length).fill('absent');
    const targetArr = target.split('');
    const guessArr = guess.split('');

    guessArr.forEach((char, i) => {
      if (char === targetArr[i]) {
        result[i] = 'correct';
        targetArr[i] = '';
      }
    });

    guessArr.forEach((char, i) => {
      if (result[i] !== 'correct') {
        const targetIndex = targetArr.indexOf(char);
        if (targetIndex !== -1) {
          result[i] = 'present';
          targetArr[targetIndex] = '';
        }
      }
    });

    return result;
  };

  const handleKeyPress = useCallback((key: string) => {
    if (status !== 'playing') return;

    if (key === 'Enter') {
      if (currentGuess.length !== targetWord?.word.length) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      const result = checkGuess(currentGuess, targetWord.word);
      const newGuess = { word: currentGuess, result };
      const newGuesses = [...guesses, newGuess];
      setGuesses(newGuesses);
      setCurrentGuess('');

      if (currentGuess === targetWord.word) {
        setStatus('won');
        setScore(s => s + (MAX_GUESSES - guesses.length) * 10);
        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00ff9d', '#facc15', '#ff3e00']
        });
      } else if (newGuesses.length >= MAX_GUESSES) {
        setStatus('lost');
      }
    } else if (key === 'Backspace') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/i.test(key) && currentGuess.length < (targetWord?.word.length || 0)) {
      setCurrentGuess(prev => (prev + key).toUpperCase());
    }
  }, [currentGuess, targetWord, status, guesses]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      handleKeyPress(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress]);

  const renderGrid = () => {
    if (!targetWord) return null;
    const rows = [];
    
    for (let i = 0; i < MAX_GUESSES; i++) {
      const guess = guesses[i];
      const isCurrent = i === guesses.length && status === 'playing';
      
      const cells = [];
      for (let j = 0; j < targetWord.word.length; j++) {
        let char = '';
        let cellStatus: 'correct' | 'present' | 'absent' | 'active' | 'empty' = 'empty';

        if (guess) {
          char = guess.word[j];
          cellStatus = guess.result[j];
        } else if (isCurrent) {
          char = currentGuess[j] || '';
          if (j === 0 && currentGuess.length === 0) {
            char = targetWord.word[0];
          }
          cellStatus = j === currentGuess.length ? 'active' : 'empty';
        } else if (i === 0 && guesses.length === 0) {
           if (j === 0) char = targetWord.word[0];
        }

        cells.push(
          <motion.div 
            key={j} 
            initial={guess ? { rotateX: -90 } : false}
            animate={guess ? { rotateX: 0 } : false}
            transition={{ delay: j * 0.1 }}
            className={cn(
              "lingo-cell",
              cellStatus === 'correct' && "lingo-cell-correct",
              cellStatus === 'present' && "lingo-cell-present",
              cellStatus === 'absent' && "lingo-cell-absent",
              cellStatus === 'active' && "lingo-cell-active",
              isCurrent && shake && "animate-shake"
            )}
          >
            {char}
          </motion.div>
        );
      }
      rows.push(<div key={i} className="flex gap-2 mb-2 justify-center">{cells}</div>);
    }
    return rows;
  };

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
  ];

  const getKeyState = (key: string): 'correct' | 'present' | 'absent' | 'none' => {
    let state: 'correct' | 'present' | 'absent' | 'none' = 'none';
    guesses.forEach(g => {
      g.word.split('').forEach((char, i) => {
        if (char === key) {
          const res = g.result[i];
          if (res === 'correct') state = 'correct';
          else if (res === 'present' && state !== 'correct') state = 'present';
          else if (res === 'absent' && state === 'none') state = 'absent';
        }
      });
    });
    return state;
  };

  const keyStyles = {
    none: "bg-slate-800 text-slate-300 hover:bg-slate-700 border-b-4 border-slate-950",
    correct: "bg-geo-neon text-geo-dark border-b-4 border-emerald-900 shadow-[0_0_15px_rgba(0,255,157,0.3)]",
    present: "bg-geo-gold text-geo-dark border-b-4 border-amber-900 shadow-[0_0_15px_rgba(250,204,21,0.2)]",
    absent: "bg-slate-900 text-slate-600 border-b-4 border-black opacity-50"
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center min-h-screen relative overflow-hidden">
      <div className="scanline" />
      
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-12 cyber-panel p-6">
        <div className="flex items-center gap-4">
          <div className="bg-geo-neon p-3 rotate-3 shadow-[0_0_20px_rgba(0,255,157,0.3)]">
            <Compass className="text-geo-dark w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white font-display italic uppercase">GeoLingo</h1>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-geo-neon animate-ping" />
              <p className="text-[10px] text-geo-neon font-mono uppercase tracking-[0.3em]">Cyber-Explorer Terminal v2.0</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Global Score</p>
            <p className="text-3xl font-black text-geo-neon font-mono">{score.toString().padStart(5, '0')}</p>
          </div>
          <button 
            onClick={() => setShowDefinition(true)}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-geo-neon hover:text-geo-dark transition-all border border-slate-700"
          >
            <HelpCircle size={24} />
          </button>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 w-full flex flex-col items-center justify-center gap-10">
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <div className="relative group">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 text-geo-neon border border-geo-neon/30 px-6 py-2 text-xs font-black uppercase tracking-widest outline-none appearance-none pr-10 hover:bg-slate-700 cursor-pointer"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
            >
              <option>Alle Categorieën</option>
              {GEOGRAPHY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-geo-neon pointer-events-none rotate-90" size={14} />
          </div>

          <div className="flex bg-slate-800 p-1 border border-slate-700">
            {[5, 6, 7].map(len => (
              <button
                key={len}
                onClick={() => setWordLength(len)}
                className={cn(
                  "px-6 py-1 text-xs font-black transition-all",
                  wordLength === len ? "bg-geo-neon text-geo-dark" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {len}L
              </button>
            ))}
          </div>

          <button 
            onClick={startNewGame}
            className="cyber-button cyber-button-secondary py-2"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>

        {/* The Grid */}
        <div className="relative">
          <div className="absolute -inset-4 bg-geo-neon/5 blur-2xl rounded-full pointer-events-none" />
          <div className="grid gap-3">
            {renderGrid()}
          </div>
        </div>

        {/* Keyboard */}
        <div className="w-full max-w-2xl mt-8 cyber-panel p-6 bg-slate-900/40">
          {keyboardRows.map((row, i) => (
            <div key={i} className="flex justify-center gap-2 mb-2">
              {row.map(key => {
                const state = getKeyState(key);
                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className={cn(
                      "px-2 py-4 sm:px-4 sm:py-5 font-mono font-black text-sm transition-all active:translate-y-1 active:border-b-0",
                      key.length > 1 ? "flex-grow sm:flex-none px-6" : "w-10 sm:w-14",
                      keyStyles[state]
                    )}
                  >
                    {key === 'Backspace' ? 'DEL' : key === 'Enter' ? 'GO' : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {(status !== 'playing') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-geo-dark/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, rotateY: 90 }}
              animate={{ scale: 1, rotateY: 0 }}
              className="cyber-panel p-10 max-w-xl w-full text-center"
            >
              <div className={cn(
                "w-24 h-24 mx-auto flex items-center justify-center mb-8 border-4 rotate-45",
                status === 'won' ? "border-geo-neon text-geo-neon shadow-[0_0_30px_rgba(0,255,157,0.4)]" : "border-geo-accent text-geo-accent shadow-[0_0_30px_rgba(255,62,0,0.4)]"
              )}>
                <div className="-rotate-45">
                  {status === 'won' ? <Zap size={48} /> : <AlertTriangle size={48} />}
                </div>
              </div>

              <h2 className="text-5xl font-black mb-4 font-display italic uppercase tracking-tighter">
                {status === 'won' ? 'Data Gevonden!' : 'Systeemfout'}
              </h2>
              
              <div className="bg-slate-800/50 p-8 border-l-4 border-geo-neon mb-8 text-left">
                <p className="text-[10px] uppercase font-black text-geo-neon tracking-[0.4em] mb-4">Geografisch Object</p>
                <p className="text-6xl font-black text-white tracking-tighter mb-4 font-mono">{targetWord?.word}</p>
                <div className="h-px bg-slate-700 w-full mb-4" />
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {targetWord?.definition}
                </p>
              </div>

              <button 
                onClick={startNewGame}
                className="w-full cyber-button cyber-button-primary text-xl py-5"
              >
                Start Nieuwe Missie <ChevronRight size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}

        {showDefinition && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-geo-dark/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            onClick={() => setShowDefinition(false)}
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="cyber-panel p-10 max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black font-display italic uppercase tracking-tighter flex items-center gap-3">
                  <Info className="text-geo-neon" /> Missie Protocol
                </h2>
                <button onClick={() => setShowDefinition(false)} className="text-slate-500 hover:text-geo-neon transition-colors">
                  <X size={32} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid gap-6">
                  <div className="flex items-center gap-6 group">
                    <div className="w-16 h-16 bg-geo-neon flex items-center justify-center text-geo-dark text-3xl font-black font-mono shadow-[0_0_20px_rgba(0,255,157,0.3)]">G</div>
                    <div>
                      <p className="text-geo-neon font-black uppercase text-xs tracking-widest mb-1">Correcte Positie</p>
                      <p className="text-slate-400 text-sm">De letter staat op de exacte geografische locatie.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 group">
                    <div className="w-16 h-16 bg-geo-gold rounded-full flex items-center justify-center text-geo-dark text-3xl font-black font-mono shadow-[0_0_20px_rgba(250,204,21,0.2)]">E</div>
                    <div>
                      <p className="text-geo-gold font-black uppercase text-xs tracking-widest mb-1">Aanwezig</p>
                      <p className="text-slate-400 text-sm">De letter is aanwezig in het gebied, maar op een andere coördinaat.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 group">
                    <div className="w-16 h-16 bg-slate-800 flex items-center justify-center text-slate-500 text-3xl font-black font-mono border border-slate-700">O</div>
                    <div>
                      <p className="text-slate-500 font-black uppercase text-xs tracking-widest mb-1">Niet Gevonden</p>
                      <p className="text-slate-400 text-sm">Deze letter komt niet voor in het doel-begrip.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-6 border-l-2 border-geo-neon mt-10">
                  <p className="text-sm font-medium text-slate-300 leading-relaxed">
                    <b className="text-geo-neon uppercase tracking-widest text-xs block mb-2">Missie Protocol:</b>
                    Raad het geografische begrip binnen 5 beurten. Gebruik de hints om de juiste coördinaten te vinden.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowDefinition(false)}
                className="w-full mt-10 cyber-button cyber-button-secondary py-4"
              >
                Initialiseer Terminal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-16 text-slate-600 font-mono text-[10px] flex flex-col items-center gap-4 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-8">
          <span className="flex items-center gap-2 border-b border-slate-800 pb-1"><MapIcon size={12} /> {GEOGRAPHY_WORDS.length} Begrippen</span>
        </div>
        <p className="opacity-50">GeoLingo Terminal // Secure Connection // Offline Mode</p>
      </footer>
    </div>
  );
}
