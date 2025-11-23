import { PicoBus } from "@rook2pawn/picobus";

export class ParallelState extends PicoBus {
  constructor(transitions) {
    super();
    this.transitions = transitions;
    this.scopes = Object.keys(transitions);

    Object.defineProperty(this, "state", {
      get: () => {
        return this.scopes.reduce((acc, scope) => {
          acc[scope] = this.transitions[scope].state;
          return acc;
        }, {});
      },
    });
  }

  emit(eventName) {
    const [scope, event] = eventName.split(":");
    const machine = this.transitions[scope];
    machine.emit(event);
    super.emit(eventName);
  }
}
