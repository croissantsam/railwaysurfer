export type GameState = 'loading' | 'ready' | 'playing' | 'paused' | 'game-over';

export type StateChangeCallback = (newState: GameState, oldState: GameState) => void;

export class StateManager {
  private currentState: GameState = 'loading';
  private listeners: StateChangeCallback[] = [];

  get state(): GameState {
    return this.currentState;
  }

  setState(newState: GameState): void {
    if (this.currentState === newState) return;
    const oldState = this.currentState;
    this.currentState = newState;
    this.listeners.forEach(fn => fn(newState, oldState));
  }

  onStateChange(callback: StateChangeCallback): void {
    this.listeners.push(callback);
  }
}
