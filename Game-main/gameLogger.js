class GameLogger {
    constructor() {
        this.sessionStartTime = null;
        this.gameStartTime = null;
        this.totalPlayTime = 0;
        this.sessionStats = {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            timeouts: 0,
            totalPlayTime: 0,
            averageGameTime: 0
        };
        
        // Load existing stats from localStorage
        this.loadStats();
        
        // Start session timer
        this.startSession();
    }
    
    startSession() {
        this.sessionStartTime = Date.now();
        console.log('🎮 Game session started');
    }
    
    startGame() {
        this.gameStartTime = Date.now();
        console.log('⏱️ Game timer started');
    }
    
    endGame(result, reason = '') {
        if (!this.gameStartTime) {
            console.warn('⚠️ Game end called without game start');
            return;
        }
        
        const gameEndTime = Date.now();
        const gameDuration = gameEndTime - this.gameStartTime;
        const sessionDuration = gameEndTime - this.sessionStartTime;
        
        // Update session stats
        this.sessionStats.gamesPlayed++;
        this.sessionStats.totalPlayTime = sessionDuration;
        
        switch (result.toLowerCase()) {
            case 'win':
                this.sessionStats.wins++;
                break;
            case 'lose':
            case 'loss':
                this.sessionStats.losses++;
                break;
            case 'draw':
                this.sessionStats.draws++;
                break;
            case 'timeout':
                this.sessionStats.timeouts++;
                break;
        }
        
        // Calculate average game time
        this.sessionStats.averageGameTime = this.sessionStats.totalPlayTime / this.sessionStats.gamesPlayed;
        
        // Create log entry
        const logEntry = {
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            result: result.toLowerCase(),
            reason: reason,
            gameDuration: this.formatDuration(gameDuration),
            gameDurationMs: gameDuration,
            sessionDuration: this.formatDuration(sessionDuration),
            sessionDurationMs: sessionDuration,
            sessionStats: { ...this.sessionStats }
        };
        
        // Log to console
        console.log('📊 Game completed:', logEntry);
        
        // Save to localStorage and download log
        this.saveLogEntry(logEntry);
        this.saveStats();
        
        // Reset game timer
        this.gameStartTime = null;
    }
    
    saveLogEntry(entry) {
        // Get existing logs from localStorage
        let logs = [];
        try {
            const existingLogs = localStorage.getItem('ticTacToeGameLogs');
            if (existingLogs) {
                logs = JSON.parse(existingLogs);
            }
        } catch (error) {
            console.warn('⚠️ Error loading existing logs:', error);
            logs = [];
        }
        
        // Add new entry
        logs.push(entry);
        
        // Keep only last 100 games to prevent localStorage from getting too large
        if (logs.length > 100) {
            logs = logs.slice(-100);
        }
        
        // Save back to localStorage
        try {
            localStorage.setItem('ticTacToeGameLogs', JSON.stringify(logs));
        } catch (error) {
            console.error('❌ Error saving logs to localStorage:', error);
        }
        
        // Generate downloadable log file
        this.generateLogFile(logs);
    }
    
    saveStats() {
        try {
            localStorage.setItem('ticTacToeSessionStats', JSON.stringify(this.sessionStats));
        } catch (error) {
            console.error('❌ Error saving stats:', error);
        }
    }
    
    loadStats() {
        try {
            const savedStats = localStorage.getItem('ticTacToeSessionStats');
            if (savedStats) {
                this.sessionStats = { ...this.sessionStats, ...JSON.parse(savedStats) };
            }
        } catch (error) {
            console.warn('⚠️ Error loading stats:', error);
        }
    }
    
    generateLogFile(logs) {
        // Create comprehensive log content
        const logContent = this.createLogContent(logs);
        
        // Create downloadable file (for local development)
        if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
            this.createDownloadableLog(logContent);
        }
        
        // For GitHub Pages, we'll store in localStorage and provide export functionality
        this.storeLogForExport(logContent);
    }
    
    createLogContent(logs) {
        const header = `# Tic Tac Toe Game Log
Generated: ${new Date().toISOString()}
Total Games: ${logs.length}

## Session Summary
- Games Played: ${this.sessionStats.gamesPlayed}
- Wins: ${this.sessionStats.wins} (${this.getPercentage(this.sessionStats.wins, this.sessionStats.gamesPlayed)}%)
- Losses: ${this.sessionStats.losses} (${this.getPercentage(this.sessionStats.losses, this.sessionStats.gamesPlayed)}%)
- Draws: ${this.sessionStats.draws} (${this.getPercentage(this.sessionStats.draws, this.sessionStats.gamesPlayed)}%)
- Timeouts: ${this.sessionStats.timeouts} (${this.getPercentage(this.sessionStats.timeouts, this.sessionStats.gamesPlayed)}%)
- Total Play Time: ${this.formatDuration(this.sessionStats.totalPlayTime)}
- Average Game Time: ${this.formatDuration(this.sessionStats.averageGameTime)}

## Detailed Game Log
`;
        
        const gameEntries = logs.map((entry, index) => {
            return `### Game ${index + 1}
- Date: ${entry.date}
- Time: ${entry.time}
- Result: ${entry.result.toUpperCase()}
- Reason: ${entry.reason || 'Normal gameplay'}
- Game Duration: ${entry.gameDuration}
- Session Duration: ${entry.sessionDuration}
`;
        }).join('\n');
        
        return header + gameEntries;
    }
    
    createDownloadableLog(content) {
        // This works for local file:// protocol
        try {
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            // Auto-download is not possible on GitHub Pages, so we'll just prepare it
            console.log('📄 Log file prepared for download');
        } catch (error) {
            console.warn('⚠️ Could not create downloadable log:', error);
        }
    }
    
    storeLogForExport(content) {
        try {
            localStorage.setItem('ticTacToeLogContent', content);
            console.log('💾 Log content stored for export');
        } catch (error) {
            console.error('❌ Error storing log content:', error);
        }
    }
    
    exportLog() {
        try {
            const content = localStorage.getItem('ticTacToeLogContent');
            if (!content) {
                console.warn('⚠️ No log content available for export');
                return;
            }
            
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `tic-tac-toe-log-${timestamp}.md`;
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`📥 Log exported as ${filename}`);
        } catch (error) {
            console.error('❌ Error exporting log:', error);
        }
    }
    
    getStats() {
        return {
            ...this.sessionStats,
            currentSessionTime: this.formatDuration(Date.now() - this.sessionStartTime)
        };
    }
    
    clearLogs() {
        try {
            localStorage.removeItem('ticTacToeGameLogs');
            localStorage.removeItem('ticTacToeLogContent');
            localStorage.removeItem('ticTacToeSessionStats');
            
            // Reset session stats
            this.sessionStats = {
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                timeouts: 0,
                totalPlayTime: 0,
                averageGameTime: 0
            };
            
            console.log('🗑️ All logs and stats cleared');
        } catch (error) {
            console.error('❌ Error clearing logs:', error);
        }
    }
    
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    getPercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }
    
    // Method to display current stats in the UI
    displayStats() {
        const stats = this.getStats();
        console.log('📊 Current Session Stats:', stats);
        return stats;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLogger;
}