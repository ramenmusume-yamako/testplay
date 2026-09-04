import { startGame } from './runner.js';

startGame({
    difficulty: 'normal',

    // 重力・ジャンプ
    gravityPC: 1.2,
    gravitySP: 1.8,
    jumpPC: -26.0,
    jumpSP: -35.0,

    // 初期速度
    speedPC: 8.0,
    speedSP: 13.0,

    // 速度変化
    speedMode: 'reset',
    speedIncreasePC: 0.004,
    speedIncreaseSP: 0.007,

    // 速度リセット
    resetMinSeconds: 40,
    resetMaxSeconds: 60,

    // 障害物
    spawnMin: 500,
    spawnSpeedBonus: 12,
    spawnRandom: 400,

    // チャーシューなし
    useChashu: false
});