// Type definitions for @rook2pawn/picostate
// Minimal declaration file to satisfy TypeScript consumers.

export class PicoBus {
  emit(eventName: string, payload?: any): void;
  on(eventName: string, listener: (...args: any[]) => void): this;
}

export type Transitions = Record<string, Record<string, string>>;

export type GuardResult = boolean | { ok: boolean; reason?: string };

export class PicoState extends PicoBus {
  state: string;
  transitions: Transitions;
  constructor(initialState: string, transitions: Transitions);
  emit(eventName: string, payload?: any): void;
  onchange(cb: (nextState: string, prevState: string) => void): void;
  guard(eventName: string, conditionFn: () => GuardResult): void;
  event(eventName: string, subMachine: PicoState): void;
  static parallel(stateMap: Record<string, PicoState>): ParallelState;
}

export class ParallelState extends PicoBus {
  readonly transitions: Record<string, PicoState>;
  constructor(transitions: Record<string, PicoState>);
  readonly state: Record<string, string>;
  emit(eventName: string): void;
}

export default PicoState;
