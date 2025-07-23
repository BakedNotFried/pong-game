import * as THREE from 'three';

export class Arena {
    constructor() {
        this.width = 40;
        this.height = 30;
        this.depth = 60;
        
        this.mesh = new THREE.Group();
        this.createWalls();
        this.createFloor();
    }
    
    createWalls() {
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: 0x0066cc,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const edgeMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ccff,
            emissive: 0x0066ff,
            emissiveIntensity: 0.5
        });
        
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(this.depth, this.height),
            wallMaterial
        );
        leftWall.position.x = -this.width / 2;
        leftWall.rotation.y = Math.PI / 2;
        this.mesh.add(leftWall);
        
        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(this.depth, this.height),
            wallMaterial
        );
        rightWall.position.x = this.width / 2;
        rightWall.rotation.y = -Math.PI / 2;
        this.mesh.add(rightWall);
        
        const topWall = new THREE.Mesh(
            new THREE.PlaneGeometry(this.width, this.depth),
            wallMaterial
        );
        topWall.position.y = this.height / 2;
        topWall.rotation.x = Math.PI / 2;
        this.mesh.add(topWall);
        
        const edgeGeometry = new THREE.BoxGeometry(1, 1, this.depth);
        
        const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        leftEdge.position.set(-this.width / 2, 0, 0);
        leftEdge.scale.y = this.height;
        this.mesh.add(leftEdge);
        
        const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        rightEdge.position.set(this.width / 2, 0, 0);
        rightEdge.scale.y = this.height;
        this.mesh.add(rightEdge);
        
        const topLeftEdge = new THREE.Mesh(
            new THREE.BoxGeometry(this.width, 1, 1),
            edgeMaterial
        );
        topLeftEdge.position.set(0, this.height / 2, -this.depth / 2);
        this.mesh.add(topLeftEdge);
        
        const topRightEdge = new THREE.Mesh(
            new THREE.BoxGeometry(this.width, 1, 1),
            edgeMaterial
        );
        topRightEdge.position.set(0, this.height / 2, this.depth / 2);
        this.mesh.add(topRightEdge);
        
        const bottomLeftEdge = new THREE.Mesh(
            new THREE.BoxGeometry(this.width, 1, 1),
            edgeMaterial
        );
        bottomLeftEdge.position.set(0, -this.height / 2, -this.depth / 2);
        this.mesh.add(bottomLeftEdge);
        
        const bottomRightEdge = new THREE.Mesh(
            new THREE.BoxGeometry(this.width, 1, 1),
            edgeMaterial
        );
        bottomRightEdge.position.set(0, -this.height / 2, this.depth / 2);
        this.mesh.add(bottomRightEdge);
    }
    
    createFloor() {
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0x001144,
            side: THREE.DoubleSide
        });
        
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(this.width, this.depth),
            floorMaterial
        );
        floor.position.y = -this.height / 2;
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.mesh.add(floor);
        
        const gridHelper = new THREE.GridHelper(
            Math.max(this.width, this.depth),
            20,
            0x004488,
            0x002244
        );
        gridHelper.position.y = -this.height / 2 + 0.1;
        this.mesh.add(gridHelper);
        
        const centerLine = new THREE.Mesh(
            new THREE.PlaneGeometry(this.width, 0.5),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        centerLine.position.y = -this.height / 2 + 0.2;
        centerLine.rotation.x = -Math.PI / 2;
        this.mesh.add(centerLine);
    }
}