import PicoState from "..";

const sm = new PicoState("idle", {
  idle: { start: "running" },
  running: {},
});

sm.onchange((next, prev) => {
  // noop
});

sm.guard("start", () => true);
sm.emit("start");

const parallel = PicoState.parallel({ a: sm });
console.log(parallel.state);
