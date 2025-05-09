# 🐭 Picostate

https://github.com/rook2pawn/picostate

published on npm as https://www.npmjs.com/package/@rook2pawn/picostate

Tiny finite state machine with optional guards and side effects — ideal for driving AI conversations, UI state, async workflows, and beyond.

# ✨ Features
* Tiny API surface
* Clean state transition logic
* Optional guard conditions before entering a state
* Optional on(state, fn) hooks to trigger effects
* Parallel FSM support (like bold, italic, underline)
* Fully synchronous and testable
* Zero dependencies

# 🚀 Install
```
npm install picostate
```

# 🧠 Example
```js
import { PicoState } from 'picostate';

const fsm = new PicoState('idle', {
  idle: { activate: 'listening' },
  listening: { got_transcript: 'thinking' },
  thinking: { got_response: 'speaking' },
  speaking: { done: 'idle' }
});

fsm.on('speaking', () => {
  console.log("Now speaking...");
});

fsm.guard('activate', () => Date.now() % 2 === 0); // random entry condition

fsm.emit('activate');
console.log(fsm.state); // => maybe 'listening' or stays 'idle' if blocked
```

# 🧪 Testing
```
npm test
```

Uses tape for simple test definitions. See tests/test.js.

# 📚 API

## new PicoState(initialState, transitions)
Creates a finite state machine.

```js
const fsm = new PicoState('idle',{
  idle: { activate: 'listening' },
  listening: { got_transcript: 'thinking' }
});
.emit(event: string)
// Trigger a transition event. If invalid, it throws.

.state
// Get the current state.

.on(state: string, fn: () => void)
// Trigger a callback when the machine enters a state.

.onchange(fn: (state, prevState) => void)
// Run a callback any time the state changes.

.guard(event: string, fn: () => boolean)
// Prevent a transition unless the guard condition passes.
```
# 🗃 License
MIT © 2025 @rook2pawn