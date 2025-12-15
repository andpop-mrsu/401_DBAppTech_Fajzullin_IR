// Модуль игровой логики
class Game {
    constructor() {
        this.secretNumber = 0;
        this.attempts = [];
        this.maxAttempts = 10;
        this.playerName = 'Игрок';
        this.isGameActive = false;
        this.currentGameId = null; // ID игры на сервере
    }

    // Начать новую игру
    startNewGame(playerName = 'Игрок') {
        this.secretNumber = this.generateSecretNumber();
        this.attempts = [];
        this.playerName = playerName;
        this.isGameActive = true;
        this.currentGameId = null; // Сбрасываем ID при новой игре
        
        console.log(`Новая игра для ${playerName}. Загаданное число: ${this.secretNumber}`);
        return {
            secretNumber: this.secretNumber,
            playerName: this.playerName,
            maxAttempts: this.maxAttempts,
            currentGameId: this.currentGameId
        };
    }

    // Сгенерировать случайное число
    generateSecretNumber() {
        return Math.floor(Math.random() * 100) + 1;
    }

    // Сделать попытку угадать число
    makeGuess(guess) {
        if (!this.isGameActive) {
            throw new Error('Игра не активна');
        }

        const guessNumber = parseInt(guess);
        
        if (isNaN(guessNumber) || guessNumber < 1 || guessNumber > 100) {
            throw new Error('Пожалуйста, введите число от 1 до 100');
        }

        const attemptNumber = this.attempts.length + 1;
        let result, message;

        if (guessNumber < this.secretNumber) {
            result = 'more';
            message = 'Загаданное число БОЛЬШЕ';
        } else if (guessNumber > this.secretNumber) {
            result = 'less';
            message = 'Загаданное число МЕНЬШЕ';
        } else {
            result = 'win';
            message = 'Поздравляем! Вы угадали число!';
            this.isGameActive = false;
        }

        // Сохраняем попытку
        const attempt = {
            attemptNumber: attemptNumber,
            guess: guessNumber,
            result: result,
            message: message,
            timestamp: new Date().toISOString()
        };

        this.attempts.push(attempt);

        // Проверяем превышение лимита попыток
        if (attemptNumber >= this.maxAttempts && result !== 'win') {
            this.isGameActive = false;
            return {
                ...attempt,
                gameOver: true,
                finalMessage: `Игра окончена! Загаданное число было: ${this.secretNumber}`
            };
        }

        return attempt;
    }

    // Сохранить игру в историю
    saveGameToHistory(isWin, attemptsCount) {
        const gameRecord = {
            playerName: this.playerName,
            secretNumber: this.secretNumber,
            attempts: [...this.attempts], // Копируем массив попыток
            totalAttempts: attemptsCount,
            isWin: isWin,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('ru-RU')
        };

        // Локальная история (если нужно)
        let gameHistory = JSON.parse(localStorage.getItem('gameHistory') || '[]');
        gameHistory.unshift(gameRecord);
        
        // Ограничиваем историю последними 10 играми
        if (gameHistory.length > 10) {
            gameHistory = gameHistory.slice(0, 10);
        }
        
        localStorage.setItem('gameHistory', JSON.stringify(gameHistory));

        console.log('💾 Игра сохранена в локальную историю:', gameRecord);
        return gameRecord;
    }

    // Получить историю игр (локальную)
    getGameHistory() {
        return JSON.parse(localStorage.getItem('gameHistory') || '[]');
    }

    // Получить текущую статистику игры
    getGameStats() {
        return {
            playerName: this.playerName,
            secretNumber: this.secretNumber,
            attempts: this.attempts,
            currentAttempt: this.attempts.length,
            maxAttempts: this.maxAttempts,
            isGameActive: this.isGameActive,
            isGameWon: this.attempts.some(attempt => attempt.result === 'win'),
            currentGameId: this.currentGameId // Добавляем ID игры
        };
    }

