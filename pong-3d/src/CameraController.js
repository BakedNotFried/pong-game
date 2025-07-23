import * as THREE from 'three';

export class CameraController {
    constructor(camera) {
        this.camera = camera;
        this.target = null;
        
        this.offset = new THREE.Vector3(0, 15, 20);
        this.lookAtOffset = new THREE.Vector3(0, 0, -10);
        
        this.smoothness = 5;
        
        this.currentPosition = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
    }
    
    setTarget(target) {
        this.target = target;
        if (target) {
            this.currentPosition.copy(target.position).add(this.offset);
            this.camera.position.copy(this.currentPosition);
            
            this.currentLookAt.copy(target.position).add(this.lookAtOffset);
            this.camera.lookAt(this.currentLookAt);
        }
    }
    
    update(deltaTime) {
        if (!this.target) return;
        
        this.targetPosition.copy(this.target.position).add(this.offset);
        
        this.currentPosition.lerp(this.targetPosition, this.smoothness * deltaTime);
        this.camera.position.copy(this.currentPosition);
        
        this.targetLookAt.copy(this.target.position).add(this.lookAtOffset);
        
        this.currentLookAt.lerp(this.targetLookAt, this.smoothness * deltaTime);
        this.camera.lookAt(this.currentLookAt);
    }
}