# Firebase Setup for 3D Pong Multiplayer

## Prerequisites
- Firebase account (free at https://firebase.google.com)
- The game deployed to a public URL (GitHub Pages works great)

## Step 1: Enable Firebase Realtime Database

1. Go to your Firebase Console: https://console.firebase.google.com/project/pong-3d-71979
2. Click on "Realtime Database" in the left sidebar
3. Click "Create Database"
4. Choose your database location (select the closest to your users)
5. Start in "test mode" for now (we'll add proper rules later)

## Step 2: Set Database Rules

1. In the Realtime Database section, click on the "Rules" tab
2. Replace the default rules with the contents from `firebase-rules.json`:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "players": {
          "$playerId": {
            ".write": "$playerId === auth.uid || data.exists() === false"
          }
        },
        "gameState": {
          ".write": "auth != null && auth.uid === data.parent().child('metadata').child('host').val()"
        },
        "inputs": {
          "$playerId": {
            ".write": "$playerId === auth.uid"
          }
        }
      }
    }
  }
}
```

3. Click "Publish"

## Step 3: Enable Anonymous Authentication

1. Go to "Authentication" in the left sidebar
2. Click "Get started" if you haven't already
3. Go to the "Sign-in method" tab
4. Enable "Anonymous" authentication
5. Click "Save"

## Step 4: Add Your Domain to Authorized Domains

1. Still in Authentication, go to "Settings" tab
2. Under "Authorized domains", add:
   - `bakednotfried.github.io` (or your custom domain)
   - `localhost` (for local testing)

## Step 5: Test Your Setup

1. Open your game at https://bakednotfried.github.io/pong-game/
2. Click "Multiplayer"
3. Create a room and share the code with a friend
4. Both players should be able to join and play!

## Troubleshooting

### "Failed to connect to multiplayer service"
- Check that your Firebase configuration is correct in `src/firebase-config.js`
- Ensure your domain is in the authorized domains list
- Check browser console for specific error messages

### Players can't see each other
- Verify database rules are published correctly
- Check that both players have internet connectivity
- Ensure room codes are entered correctly (case-sensitive)

### Laggy gameplay
- Firebase Realtime Database has some inherent latency
- For best experience, players should be geographically close
- Consider upgrading to Firebase's paid plan for better performance

## Performance Tips

1. The game sends updates at 30Hz to balance smoothness and bandwidth
2. Each room automatically cleans up after 5 minutes of inactivity
3. The free tier supports up to 100 concurrent connections
4. Monitor usage in Firebase Console > Usage tab