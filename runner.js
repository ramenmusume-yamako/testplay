import { saveFirebaseScore } from './firebase.js';

export function startGame(config) {

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');
const menuOverlay = document.getElementById('game-menu-overlay');

const V_WIDTH = 1280;
const V_HEIGHT = 720;

const isPC = window.innerWidth >= 960;

canvas.width = V_WIDTH;
canvas.height = V_HEIGHT;


// ==============================
// 音設定
// ==============================

let audioCtx = null;
let audioBuffers = {
    bgm: null,
    start: null,
    chashu: null
};
let bgmSource = null;

function initAudio() {
    if (audioCtx) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    loadAudio('CHINA_BOY.mp3', 'bgm');
    loadAudio('dora.mp3', 'start');

    if (config.useChashu) {
        loadAudio('チャーシュー.mp3', 'chashu');
    }
}

function loadAudio(url, key) {
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            audioBuffers[key] = audioBuffer;
        })
        .catch(e => console.log("Audio load error:", e));
}

function playSE(key) {
    if (!audioCtx || !audioBuffers[key]) return;

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffers[key];

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 1.0;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    source.start(0);
}

function playBGM() {
    if (!audioCtx || !audioBuffers.bgm || bgmSource) return;

    bgmSource = audioCtx.createBufferSource();
    bgmSource.buffer = audioBuffers.bgm;
    bgmSource.loop = true;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.4;

    bgmSource.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    bgmSource.start(0);
}

function stopBGM() {
    if (bgmSource) {
        try {
            bgmSource.stop();
        } catch(e) {}

        bgmSource = null;
    }
}


// ==============================
// キャラクター
// ==============================

const charAssets = {
    meana: {
        left: 'meanal.png',
        right: 'meanar.png'
    },
    hajime: {
        left: 'hajimel.png',
        right: 'hajimer.png'
    },
    aniki: {
        left: 'aniki_l.png',
        right: 'aniki_r.png'
    },
    naruto: {
        left: 'naruto_l.png',
        right: 'naruto_r.png'
    }
};

const currentSelectedCharId =
    localStorage.getItem('selectedChar') || 'hajime';

const activeChar =
    charAssets[currentSelectedCharId] ||
    charAssets.hajime;

const pImgL = new Image();
const pImgR = new Image();

pImgL.src = activeChar.left;
pImgR.src = activeChar.right;


// ==============================
// 背景
// ==============================

const bgImages = [];

const bgSrcs = [
    'hiru1.png',
    'hiru2.png',
    'hiru3.png',
    'hiru4.png',
    'hiru5.png',
    'hiru6.png',
    'hiruyuu.png',
    'yuu1.png',
    'yuu2.png',
    'yuu3.png',
    'yuu4.png',
    'yuu5.png',
    'yuu6.png',
    'yuuyoru.png',
    'yoru1.png',
    'yoru2.png',
    'yoru3.png',
    'yoru4.png',
    'yoru5.png',
    'yoru6.png',
    'yoruasa.png',
    'asahiru.png'
];

let bgScroll = 0;

bgSrcs.forEach((src, index) => {
    bgImages[index] = new Image();
    bgImages[index].src = src;
});


// ==============================
// 障害物
// ==============================

const imgNaruto = new Image();
imgNaruto.src = 'naruto.png';

const imgMenma = new Image();
imgMenma.src = 'menma.png';

const imgNori = new Image();
imgNori.src = 'nori.png';

const imgStartCallBg = new Image();
imgStartCallBg.src = 'start_bg.png';

const imgChashu = new Image();
if (config.useChashu) {
    imgChashu.src = 'tya-syu-.png';
}


// ==============================
// 基本設定
// ==============================

const p_sz = isPC ? 220 : 260;
const GROUND_Y = V_HEIGHT - 60;

const BASE_GRAVITY =
    isPC ? config.gravityPC : config.gravitySP;

const BASE_JUMP =
    isPC ? config.jumpPC : config.jumpSP;

const deviceType = isPC ? 'PC' : 'SP';


// ==============================
// ゲーム状態
// ==============================

let gameState = 'START';

let score = 0;
let displayScore = 0;

let countTimer = 0;
let startCallTimer = 0;
let gameOverTimer = 0;

