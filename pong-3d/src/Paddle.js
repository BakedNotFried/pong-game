import * as THREE from 'three';

export class Paddle {
    constructor(color = 0x00ff00, type = 'player') {
        this.width = 8;
        this.height = 6;
        this.depth = 1;
        this.type = type;
        
        this.speed = 20;
        this.aiSpeed = 15;
        
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.2
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            linewidth: 2
        });
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        this.mesh.add(edges);
        
        this.bounds = {
            x: { min: -15, max: 15 },
            y: { min: -10, max: 10 },
            z: { min: -5, max: 5 }
        };
    }
    
    update(deltaTime, inputController) {
        if (this.type !== 'player' || !inputController) return;
        
        const movement = inputController.getMovement();
        
        if (movement.left) {
            this.mesh.position.x -= this.speed * deltaTime;
        }
        if (movement.right) {
            this.mesh.position.x += this.speed * deltaTime;
        }
        if (movement.up) {
            this.mesh.position.y += this.speed * deltaTime;
        }
        if (movement.down) {
            this.mesh.position.y -= this.speed * deltaTime;
        }
        if (movement.forward) {
            this.mesh.position.z -= this.speed * deltaTime;
        }
        if (movement.backward) {
            this.mesh.position.z += this.speed * deltaTime;
        }
        
        this.mesh.position.x = Math.max(
            this.bounds.x.min,
            Math.min(this.bounds.x.max, this.mesh.position.x)
        );
        this.mesh.position.y = Math.max(
            this.bounds.y.min,
            Math.min(this.bounds.y.max, this.mesh.position.y)
        );
        
        if (this.type === 'player') {
            this.mesh.position.z = Math.max(
                20,
                Math.min(25 + this.bounds.z.max, this.mesh.position.z)
            );
        }
    }
    
    updateAI(deltaTime, ball) {
        if (this.type !== 'ai' || !ball) return;
        
        const targetX = ball.mesh.position.x;
        const targetY = ball.mesh.position.y;
        
        const diffX = targetX - this.mesh.position.x;
        const diffY = targetY - this.mesh.position.y;
        
        const dampening = 0.7;
        
        if (Math.abs(diffX) > 1) {
            const moveX = Math.sign(diffX) * Math.min(this.aiSpeed * deltaTime, Math.abs(diffX));
            this.mesh.position.x += moveX * dampening;
        }
        
        if (Math.abs(diffY) > 1) {
            const moveY = Math.sign(diffY) * Math.min(this.aiSpeed * deltaTime, Math.abs(diffY));
            this.mesh.position.y += moveY * dampening;
        }
        
        if (ball.velocity.z < 0 && ball.mesh.position.z < 0) {
            const predictedZ = ball.mesh.position.z + ball.velocity.z * 0.5;
            if (predictedZ > -30 && predictedZ < -20) {
                this.mesh.position.z = -25 + (Math.random() - 0.5) * 2;
            }
        }
        
        this.mesh.position.x = Math.max(
            this.bounds.x.min,
            Math.min(this.bounds.x.max, this.mesh.position.x)
        );
        this.mesh.position.y = Math.max(
            this.bounds.y.min,
            Math.min(this.bounds.y.max, this.mesh.position.y)
        );
    }
    
    getBounds() {
        return {
            minX: this.mesh.position.x - this.width / 2,
            maxX: this.mesh.position.x + this.width / 2,
            minY: this.mesh.position.y - this.height / 2,
            maxY: this.mesh.position.y + this.height / 2,
            minZ: this.mesh.position.z - this.depth / 2,
            maxZ: this.mesh.position.z + this.depth / 2
        };
    }
}