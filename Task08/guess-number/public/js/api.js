// API клиент для работы с сервером
class GameAPI {
    constructor(baseUrl = 'http://localhost:3000/api') {
        this.baseUrl = baseUrl;
    }
    
    // Создание новой игры
    async createGame(playerName, secretNumber, maxAttempts = 10) {
        try {
            const response = await fetch(`${this.baseUrl}/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_name: playerName,
                    secret_number: secretNumber,
                    max_attempts: maxAttempts
                })
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            return data.id;
        } catch (error) {
            console.error('Ошибка создания игры:', error);
            throw error;
        }
    }
    
    // Получение всех игр
    async getAllGames() {
        try {
            const response = await fetch(`${this.baseUrl}/games`);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка получения игр:', error);
            throw error;
        }
    }
    
    // Получение игры по ID
    async getGame(gameId) {
        try {
            const response = await fetch(`${this.baseUrl}/games/${gameId}`);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Ошибка получения игры ${gameId}:`, error);
            throw error;
        }
    }
    
    // Добавление попытки
    async addAttempt(gameId, attemptNumber, guess, result, message, gameFinished = false, isWin = false, totalAttempts = 0) {
        try {
            const response = await fetch(`${this.baseUrl}/step/${gameId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    attempt_number: attemptNumber,
                    guess: guess,
                    result: result,
                    message: message,
                    game_finished: gameFinished,
                    is_win: isWin,
                    total_attempts: totalAttempts
                })
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            return data.id;
        } catch (error) {
            console.error('Ошибка добавления попытки:', error);
            throw error;
        }
    }
    
    // Удаление игры
    async deleteGame(gameId) {
        try {
            const response = await fetch(`${this.baseUrl}/games/${gameId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Ошибка удаления игры ${gameId}:`, error);
            throw error;
        }
    }
    
    // Получение статистики
    async getStats() {
        try {
            const response = await fetch(`${this.baseUrl}/stats`);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            throw error;
        }
    }
    
    // Экспорт данных
    async exportData() {
        try {
            const games = await this.getAllGames();
            
            // Для каждой игры получаем полные данные с попытками
            const gamesWithAttempts = await Promise.all(
                games.map(async (game) => {
                    const fullGame = await this.getGame(game.id);
                    return fullGame;
                })
            );
            
            const data = {
                exportDate: new Date().toISOString(),
                totalGames: gamesWithAttempts.length,
                games: gamesWithAttempts
            };
            
            // Создаем и скачиваем файл
            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `guess-number-games-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return data;
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            throw error;
        }
    }
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameAPI;
}