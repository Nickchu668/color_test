import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { 
  Globe, Eye, EyeOff, ExternalLink, Activity, X as XIcon, X, 
  ShieldAlert, ClipboardCheck, Microscope, Cpu, ShieldCheck, 
  Database, Target, FileText, TrendingUp, AlertCircle, History, Stethoscope 
} from 'lucide-react';

// --- 診斷階段配置 ---
const LEVELS = [
  { level: 1, rows: 3, cols: 3, difficulty: 30, type: 'screen', color: 'red', deltaE: 30.0 },
  { level: 2, rows: 3, cols: 3, difficulty: 25, type: 'screen', color: 'green', deltaE: 25.0 },
  { level: 3, rows: 3, cols: 3, difficulty: 25, type: 'screen', color: 'blue', deltaE: 25.0 },
  { level: 4, rows: 3, cols: 3, difficulty: 22, type: 'screen', color: 'yellow', deltaE: 22.0 },
  { level: 5, rows: 4, cols: 4, difficulty: 15, type: 'challenge', deltaE: 15.0 },
  { level: 6, rows: 4, cols: 4, difficulty: 12, type: 'challenge', deltaE: 12.0 },
  { level: 7, rows: 5, cols: 5, difficulty: 8.5, type: 'challenge', deltaE: 8.5 },
  { level: 8, rows: 5, cols: 5, difficulty: 6.0, type: 'challenge', deltaE: 6.0 },
  { level: 9, rows: 6, cols: 6, difficulty: 4.0, type: 'challenge', deltaE: 4.0 },
  { level: 10, rows: 6, cols: 6, difficulty: 2.5, type: 'challenge', deltaE: 2.5 },
  { level: 11, rows: 7, cols: 7, difficulty: 1.5, type: 'challenge', deltaE: 1.5 },
  { level: 12, rows: 7, cols: 7, difficulty: 0.8, type: 'challenge', deltaE: 0.8 }
];

const TRANSLATIONS = {
  zh: {
    title: '視覺功能評估系統 v3.0', level: 'STAGE', time: 'ELAPSED', lives: 'HEALTH', best: 'RECORD',
    start: '開始專業診斷', next: '下一階段分析', retry: '重新評估',
    passed: '階段評估完成', failedAt: '分析中斷於 STAGE_{n}',
    completedAt: '全系統校準達成',
    reportTitle: '視力初步測試結果', viewReport: '檢視測試結果',
    summary: '臨床診斷總結', deltaE: '最小可辨色差 ΔE ≈', avgTime: '平均反應秒數',
    hueSensitivity: '頻譜反應熱圖',
    rating1: '基本辨色能力 (Basic)',
    rating2: '良好辨色能力 (Good)',
    rating3: '專業辨色能力 (Professional)',
    rating4: '鷹眼級色感 (Eagle Eye)',
    riskRed: '高風險紅綠色覺異常傾向',
    riskBlue: '高風險藍黃色覺異常傾向',
    riskNone: '色盲篩查未發現明顯異常',
    passedMsg: '篩查初步通過，具備優良辨識度。',
    medicalAdvice: '建議預約專業眼科醫生進行 Ishihara 或 Farnsworth-Munsell 100 測試。',
    eduTip: '提示：色弱可能與遺傳、年齡、白內障或視網膜病變相關。',
    disclaimer: '本測試由 seeclinic.hk 技術支持，僅供初步篩查參考，不具臨床診斷效力。',
    bookNow: '預約眼科專科檢查',
    download: '下載報告檔案 (PNG)',
    copyright: 'Copyright©2025 www.seeclinic.hk',
    screenZone: '篩查區', challengeZone: '挑戰區',
    diagnosisTrend: '階段診斷趨勢',
    spectrumHeatmap: '頻譜反應熱圖',
    markerDesc: '*色標指示閣下反應遲緩之頻譜區塊。',
    gameOver: '測試完結'
  },
  en: {
    title: 'Visual Assessment System v3.0', level: 'STAGE', time: 'ELAPSED', lives: 'HEALTH', best: 'RECORD',
    start: 'START DIAGNOSIS', next: 'NEXT ANALYSIS', retry: 'RE-EVALUATE',
    passed: 'STAGE COMPLETE', failedAt: 'ABORTED AT STAGE_{n}',
    completedAt: 'ALL CALIBRATIONS OK',
    reportTitle: 'Preliminary Vision Test Result', viewReport: 'View Test Result',
    summary: 'Diagnostic Summary', deltaE: 'Sensitivity ΔE ≈', avgTime: 'Avg Response',
    hueSensitivity: 'Spectrum Response',
    rating1: 'Basic Perception',
    rating2: 'Good Perception',
    rating3: 'Professional Vision',
    rating4: 'Eagle Eye Vision',
    riskRed: 'High Risk: Red-Green Deficiency',
    riskBlue: 'High Risk: Blue-Yellow Deficiency',
    riskNone: 'No screening anomalies detected',
    passedMsg: 'Screening passed with excellent color perception.',
    medicalAdvice: 'Consult specialist for Ishihara or FM100 assessment.',
    eduTip: 'Tip: Color impairment can relate to age or retinal conditions.',
    disclaimer: 'Results are for preliminary screening only.',
    bookNow: 'Book Eye Specialist Appointment',
    download: 'Download Report (PNG)',
    copyright: 'Copyright©2025 www.seeclinic.hk',
    screenZone: 'Screening', challengeZone: 'Challenge',
    diagnosisTrend: 'Diagnostic Trend',
    spectrumHeatmap: 'Spectrum Heatmap',
    markerDesc: '*Marker shows slowest recognition area.',
    gameOver: 'Test Finished'
  }
};

