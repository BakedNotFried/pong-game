import * as THREE from 'three';

export class Ball {
    constructor() {
        this.radius = 0.5;
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        const geometry = new THREE.SphereGeometry(this.radius, 32, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        
        const light = new THREE.PointLight(0xffffff, 0.5, 10);
        this.mesh.add(light);
        
        this.trail = this.createTrail();
        this.trailPositions = [];
        this.maxTrailLength = 20;
    }
    
    createTrail() {
        const trailGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.maxTrailLength * 3);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        return trail;
    }
    
    update(deltaTime) {
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        this.trailPositions.push(this.mesh.position.clone());
        if (this.trailPositions.length > this.maxTrailLength) {
            this.trailPositions.shift();
        }
        
        const positions = this.trail.geometry.attributes.position.array;
        for (let i = 0; i < this.trailPositions.length; i++) {
            positions[i * 3] = this.trailPositions[i].x;
            positions[i * 3 + 1] = this.trailPositions[i].y;
            positions[i * 3 + 2] = this.trailPositions[i].z;
        }
        this.trail.geometry.attributes.position.needsUpdate = true;
        
        this.mesh.rotation.x += deltaTime * 2;
        this.mesh.rotation.y += deltaTime * 3;
    }
    
    reset() {
        this.mesh.position.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.trailPositions = [];
    }
}