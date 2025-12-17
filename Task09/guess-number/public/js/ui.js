// Модуль пользовательского интерфейса
class GameUI {
    constructor() {
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            stats: document.getElementById('stats-screen'),
            win: document.getElementById('win-screen')
        };

        this.elements = {
            playerName: document.getElementById('player-name'),
            startGame: document.getElementById('start-game'),
            currentPlayer: document.getElementById('current-player'),
            attemptCount: document.getElementById('attempt-count'),
            maxAttempts: document.getElementById('max-attempts'),
            guessInput: document.getElementById('guess-input'),
            submitGuess: document.getElementById('submit-guess'),
            feedbackMessage: document.getElementById('feedback-message'),
            attemptsList: document.getElementById('attempts-list'),
            newGame: document.getElementById('new-game'),
            showStats: document.getElementById('show-stats'),
            backToGame: document.getElementById('back-to-game'),
            playAgain: document.getElementById('play-again'),
            winNumber: document.getElementById('win-number'),
            winAttempts: document.getElementById('win-attempts'),
            statsContent: document.getElementById('stats-content')
        };

        this.initEventListeners();
        console.log("GameUI инициализирован");
    }

    // Инициализация обработчиков событий
    initEventListeners() {
        console.log("Инициализация обработчиков событий");
        
        if (this.elements.startGame) {
            this.elements.startGame.addEventListener('click', () => this.onStartGame());
        }
        
        if (this.elements.submitGuess) {
            this.elements.submitGuess.addEventListener('click', () => this.onSubmitGuess());
        }
        
        if (this.elements.newGame) {
            this.elements.newGame.addEventListener('click', () => this.onNewGame());
        }
        
        if (this.elements.showStats) {
            this.elements.showStats.addEventListener('click', () => this.onShowStats());
        }
        
        if (this.elements.backToGame) {
            this.elements.backToGame.addEventListener('click', () => this.onBackToGame());
        }
        
        if (this.elements.playAgain) {
            this.elements.playAgain.addEventListener('click', () => this.onPlayAgain());
        }

        // Обработка нажатия Enter
        if (this.elements.guessInput) {
            this.elements.guessInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.onSubmitGuess();
                }
            });
        }

        if (this.elements.playerName) {
            this.elements.playerName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.onStartGame();
                }
            });
        }
    }

    // Переключение между экранами
    showScreen(screenName) {
        console.log(`Показываем экран: ${screenName}`);
        
        // Скрываем все экраны
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
            }
        });

        // Показываем нужный экран
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    // Обновление информации об игре
    updateGameInfo(stats) {
        if (this.elements.currentPlayer) {
            this.elements.currentPlayer.textContent = stats.playerName;
        }
        if (this.elements.attemptCount) {
            this.elements.attemptCount.textContent = stats.currentAttempt;
        }
        if (this.elements.maxAttempts) {
            this.elements.maxAttempts.textContent = stats.maxAttempts;
        }
    }

    // Отображение обратной связи
    showFeedback(attempt) {
        if (!this.elements.feedbackMessage) return;
        
        const feedback = this.elements.feedbackMessage;
        feedback.textContent = attempt.message;
        feedback.className = 'feedback';

        if (attempt.result === 'more') {
            feedback.classList.add('more');
        } else if (attempt.result === 'less') {
            feedback.classList.add('less');
        } else if (attempt.result === 'win') {
            feedback.classList.add('win');
        }
    }

    // Обновление истории попыток
    updateAttemptsHistory(attempts) {
        if (!this.elements.attemptsList) return;
        
        const attemptsList = this.elements.attemptsList;
        attemptsList.innerHTML = '';

        attempts.forEach(attempt => {
            const attemptItem = document.createElement('div');
            attemptItem.className = 'attempt-item';
            
            attemptItem.innerHTML = `
                <span class="attempt-number">#${attempt.number}</span>
                <span class="attempt-guess">${attempt.guess}</span>
                <span class="attempt-result ${attempt.result}">
                    ${attempt.result === 'more' ? '⬆️ Больше' : 
                      attempt.result === 'less' ? '⬇️ Меньше' : 
                      '🎉 Угадал!'}
                </span>
            `;

            attemptsList.appendChild(attemptItem);
        });

        // Прокручиваем к последней попытке
        if (attemptsList.scrollHeight) {
            attemptsList.scrollTop = attemptsList.scrollHeight;
        }
    }

    // Показать экран победы
    showWinScreen(secretNumber, attemptsCount) {
        if (this.elements.winNumber) {
            this.elements.winNumber.textContent = secretNumber;
        }
        if (this.elements.winAttempts) {
            this.elements.winAttempts.textContent = attemptsCount;
        }
        this.showScreen('win');
    }

    // Очистка полей ввода
    clearInputs() {
        if (this.elements.guessInput) {
            this.elements.guessInput.value = '';
        }
    }

    // Фокус на поле ввода
    focusGuessInput() {
        if (this.elements.guessInput) {
            this.elements.guessInput.focus();
        }
    }

    // Блокировка/разблокировка элементов управления
    setGameControlsEnabled(enabled) {
        if (this.elements.guessInput) {
            this.elements.guessInput.disabled = !enabled;
        }
        if (this.elements.submitGuess) {
            this.elements.submitGuess.disabled = !enabled;
        }
    }

    // Показать статистику
    showStats(gameHistory = [], overallStats = null) {
        let statsHTML;
        
        if (!gameHistory || gameHistory.length === 0) {
            statsHTML = `
                <div class="stats-placeholder">
                    <p>📊 Статистика будет доступна после завершения игр</p>
                    <p>Завершите хотя бы одну игру, чтобы увидеть историю</p>
                </div>
            `;
        } else {
            statsHTML = `
                <div class="game-history">
                    <h3>История последних игр</h3>
                    <div class="history-list">
                        ${gameHistory.slice(0, 5).map((game, index) => `
                            <div class="history-item ${game.isWin ? 'win' : 'lose'}">
                                <div class="history-header">
                                    <span class="game-number">Игра #${game.id || index + 1}</span>
                                    <span class="game-date">${game.date || 'Нет даты'}</span>
                                </div>
                                <div class="game-details">
                                    <span class="player">Игрок: ${game.playerName || game.player_name}</span>
                                    <span class="result ${game.isWin ? 'win' : 'lose'}">
                                        ${game.isWin ? '🎉 Победа' : '💫 Поражение'}
                                    </span>
                                    <span class="attempts">Попыток: ${game.totalAttempts || game.total_attempts || 0}</span>
                                    <span class="number">Число: ${game.secretNumber || game.secret_number}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (this.elements.statsContent) {
            this.elements.statsContent.innerHTML = statsHTML;
        }
        this.showScreen('stats');
    }

    // Колбэки для обработки событий
    onStartGame() {}
    onSubmitGuess() {}
    onNewGame() {}
    onShowStats() {}
    onBackToGame() {}
    onPlayAgain() {}
}