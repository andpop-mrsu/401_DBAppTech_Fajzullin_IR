// Главный модуль приложения
class GuessNumberApp {
    constructor() {
        this.game = new Game();
        this.ui = new GameUI();
        this.db = new GameDatabase();
        
        this.init();
    }

    // Инициализация приложения
    async init() {
        console.log('🚀 Инициализация приложения "Угадай число"');
        
        // Инициализация БД
        try {
            await this.db.init();
            console.log('✅ База данных инициализирована');
        } catch (error) {
            console.error('❌ Ошибка инициализации БД:', error);
        }
        
        // Устанавливаем обработчики событий
        this.setupEventHandlers();
        
        // Показываем стартовый экран
        this.ui.showScreen('start');
        this.ui.focusGuessInput();
    }

    // Настройка обработчиков событий
    setupEventHandlers() {
        // Основные обработчики игры
        this.ui.onStartGame = () => this.handleStartGame();
        this.ui.onSubmitGuess = () => this.handleSubmitGuess();
        this.ui.onNewGame = () => this.handleNewGame();
        this.ui.onShowStats = () => this.handleShowStats();
        this.ui.onBackToGame = () => this.handleBackToGame();
        this.ui.onPlayAgain = () => this.handlePlayAgain();
        
        // Обработчики для работы с БД
        this.setupDatabaseHandlers();
    }