    // Получить историю попыток текущей игры
    getAttemptsHistory() {
        return this.attempts.map(attempt => ({
            number: attempt.attemptNumber,
            guess: attempt.guess,
            result: attempt.result,
            message: attempt.message
        }));
    }

    // Установить ID игры с сервера
    setCurrentGameId(gameId) {
        this.currentGameId = gameId;
        console.log(`Установлен ID игры с сервера: ${gameId}`);
    }

    // Получить подсказку (для отладки)
    getHint() {
        return this.secretNumber;
    }

    // Сбросить игру
    resetGame() {
        this.secretNumber = 0;
        this.attempts = [];
        this.isGameActive = false;
        this.currentGameId = null;
    }

    // Восстановить игру из данных сервера
    restoreFromServerData(gameData) {
        if (!gameData) {
            throw new Error('Нет данных для восстановления игры');
        }

        this.secretNumber = gameData.secret_number || gameData.secretNumber;
        this.playerName = gameData.player_name || gameData.playerName;
        this.currentGameId = gameData.id || gameData.currentGameId;
        this.isGameActive = false; // Восстановленные игры всегда завершены
        
        // Восстанавливаем попытки
        if (gameData.attempts && Array.isArray(gameData.attempts)) {
            this.attempts = gameData.attempts.map(attempt => ({
                attemptNumber: attempt.attempt_number || attempt.attemptNumber,
                guess: attempt.guess,
                result: attempt.result,
                message: attempt.message,
                timestamp: attempt.timestamp || new Date().toISOString()
            }));
        }

        console.log(`Игра восстановлена из серверных данных. ID: ${this.currentGameId}, Игрок: ${this.playerName}`);
        return this.getGameStats();
    }

    // Проверить, можно ли сделать еще попытку
    canMakeAttempt() {
        if (!this.isGameActive) return false;
        if (this.attempts.length >= this.maxAttempts) return false;
        return true;
    }

    // Получить информацию о последней попытке
    getLastAttempt() {
        if (this.attempts.length === 0) return null;
        return this.attempts[this.attempts.length - 1];
    }

    // Проверить, выиграна ли игра
    isGameWon() {
        return this.attempts.some(attempt => attempt.result === 'win');
    }

    // Получить количество оставшихся попыток
    getRemainingAttempts() {
        return this.maxAttempts - this.attempts.length;
    }

    // Получить подсказку на основе последней попытки
    getHintBasedOnLastAttempt() {
        const lastAttempt = this.getLastAttempt();
        if (!lastAttempt) {
            return 'Попробуйте число 50 (середина диапазона)';
        }

        if (lastAttempt.result === 'more') {
            return `Попробуйте число больше ${lastAttempt.guess}`;
        } else if (lastAttempt.result === 'less') {
            return `Попробуйте число меньше ${lastAttempt.guess}`;
        }

        return 'У вас еще не было попыток';
    }

    // Экспорт данных текущей игры
    exportCurrentGame() {
        const gameStats = this.getGameStats();
        return {
            ...gameStats,
            exportDate: new Date().toISOString(),
            attempts: this.attempts
        };
    }

    // Импорт данных игры
    importGameData(gameData) {
        if (!gameData || !gameData.playerName || !gameData.secretNumber) {
            throw new Error('Неверный формат данных игры');
        }

        this.playerName = gameData.playerName;
        this.secretNumber = gameData.secretNumber;
        this.currentGameId = gameData.currentGameId || null;
        this.isGameActive = gameData.isGameActive || false;
        this.maxAttempts = gameData.maxAttempts || 10;
        
        if (gameData.attempts && Array.isArray(gameData.attempts)) {
            this.attempts = gameData.attempts;
        } else {
            this.attempts = [];
        }

        console.log(`Игра импортирована. Игрок: ${this.playerName}, ID: ${this.currentGameId}`);
        return this.getGameStats();
    }
}

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}