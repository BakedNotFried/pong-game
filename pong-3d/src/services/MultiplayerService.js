import { initializeApp } from 'firebase/app';
import { 
    getDatabase, 
    ref, 
    set, 
    onValue, 
    onDisconnect, 
    serverTimestamp,
    push,
    remove,
    get,
    child
} from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { firebaseConfig } from '../firebase-config.js';

export class MultiplayerService {
    constructor() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.currentRoom = null;
        this.playerId = null;
        this.isHost = false;
        this.listeners = [];
        this.callbacks = {
            onPlayerJoined: null,
            onPlayerLeft: null,
            onGameStateUpdate: null,
            onInputUpdate: null,
            onRoomReady: null
        };
    }
    
    async initialize() {
        try {
            this.app = initializeApp(firebaseConfig);
            this.db = getDatabase(this.app);
            this.auth = getAuth(this.app);
            
            const userCredential = await signInAnonymously(this.auth);
            this.playerId = userCredential.user.uid;
            
            console.log('Firebase initialized, player ID:', this.playerId);
            return true;
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            return false;
        }
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    async createRoom() {
        const roomCode = this.generateRoomCode();
        const roomRef = ref(this.db, `rooms/${roomCode}`);
        
        const roomData = {
            metadata: {
                created: serverTimestamp(),
                host: this.playerId
            },
            players: {
                [this.playerId]: {
                    name: 'Player 1',
                    paddle: 'green',
                    ready: false,
                    connected: true,
                    lastHeartbeat: serverTimestamp()
                }
            },
            gameState: {
                ball: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 },
                paddles: {
                    green: { x: 0, y: 0, z: 25 },
                    red: { x: 0, y: 0, z: -25 }
                },
                scores: { green: 0, red: 0 },
                status: 'lobby'
            }
        };
        
        try {
            await set(roomRef, roomData);
            this.currentRoom = roomCode;
            this.isHost = true;
            this.setupRoomListeners();
            this.setupDisconnectHandlers();
            return roomCode;
        } catch (error) {
            console.error('Failed to create room:', error);
            return null;
        }
    }
    
    async joinRoom(roomCode) {
        const roomRef = ref(this.db, `rooms/${roomCode}`);
        
        try {
            const snapshot = await get(roomRef);
            if (!snapshot.exists()) {
                throw new Error('Room not found');
            }
            
            const roomData = snapshot.val();
            const playerCount = Object.keys(roomData.players || {}).length;
            
            if (playerCount >= 2) {
                throw new Error('Room is full');
            }
            
            const playerData = {
                name: 'Player 2',
                paddle: 'red',
                ready: false,
                connected: true,
                lastHeartbeat: serverTimestamp()
            };
            
            await set(ref(this.db, `rooms/${roomCode}/players/${this.playerId}`), playerData);
            
            this.currentRoom = roomCode;
            this.isHost = false;
            this.setupRoomListeners();
            this.setupDisconnectHandlers();
            
            return true;
        } catch (error) {
            console.error('Failed to join room:', error);
            return false;
        }
    }
    
    setupRoomListeners() {
        const roomRef = ref(this.db, `rooms/${this.currentRoom}`);
        
        const playersListener = onValue(ref(this.db, `rooms/${this.currentRoom}/players`), (snapshot) => {
            const players = snapshot.val() || {};
            const playerCount = Object.keys(players).length;
            
            if (this.callbacks.onPlayerJoined && playerCount === 2) {
                this.callbacks.onPlayerJoined(players);
            }
            
            if (playerCount === 2 && Object.values(players).every(p => p.ready)) {
                if (this.callbacks.onRoomReady) {
                    this.callbacks.onRoomReady();
                }
            }
        });
        
        const gameStateListener = onValue(ref(this.db, `rooms/${this.currentRoom}/gameState`), (snapshot) => {
            if (this.callbacks.onGameStateUpdate && !this.isHost) {
                this.callbacks.onGameStateUpdate(snapshot.val());
            }
        });
        
        const inputsListener = onValue(ref(this.db, `rooms/${this.currentRoom}/inputs`), (snapshot) => {
            if (this.callbacks.onInputUpdate) {
                this.callbacks.onInputUpdate(snapshot.val() || {});
            }
        });
        
        this.listeners.push(playersListener, gameStateListener, inputsListener);
        
        this.startHeartbeat();
    }
    
    setupDisconnectHandlers() {
        const playerRef = ref(this.db, `rooms/${this.currentRoom}/players/${this.playerId}`);
        
        onDisconnect(playerRef).update({
            connected: false
        });
        
        onDisconnect(ref(this.db, `rooms/${this.currentRoom}/players/${this.playerId}/connected`)).set(false);
    }
    
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.currentRoom) {
                set(ref(this.db, `rooms/${this.currentRoom}/players/${this.playerId}/lastHeartbeat`), serverTimestamp());
            }
        }, 5000);
    }
    
    async setReady(ready) {
        if (!this.currentRoom) return;
        
        await set(
            ref(this.db, `rooms/${this.currentRoom}/players/${this.playerId}/ready`),
            ready
        );
    }
    
    async updateGameState(gameState) {
        if (!this.currentRoom || !this.isHost) return;
        
        await set(
            ref(this.db, `rooms/${this.currentRoom}/gameState`),
            gameState
        );
    }
    
    async updateInput(input) {
        if (!this.currentRoom) return;
        
        await set(
            ref(this.db, `rooms/${this.currentRoom}/inputs/${this.playerId}`),
            input
        );
    }
    
    async leaveRoom() {
        if (!this.currentRoom) return;
        
        clearInterval(this.heartbeatInterval);
        
        this.listeners.forEach(listener => listener());
        this.listeners = [];
        
        await remove(ref(this.db, `rooms/${this.currentRoom}/players/${this.playerId}`));
        
        const playersSnapshot = await get(ref(this.db, `rooms/${this.currentRoom}/players`));
        if (!playersSnapshot.exists() || Object.keys(playersSnapshot.val()).length === 0) {
            await remove(ref(this.db, `rooms/${this.currentRoom}`));
        }
        
        this.currentRoom = null;
        this.isHost = false;
    }
    
    onPlayerJoined(callback) {
        this.callbacks.onPlayerJoined = callback;
    }
    
    onPlayerLeft(callback) {
        this.callbacks.onPlayerLeft = callback;
    }
    
    onGameStateUpdate(callback) {
        this.callbacks.onGameStateUpdate = callback;
    }
    
    onInputUpdate(callback) {
        this.callbacks.onInputUpdate = callback;
    }
    
    onRoomReady(callback) {
        this.callbacks.onRoomReady = callback;
    }
}