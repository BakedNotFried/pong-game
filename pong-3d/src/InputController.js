export class InputController {
    constructor() {
        this.keys = {};
        this.movement = {
            up: false,
            down: false,
            left: false,
            right: false,
            forward: false,
            backward: false
        };
        
        this.onPause = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }
    
    onKeyDown(event) {
        this.keys[event.key.toLowerCase()] = true;
        
        if (event.key === ' ' && this.onPause) {
            this.onPause();
            event.preventDefault();
        }
    }
    
    onKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;
    }
    
    getMovement() {
        this.movement.up = this.keys['w'] || false;
        this.movement.down = this.keys['s'] || false;
        this.movement.left = this.keys['a'] || false;
        this.movement.right = this.keys['d'] || false;
        this.movement.forward = this.keys['q'] || false;
        this.movement.backward = this.keys['e'] || false;
        
        return this.movement;
    }
}