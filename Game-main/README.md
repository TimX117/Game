# Tic Tac Toe Game with Logging

A feature-rich Tic Tac Toe game with special effects, timer mechanics, and comprehensive game logging.

## Features

- **Player vs Computer**: Challenge the AI in fast-paced matches
- **3-Second Timer**: Blitz mode with 3-second move limits
- **Special Color Effects**:
  - 🔴 Red cells place bombs that explode after 2-3 turns
  - 🔵 Blue cells create protective shields
  - 🟣 Purple cells swap pieces with random cells
- **Game Logging**: Tracks play time, results, and statistics
- **Birthday Celebrations**: Special animations and effects
- **Responsive Design**: Works on desktop and mobile

## Game Logging System

The game includes a comprehensive logging system that tracks:

- **Game Results**: Wins, losses, draws, and timeouts
- **Play Time**: Individual game duration and total session time
- **Statistics**: Win rates, average game time, and performance metrics
- **Export Functionality**: Download logs as markdown files

### Accessing Logs

Since the stats UI is hidden, you can access your logs through the browser console:

#### **Simple Console Commands:**
1. Press `F12` to open Developer Tools
2. Go to Console tab  
3. Use these easy commands:

```javascript
// Basic Stats & Export
viewStats()             // View current statistics (formatted table)
exportGameLog()         // Download complete log file
clearGameLogs()         // Clear all logs (with confirmation)

// Date & Time Organized Views
viewGamesByDate()       // Games organized by date (newest first)
viewRecentGames()       // Last 10 games played
viewGamesForDate("12/27/2024")  // Games for specific date
viewDetailedHistory()   // Complete detailed history with full info

// Raw Data Access
viewRawLogs()           // View raw game data
```

#### **Advanced Console Access:**
```javascript
// Direct logger access
game.logger.displayStats()
game.logger.exportLog()
logger.getStats()

// Raw localStorage access
JSON.parse(localStorage.getItem('ticTacToeGameLogs'))
```

### Log Storage

- **Local Storage**: Game data is stored in your browser's localStorage
- **GitHub Pages Compatible**: Works seamlessly when deployed to GitHub Pages
- **Privacy**: All data stays on your device - nothing is sent to external servers

## Deployment to GitHub Pages

### Method 1: Direct Upload

1. Create a new repository on GitHub
2. Upload all files to the repository:
   - `index.html`
   - `index.js`
   - `index.css`
   - `gameLogger.js`
   - `LICENSE`
   - `README.md`
3. Go to repository Settings → Pages
4. Select "Deploy from a branch" → "main" → "/ (root)"
5. Your game will be available at `https://yourusername.github.io/repository-name`

### Method 2: GitHub Desktop

1. Clone this repository or create a new one
2. Copy all game files to your local repository
3. Commit and push changes
4. Enable GitHub Pages in repository settings

### Method 3: Command Line

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
# Copy game files here
git add .
git commit -m "Add Tic Tac Toe game with logging"
git push origin main
```

## File Structure

```
tic-tac-toe/
├── index.html          # Main game interface
├── index.js            # Game logic and mechanics
├── index.css           # Styles and animations
├── gameLogger.js       # Logging system
├── README.md           # This file
└── LICENSE             # License information
```

## Game Rules

### Basic Rules
- Get 3 X's or O's in a row (horizontal, vertical, or diagonal)
- You have 3 seconds per move in Blitz mode
- If time runs out, you lose immediately

### Special Color Effects
- **Red Cells (🔴)**: Place a bomb that explodes in 2-3 turns, clearing a random row or column
- **Blue Cells (🔵)**: Create a protective shield that blocks one bomb explosion
- **Purple Cells (🟣)**: Swap your piece with a random cell on the board

### Special Rules
- Game continues if a swap or explosion happens during a winning turn
- Shields protect against one bomb explosion, then shatter
- Color effects are randomly assigned to cells during gameplay

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Local Development

To run locally:

1. Download all files
2. Open `index.html` in a web browser
3. No server required - runs entirely in the browser

## Date & Time Organized Display

The new logging system organizes games by date and time for easy viewing:

```
📅 Games Organized by Date:
================================

📆 12/27/2024
────────────────────────────────────────
9:45:23 PM | Game #5 | 🏆 WIN | 2m 15s | 3 in a row victory
9:42:10 PM | Game #4 | 😢 LOSE | 1m 45s | Computer got 3 in a row
9:40:30 PM | Game #3 | 🤝 DRAW | 3m 20s | Board is full

📆 12/26/2024
────────────────────────────────────────
8:30:15 PM | Game #2 | ⏰ TIMEOUT | 45s | Player ran out of time
8:25:00 PM | Game #1 | 🏆 WIN | 2m 30s | 3-in-a-row after explosion
```

## Log File Format

Exported logs are in Markdown format and include:

- Session summary with win/loss statistics
- Detailed game-by-game breakdown
- Play time tracking
- Timestamps for all games

Example log entry:
```markdown
### Game 1
- Date: 12/27/2024
- Time: 2:30:45 PM
- Result: WIN
- Reason: 3 in a row victory
- Game Duration: 1m 23s
- Session Duration: 1m 23s
```

## Privacy & Data

- All game data is stored locally in your browser
- No personal information is collected
- No data is transmitted to external servers
- Logs can be exported and cleared at any time

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Feel free to fork this project and submit pull requests for improvements!

## Support

If you encounter any issues:
1. Check browser console for error messages
2. Ensure JavaScript is enabled
3. Try clearing browser cache and localStorage
4. Use a supported browser version