let isPageVisible = true;
let lastTime = performance.now();


// ==============================
// ローカルランキング
// ==============================

const bestKey =
    `dinoBestTime_${config.difficulty}_${deviceType}`;

const scoreKey =
    `dinoTopScores_${config.difficulty}_${deviceType}`;

let highScore =
    localStorage.getItem(bestKey) || 0;

let topScores =
    JSON.parse(localStorage.getItem(scoreKey)) ||
    [0, 0, 0];


// ==============================
// 速度
// ==============================

const initialBaseSpeed =
    isPC ? config.speedPC : config.speedSP;

let currentSpeed = initialBaseSpeed;

let speedPhaseTimer = 0;
let nextResetThreshold = 0;


// ==============================
// チャーシュー
// ==============================

let chashuTimer = 0;
let nextChashuTriggerTime = 0;
let hasChashuSpawnedThisPhase = false;

let blindTimer = 0;
let blindPattern = 0;


// ==============================
// プレイヤー
// ==============================

const player = {
    x: 100,
    y: GROUND_Y - p_sz,
    width: p_sz,
    height: p_sz,
    vy: 0,
    gravity: BASE_GRAVITY,
    isJumping: false,
    animTimer: 0
};


// ==============================
// 障害物
// ==============================

const obstacleTypes = [
    {
        id: 'menma',
        w: 110,
        h: 220,
        img: imgMenma
    },
    {
        id: 'nori',
        w: 220,
        h: 100,
        img: imgNori
    },
    {
        id: 'naruto',
        w: 120,
        h: 120,
        img: imgNaruto
    }
];

let obstacles = [];
let spawnTimer = 0;
let nextSpawnThreshold = 60;


// ==============================
// メニュー
// ==============================

let currentMenuIndex = 0;

const menuButtons = [
    document.getElementById('link-restart'),
    document.getElementById('link-easy'),
    document.getElementById('link-hard'),
    document.getElementById('link-normal'),
    document.getElementById('link-home')
];

function updateMenuFocus() {
    menuButtons.forEach((btn, idx) => {
        if (idx === currentMenuIndex) {
            btn.classList.add('keyboard-focus');
        } else {
            btn.classList.remove('keyboard-focus');
        }
    });
}


// ==============================
// リサイズ
// ==============================

function resize() {
    const rect = canvas.getBoundingClientRect();
    const offset = isPC ? 20 : 10;

    ui.style.top =
        (rect.top + offset) + "px";

    ui.style.left =
        (rect.left + offset) + "px";

    menuOverlay.style.top =
        (rect.top +
        (rect.height - menuOverlay.offsetHeight) / 2) + "px";

    menuOverlay.style.left =
        (rect.left +
        (rect.width - menuOverlay.offsetWidth) / 2) + "px";
}

window.addEventListener('resize', resize);

window.addEventListener('orientationchange', () => {
    setTimeout(resize, 200);
});

resize();


// ==============================
// 速度リセット設定
// ==============================

function setRandomResetThreshold() {

    if (config.speedMode !== 'reset') return;

    nextResetThreshold =
        (config.resetMinSeconds +
        Math.random() *
        (config.resetMaxSeconds -
        config.resetMinSeconds)) * 60;

    speedPhaseTimer = 0;

    if (config.useChashu) {
        resetChashuPhase();
    }
}

function resetChashuPhase() {

    if (!config.useChashu) return;

    chashuTimer = 0;
    hasChashuSpawnedThisPhase = false;

    nextChashuTriggerTime =
        config.chashuTriggerMin +
        Math.random() *
        config.chashuTriggerRandom;
}


// ==============================
// ローカルスコア保存
// ==============================

function saveLocalScore(currentScore) {

    const finalScore = Math.floor(currentScore);

    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem(bestKey, highScore);
    }

    topScores.push(finalScore);

    topScores.sort((a, b) => b - a);

    topScores = topScores.slice(0, 3);

    localStorage.setItem(
        scoreKey,
        JSON.stringify(topScores)
    );
}


// ==============================
// ゲーム開始
// ==============================

function startGameSequence() {

    resetGame();

    gameState = 'PLAYING';

    startCallTimer = 120;

    ui.style.display = 'block';

    menuOverlay.style.display = 'none';

    setTimeout(() => {
        playSE('start');
    }, 10);
}


