import { Game } from './Game.js';
import { Paddle } from './Paddle.js';

export class MultiplayerGame extends Game {
    constructor(multiplayerService) {
        super();
        this.multiplayerService = multiplayerService;
        this.localPlayerId = multiplayerService.playerId;
        this.localPaddle = null;
        this.remotePaddle = null;
        this.lastUpdateTime = 0;
        this.updateInterval = 1000 / 30; // 30Hz network updates
        this.inputBuffer = {};
        this.stateBuffer = [];
        this.interpolationDelay = 100; // 100ms interpolation delay
    }
    
    createGameObjects() {
        super.createGameObjects();
        
        // Keep references but remove AI behavior
        // Both paddles will be assigned as player or remote
        
        // Determine which paddle is local based on player assignment
        this.setupMultiplayerCallbacks();
    }
    
    setupMultiplayerCallbacks() {
        this.multiplayerService.onGameStateUpdate((gameState) => {
            if (!this.multiplayerService.isHost) {
                this.handleRemoteGameState(gameState);
            }
        });
        
        this.multiplayerService.onInputUpdate((inputs) => {
            this.handleRemoteInputs(inputs);
        });
        
        this.multiplayerService.onPlayerJoined((players) => {
            this.assignPaddles(players);
        });
        
        this.multiplayerService.onPlayerLeft(() => {
            this.handlePlayerDisconnect();
        });
    }
    
    assignPaddles(players) {
        const localPlayer = players[this.localPlayerId];
        
        if (localPlayer.paddle === 'green') {
            this.localPaddle = this.playerPaddle;
            this.remotePaddle = this.aiPaddle;
            this.remotePaddle.type = 'remote';
        } else {
            this.localPaddle = this.aiPaddle;
            this.localPaddle.type = 'player';
            this.remotePaddle = this.playerPaddle;
            this.remotePaddle.type = 'remote';
            
            // Swap camera target if we're the red paddle
            this.cameraController.setTarget(this.localPaddle.mesh);
        }
    }
    
    update(deltaTime) {
        if (!this.isRunning || this.isPaused) return;
        
        // Update local paddle with input
        if (this.localPaddle) {
            this.localPaddle.update(deltaTime, this.inputController);
            
            // Send input to network
            const currentTime = Date.now();
            if (currentTime - this.lastUpdateTime > this.updateInterval) {
                this.sendLocalInput();
                this.lastUpdateTime = currentTime;
            }
        }
        
        // Update remote paddle with interpolation
        if (this.remotePaddle && this.inputBuffer[this.getRemotePlayerId()]) {
            this.updateRemotePaddle(deltaTime);
        }
        
        // Only update physics if we're the host
        if (this.multiplayerService.isHost) {
            this.ball.update(deltaTime);
            this.checkCollisions();
            this.checkGoals();
            
            // Send game state to other player
            if (currentTime - this.lastUpdateTime > this.updateInterval) {
                this.sendGameState();
            }
        } else {
            // Interpolate ball position for non-host
            this.interpolateBall(deltaTime);
        }
        
        this.cameraController.update(deltaTime);
    }
    
    sendLocalInput() {
        const movement = this.inputController.getMovement();
        const input = {
            movement: movement,
            position: {
                x: this.localPaddle.mesh.position.x,
                y: this.localPaddle.mesh.position.y,
                z: this.localPaddle.mesh.position.z
            },
            timestamp: Date.now()
        };
        
        this.multiplayerService.updateInput(input);
    }
    
    sendGameState() {
        const gameState = {
            ball: {
                x: this.ball.mesh.position.x,
                y: this.ball.mesh.position.y,
                z: this.ball.mesh.position.z,
                vx: this.ball.velocity.x,
                vy: this.ball.velocity.y,
                vz: this.ball.velocity.z
            },
            paddles: {
                green: {
                    x: this.playerPaddle.mesh.position.x,
                    y: this.playerPaddle.mesh.position.y,
                    z: this.playerPaddle.mesh.position.z
                },
                red: {
                    x: this.aiPaddle.mesh.position.x,
                    y: this.aiPaddle.mesh.position.y,
                    z: this.aiPaddle.mesh.position.z
                }
            },
            scores: {
                green: this.playerScore,
                red: this.aiScore
            },
            timestamp: Date.now()
        };
        
        this.multiplayerService.updateGameState(gameState);
    }
    
