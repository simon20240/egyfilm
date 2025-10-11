// Professional Dark Mode Logic

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Function to apply the theme
    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        // Update the icon based on the theme
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        }
    };

    // Function to toggle the theme
    const toggleTheme = () => {
        const currentTheme = htmlElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    };

    // Add click event listener to the toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // --- Initial Theme ---
    // 1. Check for a saved theme in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // 2. If no saved theme, check for the OS preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            applyTheme('dark');
        } else {
            applyTheme('light'); // Default to light if no preference
        }
    }
});