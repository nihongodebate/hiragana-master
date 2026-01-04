import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { Timer, Trophy, XCircle, Home, RefreshCw, User, BookOpen, ChevronRight, Gamepad2, EyeOff, Sparkles, Zap, ArrowRightLeft, GraduationCap, Dices, ChevronLeft } from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDGleVoNnnKFH5Yyw3s0wmgYqXYlWMnNd4",
  authDomain: "hiragana-4944d.firebaseapp.com",
  projectId: "hiragana-4944d",
  storageBucket: "hiragana-4944d.firebasestorage.app",
  messagingSenderId: "922292115914",
  appId: "1:922292115914:web:6a86d322756b8090f11733",
  measurementId: "G-5Q6BBT1CQL"
};

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

let firebaseApp, auth, db;
if (isConfigValid) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

const currentAppId = "kana-speed-dash-v2"; 

// --- Constants ---
const HIRAGANA_ROWS = [
  { name: 'あ行', chars: ['あ', 'い', 'う', 'え', 'お'] },
  { name: 'か行', chars: ['か', 'き', 'く', 'け', 'こ'] },
  { name: 'さ行', chars: ['さ', 'し', 'す', 'せ', 'そ'] },
  { name: 'た行', chars: ['た', 'ち', 'つ', 'て', 'と'] },
  { name: 'な行', chars: ['な', 'に', 'ぬ', 'ね', 'の'] },
  { name: 'は行', chars: ['は', 'ひ', 'ふ', 'へ', 'ほ'] },
  { name: 'ま行', chars: ['ま', 'み', 'む', 'め', 'も'] },
  { name: 'や行', chars: ['や', 'ゆ', 'よ'] },
  { name: 'ら行', chars: ['ら', 'り', 'る', 'れ', 'ろ'] },
  { name: 'わ行', chars: ['わ', 'を', 'ん'] },
];

