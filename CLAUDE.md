# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**宣坨坨 (Xuantuotuo)** - A web-based implementation of a traditional poker card game from Liulin, Shanxi Province, China. This is a 3-player game with a unique 24-card deck system featuring special card combinations and betting mechanics.

**Note**: This is the second version (V2) of the Xuantuotuo game, rebuilt with modern React architecture. The original version exists in the parent blog system at `../blog-system/blog/xuantuotuo-game/`. This V2 focuses on improved code organization, better multiplayer support via PeerJS, and enhanced UI/UX.

### Technology Stack

- **React 19.2.3** - UI framework
- **TypeScript 5.8.2** - Type safety
- **Vite 6.2.0** - Build tool and dev server
- **TailwindCSS** - Styling (via CDN)
- **PeerJS 1.5.2** - WebRTC-based peer-to-peer networking
- **Web Audio API** - Sound effects engine

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Core Game Logic

The game state management is centralized in `App.tsx` using React hooks. The architecture follows a single-source-of-truth pattern where all game state flows through the `GameState` interface.

**Key architectural patterns:**

1. **State Machine**: Game progresses through defined phases (LOBBY → DEALING → BETTING → PLAYING → SETTLEMENT)
2. **AI Decision Engine**: Separate pure functions in `gameLogic.ts` handle AI behavior
3. **Networking Layer**: PeerJS handles P2P connections with a host-client model
4. **Sound Engine**: Custom Web Audio synthesis (no external audio files)

### File Structure

```
├── App.tsx                  # Main game component (~1000 lines)
│   ├── Game state management
│   ├── Networking (PeerJS)
│   ├── AI logic integration
│   └── UI rendering
├── types.ts                 # TypeScript interfaces and enums
│   ├── Card, Play, GameState
│   ├── GamePhase enum
│   └── Network message types
├── gameLogic.ts            # Pure game logic functions
│   ├── calculatePlayStrength()
│   ├── getValidPlays()
│   ├── AI decision functions
│   └── Reward calculation
├── constants.tsx           # Deck definition and game constants
│   └── createDeck() - 24-card deck builder
├── components/
│   └── PlayingCard.tsx     # Card rendering component
├── index.tsx               # React entry point
├── index.html              # HTML with embedded styles and TailwindCSS CDN
├── vite.config.ts          # Vite configuration
└── metadata.json           # AI Studio metadata
```

### Game State Flow

**Single-Player Mode:**
- Player vs 2 AI opponents
- All game logic runs client-side
- AI uses decision algorithms from `gameLogic.ts`

**Multiplayer Mode (P2P):**
- Host-client architecture via PeerJS
- Host maintains authoritative game state
- State synchronized via `broadcast()` function
- Message types: SYNC_STATE, ACTION_PLAY, ACTION_KOU_LE_INIT, etc.

### Card System

The game uses a unique 24-card deck (defined in `constants.tsx`):
- **卒 (Zu)** - Value 7, Strength 17-18
- **马 (Ma)** - Value 8, Strength 19-20
- **相 (Xiang)** - Value 9, Strength 21-22
- **尔 (Er)** - Value 10, Strength 23-24
- **曲 (Qu)** - J/Q/K, Strength 14-16
- **大王/小王 (Jokers)** - Strength 14-16

Card strength determines play order. Special combinations:
- **Pairs**: Same name + same color (strength + 100)
- **Triples**: Three 曲 of same color (strength + 200)
- **Special pairs**: 大王+小王 or 红尔+红尔 (strength 125)

### AI Implementation

AI decision-making is deterministic based on hand strength scoring:
- `aiDecidePlay()` - Choose which cards to play
- `aiDecideBet()` - Betting/grabbing decisions
- `aiEvaluateKouLe()` - Response to "扣了" (challenge) decisions

AI evaluates hand strength by counting:
- Top cards (strength ≥ 22)
- Valid pairs and triples
- Collected card count

**AI Names**: Randomly selected from `AI_NAME_POOL` (15 traditional Chinese names like 王铁柱, 李翠花, etc.) when starting a single-player game. This adds personality to AI opponents.

### Sound System

Custom sound synthesis using Web Audio API (no external files):
- **SoundEngine object** in `App.tsx` - Self-contained audio engine
- `SoundEngine.init()` - Initializes AudioContext and resumes if suspended
- `SoundEngine.play(type)` - Generates procedural tones for game events
- Sound types:
  - `deal` - Single beep for card dealing
  - `play` - Square wave for playing cards
  - `win` - Higher pitch for collecting cards
  - `settle` - Mid-tone for settlement
  - `victory` - Ascending chord (C-E-G-C)
  - `defeat` - Descending melancholy notes
  - `shuffle` - 8-tone cascade for deck shuffling
  - `bet` - Short sine tone
  - `grab` - Two-tone ascending (triangle wave)
