// Главный модуль приложения
class GuessNumberApp {
    constructor() {
        this.game = new Game();
        this.ui = new GameUI();
        this.api = new GameAPI(); // Используем API вместо локальной БД
        
        this.init();
    }

    // Инициализация приложения
    async init() {
        console.log('🚀 Инициализация SPA приложения "Угадай число"');
        
        // Устанавливаем обработчики событий
        this.setupEventHandlers();
        
        // Показываем стартовый экран
        this.ui.showScreen('start');
        this.ui.focusGuessInput();
        
        // Проверяем подключение к API
        await this.testAPIConnection();
    }

    // Тестирование подключения к API
    async testAPIConnection() {
        try {
            // Простой тест без реального запроса
            console.log('✅ API проверка пропущена (Slim в разработке)');
            return;
            
            /* Закомментируйте старый код:
            const games = await this.api.getAllGames();
            console.log('✅ API подключено. Сохраненных игр:', games.length);
            */
        } catch (error) {
            console.warn('⚠️ API недоступно. Игра будет работать в offline режиме.');
            this.showNotification('API сервер недоступен. Данные не будут сохраняться.', 'warning');
        }
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
        
        // Обработчики для работы с API
        this.setupAPIHandlers();
    }

    // Настройка обработчиков для работы с API
    setupAPIHandlers() {
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

    // Обработчик начала игры
    async handleStartGame() {
        const playerName = this.ui.elements.playerName.value.trim() || 'Игрок';
        
        if (playerName.length === 0) {
            this.showNotification('Пожалуйста, введите ваше имя', 'error');
            return;
        }

        // Генерируем секретное число
        const secretNumber = this.game.generateSecretNumber();
        
        try {
            // Создаем игру на сервере
            const gameId = await this.api.createGame(playerName, secretNumber, 10);
            
            // Начинаем игру локально
            const gameInfo = this.game.startNewGame(playerName);
            this.game.secretNumber = secretNumber;
            this.game.currentGameId = gameId; // Сохраняем ID игры с сервера
            
            // Обновляем UI
            this.ui.updateGameInfo(this.game.getGameStats());
            this.ui.clearInputs();
            this.ui.showScreen('game');
            this.ui.focusGuessInput();
            this.ui.setGameControlsEnabled(true);

            console.log(`🎮 Начата новая игра (ID: ${gameId}) для: ${playerName}`);
            this.showNotification('Игра начата. Данные сохраняются на сервере.', 'success');
            
        } catch (error) {
            console.error('Ошибка создания игры на сервере:', error);
            
            // Если сервер недоступен, начинаем игру локально
            this.showNotification('Сервер недоступен. Игра будет сохранена локально.', 'warning');
            
            const gameInfo = this.game.startNewGame(playerName);
            this.ui.updateGameInfo(this.game.getGameStats());
            this.ui.clearInputs();
            this.ui.showScreen('game');
            this.ui.focusGuessInput();
            this.ui.setGameControlsEnabled(true);
        }
    }

    // Обработчик отправки попытки
    async handleSubmitGuess() {
        const guessInput = this.ui.elements.guessInput;
        const guess = guessInput.value.trim();

        if (!guess) {
            this.showNotification('Пожалуйста, введите число', 'error');
            return;
        }

        try {
            // Делаем попытку угадать локально
            const attempt = this.game.makeGuess(guess);
            
            // Обновляем UI
            this.ui.updateGameInfo(this.game.getGameStats());
            this.ui.showFeedback(attempt);
            this.ui.updateAttemptsHistory(this.game.getAttemptsHistory());
            
            // Очищаем поле ввода
            guessInput.value = '';
            this.ui.focusGuessInput();

            // Сохраняем попытку на сервере
            if (this.game.currentGameId) {
                try {
                    await this.api.addAttempt(
                        this.game.currentGameId,
                        attempt.attemptNumber,
                        attempt.guess,
                        attempt.result,
                        attempt.message,
                        attempt.result === 'win' || attempt.gameOver,
                        attempt.result === 'win',
                        attempt.attemptNumber
                    );
                    
                    console.log('Попытка сохранена на сервере');
                } catch (apiError) {
                    console.warn('Не удалось сохранить попытку на сервере:', apiError);
                }
            }

            // Если игра окончена
            if (attempt.result === 'win' || attempt.gameOver) {
                this.ui.setGameControlsEnabled(false);
                
                // Показываем экран победы или поражения
                setTimeout(() => {
                    if (attempt.result === 'win') {
                        this.ui.showWinScreen(this.game.secretNumber, attempt.attemptNumber);
                    } else {
                        // Просто показываем сообщение о поражении
                        this.ui.showFeedback({
                            ...attempt,
                            message: attempt.finalMessage || `Игра окончена! Загаданное число было: ${this.game.secretNumber}`
                        });
                        
                        // Через 3 секунды автоматически перезапускаем
                        setTimeout(() => {
                            this.handleNewGame();
                        }, 3000);
                    }
                }, 1500);
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
            this.ui.focusGuessInput();
        }
    }

    // Показать список игр
    async showGamesList() {
        try {
            const games = await this.api.getAllGames();
            this.renderGamesList(games);
        } catch (error) {
            console.error('Ошибка загрузки игр:', error);
            this.showNotification('Ошибка загрузки списка игр. Проверьте подключение к серверу.', 'error');
        }
    }

    // Отрисовка списка игр
    renderGamesList(games) {
        let html = '<h3>📋 Список сохраненных игр (с сервера)</h3>';
        
        if (games.length === 0) {
            html += '<p style="text-align:center; color:#666; padding:20px;">Нет сохраненных игр</p>';
        } else {
            html += '<div style="max-height:400px; overflow-y:auto; margin:15px 0;">';
            
            games.forEach(game => {
                const isWin = game.is_win == 1;
                const date = new Date(game.created_at).toLocaleString('ru-RU');
                
                html += `
                    <div class="game-item" style="
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 10px;
                        background: ${isWin ? '#f0fff4' : '#fff5f5'};
                        border-left: 4px solid ${isWin ? '#48bb78' : '#f56565'};
                    ">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span style="font-weight:bold; color:#4a5568;">Игра #${game.id}</span>
                            <span style="color:#718096; font-size:0.9em;">${date}</span>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; margin-bottom:10px;">
                            <div style="background:#edf2f7; padding:5px; border-radius:4px;">
                                <strong>Игрок:</strong> ${game.player_name}
                            </div>
                            <div style="background:#${isWin ? 'c6f6d5' : 'fed7d7'}; padding:5px; border-radius:4px;">
                                <strong>Результат:</strong> ${isWin ? '🎉 Победа' : '💫 Поражение'}
                            </div>
                            <div style="background:#e9d8fd; padding:5px; border-radius:4px;">
                                <strong>Попыток:</strong> ${game.total_attempts || '0'}
                            </div>
                            <div style="background:#bee3f8; padding:5px; border-radius:4px;">
                                <strong>Число:</strong> ${game.secret_number}
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
            const game = await this.api.getGame(gameId);
            if (!game) {
                this.showNotification('Игра не найдена', 'error');
                return;
            }
            
            let message = `🎮 Воспроизведение игры #${gameId}\n\n`;
            message += `👤 Игрок: ${game.player_name}\n`;
            message += `🎯 Число: ${game.secret_number}\n`;
            message += `📊 Результат: ${game.is_win == 1 ? 'Победа 🏆' : 'Поражение'}\n`;
            message += `🔢 Попыток: ${game.total_attempts || '0'}\n`;
            message += `📅 Дата: ${new Date(game.created_at).toLocaleString('ru-RU')}\n\n`;
            
            if (game.attempts && game.attempts.length > 0) {
                message += '📝 Ход игры:\n';
                game.attempts.forEach(attempt => {
                    const icon = attempt.result === 'win' ? '✅' : 
                               attempt.result === 'more' ? '📈' : '📉';
                    message += `#${attempt.attempt_number}: ${attempt.guess} ${icon} ${attempt.message}\n`;
                });
            } else {
                message += '📝 Нет данных о ходе игры\n';
            }
            
            alert(message);
            
        } catch (error) {
            console.error('Ошибка воспроизведения игры:', error);
            this.showNotification('Ошибка воспроизведения игры', 'error');
        }
    }

    // Удаление игры
    async deleteGame(gameId) {
        if (confirm(`Удалить игру #${gameId} с сервера?`)) {
            try {
                await this.api.deleteGame(gameId);
                await this.showGamesList(); // Обновляем список
                this.showNotification('Игра удалена с сервера', 'success');
            } catch (error) {
                console.error('Ошибка удаления игры:', error);
                this.showNotification('Ошибка удаления игры', 'error');
            }
        }
    }

    // Очистка базы данных
    async clearDatabase() {
        if (confirm('Удалить ВСЕ игры с сервера? Это действие нельзя отменить.')) {
            try {
                const games = await this.api.getAllGames();
                
                // Удаляем все игры по одной
                for (const game of games) {
                    await this.api.deleteGame(game.id);
                }
                
                this.showNotification('Все игры удалены с сервера', 'success');
                await this.showGamesList(); // Обновляем список
            } catch (error) {
                console.error('Ошибка очистки БД:', error);
                this.showNotification('Ошибка очистки базы данных', 'error');
            }
        }
    }

    // Экспорт базы данных
    async exportDatabase() {
        try {
            await this.api.exportData();
            this.showNotification('Данные экспортированы в файл JSON', 'success');
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            this.showNotification('Ошибка экспорта данных', 'error');
        }
    }

    // Показать статистику
    async showDatabaseStats() {
        try {
            const stats = await this.api.getStats();
            
            let html = '<h3>📊 Статистика игр (с сервера)</h3>';
            
            // Общая статистика
            if (stats.overall) {
                const overall = stats.overall;
                html += `
                    <div style="background:#f7fafc; padding:20px; border-radius:10px; margin-bottom:20px;">
                        <h4>Общая статистика</h4>
                        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:15px;">
                            <div style="background:white; padding:15px; border-radius:8px; text-align:center;">
                                <div style="font-size:0.9em; color:#718096;">Всего игр</div>
                                <div style="font-size:2em; font-weight:bold; color:#4a5568;">${overall.total_games || 0}</div>
                            </div>
                            <div style="background:white; padding:15px; border-radius:8px; text-align:center;">
                                <div style="font-size:0.9em; color:#718096;">Побед</div>
                                <div style="font-size:2em; font-weight:bold; color:#48bb78;">${overall.wins || 0}</div>
                            </div>
                            <div style="background:white; padding:15px; border-radius:8px; text-align:center;">
                                <div style="font-size:0.9em; color:#718096;">Поражений</div>
                                <div style="font-size:2em; font-weight:bold; color:#f56565;">${(overall.total_games || 0) - (overall.wins || 0)}</div>
                            </div>
                            <div style="background:white; padding:15px; border-radius:8px; text-align:center;">
                                <div style="font-size:0.9em; color:#718096;">Среднее попыток</div>
                                <div style="font-size:2em; font-weight:bold; color:#667eea;">${overall.avg_attempts ? overall.avg_attempts.toFixed(1) : '0.0'}</div>
                            </div>
                        </div>
                        <div style="text-align:center; margin-top:15px; padding:15px; background:white; border-radius:8px;">
                            <div style="font-size:0.9em; color:#718096;">Лучший результат</div>
                            <div style="font-size:1.5em; font-weight:bold; color:#ed8936;">
                                ${overall.best_score || 'Нет побед'}
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Статистика по игрокам
            if (stats.players && stats.players.length > 0) {
                html += '<h4>📈 Статистика по игрокам</h4>';
                html += '<div style="max-height:300px; overflow-y:auto;">';
                
                stats.players.forEach(player => {
                    const winRate = player.games_played > 0 ? 
                        ((player.wins / player.games_played) * 100).toFixed(1) + '%' : '0%';
                    
                    html += `
                        <div style="
                            border: 1px solid #e2e8f0;
                            border-radius: 8px;
                            padding: 15px;
                            margin-bottom: 10px;
                            background: white;
                        ">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <span style="font-weight:bold; color:#4a5568;">👤 ${player.player_name}</span>
                                <span style="color:#718096; font-size:0.9em;">Игр: ${player.games_played}</span>
                            </div>
                            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px;">
                                <div style="text-align:center;">
                                    <div style="font-size:0.8em; color:#718096;">Побед</div>
                                    <div style="font-size:1.2em; font-weight:bold; color:#48bb78;">${player.wins || 0}</div>
                                </div>
                                <div style="text-align:center;">
                                    <div style="font-size:0.8em; color:#718096;">Поражений</div>
                                    <div style="font-size:1.2em; font-weight:bold; color:#f56565;">${player.games_played - (player.wins || 0)}</div>
                                </div>
                                <div style="text-align:center;">
                                    <div style="font-size:0.8em; color:#718096;">Процент побед</div>
                                    <div style="font-size:1.2em; font-weight:bold; color:#667eea;">${winRate}</div>
                                </div>
                                <div style="text-align:center;">
                                    <div style="font-size:0.8em; color:#718096;">Лучший результат</div>
                                    <div style="font-size:1.2em; font-weight:bold; color:#ed8936;">${player.best_score || 'Нет'}</div>
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
            this.showNotification('Ошибка загрузки статистики', 'error');
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

    // Показать уведомление
    showNotification(message, type = 'info') {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        
        // Цвета в зависимости от типа
        if (type === 'success') {
            notification.style.background = '#48bb78';
        } else if (type === 'error') {
            notification.style.background = '#f56565';
        } else if (type === 'warning') {
            notification.style.background = '#ed8936';
        } else {
            notification.style.background = '#4299e1';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
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
            const stats = await this.api.getStats();
            
            // Используем встроенный метод UI для отображения статистики
            this.ui.showStats(stats.games || [], stats.overall);
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
            secretNumber: this.game.getHint(),
            currentGameId: this.game.currentGameId
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
    
    console.log('✅ SPA приложение "Угадай число" успешно загружено!');
    console.log('🌐 API: http://localhost:3000/api');
    console.log('💡 Для отладки используйте: getGameInfo() или showHint()');
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