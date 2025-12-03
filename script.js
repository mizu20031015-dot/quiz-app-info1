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

    // ★追加: 音声関連要素
    const volumeSlider = document.getElementById('volume-slider');
    const bgmToggleButton = document.getElementById('bgm-toggle-button');
    const backgroundMusic = document.getElementById('background-music');

    // ★追加: モード選択ボタン
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
    
    // ★修正: 現在のモードを保持する変数
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
    
    // ★追加: BGMの音量を設定する関数 (音量スライダーと同期)
    function setGlobalVolume(volume) {
        // 現在、BGMのみなので、BGMに適用
        backgroundMusic.volume = volume;
    }

    // ★追加: BGMの再生状態を更新する関数
    function updateBgmToggleButton() {
        bgmToggleButton.textContent = backgroundMusic.paused ? 'BGM Off' : 'BGM On';
    }

    // ★追加: 全体音量の初期設定
    setGlobalVolume(volumeSlider.value);
    updateBgmToggleButton();


    // 問題を表示する関数
    function showQuestion() {
        // BGMはモード選択ボタンのクリックで既に制御されている
        
        const currentQuestion = questions[currentQuestionIndex];
        
        // 問題カウンターを「問〇」形式で表示
        questionCounter.textContent = `問${currentQuestionIndex + 1}`;
        
        questionText.textContent = currentQuestion.question;
        
        optionButtons.forEach((button, index) => {
            button.textContent = currentQuestion.options[index];
            button.disabled = false;
        });

        // 画面の切り替え
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

        // 正解の選択肢に「：」を全角に変更
        correctAnswerText.innerHTML = `正解： <span style="color: green; font-weight: bold;">${currentQuestion.options[currentQuestion.answer]}</span>`; 
        
        // 解説の「：」を全角に変更
        explanationTitle.textContent = `解説`;
        explanationText.textContent = currentQuestion.explanation;
        
        // 最終問題かどうかの判定
        if (currentQuestionIndex === questions.length - 1) {
            nextButton.style.display = 'none';
            resultButton.style.display = 'block';
        } else {
            nextButton.style.display = 'block';
            resultButton.style.display = 'none';
        }
        
        // ★修正: 学習集中モードではBGMを止めない
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
        if (scorePercentage > 80) { // 81% 以上 (Sランク)
            message = '完璧！情報Iマスター！';
        } else if (scorePercentage > 60) { // 61% 〜 80% (Aランク)
            message = '素晴らしい！その調子！！';
        } else if (scorePercentage > 40) { // 41% 〜 60% (Bランク)
            message = '標準到達！あと一歩！';
        } else if (scorePercentage > 20) { // 21% 〜 40% (Cランク)
            message = 'これから伸びます！基礎固め！';
        } else { // 0% 〜 20% (Dランク)
            message = '焦らず！まずはスタートライン！';
        }
        // ★★★ ロジック終了 ★★★
        
        resultScore.textContent = `${correctAnswersCount}/${totalQuestions}`;
        resultMessage.textContent = message;
        
        // ★修正: 結果画面ではBGMを停止
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; // 再生位置をリセット
        
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
    
    // ★修正: モード選択時の処理 (BGMの自動再生を確保)
    function startQuiz(mode) {
        currentMode = mode;
        currentQuestionIndex = 0;
        correctAnswersCount = 0;
        
        // BGMの制御 (ユーザー操作の直後に実行)
        if (mode === 'sound') {
            // 学習集中モード(音あり)では、BGMを再生
            backgroundMusic.play().catch(e => console.log("BGM再生エラー:", e)); 
        } else {
            // それ以外のモードではBGMを停止
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        }

        updateBgmToggleButton();
        showQuestion();
    }


    // イベントリスナーの設定
    // ★修正: スタートボタンをモード選択ボタンに置き換え
    modeStudySoundButton.addEventListener('click', () => startQuiz('sound'));
    modeStudySilentButton.addEventListener('click', () => startQuiz('silent'));
    modeQuizButton.addEventListener('click', () => startQuiz('quiz')); // 知識確認クイズモードは次回以降実装

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
        // ★修正: タイトル画面へ戻る際にBGMを停止
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        updateBgmToggleButton();
        
        hideAllScreens();
        titleScreen.style.display = 'block';
    });
    
    // ★追加: 音量スライダーのイベントリスナー
    volumeSlider.addEventListener('input', (event) => {
        setGlobalVolume(parseFloat(event.target.value));
    });

    // ★追加: BGM On/Off ボタンのイベントリスナー
    bgmToggleButton.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(e => console.log("BGM再生エラー:", e));
        } else {
            backgroundMusic.pause();
        }
        // ★追加: BGMの状態が変更されたらボタンのテキストも更新
        updateBgmToggleButton();
    });

    // ★追加: BGMの再生/停止イベントをリッスンし、ボタンのテキストを更新 (外部からの操作にも対応)
    backgroundMusic.addEventListener('play', updateBgmToggleButton);
    backgroundMusic.addEventListener('pause', updateBgmToggleButton);

    // アプリの起動
    loadQuestions();
});