- Uses oscillators with different waveforms (sine, square, triangle, sawtooth)
- All sounds generated at runtime - zero audio file dependencies

## Common Development Patterns

### Working with Game State

The game uses a centralized `GameState` object managed by React's `useState`. When modifying state:

1. **Always use functional updates**: `setGameState(prev => ({ ...prev, ... }))`
2. **Immutability is required**: Never mutate state directly
3. **In multiplayer, sync after state changes**: Host must broadcast state updates

Example:
```typescript
setGameState(prev => {
  const newState = { ...prev, phase: GamePhase.PLAYING };
  if (isHost) broadcast('SYNC_STATE', newState);
  return newState;
});
```

### Adding a New Game Phase

1. Add enum value to `GamePhase` in `types.ts`
2. Update state machine logic in `App.tsx`
3. Add UI rendering for the phase in the main render section
4. Add network synchronization if needed (in `handleNetworkMessage`)
5. Test in both single-player and multiplayer modes

### Modifying Game Rules

All core game logic is in `gameLogic.ts`. Key functions:
- `calculatePlayStrength()` - Determines if cards form valid plays
- `getValidPlays()` - Returns all legal moves
- `getRewardInfo()` - Maps collected cards to star coin rewards

### Adding Network Messages

1. Define type in `NetworkMessageType` union (types.ts)
2. Create interface extending `NetworkMessage`
3. Add handler in `handleNetworkMessage()` function
4. Use `broadcast()` for host→all or `sendToHost()` for client→host

**Important**: Only the host maintains authoritative game state. Clients should send actions to host, and host processes them and broadcasts updated state.

### Adding New Card Types or Changing Deck

If you need to modify the card system:
1. Update `createDeck()` in `constants.tsx` to define new cards
2. Modify strength calculation in `calculatePlayStrength()` (gameLogic.ts)
3. Update UI rendering in `PlayingCard.tsx` for new card visuals
4. Test pair/triple detection logic thoroughly

## Important Notes

### Networking Model
- **Host** (isHost=true) runs authoritative game state
- **Clients** receive state updates via SYNC_STATE messages
- Clients send actions (ACTION_PLAY, ACTION_BET, etc.) to host
- Host processes actions and broadcasts new state

### State Synchronization
When modifying game state in multiplayer:
```typescript
setGameState(prev => {
  const newState = { /* updated state */ };
  if (isHost) broadcast('SYNC_STATE', newState);
  return newState;
});
```

### Development Server
- Vite dev server runs on `0.0.0.0:5173`, accessible from network (useful for mobile testing)
- PeerJS requires HTTPS in production but works with HTTP in development (localhost)
- For testing on mobile devices, use your local IP: `http://192.168.x.x:5173`

### External Dependencies (CDN)
The project loads these libraries from CDN in `index.html`:
- **PeerJS 1.5.2** - P2P networking library
- **TailwindCSS** - Utility-first CSS framework
- **Google Fonts** - Noto Serif SC (Chinese serif) + Inter (sans-serif)

These are not in `package.json` to keep the bundle lean.

### Import Map
The project uses an import map in `index.html` for React imports:
```html
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@^19.2.3",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    ...
  }
}
</script>
```
This allows importing React from CDN (esm.sh) during development. Vite transforms these imports during build. The import map is optional in development but useful for quick prototyping.

## Testing

No automated tests are currently configured. Manual testing workflow:

### Single-Player Testing
1. Start dev server: `npm run dev`
2. Click "单机模式" in lobby
3. Verify AI names are randomly assigned
4. Test complete game flow: dealing → betting → playing → settlement
5. Check sound effects play on actions
6. Verify star coin rewards calculate correctly

### Multiplayer Testing
1. Open dev server in two browser windows/tabs
2. Window 1 (Host): Click "创建房间", note the Room ID
3. Window 2 (Client): Enter Room ID, click "加入房间"
4. Verify both clients see synchronized game state
5. Test actions from both clients
6. Check network message handling in browser DevTools console
7. Test disconnection handling (close one window)

### Mobile Testing
1. Find local IP: `ifconfig | grep "inet "` (macOS/Linux) or `ipconfig` (Windows)
2. Access from mobile device: `http://192.168.x.x:5173`
3. Test touch interactions with cards
4. Verify responsive layout
5. Test WebRTC connection on mobile network

### Debugging Tips
- Open browser DevTools console to see game logs
- Check `gameState` object in React DevTools
- Network tab shows PeerJS WebRTC connections
- Use `console.log(JSON.stringify(gameState, null, 2))` for state inspection

## Building and Deployment

```bash
npm run build
```

Output directory: `dist/`

