// Function to load navbar
async function loadNavbar() {
    try {
        const response = await fetch('components/navbar.html');
        const navbarHtml = await response.text();
        document.getElementById('navbar-container').innerHTML = navbarHtml;
        
        // Set active state based on current page
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage) {
                link.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Error loading navbar:', error);
    }
}

// Load navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', loadNavbar); 