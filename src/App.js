import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { Timer, Trophy, XCircle, Home, RefreshCw, User, BookOpen, ChevronRight, Gamepad2, EyeOff, Edit3, Sparkles, Zap, ArrowRightLeft, GraduationCap, Volume2, VolumeX } from 'lucide-react';

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
  { name: 'あ행', chars: ['あ', 'い', 'う', 'え', 'お'] },
  { name: 'か행', chars: ['か', 'き', 'く', 'け', 'こ'] },
  { name: 'さ행', chars: ['さ', 'し', 'す', 'せ', 'そ'] },
  { name: 'た행', chars: ['た', 'ち', 'つ', 'て', 'と'] },
  { name: 'な행', chars: ['な', 'に', 'ぬ', 'ね', 'の'] },
  { name: 'は행', chars: ['は', 'ひ', 'ふ', 'へ', 'ほ'] },
  { name: 'ま행', chars: ['ま', 'み', 'む', 'め', 'も'] },
  { name: 'や행', chars: ['や', 'ゆ', 'よ'] },
  { name: 'ら행', chars: ['ら', 'り', 'る', 'れ', 'ろ'] },
  { name: 'わ행', chars: ['わ', 'を', 'ん'] },
];

const KATAKANA_ROWS = [
  { name: 'ア행', chars: ['ア', 'イ', 'ウ', 'エ', 'オ'] },
  { name: 'カ행', chars: ['カ', 'キ', 'ク', 'ケ', 'コ'] },
  { name: 'サ행', chars: ['サ', 'シ', 'ス', 'セ', 'ソ'] },
  { name: 'タ행', chars: ['タ', 'チ', 'ツ', 'テ', 'ト'] },
  { name: 'ナ행', chars: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'] },
  { name: 'ハ행', chars: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'] },
  { name: 'マ행', chars: ['マ', 'ミ', 'ム', 'メ', 'モ'] },
  { name: 'ヤ행', chars: ['ヤ', 'ユ', 'ヨ'] },
  { name: 'ラ행', chars: ['ラ', 'リ', 'ル', 'レ', 'ロ'] },
  { name: 'ワ행', chars: ['ワ', 'ヲ', 'ン'] },
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
  // Katakana (No duplicates)
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
  const [missCount, setMissCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cards, setCards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userName, setUserName] = useState('');
  const [hintCardId, setHintCardId] = useState(null);
  const [isError, setIsError] = useState(false);
  const [firebaseError, setFirebaseError] = useState(!isConfigValid);
  const [isSoundOn, setIsSoundOn] = useState(true);
  
  const timerRef = useRef(null);

  const speakChar = useCallback((text) => {
    if (!window.speechSynthesis || !isSoundOn) return;
    window.speechSynthesis.cancel();
    const uttr = new SpeechSynthesisUtterance(text);
    uttr.lang = 'ja-JP';
    uttr.rate = 1.1;
    window.speechSynthesis.speak(uttr);
  }, [isSoundOn]);

  useEffect(() => {
    if (!isConfigValid || !auth) {
      setFirebaseError(true);
      return;
    }
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth failed:", err);
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
      const sorted = docs.sort((a, b) => (a.time || 0) - (b.time || 0)).slice(0, 10);
      setLeaderboard(sorted);
    }, (error) => {
      console.error("Leaderboard error:", error);
    });
    return () => unsubscribeLb();
  }, [user]);

  const generateCards = useCallback((rowIndex, currentMode) => {
    const rows = charType === 'HIRAGANA' ? HIRAGANA_ROWS : KATAKANA_ROWS;
    const correctChars = rows[rowIndex].chars;
    const isRomajiSelect = currentMode.includes('ROMAJI');
    
    let combined = [];
    if (currentMode.includes('PRACTICE')) {
      combined = correctChars.map(char => ({
        val: isRomajiSelect ? ROMAJI_MAP[char] : char,
        id: Math.random()
      }));
    } else {
      const targetPool = isRomajiSelect ? ALL_ROMAJI : (charType === 'HIRAGANA' ? ALL_HIRAGANA : ALL_KATAKANA);
      const correctVals = isRomajiSelect ? correctChars.map(c => ROMAJI_MAP[c]) : correctChars;
      const others = targetPool.filter(v => !correctVals.includes(v));
      const fakeVals = [];
      while (fakeVals.length < 5) {
        const rand = others[Math.floor(Math.random() * others.length)];
        if (!fakeVals.includes(rand)) fakeVals.push(rand);
      }
      combined = [...correctVals, ...fakeVals].map(val => ({ val, id: Math.random() }));
    }
    return combined.sort(() => Math.random() - 0.5);
  }, [charType]);

  const startSession = (selectedMode) => {
    setMode(selectedMode);
    setCurrentRowIndex(0);
    setTargetCharIndex(0);
    setMissCount(0);
    setElapsedTime(0);
    setCards(generateCards(0, selectedMode));
    setGameState('PLAYING');
    setHintCardId(null);
    setIsError(false);
    if (!selectedMode.includes('PRACTICE')) {
      setStartTime(Date.now());
    }
  };

  const handleReturnHome = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('HOME');
    setIsError(false);
  };

  useEffect(() => {
    if (gameState === 'PLAYING' && !mode.includes('PRACTICE')) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - (startTime || Date.now()));
      }, 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, mode, startTime]);

  useEffect(() => {
    if (mode.includes('PRACTICE') && gameState === 'PLAYING') {
      setHintCardId(null);
      // 4秒（4000ms）待機でヒント表示
      const timer = setTimeout(() => {
        const rows = charType === 'HIRAGANA' ? HIRAGANA_ROWS : KATAKANA_ROWS;
        const target = rows[currentRowIndex].chars[targetCharIndex];
        const correctVal = mode.includes('ROMAJI') ? ROMAJI_MAP[target] : target;
        const targetCard = cards.find(c => c.val === correctVal);
        if (targetCard) setHintCardId(targetCard.id);
      }, 4000); 
      return () => clearTimeout(timer);
    }
  }, [targetCharIndex, currentRowIndex, mode, gameState, cards, charType]);

  const handleCardClick = (card) => {
    if (gameState !== 'PLAYING') return;
    const rows = charType === 'HIRAGANA' ? HIRAGANA_ROWS : KATAKANA_ROWS;
    const currentRow = rows[currentRowIndex];
    const targetChar = currentRow.chars[targetCharIndex];
    const correctVal = mode.includes('ROMAJI') ? ROMAJI_MAP[targetChar] : targetChar;

    if (card.val === correctVal) {
      setIsError(false);
      speakChar(targetChar);
      if (targetCharIndex + 1 < currentRow.chars.length) {
        setTargetCharIndex(targetCharIndex + 1);
      } else {
        if (currentRowIndex + 1 < rows.length) {
          const nextIndex = currentRowIndex + 1;
          setCurrentRowIndex(nextIndex);
          setTargetCharIndex(0);
          setCards(generateCards(nextIndex, mode));
        } else {
          setGameState('CLEAR');
          if (!mode.includes('PRACTICE')) saveScore(elapsedTime);
        }
      }
    } else {
      setIsError(true);
      if (!mode.includes('PRACTICE')) {
        const nextMissCount = missCount + 1;
        setMissCount(nextMissCount);
        if (nextMissCount >= 5) setGameState('GAMEOVER');
      }
    }
  };

  const saveScore = async (time) => {
    if (!user || !db) return;
    try {
      await addDoc(collection(db, 'artifacts', currentAppId, 'public', 'data', 'leaderboard'), {
        userId: user.uid,
        userName: userName || 'Anonymous Learner',
        time: time,
        mode: mode,
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

  const rows = charType === 'HIRAGANA' ? HIRAGANA_ROWS : KATAKANA_ROWS;
  const currentTargetChar = rows[currentRowIndex].chars[targetCharIndex];

  return (
    <div className="h-screen bg-slate-50 text-slate-800 flex flex-col font-ud selection:bg-indigo-100 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        .font-ud { font-family: 'BIZ UDPGothic', 'Noto Sans KR', sans-serif; }
        @keyframes hint-pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        .hint-glow { animation: hint-pulse 2s infinite; border: 3px solid #10b981 !important; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both infinite; }
      `}} />

      <header className="flex-none p-3 sm:p-5 flex justify-between items-center border-b border-slate-200 bg-white shadow-sm z-50">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-indigo-600" />
          <h1 className="text-lg font-bold tracking-tighter text-slate-900 uppercase">KANA MASTER</h1>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setIsSoundOn(!isSoundOn)} className={`p-2 rounded-full transition-all border ${isSoundOn ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
             {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
           </button>
           {gameState === 'PLAYING' && !mode.includes('PRACTICE') && (
             <div className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100"><span className="font-mono text-indigo-700 text-sm font-bold tabular-nums">{formatTime(elapsedTime)}</span></div>
           )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col p-4 max-w-xl mx-auto w-full relative">
        {gameState === 'HOME' && (
          <div className="flex-1 flex flex-col space-y-5 py-2 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase leading-none">KANA MASTER</h2>
              <div className="space-y-0.5 leading-tight">
                <p className="text-[11px] font-bold text-indigo-600 px-2">보고 빠르게 마스터하는 히라가나/가타카나 스피드 레이스!</p>
                <p className="text-[10px] text-slate-400 font-bold">친구와 함께 기록을 겨뤄보세요!</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!firebaseError && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 shadow-sm">
                  <h4 className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-2"><Edit3 className="w-3 h-3" />이름을 입력하고 랭킹에 도전하세요!</h4>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700" placeholder="이름 입력..." />
                  </div>
                </div>
              )}
              {!firebaseError && (
                <div className="bg-slate-100/50 border border-slate-200 rounded-2xl p-3">
                  <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Trophy className="w-3 h-3 text-amber-500" /> TOP RECORDS ({charType === 'HIRAGANA' ? '히라가나' : '가타카나'})</h3>
                  <div className="space-y-1.5">
                    {leaderboard.filter(e => e.charType === charType).length === 0 ? <p className="text-[9px] text-slate-400 italic text-center py-1">No records...</p> : 
                      leaderboard.filter(e => e.charType === charType).slice(0, 3).map((entry, i) => (
                        <div key={entry.id} className="flex justify-between items-center bg-white px-2 py-1 rounded-lg border border-slate-100">
                          <span className="flex items-center gap-2 text-[10px] font-bold text-slate-700 truncate"><span className={i===0?'text-amber-500':i===1?'text-slate-400':'text-orange-400'}>{i+1}</span>{entry.userName}</span>
                          <span className="font-mono text-[10px] font-bold text-indigo-600">{formatTime(entry.time)}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-200/50 p-1 rounded-2xl flex w-full max-w-[200px] mx-auto shadow-inner flex-none">
              <button onClick={() => setCharType('HIRAGANA')} className={`flex-1 py-1.5 px-3 rounded-xl text-[10px] font-bold transition-all ${charType === 'HIRAGANA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>히라가나</button>
              <button onClick={() => setCharType('KATAKANA')} className={`flex-1 py-1.5 px-3 rounded-xl text-[10px] font-bold transition-all ${charType === 'KATAKANA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>가타카나</button>
            </div>

            <div className="space-y-6 pb-8">
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-slate-600 border-l-3 border-indigo-500 pl-2 py-0.5">로마자를 보고 {charType === 'HIRAGANA' ? '히라가나' : '가타카나'}를 선택</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => startSession('GAME_HINT')} className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between active:scale-[0.98] shadow-sm">
                      <div className="flex items-center gap-3"><div className="p-2 bg-indigo-50 rounded-xl"><Sparkles className="w-4 h-4 text-indigo-600" /></div><div className="text-left leading-tight"><span className="block text-xs font-bold">챌린지 (힌트 있음)</span><span className="text-[9px] text-slate-400 font-bold uppercase">ROMAN ALPHABET → {charType}</span></div></div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                    <button onClick={() => startSession('GAME_NO_HINT')} className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between active:scale-[0.98] shadow-sm">
                      <div className="flex items-center gap-3"><div className="p-2 bg-purple-50 rounded-xl"><Zap className="w-4 h-4 text-purple-600" /></div><div className="text-left leading-tight"><span className="block text-xs font-bold">챌린지 (힌트 없음)</span><span className="text-[9px] text-slate-400 font-bold uppercase">ROMAN ALPHABET → {charType}</span></div></div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                    <button onClick={() => startSession('PRACTICE')} className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between active:scale-[0.98] shadow-sm">
                      <div className="flex items-center gap-3"><div className="p-2 bg-emerald-50 rounded-xl"><GraduationCap className="w-4 h-4 text-emerald-600" /></div><div className="text-left leading-tight"><span className="block text-xs font-bold">연습 모드</span><span className="text-[9px] text-slate-400 font-bold uppercase">STUDY MODE</span></div></div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-slate-600 border-l-3 border-orange-500 pl-2 py-0.5">{charType === 'HIRAGANA' ? '히라가나' : '가타카나'}를 보고 로마자를 선택</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => startSession('GAME_ROMAJI')} className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between active:scale-[0.98] shadow-sm">
                      <div className="flex items-center gap-3"><div className="p-2 bg-orange-50 rounded-xl"><ArrowRightLeft className="w-4 h-4 text-orange-600" /></div><div className="text-left leading-tight"><span className="block text-xs font-bold">챌린지</span><span className="text-[9px] text-slate-400 font-bold uppercase">{charType} → ROMAN ALPHABET</span></div></div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                    <button onClick={() => startSession('PRACTICE_ROMAJI')} className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between active:scale-[0.98] shadow-sm border-pink-100">
                      <div className="flex items-center gap-3"><div className="p-2 bg-pink-50 rounded-xl"><GraduationCap className="w-4 h-4 text-pink-600" /></div><div className="text-left leading-tight"><span className="block text-xs font-bold">연습 모드</span><span className="text-[9px] text-slate-400 font-bold uppercase">STUDY MODE</span></div></div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </div>
            </div>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="flex-1 flex flex-col space-y-3 h-full animate-in fade-in duration-500 overflow-hidden">
            <div className="flex justify-center flex-none">
              <button onClick={handleReturnHome} className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 rounded-full active:scale-90 shadow-sm z-[100]"><Home className="w-3.5 h-3.5 text-slate-400" /><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Home</span></button>
            </div>
            
            <div className="flex justify-between items-end px-2 flex-none">
              <div className="leading-none"><p className="text-[8px] text-slate-400 uppercase font-black">Progress</p><h3 className="text-sm font-bold text-indigo-600">{rows[currentRowIndex].name}</h3></div>
              {!mode.includes('PRACTICE') && <div className="text-right leading-none"><p className="text-[8px] text-slate-400 uppercase font-black mb-1">Mistakes</p><div className="flex gap-1">{[...Array(5)].map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full ${i < missCount ? 'bg-rose-500' : 'bg-slate-200'}`} />))}</div></div>}
            </div>

            <div className={`relative flex-1 max-h-[180px] bg-white border rounded-[2rem] flex flex-col items-center justify-center overflow-hidden shadow-sm ${isError ? 'animate-shake border-rose-300 bg-rose-50' : 'border-slate-100'}`}>
               <div className="absolute top-0 left-0 w-full h-1 bg-slate-100"><div className="h-full bg-indigo-500 transition-all" style={{ width: `${(targetCharIndex / rows[currentRowIndex].chars.length) * 100}%` }} /></div>
               {mode === 'GAME_NO_HINT' ? <div className="flex flex-col items-center gap-1"><EyeOff className="w-8 h-8 text-slate-200" /><p className="text-[8px] text-slate-400 font-black uppercase">Roman alphabet mode</p></div> : <><p className="text-[9px] text-slate-400 uppercase tracking-widest font-black mb-1">Target</p><span className="text-6xl font-black text-slate-900 leading-none">{mode.includes('ROMAJI') ? currentTargetChar : ROMAJI_MAP[currentTargetChar] || '?'}</span></>}
            </div>

            <div className={`flex-none grid gap-2 ${mode.includes('PRACTICE') ? 'grid-cols-3' : 'grid-cols-5'}`}>
              {cards.map((card) => (
                <button 
                  key={card.id} 
                  onClick={() => handleCardClick(card)} 
                  className={`aspect-square sm:aspect-[4/3] bg-white border border-slate-200 rounded-xl flex items-center justify-center ${card.val.length > 2 ? 'text-xs' : 'text-lg'} font-bold text-slate-700 shadow-sm transition-all active:scale-90 ${hintCardId === card.id ? 'hint-glow bg-emerald-50' : ''}`}
                >
                  {card.val}
                </button>
              ))}
            </div>
            
            {mode.includes('PRACTICE') && <div className="text-center flex-none"><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">4초 후에 힌트가 표시됩니다</p></div>}
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center animate-in zoom-in duration-300">
            <div className="p-6 bg-rose-50 rounded-full border border-rose-100 shadow-sm"><XCircle className="w-12 h-12 text-rose-500" /></div>
            <div className="space-y-2"><h2 className="text-2xl font-black text-slate-900">GAME OVER</h2><p className="text-slate-500 text-xs px-10 leading-relaxed font-medium">실수가 한도에 도달했습니다. 다시 시도하여 마스터해 보세요!</p></div>
            <button onClick={() => startSession(mode)} className="w-full max-w-xs py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-indigo-100"><RefreshCw className="w-4 h-4" />다시 도전하기</button>
            <button onClick={handleReturnHome} className="text-slate-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-colors mt-2">Home</button>
          </div>
        )}

        {gameState === 'CLEAR' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in slide-in-from-bottom duration-500">
            <Trophy className="w-20 h-20 text-amber-500" />
            <div className="text-center space-y-1"><h2 className="text-2xl font-black text-slate-900 uppercase">MISSION CLEAR</h2><p className="text-slate-400 font-black text-[10px] tracking-widest">{charType === 'HIRAGANA' ? '히라가나' : '가타카나'} 마스터 완료!</p></div>
            {!mode.includes('PRACTICE') && (<div className="py-5 px-10 bg-white rounded-3xl border border-slate-100 shadow-xl text-center"><p className="text-[9px] text-slate-400 uppercase tracking-widest font-black mb-0.5">Total Time</p><p className="text-4xl font-mono font-black text-indigo-600 tabular-nums">{formatTime(elapsedTime)}</p></div>)}
            <div className="w-full max-w-xs space-y-3">
              <button onClick={() => startSession(mode)} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-indigo-100"><RefreshCw className="w-5 h-5" />다시 플레이</button>
              <button onClick={handleReturnHome} className="w-full bg-white border border-slate-200 text-slate-500 font-bold py-4 rounded-2xl active:scale-95 shadow-sm">홈으로 돌아가기</button>
            </div>
          </div>
        )}
      </main>

      <footer className="flex-none p-4 text-center bg-white border-t border-slate-100">
        <p className="text-[8px] text-slate-300 uppercase tracking-widest font-black">&copy; {new Date().getFullYear()} Akihiro Suwa</p>
      </footer>
    </div>
  );
};

export default App;
