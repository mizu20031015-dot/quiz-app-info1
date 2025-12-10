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

    // 音声関連要素 (BGMを一本化)
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
    
    // テキスト表示要素の取得
    const questionText = document.getElementById('question-text');
    const questionCounter = document.getElementById('question-counter');
    const totalQuestionsText = document.getElementById('total-questions');
    const feedbackText = document.getElementById('feedback-text');
    const correctAnswerText = document.getElementById('correct-answer');
    const explanationTitle = document.getElementById('explanation-title');
    const explanationText = document.getElementById('explanation-text');
    const resultDetails = document.getElementById('result-details');
    const resultScore = document.getElementById('result-score');
    const resultMessage = document.getElementById('result-message');

    let questions = []; 
    let currentQuestionIndex = 0; 
    let correctAnswersCount = 0; 
    
    let currentMode = 'silent'; 
    let savedVolume = parseFloat(localStorage.getItem('quizAppVolume')) || 0.5;
    let bgmFadeTimer = null; 


    // JSONファイルを読み込む関数
    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            questions = await response.json();
            
            if (questions.length > 0) {
                totalQuestionsText.textContent = `全${questions.length}問`;
            }
            
        } catch (error) {
            console.error('問題データの読み込みに失敗しました:', error);
            alert('問題データの読み込みに失敗しました。Live Serverを使用しているか確認してください。');
        }
    }
    
    // BGMの音量を設定し、localStorageに保存する関数
    function setGlobalVolume(volume, save = true) {
        backgroundMusic.volume = volume;

        // スライダーにも反映
        settingsVolumeSlider.value = volume;
        // 記憶された音量を更新 (音量が0でない場合のみ保存)
        if (volume > 0 && save) {
            savedVolume = volume;
            localStorage.setItem('quizAppVolume', volume.toFixed(2));
        }
    }

    // BGMの再生/一時停止 (BGMを一本化)
    function toggleBgm(action) {
        if (action === 'play') {
            backgroundMusic.muted = false;
            backgroundMusic.volume = savedVolume; 
            backgroundMusic.play()
                .catch(error => {
                    console.error("BGM再生ブロック/エラー:", error);
                    alert('【BGM再生失敗】ブラウザのセキュリティ設定により、BGMの自動再生がブロックされました。\nお手数ですが、設定画面の「BGM On」ボタンをタップして再生してください。');
                    backgroundMusic.pause();
                    backgroundMusic.muted = true;
                });
        } else {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
            backgroundMusic.volume = 0; 
        }
    }

    // フェードイン/アウト機能 (効果音再生時のBGM制御用)
    function fadeBgm(audioElement, direction, callback = null) {
        if (bgmFadeTimer) clearInterval(bgmFadeTimer);
        const targetVolume = (direction === 'in') ? savedVolume : 0;
        const step = 0.05;

        if (direction === 'in' && audioElement.paused) {
            audioElement.play().catch(e => console.error("Fade-in play error:", e));
        }

        bgmFadeTimer = setInterval(() => {
            let volume = audioElement.volume;
            let finished = false;

            if (direction === 'in') {
                volume += step;
                if (volume >= targetVolume) {
                    volume = targetVolume;
                    finished = true;
                }
            } else { // direction === 'out'
                volume -= step;
                if (volume <= targetVolume) {
                    volume = targetVolume;
                    finished = true;
                    audioElement.pause();
                }
            }
            audioElement.volume = Math.max(0, Math.min(savedVolume, volume));

            if (finished) {
                clearInterval(bgmFadeTimer);
                if (callback) callback();
            }
        }, 50);
    }
    
    // 効果音再生とBGM制御 (知識確認クイズモード専用)
    function playSfxWithBgmControl(sfxElement) {
        // BGMをフェードアウトして一時停止
        fadeBgm(backgroundMusic, 'out', () => {
            backgroundMusic.pause();
            
            // 効果音の再生
            sfxElement.volume = savedVolume;
            sfxElement.play().then(() => {
                // 効果音再生後にBGMをフェードインして復帰
                sfxElement.onended = () => {
                    sfxElement.currentTime = 0;
                    fadeBgm(backgroundMusic, 'in');
                };
            }).catch(e => {
                console.error("SFX再生エラー:", e);
                fadeBgm(backgroundMusic, 'in');
            });
        });
    }

    // 問題を表示する関数
    function showQuestion() {
        const currentQuestion = questions[currentQuestionIndex];
        
        questionCounter.textContent = `問${currentQuestionIndex + 1}`;
        questionText.textContent = currentQuestion.question;
        
        optionButtons.forEach((button, index) => {
            button.textContent = currentQuestion.options[index];
            button.disabled = false;
        });

        // 知識確認クイズモードでは出題時に効果音を鳴らす
        if (currentMode === 'quiz') {
            sfxQuestion.volume = savedVolume;
            sfxQuestion.play().catch(e => console.error("Question SFX error:", e));
        }

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
        
        // 知識確認クイズモードはSFX再生後に画面遷移
        if (currentMode === 'quiz') {
            const sfxToPlay = isCorrect ? sfxCorrect : sfxIncorrect;
            playSfxWithBgmControl(sfxToPlay);
        }

        // 画面遷移は即座に行う
        hideAllScreens();
        feedbackScreen.style.display = 'block';
    }
    
    // 結果を表示する関数
    function showResults() {
        const totalQuestions = questions.length;
        const scorePercentage = (correctAnswersCount / totalQuestions) * 100;
        let message = '';

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
        
        resultScore.textContent = `${correctAnswersCount}/${totalQuestions}`;
        resultMessage.textContent = message;
        
        // BGMを停止
        toggleBgm('pause');
        
        // 結果詳細（スコア、メッセージ、ボタン）を非表示にし、結果画面に遷移
        resultDetails.style.display = 'none'; 
        hideAllScreens();
        resultScreen.style.display = 'block';

        // 知識確認クイズモードの場合、ドラムロールを鳴らしてディレイをかける
        if (currentMode === 'quiz') {
            sfxDrumroll.volume = savedVolume;
            sfxDrumroll.currentTime = 0;
            
            sfxDrumroll.play().then(() => {
                // ★ディレイロジック: シンバル音に合わせて2秒後に結果を表示
                const delayTimeMs = 2000; 
                
                setTimeout(() => {
                    // 2秒後にスコア、メッセージ、ボタンを表示
                    resultDetails.style.display = 'block';
                }, delayTimeMs);

                sfxDrumroll.onended = () => {
                    // ドラムロール終了後、2秒ディレイが終わっていなければ表示を確実にする
                    if (resultDetails.style.display === 'none') {
                         resultDetails.style.display = 'block';
                    }
                };
            }).catch(e => {
                console.error("Drumroll SFX error:", e);
                // SFX再生失敗時はすぐに結果を表示
                resultDetails.style.display = 'block';
            });
        } else {
            // 学習集中モードの場合、すぐに結果を表示
            resultDetails.style.display = 'block';
        }
    }

    // すべての画面を非表示にする関数 (設定オーバーレイは別制御)
    function hideAllScreens() {
        titleScreen.style.display = 'none';
        quizScreen.style.display = 'none';
        feedbackScreen.style.display = 'none';
        resultScreen.style.display = 'none';
    }
    
    // モード選択時の初期設定
    function initializeQuiz(mode, audioType) {
        currentMode = mode;
        currentQuestionIndex = 0;
        correctAnswersCount = 0;
        
        // BGM制御
        if (audioType === 'play') {
            toggleBgm('play');
        } else {
            toggleBgm('pause');
        }
        
        showQuestion();
    }


    // ===========================================
    // イベントリスナーの設定
    // ===========================================

    // モード選択ボタン
    modeStudySoundButton.addEventListener('click', () => initializeQuiz('sound', 'play'));
    modeStudySilentButton.addEventListener('click', () => initializeQuiz('silent', 'pause'));
    modeQuizButton.addEventListener('click', () => initializeQuiz('quiz', 'play')); 

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
        // BGMを完全に停止
        toggleBgm('pause');
        
        hideAllScreens();
        titleScreen.style.display = 'block';
    });
    
    // --- 設定画面のイベント ---
    
    // 設定を開く
    settingsOpenButton.addEventListener('click', () => {
        // BGMの状態に応じてスライダー値を反映 
        let currentVolume = backgroundMusic.paused ? savedVolume : backgroundMusic.volume;

        settingsVolumeSlider.value = currentVolume;
        
        settingsOverlay.style.display = 'flex';
    });

    // 設定を閉じる (×印)
    settingsCloseButton.addEventListener('click', () => {
        settingsOverlay.style.display = 'none';
    });

    // BGM On (記憶された音量で再生)
    settingsBgmOnButton.addEventListener('click', () => {
        toggleBgm('play');
    });

    // BGM Off (音量を0にし、停止)
    settingsBgmOffButton.addEventListener('click', () => {
        toggleBgm('pause');
        
        // スライダーを0に移動
        setGlobalVolume(0, false); 
    });

    // スライダー操作 (音量をリアルタイムで反映・保存)
    settingsVolumeSlider.addEventListener('input', (event) => {
        const newVolume = parseFloat(event.target.value);
        setGlobalVolume(newVolume, true); // リアルタイムで反映＆保存

        // BGMが停止している状態でスライダーを動かしたら再生を試みる
        if (newVolume > 0 && backgroundMusic.paused) {
             backgroundMusic.muted = false;
             backgroundMusic.play().catch(e => console.log("BGM再生エラー(スライダー操作):", e));
        }
    });

    // アプリの起動
    loadQuestions();
    
    // 起動時にBGMのmutedを強制的にONにし、ユーザー操作を待つ
    backgroundMusic.muted = true;
});