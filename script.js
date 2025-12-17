document.addEventListener('DOMContentLoaded', () => {
    // 画面要素の取得
    const titleScreen = document.getElementById('title-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const feedbackScreen = document.getElementById('feedback-screen');
    const resultScreen = document.getElementById('result-screen');
    const settingsOpenButton = document.getElementById('settings-open-button');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsCloseButton = document.getElementById('settings-close-button');

    // ボタン要素の取得
    const optionButtons = document.querySelectorAll('.option-btn');
    const nextButton = document.getElementById('next-button');
    const resultButton = document.getElementById('result-button');
    const restartButton = document.getElementById('restart-button');

    // 音声関連要素
    const backgroundMusic = document.getElementById('background-music'); 
    const sfxQuestion = document.getElementById('sfx-question');
    const sfxCorrect = document.getElementById('sfx-correct');
    const sfxIncorrect = document.getElementById('sfx-incorrect');
    const sfxDrumroll = document.getElementById('sfx-drumroll');

    // 設定画面UI
    const settingsVolumeSlider = document.getElementById('settings-volume-slider');
    const settingsBgmOnButton = document.getElementById('settings-bgm-on');
    const settingsBgmOffButton = document.getElementById('settings-bgm-off');

    // モード選択ボタン
    const modeStudySoundButton = document.getElementById('mode-study-sound');
    const modeStudySilentButton = document.getElementById('mode-study-silent');
    const modeQuizButton = document.getElementById('mode-quiz');

    // テキスト表示要素
    const questionText = document.getElementById('question-text');
    const questionCounter = document.getElementById('question-counter');
    const totalQuestionsText = document.getElementById('total-questions');
    const feedbackText = document.getElementById('feedback-text');
    const correctAnswerText = document.getElementById('correct-answer');
    const explanationTitle = document.getElementById('explanation-title');
    const explanationText = document.getElementById('explanation-text');
    const resultScore = document.getElementById('result-score');
    const resultMessage = document.getElementById('result-message');

    let questions = []; 
    let currentQuestionIndex = 0; 
    let correctAnswersCount = 0; 
    let currentMode = 'silent'; 
    let savedVolume = 0.5;

    // 音源ファイルの定義
    const BGM_SOURCES = {
        sound: 'rain_sound_01_60min.mp3',
        quiz: 'quiz_bgm.mp3'
    };

    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            questions = await response.json();
            if (questions.length > 0) {
                totalQuestionsText.textContent = `全${questions.length}問`;
            }
        } catch (error) {
            console.error('問題データの読み込みに失敗しました:', error);
        }
    }

    function setGlobalVolume(volume, save = true) {
        backgroundMusic.volume = volume;
        if (save) savedVolume = volume;
        settingsVolumeSlider.value = volume;
    }

    function toggleBgm(action) {
        if (action === 'play') {
            if (currentMode === 'sound' || currentMode === 'quiz') {
                backgroundMusic.muted = false;
                backgroundMusic.play().catch(e => console.log("再生ブロック:", e));
            }
        } else {
            backgroundMusic.pause();
        }
    }

    function playSfx(sfxElement) {
        if (currentMode === 'quiz') {
            // SFX再生中はBGMを下げるか止める処理
            const originalVolume = backgroundMusic.volume;
            backgroundMusic.volume = originalVolume * 0.3; 
            
            sfxElement.currentTime = 0;
            sfxElement.play();
            
            sfxElement.onended = () => {
                backgroundMusic.volume = originalVolume;
            };
        }
    }

    function showQuestion() {
        const currentQuestion = questions[currentQuestionIndex];
        questionCounter.textContent = `問${currentQuestionIndex + 1}`;
        questionText.textContent = currentQuestion.question;
        optionButtons.forEach((button, index) => {
            button.textContent = currentQuestion.options[index];
            button.disabled = false;
        });

        if (currentMode === 'quiz') playSfx(sfxQuestion);

        hideAllScreens();
        quizScreen.style.display = 'block';
    }

    function checkAnswer(selectedIndex) {
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = (selectedIndex === currentQuestion.answer);

        if (isCorrect) {
            correctAnswersCount++;
            feedbackText.textContent = '正解○';
            feedbackText.style.color = 'green';
            playSfx(sfxCorrect);
        } else {
            feedbackText.textContent = '不正解';
            feedbackText.style.color = '#CC00CC';
            playSfx(sfxIncorrect);
        }

        correctAnswerText.innerHTML = `正解： <span style="color: green; font-weight: bold;">${currentQuestion.options[currentQuestion.answer]}</span>`;
        explanationText.textContent = currentQuestion.explanation;

        if (currentQuestionIndex === questions.length - 1) {
            nextButton.style.display = 'none';
            resultButton.style.display = 'block';
        } else {
            nextButton.style.display = 'block';
            resultButton.style.display = 'none';
        }

        hideAllScreens();
        feedbackScreen.style.display = 'block';
    }

    function showResults() {
        const totalQuestions = questions.length;
        const scorePercentage = (correctAnswersCount / totalQuestions) * 100;
        let message = '';

        if (scorePercentage > 80) message = '完璧！情報Iマスター！';
        else if (scorePercentage > 60) message = '素晴らしい！その調子！！';
        else if (scorePercentage > 40) message = '標準到達！あと一歩！';
        else if (scorePercentage > 20) message = 'これから伸びます！基礎固め！';
        else message = '焦らず！まずはスタートライン！';

        backgroundMusic.pause();

        if (currentMode === 'quiz') {
            sfxDrumroll.currentTime = 0;
            sfxDrumroll.play();
            sfxDrumroll.onended = () => {
                displayResultData(totalQuestions, message);
            };
        } else {
            displayResultData(totalQuestions, message);
        }
    }

    function displayResultData(total, msg) {
        resultScore.textContent = `${correctAnswersCount}/${total}`;
        resultMessage.textContent = msg;
        hideAllScreens();
        resultScreen.style.display = 'block';
    }

    function startQuiz(mode) {
        currentMode = mode;
        currentQuestionIndex = 0;
        correctAnswersCount = 0;

        if (BGM_SOURCES[mode]) {
            backgroundMusic.src = BGM_SOURCES[mode];
            backgroundMusic.load();
            backgroundMusic.muted = false;
            backgroundMusic.volume = savedVolume;
            backgroundMusic.play().catch(e => console.log("BGM再生待機:", e));
        } else {
            backgroundMusic.pause();
            backgroundMusic.src = "";
        }

        showQuestion();
    }

    function hideAllScreens() {
        titleScreen.style.display = 'none';
        quizScreen.style.display = 'none';
        feedbackScreen.style.display = 'none';
        resultScreen.style.display = 'none';
    }

    // イベントリスナー
    modeStudySoundButton.addEventListener('click', () => startQuiz('sound'));
    modeStudySilentButton.addEventListener('click', () => startQuiz('silent'));
    modeQuizButton.addEventListener('click', () => startQuiz('quiz'));

    optionButtons.forEach((button, index) => {
        button.addEventListener('click', () => checkAnswer(index));
    });

    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        showQuestion();
    });

    resultButton.addEventListener('click', showResults);
    restartButton.addEventListener('click', () => {
        backgroundMusic.pause();
        backgroundMusic.src = "";
        hideAllScreens();
        titleScreen.style.display = 'block';
    });

    settingsOpenButton.addEventListener('click', () => {
        settingsOverlay.style.display = 'flex';
    });

    settingsCloseButton.addEventListener('click', () => {
        settingsOverlay.style.display = 'none';
    });

    settingsBgmOnButton.addEventListener('click', () => toggleBgm('play'));
    settingsBgmOffButton.addEventListener('click', () => toggleBgm('pause'));

    settingsVolumeSlider.addEventListener('input', (e) => {
        setGlobalVolume(parseFloat(e.target.value));
    });

    loadQuestions();
});