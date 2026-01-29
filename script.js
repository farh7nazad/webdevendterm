// Global variables to store application state
let habits = [];
let weeklyData = {};
let dailyHabits = {};
let currentDate = new Date();

// Initialize the application when page loads
function init() {
    displayCurrentDate();
    loadHabitsFromStorage();
    loadWeeklyDataFromStorage();
    loadDailyHabitsFromStorage();
    renderHabits();
    updateProgress();
    renderWeeklyOverview();
    checkAndResetStreaks();
    setupModalHandlers();
}

// Display current date in header
function displayCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = currentDate.toLocaleDateString('en-US', options);
    document.getElementById('dateDisplay').textContent = dateString;
}

// Load habits from localStorage
function loadHabitsFromStorage() {
    const storedHabits = localStorage.getItem('habits');
    if (storedHabits) {
        habits = JSON.parse(storedHabits);
    } else {
        habits = [];
    }
}

// Save habits to localStorage
function saveHabitsToStorage() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

// Load weekly data from localStorage
function loadWeeklyDataFromStorage() {
    const storedWeeklyData = localStorage.getItem('weeklyData');
    if (storedWeeklyData) {
        weeklyData = JSON.parse(storedWeeklyData);
    } else {
        weeklyData = {};
    }
}

// Save weekly data to localStorage
function saveWeeklyDataToStorage() {
    localStorage.setItem('weeklyData', JSON.stringify(weeklyData));
}

// Load daily habits from localStorage
function loadDailyHabitsFromStorage() {
    const storedDailyHabits = localStorage.getItem('dailyHabits');
    if (storedDailyHabits) {
        dailyHabits = JSON.parse(storedDailyHabits);
    } else {
        dailyHabits = {};
    }
}

// Save daily habits to localStorage
function saveDailyHabitsToStorage() {
    localStorage.setItem('dailyHabits', JSON.stringify(dailyHabits));
}

// Update weekly data for today
function updateWeeklyData() {
    const today = getCurrentDateString();
    const totalHabits = habits.length;
    const completedHabits = habits.filter(function(h) {
        return h.completed;
    }).length;

    weeklyData[today] = {
        total: totalHabits,
        completed: completedHabits
    };

    saveWeeklyDataToStorage();
}

// Save current day's habits snapshot
function saveDailyHabitsSnapshot() {
    const today = getCurrentDateString();
    
    // Create a snapshot of today's habits
    const snapshot = habits.map(function(habit) {
        return {
            name: habit.name,
            completed: habit.completed,
            streak: habit.streak
        };
    });

    dailyHabits[today] = snapshot;
    saveDailyHabitsToStorage();
}

// Add new habit
document.getElementById('addHabitForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const habitInput = document.getElementById('habitInput');
    const habitName = habitInput.value.trim();
    const errorMessage = document.getElementById('errorMessage');
    
    // Validate input
    if (habitName === '') {
        errorMessage.textContent = '⚠️ Please enter a habit name';
        errorMessage.style.display = 'block';
        return;
    }
    
    if (habitName.length < 3) {
        errorMessage.textContent = '⚠️ Habit name must be at least 3 characters';
        errorMessage.style.display = 'block';
        return;
    }
    
    // Create new habit object
    const newHabit = {
        id: Date.now(),
        name: habitName,
        completed: false,
        streak: 0,
        lastCompletedDate: null,
        createdDate: getCurrentDateString()
    };
    
    // Add to habits array
    habits.push(newHabit);
    
    // Save to localStorage
    saveHabitsToStorage();
    updateWeeklyData();
    saveDailyHabitsSnapshot();
    
    // Clear input and error
    habitInput.value = '';
    errorMessage.style.display = 'none';
    
    // Re-render
    renderHabits();
    updateProgress();
    renderWeeklyOverview();
});

