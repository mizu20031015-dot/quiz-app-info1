document.addEventListener('DOMContentLoaded', () => {
    // 画面要素
    const titleScreen = document.getElementById('title-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const feedbackScreen = document.getElementById('feedback-screen');
    const resultScreen = document.getElementById('result-screen');
    const settingsOverlay = document.getElementById('settings-overlay');

    // 音声要素
    const bgm = document.getElementById('background-music');
    const sfx = {
        question: document.getElementById('sfx-question'),
        correct: document.getElementById('sfx-correct'),
        incorrect: document.getElementById('sfx-incorrect'),
        drumroll: document.getElementById('sfx-drumroll')
    };

    // 音源
    const BGM_SOURCES = {
        sound: 'rain_sound_01_60min.mp3',
        quiz: 'quiz_bgm.mp3'
    };

    let questions = [];
    let currentQuestionIndex = 0;
    let correctAnswersCount = 0;
    let currentMode = 'silent';
    let savedVolume = 0.5;

    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            questions = await response.json();
            document.getElementById('total-questions').textContent = `全${questions.length}問`;
        } catch (error) { console.error('JSON読み込み失敗', error); }
    }

    // 音声再生（BGM制御付き）
    function playSfx(audioElement) {
        if (!audioElement) return;
        
        // 知識確認モードならBGMを一時停止してSFXを再生
        if (currentMode === 'quiz') {
            bgm.pause(); 
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.log("SFX再生ブロック:", e));
            
            // SFX終了後にBGMを再開
            audioElement.onended = () => {
                if (!bgm.muted && bgm.src !== "") {
                    bgm.play().catch(e => console.log("BGM復帰失敗:", e));
                }
            };
        }
    }

    function startQuiz(mode) {
        currentMode = mode;
        currentQuestionIndex = 0;
        correctAnswersCount = 0;

        bgm.pause();
        if (BGM_SOURCES[mode]) {
            bgm.src = BGM_SOURCES[mode];
            bgm.load();
            bgm.muted = false;
            bgm.volume = savedVolume;
            bgm.play().catch(e => console.log("BGM再生待ち"));
        } else {
            bgm.src = "";
        }
        showQuestion();
    }

    function showQuestion() {
        const q = questions[currentQuestionIndex];
        document.getElementById('question-counter').textContent = `問${currentQuestionIndex + 1}`;
        document.getElementById('question-text').textContent = q.question;
        
        const btns = document.querySelectorAll('.option-btn');
        btns.forEach((btn, i) => {
            btn.textContent = q.options[i];
            btn.disabled = false;
            btn.onclick = () => checkAnswer(i);
        });

        // 出題音の再生
        if (currentMode === 'quiz') playSfx(sfx.question);

        switchScreen('quiz');
    }

    function checkAnswer(idx) {
        const q = questions[currentQuestionIndex];
        const isCorrect = (idx === q.answer);
        const feedbackText = document.getElementById('feedback-text');

        if (isCorrect) {
            correctAnswersCount++;
            feedbackText.textContent = '正解○';
            feedbackText.style.color = 'green';
            playSfx(sfx.correct);
        } else {
            feedbackText.textContent = '不正解';
            feedbackText.style.color = '#CC00CC';
            playSfx(sfx.incorrect);
        }

        document.getElementById('correct-answer').innerHTML = `正解： <span style="color: green; font-weight: bold;">${q.options[q.answer]}</span>`;
        document.getElementById('explanation-text').textContent = q.explanation;

        document.getElementById('next-button').style.display = (currentQuestionIndex < questions.length - 1) ? 'inline-block' : 'none';
        document.getElementById('result-button').style.display = (currentQuestionIndex === questions.length - 1) ? 'inline-block' : 'none';

        switchScreen('feedback');
    }

    function showResults() {
        bgm.pause(); // BGM停止
        
        const resDetails = document.getElementById('result-details');
        resDetails.style.display = 'none'; // スコア等を隠す
        switchScreen('result');

        const scorePercent = (correctAnswersCount / questions.length) * 100;
        let msg = scorePercent > 80 ? '完璧！情報Iマスター！' : scorePercent > 40 ? '標準到達！あと一歩！' : '焦らず基礎固め！';
        
        document.getElementById('result-score').textContent = `${correctAnswersCount}/${questions.length}`;
        document.getElementById('result-message').textContent = msg;

        if (currentMode === 'quiz') {
            sfx.drumroll.currentTime = 0;
            sfx.drumroll.play().catch(() => resDetails.style.display = 'block');
            
            // ドラムロール終了時にスコアを表示
            sfx.drumroll.onended = () => {
                resDetails.style.display = 'block';
            };
        } else {
            resDetails.style.display = 'block';
        }
    }

    function switchScreen(screenId) {
        [titleScreen, quizScreen, feedbackScreen, resultScreen].forEach(s => s.style.display = 'none');
        document.getElementById(screenId + '-screen').style.display = 'block';
    }

    // イベント
    document.getElementById('mode-study-sound').onclick = () => startQuiz('sound');
    document.getElementById('mode-study-silent').onclick = () => startQuiz('silent');
    document.getElementById('mode-quiz').onclick = () => startQuiz('quiz');
    document.getElementById('next-button').onclick = () => { currentQuestionIndex++; showQuestion(); };
    document.getElementById('result-button').onclick = showResults;
    document.getElementById('restart-button').onclick = () => { bgm.pause(); switchScreen('title'); };
    
    document.getElementById('settings-open-button').onclick = () => settingsOverlay.style.display = 'flex';
    document.getElementById('settings-close-button').onclick = () => settingsOverlay.style.display = 'none';
    document.getElementById('settings-bgm-on').onclick = () => { bgm.muted = false; bgm.play(); };
    document.getElementById('settings-bgm-off').onclick = () => { bgm.pause(); };
    document.getElementById('settings-volume-slider').oninput = (e) => {
        savedVolume = e.target.value;
        bgm.volume = savedVolume;
    };

    loadQuestions();
});