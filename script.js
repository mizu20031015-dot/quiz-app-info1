document.addEventListener('DOMContentLoaded', () => {
    const screens = {
        title: document.getElementById('title-screen'),
        modeSelection: document.getElementById('mode-selection-area'),
        quiz: document.getElementById('quiz-screen'),
        feedback: document.getElementById('feedback-screen'),
        result: document.getElementById('result-screen'),
        settings: document.getElementById('settings-overlay'),
        resDetails: document.getElementById('result-details')
    };

    const bgm = document.getElementById('background-music');
    const sfx = {
        question: document.getElementById('sfx-question'),
        correct: document.getElementById('sfx-correct'),
        incorrect: document.getElementById('sfx-incorrect'),
        drumroll: document.getElementById('sfx-drumroll')
    };

    const BGM_SOURCES = { sound: 'rain_sound_01_60min.mp3', quiz: 'quiz_bgm.mp3' };
    let questions = [], currentQuestionIndex = 0, correctAnswersCount = 0, currentMode = 'silent', savedVolume = 0.5;

    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            questions = await response.json();
            document.getElementById('total-questions').textContent = `全${questions.length}問`;
        } catch (e) { console.error('JSON読込失敗', e); }
    }

    // 1. STARTボタン：音声許可を確実に取得
    document.getElementById('start-app-button').onclick = function() {
        this.style.display = 'none';
        screens.modeSelection.style.display = 'block';
        bgm.play().then(() => bgm.pause()).catch(() => {});
        // SFX類も一度ロードさせてブラウザに認識させる
        Object.values(sfx).forEach(s => { s.load(); });
    };

    function startQuiz(mode) {
        currentMode = mode;
        currentQuestionIndex = 0;
        correctAnswersCount = 0;
        bgm.pause();
        bgm.src = BGM_SOURCES[mode] || "";
        bgm.load();
        bgm.volume = savedVolume;
        bgm.muted = false;
        showQuestion();
    }

    function showQuestion() {
        const q = questions[currentQuestionIndex];
        document.getElementById('question-counter').textContent = `問${currentQuestionIndex + 1}`;
        document.getElementById('question-text').textContent = q.question;
        const btns = document.querySelectorAll('.option-btn');
        btns.forEach((btn, i) => {
            btn.textContent = q.options[i];
            btn.onclick = () => checkAnswer(i);
        });

        switchScreen('quiz');

        // 直列再生：出題音(SFX)を鳴らし、終わってからBGMを開始
        if (currentMode === 'quiz') {
            bgm.pause(); 
            sfx.question.currentTime = 0;
            sfx.question.play().catch(() => {});
            sfx.question.onended = () => {
                if(currentMode === 'quiz' && !bgm.muted) bgm.play().catch(() => {});
            };
        } else if (currentMode === 'sound') {
            bgm.play().catch(() => {});
        }
    }

    function checkAnswer(idx) {
        const q = questions[currentQuestionIndex];
        const isCorrect = (idx === q.answer);
        const fText = document.getElementById('feedback-text');
        
        // ボタンを押した瞬間にBGM停止（ご提案の負荷軽減策）
        bgm.pause();

        if (isCorrect) {
            correctAnswersCount++;
            fText.textContent = '正解○';
            fText.style.color = 'green';
            if(currentMode === 'quiz') {
                sfx.correct.currentTime = 0;
                sfx.correct.play().catch(() => {});
            }
        } else {
            fText.textContent = '不正解';
            fText.style.color = '#CC00CC';
            if(currentMode === 'quiz') {
                sfx.incorrect.currentTime = 0;
                sfx.incorrect.play().catch(() => {});
            }
        }

        document.getElementById('correct-answer').innerHTML = `正解： <span style="color:green;">${q.options[q.answer]}</span>`;
        document.getElementById('explanation-text').textContent = q.explanation;
        document.getElementById('next-button').style.display = (currentQuestionIndex < questions.length - 1) ? 'inline-block' : 'none';
        document.getElementById('result-button').style.display = (currentQuestionIndex === questions.length - 1) ? 'inline-block' : 'none';

        switchScreen('feedback');
    }

    function showResults() {
        bgm.pause();
        screens.resDetails.style.display = 'none';
        switchScreen('result');
        
        document.getElementById('result-score').textContent = `${correctAnswersCount}/${questions.length}`;
        document.getElementById('result-message').textContent = 
            (correctAnswersCount / questions.length > 0.8) ? '完璧！' : '基礎を固めよう！';

        if (currentMode === 'quiz') {
            sfx.drumroll.currentTime = 0;
            sfx.drumroll.play().catch(() => { screens.resDetails.style.display = 'block'; });
            sfx.drumroll.onended = () => { screens.resDetails.style.display = 'block'; };
            // バックアップタイマー（万が一のフリーズ防止）
            setTimeout(() => { screens.resDetails.style.display = 'block'; }, 3000);
        } else {
            screens.resDetails.style.display = 'block';
        }
    }

    function switchScreen(id) {
        [screens.title, screens.quiz, screens.feedback, screens.result].forEach(s => s.style.display = 'none');
        document.getElementById(id + '-screen').style.display = 'block';
    }

    // イベント
    document.getElementById('mode-study-sound').onclick = () => startQuiz('sound');
    document.getElementById('mode-study-silent').onclick = () => startQuiz('silent');
    document.getElementById('mode-quiz').onclick = () => startQuiz('quiz');
    document.getElementById('next-button').onclick = () => { currentQuestionIndex++; showQuestion(); };
    document.getElementById('result-button').onclick = showResults;
    document.getElementById('restart-button').onclick = () => { 
        bgm.pause(); 
        document.getElementById('start-app-button').style.display = 'inline-block';
        screens.modeSelection.style.display = 'none';
        switchScreen('title'); 
    };
    document.getElementById('settings-open-button').onclick = () => screens.settings.style.display = 'flex';
    document.getElementById('settings-close-button').onclick = () => screens.settings.style.display = 'none';
    document.getElementById('settings-bgm-on').onclick = () => { bgm.muted = false; bgm.play(); };
    document.getElementById('settings-bgm-off').onclick = () => { bgm.pause(); };
    document.getElementById('settings-volume-slider').oninput = (e) => { savedVolume = e.target.value; bgm.volume = savedVolume; };
    loadQuestions();
});