const App = () => {
  const [lang, setLang] = useState('zh');
  const [status, setStatus] = useState('start');
  const [lv, setLv] = useState(0);
  const [lives, setLives] = useState(3);
  const [timer, setTimer] = useState(0);
  const [best, setBest] = useState(0);
  const [isBlind, setIsBlind] = useState(false);
  const [colors, setColors] = useState(null);
  const [wrongs, setWrongs] = useState([]);
  const [shake, setShake] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [sessionStats, setSessionStats] = useState([]);
  const [lvStartTime, setLvStartTime] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const reportUid = useMemo(() => `V3_${Math.random().toString(36).substr(2, 6).toUpperCase()}`, []);

  // SEO: 同步更新 HTML Lang 屬性
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  }, [lang]);

  useEffect(() => {
    const b = localStorage.getItem('sc_best_v3'); if(b) setBest(parseInt(b));
  }, []);

  useEffect(() => {
    let itv; if(status === 'playing') itv = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(itv);
  }, [status]);

  const initLevel = useCallback((idx) => {
    setLv(idx);
    const config = LEVELS[idx];
    let h, s, l;
    
    if (config.type === 'screen') {
      if (config.color === 'red') h = 0;
      else if (config.color === 'green') h = 120;
      else if (config.color === 'blue') h = 240;
      else h = 60;
      s = 85; l = 45;
    } else {
      h = Math.floor(Math.random() * 360);
      s = 60 + Math.random() * 20;
      l = 40 + Math.random() * 10;
    }

    const off = config.difficulty * (Math.random() > 0.5 ? 1 : -1);
    setColors({ 
      h,
      base: `hsl(${h}, ${s}%, ${l}%)`, 
      odd: `hsl(${h + off}, ${s}%, ${l + (off/2.5)}%)`, 
      idx: Math.floor(Math.random() * (config.rows * config.cols)) 
    });
    setWrongs([]);
    setLvStartTime(Date.now());
    setStatus('playing');
  }, []);

  const recordStat = (success) => {
    setSessionStats(prev => [...prev, {
      level: lv + 1,
      duration: (Date.now() - lvStartTime) / 1000,
      hue: colors.h,
      isSuccess: success,
      deltaE: LEVELS[lv].deltaE,
      type: LEVELS[lv].type
    }]);
  };

  const handleStartGame = () => {
    setLives(3); setTimer(0); setSessionStats([]); setShowReport(false); initLevel(0);
  };

  const click = (i) => {
    if(status !== 'playing' || wrongs.includes(i)) return;
    if(i === colors.idx) {
      confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
      recordStat(true);
      if(lv === 11) { setStatus('finished'); if(12 > best) setBest(12); }
      else setStatus('passed');
    } else {
      setWrongs(prev => [...prev, i]); 
      setShake(true); 
      setTimeout(() => setShake(false), 500);
      
      if(lives <= 1) { 
        recordStat(false); 
        setStatus('failed'); 
      }
      else setLives(lives - 1);
    }
  };

  const t = TRANSLATIONS[lang];
  const reached = status === 'finished' ? 12 : lv + (status === 'passed' ? 1 : 0);
  const avgResponse = sessionStats.length ? (sessionStats.reduce((a, b) => a + b.duration, 0) / sessionStats.length).toFixed(2) : 0;
  
  const worstHue = sessionStats.length ? [...sessionStats].sort((a,b) => b.duration - a.duration)[0].hue : 0;
  
  const riskAnalysis = () => {
    const screens = sessionStats.filter(s => s.type === 'screen');
    const redGreenFail = screens.some(s => (s.hue === 0 || s.hue === 120) && (!s.isSuccess || s.duration > 6));
    if (redGreenFail) return t.riskRed;
    return t.riskNone;
  };

  const downloadReport = async () => {
    setIsCapturing(true);
    const el = document.getElementById('clinical-report');
    if (!el) return;

    try {
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById('clinical-report');
          if (clonedEl) {
            clonedEl.style.maxHeight = 'none';
            clonedEl.style.overflow = 'visible';
            clonedEl.style.height = 'auto';
            clonedEl.classList.remove('max-h-[85vh]', 'overflow-y-auto', 'no-scrollbar');
          }
        }
      });
      const link = document.createElement('a');
      link.download = `seeclinic-report-${reportUid}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Snapshot failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 max-w-lg mx-auto pb-10 min-h-screen relative overflow-hidden">
      <header className="w-full mb-8 space-y-4 pt-6 z-20">
        <div className="flex justify-between items-end medical-glass p-3 rounded-2xl border border-white/50">
          <div><h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">{t.title}</h1></div>
          <div className="flex gap-2">
            <button aria-label="Switch Language" onClick={() => setLang(lang==='zh'?'en':'zh')} className="p-2.5 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition active:scale-90"><Globe size={18} className="text-slate-600"/></button>
            <button aria-label="Color Blind Mode" onClick={() => setIsBlind(!isBlind)} className={`p-2.5 rounded-lg shadow-sm border transition active:scale-90 ${isBlind?'bg-blue-600 text-white':'bg-white text-slate-400'}`}>{isBlind?<EyeOff size={18}/>:<Eye size={18}/>}</button>
          </div>
        </div>
        <div className="flex gap-1 h-2" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i < reached ? 'bg-blue-600' : i === lv ? 'bg-blue-200 animate-pulse' : 'bg-slate-200'}`}></div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[{label: t.level, val: `${lv+1}/12`}, {label: t.time, val: `${timer}s`}, {label: t.lives, val: Array(lives).fill('●').join(''), color:'text-blue-600'}, {label: t.best, val: best}].map((item, i) => (
            <div key={i} className="bg-white/90 p-2 rounded-lg border border-slate-100 shadow-sm">
              <div className="text-[8px] font-black text-slate-400 uppercase mb-1">{item.label}</div>
              <div className={`text-xs font-black mono ${item.color || 'text-slate-700'}`}>{item.val}</div>
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 w-full flex items-center justify-center min-h-[420px] relative z-20">
        {status === 'start' ? (
          <div className="text-center p-8 medical-glass rounded-3xl border-t-4 border-blue-600 w-full relative">
            <div className="hud-corner hud-tl" /><div className="hud-corner hud-tr" />
            <div className="hud-corner hud-bl" /><div className="hud-corner hud-br" />
            <div className="mb-6 flex justify-center"><div className="bg-blue-50 p-6 rounded-full"><Microscope size={64} className="text-blue-600" /></div></div>
            <h2 className="text-2xl font-black mb-3 text-slate-900">{t.title}</h2>
            <p className="text-slate-500 mb-8 font-medium text-xs px-4">{lang === 'zh' ? '系統將先進行色覺評估，隨後進入高難度挑戰。' : 'Screening stages, followed by high-precision challenges.'}</p>
            <button onClick={handleStartGame} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl uppercase tracking-widest hover:bg-black transition-all active:scale-95">{t.start}</button>
          </div>
        ) : colors && (
          <div className={`relative p-5 medical-glass rounded-3xl border border-slate-200 w-full aspect-square ${shake?'animate-shake':''}`}>
            <div className="scan-line" />
            <div className="grid gap-2 h-full" style={{ gridTemplateColumns: `repeat(${LEVELS[lv].cols}, 1fr)` }}>
              {[...Array(LEVELS[lv].rows * LEVELS[lv].cols)].map((_, i) => (
                <button key={i} aria-label={`Tile ${i}`} onClick={() => click(i)} className="rounded-xl relative overflow-hidden transition-all active:scale-95 border border-black/5" style={{ backgroundColor: i === colors.idx ? colors.odd : colors.base }}>
                   {wrongs.includes(i) && (
                    <motion.div initial={{scale:0}} animate={{scale:1}} className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
                      <XIcon className="text-white/80 drop-shadow-md" size={32} strokeWidth={6} />
                    </motion.div>
                   )}

                   {isBlind && <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: i===colors.idx ? 'radial-gradient(circle, #000 20%, transparent 20%)' : 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' }} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {(status === 'passed' || status === 'failed' || status === 'finished') && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-sm my-auto">
              {!showReport ? (
                <div className="bg-white p-8 pt-12 rounded-3xl shadow-2xl text-center relative border-t-8 border-blue-600">
                  <button aria-label="Close" onClick={() => setStatus('start')} className="absolute top-4 right-4 text-slate-300"><X size={24} /></button>
                  <h2 className="text-xl font-black mb-6 text-slate-900">{status === 'passed' ? t.passed : t.gameOver}</h2>
                  <div className="flex flex-col gap-3">
                    {status === 'passed' ? <button onClick={() => initLevel(lv + 1)} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition active:scale-95">{t.next}</button> : <><button onClick={() => setShowReport(true)} className="w-full py-5 bg-slate-900 text-white rounded-xl font-black text-sm flex justify-center gap-2 items-center hover:bg-black transition active:scale-95"><FileText size={18}/> {t.viewReport}</button><button onClick={handleStartGame} className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-200 transition active:scale-95">{t.retry}</button></>}
                  </div>
                </div>
              ) : (
                <div id="clinical-report" className="report-sheet p-8 rounded-[2rem] border-4 border-slate-100 relative text-slate-800 max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl">
                    <button aria-label="Close Report" onClick={() => setShowReport(false)} data-html2canvas-ignore="true" className="absolute top-6 right-6 text-slate-300 transition hover:text-slate-500"><X size={28} strokeWidth={3} /></button>
                    <div className="flex justify-between items-start mb-8 border-b-2 border-slate-100/50 pb-6 pr-8">
                        <div>
                            <h3 className="text-blue-600 font-black text-[11px] uppercase mb-2 tracking-tight">SEECLINIC.HK CLINICAL LAB</h3>
                            <div className="flex items-start gap-3">
                                <Stethoscope size={28} className="text-blue-600 shrink-0 mt-1"/>
                                <h2 className="text-xl font-black text-slate-900 leading-tight">{t.reportTitle}</h2>
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-400 text-right mono uppercase shrink-0">UID: {reportUid}<br/>{new Date().toLocaleDateString('ja-JP')}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50/80 p-5 rounded-2xl"><p className="text-[10px] text-slate-400 font-black mb-1">{t.deltaE}</p><p className="text-3xl font-black text-blue-600 mono">{LEVELS[Math.min(reached, 11)].deltaE}</p></div>
                        <div className="bg-slate-50/80 p-5 rounded-2xl"><p className="text-[10px] text-slate-400 font-black mb-1">{t.avgTime}</p><p className="text-3xl font-black text-slate-700 mono">{avgResponse}s</p></div>
                    </div>
                    <div className="mb-8 p-6 bg-blue-50/40 rounded-3xl">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-3">{t.summary}</p>
                        <div className="flex justify-between items-center mb-4"><span className="text-lg font-black text-blue-800">{reached >= 12 ? t.rating4 : reached >= 5 ? t.rating2 : t.rating1}</span><div className="medical-seal uppercase text-[9px] px-3 py-1 bg-white/50">{reached >= 12 ? 'Excellent' : 'Evaluated'}</div></div>
                        <div className="text-[20px] font-black text-red-600 mb-5 flex items-center gap-3 border-l-4 border-red-500 pl-4 leading-tight">
                            <ShieldAlert size={20} strokeWidth={3} /> {riskAnalysis()}
                        </div>
                        <div className="bg-white p-4 rounded-2xl text-[12px] text-slate-600 font-bold leading-relaxed">{reached < 5 ? t.medicalAdvice : t.passedMsg}</div>
                    </div>
                    
                    <div className="mb-10">
                        <p className="text-[11px] font-black uppercase text-slate-400 mb-4 flex items-center gap-2"><TrendingUp size={16}/> {t.diagnosisTrend}</p>
                        <div className="flex items-end h-24 gap-1 px-1 border-b-2 border-slate-100">
                           {sessionStats.map((s, i) => (
                             <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                <motion.div 
                                    initial={{ height: 0 }} 
                                    animate={{ height: `${Math.min((s.duration / 8) * 100, 100)}%` }}
                                    className={`w-full rounded-t-[2px] transition-colors ${s.isSuccess ? 'bg-blue-400/80' : 'bg-red-500/80'}`}
                                >
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap z-50 pointer-events-none transition-opacity">
                                        {s.duration.toFixed(2)}s
                                    </div>
                                </motion.div>
                                <div className="text-[7px] font-black mt-1 text-slate-300 mono">{s.level}</div>
                             </div>
                           ))}
                           {[...Array(Math.max(0, 12 - sessionStats.length))].map((_, i) => (
                               <div key={`empty-${i}`} className="flex-1 flex flex-col items-center justify-end h-full">
                                   <div className="w-full h-[2px] bg-slate-50"></div>
                                   <div className="text-[7px] font-black mt-1 text-slate-100 mono">{sessionStats.length + i + 1}</div>
                               </div>
                           ))}
                        </div>
                        <div className="flex justify-between mt-2 px-1">
                           <span className="text-[8px] font-black text-slate-300 uppercase italic leading-none">{t.screenZone} (LV 1-4)</span>
                           <span className="text-[8px] font-black text-slate-300 uppercase italic leading-none">{t.challengeZone} (LV 5-12)</span>
                        </div>
                    </div>

                    <div className="mb-10"><p className="text-[11px] font-black uppercase text-slate-400 mb-4 flex items-center gap-2"><History size={16}/> {t.spectrumHeatmap}</p><div className="flex h-5 rounded-full overflow-hidden border-2 border-slate-50 bg-slate-100 relative">{[...Array(30)].map((_, i) => (<div key={i} className="flex-1 h-full" style={{ backgroundColor: `hsl(${i * 12}, 80%, 60%)` }}></div>))}<motion.div className="absolute top-0 bottom-0 w-3 border-[3px] border-white shadow-xl bg-black/40" style={{ left: `calc(${(worstHue / 360) * 100}% - 6px)` }} /></div><p className="text-[10px] mt-4 text-slate-400 italic font-medium">{t.markerDesc}</p></div>
                    
                    <div className="space-y-4 mb-10" data-html2canvas-ignore="true">
                        <a href="https://seeclinic.hk/ophthalmology_center.asp?class_list_id=23" target="_blank" className="flex items-center justify-center gap-3 w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl transition-all hover:bg-blue-700 hover:-translate-y-1 active:scale-95"><ExternalLink size={20}/> {t.bookNow}</a>
                        <button onClick={downloadReport} disabled={isCapturing} className={`flex items-center justify-center gap-3 w-full py-5 bg-white text-slate-600 border-2 border-slate-100 rounded-2xl font-black text-sm uppercase transition-all hover:bg-slate-50 hover:-translate-y-1 active:scale-95 ${isCapturing ? 'opacity-50' : ''}`}><ClipboardCheck size={20}/> {isCapturing ? 'Processing...' : t.download}</button>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-100 text-[10px] text-slate-400 font-bold text-center uppercase leading-relaxed">{t.disclaimer}<div className="mt-2 text-[8px] text-slate-300 font-black">{t.copyright}</div></div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <footer className="mt-auto py-8 text-center"><p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] bg-white/40 inline-block px-3 py-1 rounded-full">{t.copyright}</p></footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);