document.addEventListener('DOMContentLoaded', () => {
    // 画面・音声要素の取得
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

    // 音声再生（BGM制御＋フリーズ防止）
    function playSfx(audioElement, callback) {
        if (!audioElement) { if(callback) callback(); return; }
        
        // 知識確認モード時はBGMを一時停止
        const isQuizMode = (currentMode === 'quiz');
        if (isQuizMode) bgm.pause();

        audioElement.currentTime = 0;
        audioElement.play().catch(e => {
            console.warn("再生ブロック:", e);
            if(callback) callback(); // 失敗しても次へ
        });

        // 音声終了または強制終了タイマー
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            if (isQuizMode && !bgm.muted && bgm.src !== "") bgm.play();
            if (callback) callback();
        };

        audioElement.onended = finish;
        setTimeout(finish, 3000); // 3秒経ったら強制的に次へ
    }

    // 1. アプリ開始（音声許可取得）
    document.getElementById('start-app-button').onclick = function() {
        this.style.display = 'none';
        screens.modeSelection.style.display = 'block';
        // ブラウザに音声再生を許可させるためのダミー再生
        bgm.play().then(() => bgm.pause()).catch(() => {});
    };

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
            bgm.play().catch(() => {});
        } else { bgm.src = ""; }
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
        if (currentMode === 'quiz') playSfx(sfx.question);
        switchScreen('quiz');
    }

    function checkAnswer(idx) {
        const q = questions[currentQuestionIndex];
        const isCorrect = (idx === q.answer);
        const fText = document.getElementById('feedback-text');
        if (isCorrect) {
            correctAnswersCount++;
            fText.textContent = '正解○';
            fText.style.color = 'green';
            playSfx(sfx.correct);
        } else {
            fText.textContent = '不正解';
            fText.style.color = '#CC00CC';
            playSfx(sfx.incorrect);
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
            playSfx(sfx.drumroll, () => {
                screens.resDetails.style.display = 'block';
            });
        } else {
            screens.resDetails.style.display = 'block';
        }
    }

    function switchScreen(id) {
        [screens.title, screens.quiz, screens.feedback, screens.result].forEach(s => s.style.display = 'none');
        document.getElementById(id + '-screen').style.display = 'block';
    }

    // イベントリスナー
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
    document.getElementById('settings-volume-slider').oninput = (e) => { savedVolume = e.target.value; bgm.volume = savedVolume; };
    loadQuestions();
});