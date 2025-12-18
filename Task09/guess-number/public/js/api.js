// public/js/api.js - Клиентский JavaScript для работы с API

class GameAPI {
    constructor(baseUrl = 'http://localhost:8000/api') {
        this.baseUrl = baseUrl;
        this.timeout = 5000; // 5 секунд таймаут
    }

    // Проверка подключения к API
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(this.timeout)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return { 
                success: true, 
                data,
                message: 'API подключено успешно' 
            };
        } catch (error) {
            console.error('API недоступно:', error);
            return { 
                success: false, 
                error: error.message,
                message: 'API недоступно. Используется локальный режим.' 
            };
        }
    }

    // Создать новую игру
    async createGame(playerName, secretNumber, maxAttempts = 10) {
        try {
            const response = await fetch(`${this.baseUrl}/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    player_name: playerName,
                    secret_number: secretNumber,
                    max_attempts: maxAttempts
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка создания игры:', error);
            // Локальное хранение при недоступности API
            return this.createLocalGame(playerName, secretNumber, maxAttempts);
        }
    }

    // Добавить попытку
    async addAttempt(gameId, attemptData) {
        try {
            const response = await fetch(`${this.baseUrl}/step/${gameId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(attemptData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка добавления попытки:', error);
            // Локальное хранение при недоступности API
            return this.addLocalAttempt(gameId, attemptData);
        }
    }

    // Получить статистику
    async getStats() {
        try {
            const response = await fetch(`${this.baseUrl}/stats`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            return this.getLocalStats();
        }
    }

    // Получить все игры
    async getAllGames() {
        try {
            const response = await fetch(`${this.baseUrl}/games`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка получения игр:', error);
            return this.getLocalGames();
        }
    }

    // Удалить игру
    async deleteGame(gameId) {
        try {
            const response = await fetch(`${this.baseUrl}/games/${gameId}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка удаления игры:', error);
            return this.deleteLocalGame(gameId);
        }
    }

    // ========== ЛОКАЛЬНЫЕ МЕТОДЫ (при недоступности API) ==========

    createLocalGame(playerName, secretNumber, maxAttempts) {
        const gameId = Date.now(); // Используем timestamp как ID
        const game = {
            id: gameId,
            player_name: playerName,
            secret_number: secretNumber,
            max_attempts: maxAttempts,
            is_win: false,
            total_attempts: 0,
            created_at: new Date().toISOString()
        };

        // Сохраняем в localStorage
        const games = this.getLocalGames();
        games.push(game);
        localStorage.setItem('guess_number_games', JSON.stringify(games));

        return { id: gameId };
    }

    addLocalAttempt(gameId, attemptData) {
        const attempts = JSON.parse(localStorage.getItem(`game_${gameId}_attempts`) || '[]');
        attempts.push({
            ...attemptData,
            id: Date.now(),
            created_at: new Date().toISOString()
        });
        
        localStorage.setItem(`game_${gameId}_attempts`, JSON.stringify(attempts));

        // Обновляем игру если завершена
        if (attemptData.game_finished) {
            const games = this.getLocalGames();
            const gameIndex = games.findIndex(g => g.id == gameId);
            if (gameIndex !== -1) {
                games[gameIndex].is_win = attemptData.is_win;
                games[gameIndex].total_attempts = attemptData.total_attempts;
                games[gameIndex].finished_at = new Date().toISOString();
                localStorage.setItem('guess_number_games', JSON.stringify(games));
            }
        }

        return { id: Date.now() };
    }

    getLocalStats() {
        const games = this.getLocalGames();
        const totalGames = games.length;
        const wins = games.filter(g => g.is_win).length;
        const avgAttempts = totalGames > 0 
            ? games.reduce((sum, g) => sum + (g.total_attempts || 0), 0) / totalGames 
            : 0;

        // Статистика по игрокам
        const playerStats = {};
        games.forEach(game => {
            if (!playerStats[game.player_name]) {
                playerStats[game.player_name] = { games_played: 0, wins: 0 };
            }
            playerStats[game.player_name].games_played++;
            if (game.is_win) playerStats[game.player_name].wins++;
        });

        const players = Object.entries(playerStats).map(([name, stats]) => ({
            player_name: name,
            ...stats
        })).sort((a, b) => b.games_played - a.games_played);

        return {
            overall: {
                total_games: totalGames,
                wins: wins,
                avg_attempts: avgAttempts.toFixed(1)
            },
            players: players
        };
    }

    getLocalGames() {
        return JSON.parse(localStorage.getItem('guess_number_games') || '[]');
    }

    deleteLocalGame(gameId) {
        let games = this.getLocalGames();
        games = games.filter(g => g.id != gameId);
        localStorage.setItem('guess_number_games', JSON.stringify(games));
        
        // Удаляем попытки игры
        localStorage.removeItem(`game_${gameId}_attempts`);
        
        return { success: true };
    }
}

// Экспорт класса
if (typeof window !== 'undefined') {
    window.GameAPI = GameAPI;
}