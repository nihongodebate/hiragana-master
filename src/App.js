import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { Timer, Trophy, XCircle, Home, RefreshCw, User, BookOpen, ChevronRight, Gamepad2, EyeOff, Edit3, Sparkles, Zap, ArrowRightLeft, GraduationCap } from 'lucide-react';

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
    console.error("Firebaseの初期化に失敗しました:", e);
  }
}

const currentAppId = "hiragana-speed-dash"; 

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

const ROMAJI_MAP = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n'
};

const ALL_CHARS = HIRAGANA_ROWS.flatMap(r => r.chars);
const ALL_ROMAJI = Object.values(ROMAJI_MAP);

const App = () => {
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState('HOME'); 
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
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isConfigValid || !auth) return;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("認証失敗:", err);
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
      console.error("ランキング取得エラー:", error);
    });
    return () => unsubscribeLb();
  }, [user]);

  const generateCards = useCallback((rowIndex, currentMode) => {
    const correctChars = HIRAGANA_ROWS[rowIndex].chars;
    const isRomajiSelect = currentMode.includes('ROMAJI');
    
    let combined = [];
    if (currentMode.includes('PRACTICE')) {
      combined = correctChars.map(char => ({
        val: isRomajiSelect ? ROMAJI_MAP[char] : char,
        id: Math.random()
      }));
    } else {
      const targetPool = isRomajiSelect ? ALL_ROMAJI : ALL_CHARS;
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
  }, []);

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
      const timer = setTimeout(() => {
        const target = HIRAGANA_ROWS[currentRowIndex].chars[targetCharIndex];
        const correctVal = mode.includes('ROMAJI') ? ROMAJI_MAP[target] : target;
        const targetCard = cards.find(c => c.val === correctVal);
        if (targetCard) setHintCardId(targetCard.id);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [targetCharIndex, currentRowIndex, mode, gameState, cards]);

  const handleCardClick = (card) => {
    if (gameState !== 'PLAYING') return;
    const currentRow = HIRAGANA_ROWS[currentRowIndex];
    const targetChar = currentRow.chars[targetCharIndex];
    const correctVal = mode.includes('ROMAJI') ? ROMAJI_MAP[targetChar] : targetChar;

    if (card.val === correctVal) {
      setIsError(false);
      if (targetCharIndex + 1 < currentRow.chars.length) {
        setTargetCharIndex(targetCharIndex + 1);
      } else {
        if (currentRowIndex + 1 < HIRAGANA_ROWS.length) {
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
        date: new Date().toISOString()
      });
    } catch (e) { console.error("スコア保存失敗:", e); }
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
  };

  const currentTargetChar = HIRAGANA_ROWS[currentRowIndex].chars[targetCharIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-ud selection:bg-indigo-100 overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        .font-ud { font-family: 'BIZ UDPGothic', 'Noto Sans KR', sans-serif; }
        @keyframes hint-pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        .hint-glow { animation: hint-pulse 2s infinite; border: 3px solid #10b981 !important; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both infinite; }
      `}} />

      {firebaseError && (
        <div className="bg-amber-100 text-amber-800 p-2 text-[10px] font-bold text-center border-b border-amber-200">
          ⚠️ Firebase settings are not configured properly. Ranking system is disabled.
        </div>
      )}

      <header className="p-4 sm:p-6 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-inner"><Gamepad2 className="w-5 h-5 text-white" /></div>
          <h1 className="text-xl font-bold tracking-tighter text-slate-900 uppercase">HIRAGANA MASTER</h1>
        </div>
        <div className="flex items-center gap-4">
           {gameState === 'PLAYING' && !mode.includes('PRACTICE') && (
             <div className="flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">
               <Timer className="w-4 h-4 text-indigo-600" />
               <span className="font-mono text-indigo-700 tabular-nums text-sm font-bold">{formatTime(elapsedTime)}</span>
             </div>
           )}
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full relative">
        {gameState === 'HOME' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-6 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">HIRAGANA MASTER</h2>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-indigo-600 px-2">보고 빠르게 마스터하는 히라가나 스피드 레이ス!</p>
                <p className="text-[11px] sm:text-xs text-slate-400 font-bold">친구와 함께 기록을 겨뤄보세요!</p>
              </div>
            </div>

            <div className="w-full space-y-10">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 border-l-4 border-indigo-500 pl-3 py-1 leading-relaxed">
                    발음을 보고 히라가나 선택 / 기억해서 히라가나 선택 (예: a→あ)
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => startSession('GAME_HINT')} className="group w-full bg-white border border-slate-200 text-slate-800 p-5 rounded-[2rem] flex items-center justify-between font-bold shadow-sm transition-all hover:border-indigo-400 hover:shadow-md active:scale-[0.98]">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-100 transition-colors shadow-sm"><Sparkles className="w-6 h-6 text-indigo-600" /></div>
                        <div className="text-left leading-tight"><span className="block text-base">チャレンジ (ヒントあり)</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Roman alphabet → HIRAGANA</span></div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                    <button onClick={() => startSession('GAME_NO_HINT')} className="group w-full bg-white border border-slate-200 text-slate-800 p-5 rounded-[2rem] flex items-center justify-between font-bold shadow-sm transition-all hover:border-purple-400 hover:shadow-md active:scale-[0.98]">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-2xl group-hover:bg-purple-100 transition-colors shadow-sm"><Zap className="w-6 h-6 text-purple-600" /></div>
                        <div className="text-left leading-tight"><span className="block text-base">チャレンジ (ヒントなし)</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SOUND → HIRAGANA</span></div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                    <button onClick={() => startSession('PRACTICE')} className="group w-full bg-white border border-slate-200 text-slate-800 p-5 rounded-[2rem] flex items-center justify-between font-bold shadow-sm transition-all hover:border-emerald-400 hover:shadow-md active:scale-[0.98]">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-100 transition-colors shadow-sm"><GraduationCap className="w-6 h-6 text-emerald-600" /></div>
                        <div className="text-left leading-tight"><span className="block text-base">練習モード</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NO FAKE • AUTO HINT</span></div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 border-l-4 border-orange-500 pl-3 py-1 leading-relaxed">
                    히라가나를 보고 발음 선택 (예: あ→a)
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => startSession('GAME_ROMAJI')} className="group w-full bg-white border border-slate-200 text-slate-800 p-5 rounded-[2rem] flex items-center justify-between font-bold shadow-sm transition-all hover:border-orange-400 hover:shadow-md active:scale-[0.98]">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-2xl group-hover:bg-orange-100 transition-colors shadow-sm"><ArrowRightLeft className="w-6 h-6 text-orange-600" /></div>
                        <div className="text-left leading-tight"><span className="block text-base">チャレンジ</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HIRAGANA → Roman alphabet</span></div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                    <button onClick={() => startSession('PRACTICE_ROMAJI')} className="group w-full bg-white border border-slate-200 text-slate-800 p-5 rounded-[2rem] flex items-center justify-between font-bold shadow-sm transition-all hover:border-pink-400 hover:shadow-md active:scale-[0.98]">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-50 rounded-2xl group-hover:bg-pink-100 transition-colors shadow-sm"><GraduationCap className="w-6 h-6 text-pink-600" /></div>
                        <div className="text-left leading-tight"><span className="block text-base">練習モード</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HIRAGANA STUDY</span></div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                  </div>
                </div>

              {!firebaseError && (
                <div className="bg-slate-100/50 border border-slate-200 rounded-[2rem] p-6 mt-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4"><Trophy className="w-3 h-3 text-amber-500" /> Hall of Fame</h3>
                  <div className="space-y-2">
                    {leaderboard.length === 0 ? <p className="text-[10px] text-slate-400 italic">No records yet...</p> : 
                      leaderboard.slice(0, 3).map((entry, i) => (
                        <div key={entry.id} className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                          <span className="flex items-center gap-3 text-xs"><span className={`font-black ${i===0?'text-amber-500':i===1?'text-slate-400':'text-orange-400'}`}>{i+1}</span><span className="text-slate-700 font-bold truncate w-24">{entry.userName}</span></span>
                          <span className="font-mono text-xs font-bold text-indigo-600">{formatTime(entry.time)}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {!firebaseError && (
                <div className="pt-4 px-2">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3"><Edit3 className="w-5 h-5 text-indigo-600" /><div><h4 className="text-xs font-bold text-slate-700">이름(닉네임)을 입력해주세요</h4><p className="text-[10px] text-indigo-500 font-bold">이름을 입력하고 랭킹에 도전하세요!</p></div></div>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl pl-11 pr-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 shadow-sm" placeholder="이름 입력 / 名前を入力" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="flex-1 flex flex-col py-2 space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-center"><button onClick={handleReturnHome} className="flex items-center gap-2 px-10 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all group active:scale-90 shadow-sm z-[100]"><Home className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" /><span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 uppercase tracking-[0.2em]">Return Home</span></button></div>
            <div className="flex justify-between items-center px-2">
              <div className="space-y-0.5"><p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Progress</p><h3 className={`text-lg font-bold ${mode.includes('PRACTICE')?'text-emerald-600':mode==='GAME_HINT'?'text-indigo-600':'text-purple-600'}`}>{HIRAGANA_ROWS[currentRowIndex].name}</h3></div>
              {!mode.includes('PRACTICE') && <div className="text-right space-y-1"><p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Mistakes</p><div className="flex gap-1.5">{[...Array(5)].map((_, i) => (<div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${i < missCount ? 'bg-rose-500 shadow-sm' : 'bg-slate-200'}`} />))}</div></div>}
            </div>
            <div className={`relative bg-white border rounded-[3rem] p-10 flex flex-col items-center justify-center min-h-[200px] space-y-4 overflow-hidden shadow-sm transition-all duration-200 ${isError ? 'animate-shake border-rose-300 bg-rose-50' : 'border-slate-100'}`}>
               <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100"><div className={`h-full transition-all duration-300 ${mode.includes('PRACTICE')?'bg-emerald-500':'bg-indigo-500'}`} style={{ width: `${(targetCharIndex / HIRAGANA_ROWS[currentRowIndex].chars.length) * 100}%` }} /></div>
               {mode === 'GAME_NO_HINT' ? <div className="flex flex-col items-center gap-2"><EyeOff className="w-10 h-10 text-slate-200 mb-2" /><p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Memory Mode</p></div> : <><p className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black">Target</p><span className="text-8xl font-black text-slate-900 leading-none drop-shadow-sm">{mode.includes('ROMAJI') ? currentTargetChar : ROMAJI_MAP[currentTargetChar] || '?'}</span></>}
            </div>
            <div className={`grid gap-4 ${mode.includes('PRACTICE') ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-5'}`}>
              {cards.map((card) => (<button key={card.id} onClick={() => handleCardClick(card)} className={`aspect-[4/3] bg-white border border-slate-200 rounded-3xl flex items-center justify-center ${mode.includes('ROMAJI') ? 'text-2xl' : 'text-4xl'} font-bold text-slate-700 shadow-sm transition-all active:scale-90 ${hintCardId === card.id ? 'hint-glow bg-emerald-50' : 'hover:bg-slate-50 hover:border-slate-300'}`}>{card.val}</button>))}
            </div>
            {mode.includes('PRACTICE') && <div className="text-center py-4"><p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest animate-pulse flex items-center justify-center gap-2"><BookOpen className="w-3 h-3" /> 2秒待つとヒントが表示されます</p></div>}
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center animate-in zoom-in duration-300">
            <div className="p-8 bg-rose-50 rounded-full border border-rose-100 shadow-sm"><XCircle className="w-16 h-16 text-rose-500" /></div>
            <div className="space-y-3"><h2 className="text-3xl font-black text-slate-900 tracking-tight">GAME OVER</h2><p className="text-slate-500 text-sm leading-relaxed font-medium">ミスが上限に達しました。<br/>도전 실패! 다시 한 번 시도해보세요.</p></div>
            <button onClick={() => startSession(mode)} className="w-full max-w-xs py-5 bg-indigo-600 text-white font-bold rounded-[2rem] hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95"><RefreshCw className="w-5 h-5" />もう一度挑戦</button>
            <button onClick={handleReturnHome} className="text-slate-400 hover:text-indigo-600 text-xs font-black uppercase tracking-widest transition-colors mt-4">Return Home</button>
          </div>
        )}

        {gameState === 'CLEAR' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in slide-in-from-bottom duration-500">
            <div className="relative"><div className="absolute inset-0 bg-amber-200 blur-2xl opacity-20 rounded-full" /><Trophy className="relative w-24 h-24 text-amber-500 drop-shadow-md" /></div>
            <div className="text-center space-y-2"><h2 className="text-3xl font-black text-slate-900">MISSION CLEAR</h2><p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">완벽하게 마스터했습니다!</p></div>
            {!mode.includes('PRACTICE') && (<div className="py-8 px-14 bg-white rounded-[3rem] border border-slate-100 shadow-xl text-center"><p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Total Time</p><p className="text-6xl font-mono font-black text-indigo-600 tabular-nums">{formatTime(elapsedTime)}</p></div>)}
            <div className="w-full max-w-xs space-y-4">
              <button onClick={() => startSession(mode)} className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 transition-all active:scale-95"><RefreshCw className="w-5 h-5" />もう一度プレイ</button>
              <button onClick={handleReturnHome} className="text-slate-400 hover:text-indigo-600 text-xs font-black uppercase tracking-widest transition-colors mt-4">トップに戻る</button>
            </div>
          </div>
        )}
      </main>

      <footer className="p-10 text-center bg-white border-t border-slate-100">
        <p className="text-[10px] text-slate-300 uppercase tracking-[0.3em] font-black mb-2">Developed for Japanese Learners</p>
        <p className="text-xs text-slate-400 font-bold">&copy; {new Date().getFullYear()} <span className="text-slate-600 font-black tracking-tighter">Akihiro Suwa</span></p>
      </footer>
    </div>
  );
};

export default App;