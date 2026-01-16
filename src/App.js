import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { Trophy, XCircle, Home, RefreshCw, User, ChevronRight, Gamepad2, Sparkles, Zap, ArrowRightLeft, Dices, ChevronLeft, Mic, MicOff, CheckCircle2, AlertCircle, Clock, FastForward } from 'lucide-react';

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

// --- Utility Functions ---
const formatTime = (ms) => {
  if (isNaN(ms) || ms === null) return "0.00s";
  const seconds = Math.floor(ms / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
};

const isScoredMode = (m) => {
  if (!m) return false;
  return m === 'GAME_RANDOM_ALL' || m === 'GAME_ROMAJI_RANDOM_ALL';
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// --- Constants ---
const HIRAGANA_BASIC = [
  { name: 'あ行', chars: ['あ', 'い', 'う', 'え', 'お'], color: 'border-l-red-400' },
  { name: 'か行', chars: ['か', 'き', 'く', 'け', 'こ'], color: 'border-l-orange-400' },
  { name: 'さ行', chars: ['さ', 'し', 'す', 'せ', 'そ'], color: 'border-l-yellow-400' },
  { name: 'た行', chars: ['た', 'ち', 'つ', 'て', 'と'], color: 'border-l-emerald-400' },
  { name: 'な行', chars: ['な', 'に', 'ぬ', 'ね', 'の'], color: 'border-l-teal-400' },
  { name: 'は行', chars: ['は', 'ひ', 'ふ', 'へ', 'ほ'], color: 'border-l-blue-400' },
  { name: 'ま行', chars: ['ま', 'み', 'む', 'め', 'も'], color: 'border-l-indigo-400' },
  { name: 'や行', chars: ['や', 'ゆ', 'よ'], color: 'border-l-purple-400' },
  { name: 'ら行', chars: ['ら', 'り', 'る', 'れ', 'ろ'], color: 'border-l-pink-400' },
  { name: 'わ行', chars: ['わ', 'を', 'ん'], color: 'border-l-slate-400' },
];

const HIRAGANA_DAKUON = [
  { name: 'が行', chars: ['が', 'ぎ', 'ぐ', 'げ', 'ご'], color: 'border-l-sky-500' },
  { name: 'ざ行', chars: ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'], color: 'border-l-emerald-500' },
  { name: 'だ行', chars: ['だ', 'ぢ', 'づ', 'で', 'ど'], color: 'border-l-amber-500' },
  { name: 'ば行', chars: ['ば', 'び', 'ぶ', 'べ', 'ぼ'], color: 'border-l-rose-500' },
  { name: 'ぱ行', chars: ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'], color: 'border-l-indigo-500' },
];

const KATAKANA_BASIC = [
  { name: 'ア行', chars: ['ア', 'イ', 'ウ', 'エ', 'オ'], color: 'border-l-red-400' },
  { name: 'カ行', chars: ['カ', 'キ', 'ク', 'ケ', 'コ'], color: 'border-l-orange-400' },
  { name: 'サ行', chars: ['サ', 'シ', 'ス', 'セ', 'ソ'], color: 'border-l-yellow-400' },
  { name: 'タ行', chars: ['タ', 'チ', 'ツ', 'テ', 'ト'], color: 'border-l-emerald-400' },
  { name: 'ナ行', chars: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'], color: 'border-l-teal-400' },
  { name: 'ハ行', chars: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'], color: 'border-l-blue-400' },
  { name: 'マ行', chars: ['マ', 'ミ', 'ム', 'メ', 'モ'], color: 'border-l-indigo-400' },
  { name: 'ヤ行', chars: ['ヤ', 'ユ', 'ヨ'], color: 'border-l-purple-400' },
  { name: 'ラ行', chars: ['ラ', 'リ', 'ル', 'レ', 'ロ'], color: 'border-l-pink-400' },
  { name: 'ワ行', chars: ['ワ', 'ヲ', 'ン'], color: 'border-l-slate-400' },
];

const KATAKANA_DAKUON = [
  { name: 'ガ行', chars: ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'], color: 'border-l-sky-500' },
  { name: 'ザ行', chars: ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'], color: 'border-l-emerald-500' },
  { name: 'ダ行', chars: ['ダ', 'ヂ', 'ヅ', 'デ', 'ド'], color: 'border-l-amber-500' },
  { name: 'バ行', chars: ['バ', 'ビ', 'ブ', 'ベ', 'ボ'], color: 'border-l-rose-500' },
  { name: 'パ行', chars: ['パ', 'ピ', 'プ', 'ペ', 'ポ'], color: 'border-l-indigo-500' },
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
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  // Katakana (Updated and fixed typos)
  'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
  'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
  'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
  'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
  'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
  'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
  'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
  'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
  'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
  'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
  'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
  'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
  'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
  'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
  'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po'
};

const VOICE_QUIZ_WORDS_HIRAGANA = [
  { word: 'いぬ', meaning: '개', variants: ['いぬ', '犬', 'イヌ'] },
  { word: 'ねこ', meaning: '고양이', variants: ['ねこ', '猫', 'ネコ'] },
  { word: 'さかな', meaning: '생선', variants: ['さかな', '魚', 'サカナ'] },
  { word: 'あめ', meaning: '비/사탕', variants: ['あめ', '雨', '飴'] },
  { word: 'うみ', meaning: '바다', variants: ['うみ', '海', '生み'] },
  { word: 'とり', meaning: '새', variants: ['とり', '鳥', '取り', '撮り'] },
  { word: 'はな', meaning: '꽃/코', variants: ['はな', '花', '鼻'] },
  { word: 'ゆき', meaning: '눈', variants: ['ゆき', '雪', '行き'] },
  { word: 'すし', meaning: '초밥', variants: ['すし', '寿司'] },
  { word: 'くるま', meaning: '자동차', variants: ['くるま', '車', 'クルマ'] },
  { word: 'りんご', meaning: '사과', variants: ['りんご', '林檎'] },
  { word: '가っこう', meaning: '학교', variants: ['がっこう', '学校'] },
  { word: 'きって', meaning: '우표', variants: ['きって', '切手'] },
  { word: 'じかん', meaning: '시간', variants: ['じかん', '時間'] },
  { word: 'てんぷら', meaning: '튀김', variants: ['てんぷら', '天ぷら', 'テンプラ'] },
  { word: 'やま', meaning: '산', variants: ['やま', '山'] },
  { word: 'かわ', meaning: '강', variants: ['かわ', '川'] },
  { word: 'つき', meaning: '달', variants: ['つき', '月', '付'] },
  { word: 'ほし', meaning: '별', variants: ['ほし', '星'] },
  { word: 'でんわ', meaning: '전화', variants: ['でんわ', '電話'] },
  { word: 'しんぶん', meaning: '신문', variants: ['しんぶん', '新聞'] },
  { word: 'おちゃ', meaning: '차', variants: ['おちゃ', 'お茶'] },
  { word: 'じしょ', meaning: '사전', variants: ['じしょ', '辞書'] },
  { word: 'かばん', meaning: '가방', variants: ['かばん', '鞄'] },
  { word: 'ぼうし', meaning: '모자', variants: ['ぼうし', '帽子'] },
  { word: 'まど', meaning: '창문', variants: ['まど', '窓'] },
  { word: 'えんぴつ', meaning: '연필', variants: ['えんぴつ', '鉛筆'] },
  { word: 'つくえ', meaning: '책상', variants: ['つくえ', '机'] },
  { word: 'いす', meaning: '의자', variants: ['いす', '椅子'] },
  { word: 'ほん', meaning: '책', variants: ['ほん', '本'] },
  { word: 'はさみ', meaning: '가위', variants: ['はさみ', '鋏'] },
  { word: 'くつ', meaning: '신발', variants: ['くつ', '靴'] },
  { word: 'ふく', meaning: '옷', variants: ['ふく', '服', '吹く', '拭く'] },
  { word: 'かさ', meaning: '우산', variants: ['かさ', '傘'] },
  { word: 'ひと', meaning: '사람', variants: ['ひと', '人'] },
  { word: 'こども', meaning: '아이', variants: ['こども', '子供'] },
  { word: 'ともだち', meaning: '친구', variants: ['ともだち', '友達'] },
  { word: 'せんせい', meaning: '선생님', variants: ['せんせい', '先生'] },
  { word: 'なまえ', meaning: '이름', variants: ['なまえ', '名前'] },
  { word: 'ごはん', meaning: '밥', variants: ['ごはん', '御飯', 'ご飯'] },
  { word: 'みず', meaning: '물', variants: ['みず', '水', '見ず'] },
  { word: 'えき', meaning: '역', variants: ['えき', '駅'] },
  { word: 'でんしゃ', meaning: '전철', variants: ['でんしゃ', '電車'] },
  { word: 'なつ', meaning: '여름', variants: ['なつ', '夏'] },
  { word: 'ふゆ', meaning: '겨울', variants: ['ふゆ', '冬'] },
  { word: 'はる', meaning: '봄', variants: ['はる', '春', '貼る', '張る'] },
  { word: 'あき', meaning: '가을', variants: ['あき', '秋', '空き'] },
  { word: 'むし', meaning: '벌레', variants: ['むし', '虫'] },
  { word: 'うた', meaning: '노래', variants: ['うた', '歌'] },
  { word: 'おかね', meaning: '돈', variants: ['おかね', 'お金'] }
];

const VOICE_QUIZ_WORDS_KATAKANA = [
  { word: 'パン', meaning: '빵', variants: ['パン', 'ぱん'] },
  { word: 'バス', meaning: '버스', variants: ['バス', 'ばす'] },
  { word: 'ドア', meaning: '문', variants: ['ドア', 'どあ'] },
  { word: 'テレビ', meaning: 'TV', variants: ['テレビ', 'てれび'] },
  { word: 'ピアノ', meaning: '피아노', variants: ['ピアノ', 'ぴあの'] },
  { word: 'ケーキ', meaning: '케이크', variants: ['ケーキ'] },
  { word: 'ビール', meaning: '맥주', variants: ['ビール'] },
  { word: 'コップ', meaning: '컵', variants: ['コップ'] },
  { word: 'ベッド', meaning: '침대', variants: ['ベッド'] },
  { word: 'バッグ', meaning: '가방', variants: ['バッグ'] },
  { word: 'ペン', meaning: '펜', variants: ['ペン'] },
  { word: 'ノート', meaning: '노트', variants: ['ノート'] },
  { word: 'コーヒー', meaning: '커피', variants: ['コーヒー'] },
  { word: 'タクシー', meaning: '택시', variants: ['タクシー'] },
  { word: 'サラダ', meaning: '샐러드', variants: ['サラダ'] },
  { word: 'シャツ', meaning: '셔츠', variants: ['シャツ'] },
  { word: 'スマホ', meaning: '스마트폰', variants: ['スマホ'] },
  { word: 'ゲーム', meaning: '게임', variants: ['ゲーム'] },
  { word: 'トイレ', meaning: '화장실', variants: ['トイレ'] },
  { word: 'カメラ', meaning: '카메라', variants: ['カメラ'] },
  { word: 'ラジオ', meaning: '라디오', variants: ['ラジオ'] },
  { word: 'トマト', meaning: '토마토', variants: ['トマト'] },
  { word: 'バナナ', meaning: '바나나', variants: ['バナナ'] },
  { word: 'メロン', meaning: '멜론', variants: ['メロン'] },
  { word: 'アイス', meaning: '아이스크림', variants: ['アイス'] },
  { word: 'ジュース', meaning: '주스', variants: ['ジュース'] },
  { word: 'コーラ', meaning: '콜라', variants: ['コーラ'] },
  { word: 'カレー', meaning: '카레', variants: ['カレー'] },
  { word: 'ラーメン', meaning: '라면', variants: ['ラーメン'] },
  { word: 'スプーン', meaning: '스푼', variants: ['スプーン'] },
  { word: 'フォーク', meaning: '포크', variants: ['フォーク'] },
  { word: 'ナイフ', meaning: '나이프', variants: ['ナイフ'] },
  { word: 'ネクタイ', meaning: '넥타이', variants: ['ネクタイ'] },
  { word: 'スカート', meaning: '치마', variants: ['スカート'] },
  { word: 'ギター', meaning: '기타', variants: ['ギター'] },
  { word: 'マイク', meaning: '마이크', variants: ['マイク'] },
  { word: 'パソコン', meaning: '컴퓨터', variants: ['パソコン'] },
  { word: 'テニス', meaning: '테니스', variants: ['テニス'] },
  { word: 'ゴルフ', meaning: '골프', variants: ['ゴルフ'] },
  { word: 'サッカー', meaning: '축구', variants: ['サッカー'] },
  { word: 'スキー', meaning: '스키', variants: ['スキー'] },
  { word: 'ニュース', meaning: '뉴스', variants: ['ニュース'] },
  { word: 'クラス', meaning: '클래스', variants: ['クラス'] },
  { word: 'ページ', meaning: '페이지', variants: ['ページ'] },
  { word: 'デパート', meaning: '백화점', variants: ['デパート'] },
  { word: 'ホテル', meaning: '호텔', variants: ['ホテル'] },
  { word: 'レストラン', meaning: '레스토랑', variants: ['レストラン'] },
  { word: 'コンビニ', meaning: '편의점', variants: ['コンビニ'] },
  { word: 'バスケット', meaning: '농구', variants: ['バスケット'] },
  { word: 'スポーツ', meaning: '스포츠', variants: ['スポーツ'] }
];

const ALL_HIRAGANA_POOL = [...HIRAGANA_BASIC, ...HIRAGANA_DAKUON].flatMap(r => r.chars);
const ALL_KATAKANA_POOL = [...KATAKANA_BASIC, ...KATAKANA_DAKUON].flatMap(r => r.chars);
const ALL_ROMAJI_POOL = Array.from(new Set(Object.values(ROMAJI_MAP)));

const App = () => {
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState('HOME'); 
  const [charType, setCharType] = useState('HIRAGANA');
  const [mode, setMode] = useState('GAME_HINT'); 
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [targetCharIndex, setTargetCharIndex] = useState(0);
  const [randomTarget, setRandomTarget] = useState('');
  const [currentWord, setCurrentWord] = useState(null); 
  const [scoreCount, setScoreCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [cards, setCards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userName, setUserName] = useState('');
  const [isError, setIsError] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);
  const [isRowLimited, setIsRowLimited] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [feedback, setFeedback] = useState(null); 
  const [wrongItems, setWrongItems] = useState([]); 

  const recognitionRef = useRef(null);
  const targetValueRef = useRef(''); 
  const scoreRef = useRef(0);
  const timerRef = useRef(null);
  const lockRef = useRef(false); // 次の問題への判定ロック
  const isListeningRef = useRef(false);

  // --- Functions ---
  const saveScore = useCallback(async (val, currentMode) => {
    if (!user || !db || !isScoredMode(currentMode)) return;
    try {
      await addDoc(collection(db, 'artifacts', currentAppId, 'public', 'data', 'leaderboard'), {
        userId: user.uid,
        userName: userName || 'Anonymous Learner',
        score: val,
        mode: currentMode,
        charType: charType,
        date: new Date().toISOString()
      });
    } catch (e) { console.error("Score save failed:", e); }
  }, [user, userName, charType]);

  const generateNewTarget = useCallback((currentMode, rowIdx = null, charIdx = null) => {
    const isRomajiSelect = currentMode.includes('ROMAJI');
    const kanaPool = charType === 'HIRAGANA' ? ALL_HIRAGANA_POOL : ALL_KATAKANA_POOL;
    const currentRows = charType === 'HIRAGANA' 
        ? (currentMode.includes('DAKUON') ? HIRAGANA_DAKUON : HIRAGANA_BASIC)
        : (currentMode.includes('DAKUON') ? KATAKANA_DAKUON : KATAKANA_BASIC);

    const activeRowIdx = rowIdx !== null ? rowIdx : currentRowIndex;
    const activeCharIdx = charIdx !== null ? charIdx : targetCharIndex;

    if (currentMode === 'GAME_VOICE') {
      const pool = charType === 'HIRAGANA' ? VOICE_QUIZ_WORDS_HIRAGANA : VOICE_QUIZ_WORDS_KATAKANA;
      const targetObj = pool[Math.floor(Math.random() * pool.length)];
      setCurrentWord(targetObj);
      targetValueRef.current = targetObj.word;
      
      // 判定クールタイム：0.8秒間は古い音声入力を無視して「赤色」が出るのを防ぐ
      setTimeout(() => { lockRef.current = false; }, 800); 
      return targetObj;
    } else if (currentMode.includes('RANDOM')) {
      const target = kanaPool[Math.floor(Math.random() * kanaPool.length)];
      setRandomTarget(target);
      targetValueRef.current = target;
      const correctVal = isRomajiSelect ? ROMAJI_MAP[target] : target;
      const otherPool = isRomajiSelect ? ALL_ROMAJI_POOL.filter(v => v !== correctVal) : kanaPool.filter(v => v !== target);
      
      const distractors = [];
      const tempPool = [...otherPool];
      while (distractors.length < 5) { 
        const idx = Math.floor(Math.random() * tempPool.length);
        distractors.push(tempPool.splice(idx, 1)[0]);
      }
      const combined = [correctVal, ...distractors].map(val => ({ val, id: Math.random() }));
      setCards(combined.sort(() => Math.random() - 0.5));
      lockRef.current = false;
      return target;
    } else {
      const target = currentRows[activeRowIdx]?.chars[activeCharIdx] || '';
      targetValueRef.current = target;
      const correctVal = isRomajiSelect ? ROMAJI_MAP[target] : target;
      const otherPool = isRomajiSelect ? ALL_ROMAJI_POOL.filter(v => v !== correctVal) : kanaPool.filter(v => v !== target);
      
      const distractors = [];
      const tempPool = [...otherPool];
      while (distractors.length < 5) { 
        const idx = Math.floor(Math.random() * tempPool.length);
        distractors.push(tempPool.splice(idx, 1)[0]);
      }
      const combined = [correctVal, ...distractors].map(val => ({ val, id: Math.random() }));
      setCards(combined.sort(() => Math.random() - 0.5));
      lockRef.current = false;
      return target;
    }
  }, [charType, currentRowIndex, targetCharIndex]);

  const handleCorrect = useCallback(() => {
    if (lockRef.current) return;
    lockRef.current = true; // 判定ロック

    setRecognizedText(''); // 表示を消去
    const nextScore = scoreRef.current + 1;
    setScoreCount(nextScore);
    scoreRef.current = nextScore;
    
    setFeedback('correct');
    
    setTimeout(() => {
      setFeedback(null);
      if (mode === 'GAME_VOICE' || mode.includes('RANDOM')) {
        generateNewTarget(mode);
      } else {
        const currentRows = charType === 'HIRAGANA' 
            ? (mode.includes('DAKUON') ? HIRAGANA_DAKUON : HIRAGANA_BASIC)
            : (mode.includes('DAKUON') ? KATAKANA_DAKUON : KATAKANA_BASIC);

        const nextCharIdx = targetCharIndex + 1;
        if (nextCharIdx < (currentRows[currentRowIndex]?.chars.length || 0)) {
          setTargetCharIndex(nextCharIdx);
          generateNewTarget(mode, currentRowIndex, nextCharIdx); 
          setTimeout(() => { lockRef.current = false; }, 200); 
        } else {
          if (isRowLimited) {
            setTargetCharIndex(0); 
            generateNewTarget(mode, currentRowIndex, 0);
          } else {
            setGameState('CLEAR');
          }
        }
      }
    }, 400);
  }, [mode, charType, targetCharIndex, currentRowIndex, generateNewTarget, isRowLimited]);

  const handleSkip = () => {
    if (lockRef.current) return;
    lockRef.current = true;
    setRecognizedText('');
    setFeedback(null);
    setIsError(false);
    generateNewTarget(mode);
  };

  const handleWrong = useCallback((userVal) => {
    if (feedback !== null || mode === 'GAME_VOICE' || lockRef.current) return; 
    setIsError(true);
    setFeedback('wrong');
    setTimeout(() => {
        setFeedback(null);
        setIsError(false);
    }, 400);
    
    if (isScoredMode(mode)) {
      setMissCount(prev => prev + 1);
    }
  }, [feedback, mode]);

  const handleCardClickWrap = useCallback((card) => {
    if (gameState !== 'PLAYING' || mode === 'GAME_VOICE' || feedback !== null || lockRef.current) return;
    const targetCharVal = mode.includes('RANDOM') ? randomTarget : targetValueRef.current;
    const correctVal = mode.includes('ROMAJI') ? ROMAJI_MAP[targetCharVal] : targetCharVal;
    if (card.val === correctVal) {
      handleCorrect();
    } else {
      handleWrong(card.val);
    }
  }, [gameState, mode, feedback, randomTarget, handleCorrect, handleWrong]);

  const checkVoiceAnswer = useCallback((transcript) => {
    if (gameState !== 'PLAYING' || mode !== 'GAME_VOICE' || feedback === 'correct' || lockRef.current) return;
    
    const cleanT = transcript.replace(/[。、.?! \s]/g, '').toLowerCase();
    const target = targetValueRef.current; 
    if (!target || cleanT === '') return;

    const pool = charType === 'HIRAGANA' ? VOICE_QUIZ_WORDS_HIRAGANA : VOICE_QUIZ_WORDS_KATAKANA;
    const wordObj = pool.find(w => w.word === target);
    const correctVariants = wordObj ? [...wordObj.variants, wordObj.word] : [target];
    
    const isMatched = correctVariants.some(v => cleanT.includes(v.toLowerCase()));

    if (isMatched) {
      handleCorrect();
    } else {
      // 誤答時のシェイク
      if (!isError && !lockRef.current) {
        setIsError(true);
        setTimeout(() => setIsError(false), 400);
      }
    }
  }, [gameState, mode, charType, handleCorrect, feedback, isError]);

  const checkVoiceAnswerRef = useRef();
  checkVoiceAnswerRef.current = checkVoiceAnswer;

  // --- Speech Recognition ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (!recognitionRef.current) {
        const recognition = new SpeechRecognition();
        // スマホURLアクセスのために continuous: true を使用
        recognition.continuous = true; 
        recognition.interimResults = true; 
        recognition.lang = 'ja-JP';
        
        recognition.onend = () => { 
            if (isListeningRef.current && gameState === 'PLAYING') {
                try { recognition.start(); } catch (e) {}
            }
        };

        recognition.onresult = (event) => {
            if (lockRef.current) return;
            let currentText = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                currentText = event.results[i][0].transcript;
            }
            setRecognizedText(currentText);
            if (checkVoiceAnswerRef.current) checkVoiceAnswerRef.current(currentText);
        };
        recognitionRef.current = recognition;
    }
  }, [gameState]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      try { recognitionRef.current.stop(); } catch(e) {}
      setRecognizedText('');
    } else {
      isListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        try { recognitionRef.current.abort(); setTimeout(() => recognitionRef.current.start(), 100); } catch(e2) {}
      }
    }
  };

  useEffect(() => {
    if (!isConfigValid || !auth) { return; }
    signInAnonymously(auth).catch(e => setFirebaseError(e));
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

  const startSession = (selectedMode, rowIdx = null) => {
    setMode(selectedMode);
    setCurrentRowIndex(rowIdx !== null ? rowIdx : 0);
    setIsRowLimited(rowIdx !== null);
    setTargetCharIndex(0);
    setMissCount(0);
    setScoreCount(0);
    scoreRef.current = 0;
    setTimeLeft(60); 
    setIsError(false);
    setFeedback(null);
    setRecognizedText('');
    setWrongItems([]); 
    lockRef.current = false;
    setGameState('PLAYING');
    setStartTime(Date.now());

    if (selectedMode === 'GAME_VOICE') {
      // 最初のターゲット生成
      generateNewTarget('GAME_VOICE');
      setIsListening(true);
      isListeningRef.current = true;
      setTimeout(() => { 
        if (recognitionRef.current) try { recognitionRef.current.start(); } catch(e) {} 
      }, 500);
    } else {
      generateNewTarget(selectedMode, rowIdx, 0);
    }
  };

  const handleReturnHome = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (timerRef.current) clearInterval(timerRef.current);
    isListeningRef.current = false;
    setIsListening(false); 
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch(e) {} }
    setGameState('HOME');
    setIsError(false);
    setFeedback(null);
    setRecognizedText('');
    setWrongItems([]);
  };

  useEffect(() => {
    if (gameState === 'PLAYING' && startTime && isScoredMode(mode)) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const diff = now - startTime;
        const remaining = Math.max(0, (60000 - diff) / 1000);
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setGameState('CLEAR');
          saveScore(scoreRef.current, mode);
        }
      }, 50); 
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, mode, startTime, saveScore]);

  // レンダリング用のターゲット表示
  const targetCharForDisplay = (() => {
    if (mode === 'GAME_VOICE') return currentWord ? currentWord.word : '...';
    const base = mode.includes('RANDOM') ? randomTarget : targetValueRef.current;
    if (!mode.includes('ROMAJI')) return ROMAJI_MAP[base] || base;
    return base || '...';
  })();

  const renderRankingBox = (title, records) => (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <h4 className="text-[10px] font-black text-slate-500 mb-3 uppercase border-b border-slate-100 pb-1 leading-tight">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[8px] text-slate-300 uppercase font-black">
              <th className="pb-2 w-8">순위</th>
              <th className="pb-2">이름 / 학번</th>
              <th className="pb-2 text-right">점수</th>
              <th className="pb-2 text-right">날짜</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.length === 0 ? (
              <tr><td colSpan="4" className="text-[9px] text-slate-300 italic text-center py-4">아직 기록이 없습니다</td></tr>
            ) : (
              records.map((entry, i) => (
                <tr key={entry.id} className="text-[10px]">
                  <td className={`py-2 font-black ${i===0?'text-slate-900':i===1?'text-slate-50':'text-slate-400'}`}>{i+1}</td>
                  <td className="py-2 text-slate-700 font-bold truncate max-w-[80px]">{entry.userName}</td>
                  <td className="py-2 text-right font-mono font-black text-slate-900">{entry.score}pt</td>
                  <td className="py-2 text-right text-slate-400 whitespace-nowrap">{formatDate(entry.date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-slate-50 text-slate-800 flex flex-col font-ud selection:bg-slate-200 overflow-hidden relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap');
        .font-ud { font-family: 'BIZ UDPGothic', 'Noto Sans KR', sans-serif; }
        .font-logo { font-family: 'Montserrat', sans-serif; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        .text-logo-gradient { background: linear-gradient(135deg, #111827 0%, #374151 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        @keyframes mic-pulse { 0% { box-shadow: 0 0 0 0 rgba(31, 41, 55, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(31, 41, 55, 0); } 100% { box-shadow: 0 0 0 0 rgba(31, 41, 55, 0); } }
        .mic-active { animation: mic-pulse 1.5s infinite; }
      `}} />

      {feedback && feedback === 'wrong' && !mode.includes('VOICE') && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-rose-500/10">
          <div className="flex flex-col items-center">
             <div className="bg-rose-500 rounded-full p-8 shadow-2xl border-4 border-white animate-shake"><XCircle className="w-24 h-24 text-white" /></div>
          </div>
        </div>
      )}

      <header className="flex-none p-3 sm:p-4 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-sm z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-slate-800" />
          <h1 className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">KANA MASTER</h1>
        </div>
        {gameState === 'PLAYING' && isScoredMode(mode) && (
          <div className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <span className="font-mono text-slate-800 text-xs font-bold tabular-nums">
              {timeLeft.toFixed(1)}s
            </span>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col p-3 sm:p-4 max-w-lg mx-auto w-full relative">
        {gameState === 'HOME' && (
          <div className="flex-1 flex flex-col space-y-4 py-2 animate-in fade-in duration-500">
            <div className="text-center space-y-2 py-4">
              <div className="inline-block relative">
                <h2 className="text-5xl font-logo font-black tracking-[-0.05em] text-logo-gradient leading-none">KANA MASTER</h2>
                <div className="h-1 w-full bg-slate-900 rounded-full opacity-60 mt-2 shadow-sm" />
              </div>
            </div>
            
            <div className="space-y-2 flex-none">
              {!firebaseError && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-slate-600" />
                    <div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase">이름 또는 학번</h4>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">랭킹(랜덤챌린지) 참여 시에만 입력 (선택 사항)</p>
                    </div>
                  </div>
                  <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-[12px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-700 transition-all shadow-inner" placeholder="Name or Student ID" />
                </div>
              )}
              <button onClick={() => setGameState('RECORDS')} className="w-full bg-slate-900 text-white py-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black shadow-lg shadow-slate-200 active:scale-95 hover:bg-slate-800 transition-all group">
                <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" /> 표시 (TOP 10)
              </button>
            </div>

            <div className="bg-slate-200/50 p-1 rounded-xl flex w-full max-w-[200px] mx-auto shadow-inner flex-none">
              <button onClick={() => setCharType('HIRAGANA')} className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all ${charType === 'HIRAGANA' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>あ</button>
              <button onClick={() => setCharType('KATAKANA')} className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all ${charType === 'KATAKANA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>ア</button>
            </div>

            <div className="space-y-6 pb-12">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 border-l-2 border-slate-900 pl-3 py-0.5 uppercase tracking-widest">로마자를 보고 {charType === 'HIRAGANA' ? '가나' : '가나'}를 선택</h3>
                  <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-4">
                    <div className="space-y-1.5">
                       <p className="text-[9px] font-black text-slate-300 uppercase">{charType === 'HIRAGANA' ? '기본음 (あ〜わ)' : '기본음 (ア〜ワ)'}</p>
                       <div className="grid grid-cols-5 gap-2">
                         {(charType === 'HIRAGANA' ? HIRAGANA_BASIC : KATAKANA_BASIC).map((row, idx) => (
                           <button key={idx} onClick={() => startSession('GAME_HINT', idx)} className={`py-2.5 bg-white border border-slate-100 border-l-2 ${row.color} rounded-xl text-[11px] font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm`}>{row.chars[0]}</button>
                         ))}
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <p className="text-[9px] font-black text-slate-300 uppercase">{charType === 'HIRAGANA' ? '탁음·반탁음 (가〜파)' : '탁음·반탁음 (ガ〜パ)'}</p>
                       <div className="grid grid-cols-5 gap-2">
                         {(charType === 'HIRAGANA' ? HIRAGANA_DAKUON : KATAKANA_DAKUON).map((row, idx) => (
                           <button key={idx} onClick={() => startSession('GAME_DAKUON', idx)} className={`py-2.5 bg-white border border-slate-100 border-l-2 ${row.color} rounded-xl text-[11px] font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm`}>{row.chars[0]}</button>
                         ))}
                       </div>
                    </div>
                    <button onClick={() => startSession('GAME_RANDOM_ALL')} className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black shadow-lg hover:bg-slate-800 hover:-translate-y-1 active:scale-95 transition-all"><Dices className="w-4 h-4 text-slate-400" /> 랜덤 챌린지 (60s)</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 border-l-2 border-slate-400 pl-3 py-0.5 uppercase tracking-widest">{charType === 'HIRAGANA' ? '가나' : '가나'}를 보고 로마자를 선택</h3>
                  <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-4">
                    <div className="space-y-1.5">
                       <p className="text-[9px] font-black text-slate-300 uppercase">{charType === 'HIRAGANA' ? '기본음 (a〜n)' : '기본음 (a〜n)'}</p>
                       <div className="grid grid-cols-5 gap-2">
                         {(charType === 'HIRAGANA' ? HIRAGANA_BASIC : KATAKANA_BASIC).map((row, idx) => (
                           <button key={idx} onClick={() => startSession('GAME_ROMAJI_HINT', idx)} className={`py-2.5 bg-white border border-slate-100 border-l-2 ${row.color} rounded-xl text-[11px] font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm`}>{row.chars[0]}</button>
                         ))}
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <p className="text-[9px] font-black text-slate-300 uppercase">탁음·반탁음 (ga〜po)</p>
                       <div className="grid grid-cols-5 gap-2">
                         {(charType === 'HIRAGANA' ? HIRAGANA_DAKUON : KATAKANA_DAKUON).map((row, idx) => (
                           <button key={idx} onClick={() => startSession('GAME_ROMAJI_DAKUON', idx)} className={`py-2.5 bg-white border border-slate-100 border-l-2 ${row.color} rounded-xl text-[11px] font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm`}>{row.chars[0]}</button>
                         ))}
                       </div>
                    </div>
                    <button onClick={() => startSession('GAME_ROMAJI_RANDOM_ALL')} className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black shadow-lg hover:bg-slate-800 hover:-translate-y-1 active:scale-95 transition-all"><Dices className="w-4 h-4 text-purple-400" /> 랜덤 챌린지 (60s)</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-slate-400 border-l-2 border-slate-900 pl-3 py-0.5 uppercase tracking-widest">음성 입력 (단어)</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => startSession('GAME_VOICE')} className="bg-white border border-slate-100 p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] shadow-sm hover:border-slate-900 hover:bg-slate-50 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 rounded-2xl text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors shadow-sm"><Mic className="w-5 h-5" /></div>
                        <span className="text-xs font-black text-slate-700 group-hover:text-slate-900 transition-colors">낭독 챌린지</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </div>
            </div>
          </div>
        )}

        {gameState === 'RECORDS' && (
          <div className="flex-1 flex flex-col space-y-6 py-2 animate-in slide-in-from-right duration-500">
            <button onClick={() => setGameState('HOME')} className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 hover:text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4" /> Back to Home</button>
            <div className="space-y-8 pb-10">
               <h3 className="text-xs font-black text-slate-900 border-b-2 border-slate-900 pb-2 mb-4 uppercase tracking-tighter flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> 히라가나 랭킹 (Hiragana Ranking)</h3>
               <div className="grid grid-cols-1 gap-6">
                 {renderRankingBox("랜덤 (Roma→Kana)", leaderboard.filter(e => e.charType === 'HIRAGANA' && e.mode === 'GAME_RANDOM_ALL').sort((a,b)=>b.score-a.score).slice(0, 10))}
                 {renderRankingBox("랜덤 (Kana→Roma)", leaderboard.filter(e => e.charType === 'HIRAGANA' && e.mode === 'GAME_ROMAJI_RANDOM_ALL').sort((a,b)=>b.score-a.score).slice(0, 10))}
               </div>
               
               <h3 className="text-xs font-black text-slate-900 border-b-2 border-slate-900 pb-2 mb-4 uppercase tracking-tighter flex items-center gap-2 mt-8"><Trophy className="w-4 h-4 text-slate-400" /> 가타카나 랭킹 (Katakana Ranking)</h3>
               <div className="grid grid-cols-1 gap-6">
                 {renderRankingBox("랜덤 (Roma→Kana)", leaderboard.filter(e => e.charType === 'KATAKANA' && e.mode === 'GAME_RANDOM_ALL').sort((a,b)=>b.score-a.score).slice(0, 10))}
                 {renderRankingBox("랜덤 (Kana→Roma)", leaderboard.filter(e => e.charType === 'KATAKANA' && e.mode === 'GAME_ROMAJI_RANDOM_ALL').sort((a,b)=>b.score-a.score).slice(0, 10))}
               </div>
            </div>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="flex-1 flex flex-col space-y-2 h-full animate-in fade-in duration-500 overflow-hidden relative">
            <div className="flex justify-center flex-none py-1">
              <button onClick={handleReturnHome} className="flex items-center gap-2 px-8 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-900 transition-all active:scale-90 shadow-sm z-[100] group"><Home className="w-4 h-4 text-slate-400 group-hover:text-slate-900" /><span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-widest">Home</span></button>
            </div>
            <div className="flex justify-between items-end px-2 flex-none min-h-[40px]">
              {isScoredMode(mode) && (
                <div className="leading-none">
                  <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Score</p>
                  <h3 className="text-base font-black text-slate-900 mt-1 uppercase">{scoreCount} pt</h3>
                </div>
              )}
            </div>
            {/* ターゲット表示エリア：正解時は緑、エラー時は赤+揺れ */}
            <div className={`relative flex-none ${mode === 'GAME_VOICE' ? 'h-[160px]' : 'h-[110px]'} sm:h-[150px] bg-white border rounded-[2.5rem] sm:rounded-[3rem] flex flex-col items-center justify-center overflow-hidden shadow-sm transition-all duration-300 
                ${isError ? 'animate-shake border-rose-300 bg-rose-50 shadow-rose-100 shadow-lg' : feedback === 'correct' ? 'border-emerald-400 bg-emerald-50 shadow-emerald-100 shadow-lg' : 'border-slate-100'}`}>
               <div className="flex items-center gap-8 w-full px-6">
                  <div className="flex-1 flex flex-col items-center">
                      <p className="text-[8px] text-slate-300 uppercase tracking-[0.4em] font-black mb-2">Target</p>
                      <span className={`text-5xl sm:text-7xl font-ud font-black leading-none tracking-tighter transition-colors duration-300 ${isError ? 'text-rose-600' : feedback === 'correct' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {targetCharForDisplay}
                      </span>
                      {mode === 'GAME_VOICE' && currentWord && (
                        <span className="text-[11px] text-slate-500 mt-2 font-black uppercase tracking-widest">{currentWord.meaning}</span>
                      )}
                  </div>
               </div>
            </div>
            
            {mode === 'GAME_VOICE' && (
              <div className="flex justify-center mt-2">
                <button onClick={handleSkip} className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest">
                  <FastForward className="w-3.5 h-3.5" /> Skip Question
                </button>
              </div>
            )}

            <div className="flex-1 flex flex-col justify-center items-center min-h-0">
                {mode === 'GAME_VOICE' ? (
                  <div className="flex flex-col items-center space-y-4 animate-in zoom-in duration-300">
                    <button onClick={toggleListening} className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 ${isListening ? 'bg-slate-900 mic-active' : 'bg-slate-200'}`}>
                      {isListening ? <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white" /> : <MicOff className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />}
                    </button>
                    <div className="text-center space-y-1">
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{isListening ? 'Listening...' : 'Tap Mic to Start'}</p>
                      <div className={`min-h-[40px] px-5 py-2 bg-white rounded-2xl border flex items-center justify-center shadow-sm transition-all duration-300 ${isError ? 'border-rose-200 shadow-rose-50' : 'border-slate-100'}`}>
                          <span className={`text-lg font-ud font-black transition-colors duration-300 ${isError ? 'text-rose-400' : 'text-slate-400'}`}>{recognizedText || '...'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`grid w-full gap-3 flex-1 content-center grid-cols-2`}>
                    {cards.map((card) => (
                      <button key={card.id} onClick={() => handleCardClickWrap(card)} className={`bg-white border border-slate-100 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-2xl font-black text-slate-700 shadow-sm hover:border-slate-900 hover:text-slate-900 hover:-translate-y-1 active:scale-95 transition-all`} style={{ minHeight: '70px' }}>
                        {card.val}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {(gameState === 'GAMEOVER' || gameState === 'CLEAR') && (
           <div className="flex-1 flex flex-col items-center py-4 space-y-6 animate-in fade-in zoom-in duration-500 overflow-y-auto">
             <Trophy className={`w-16 h-16 drop-shadow-xl flex-none ${gameState === 'GAMEOVER' ? 'text-slate-300' : 'text-amber-500 animate-bounce'}`} />
             <div className="text-center space-y-0.5 flex-none">
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{gameState === 'GAMEOVER' ? 'Game Over' : 'Mission Clear'}</h2>
             </div>
             <div className="py-6 px-12 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl text-center min-w-[200px] flex-none">
                <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Session Result</p>
                <p className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">{scoreCount} pt</p>
             </div>
             
             {wrongItems.length > 0 && (
               <div className="w-full bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm overflow-hidden flex flex-col">
                 <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
                   <AlertCircle className="w-4 h-4 text-indigo-500" />
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Review Section (복습)</h4>
                 </div>
                 <div className="grid grid-cols-2 gap-2.5 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                    {wrongItems.map((item, idx) => (
                       <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                         <span className="text-base font-black text-slate-400">{item.target}</span>
                         <ChevronRight className="w-3 h-3 text-slate-300" />
                         <span className="text-base font-black text-slate-900">{item.correct}</span>
                       </div>
                    ))}
                 </div>
               </div>
             )}

             <div className="w-full max-w-xs space-y-3 flex-none">
               <button onClick={() => startSession(mode, isRowLimited ? currentRowIndex : null)} className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-2 hover:bg-slate-800 hover:-translate-y-1 active:scale-95 transition-all shadow-xl">
                 <RefreshCw className="w-4 h-4" /> 다시 도전하기
               </button>
               <button onClick={handleReturnHome} className="w-full text-slate-400 hover:text-indigo-600 text-[11px] font-black uppercase tracking-widest py-3 transition-colors">홈으로 돌아가기</button>
             </div>
           </div>
        )}
      </main>
      <footer className="flex-none p-6 text-center bg-white border-t border-slate-100">
        <p className="text-[7px] text-slate-300 uppercase tracking-[0.4em] font-black">&copy; {new Date().getFullYear()} Akihiro Suwa</p>
      </footer>
    </div>
  );
};

export default App;
