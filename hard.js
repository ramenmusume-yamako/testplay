import { startGame } from './runner.js';

startGame({
    difficulty: 'hard',

    // 重力・ジャンプ
    gravityPC: 1.2,
    gravitySP: 1.8,
    jumpPC: -26.0,
    jumpSP: -35.0,

    // 初期速度
    speedPC: 10.0,
    speedSP: 15.0,

    // 速度変化
    speedMode: 'reset',
    speedIncreasePC: 0.006,
    speedIncreaseSP: 0.009,

    // 速度リセット
    resetMinSeconds: 40,
    resetMaxSeconds: 60,

    // 障害物
    spawnMin: 450,
    spawnSpeedBonus: 150,
    spawnRandom: 300,

    // HARDだけチャーシュー
    useChashu: true,
    chashuInterval: 40,
    chashuTriggerMin: 5,
    chashuTriggerRandom: 30,
    chashuForceTrigger: 35,
    blindDuration: 480
});