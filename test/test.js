import test from "tape";
import { PicoState } from "../picostate.js";

// === Basic FSM Transitions ===
test("FSM basic transitions", (t) => {
  const fsm = new PicoState("idle", {
    idle: { start: "running" },
    running: { stop: "idle" },
  });

  t.equal(fsm.state, "idle", "Starts in idle");

  fsm.emit("start");
  t.equal(fsm.state, "running", "Transitioned to running");

  fsm.emit("stop");
  t.equal(fsm.state, "idle", "Returned to idle");

  t.end();
});
test("FSM attempting invalid transition", (t) => {
  const fsm = new PicoState("idle", {
    idle: { start: "running" },
    running: { stop: "idle" },
  });

  t.equal(fsm.state, "idle", "Starts in idle");

  fsm.emit("start");
  t.equal(fsm.state, "running", "Transitioned to running");

  fsm.emit("stop");
  t.equal(fsm.state, "idle", "Returned to idle");

  fsm.emit("stop");
  t.equal(fsm.state, "idle", "should stay in idle");

  t.end();
});

// === Guards Prevent Transitions ===
test("FSM guard blocks invalid transition", (t) => {
  const fsm = new PicoState("idle", {
    idle: { go: "active" },
    active: { reset: "idle" },
  });

  fsm.guard("go", () => false);

  fsm.emit("go");
  t.equal(fsm.state, "idle", "Guard blocked transition");

  fsm.guard("go", () => true);
  fsm.emit("go");
  t.equal(fsm.state, "active", "Guard allowed transition");

  t.end();
});

// === on() side effects ===
test("FSM triggers side effect with on()", (t) => {
  const fsm = new PicoState("off", {
    off: { toggle: "on" },
    on: { toggle: "off" },
  });

  let triggered = false;
  fsm.on("on", () => {
    triggered = true;
  });

  fsm.emit("toggle");
  t.ok(triggered, "Triggered side effect");
  t.equal(fsm.state, "on", "Now in on state");

  t.end();
});

// === onchange() fires for every transition ===
test("FSM onchange fires with previous and current state", (t) => {
  const fsm = new PicoState("idle", {
    idle: { go: "run" },
    run: { stop: "idle" },
  });

  let changes = [];
  fsm.onchange((current, prev) => changes.push(`${prev}->${current}`));

  fsm.emit("go");
  fsm.emit("stop");

  t.deepEqual(changes, ["idle->run", "run->idle"], "Tracked all transitions");

  t.end();
});

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
