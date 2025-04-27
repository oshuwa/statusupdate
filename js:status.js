// status.js - Status page functionality

// DOM Elements
const statusMoodElement = document.getElementById('status-mood');
const statusTimeElement = document.getElementById('status-time');
const statusMessageElement = document.getElementById('status-message');
const publicCalendarContainer = document.getElementById('public-calendar-container');

// Initialize status page
function initStatusPage() {
    updateStatusDisplay();
    renderPublicCalendar();
    
    // Set up interval to refresh status every minute
    setInterval(updateStatusDisplay, 60 * 1000);
}

// Update the status display
function updateStatusDisplay() {
    const lastCheckin = getLocalData('lastCheckin');
    
    if (lastCheckin) {
        const checkinDate = new Date(lastCheckin.timestamp);
        const timeAgo = getTimeAgo(checkinDate);
        
        statusMoodElement.textContent = lastCheckin.mood.charAt(0).toUpperCase() + lastCheckin.mood.slice(1);
        statusTimeElement.textContent = `Last updated: ${timeAgo} (${checkinDate.toLocaleString()})`;
        
        if (lastCheckin.message) {
            statusMessageElement.textContent = `"${lastCheckin.message}"`;
        } else {
            statusMessageElement.textContent = '';
        }
        
        // Set color based on mood
        statusMoodElement.style.color = getMoodColor(lastCheckin.mood);
    } else {
        statusMoodElement.textContent = 'No check-ins yet';
        statusTimeElement.textContent = 'Last updated: Never';
        statusMessageElement.textContent = '';
    }
}

// Calculate time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
        return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
        return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
    } else if (diffMin > 0) {
        return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    } else {
        return 'just now';
    }
}

// Render the public calendar with check-in history
function renderPublicCalendar() {
    publicCalendarContainer.innerHTML = '';
    
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
        publicCalendarContainer.appendChild(dayLabel);
    });
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        publicCalendarContainer.appendChild(emptyDay);
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
        
        publicCalendarContainer.appendChild(dayCell);
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

// Helper function to get data from localStorage
function getLocalData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initStatusPage);