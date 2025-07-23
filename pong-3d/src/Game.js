import * as THREE from 'three';
import { Arena } from './Arena.js';
import { Paddle } from './Paddle.js';
import { Ball } from './Ball.js';
import { CameraController } from './CameraController.js';
import { InputController } from './InputController.js';

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.camera = null;
        this.cameraController = null;
        
        this.arena = null;
        this.playerPaddle = null;
        this.aiPaddle = null;
        this.ball = null;
        
        this.inputController = null;
        
        this.playerScore = 0;
        this.aiScore = 0;
        this.isRunning = false;
        this.isPaused = false;
        
        this.clock = new THREE.Clock();
    }
    
    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLights();
        this.setupCamera();
        this.createGameObjects();
        this.setupInput();
        
        this.animate();
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
    }
    
    setupScene() {
        this.scene.background = new THREE.Color(0x000033);
        this.scene.fog = new THREE.Fog(0x000033, 50, 200);
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 50, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);
        
        const pointLight1 = new THREE.PointLight(0x00ff00, 0.5, 50);
        pointLight1.position.set(-30, 20, 0);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff0000, 0.5, 50);
        pointLight2.position.set(30, 20, 0);
        this.scene.add(pointLight2);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.cameraController = new CameraController(this.camera);
    }
    
    createGameObjects() {
        this.arena = new Arena();
        this.scene.add(this.arena.mesh);
        
        this.playerPaddle = new Paddle(0x00ff00, 'player');
        this.playerPaddle.mesh.position.z = 25;
        this.scene.add(this.playerPaddle.mesh);
        
        this.aiPaddle = new Paddle(0xff0000, 'ai');
        this.aiPaddle.mesh.position.z = -25;
        this.scene.add(this.aiPaddle.mesh);
        
        this.ball = new Ball();
        this.scene.add(this.ball.mesh);
        this.scene.add(this.ball.trail);
        
        if (this.cameraController) {
            this.cameraController.setTarget(this.playerPaddle.mesh);
        }
    }
    
    setupInput() {
        this.inputController = new InputController();
        this.inputController.onPause = () => this.togglePause();
    }
    
    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.resetBall();
    }
    
    togglePause() {
        if (this.isRunning) {
            this.isPaused = !this.isPaused;
        }
    }
    
    resetBall() {
        this.ball.reset();
        const angle = (Math.random() - 0.5) * Math.PI / 4;
        const speed = 15;
        this.ball.velocity.x = Math.sin(angle) * speed;
        this.ball.velocity.z = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
        this.ball.velocity.y = (Math.random() - 0.5) * 5;
    }
    
    update(deltaTime) {
        if (!this.isRunning || this.isPaused) return;
        
        this.playerPaddle.update(deltaTime, this.inputController);
        
        this.aiPaddle.updateAI(deltaTime, this.ball);
        
        this.ball.update(deltaTime);
        
        this.checkCollisions();
        
        this.checkGoals();
        
        this.cameraController.update(deltaTime);
    }
    
    checkCollisions() {
        if (this.ball.mesh.position.x <= -this.arena.width / 2 + this.ball.radius ||
            this.ball.mesh.position.x >= this.arena.width / 2 - this.ball.radius) {
            this.ball.velocity.x *= -1;
            this.ball.mesh.position.x = Math.max(
                -this.arena.width / 2 + this.ball.radius,
                Math.min(this.arena.width / 2 - this.ball.radius, this.ball.mesh.position.x)
            );
        }
        
        if (this.ball.mesh.position.y <= -this.arena.height / 2 + this.ball.radius ||
            this.ball.mesh.position.y >= this.arena.height / 2 - this.ball.radius) {
            this.ball.velocity.y *= -1;
            this.ball.mesh.position.y = Math.max(
                -this.arena.height / 2 + this.ball.radius,
                Math.min(this.arena.height / 2 - this.ball.radius, this.ball.mesh.position.y)
            );
        }
        
        this.checkPaddleCollision(this.playerPaddle);
        this.checkPaddleCollision(this.aiPaddle);
    }
    
    checkPaddleCollision(paddle) {
        const paddleBounds = paddle.getBounds();
        const ballPos = this.ball.mesh.position;
        const ballRadius = this.ball.radius;
        
        if (ballPos.x + ballRadius >= paddleBounds.minX &&
            ballPos.x - ballRadius <= paddleBounds.maxX &&
            ballPos.y + ballRadius >= paddleBounds.minY &&
            ballPos.y - ballRadius <= paddleBounds.maxY &&
            ballPos.z + ballRadius >= paddleBounds.minZ &&
            ballPos.z - ballRadius <= paddleBounds.maxZ) {
            
            const paddleCenter = paddle.mesh.position;
            const relativeX = (ballPos.x - paddleCenter.x) / paddle.width;
            const relativeY = (ballPos.y - paddleCenter.y) / paddle.height;
            
            this.ball.velocity.z *= -1.1;
            this.ball.velocity.x += relativeX * 10;
            this.ball.velocity.y += relativeY * 5;
            
            const maxSpeed = 30;
            const currentSpeed = this.ball.velocity.length();
            if (currentSpeed > maxSpeed) {
                this.ball.velocity.multiplyScalar(maxSpeed / currentSpeed);
            }
            
            if (paddle.type === 'player') {
                ballPos.z = paddleBounds.minZ - ballRadius;
            } else {
                ballPos.z = paddleBounds.maxZ + ballRadius;
            }
        }
    }
    
    checkGoals() {
        if (this.ball.mesh.position.z > this.arena.depth / 2) {
            this.aiScore++;
            this.updateScore();
            this.resetBall();
        } else if (this.ball.mesh.position.z < -this.arena.depth / 2) {
            this.playerScore++;
            this.updateScore();
            this.resetBall();
        }
    }
    
    updateScore() {
        document.getElementById('player-score').textContent = this.playerScore;
        document.getElementById('ai-score').textContent = this.aiScore;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        
        this.renderer.render(this.scene, this.camera);
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}