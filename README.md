# 🐭 Picostate

https://github.com/rook2pawn/picostate

published on npm as https://www.npmjs.com/package/@rook2pawn/picostate

Tiny finite state machine with optional guards and side effects — ideal for driving AI conversations, UI state, async workflows, and beyond.

# ✨ Features

- Tiny API surface
- Clean state transition logic
- Optional guard conditions before entering a state
- Optional on(state, fn) hooks to trigger effects
- Parallel FSM support (like bold, italic, underline)
- Fully synchronous and testable
- Zero dependencies

# 🚀 Install

```
npm install picostate
```

# 🧠 Example

```js
import { PicoState } from "picostate";

const fsm = new PicoState("idle", {
  idle: { activate: "listening" },
  listening: { got_transcript: "thinking" },
  thinking: { got_response: "speaking" },
  speaking: { done: "idle" },
});

fsm.on("speaking", () => {
  console.log("Now speaking...");
});

fsm.guard("activate", () => Date.now() % 2 === 0); // random entry condition

fsm.emit("activate");
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
const fsm = new PicoState("idle", {
  idle: { activate: "listening" },
  listening: { got_transcript: "thinking" },
});
```

```js
.emit(event: string)
```

// Trigger a transition event. If invalid, it throws.

```js
.state
// Get the current state.
```

```js
.on(state: string, fn: () => void)
// Trigger a callback when the machine enters a state.
```

```js
.onchange(fn: (state, prevState) => void)
// Run a callback any time the state changes.
```

```js
.guard(event: string, fn: () => boolean | { ok: boolean; reason?: string })
// Prevents a transition unless the guard passes. Guards can return:
// true (allow) or false (block), or
// an object { ok: boolean, reason?: string } for structured feedback.
// If a guard blocks, the machine emits a guard:blocked event with { eventName, state, reason }.

ps.guard('accelerate', () => {
  if (fuel < 5) return { ok: false, reason: 'low fuel' };
  return true; // or { ok: true } — equivalent
});

// Optional: observe blocks for logging/metrics
ps.on('guard:blocked', ({ eventName, state, reason }) => {
  console.warn(`[guard] blocked ${eventName} @ ${state}: ${reason ?? 'unspecified'}`);
});

```

# API Probe events

Probe events allow you to get granular observability on state changes as well as
guard events. Example in the following test:

```js
test("FSM test probes events", (t) => {
  let didEmit = false;
  let didBlock = false;
  let didTransition = false;

  let locked = true;
  const fsm = new PicoState("closed", {
    closed: { open: "open" },
    open: { close: "closed" },
  });
  fsm.guard("open", () => {
    if (locked) {
      return { ok: false, reason: "door is locked" };
    } else return true;
  });

  fsm.on("emit", ({ eventName, state, payload }) => {
    // emitted before guard check / state change
    t.comment("emit event:", eventName, "from", state);
    didEmit = true;
  });

  let reasonString = "";
  fsm.on("guard:blocked", ({ eventName, state, reason, payload }) => {
    t.comment("guard:blocked event:", eventName, "from", state);
    // emitted when a guard blocks a transition
    didBlock = true;
    reasonString = reason;
  });

  fsm.on("transition", ({ eventName, from, to, payload }) => {
    t.comment("transition event:", eventName, "from", from, "to", to);
    // emitted when a transition occurs
    didTransition = true;
  });
  t.comment("Attempting to open while locked");
  fsm.emit("open");
  t.ok(didEmit, "emit event fired");
  t.ok(didBlock, "guard:blocked event fired");
  t.notOk(didTransition, "transition event not fired");
  t.equal(fsm.state, "closed", "state remains closed");
  t.equal(reasonString, "door is locked", "correct block reason");
  t.end();
});
```

# 🗃 License

MIT © 2025 @rook2pawn
