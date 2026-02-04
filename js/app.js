
// DOM Elements
const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const composeBtn = document.getElementById('compose-btn');
const composeModal = document.getElementById('compose-modal');
const closeModal = document.getElementById('close-modal');
const navItems = document.querySelectorAll('.nav-item');
const pageHeader = document.getElementById('page-header');
const contentArea = document.getElementById('content-area');

// 1. Check Auth
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    userEmailEl.innerText = session.user.email;
}
init();

// 2. Logout
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// 3. Modal
composeBtn.addEventListener('click', () => {
    composeModal.classList.remove('hidden');
});
closeModal.addEventListener('click', () => {
    composeModal.classList.add('hidden');
});
window.addEventListener('click', (e) => {
    if (e.target === composeModal) composeModal.classList.add('hidden');
});

// 4. Navigation (Simple SPA feel)
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove active class
        navItems.forEach(nav => nav.classList.remove('active'));
        // Add to clicked
        item.classList.add('active'); // Note: dealing with icon click propagation might need care
        const page = item.getAttribute('data-page');
        loadPage(page);
    });
});

function loadPage(page) {
    // This is where you would fetch data or swap innerHTML
    if (page === 'home') {
        pageHeader.innerText = 'Overview';
        // Show stats grid...
    } else if (page === 'calendar') {
        pageHeader.innerText = 'Calendar';
        // contentArea.innerHTML = 'Calendar View Coming Soon...';
    } else if (page === 'accounts') {
        pageHeader.innerText = 'Connected Accounts';
        // contentArea.innerHTML = 'Account List...';
    } else if (page === 'settings') {
        pageHeader.innerText = 'Settings';
    }
}
