import { PicoBus } from '@rook2pawn/picobus';
import assert from 'assert';
import { ParallelState } from './parallel-state.js';

export class PicoState extends PicoBus {
  constructor(initialState, transitions) {
    super();

    assert.equal(typeof initialState, 'string', 'picostate: initialState must be a string');
    assert.equal(typeof transitions, 'object', 'picostate: transitions must be an object');

    this.state = initialState;
    this.transitions = transitions;
    this.guards = {};
    this.submachines = {};
    this._submachine = null;
    this._onChange = null;
  }

  emit(eventName) {
    const nextState = this._next(eventName);
    assert.ok(nextState, `picostate.emit: invalid transition ${this.state}->${eventName}`);

    if (this._submachine && this.transitions[nextState]) {
      this._unregisterSubmachine();
    }

    const isBlocked = this.guards[eventName] && this.guards[eventName]() === false;
    if (isBlocked) return;

    const prevState = this.state;
    this.state = nextState;

    if (typeof this._onChange === 'function') {
      this._onChange(nextState, prevState);
    }

    super.emit(nextState);
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
    const wildcardState = this.transitions['*'];

    if (!currentState || !Object.prototype.hasOwnProperty.call(currentState, eventName)) {
      if (wildcardState && Object.prototype.hasOwnProperty.call(wildcardState, eventName)) {
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
