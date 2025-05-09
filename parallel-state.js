import { PicoBus } from '@rook2pawn/picobus';
import assert from 'assert';

export class ParallelState extends PicoBus {
  constructor(transitions) {
    super();
    assert.equal(typeof transitions, 'object', 'picostate.parallel: transitions must be an object');

    this.transitions = transitions;
    this.scopes = Object.keys(transitions);

    Object.defineProperty(this, 'state', {
      get: () => {
        return this.scopes.reduce((acc, scope) => {
          acc[scope] = this.transitions[scope].state;
          return acc;
        }, {});
      },
    });
  }

  emit(eventName) {
    const [scope, event] = eventName.split(':');
    assert(scope && event, `picostate.parallel.emit: event name must be in format scope:event (got "${eventName}")`);

    const machine = this.transitions[scope];
    assert(machine, `picostate.parallel.emit: invalid scope "${scope}"`);

    machine.emit(event);
    super.emit(eventName);
  }
}