// ==============================
// 入力
// ==============================

const handleInput = (e) => {

    if (e.type === 'mousedown' && e.button === 0) {
        return;
    }

    if (menuOverlay.style.display === 'flex') {
        return;
    }

    initAudio();

    if (audioCtx &&
        audioCtx.state === 'suspended') {

        audioCtx.resume();
    }

    if (gameState === 'START') {

        startGameSequence();

        return;
    }

    if (gameState === 'GAMEOVER') {

        if (gameOverTimer > 0) {
            return;
        }

        if (displayScore < Math.floor(score)) {

            displayScore =
                Math.floor(score);

            return;
        }

        if (menuOverlay.style.display !== 'flex') {

            currentMenuIndex = 0;

            updateMenuFocus();

            menuOverlay.style.display = 'flex';

            resize();
        }

        return;
    }

    if (
        gameState === 'PLAYING' &&
        startCallTimer <= 0 &&
        !player.isJumping
    ) {

        player.isJumping = true;

        const speedRatio =
            currentSpeed / initialBaseSpeed;

        const gentleRatio =
            1.0 +
            (speedRatio - 1.0) * 0.4;

        player.vy =
            BASE_JUMP *
            Math.sqrt(gentleRatio);
    }
};


// ==============================
// キーボード
// ==============================

window.addEventListener('keydown', (e) => {

    if (menuOverlay.style.display === 'flex') {

        if (
            e.code === 'ArrowDown' ||
            e.code === 'ArrowRight'
        ) {

            e.preventDefault();

            currentMenuIndex =
                (currentMenuIndex + 1) %
                menuButtons.length;

            updateMenuFocus();

        } else if (
            e.code === 'ArrowUp' ||
            e.code === 'ArrowLeft'
        ) {

            e.preventDefault();

            currentMenuIndex =
                (currentMenuIndex - 1 +
                menuButtons.length) %
                menuButtons.length;

            updateMenuFocus();

        } else if (
            e.code === 'Enter' ||
            e.code === 'Space'
        ) {

            e.preventDefault();

            menuButtons[
                currentMenuIndex
            ].click();
        }

        return;
    }

    if (
        ['Space', 'ArrowUp']
        .includes(e.code)
    ) {

        handleInput(e);
    }
});


// ==============================
// メニューボタン
// ==============================

document
    .getElementById('link-restart')
    .addEventListener('click', (e) => {

        e.preventDefault();
        e.stopPropagation();

        initAudio();

        if (
            audioCtx &&
            audioCtx.state === 'suspended'
        ) {
            audioCtx.resume();
        }

        startGameSequence();
    });

menuButtons.forEach((btn, idx) => {

    btn.addEventListener('mouseenter', () => {

        if (
            menuOverlay.style.display === 'flex'
        ) {

            currentMenuIndex = idx;

            updateMenuFocus();
        }
    });

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    btn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });
});

window.addEventListener(
    'mousedown',
    handleInput
);

window.addEventListener(
    'touchstart',
    (e) => {

        if (
            e.target.closest(
                '#game-menu-overlay'
            )
        ) {
            return;
        }

        e.preventDefault();

        handleInput(e);
    },
    { passive: false }
);


// ==============================
// ページ非表示
// ==============================

document.addEventListener(
    'visibilitychange',
    () => {

        if (document.hidden) {

            isPageVisible = false;

            stopBGM();

        } else {

            isPageVisible = true;

            lastTime =
                performance.now();

            if (
                gameState === 'PLAYING' &&
                startCallTimer <= 0
            ) {

                playBGM();
            }
        }
    }
);


// ==============================
// ゲームリセット
// ==============================

function resetGame() {

    score = 0;
    displayScore = 0;

    countTimer = 0;
    startCallTimer = 0;
    gameOverTimer = 0;

    currentSpeed =
        initialBaseSpeed;

    speedPhaseTimer = 0;

    obstacles.length = 0;

    spawnTimer = 0;

    nextSpawnThreshold = 60;

    blindTimer = 0;

    player.y =
        GROUND_Y - player.height;

    player.vy = 0;

    player.gravity =
        BASE_GRAVITY;

    player.isJumping = false;

    lastTime =
        performance.now();

    setRandomResetThreshold();
}