// Render all habits in the DOM
function renderHabits() {
    const habitsList = document.getElementById('habitsList');
    
    // Clear existing content
    habitsList.innerHTML = '';
    
    // Check if there are no habits
    if (habits.length === 0) {
        habitsList.innerHTML = `
            <div class="empty-state">
                No habits yet. Add your first healthy habit above! 🎯
            </div>
        `;
        return;
    }
    
    // Render each habit
    habits.forEach(function(habit) {
        const habitItem = document.createElement('div');
        habitItem.className = 'habit-item';
        
        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'habit-checkbox';
        checkbox.checked = habit.completed;
        checkbox.addEventListener('change', function() {
            toggleHabitCompletion(habit.id);
        });
        
        // Create habit details
        const habitDetails = document.createElement('div');
        habitDetails.className = 'habit-details';
        
        const habitName = document.createElement('div');
        habitName.className = 'habit-name';
        habitName.textContent = habit.name;
        
        const habitStreak = document.createElement('div');
        habitStreak.className = 'habit-streak';
        habitStreak.textContent = `🔥 ${habit.streak} day streak`;
        
        habitDetails.appendChild(habitName);
        habitDetails.appendChild(habitStreak);
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', function() {
            deleteHabit(habit.id);
        });
        
        // Assemble habit item
        habitItem.appendChild(checkbox);
        habitItem.appendChild(habitDetails);
        habitItem.appendChild(deleteBtn);
        
        habitsList.appendChild(habitItem);
    });
}

// Toggle habit completion status
function toggleHabitCompletion(habitId) {
    // Find the habit
    const habit = habits.find(function(h) {
        return h.id === habitId;
    });
    
    if (!habit) return;
    
    // Toggle completion
    habit.completed = !habit.completed;
    
    // Update streak
    if (habit.completed) {
        const today = getCurrentDateString();
        const yesterday = getYesterdayDateString();
        
        // Check if completed yesterday
        if (habit.lastCompletedDate === yesterday) {
            habit.streak += 1;
        } else if (habit.lastCompletedDate === today) {
            // Already completed today, don't change streak
        } else {
            habit.streak = 1;
        }
        
        habit.lastCompletedDate = today;
    }
    
    // Save and re-render
    saveHabitsToStorage();
    updateWeeklyData();
    saveDailyHabitsSnapshot();
    renderHabits();
    updateProgress();
    renderWeeklyOverview();
}

// Delete a habit
function deleteHabit(habitId) {
    // Confirm deletion
    const confirmDelete = confirm('Are you sure you want to delete this habit?');
    
    if (!confirmDelete) return;
    
    // Filter out the habit
    habits = habits.filter(function(h) {
        return h.id !== habitId;
    });
    
    // Save and re-render
    saveHabitsToStorage();
    updateWeeklyData();
    saveDailyHabitsSnapshot();
    renderHabits();
    updateProgress();
    renderWeeklyOverview();
}

// Update progress bar and motivation message
function updateProgress() {
    const progressBar = document.getElementById('progressBar');
    const motivationMessage = document.getElementById('motivationMessage');
    
    // Calculate completion percentage
    const totalHabits = habits.length;
    
    if (totalHabits === 0) {
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
        motivationMessage.textContent = 'Start your journey today! 💪';
        return;
    }
    
    const completedHabits = habits.filter(function(h) {
        return h.completed;
    }).length;
    
    const percentage = Math.round((completedHabits / totalHabits) * 100);
    
    // Update progress bar
    progressBar.style.width = percentage + '%';
    progressBar.textContent = percentage + '%';
    
    // Update motivation message
    if (percentage === 0) {
        motivationMessage.textContent = 'Let\'s get started! You can do this! 💪';
    } else if (percentage < 50) {
        motivationMessage.textContent = 'Good start! Keep going! 🌱';
    } else if (percentage < 100) {
        motivationMessage.textContent = 'Almost there! You\'re doing great! 🌟';
    } else {
        motivationMessage.textContent = 'Perfect day! You\'re a superstar! 🎉';
    }
}

// Render weekly overview with actual historical data
function renderWeeklyOverview() {
    const weeklyGrid = document.getElementById('weeklyGrid');
    weeklyGrid.innerHTML = '';
    
    // Get last 7 days
    const last7Days = getLast7Days();
    const todayString = getCurrentDateString();
    
    last7Days.forEach(function(dateInfo) {
        const dayBox = document.createElement('div');
        dayBox.className = 'day-box';
        
        // Add 'today' class if it's today
        if (dateInfo.dateString === todayString) {
            dayBox.className += ' today';
        }
        
        const dayName = document.createElement('div');
        dayName.className = 'day-name';
        dayName.textContent = dateInfo.dayName;
        
        const dayDate = document.createElement('div');
        dayDate.className = 'day-date';
        dayDate.textContent = dateInfo.displayDate;
        
        const dayStatus = document.createElement('div');
        dayStatus.className = 'day-status';
        
        // Check if we have data for this day
        const dayData = weeklyData[dateInfo.dateString];
        
        if (!dayData || dayData.total === 0) {
            dayStatus.textContent = '⚪';
        } else if (dayData.completed === dayData.total) {
            dayStatus.textContent = '✅';
        } else if (dayData.completed > 0) {
            dayStatus.textContent = '🟡';
        } else {
            dayStatus.textContent = '❌';
        }
        
        dayBox.appendChild(dayName);
        dayBox.appendChild(dayDate);
        dayBox.appendChild(dayStatus);
        
        // Add click event to show modal
        dayBox.addEventListener('click', function() {
            showDayModal(dateInfo.dateString, dateInfo.dayName, dateInfo.displayDate);
        });
        
        weeklyGrid.appendChild(dayBox);
    });
}

