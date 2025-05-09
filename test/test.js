import test from 'tape';
import { PicoState } from '../picostate.js';

// === Basic FSM Transitions ===
test('FSM basic transitions', t => {
  const fsm = new PicoState('idle', {
    idle: { start: 'running' },
    running: { stop: 'idle' },
  });

  t.equal(fsm.state, 'idle', 'Starts in idle');

  fsm.emit('start');
  t.equal(fsm.state, 'running', 'Transitioned to running');

  fsm.emit('stop');
  t.equal(fsm.state, 'idle', 'Returned to idle');

  t.end();
});

// === Guards Prevent Transitions ===
test('FSM guard blocks invalid transition', t => {
  const fsm = new PicoState('idle', {
    idle: { go: 'active' },
    active: { reset: 'idle' }
  });

  fsm.guard('go', () => false);

  fsm.emit('go');
  t.equal(fsm.state, 'idle', 'Guard blocked transition');

  fsm.guard('go', () => true);
  fsm.emit('go');
  t.equal(fsm.state, 'active', 'Guard allowed transition');

  t.end();
});

// === on() side effects ===
test('FSM triggers side effect with on()', t => {
  const fsm = new PicoState('off', {
    off: { toggle: 'on' },
    on: { toggle: 'off' }
  });

  let triggered = false;
  fsm.on('on', () => { triggered = true });

  fsm.emit('toggle');
  t.ok(triggered, 'Triggered side effect');
  t.equal(fsm.state, 'on', 'Now in on state');

  t.end();
});

// === onchange() fires for every transition ===
test('FSM onchange fires with previous and current state', t => {
  const fsm = new PicoState('idle', {
    idle: { go: 'run' },
    run: { stop: 'idle' }
  });

  let changes = [];
  fsm.onchange((current, prev) => changes.push(`${prev}->${current}`));

  fsm.emit('go');
  fsm.emit('stop');

  t.deepEqual(changes, ['idle->run', 'run->idle'], 'Tracked all transitions');

  t.end();
});
