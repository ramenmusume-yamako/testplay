import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getFirestore,
    doc,
    setDoc,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyD5HT-oNq3hFOLSpBqG19Vw7ZmmaEHPzSY",
    authDomain: "ramengirls-bd769.firebaseapp.com",
    databaseURL: "https://ramengirls-bd769-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ramengirls-bd769",
    storageBucket: "ramengirls-bd769.firebasestorage.app",
    messagingSenderId: "211447953783",
    appId: "1:211447953783:web:3d3ee33f78e0d830f48972",
    measurementId: "G-T9LL8LCH8K"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// 今日の日付
function getTodayString() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
        .padStart(2, '0');

    const day =
        String(today.getDate())
        .padStart(2, '0');

    return `${year}-${month}-${day}`;
}


// スコア保存
export async function saveFirebaseScore(
    difficulty,
    score
) {

    const today =
        getTodayString();


    // 難易度 → Firebaseの保存先
    const collectionName =
        difficulty === 'easy'
            ? 'easyScore'
            : difficulty === 'normal'
                ? 'normalScore'
                : 'hardScore';


    const docRef =
        doc(
            db,
            collectionName,
            today
        );


    const scoreData = {

        value: score,

        timestamp:
            new Date().toISOString(),

        id:
            Math.random()
                .toString(36)
                .substring(2, 9)
    };


    try {

        await setDoc(
            docRef,
            {
                scores:
                    arrayUnion(scoreData)
            },
            {
                merge: true
            }
        );

        console.log(
            `Firebase保存成功: ${difficulty} / ${score} / ${today}`
        );

    } catch (error) {

        console.error(
            "Firebaseスコア保存エラー:",
            error
        );
    }
}