// Show modal with day details
function showDayModal(dateString, dayName, displayDate) {
    const modal = document.getElementById('dayModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalProgressBar = document.getElementById('modalProgressBar');
    const modalProgressText = document.getElementById('modalProgressText');
    const modalHabitsList = document.getElementById('modalHabitsList');
    
    // Set title
    modalTitle.textContent = `${dayName}, ${displayDate}`;
    
    // Get data for this day
    const dayData = weeklyData[dateString];
    const dayHabits = dailyHabits[dateString];
    
    // Clear previous habits list
    modalHabitsList.innerHTML = '';
    
    // Check if we have data
    if (!dayData || !dayHabits || dayHabits.length === 0) {
        modalProgressBar.style.width = '0%';
        modalProgressBar.textContent = '0%';
        modalProgressText.textContent = 'No habits tracked on this day.';
        modalHabitsList.innerHTML = '<div class="no-data-message">No habit data available for this day 📅</div>';
    } else {
        // Calculate and display progress
        const percentage = dayData.total > 0 ? Math.round((dayData.completed / dayData.total) * 100) : 0;
        modalProgressBar.style.width = percentage + '%';
        modalProgressBar.textContent = percentage + '%';
        modalProgressText.textContent = `${dayData.completed} out of ${dayData.total} habits completed`;
        
        // Display habits
        dayHabits.forEach(function(habit) {
            const habitItem = document.createElement('div');
            habitItem.className = 'modal-habit-item';
            
            const habitIcon = document.createElement('div');
            habitIcon.className = 'modal-habit-icon';
            habitIcon.textContent = habit.completed ? '✅' : '❌';
            
            const habitName = document.createElement('div');
            habitName.className = 'modal-habit-name';
            habitName.textContent = habit.name;
            
            const habitStreak = document.createElement('div');
            habitStreak.className = 'habit-streak';
            habitStreak.textContent = `🔥 ${habit.streak}`;
            
            habitItem.appendChild(habitIcon);
            habitItem.appendChild(habitName);
            habitItem.appendChild(habitStreak);
            
            modalHabitsList.appendChild(habitItem);
        });
    }
    
    // Show modal
    modal.style.display = 'block';
}

// Setup modal event handlers
function setupModalHandlers() {
    const modal = document.getElementById('dayModal');
    const closeBtn = document.getElementById('closeModal');
    
    // Close button click
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Get last 7 days with proper date information
function getLast7Days() {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        
        const dateString = formatDateString(date);
        const dayName = dayNames[date.getDay()];
        const displayDate = (date.getMonth() + 1) + '/' + date.getDate();
        
        days.push({
            dateString: dateString,
            dayName: dayName,
            displayDate: displayDate
        });
    }
    
    return days;
}

// Format date object to string (YYYY-MM-DD)
function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Check and reset streaks if needed
function checkAndResetStreaks() {
    const today = getCurrentDateString();
    const yesterday = getYesterdayDateString();
    
    habits.forEach(function(habit) {
        // Reset completion status for new day
        const lastCompleted = habit.lastCompletedDate;
        
        if (lastCompleted !== today) {
            habit.completed = false;
            
            // Reset streak if not completed yesterday
            if (lastCompleted !== yesterday) {
                habit.streak = 0;
            }
        }
    });
    
    saveHabitsToStorage();
}

// Helper function to get current date as string
function getCurrentDateString() {
    return formatDateString(currentDate);
}

// Helper function to get yesterday's date as string
function getYesterdayDateString() {
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDateString(yesterday);
}

// Initialize app when DOM is loaded
init();