import { PomodoroTimer } from './timer.js';

const CIRCUMFERENCE = 2 * Math.PI * 104;

const MODE_CONFIG = {
  work:  { label: 'Focus Time',   color: '#FF3B30', rgb: '255, 59, 48',   emoji: '🍅', toast: 'Time for a break!' },
  short: { label: 'Short Break',  color: '#34C759', rgb: '52, 199, 89',   emoji: '☕', toast: 'Back to work!' },
  long:  { label: 'Long Break',   color: '#007AFF', rgb: '0, 122, 255',   emoji: '🌿', toast: 'Refreshed and ready!' },
};

const timer = new PomodoroTimer();

const $ = (id) => document.getElementById(id);

const timeDisplay    = $('timeDisplay');
const timerLabel     = $('timerLabel');
const progressRing   = $('progressRing');
const timerGlow      = $('timerGlow');
const startBtn       = $('startBtn');
const resetBtn       = $('resetBtn');
const skipBtn        = $('skipBtn');
const sessionDots    = $('sessionDots');
const themeToggle    = $('themeToggle');
const modeSelector   = $('modeSelector');
const modeIndicator  = $('modeIndicator');
const completionToast = $('completionToast');
const toastIcon      = $('toastIcon');
const toastTitle     = $('toastTitle');
const toastSub       = $('toastSub');
const workMinutes    = $('workMinutes');
const shortMinutes   = $('shortMinutes');
const longMinutes    = $('longMinutes');

const modeBtns = document.querySelectorAll('.mode-btn');
const stepBtns = document.querySelectorAll('.step-btn');

let toastTimeout = null;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function setAccent(mode) {
  const { color, rgb } = MODE_CONFIG[mode];
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-rgb', rgb);
}

function updateIndicator(index) {
  const btns = [...modeBtns];
  const total = btns.length;
  const width = 100 / total;
  modeIndicator.style.width = `calc(${width}% - 2px)`;
  modeIndicator.style.transform = `translateX(calc(${index * 100}% + ${index * 2}px))`;
}

function updateUI(state) {
  timeDisplay.textContent = formatTime(state.timeRemaining);
  timerLabel.textContent = MODE_CONFIG[state.mode].label;
  startBtn.textContent = state.isRunning ? 'Pause' : 'Start';

  const offset = CIRCUMFERENCE * (1 - state.progress);
  progressRing.style.strokeDashoffset = offset;

  timerGlow.style.background = `radial-gradient(circle at center, rgba(${MODE_CONFIG[state.mode].rgb}, ${state.isRunning ? '0.18' : '0.10'}) 0%, transparent 70%)`;

  renderDots(state.sessions);

  document.title = `${formatTime(state.timeRemaining)} — ${MODE_CONFIG[state.mode].label}`;
}

function renderDots(sessions) {
  const max = 4;
  sessionDots.innerHTML = '';
  for (let i = 0; i < max; i++) {
    const dot = document.createElement('div');
    dot.className = 'session-dot' + (i < sessions % (max + 1) ? ' filled' : '');
    sessionDots.appendChild(dot);
  }
}

function showToast(state) {
  const cfg = MODE_CONFIG[state.mode];
  toastIcon.textContent = cfg.emoji;
  toastTitle.textContent = state.mode === 'work' ? 'Focus Complete!' : 'Break Over!';
  toastSub.textContent = cfg.toast;

  completionToast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => completionToast.classList.remove('show'), 3500);
}

function playBeep(mode) {
  try {
    const ctx = new AudioContext();
    const notes = mode === 'work' ? [659, 784, 988] : [988, 784, 659];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  } catch (_) {}
}

timer.on('update', updateUI);
timer.on('complete', (state) => {
  playBeep(state.mode);
  showToast(state);
});

startBtn.addEventListener('click', () => timer.toggle());
resetBtn.addEventListener('click', () => timer.reset());
skipBtn.addEventListener('click', () => timer.skip());

modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const index = parseInt(btn.dataset.index, 10);
    modeBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    setAccent(btn.dataset.mode);
    updateIndicator(index);
    timer.setMode(btn.dataset.mode);
  });
});

stepBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    const action = btn.dataset.action;
    const current = timer.settings[target];
    const newVal = Math.max(1, Math.min(60, action === 'inc' ? current + 1 : current - 1));
    const displays = { work: workMinutes, short: shortMinutes, long: longMinutes };
    displays[target].textContent = newVal;
    timer.updateSetting(target, newVal);
  });
});

let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  applyTheme();
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  isDark = e.matches;
  applyTheme();
});

progressRing.style.strokeDasharray = CIRCUMFERENCE;
progressRing.style.strokeDashoffset = 0;

applyTheme();
setAccent('work');

const firstBtn = modeBtns[0];
updateIndicator(parseInt(firstBtn.dataset.index, 10));

updateUI(timer.getState());
