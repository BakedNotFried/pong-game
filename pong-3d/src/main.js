import * as THREE from 'three';
import { Game } from './Game.js';
import { MultiplayerGame } from './MultiplayerGame.js';
import { MultiplayerService } from './services/MultiplayerService.js';
import { MultiplayerMenu } from './components/MultiplayerMenu.js';

let currentGame = null;
let multiplayerService = null;
let multiplayerMenu = null;

// Initialize single player game
function initSinglePlayer() {
    currentGame = new Game();
    currentGame.init();
    
    document.getElementById('start-button').addEventListener('click', () => {
        document.getElementById('menu').style.display = 'none';
        currentGame.start();
    });
}

// Initialize multiplayer
async function initMultiplayer() {
    multiplayerService = new MultiplayerService();
    const initialized = await multiplayerService.initialize();
    
    if (!initialized) {
        alert('Failed to connect to multiplayer service. Please check your internet connection.');
        return;
    }
    
    multiplayerMenu = new MultiplayerMenu(multiplayerService);
    multiplayerMenu.create();
    
    multiplayerMenu.onGameStart(() => {
        startMultiplayerGame();
    });
    
    document.getElementById('menu').style.display = 'none';
    multiplayerMenu.show();
}

// Start multiplayer game
function startMultiplayerGame() {
    if (currentGame) {
        // Clean up existing game
        currentGame = null;
    }
    
    currentGame = new MultiplayerGame(multiplayerService);
    currentGame.init();
    currentGame.start();
}

// Update main menu
function updateMainMenu() {
    const menu = document.getElementById('menu');
    menu.innerHTML = `
        <h1>3D Pong</h1>
        <button id="start-button">Single Player</button>
        <button id="multiplayer-button">Multiplayer</button>
    `;
    
    document.getElementById('start-button').addEventListener('click', () => {
        document.getElementById('menu').style.display = 'none';
        currentGame.start();
    });
    
    document.getElementById('multiplayer-button').addEventListener('click', () => {
        initMultiplayer();
    });
}

// Initialize the game
initSinglePlayer();
updateMainMenu();

// Handle window resize
window.addEventListener('resize', () => {
    if (currentGame) {
        currentGame.handleResize();
    }
});

// Handle page unload
window.addEventListener('beforeunload', async () => {
    if (multiplayerService && multiplayerService.currentRoom) {
        await multiplayerService.leaveRoom();
    }
});