const KATAKANA_ROWS = [
  { name: 'ア行', chars: ['ア', 'イ', 'ウ', 'エ', 'オ'] },
  { name: 'カ行', chars: ['カ', 'キ', 'ク', 'ケ', 'コ'] },
  { name: 'サ行', chars: ['サ', 'シ', 'ス', 'セ', 'ソ'] },
  { name: 'タ行', chars: ['タ', 'チ', 'ツ', 'テ', 'ト'] },
  { name: 'ナ行', chars: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'] },
  { name: 'ハ行', chars: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'] },
  { name: 'マ行', chars: ['マ', 'ミ', 'ム', 'メ', 'モ'] },
  { name: 'ヤ行', chars: ['ヤ', 'ユ', 'ヨ'] },
  { name: 'ラ行', chars: ['ラ', 'リ', 'ル', 'レ', 'ロ'] },
  { name: 'ワ行', chars: ['ワ', 'ヲ', 'ン'] },
];

const ROMAJI_MAP = {
  // Hiragana
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n',
  // Katakana
  'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
  'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
  'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
  'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
  'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
  'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
  'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
  'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
  'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
  'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n'
};

const ALL_HIRAGANA = HIRAGANA_ROWS.flatMap(r => r.chars);
const ALL_KATAKANA = KATAKANA_ROWS.flatMap(r => r.chars);
const ALL_ROMAJI = Array.from(new Set(Object.values(ROMAJI_MAP)));

const App = () => {
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState('HOME'); 
  const [charType, setCharType] = useState('HIRAGANA');
  const [mode, setMode] = useState('GAME_HINT'); 
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [targetCharIndex, setTargetCharIndex] = useState(0);
  const [randomTarget, setRandomTarget] = useState('');
  const [scoreCount, setScoreCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [cards, setCards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userName, setUserName] = useState('');
  const [hintCardId, setHintCardId] = useState(null);
  const [isError, setIsError] = useState(false);
  const [firebaseError, setFirebaseError] = useState(!isConfigValid);
  
  const timerRef = useRef(null);
  const scoreRef = useRef(0);

  // --- Fix for Service Worker registration error ---
  useEffect(() => {
    const protocol = window.location.protocol;
    if ('serviceWorker' in navigator && (protocol === 'http:' || protocol === 'https:')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch(err => {
          console.error('SW registration failed', err);
        });
      });
    }
  }, []);

  useEffect(() => {
    if (!isConfigValid || !auth) {
      setFirebaseError(true);
      return;
    }
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        setFirebaseError(true);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const q = collection(db, 'artifacts', currentAppId, 'public', 'data', 'leaderboard');
    const unsubscribeLb = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeaderboard(docs);
    });
    return () => unsubscribeLb();
  }, [user]);

  const generateCards = useCallback((rowIndex, currentMode, specificTarget = null) => {
    const isRomajiSelect = currentMode.includes('ROMAJI');
    const kanaPool = charType === 'HIRAGANA' ? ALL_HIRAGANA : ALL_KATAKANA;
    
    if (currentMode.includes('RANDOM')) {
      const target = specificTarget || kanaPool[Math.floor(Math.random() * kanaPool.length)];
      const correctVal = isRomajiSelect ? ROMAJI_MAP[target] : target;
      const otherPool = isRomajiSelect ? ALL_ROMAJI.filter(v => v !== correctVal) : kanaPool.filter(v => v !== target);
      const distractors = [];
      const tempPool = [...otherPool];
      while (distractors.length < 9) {
        const idx = Math.floor(Math.random() * tempPool.length);
        distractors.push(tempPool.splice(idx, 1)[0]);
      }
      const combined = [correctVal, ...distractors].map(val => ({ val, id: Math.random() }));
      return { cards: combined.sort(() => Math.random() - 0.5), target };
    } else {
      const rows = charType === 'HIRAGANA' ? HIRAGANA_ROWS : KATAKANA_ROWS;
      const correctChars = rows[rowIndex].chars;
      let combined = [];
      if (currentMode.includes('PRACTICE')) {
        combined = correctChars.map(char => ({ val: isRomajiSelect ? ROMAJI_MAP[char] : char, id: Math.random() }));
      } else {
        const targetPool = isRomajiSelect ? ALL_ROMAJI : kanaPool;
        const correctVals = isRomajiSelect ? correctChars.map(c => ROMAJI_MAP[c]) : correctChars;
        const others = targetPool.filter(v => !correctVals.includes(v));
        const fakeVals = [];
        while (fakeVals.length < 5) {
          const rand = others[Math.floor(Math.random() * others.length)];
          if (!fakeVals.includes(rand)) fakeVals.push(rand);
        }
        combined = [...correctVals, ...fakeVals].map(val => ({ val, id: Math.random() }));
      }
      return { cards: combined.sort(() => Math.random() - 0.5) };
    }
  }, [charType]);

  const startSession = (selectedMode) => {
    setMode(selectedMode);
    setCurrentRowIndex(0);
    setTargetCharIndex(0);
    setMissCount(0);
    setElapsedTime(0);
    setScoreCount(0);
    scoreRef.current = 0;
    setTimeLeft(60);
    setIsError(false);
    setHintCardId(null);
    const result = generateCards(0, selectedMode);
    setCards(result.cards);
    if (selectedMode.includes('RANDOM')) setRandomTarget(result.target);
    setGameState('PLAYING');
    setStartTime(Date.now());
  };

  const handleReturnHome = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('HOME');
    setIsError(false);
  };

  useEffect(() => {
    if (gameState === 'PLAYING' && startTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const diff = now - startTime;
        if (mode.includes('RANDOM')) {
          const remaining = Math.max(0, (60000 - diff) / 1000);
          setTimeLeft(remaining);
          if (remaining <= 0) {
            clearInterval(timerRef.current);
            setGameState('CLEAR');
            saveScore(scoreRef.current, 'COUNT', mode);
          }
        } else if (!mode.includes('PRACTICE')) {
          setElapsedTime(diff);
        }
      }, 50); 
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, mode, startTime]);

  useEffect(() => {
    if (mode.includes('PRACTICE') && gameState === 'PLAYING') {
      setHintCardId(null);
      const timer = setTimeout(() => {
        const rows = charType === 'HIRAGANA' ? HIRAGANA_ROWS : KATAKANA_ROWS;
        const target = rows[currentRowIndex].chars[targetCharIndex];
        const correctVal = mode.includes('ROMAJI') ? ROMAJI_MAP[target] : target;
        const targetCard = cards.find(c => c.val === correctVal);
        if (targetCard) setHintCardId(targetCard.id);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [targetCharIndex, currentRowIndex, mode, gameState, cards, charType]);

  const handleCardClick = (card) => {
    if (gameState !== 'PLAYING') return;
    let correctVal = '';
    let targetChar = '';
    if (mode.includes('RANDOM')) {
      targetChar = randomTarget;
      correctVal = mode.includes('ROMAJI') ? ROMAJI_MAP[targetChar] : targetChar;
    } else {
      const rows = charType === 'HIRAGANA' ? HIRAGANA_ROWS : KATAKANA_ROWS;
      targetChar = rows[currentRowIndex].chars[targetCharIndex];
      correctVal = mode.includes('ROMAJI') ? ROMAJI_MAP[targetChar] : targetChar;
    }

    if (card.val === correctVal) {
      setIsError(false);
      if (mode.includes('RANDOM')) {
        const newScore = scoreCount + 1;
        setScoreCount(newScore);
        scoreRef.current = newScore;
        const next = generateCards(0, mode);
        setCards(next.cards);
        setRandomTarget(next.target);
      } else {
        const rows = charType === 'HIRAGANA' ? HIRAGANA_ROWS : KATAKANA_ROWS;
        if (targetCharIndex + 1 < rows[currentRowIndex].chars.length) {
          setTargetCharIndex(targetCharIndex + 1);
        } else {
          if (currentRowIndex + 1 < rows.length) {
            const nextIndex = currentRowIndex + 1;
            setCurrentRowIndex(nextIndex);
            setTargetCharIndex(0);
            const next = generateCards(nextIndex, mode);
            setCards(next.cards);
          } else {
            setGameState('CLEAR');
            if (!mode.includes('PRACTICE')) saveScore(elapsedTime, 'TIME', mode);
          }
        }
      }
    } else {
      setIsError(true);
      if (!mode.includes('PRACTICE')) {
        const nextMissCount = missCount + 1;
        setMissCount(nextMissCount);
        if (nextMissCount >= 5) {
          setGameState('GAMEOVER');
          if (mode.includes('RANDOM')) saveScore(scoreCount, 'COUNT', mode);
        }
      }
    }
  };

  const saveScore = async (val, type, currentMode) => {
    if (!user || !db) return;
    try {
      await addDoc(collection(db, 'artifacts', currentAppId, 'public', 'data', 'leaderboard'), {
        userId: user.uid,
        userName: userName || 'Anonymous Learner',
        score: val,
        scoreType: type, 
        mode: currentMode,
        charType: charType,
        date: new Date().toISOString()
      });
    } catch (e) { console.error("Score save failed:", e); }
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
  };

  const renderRankingBox = (title, records, sType) => (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col h-full">
      <h4 className="text-[10px] font-black text-slate-400 mb-2 uppercase border-b border-slate-50 pb-1 leading-tight">{title}</h4>
      <div className="space-y-1.5">
        {records.length === 0 ? <p className="text-[9px] text-slate-300 italic text-center py-2">No records</p> : 
          records.map((entry, i) => (
            <div key={entry.id} className="flex justify-between items-center text-[10px]">
              <span className="flex items-center gap-1.5 truncate max-w-[70%]">
                <span className={`font-black w-3 ${i===0?'text-indigo-600':i===1?'text-slate-400':'text-slate-300'}`}>{i+1}</span>
                <span className="text-slate-600 font-bold truncate">{entry.userName}</span>
              </span>
              <span className="font-mono font-bold text-indigo-500 shrink-0">
                {sType === 'COUNT' ? `${entry.score}pt` : formatTime(entry.score)}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  );

  const getFilteredRecords = (cType, gMode, sType) => {
    return leaderboard
      .filter(e => e.charType === cType && e.mode === gMode && e.scoreType === sType)
      .sort((a, b) => sType === 'COUNT' ? b.score - a.score : a.score - b.score)
      .slice(0, 5);
  };

  const rows = charType === 'HIRAGANA' ? HIRAGANA_ROWS : KATAKANA_ROWS;
  const currentTargetChar = mode.includes('RANDOM') ? randomTarget : rows[currentRowIndex].chars[targetCharIndex];

  return (
    <div className="h-screen bg-slate-50 text-slate-800 flex flex-col font-ud selection:bg-indigo-100 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap');
        .font-ud { font-family: 'BIZ UDPGothic', 'Noto Sans KR', sans-serif; }
        .font-logo { font-family: 'Montserrat', sans-serif; }
        @keyframes hint-pulse { 0% { background-color: #ffffff; } 50% { background-color: #f0fdf4; border-color: #10b981; } 100% { background-color: #ffffff; } }
        .hint-glow { animation: hint-pulse 1.5s infinite; border-width: 2px; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        .text-logo-gradient { background: linear-gradient(135deg, #1e293b 0%, #475569 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}} />

      <header className="flex-none p-3 sm:p-4 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-slate-600" />
          <h1 className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase">KANA MASTER</h1>
        </div>
        {gameState === 'PLAYING' && (
          <div className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <span className="font-mono text-slate-700 text-xs font-bold tabular-nums">
              {mode.includes('RANDOM') ? `${timeLeft.toFixed(1)}s` : formatTime(elapsedTime)}
            </span>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col p-4 max-w-xl mx-auto w-full relative">
        {gameState === 'HOME' && (
          <div className="flex-1 flex flex-col space-y-6 py-2 animate-in fade-in duration-500">
            <div className="text-center space-y-2 py-6">
              <div className="inline-block relative">
                <h2 className="text-5xl font-logo font-black tracking-[-0.05em] text-logo-gradient leading-none">
                  KANA MASTER
                </h2>
                <div className="h-1 w-full bg-indigo-600 rounded-full opacity-30 mt-2" />
              </div>
            </div>

            <div className="space-y-2 flex-none">
              {!firebaseError && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <h4 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2"><User className="w-3 h-3" /> Player Name</h4>
                  <div className="relative">
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-700 transition-all" placeholder="이름을 입력하고 랭킹に 도전하세요!" />
                  </div>
                </div>
              )}
              <button onClick={() => setGameState('RECORDS')} className="w-full bg-slate-900 text-white py-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black shadow-lg shadow-slate-200 active:scale-95 transition-all hover:bg-slate-800">
                <Trophy className="w-4 h-4 text-white/80" /> 랭킹 보기
              </button>
            </div>

            <div className="bg-slate-200/50 p-1 rounded-xl flex w-full max-w-[200px] mx-auto shadow-inner flex-none">
              <button onClick={() => setCharType('HIRAGANA')} className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all ${charType === 'HIRAGANA' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>あ</button>
              <button onClick={() => setCharType('KATAKANA')} className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all ${charType === 'KATAKANA' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>ア</button>
            </div>

            <div className="space-y-6 pb-12">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-slate-400 border-l-2 border-slate-300 pl-3 py-0.5 uppercase tracking-widest">로마자를 보고 {charType === 'HIRAGANA' ? 'あ' : 'ア'}를 선택</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'PRACTICE', title: '연습 모드', icon: GraduationCap },
                      { id: 'GAME_HINT', title: '50음도순', icon: Sparkles },
                      { id: 'GAME_RANDOM', title: '랜덤 모드', icon: Dices }
                    ].map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => startSession(item.id)} 
                        className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] shadow-sm hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100 hover:-translate-y-1 hover:bg-slate-50 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><item.icon className="w-4 h-4" /></div>
                          <span className="text-xs font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{item.title}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-slate-400 border-l-2 border-slate-300 pl-3 py-0.5 uppercase tracking-widest">{charType === 'HIRAGANA' ? 'あ' : 'ア'}를 보고 로마자를 선택</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'PRACTICE_ROMAJI', title: '연습 모드', icon: GraduationCap },
                      { id: 'GAME_ROMAJI', title: '50음도순', icon: ArrowRightLeft },
                      { id: 'GAME_ROMAJI_RANDOM', title: '랜덤 모드', icon: Dices }
                    ].map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => startSession(item.id)} 
                        className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] shadow-sm hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100 hover:-translate-y-1 hover:bg-slate-50 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><item.icon className="w-4 h-4" /></div>
                          <span className="text-xs font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{item.title}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
            </div>
          </div>
        )}

        {gameState === 'RECORDS' && (
          <div className="flex-1 flex flex-col space-y-6 py-2 animate-in slide-in-from-right duration-500">
            <button onClick={() => setGameState('HOME')} className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2"><ChevronLeft className="w-4 h-4" /> Back to Home</button>
            <div className="space-y-8 pb-10">
              <section>
                <h3 className="text-xs font-black text-slate-900 border-b-2 border-slate-900 pb-2 mb-4 uppercase tracking-tighter">
                   ひらがな Ranking (Top 5)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderRankingBox("50음도순 a→あ", getFilteredRecords('HIRAGANA', 'GAME_HINT', 'TIME'), 'TIME')}
                  {renderRankingBox("랜덤모드 a→あ", getFilteredRecords('HIRAGANA', 'GAME_RANDOM', 'COUNT'), 'COUNT')}
                  {renderRankingBox("50음도 あ→a", getFilteredRecords('HIRAGANA', 'GAME_ROMAJI', 'TIME'), 'TIME')}
                  {renderRankingBox("랜덤 あ→a", getFilteredRecords('HIRAGANA', 'GAME_ROMAJI_RANDOM', 'COUNT'), 'COUNT')}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-900 border-b-2 border-slate-900 pb-2 mb-4 uppercase tracking-tighter">
                   カタカナ Ranking (Top 5)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderRankingBox("50음도순 a→ア", getFilteredRecords('KATAKANA', 'GAME_HINT', 'TIME'), 'TIME')}
                  {renderRankingBox("랜덤모드 a→ア", getFilteredRecords('KATAKANA', 'GAME_RANDOM', 'COUNT'), 'COUNT')}
                  {renderRankingBox("50음도 ア→a", getFilteredRecords('KATAKANA', 'GAME_ROMAJI', 'TIME'), 'TIME')}
                  {renderRankingBox("랜덤 ア→a", getFilteredRecords('KATAKANA', 'GAME_ROMAJI_RANDOM', 'COUNT'), 'COUNT')}
                </div>
              </section>
            </div>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="flex-1 flex flex-col space-y-4 h-full animate-in fade-in duration-500 overflow-hidden">
            <div className="flex justify-center flex-none">
              <button onClick={handleReturnHome} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-full active:scale-90 shadow-md z-[100]"><Home className="w-3 h-3 text-white/70" /><span className="text-[10px] font-black uppercase tracking-widest">Home</span></button>
            </div>
            <div className="flex justify-between items-end px-2 flex-none">
              <div className="leading-none">
                <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">{mode.includes('RANDOM') ? 'Score' : 'Progress'}</p>
                <h3 className="text-lg font-black text-slate-900 mt-1">{mode.includes('RANDOM') ? `${scoreCount} pt` : rows[currentRowIndex].name}</h3>
              </div>
              {!mode.includes('PRACTICE') && !mode.includes('RANDOM') && (
                <div className="text-right leading-none">
                  <p className="text-[8px] text-slate-400 uppercase font-black mb-1 tracking-widest">Mistakes</p>
                  <div className="flex gap-1.5 justify-end">{[...Array(5)].map((_, i) => (<div key={i} className={`w-1.5 h-1.5 rounded-full ${i < missCount ? 'bg-slate-900' : 'bg-slate-200'}`} />))}</div>
                </div>
              )}
            </div>

            <div className={`relative flex-none h-[110px] sm:h-[150px] bg-white border border-slate-100 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden shadow-sm transition-all ${isError ? 'animate-shake border-rose-200 bg-rose-50' : ''}`}>
               {!mode.includes('RANDOM') && (
                 <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
                   <div className="h-full bg-slate-900 transition-all duration-300" style={{ width: `${(targetCharIndex / rows[currentRowIndex].chars.length) * 100}%` }} />
                 </div>
               )}
               {mode === 'GAME_NO_HINT' ? 
                 <div className="flex flex-col items-center gap-2"><EyeOff className="w-6 h-6 text-slate-200" /><p className="text-[8px] text-slate-300 font-black uppercase">No Hint Mode</p></div> : 
                 <><p className="text-[9px] text-slate-300 uppercase tracking-[0.4em] font-black mb-1">Target</p><span className="text-5xl sm:text-7xl font-ud font-black text-slate-900 leading-none tracking-tighter">{mode.includes('ROMAJI') ? currentTargetChar : ROMAJI_MAP[currentTargetChar] || '?'}</span></>
               }
            </div>

            <div className={`flex-1 grid gap-2.5 ${mode.includes('PRACTICE') ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-5'}`}>
              {cards.map((card) => (
                <button 
                  key={card.id} 
                  onClick={() => handleCardClick(card)} 
                  className={`bg-white border border-slate-100 rounded-2xl flex items-center justify-center ${card.val.length > 2 ? 'text-lg' : 'text-4xl'} font-ud font-black text-slate-700 shadow-sm transition-all active:scale-[0.88] hover:border-indigo-400 hover:text-indigo-600 ${hintCardId === card.id ? 'hint-glow' : ''}`}
                  style={{ minHeight: '65px' }}
                >
                  {card.val}
                </button>
              ))}
            </div>

            {mode.includes('PRACTICE') && <div className="text-center flex-none py-1"><p className="text-[9px] text-slate-400 font-black uppercase tracking-widest animate-pulse flex items-center justify-center gap-2"><BookOpen className="w-3 h-3" /> 2秒後に正解が表示されます</p></div>}
          </div>
        )}

        {(gameState === 'GAMEOVER' || gameState === 'CLEAR') && (
           <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
             {gameState === 'GAMEOVER' ? (
                <div className="p-6 bg-slate-100 rounded-full"><XCircle className="w-12 h-12 text-slate-900" /></div>
             ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 animate-pulse rounded-full" />
                  <Trophy className="w-20 h-20 text-slate-900 drop-shadow-xl relative" />
                </div>
             )}
             <div className="text-center space-y-1">
               <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{gameState === 'GAMEOVER' ? 'Game Over' : 'Mission Clear'}</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">{gameState === 'GAMEOVER' ? 'Try Again for High Score' : 'Excellent Performance'}</p>
             </div>
             
             <div className="py-6 px-12 bg-white rounded-3xl border border-slate-100 shadow-xl text-center min-w-[240px]">
               <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">{mode.includes('RANDOM') ? 'Final Score' : 'Total Time'}</p>
               <p className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">
                 {mode.includes('RANDOM') ? `${scoreCount}pt` : formatTime(elapsedTime)}
               </p>
             </div>

             <div className="w-full max-w-xs space-y-2">
               <button onClick={() => startSession(mode)} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-slate-200">
                 <RefreshCw className="w-4 h-4" /> {gameState === 'GAMEOVER' ? '다시 도전하기' : '다시 플레이'}
               </button>
               <button onClick={handleReturnHome} className="text-slate-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest py-3">トップに戻る</button>
             </div>
           </div>
        )}
      </main>

      <footer className="flex-none p-6 text-center bg-white border-t border-slate-50">
        <p className="text-[7px] text-slate-300 uppercase tracking-[0.5em] font-black">&copy; {new Date().getFullYear()} Akihiro Suwa</p>
      </footer>
    </div>
  );
};

export default App;
