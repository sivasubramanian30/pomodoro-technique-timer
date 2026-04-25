const body = document.body;
const timeLeftDisplay = document.getElementById('time-left');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const nextBtn = document.getElementById('next-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const themeBtn = document.getElementById('theme-btn');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsModal = document.getElementById('settings-modal');
const saveSettingsBtn = document.getElementById('save-settings');
const alarmSound = document.getElementById('alarm-sound');

// Inputs
const pomodoroInput = document.getElementById('pomodoro-time');
const shortBreakInput = document.getElementById('short-break-time');
const longBreakInput = document.getElementById('long-break-time');

// Default Durations (in minutes)
let durations = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
};

// State
let currentMode = 'pomodoro'; // 'pomodoro', 'shortBreak', 'longBreak'
let timerInterval = null;
let remainingSeconds = durations[currentMode] * 60;
let isRunning = false;
let pomodoroCount = 0;
let isDarkTheme = false;

// Format Time (MM:SS)
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Update Display
function updateDisplay() {
    timeLeftDisplay.textContent = formatTime(remainingSeconds);
    // Update document title for background tracking
    document.title = `${formatTime(remainingSeconds)} - ${getModeName()}`;
}

// Get user-friendly mode name
function getModeName() {
    if (currentMode === 'pomodoro') return 'Work';
    if (currentMode === 'shortBreak') return 'Short Break';
    return 'Long Break';
}

// Set Mode
function setMode(mode) {
    // Stop any running timer
    stopTimer();
    
    // Update State
    currentMode = mode;
    remainingSeconds = durations[mode] * 60;
    
    // Update UI Buttons
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update Body Classes for Theme
    body.className = `mode-${mode} ${isDarkTheme ? 'theme-dark' : 'theme-light'}`;
    
    // Update Display
    updateDisplay();
}

// Next Mode Logic
function goToNextMode() {
    if (currentMode === 'pomodoro') {
        pomodoroCount++;
        // Every 4 pomodoros, take a long break
        if (pomodoroCount % 4 === 0) {
            setMode('longBreak');
        } else {
            setMode('shortBreak');
        }
    } else {
        // If coming from a break, go back to work
        setMode('pomodoro');
    }
}

// Theme Toggle
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    body.className = `mode-${currentMode} ${isDarkTheme ? 'theme-dark' : 'theme-light'}`;
    
    // Update icon
    if (isDarkTheme) {
        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

// Timer Logic
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'block';
    
    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();
        
        if (remainingSeconds <= 0) {
            timerFinished();
        }
    }, 1000);
}

function stopTimer() {
    if (!isRunning) return;
    
    isRunning = false;
    clearInterval(timerInterval);
    startBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
}

function resetTimer() {
    stopTimer();
    remainingSeconds = durations[currentMode] * 60;
    updateDisplay();
}

function timerFinished() {
    stopTimer();
    
    // Play sound
    alarmSound.play().catch(e => console.log("Audio play prevented by browser policy", e));
    
    // Auto-switch modes when finished
    goToNextMode();
}

// Modal Logic
function openSettings() {
    // Populate inputs with current durations
    pomodoroInput.value = durations.pomodoro;
    shortBreakInput.value = durations.shortBreak;
    longBreakInput.value = durations.longBreak;
    
    settingsModal.classList.remove('hidden');
}

function closeSettings() {
    settingsModal.classList.add('hidden');
}

function saveSettings() {
    // Get values, ensuring they are numbers and > 0
    const pTime = Math.max(1, parseInt(pomodoroInput.value) || 25);
    const sTime = Math.max(1, parseInt(shortBreakInput.value) || 5);
    const lTime = Math.max(1, parseInt(longBreakInput.value) || 15);
    
    // Update durations
    durations.pomodoro = pTime;
    durations.shortBreak = sTime;
    durations.longBreak = lTime;
    
    // If we are resetting the timer for the current mode
    remainingSeconds = durations[currentMode] * 60;
    updateDisplay();
    stopTimer(); // Ensure we stop the timer if it was running
    
    closeSettings();
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);
nextBtn.addEventListener('click', goToNextMode);
themeBtn.addEventListener('click', toggleTheme);

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

settingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
saveSettingsBtn.addEventListener('click', saveSettings);

// Close modal when clicking outside of it
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        closeSettings();
    }
});

// Initialize Display
updateDisplay();
