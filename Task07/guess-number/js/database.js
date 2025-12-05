// Модуль для работы с IndexedDB
class GameDatabase {
    constructor() {
        this.dbName = 'GuessNumberDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    // Инициализация базы данных
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Ошибка IndexedDB:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('База данных открыта');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Создаем хранилище для игр
                if (!db.objectStoreNames.contains('games')) {
                    const store = db.createObjectStore('games', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    
                    // Создаем индексы
                    store.createIndex('playerName', 'playerName', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('isWin', 'isWin', { unique: false });
                }
            };
        });
    }

    // Сохранение игры
    async saveGame(gameData) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['games'], 'readwrite');
            const store = transaction.objectStore('games');
            
            const gameRecord = {
                ...gameData,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('ru-RU'),
                time: new Date().toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })
            };

            const request = store.add(gameRecord);

            request.onsuccess = () => {
                console.log('Игра сохранена, ID:', request.result);
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('Ошибка сохранения:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Получение всех игр
    async getAllGames() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['games'], 'readonly');
            const store = transaction.objectStore('games');
            const request = store.getAll();

            request.onsuccess = () => {
                // Сортируем по дате (новые сначала)
                const games = request.result.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                resolve(games);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Удаление игры по ID
    async deleteGame(gameId) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['games'], 'readwrite');
            const store = transaction.objectStore('games');
            const request = store.delete(gameId);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Удаление всех игр
    async clearAllGames() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['games'], 'readwrite');
            const store = transaction.objectStore('games');
            const request = store.clear();

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Получение статистики
    async getStats() {
        const games = await this.getAllGames();
        
        if (games.length === 0) {
            return {
                totalGames: 0,
                totalWins: 0,
                totalLosses: 0,
                winRate: '0%',
                bestScore: 0
            };
        }

        const totalGames = games.length;
        const totalWins = games.filter(game => game.isWin).length;
        const totalLosses = totalGames - totalWins;
        const winRate = ((totalWins / totalGames) * 100).toFixed(1) + '%';
        
        const winningGames = games.filter(game => game.isWin);
        const bestScore = winningGames.length > 0 
            ? Math.min(...winningGames.map(game => game.totalAttempts))
            : 0;

        return {
            totalGames,
            totalWins,
            totalLosses,
            winRate,
            bestScore
        };
    }

    // Экспорт данных
    async exportData() {
        const games = await this.getAllGames();
        
        const data = {
            exportDate: new Date().toISOString(),
            totalGames: games.length,
            games: games
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
    }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameDatabase;
}