    // Настройка обработчиков для работы с БД
    setupDatabaseHandlers() {
        // Список игр
        const showAllGamesBtn = document.getElementById('show-all-games');
        if (showAllGamesBtn) {
            showAllGamesBtn.addEventListener('click', () => {
                this.showGamesList();
            });
        }
        
        // Очистить БД
        const clearDatabaseBtn = document.getElementById('clear-database');
        if (clearDatabaseBtn) {
            clearDatabaseBtn.addEventListener('click', () => {
                this.clearDatabase();
            });
        }
        
        // Экспорт данных
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportDatabase();
            });
        }
        
        // Статистика
        const showStatsBtn = document.getElementById('show-stats-db');
        if (showStatsBtn) {
            showStatsBtn.addEventListener('click', () => {
                this.showDatabaseStats();
            });
        }
    }

    // Показать список игр
    async showGamesList() {
        try {
            const games = await this.db.getAllGames();
            this.renderGamesList(games);
        } catch (error) {
            console.error('Ошибка загрузки игр:', error);
            alert('Ошибка загрузки списка игр');
        }
    }

    // Отрисовка списка игр
    renderGamesList(games) {
        let html = '<h3>📋 Список сохраненных игр</h3>';
        
        if (games.length === 0) {
            html += '<p style="text-align:center; color:#666; padding:20px;">Нет сохраненных игр</p>';
        } else {
            html += '<div style="max-height:400px; overflow-y:auto; margin:15px 0;">';
            
            games.forEach(game => {
                html += `
                    <div class="game-item" style="
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 10px;
                        background: ${game.isWin ? '#f0fff4' : '#fff5f5'};
                        border-left: 4px solid ${game.isWin ? '#48bb78' : '#f56565'};
                    ">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span style="font-weight:bold; color:#4a5568;">Игра #${game.id}</span>
                            <span style="color:#718096; font-size:0.9em;">${game.date} ${game.time}</span>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; margin-bottom:10px;">
                            <div style="background:#edf2f7; padding:5px; border-radius:4px;">
                                <strong>Игрок:</strong> ${game.playerName}
                            </div>
                            <div style="background:#${game.isWin ? 'c6f6d5' : 'fed7d7'}; padding:5px; border-radius:4px;">
                                <strong>Результат:</strong> ${game.isWin ? '🎉 Победа' : '💫 Поражение'}
                            </div>
                            <div style="background:#e9d8fd; padding:5px; border-radius:4px;">
                                <strong>Попыток:</strong> ${game.totalAttempts}
                            </div>
                            <div style="background:#bee3f8; padding:5px; border-radius:4px;">
                                <strong>Число:</strong> ${game.secretNumber}
                            </div>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button onclick="window.app.replayGame(${game.id})" style="
                                background: #4299e1;
                                color: white;
                                border: none;
                                padding: 8px 15px;
                                border-radius: 6px;
                                cursor: pointer;
                                flex: 1;
                            ">
                                🔄 Воспроизвести
                            </button>
                            <button onclick="window.app.deleteGame(${game.id})" style="
                                background: #fc8181;
                                color: white;
                                border: none;
                                padding: 8px 15px;
                                border-radius: 6px;
                                cursor: pointer;
                            ">
                                🗑️ Удалить
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        this.showModal(html);
    }

    // Воспроизведение игры
    async replayGame(gameId) {
        try {
            const game = await this.db.getGameById(gameId);
            if (!game) {
                alert('Игра не найдена');
                return;
            }
            
            let message = `🎮 Воспроизведение игры #${gameId}\n\n`;
            message += `👤 Игрок: ${game.playerName}\n`;
            message += `🎯 Число: ${game.secretNumber}\n`;
            message += `📊 Результат: ${game.isWin ? 'Победа 🏆' : 'Поражение'}\n`;
            message += `🔢 Попыток: ${game.totalAttempts}\n`;
            message += `📅 Дата: ${game.date} ${game.time}\n\n`;
            message += '📝 Ход игры:\n';
            
            game.attempts.forEach(attempt => {
                const icon = attempt.result === 'win' ? '✅' : 
                           attempt.result === 'more' ? '📈' : '📉';
                message += `#${attempt.attemptNumber}: ${attempt.guess} ${icon} ${attempt.message}\n`;
            });
            
            alert(message);
            
        } catch (error) {
            console.error('Ошибка воспроизведения игры:', error);
            alert('Ошибка воспроизведения игры');
        }
    }

    // Удаление игры
    async deleteGame(gameId) {
        if (confirm(`Удалить игру #${gameId}?`)) {
            try {
                await this.db.deleteGame(gameId);
                await this.showGamesList(); // Обновляем список
                alert('Игра удалена');
            } catch (error) {
                console.error('Ошибка удаления игры:', error);
                alert('Ошибка удаления игры');
            }
        }
    }

    // Очистка базы данных
    async clearDatabase() {
        if (confirm('Удалить ВСЕ сохраненные игры? Это действие нельзя отменить.')) {
            try {
                await this.db.clearAllGames();
                alert('✅ Все игры удалены из базы данных');
                await this.showGamesList(); // Обновляем список
            } catch (error) {
                console.error('Ошибка очистки БД:', error);
                alert('Ошибка очистки базы данных');
            }
        }
    }

    // Экспорт базы данных
    async exportDatabase() {
        try {
            await this.db.exportData();
            alert('✅ Данные экспортированы в файл JSON');
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            alert('Ошибка экспорта данных');
        }
    }

    // Показать статистику
    async showDatabaseStats() {
        try {
            const stats = await this.db.getStats();
            const games = await this.db.getAllGames();
            
            let html = '<h3>📊 Статистика игр</h3>';
            
            // Общая статистика
            html += `
                <div style="background:#f7fafc; padding:20px; border-radius:10px; margin-bottom:20px;">
                    <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:15px;">
                        <div style="background:white; padding:15px; border-radius:8px; text-align:center;">
                            <div style="font-size:0.9em; color:#718096;">Всего игр</div>
                            <div style="font-size:2em; font-weight:bold; color:#4a5568;">${stats.totalGames}</div>
                        </div>
                        <div style="background:white; padding:15px; border-radius:8px; text-align:center;">
                            <div style="font-size:0.9em; color:#718096;">Побед</div>
                            <div style="font-size:2em; font-weight:bold; color:#48bb78;">${stats.totalWins}</div>
                        </div>
                        <div style="background:white; padding:15px; border-radius:8px; text-align:center;">
                            <div style="font-size:0.9em; color:#718096;">Поражений</div>
                            <div style="font-size:2em; font-weight:bold; color:#f56565;">${stats.totalLosses}</div>
                        </div>
                        <div style="background:white; padding:15px; border-radius:8px; text-align:center;">
                            <div style="font-size:0.9em; color:#718096;">Процент побед</div>
                            <div style="font-size:2em; font-weight:bold; color:#667eea;">${stats.winRate}</div>
                        </div>
                    </div>
                    <div style="text-align:center; margin-top:15px; padding:15px; background:white; border-radius:8px;">
                        <div style="font-size:0.9em; color:#718096;">Лучший результат (минимальное число попыток)</div>
                        <div style="font-size:1.5em; font-weight:bold; color:#ed8936;">
                            ${stats.bestScore || 'Нет побед'}
                        </div>
                    </div>
                </div>
            `;
            
            // Статистика по игрокам
            if (games.length > 0) {
                const players = [...new Set(games.map(game => game.playerName))];
                
                html += '<h4>📈 Статистика по игрокам</h4>';
                html += '<div style="max-height:300px; overflow-y:auto;">';
                
                players.forEach(player => {
                    const playerGames = games.filter(game => game.playerName === player);
                    const playerWins = playerGames.filter(game => game.isWin).length;
                    const playerWinRate = playerGames.length > 0 ? 
                        ((playerWins / playerGames.length) * 100).toFixed(1) + '%' : '0%';
                    
                    html += `
                        <div style="
                            border: 1px solid #e2e8f0;
                            border-radius: 8px;
                            padding: 15px;
                            margin-bottom: 10px;
                            background: white;
                        ">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <span style="font-weight:bold; color:#4a5568;">👤 ${player}</span>
                                <span style="color:#718096; font-size:0.9em;">Игр: ${playerGames.length}</span>
                            </div>
                            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
                                <div style="text-align:center;">
                                    <div style="font-size:0.8em; color:#718096;">Побед</div>
                                    <div style="font-size:1.2em; font-weight:bold; color:#48bb78;">${playerWins}</div>
                                </div>
                                <div style="text-align:center;">
                                    <div style="font-size:0.8em; color:#718096;">Поражений</div>
                                    <div style="font-size:1.2em; font-weight:bold; color:#f56565;">${playerGames.length - playerWins}</div>
                                </div>
                                <div style="text-align:center;">
                                    <div style="font-size:0.8em; color:#718096;">Процент побед</div>
                                    <div style="font-size:1.2em; font-weight:bold; color:#667eea;">${playerWinRate}</div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
            this.showModal(html);
            
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
            alert('Ошибка загрузки статистики');
        }
    }

    // Показать модальное окно
    showModal(content) {
        // Удаляем старое модальное окно
        const oldModal = document.getElementById('database-modal');
        if (oldModal) {
            oldModal.remove();
        }
        
        // Создаем новое модальное окно
        const modal = document.createElement('div');
        modal.id = 'database-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white;
            padding: 25px;
            border-radius: 12px;
            max-width: 700px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        `;
        
        // Кнопка закрытия
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
            position: absolute;
            right: 20px;
            top: 15px;
            font-size: 28px;
            font-weight: bold;
            color: #aaa;
            cursor: pointer;
        `;
        closeButton.onclick = () => {
            document.body.removeChild(modal);
        };
        
        modalContent.appendChild(closeButton);
        modalContent.innerHTML += content;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Закрытие по клику вне окна
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Обработчик начала игры
    handleStartGame() {
        const playerName = this.ui.elements.playerName.value.trim() || 'Игрок';
        
        if (playerName.length === 0) {
            alert('Пожалуйста, введите ваше имя');
            return;
        }

        // Начинаем новую игру
        const gameInfo = this.game.startNewGame(playerName);
        
        // Обновляем UI
        this.ui.updateGameInfo(this.game.getGameStats());
        this.ui.clearInputs();
        this.ui.showScreen('game');
        this.ui.focusGuessInput();
        this.ui.setGameControlsEnabled(true);

        console.log(`🎮 Начата новая игра для: ${playerName}`);
    }

    // Обработчик отправки попытки
    async handleSubmitGuess() {
        const guessInput = this.ui.elements.guessInput;
        const guess = guessInput.value.trim();

        if (!guess) {
            alert('Пожалуйста, введите число');
            return;
        }

        try {
            // Делаем попытку угадать
            const attempt = this.game.makeGuess(guess);
            
            // Обновляем UI
            this.ui.updateGameInfo(this.game.getGameStats());
            this.ui.showFeedback(attempt);
            this.ui.updateAttemptsHistory(this.game.getAttemptsHistory());
            
            // Очищаем поле ввода
            guessInput.value = '';
            this.ui.focusGuessInput();

            // Если игра окончена
            if (attempt.result === 'win' || attempt.gameOver) {
                this.ui.setGameControlsEnabled(false);
                
                // Сохраняем игру в БД
                const gameStats = this.game.getGameStats();
                const gameData = {
                    playerName: gameStats.playerName,
                    secretNumber: gameStats.secretNumber,
                    attempts: gameStats.attempts,
                    totalAttempts: gameStats.currentAttempt,
                    isWin: attempt.result === 'win',
                    maxAttempts: gameStats.maxAttempts
                };
                
                try {
                    await this.db.saveGame(gameData);
                    console.log('💾 Игра сохранена в БД');
                } catch (error) {
                    console.error('❌ Ошибка сохранения в БД:', error);
                }
                
                // Показываем экран победы
                if (attempt.result === 'win') {
                    setTimeout(() => {
                        this.ui.showWinScreen(this.game.secretNumber, attempt.attemptNumber);
                    }, 1500);
                }
            }

        } catch (error) {
            alert(error.message);
            this.ui.focusGuessInput();
        }
    }

    // Обработчик новой игры
    handleNewGame() {
        this.game.resetGame();
        this.ui.updateAttemptsHistory([]);
        this.ui.elements.feedbackMessage.textContent = '';
        this.ui.elements.feedbackMessage.className = 'feedback';
        this.ui.showScreen('start');
        this.ui.clearInputs();
        this.ui.elements.playerName.value = 'Игрок';
        this.ui.elements.playerName.focus();
        
        console.log('🔄 Игра сброшена, возврат к стартовому экрану');
    }

    // Обработчик показа статистики
    async handleShowStats() {
        try {
            const gameHistory = await this.db.getAllGames();
            const overallStats = await this.db.getStats();
            
            // Используем встроенный метод UI для отображения статистики
            this.ui.showStats(gameHistory, overallStats);
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
            this.ui.showStats();
        }
    }

    // Обработчик возврата к игре
    handleBackToGame() {
        this.ui.showScreen('game');
        this.ui.focusGuessInput();
    }

    // Обработчик "играть снова"
    handlePlayAgain() {
        const currentPlayer = this.game.playerName;
        
        // Начинаем новую игру с тем же игроком
        this.game.resetGame();
        this.game.startNewGame(currentPlayer);
        
        // Обновляем UI
        this.ui.updateGameInfo(this.game.getGameStats());
        this.ui.updateAttemptsHistory([]);
        this.ui.elements.feedbackMessage.textContent = '';
        this.ui.elements.feedbackMessage.className = 'feedback';
        this.ui.clearInputs();
        this.ui.showScreen('game');
        this.ui.setGameControlsEnabled(true);
        this.ui.focusGuessInput();

        console.log(`🔄 Новая игра для: ${currentPlayer}`);
    }

    // Получить отладочную информацию
    getDebugInfo() {
        return {
            game: this.game.getGameStats(),
            secretNumber: this.game.getHint()
        };
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Создаем экземпляр приложения
    window.app = new GuessNumberApp();
    
    // Добавляем глобальные функции для отладки
    window.getGameInfo = () => window.app.getDebugInfo();
    window.showHint = () => {
        const hint = window.app.game.getHint();
        console.log(`🔍 Подсказка: загаданное число ${hint}`);
        return hint;
    };
    
    console.log('✅ Приложение "Угадай число" успешно загружено!');
    console.log('💡 Для отладки используйте: getGameInfo() или showHint()');
    console.log('🗄️ База данных IndexedDB подключена');
});

// Добавляем обработчик ошибок
window.addEventListener('error', (event) => {
    console.error('❌ Ошибка приложения:', event.error);
});

// Обработчик перед закрытием страницы
window.addEventListener('beforeunload', (event) => {
    if (window.app && window.app.game.isGameActive) {
        event.preventDefault();
        event.returnValue = 'У вас есть незавершенная игра. Вы уверены, что хотите уйти?';
        return event.returnValue;
    }
});