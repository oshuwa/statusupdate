// app.js - Main application logic

// DOM Elements
const poemTitleElement = document.getElementById('poem-title');
const poemContentElement = document.getElementById('poem-content');
const poemAuthorElement = document.getElementById('poem-author');
const puzzleQuestionElement = document.getElementById('puzzle-question');
const puzzleAnswerInput = document.getElementById('puzzle-answer');
const submitPuzzleButton = document.getElementById('submit-puzzle');
const puzzleResultElement = document.getElementById('puzzle-result');
const moodButtons = document.querySelectorAll('.mood-btn');
const presentButton = document.getElementById('present-btn');
const lastCheckinTimeElement = document.getElementById('last-checkin-time');
const currentMoodElement = document.getElementById('current-mood');
const calendarContainer = document.getElementById('calendar-container');

// Present button messages rotation
const presentMessages = [
    "Still here, still thinking",
    "Still kicking, still clicking",
    "Present & accounted for",
    "Just checking in"
];
let presentMessageIndex = 0;

// Initialize application
async function initApp() {
    await loadTodayContent();
    setupEventListeners();
    updateCheckinDisplay();
    renderCalendar();
    rotatePresentMessage();
}

// Load today's poem and puzzle from CMS
async function loadTodayContent() {
    try {
        const contentResponse = await fetch('/content/today.json');
        if (!contentResponse.ok) {
            throw new Error('Failed to load content');
        }
        
        const content = await contentResponse.json();
        
        // Update poem
        poemTitleElement.textContent = content.poem.title;
        poemContentElement.textContent = content.poem.content;
        poemAuthorElement.textContent = `— ${content.poem.author}`;
        
        // Update puzzle
        puzzleQuestionElement.textContent = content.puzzle.question;
        
        // Store answer for validation (in a real app, validation would happen server-side)
        window.currentPuzzleAnswer = content.puzzle.answer.toLowerCase();
        
    } catch (error) {
        console.error('Error loading content:', error);
        // Fallback content
        poemTitleElement.textContent = "Sample Poem";
        poemContentElement.textContent = "This is a sample poem\nfor when content cannot load.\nWords flow like water.";
        poemAuthorElement.textContent = "— Sample Poet";
        
        puzzleQuestionElement.textContent = "What comes at the end of a rainbow? (Hint: 3 letters)";
        window.currentPuzzleAnswer = "w";
    }
}

// Set up event listeners
function setupEventListeners() {
    // Puzzle submission
    submitPuzzleButton.addEventListener('click', checkPuzzleAnswer);
    puzzleAnswerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPuzzleAnswer();
        }
    });
    
    // Mood buttons
    moodButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mood = button.getAttribute('data-mood');
            updateCheckin(mood);
        });
    });
    
    // Present button
    presentButton.addEventListener('click', () => {
        updateCheckin('present', presentButton.textContent);
    });
}

// Check the puzzle answer
function checkPuzzleAnswer() {
    const userAnswer = puzzleAnswerInput.value.trim().toLowerCase();
    
    if (userAnswer === window.currentPuzzleAnswer) {
        puzzleResultElement.textContent = 'Correct! Great job!';
        puzzleResultElement.className = 'puzzle-result correct';
        puzzleAnswerInput.value = '';
        
        // Save puzzle completion
        const puzzleData = getLocalData('puzzleCompletions') || {};
        const today = new Date().toISOString().split('T')[0];
        puzzleData[today] = true;
        saveLocalData('puzzleCompletions', puzzleData);
    } else {
        puzzleResultElement.textContent = 'Not quite. Try again!';
        puzzleResultElement.className = 'puzzle-result incorrect';
    }
}

// Update check-in status
function updateCheckin(mood, message = null) {
    const now = new Date();
    const timestamp = now.toISOString();
    const formattedTime = now.toLocaleString();
    
    // Save check-in data
    const checkinData = getLocalData('checkins') || {};
    const today = now.toISOString().split('T')[0];
    
    checkinData[today] = {
        timestamp: timestamp,
        mood: mood,
        message: message || null
    };
    
    saveLocalData('checkins', checkinData);
    saveLocalData('lastCheckin', {
        timestamp: timestamp,
        mood: mood,
        message: message || null
    });
    
    // Update UI
    updateCheckinDisplay();
    renderCalendar();
    
    // Show success message
    alert('Good job! Check-in recorded.');
}

// Update the check-in display
function updateCheckinDisplay() {
    const lastCheckin = getLocalData('lastCheckin');
    
    if (lastCheckin) {
        const checkinDate = new Date(lastCheckin.timestamp);
        lastCheckinTimeElement.textContent = checkinDate.toLocaleString();
        currentMoodElement.textContent = lastCheckin.mood.charAt(0).toUpperCase() + lastCheckin.mood.slice(1);
    } else {
        lastCheckinTimeElement.textContent = 'Never';
        currentMoodElement.textContent = '-';
    }
}

// Render the calendar with check-in history
function renderCalendar() {
    calendarContainer.innerHTML = '';
    
    // Get current date info
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of the month and total days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Add day labels
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayLabels.forEach(day => {
        const dayLabel = document.createElement('div');
        dayLabel.textContent = day;
        dayLabel.className = 'day-label';
        calendarContainer.appendChild(dayLabel);
    });
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarContainer.appendChild(emptyDay);
    }
    
    // Get check-in data
    const checkins = getLocalData('checkins') || {};
    
    // Add days of the month
    for (let i = 1; i <= lastDate; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        // Add day number
        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = i;
        dayCell.appendChild(dayNumber);
        
        // Check if there's a check-in for this day
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (checkins[dateStr]) {
            dayCell.classList.add('checked-in');
            
            // Add mood indicator
            const mood = checkins[dateStr].mood;
            dayCell.style.backgroundColor = getMoodColor(mood);
        }
        
        // Highlight today
        if (i === today.getDate()) {
            dayCell.classList.add('today');
        }
        
        calendarContainer.appendChild(dayCell);
    }
}

// Get color for mood
function getMoodColor(mood) {
    const colors = {
        'good': 'var(--good-color)',
        'better': 'var(--better-color)',
        'best': 'var(--best-color)',
        'present': 'var(--primary-color)'
    };
    
    return colors[mood] || 'var(--success-color)';
}

// Rotate present button message
function rotatePresentMessage() {
    presentButton.textContent = presentMessages[presentMessageIndex];
    presentMessageIndex = (presentMessageIndex + 1) % presentMessages.length;
    
    // Save the current index to keep it consistent across page loads
    saveLocalData('presentMessageIndex', presentMessageIndex);
}

// Helper function to get data from localStorage
function getLocalData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Helper function to save data to localStorage
function saveLocalData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Load any saved state
function loadSavedState() {
    // Restore present message index
    const savedIndex = getLocalData('presentMessageIndex');
    if (savedIndex !== null) {
        presentMessageIndex = savedIndex;
        presentButton.textContent = presentMessages[presentMessageIndex];
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadSavedState();
    initApp();
    
    // Set up interval to rotate present message every few hours
    setInterval(rotatePresentMessage, 3 * 60 * 60 * 1000); // 3 hours
});