The built app is a static SPA that can be deployed to any static hosting:
- Vercel, Netlify, GitHub Pages
- Traditional web servers (nginx, Apache)
- CDN with static hosting

**Requirements:**
- Must serve `index.html` for all routes (SPA fallback)
- PeerJS requires HTTPS in production (or use custom PeerJS server)

## Configuration

### Vite Config (`vite.config.ts`)
- React plugin enabled with Fast Refresh
- Server: Host `0.0.0.0` (allows network access), Port 5173, non-strict port mode
- Build output: `dist/`
- Sourcemaps disabled in production for smaller bundle size

### TypeScript Config (`tsconfig.json`)
- Target: ES2022 (modern JavaScript features)
- JSX: react-jsx (new JSX transform, no need to import React)
- Module resolution: bundler (optimized for Vite)
- Path alias: `@/*` → `./*` (cleaner imports)
- Experimental decorators enabled
- `useDefineForClassFields: false` for compatibility
- `allowImportingTsExtensions: true` for .tsx imports
- `noEmit: true` (Vite handles compilation)

### Styling
TailwindCSS loaded via CDN in `index.html` with custom config:
- **Fonts**: Noto Serif SC (Chinese serif), Inter (sans-serif)
- **Theme**: Dark mode (`bg-slate-900`, `text-slate-50`)
- **Custom animations**:
  - `shuffle-1`, `shuffle-2` - Deck shuffling effects
  - `deal-cards` - Card dealing with rotation
  - `play-fly-bottom/left/right` - Card playing animations from different positions
- **Custom scrollbar**: Minimal semi-transparent design
- **Mobile optimizations**:
  - `-webkit-tap-highlight-color: transparent` to remove tap highlights
  - `overscroll-behavior: none` to prevent bounce effects
  - Touch callout disabled for better UX

## Code Conventions

### Type Safety
All game entities are strongly typed via interfaces in `types.ts`. Use type guards when handling network messages or user input.

### Immutability
State updates use immutable patterns:
```typescript
setGameState(prev => ({ ...prev, field: newValue }))
```

### Function Organization
- **Pure functions** → `gameLogic.ts`
- **State management** → `App.tsx` (hooks and effects)
- **UI components** → `components/`
- **Constants** → `constants.tsx`

### Naming Conventions
- React components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Type definitions: PascalCase
- Chinese game terms preserved in logs and UI

## Game-Specific Terminology

- **宣坨坨 (Xuantuotuo)**: Game name
- **扣了 (Kou Le)**: Challenge mechanism where a player can end the round early
- **抢牌 (Qiang Pai)**: Card grabbing/betting phase
- **星光币 (Star Coins)**: In-game currency
- **收牌 (Shou Pai)**: Collecting cards from the table
- **不够/刚够/五了/此了**: Reward levels based on collected cards (9/15/18 thresholds)

## Performance Considerations

### Current Optimizations
- **React 19**: Uses automatic batching and concurrent features
- **Immutable state updates**: Prevents unnecessary re-renders
- **Procedural audio**: Zero audio file loading time
- **CDN assets**: TailwindCSS and PeerJS loaded from CDN (faster initial load)
- **No sourcemaps in production**: Smaller bundle size

### Known Limitations
- **App.tsx size**: ~1000 lines in single file - consider splitting into smaller components if it grows
- **No code splitting**: Entire app loads at once (acceptable for game this size)
- **No lazy loading**: All components render on mount
- **PeerJS dependency**: Requires external PeerJS server (default: peerjs.com)

### Future Optimization Opportunities
- Split `App.tsx` into separate components (Lobby, GameBoard, Settlement, etc.)
- Implement React.memo for card components to reduce re-renders
- Add service worker for offline support
- Consider WebWorker for AI calculations in heavy scenarios

## Troubleshooting

### Common Issues

**PeerJS connection fails**
- Check if PeerJS server is accessible (https://peerjs.com)
- Verify firewall isn't blocking WebRTC
- In production, use HTTPS (PeerJS requires secure context)

**Cards not displaying correctly**
- Check if PlayingCard component received valid Card objects
- Verify card strength calculations in gameLogic.ts
- Inspect console for errors in calculatePlayStrength()

**Sound not playing**
- User interaction required before AudioContext can start
- Check browser's autoplay policy
- Verify SoundEngine.init() was called

**State desynchronization in multiplayer**
- Only host should modify game state
- All state changes must be broadcast via SYNC_STATE
- Check handleNetworkMessage() for missing cases

**Build fails**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all imports are correct

## Communication Guidelines

- 所有回答请使用中文回答 (All responses should be in Chinese)
- 代码修改时要遵循项目现有的代码风格和架构模式 (Follow existing code style and architecture patterns when modifying code)
- 在没有要求的情况下,无需启动、编译、构建、打包代码 (Do not start, compile, build, or package code unless requested)
