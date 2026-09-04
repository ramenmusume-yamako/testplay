import { startGame } from './runner.js';

startGame({
    difficulty: 'easy',

    // 重力・ジャンプ
    gravityPC: 1.0,
    gravitySP: 1.6,
    jumpPC: -29.0,
    jumpSP: -38.0,

    // 初期速度
    speedPC: 6.0,
    speedSP: 11.0,

    // 速度変化
    speedMode: 'wave',
    maxSpeedBonusPC: 5.0,
    maxSpeedBonusSP: 8.0,

    // 障害物
    spawnMin: 500,
    spawnSpeedBonus: 12,
    spawnRandom: 400,

    // チャーシューなし
    useChashu: false
});