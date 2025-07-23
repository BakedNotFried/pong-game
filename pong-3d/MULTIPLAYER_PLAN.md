
# 3D Pong Multiplayer Implementation Plan

## Architecture: Firebase Realtime Database

### Phase 1: Firebase Setup
- [ ] Create Firebase project
- [ ] Configure Realtime Database
- [ ] Add Firebase SDK to project
- [ ] Implement anonymous authentication

### Phase 2: Lobby System
- [ ] Create room creation/joining UI
- [ ] Generate unique room codes
- [ ] Display player status in lobby
- [ ] Ready-up system

### Phase 3: Game State Sync
- [ ] Designate host player
- [ ] Sync ball position and velocity
- [ ] Sync paddle positions
- [ ] Sync scores
- [ ] Handle game state transitions

### Phase 4: Network Features
- [ ] Latency compensation
- [ ] Disconnect handling
- [ ] Reconnection support
- [ ] Room cleanup

## Firebase Database Structure
```
/rooms/{roomId}/
  - metadata/
    - created: timestamp
    - host: playerId
  - players/
    - {playerId}: {
        name: string,
        paddle: "green" | "red",
        ready: boolean,
        connected: boolean,
        lastHeartbeat: timestamp
      }
  - gameState/
    - ball: {x, y, z, vx, vy, vz}
    - paddles/
      - green: {x, y, z}
      - red: {x, y, z}
    - scores: {green: 0, red: 0}
    - status: "lobby" | "playing" | "paused" | "finished"
  - inputs/
    - {playerId}: {up, down, left, right, forward, backward}
```

## Implementation Notes
- Update rate: 60Hz for local, 30Hz for network
- Room timeout: 5 minutes of inactivity
- Max players per room: 2 (+ spectators in future)
- Connection timeout: 10 seconds