    handleRemoteInputs(inputs) {
        Object.entries(inputs).forEach(([playerId, input]) => {
            if (playerId !== this.localPlayerId && input) {
                this.inputBuffer[playerId] = input;
            }
        });
    }
    
    handleRemoteGameState(gameState) {
        if (!gameState) return;
        
        // Add to state buffer for interpolation
        this.stateBuffer.push({
            ...gameState,
            receivedAt: Date.now()
        });
        
        // Keep only recent states
        const cutoffTime = Date.now() - 1000;
        this.stateBuffer = this.stateBuffer.filter(state => state.receivedAt > cutoffTime);
        
        // Update scores immediately
        if (gameState.scores) {
            this.playerScore = gameState.scores.green;
            this.aiScore = gameState.scores.red;
            this.updateScore();
        }
    }
    
    updateRemotePaddle(deltaTime) {
        const remoteId = this.getRemotePlayerId();
        const remoteInput = this.inputBuffer[remoteId];
        
        if (!remoteInput) return;
        
        // Apply movement based on remote input
        const movement = remoteInput.movement;
        const paddle = this.remotePaddle;
        
        // Interpolate to remote position
        const targetPos = remoteInput.position;
        const lerpFactor = Math.min(1, deltaTime * 10);
        
        paddle.mesh.position.x += (targetPos.x - paddle.mesh.position.x) * lerpFactor;
        paddle.mesh.position.y += (targetPos.y - paddle.mesh.position.y) * lerpFactor;
        paddle.mesh.position.z += (targetPos.z - paddle.mesh.position.z) * lerpFactor;
    }
    
    interpolateBall(deltaTime) {
        if (this.stateBuffer.length < 2) return;
        
        const now = Date.now() - this.interpolationDelay;
        
        // Find states to interpolate between
        let fromState = null;
        let toState = null;
        
        for (let i = 0; i < this.stateBuffer.length - 1; i++) {
            if (this.stateBuffer[i].timestamp <= now && this.stateBuffer[i + 1].timestamp >= now) {
                fromState = this.stateBuffer[i];
                toState = this.stateBuffer[i + 1];
                break;
            }
        }
        
        if (!fromState || !toState) {
            // Use latest state if we can't interpolate
            const latestState = this.stateBuffer[this.stateBuffer.length - 1];
            if (latestState && latestState.ball) {
                this.ball.mesh.position.set(
                    latestState.ball.x,
                    latestState.ball.y,
                    latestState.ball.z
                );
                this.ball.velocity.set(
                    latestState.ball.vx,
                    latestState.ball.vy,
                    latestState.ball.vz
                );
            }
            return;
        }
        
        // Interpolate ball position
        const alpha = (now - fromState.timestamp) / (toState.timestamp - fromState.timestamp);
        
        this.ball.mesh.position.x = fromState.ball.x + (toState.ball.x - fromState.ball.x) * alpha;
        this.ball.mesh.position.y = fromState.ball.y + (toState.ball.y - fromState.ball.y) * alpha;
        this.ball.mesh.position.z = fromState.ball.z + (toState.ball.z - fromState.ball.z) * alpha;
        
        // Update velocity for prediction
        this.ball.velocity.set(toState.ball.vx, toState.ball.vy, toState.ball.vz);
    }
    
    getRemotePlayerId() {
        // This is a simplified version - in reality you'd track all player IDs
        return Object.keys(this.inputBuffer).find(id => id !== this.localPlayerId);
    }
    
    handlePlayerDisconnect() {
        this.isPaused = true;
        // Show disconnection message
        const message = document.createElement('div');
        message.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
        `;
        message.innerHTML = `
            <h2>Player Disconnected</h2>
            <p>Your opponent has left the game.</p>
            <button onclick="location.reload()">Return to Menu</button>
        `;
        document.getElementById('game-container').appendChild(message);
    }
    
    resetBall() {
        super.resetBall();
        
        // Only reset velocity if we're the host
        if (this.multiplayerService.isHost) {
            const angle = (Math.random() - 0.5) * Math.PI / 4;
            const speed = 15;
            this.ball.velocity.x = Math.sin(angle) * speed;
            this.ball.velocity.z = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
            this.ball.velocity.y = (Math.random() - 0.5) * 5;
        }
    }
}