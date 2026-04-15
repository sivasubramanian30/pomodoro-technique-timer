export class PomodoroTimer {
  constructor() {
    this.settings = { work: 25, short: 5, long: 15 };
    this.mode = 'work';
    this.timeRemaining = this.settings.work * 60;
    this.totalTime = this.settings.work * 60;
    this.isRunning = false;
    this.interval = null;
    this.sessions = 0;
    this._callbacks = {};
  }

  on(event, cb) {
    this._callbacks[event] = cb;
  }

  _emit(event, data) {
    if (this._callbacks[event]) this._callbacks[event](data);
  }

  getState() {
    return {
      mode: this.mode,
      timeRemaining: this.timeRemaining,
      totalTime: this.totalTime,
      isRunning: this.isRunning,
      sessions: this.sessions,
      settings: { ...this.settings },
      progress: this.totalTime > 0 ? this.timeRemaining / this.totalTime : 0,
    };
  }

  setMode(mode) {
    this._stop();
    this.mode = mode;
    this.timeRemaining = this.settings[mode] * 60;
    this.totalTime = this.settings[mode] * 60;
    this._emit('update', this.getState());
  }

  toggle() {
    this.isRunning ? this._pause() : this._start();
  }

  reset() {
    this._stop();
    this.timeRemaining = this.settings[this.mode] * 60;
    this.totalTime = this.settings[this.mode] * 60;
    this._emit('update', this.getState());
  }

  skip() {
    this._complete();
  }

  updateSetting(target, value) {
    this.settings[target] = value;
    if (this.mode === target) this.reset();
  }

  _start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this._complete();
        return;
      }
      this._emit('update', this.getState());
    }, 1000);
    this._emit('update', this.getState());
  }

  _pause() {
    this.isRunning = false;
    clearInterval(this.interval);
    this.interval = null;
    this._emit('update', this.getState());
  }

  _stop() {
    this.isRunning = false;
    clearInterval(this.interval);
    this.interval = null;
  }

  _complete() {
    this._stop();
    if (this.mode === 'work') this.sessions++;
    this._emit('complete', this.getState());
    this._emit('update', this.getState());
  }
}
