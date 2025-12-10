document.addEventListener('DOMContentLoaded', () => {
    // 画面要素の取得
    const titleScreen = document.getElementById('title-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const feedbackScreen = document.getElementById('feedback-screen');
    const resultScreen = document.getElementById('result-screen');
    // ★追加: 設定画面要素
    const settingsOpenButton = document.getElementById('settings-open-button');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsCloseButton = document.getElementById('settings-close-button');

    // ボタン要素の取得 (既存)
    const optionButtons = document.querySelectorAll('.option-btn');
    const nextButton = document.getElementById('next-button');
    const resultButton = document.getElementById('result-button');
    const restartButton = document.getElementById('restart-button');

    // 音声関連要素
    const backgroundMusic = document.getElementById('background-music');
    // ★修正: 設定画面内のUI
    const settingsVolumeSlider = document.getElementById('settings-volume-slider');
    const settingsBgmOnButton = document.getElementById('settings-bgm-on');
    const settingsBgmOffButton = document.getElementById('settings-bgm-off');

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
    // ★追加: 記憶された音量を保持 (localStorageから取得、なければ0.5)
    let savedVolume = parseFloat(localStorage.getItem('quizAppVolume')) || 0.5;


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
    
    // ★修正: BGMの音量を設定し、localStorageに保存する関数
    function setGlobalVolume(volume, save = true) {
        // 音量を設定
        backgroundMusic.volume = volume;
        // スライダーにも反映
        settingsVolumeSlider.value = volume;
        // 記憶された音量を更新 (音量が0でない場合のみ保存)
        if (volume > 0 && save) {
            savedVolume = volume;
            localStorage.setItem('quizAppVolume', volume.toFixed(2));
        }
    }

    // ★追加: BGM再生処理 (Promiseとエラーハンドリング)
    function playBgm() {
        backgroundMusic.muted = false; // 強制的にミュートを解除
        // 記憶された音量を復元
        setGlobalVolume(savedVolume, false); 
        
        return backgroundMusic.play()
            .then(() => {
                // 再生成功
            })
            .catch(error => {
                // 再生失敗（ブロックされた場合）
                console.error("BGM再生ブロック:", error);
                alert('【BGM再生失敗】ブラウザのセキュリティ設定により、BGMの自動再生がブロックされました。\nお手数ですが、設定画面の「BGM On」ボタンをタップして再生してください。');
                backgroundMusic.pause();
                backgroundMusic.muted = true; // 再生失敗時はミュートに戻す
            });
    }


    // BGMの初期音量設定とスライダー同期
    setGlobalVolume(savedVolume, false);


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

        // ★★★ 5段階評価のロジックは変更なし ★★★
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
        
        hideAllScreens();
        resultScreen.style.display = 'block';
    }

    // すべての画面を非表示にする関数 (設定オーバーレイは別制御)
    function hideAllScreens() {
        titleScreen.style.display = 'none';
        quizScreen.style.display = 'none';
        feedbackScreen.style.display = 'none';
        resultScreen.style.display = 'none';
    }
    
    // モード選択時の初期設定
    function initializeQuiz(mode, audioControl) {
        currentMode = mode;
        currentQuestionIndex = 0;
        correctAnswersCount = 0;
        
        // BGM制御
        if (audioControl === 'play') {
            playBgm();
        } else {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
            // BGMがOffのモードでは、音量をゼロにする（ミュートと同じ効果）
            if (mode !== 'quiz') {
                 backgroundMusic.volume = 0; 
            }
        }
        
        showQuestion();
    }


    // ===========================================
    // イベントリスナーの設定
    // ===========================================

    // モード選択ボタン
    modeStudySoundButton.addEventListener('click', () => initializeQuiz('sound', 'play'));
    modeStudySilentButton.addEventListener('click', () => initializeQuiz('silent', 'pause'));
    modeQuizButton.addEventListener('click', () => initializeQuiz('quiz', 'pause')); // 知識確認クイズモードは次回実装のため、一旦停止

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
        
        hideAllScreens();
        titleScreen.style.display = 'block';
    });
    
    // --- 設定画面のイベント ---
    
    // 設定を開く
    settingsOpenButton.addEventListener('click', () => {
        // 設定画面を開く際、現在の音量設定をスライダーに反映
        const currentVolume = backgroundMusic.muted ? 0 : backgroundMusic.volume;
        settingsVolumeSlider.value = currentVolume;
        
        settingsOverlay.style.display = 'flex';
    });

    // 設定を閉じる (×印)
    settingsCloseButton.addEventListener('click', () => {
        settingsOverlay.style.display = 'none';
    });

    // BGM On (記憶された音量で再生)
    settingsBgmOnButton.addEventListener('click', () => {
        // BGMをONにする場合、現在のモードが'sound'でなくてもBGMを流す
        // ただし、画面遷移時に'sound'でなければ止まる
        playBgm();
    });

    // BGM Off (音量を0にし、停止)
    settingsBgmOffButton.addEventListener('click', () => {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        // スライダーを0に移動
        setGlobalVolume(0, false); 
    });

    // スライダー操作 (音量をリアルタイムで反映・保存)
    settingsVolumeSlider.addEventListener('input', (event) => {
        const newVolume = parseFloat(event.target.value);
        setGlobalVolume(newVolume, true); // リアルタイムで反映＆保存

        // BGMが停止している状態でスライダーを動かしたら再生を試みる
        if (newVolume > 0 && backgroundMusic.paused && currentMode === 'sound') {
             backgroundMusic.muted = false;
             backgroundMusic.play().catch(e => console.log("BGM再生エラー(スライダー操作):", e));
        }
    });

    // アプリの起動
    loadQuestions();
    
    // 起動時にBGMのmutedを強制的にONにし、ユーザー操作を待つ
    backgroundMusic.muted = true;
});