// ==============================
// 更新
// ==============================

function update(currentTime) {

    if (!currentTime) {
        currentTime = performance.now();
    }

    let deltaTime =
        currentTime - lastTime;

    lastTime = currentTime;

    if (!isPageVisible) {

        requestAnimationFrame(update);

        return;
    }

    if (deltaTime > 100) {
        deltaTime = 16.666;
    }

    const dtRatio =
        deltaTime / (1000 / 60);

    const totalBgWidth =
        V_WIDTH * bgSrcs.length;


    if (gameState === 'PLAYING') {

        player.animTimer += dtRatio;


        // ==========================
        // チャーシュー
        // ==========================

        if (config.useChashu) {

            if (blindTimer > 0) {

                blindTimer -= dtRatio;

                if (blindTimer < 0) {
                    blindTimer = 0;
                }
            }
        }


        // ==========================
        // スタート演出
        // ==========================

        if (startCallTimer > 0) {

            startCallTimer -= dtRatio;

            bgScroll +=
                initialBaseSpeed *
                0.7 *
                dtRatio;

            if (bgScroll >= totalBgWidth) {
                bgScroll -= totalBgWidth;
            }

            if (startCallTimer <= 0) {

                startCallTimer = 0;

                playBGM();
            }

        } else {

            // ==========================
            // スコア
            // ==========================

            score +=
                (1 / 60) * dtRatio;


            // ==========================
            // 速度
            // ==========================

            if (config.speedMode === 'wave') {

                speedPhaseTimer +=
                    (1 / 60) * dtRatio;

                const wave =
                    (1 -
                    Math.cos(
                        (2 * Math.PI *
                        speedPhaseTimer) /
                        100
                    )) / 2;

                const maxSpeedBonus =
                    isPC
                    ? config.maxSpeedBonusPC
                    : config.maxSpeedBonusSP;

                currentSpeed =
                    initialBaseSpeed +
                    maxSpeedBonus * wave;

            } else {

                const speedIncrease =
                    isPC
                    ? config.speedIncreasePC
                    : config.speedIncreaseSP;

                currentSpeed +=
                    speedIncrease *
                    dtRatio;

                speedPhaseTimer +=
                    dtRatio;

                if (
                    speedPhaseTimer >=
                    nextResetThreshold
                ) {

                    currentSpeed =
                        initialBaseSpeed;

                    setRandomResetThreshold();
                }
            }


            // ==========================
            // チャーシュー処理
            // ==========================

            if (config.useChashu) {

                chashuTimer +=
                    (1 / 60) * dtRatio;

                if (
                    chashuTimer >=
                    config.chashuInterval
                ) {

                    resetChashuPhase();
                }

                if (
                    !hasChashuSpawnedThisPhase &&
                    (
                        chashuTimer >=
                        nextChashuTriggerTime ||
                        chashuTimer >=
                        config.chashuForceTrigger
                    )
                ) {

                    blindTimer =
                        config.blindDuration;

                    blindPattern =
                        Math.floor(
                            Math.random() * 3
                        );

                    hasChashuSpawnedThisPhase =
                        true;

                    playSE('chashu');
                }
            }


            // ==========================
            // 背景
            // ==========================

            bgScroll +=
                currentSpeed *
                0.7 *
                dtRatio;

            if (bgScroll >= totalBgWidth) {
                bgScroll -= totalBgWidth;
            }


            // ==========================
            // 重力
            // ==========================

            player.gravity =
                BASE_GRAVITY;

            const speedRatio =
                currentSpeed /
                initialBaseSpeed;

            const gentleGravityRatio =
                1.0 +
                (Math.sqrt(speedRatio) - 1.0) *
                0.5;

            const jumpDt =
                player.isJumping
                ? dtRatio *
                  gentleGravityRatio
                : dtRatio;

            player.vy +=
                player.gravity *
                jumpDt;

            player.y +=
                player.vy *
                jumpDt;


            if (
                player.y >
                GROUND_Y -
                player.height
            ) {

                player.y =
                    GROUND_Y -
                    player.height;

                player.vy = 0;

                player.isJumping = false;
            }


            // ==========================
            // 障害物生成
            // ==========================

            spawnTimer +=
                currentSpeed *
                dtRatio;

            if (
                spawnTimer >
                nextSpawnThreshold
            ) {

                const type =
                    obstacleTypes[
                        Math.floor(
                            Math.random() *
                            obstacleTypes.length
                        )
                    ];

                obstacles.push({
                    x: V_WIDTH,
                    y: GROUND_Y - type.h,
                    ...type
                });

                spawnTimer = 0;

                nextSpawnThreshold =
                    config.spawnMin +
                    (
                        currentSpeed /
                        initialBaseSpeed
                    ) *
                    config.spawnSpeedBonus +
                    Math.random() *
                    config.spawnRandom;
            }


            // ==========================
            // 障害物移動・当たり判定
            // ==========================

            for (
                let i = obstacles.length - 1;
                i >= 0;
                i--
            ) {

                const o = obstacles[i];

                o.x -=
                    currentSpeed *
                    dtRatio;


                const pL =
                    player.x +
                    player.width * 0.45;

                const pR =
                    player.x +
                    player.width * 0.55;

                const pT =
                    player.y +
                    player.height * 0.3;

                const pB =
                    player.y +
                    player.height * 0.85;


                const oL =
                    o.x +
                    o.w * 0.2;

                const oR =
                    o.x +
                    o.w * 0.8;

                const oT =
                    o.y +
                    o.h * 0.2;

                const oB =
                    o.y +
                    o.h * 0.9;


                if (
                    pL < oR &&
                    pR > oL &&
                    pT < oB &&
                    pB > oT
                ) {

                    gameState =
                        'GAMEOVER';

                    ui.style.display =
                        'none';

                    stopBGM();

                    playSE('start');

                    gameOverTimer = 120;


                    // ローカル保存
                    saveLocalScore(score);


                    // Firebase保存
                    saveFirebaseScore(
                        config.difficulty,
                        Math.floor(score)
                    );
                }


                if (
                    o.x + o.w < -100
                ) {

                    obstacles.splice(i, 1);
                }
            }
        }

        ui.innerHTML =
            `BEST: ${Math.floor(highScore)}<br>` +
            `SCORE: ${Math.floor(score)}`;
    }


    // ==========================
    // GAMEOVER
    // ==========================

    if (gameState === 'GAMEOVER') {

        if (gameOverTimer > 0) {

            gameOverTimer -= dtRatio;

            if (gameOverTimer < 0) {
                gameOverTimer = 0;
            }

        } else {

            const targetScore =
                Math.floor(score);

            if (
                displayScore <
                targetScore
            ) {

                countTimer += dtRatio;

                if (countTimer >= 4) {

                    displayScore += 1;

                    countTimer = 0;
                }
            }
        }
    }


    draw();

    requestAnimationFrame(update);
}


