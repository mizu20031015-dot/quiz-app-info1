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

    // 音源リスト
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

    // 再生失敗で処理を止めないための安全な再生関数
    function safePlay(audioElement) {
        if (!audioElement) return;
        audioElement.currentTime = 0;
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => console.log("再生ブロック回避"));
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
            safePlay(bgm);
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

        if (currentMode === 'quiz') safePlay(sfx.question);
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
            if (currentMode === 'quiz') safePlay(sfx.correct);
        } else {
            feedbackText.textContent = '不正解';
            feedbackText.style.color = '#CC00CC';
            if (currentMode === 'quiz') safePlay(sfx.incorrect);
        }

        document.getElementById('correct-answer').innerHTML = `正解： <span style="color: green; font-weight: bold;">${q.options[q.answer]}</span>`;
        document.getElementById('explanation-text').textContent = q.explanation;

        document.getElementById('next-button').style.display = (currentQuestionIndex < questions.length - 1) ? 'inline-block' : 'none';
        document.getElementById('result-button').style.display = (currentQuestionIndex === questions.length - 1) ? 'inline-block' : 'none';

        switchScreen('feedback');
    }

    function showResults() {
        bgm.pause();
        if (currentMode === 'quiz') safePlay(sfx.drumroll);

        const scorePercent = (correctAnswersCount / questions.length) * 100;
        let msg = scorePercent > 80 ? '完璧！情報Iマスター！' : scorePercent > 40 ? '標準到達！あと一歩！' : '焦らず基礎固め！';
        
        document.getElementById('result-score').textContent = `${correctAnswersCount}/${questions.length}`;
        document.getElementById('result-message').textContent = msg;

        // ドラムロールの有無に関わらず1.5秒後に確実に画面遷移（フリーズ防止）
        setTimeout(() => switchScreen('result'), currentMode === 'quiz' ? 1500 : 0);
    }

    function switchScreen(screenId) {
        [titleScreen, quizScreen, feedbackScreen, resultScreen].forEach(s => s.style.display = 'none');
        document.getElementById(screenId + '-screen').style.display = 'block';
    }

    // イベントリスナー
    document.getElementById('mode-study-sound').onclick = () => startQuiz('sound');
    document.getElementById('mode-study-silent').onclick = () => startQuiz('silent');
    document.getElementById('mode-quiz').onclick = () => startQuiz('quiz');
    document.getElementById('next-button').onclick = () => { currentQuestionIndex++; showQuestion(); };
    document.getElementById('result-button').onclick = showResults;
    document.getElementById('restart-button').onclick = () => { bgm.pause(); switchScreen('title'); };
    
    document.getElementById('settings-open-button').onclick = () => settingsOverlay.style.display = 'flex';
    document.getElementById('settings-close-button').onclick = () => settingsOverlay.style.display = 'none';
    document.getElementById('settings-bgm-on').onclick = () => { bgm.muted = false; safePlay(bgm); };
    document.getElementById('settings-bgm-off').onclick = () => { bgm.pause(); };
    document.getElementById('settings-volume-slider').oninput = (e) => {
        savedVolume = e.target.value;
        bgm.volume = savedVolume;
    };

    loadQuestions();
});