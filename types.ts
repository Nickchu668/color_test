
export enum Language {
  ZH = 'zh',
  EN = 'en'
}

export interface LevelConfig {
  level: number;
  rows: number;
  cols: number;
  size: number;
  difficulty: number; // Used for HSL offset
}

export const LEVELS: LevelConfig[] = [
  { level: 1, rows: 3, cols: 3, size: 100, difficulty: 15 },
  { level: 2, rows: 4, cols: 4, size: 85, difficulty: 10 },
  { level: 3, rows: 4, cols: 4, size: 85, difficulty: 8 },
  { level: 4, rows: 5, cols: 5, size: 70, difficulty: 6 },
  { level: 5, rows: 5, cols: 5, size: 70, difficulty: 5 },
  { level: 6, rows: 5, cols: 5, size: 65, difficulty: 4 },
  { level: 7, rows: 5, cols: 6, size: 55, difficulty: 3 },
  { level: 8, rows: 5, cols: 6, size: 55, difficulty: 2 },
  { level: 9, rows: 6, cols: 6, size: 50, difficulty: 1.5 },
  { level: 10, rows: 6, cols: 6, size: 50, difficulty: 1 }
];

export const TRANSLATIONS = {
  zh: {
    title: '色感大測試',
    level: '關卡',
    time: '總時間',
    lives: '剩餘機會',
    best: '最佳紀錄',
    reset: '重置',
    start: '開始遊戲',
    next: '下一關',
    retry: '再試一次',
    passed: '過關！',
    congrats: '恭喜！',
    gameOver: '測試完結',
    warning: '⚠️閣下色感判斷比較弱, 建議給眼科醫生作檢查',
    normal: '挑戰你的色感極限！找出那萬中無一的不同色塊。',
    seeClinic: '眼睛視力中心',
    seeDoctor: '眼科醫生資料',
    colorBlindMode: '色盲模式',
    share: '分享結果',
    levelReached: '你達到了第 {n} 關',
    copyright: 'Copyright©2025 www.seeclinic.hk'
  },
  en: {
    title: 'Color Vision Test',
    level: 'Level',
    time: 'Time',
    lives: 'Lives',
    best: 'Best Record',
    reset: 'Reset',
    start: 'Start Game',
    next: 'Next',
    retry: 'Retry',
    passed: 'Level Cleared!',
    congrats: 'Congratulations!',
    gameOver: 'Test Finished',
    warning: '⚠️ Your color perception seems weak, suggested to see an eye doctor.',
    normal: 'Challenge your vision! Spot the one tile that is slightly different.',
    seeClinic: 'Vision Center',
    seeDoctor: 'Ophthalmologist Info',
    colorBlindMode: 'Color-Blind Mode',
    share: 'Share Result',
    levelReached: 'You reached Level {n}',
    copyright: 'Copyright©2025 www.seeclinic.hk'
  }
};