// ==============================
// チャーシュー描画
// ==============================

function drawStickyChashu(
    pattern,
    alpha
) {

    if (
        !imgChashu.complete ||
        !imgChashu.naturalWidth
    ) {
        return;
    }

    ctx.save();

    ctx.globalAlpha = alpha;

    if (pattern === 0) {

        ctx.drawImage(
            imgChashu,
            (V_WIDTH / 2 - 400),
            (V_HEIGHT / 2 - 250),
            800,
            500
        );

    } else if (pattern === 1) {

        ctx.drawImage(
            imgChashu,
            260,
            360,
            280,
            220
        );

        ctx.drawImage(
            imgChashu,
            740,
            380,
            280,
            220
        );

        ctx.drawImage(
            imgChashu,
            440,
            160,
            440,
            330
        );

    } else {

        ctx.drawImage(
            imgChashu,
            120,
            300,
            460,
            350
        );

        ctx.drawImage(
            imgChashu,
            680,
            180,
            520,
            390
        );
    }

    ctx.restore();
}


// ==============================
// 描画
// ==============================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // 背景

    const bgW = V_WIDTH;

    const totalBgWidth =
        bgW * bgSrcs.length;

    const currentScroll =
        bgScroll % totalBgWidth;

    for (
        let i = 0;
        i < bgSrcs.length;
        i++
    ) {

        let dx =
            (i * bgW) -
            currentScroll;

        if (dx + bgW < 0) {
            dx += totalBgWidth;
        }

        if (dx > V_WIDTH) {
            dx -= totalBgWidth;
        }

        if (
            dx < V_WIDTH &&
            dx + bgW > 0
        ) {

            if (
                bgImages[i] &&
                bgImages[i].complete &&
                bgImages[i].naturalWidth > 0
            ) {

                ctx.drawImage(
                    bgImages[i],
                    dx,
                    0,
                    bgW,
                    V_HEIGHT
                );

            } else {

                ctx.fillStyle =
                    '#34495e';

                ctx.fillRect(
                    dx,
                    0,
                    bgW,
                    V_HEIGHT
                );
            }
        }
    }


    // 地面

    ctx.fillStyle =
        'rgba(255,255,255,0.3)';

    ctx.fillRect(
        0,
        GROUND_Y,
        canvas.width,
        4
    );


    // キャラクター

    if (
        pImgL.complete &&
        pImgR.complete &&
        pImgL.naturalWidth > 0
    ) {

        const currentImg =
            (
                Math.floor(
                    player.animTimer / 30
                ) % 2 === 0
            )
            ? pImgL
            : pImgR;

        ctx.drawImage(
            currentImg,
            player.x,
            player.y,
            player.width,
            player.height
        );

    } else {

        ctx.fillStyle =
            '#e74c3c';

        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        );
    }


    // 障害物

    obstacles.forEach(o => {

        if (
            o.img &&
            o.img.complete &&
            o.img.naturalWidth > 0
        ) {

            ctx.drawImage(
                o.img,
                o.x,
                o.y,
                o.w,
                o.h
            );

        } else {

            ctx.fillStyle =
                '#f39c12';

            ctx.fillRect(
                o.x,
                o.y,
                o.w,
                o.h
            );
        }
    });


    // チャーシュー

    if (
        config.useChashu &&
        gameState === 'PLAYING' &&
        blindTimer > 0
    ) {

        drawStickyChashu(
            blindPattern,
            blindTimer < 60
                ? blindTimer / 60
                : 1.0
        );
    }


    // スタート！

    if (
        gameState === 'PLAYING' &&
        startCallTimer > 0
    ) {

        ctx.save();

        if (startCallTimer < 15) {
            ctx.globalAlpha =
                startCallTimer / 15;
        }

        if (
            imgStartCallBg.complete &&
            imgStartCallBg.width > 0
        ) {

            const imgW =
                imgStartCallBg.width;

            const imgH =
                imgStartCallBg.height;

            ctx.drawImage(
                imgStartCallBg,
                (
                    V_WIDTH / 2 -
                    imgW / 2
                ),
                (
                    V_HEIGHT / 2 -
                    imgH / 2
                ),
                imgW,
                imgH
            );
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle =
            '#e74c3c';

        ctx.font =
            `bold ${Math.floor(
                90
            )}px sans-serif`;

        ctx.shadowColor =
            'rgba(255,255,255,0.8)';

        ctx.shadowBlur = 10;

        ctx.fillText(
            'スタート！',
            (V_WIDTH / 2),
            (V_HEIGHT / 2)
        );

        ctx.restore();
    }


    // START / GAMEOVER

    if (
        gameState === 'START' ||
        gameState === 'GAMEOVER'
    ) {

        ctx.fillStyle =
            'rgba(0,0,0,0.8)';

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.textAlign = 'center';

        ctx.shadowBlur = 0;


        if (gameState === 'START') {

            ctx.textBaseline =
                'alphabetic';

            ctx.fillStyle =
                '#f1c40f';

            ctx.font =
                `bold ${Math.floor(
                    80
                )}px sans-serif`;

            ctx.fillText(
                '走れ！ラーメン娘！！',
                (V_WIDTH / 2),
                (V_HEIGHT / 2 - 100)
            );

            ctx.fillStyle = 'white';

            ctx.font =
                `${Math.floor(
                    30
                )}px sans-serif`;

            ctx.fillText(
                'スペースキー または タップでジャンプ！',
                (V_WIDTH / 2),
                (V_HEIGHT / 2 + 30)
            );

            ctx.fillStyle =
                '#f1c40f';

            ctx.font =
                `bold ${Math.floor(
                    36
                )}px sans-serif`;

            ctx.fillText(
                '>> Press Space or Tap <<',
                (V_WIDTH / 2),
                (V_HEIGHT / 2 + 180)
            );

        } else {

            ctx.save();

            let textX =
                V_WIDTH / 2;

            let textY =
                V_HEIGHT / 2;

            let fontSize = 120;

            if (gameOverTimer === 0) {

                textX =
                    V_WIDTH / 2 - 220;

                textY =
                    V_HEIGHT / 2 - 100;

                fontSize = 80;
            }

            ctx.textBaseline =
                gameOverTimer > 0
                ? 'middle'
                : 'alphabetic';

            ctx.fillStyle =
                '#e67e22';

            ctx.font =
                `bold ${Math.floor(
                    fontSize
                )}px sans-serif`;

            ctx.fillText(
                '完 食',
                textX,
                textY
            );

            ctx.restore();


            if (gameOverTimer === 0) {

                ctx.save();

                const leftCenterX =
                    V_WIDTH / 2 - 220;

                ctx.textAlign =
                    'center';

                ctx.fillStyle =
                    'white';

                ctx.font =
                    `${Math.floor(
                        45
                    )}px sans-serif`;

                ctx.fillText(
                    `記録: ${displayScore} 秒`,
                    leftCenterX,
                    (V_HEIGHT / 2 + 10)
                );

                ctx.font =
                    `${Math.floor(
                        30
                    )}px sans-serif`;

                ctx.fillText(
                    `最高記録: ${Math.floor(highScore)} 秒`,
                    leftCenterX,
                    (V_HEIGHT / 2 + 65)
                );


                if (
                    menuOverlay.style.display !== 'flex'
                ) {

                    ctx.fillStyle =
                        '#f1c40f';

                    ctx.font =
                        `${Math.floor(
                            24
                        )}px sans-serif`;

                    if (
                        displayScore <
                        Math.floor(score)
                    ) {

                        ctx.fillText(
                            '【 スペース 】or【 タップ 】でスコアスキップ',
                            leftCenterX,
                            (V_HEIGHT / 2 + 160)
                        );

                    } else {

                        ctx.fillText(
                            '【 スペース 】or【 タップ 】でメニューを開く ➔',
                            leftCenterX,
                            (V_HEIGHT / 2 + 160)
                        );
                    }
                }


                // TOP3

                const rightCenterX =
                    V_WIDTH / 2 + 260;

                const rankYStart =
                    V_HEIGHT / 2 - 130;

                ctx.fillStyle =
                    'rgba(255,255,255,0.08)';

                ctx.fillRect(
                    (rightCenterX - 200),
                    (rankYStart - 60),
                    400,
                    310
                );

                ctx.fillStyle =
                    '#f1c40f';

                ctx.font =
                    `bold ${Math.floor(
                        32
                    )}px sans-serif`;

                ctx.fillText(
                    '歴代最高記録 TOP3',
                    rightCenterX,
                    (rankYStart - 15)
                );


                const medals = [
                    '🥇 1st',
                    '🥈 2nd',
                    '🥉 3rd'
                ];

                const medalColors = [
                    '#f1c40f',
                    '#e67e22',
                    '#bdc3c7'
                ];


                for (
                    let i = 0;
                    i < 3;
                    i++
                ) {

                    const currentY =
                        rankYStart +
                        55 +
                        (i * 65);

                    ctx.textAlign =
                        'left';

                    ctx.fillStyle =
                        medalColors[i];

                    ctx.font =
                        `bold ${Math.floor(
                            30
                        )}px sans-serif`;

                    ctx.fillText(
                        medals[i],
                        (rightCenterX - 150),
                        currentY
                    );

                    ctx.textAlign =
                        'right';

                    ctx.fillStyle =
                        'white';

                    ctx.font =
                        `bold ${Math.floor(
                            32
                        )}px serif`;

                    ctx.fillText(
                        `${topScores[i]} 秒`,
                        (rightCenterX + 150),
                        currentY
                    );
                }

                ctx.restore();
            }
        }
    }
}


// ==============================
// 起動
// ==============================

window.addEventListener(
    'load',
    () => {
        resize();
        setTimeout(resize, 200);
    }
);

requestAnimationFrame(update);

}