document.addEventListener('DOMContentLoaded', () => {
    // 画面要素の取得
    const titleScreen = document.getElementById('title-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const feedbackScreen = document.getElementById('feedback-screen');
    const resultScreen = document.getElementById('result-screen');

    // ボタン要素の取得 (既存)
    const optionButtons = document.querySelectorAll('.option-btn');
    const nextButton = document.getElementById('next-button');
    const resultButton = document.getElementById('result-button');
    const restartButton = document.getElementById('restart-button');

    // 音声関連要素
    const volumeSlider = document.getElementById('volume-slider');
    const bgmToggleButton = document.getElementById('bgm-toggle-button');
    const backgroundMusic = document.getElementById('background-music');

    // モード選択ボタン
    const modeStudySoundButton = document.getElementById('mode-study-sound');
    const modeStudySilentButton = document.getElementById('mode-study-silent');
    const modeQuizButton = document.getElementById('mode-quiz');
    
    // テキスト表示要素の取得
    const questionText = document.getElementById('question-text');
    const questionCounter = document.getElementById('question-counter');
    const totalQuestionsText = document.getElementById('total-questions');
    const feedbackText = document.getElementById('feedback-text');
    const correctAnswerText = document.getElementById('correct-answer');
    const explanationTitle = document.getElementById('explanation-title');
    const explanationText = document.getElementById('explanation-text');
    const resultScore = document.getElementById('result-score');
    const resultMessage = document.getElementById('result-message');

    let questions = []; // 問題データを格納する配列
    let currentQuestionIndex = 0; // 現在の問題番号
    let correctAnswersCount = 0; // 正解数
    
    let currentMode = 'silent'; // 'sound', 'silent', 'quiz'

    // JSONファイルを読み込む関数
    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            questions = await response.json();
            
            // 問題総数をタイトル画面に設定
            if (questions.length > 0) {
                totalQuestionsText.textContent = `全${questions.length}問`;
            }
            
        } catch (error) {
            console.error('問題データの読み込みに失敗しました:', error);
            alert('問題データの読み込みに失敗しました。Live Serverを使用しているか確認してください。');
        }
    }
    
    // BGMの音量を設定する関数 (音量スライダーと同期)
    function setGlobalVolume(volume) {
        backgroundMusic.volume = volume;
    }

    // BGMの再生状態を更新する関数
    function updateBgmToggleButton() {
        if (backgroundMusic.paused || backgroundMusic.muted) {
            bgmToggleButton.textContent = 'BGM Off';
        } else {
            bgmToggleButton.textContent = 'BGM On';
        }
    }

    // 全体音量の初期設定
    setGlobalVolume(parseFloat(volumeSlider.value));
    updateBgmToggleButton();


    // 問題を表示する関数
    function showQuestion() {
        const currentQuestion = questions[currentQuestionIndex];
        
        questionCounter.textContent = `問${currentQuestionIndex + 1}`;
        questionText.textContent = currentQuestion.question;
        
        optionButtons.forEach((button, index) => {
            button.textContent = currentQuestion.options[index];
            button.disabled = false;
        });

        hideAllScreens();
        quizScreen.style.display = 'block';
    }

    // 回答をチェックする関数
    function checkAnswer(selectedIndex) {
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = (selectedIndex === currentQuestion.answer);

        if (isCorrect) {
            correctAnswersCount++;
            feedbackText.textContent = '正解○';
            feedbackText.style.color = 'green'; 
        } else {
            feedbackText.textContent = '不正解';
            feedbackText.style.color = '#CC00CC'; 
        }

        correctAnswerText.innerHTML = `正解： <span style="color: green; font-weight: bold;">${currentQuestion.options[currentQuestion.answer]}</span>`; 
        
        explanationTitle.textContent = `解説`;
        explanationText.textContent = currentQuestion.explanation;
        
        if (currentQuestionIndex === questions.length - 1) {
            nextButton.style.display = 'none';
            resultButton.style.display = 'block';
        } else {
            nextButton.style.display = 'block';
            resultButton.style.display = 'none';
        }
        
        // 学習集中モード(音あり)以外ではBGMを停止
        if (currentMode !== 'sound') {
            backgroundMusic.pause();
        }

        hideAllScreens();
        feedbackScreen.style.display = 'block';
    }
    
    // 結果を表示する関数
    function showResults() {
        const totalQuestions = questions.length;
        const scorePercentage = (correctAnswersCount / totalQuestions) * 100;
        let message = '';

        // ★★★ 5段階評価のロジックを実装 ★★★
        if (scorePercentage > 80) {
            message = '完璧！情報Iマスター！';
        } else if (scorePercentage > 60) {
            message = '素晴らしい！その調子！！';
        } else if (scorePercentage > 40) {
            message = '標準到達！あと一歩！';
        } else if (scorePercentage > 20) {
            message = 'これから伸びます！基礎固め！';
        } else {
            message = '焦らず！まずはスタートライン！';
        }
        // ★★★ ロジック終了 ★★★
        
        resultScore.textContent = `${correctAnswersCount}/${totalQuestions}`;
        resultMessage.textContent = message;
        
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        
        updateBgmToggleButton();

        hideAllScreens();
        resultScreen.style.display = 'block';
    }

    // すべての画面を非表示にする関数
    function hideAllScreens() {
        titleScreen.style.display = 'none';
        quizScreen.style.display = 'none';
        feedbackScreen.style.display = 'none';
        resultScreen.style.display = 'none';
    }
    
    // モード選択時の初期設定
    function initializeQuiz(mode) {
        currentMode = mode;
        currentQuestionIndex = 0;
        correctAnswersCount = 0;
        showQuestion();
    }


    // ★修正: モード選択ボタンのイベントリスナー - 画面遷移を最優先にする
    modeStudySoundButton.addEventListener('click', () => {
        // 1. まず、モードを設定
        currentMode = 'sound';
        
        // 2. BGMの再生を試行（失敗しても画面遷移は止めない）
        backgroundMusic.muted = false;
        backgroundMusic.volume = parseFloat(volumeSlider.value);
        
        backgroundMusic.play()
            .then(() => {
                // 再生成功: 何もしない (updateBgmToggleButtonが自動で更新)
            })
            .catch(error => {
                // ★修正: 再生失敗: 画面遷移を止めていた原因のアラートを、BGM再生の成功・失敗に関係なく実行されるように変更
                alert('BGMの再生がブロックされました。ブラウザの設定を確認するか、学習集中モード(音なし)をお試しください。');
                backgroundMusic.muted = true; // BGMをミュートし、音が鳴らない状態を維持
            })
            .finally(() => {
                // ★追加: BGMの再生結果にかかわらず、クイズを初期化し画面遷移を保証
                initializeQuiz('sound');
            });
    });

    modeStudySilentButton.addEventListener('click', () => {
        // 1. BGMを停止し、無音モードのバグを回避
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        updateBgmToggleButton();

        // 2. クイズを初期化し、画面遷移を保証
        initializeQuiz('silent');
    });

    modeQuizButton.addEventListener('click', () => {
        // BGMを停止 (知識確認クイズモードのBGMは次回実装)
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        updateBgmToggleButton();
        initializeQuiz('quiz');
    });


    optionButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            checkAnswer(index);
        });
    });

    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        showQuestion();
    });

    resultButton.addEventListener('click', showResults);
    
    restartButton.addEventListener('click', () => {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        updateBgmToggleButton();
        
        hideAllScreens();
        titleScreen.style.display = 'block';
    });
    
    // 音量スライダーのイベントリスナー
    volumeSlider.addEventListener('input', (event) => {
        const newVolume = parseFloat(event.target.value);
        setGlobalVolume(newVolume);
        
        if (newVolume > 0 && backgroundMusic.muted) {
            backgroundMusic.muted = false;
        }
        if (currentMode === 'sound' && backgroundMusic.paused) {
             backgroundMusic.play().catch(e => console.log("BGM再生エラー(スライダー操作):", e));
        }

        updateBgmToggleButton();
    });

    // BGM On/Off ボタンのイベントリスナー
    bgmToggleButton.addEventListener('click', () => {
        if (backgroundMusic.paused || backgroundMusic.muted) {
            backgroundMusic.muted = false;
            backgroundMusic.volume = parseFloat(volumeSlider.value);
            backgroundMusic.play().catch(e => {
                alert('BGM再生がブロックされました。ブラウザの設定でメディアの自動再生を許可してください。');
                backgroundMusic.muted = true;
            });
        } else {
            backgroundMusic.pause();
        }
        updateBgmToggleButton();
    });

    // BGMの再生/停止イベントをリッスンし、ボタンのテキストを更新 (外部からの操作にも対応)
    backgroundMusic.addEventListener('play', updateBgmToggleButton);
    backgroundMusic.addEventListener('pause', updateBgmToggleButton);
    backgroundMusic.addEventListener('volumechange', updateBgmToggleButton);


    // アプリの起動
    loadQuestions();
    
    // 起動時に一度BGM再生を試みる (muted状態で)
    backgroundMusic.play().catch(e => {
        // 自動再生がブロックされた場合は何もしない
    });
});