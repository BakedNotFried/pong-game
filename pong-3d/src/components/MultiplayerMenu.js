export class MultiplayerMenu {
    constructor(multiplayerService) {
        this.multiplayerService = multiplayerService;
        this.element = null;
        this.callbacks = {
            onGameStart: null
        };
    }
    
    create() {
        this.element = document.createElement('div');
        this.element.id = 'multiplayer-menu';
        this.element.innerHTML = `
            <style>
                #multiplayer-menu {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.9);
                    padding: 30px;
                    border-radius: 10px;
                    color: white;
                    text-align: center;
                    z-index: 1000;
                    min-width: 300px;
                }
                
                #multiplayer-menu h2 {
                    margin-top: 0;
                    color: #4CAF50;
                }
                
                #multiplayer-menu button {
                    display: block;
                    width: 100%;
                    padding: 10px 20px;
                    margin: 10px 0;
                    font-size: 16px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                
                #multiplayer-menu button:hover {
                    background: #45a049;
                }
                
                #multiplayer-menu button:disabled {
                    background: #666;
                    cursor: not-allowed;
                }
                
                #multiplayer-menu input {
                    width: 100%;
                    padding: 10px;
                    margin: 10px 0;
                    font-size: 16px;
                    border: 1px solid #666;
                    border-radius: 5px;
                    background: #222;
                    color: white;
                    text-align: center;
                    text-transform: uppercase;
                }
                
                .room-code-display {
                    font-size: 32px;
                    font-weight: bold;
                    color: #4CAF50;
                    margin: 20px 0;
                    letter-spacing: 5px;
                }
                
                .player-status {
                    margin: 20px 0;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 5px;
                }
                
                .player-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 10px 0;
                }
                
                .player-name {
                    font-weight: bold;
                }
                
                .player-ready {
                    color: #4CAF50;
                }
                
                .player-not-ready {
                    color: #ff9800;
                }
                
                .connection-status {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 12px;
                }
                
                .status-connected {
                    background: #4CAF50;
                }
                
                .status-connecting {
                    background: #ff9800;
                }
                
                .status-disconnected {
                    background: #f44336;
                }
            </style>
            
            <div class="connection-status status-connecting">Connecting...</div>
            <h2>Multiplayer Pong</h2>
            <div id="menu-content">
                <button id="create-room-btn">Create Room</button>
                <button id="join-room-btn">Join Room</button>
                <button id="back-btn">Back to Main Menu</button>
            </div>
        `;
        
        document.getElementById('game-container').appendChild(this.element);
        this.setupEventListeners();
        this.updateConnectionStatus('connected');
    }
    
    setupEventListeners() {
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.showCreatingRoom();
        });
        
        document.getElementById('join-room-btn').addEventListener('click', () => {
            this.showJoinRoom();
        });
        
        document.getElementById('back-btn').addEventListener('click', () => {
            this.hide();
            document.getElementById('menu').style.display = 'block';
        });
    }
    
    async showCreatingRoom() {
        this.updateContent(`
            <p>Creating room...</p>
        `);
        
        const roomCode = await this.multiplayerService.createRoom();
        
        if (roomCode) {
            this.showLobby(roomCode, true);
        } else {
            this.updateContent(`
                <p style="color: #f44336;">Failed to create room</p>
                <button onclick="location.reload()">Try Again</button>
            `);
        }
    }
    
    showJoinRoom() {
        this.updateContent(`
            <p>Enter Room Code:</p>
            <input type="text" id="room-code-input" maxlength="6" placeholder="XXXXXX">
            <button id="join-btn">Join</button>
            <button id="cancel-join-btn">Cancel</button>
        `);
        
        document.getElementById('room-code-input').focus();
        
        document.getElementById('join-btn').addEventListener('click', async () => {
            const code = document.getElementById('room-code-input').value.toUpperCase();
            if (code.length !== 6) {
                alert('Please enter a 6-character room code');
                return;
            }
            
            this.updateContent(`<p>Joining room...</p>`);
            
            const success = await this.multiplayerService.joinRoom(code);
            if (success) {
                this.showLobby(code, false);
            } else {
                this.updateContent(`
                    <p style="color: #f44336;">Failed to join room</p>
                    <button onclick="location.reload()">Try Again</button>
                `);
            }
        });
        
        document.getElementById('cancel-join-btn').addEventListener('click', () => {
            this.resetMenu();
        });
    }
    
    showLobby(roomCode, isHost) {
        this.updateContent(`
            <p>Room Code:</p>
            <div class="room-code-display">${roomCode}</div>
            <div class="player-status" id="player-status">
                <div class="player-item">
                    <span class="player-name">Waiting for players...</span>
                </div>
            </div>
            <button id="ready-btn" disabled>Ready</button>
            <button id="leave-btn">Leave Room</button>
        `);
        
        this.multiplayerService.onPlayerJoined((players) => {
            this.updatePlayerStatus(players);
        });
        
        this.multiplayerService.onRoomReady(() => {
            if (this.callbacks.onGameStart) {
                this.callbacks.onGameStart();
            }
            this.hide();
        });
        
        document.getElementById('leave-btn').addEventListener('click', async () => {
            await this.multiplayerService.leaveRoom();
            this.resetMenu();
        });
    }
    
    updatePlayerStatus(players) {
        const playerArray = Object.entries(players);
        const statusHtml = playerArray.map(([id, player]) => {
            const isCurrentPlayer = id === this.multiplayerService.playerId;
            const readyClass = player.ready ? 'player-ready' : 'player-not-ready';
            const readyText = player.ready ? 'Ready' : 'Not Ready';
            
            return `
                <div class="player-item">
                    <span class="player-name" style="color: ${player.paddle === 'green' ? '#4CAF50' : '#f44336'}">
                        ${player.name} ${isCurrentPlayer ? '(You)' : ''}
                    </span>
                    <span class="${readyClass}">${readyText}</span>
                </div>
            `;
        }).join('');
        
        document.getElementById('player-status').innerHTML = statusHtml;
        
        if (playerArray.length === 2) {
            const readyBtn = document.getElementById('ready-btn');
            readyBtn.disabled = false;
            
            readyBtn.addEventListener('click', async () => {
                const currentPlayer = players[this.multiplayerService.playerId];
                await this.multiplayerService.setReady(!currentPlayer.ready);
            });
        }
    }
    
    updateContent(html) {
        document.getElementById('menu-content').innerHTML = html;
    }
    
    resetMenu() {
        this.updateContent(`
            <button id="create-room-btn">Create Room</button>
            <button id="join-room-btn">Join Room</button>
            <button id="back-btn">Back to Main Menu</button>
        `);
        this.setupEventListeners();
    }
    
    updateConnectionStatus(status) {
        const statusElement = this.element.querySelector('.connection-status');
        statusElement.className = `connection-status status-${status}`;
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    show() {
        this.element.style.display = 'block';
    }
    
    hide() {
        this.element.style.display = 'none';
    }
    
    onGameStart(callback) {
        this.callbacks.onGameStart = callback;
    }
}