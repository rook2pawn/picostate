import { PicoBus } from "@rook2pawn/picobus";
import { ParallelState } from "./parallel-state.js";

export class PicoState extends PicoBus {
  constructor(initialState, transitions) {
    super();

    this.state = initialState;
    this.transitions = transitions;
    this.guards = {};
    this.submachines = {};
    this._submachine = null;
    this._onChange = null;
  }

  emit(eventName, payload) {
    const nextState = this._next(eventName);
    if (this._submachine && this.transitions[nextState]) {
      this._unregisterSubmachine();
    }
    // announce the attempt (for tracing / metrics)
    super.emit("emit", { eventName, state: this.state, payload });

    // --- enhanced guard handling: boolean | { ok, reason } ---
    if (this.guards[eventName]) {
      const res = this.guards[eventName]();
      let ok = res;
      let reason;
      if (res && typeof res === "object") {
        ok = !!res.ok;
        reason = res.reason;
      }
      if (ok === false) {
        // Surface the block without changing emit()’s contract
        super.emit("guard:blocked", {
          eventName,
          state: this.state,
          reason,
          payload,
        });
        return;
      }
    }

    //  NEW: if there's no valid transition, do nothing
    if (nextState == null) {
      return;
    }

    const prevState = this.state;
    this.state = nextState;

    if (typeof this._onChange === "function") {
      this._onChange(nextState, prevState);
    }

    super.emit("transition", {
      eventName,
      from: prevState,
      to: this.state,
      payload,
    });
    super.emit(nextState, payload);
  }

  onchange(cb) {
    this._onChange = cb;
  }

  guard(eventName, conditionFn) {
    this.guards[eventName] = conditionFn;
  }

  event(eventName, subMachine) {
    this.submachines[eventName] = subMachine;
  }

  _unregisterSubmachine() {
    if (this._submachine) {
      this._submachine._unregisterSubmachine?.();
      this._submachine = null;
    }
  }

  _next(eventName) {
    if (this._submachine) {
      const subNext = this._submachine._next(eventName);
      if (subNext) return subNext;
    }

    if (this.submachines[eventName]) {
      this._submachine = this.submachines[eventName];
      return this._submachine.state;
    }

    const currentState = this.transitions[this.state];
    const wildcardState = this.transitions["*"];

    if (
      !currentState ||
      !Object.prototype.hasOwnProperty.call(currentState, eventName)
    ) {
      if (
        wildcardState &&
        Object.prototype.hasOwnProperty.call(wildcardState, eventName)
      ) {
        return wildcardState[eventName];
      }
      return null;
    }

    return currentState[eventName];
  }

  static parallel(stateMap) {
    return new ParallelState(stateMap);
  }
}
