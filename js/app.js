
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
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    userEmailEl.innerText = session.user.email;
    loadPage('home'); // Default Load
}
init();

// 2. Logout
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
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
        item.classList.add('active'); 
        const page = item.getAttribute('data-page');
        loadPage(page);
    });
});

function loadPage(page) {
    contentArea.innerHTML = ''; // Clear current content

    if (page === 'home') {
        pageHeader.innerText = 'Overview';
        contentArea.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card glass-card">
                    <p class="text-muted">Scheduled</p>
                    <h3 class="text-2xl">0</h3>
                </div>
                <div class="stat-card glass-card">
                    <p class="text-muted">Published</p>
                    <h3 class="text-2xl">0</h3>
                </div>
                <div class="stat-card glass-card">
                    <p class="text-muted">Connected</p>
                    <h3 class="text-2xl">0</h3>
                </div>
            </div>
            <div class="mt-4 glass-card" style="margin-top: 2rem;">
                <h3 class="text-lg" style="margin-bottom: 1rem;">Recent Activity</h3>
                <p class="text-muted">No posts found.</p>
            </div>
        `;
        feather.replace();
    } 
    else if (page === 'calendar') {
        pageHeader.innerText = 'Calendar';
        let daysHtml = '';
        for(let i=1; i<=31; i++) {
            daysHtml += `
                <div class="calendar-day">
                    <span style="font-size:0.8rem; color:var(--text-muted);">${i}</span>
                    ${i === 15 ? '<div class="post-pill">🚀 Launch Post</div>' : ''}
                </div>
            `;
        }

        contentArea.innerHTML = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <h3 class="text-xl">October 2023</h3>
                    <div class="flex gap-2">
                        <button class="btn btn-ghost"><i data-feather="chevron-left"></i></button>
                        <button class="btn btn-ghost"><i data-feather="chevron-right"></i></button>
                    </div>
                </div>
                <div class="calendar-grid">
                    <div class="calendar-day-header">Sun</div>
                    <div class="calendar-day-header">Mon</div>
                    <div class="calendar-day-header">Tue</div>
                    <div class="calendar-day-header">Wed</div>
                    <div class="calendar-day-header">Thu</div>
                    <div class="calendar-day-header">Fri</div>
                    <div class="calendar-day-header">Sat</div>
                    ${daysHtml}
                </div>
            </div>
        `;
        feather.replace();
    } 
    else if (page === 'accounts') {
        pageHeader.innerText = 'Connected Accounts';
        contentArea.innerHTML = `
            <div class="accounts-grid">
                <!-- Facebook -->
                <div class="account-card">
                    <div class="platform-icon facebook"><i data-feather="facebook"></i></div>
                    <h3 class="text-lg">Facebook Page</h3>
                    <p class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.9rem;">Connect your business page</p>
                    <button class="btn btn-primary" style="width:100%">Connect</button>
                </div>
                <!-- LinkedIn -->
                <div class="account-card">
                    <div class="platform-icon linkedin"><i data-feather="linkedin"></i></div>
                    <h3 class="text-lg">LinkedIn</h3>
                    <p class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.9rem;">Connect personal or company</p>
                    <button class="btn btn-primary" style="width:100%">Connect</button>
                </div>
                <!-- Instagram -->
                <div class="account-card">
                    <div class="platform-icon instagram"><i data-feather="instagram"></i></div>
                    <h3 class="text-lg">Instagram</h3>
                    <p class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.9rem;">Business accounts only</p>
                    <button class="btn btn-ghost" style="width:100%; border:1px solid var(--border)">Coming Soon</button>
                </div>
                 <!-- Twitter -->
                <div class="account-card">
                    <div class="platform-icon twitter"><i data-feather="twitter"></i></div>
                    <h3 class="text-lg">X (Twitter)</h3>
                    <p class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.9rem;">Post tweets & threads</p>
                    <button class="btn btn-ghost" style="width:100%; border:1px solid var(--border)">Coming Soon</button>
                </div>
            </div>
        `;
        feather.replace();
        setTimeout(attachConnectListeners, 500);
    } 
    else if (page === 'settings') {
        pageHeader.innerText = 'Settings';
        contentArea.innerHTML = `
            <div class="glass-card" style="max-width:600px">
                <h3 class="text-lg" style="margin-bottom:1rem">Account Preferences</h3>
                <div class="input-group">
                    <label>Full Name</label>
                    <input type="text" class="input-field" value="User">
                </div>
                 <div class="input-group">
                    <label>Timezone</label>
                    <select class="input-field" style="background:var(--surface)">
                        <option>UTC (GMT+0)</option>
                        <option>EST (GMT-5)</option>
                    </select>
                </div>
                <button class="btn btn-primary">Save Changes</button>
            </div>
        `;
    }
}

// ==========================================
// FACEBOOK INTEGRATION
// ==========================================
const FB_APP_ID = '1224235172595614'; // PostOnce App ID (Updated) 

// 1. Initialize SDK
window.fbAsyncInit = function() {
    FB.init({
      appId      : FB_APP_ID,
      cookie     : true,
      xfbml      : true,
      version    : 'v18.0'
    });
};

// 2. Load SDK asynchronously
(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// 3. Connect Logic
function connectFacebook() {
    if(FB_APP_ID === 'YOUR_APP_ID_HERE') {
        alert("Please set your Facebook App ID in js/app.js");
        return;
    }

    FB.login(function(response) {
        if (response.authResponse) {
            console.log('Welcome! Fetching your information.... ');
            // Now get the Pages
            // Now get the Pages with specific fields
            FB.api('/me/accounts?fields=name,access_token,id', function(pageResponse) {
                console.log("Page Response:", pageResponse); // For debugging
                
                // 1. Check for API Error
                if (pageResponse.error) {
                    alert("Facebook Permission Error: " + pageResponse.error.message + "\n\nPlease ensure you granted 'pages_show_list' permission.");
                    return;
                }

                // 2. Check for Data
                if(pageResponse.data && pageResponse.data.length > 0) {
                    // Save first page found (MVP)
                    const page = pageResponse.data[0]; 
                    saveAccountToSupabase('facebook', page.id, page.name, page.access_token);
                } else {
                    alert("No Facebook Pages found. \n\n1. Do you have a Page? \n2. Did you select it in the popup? \n3. Did you add 'pages_show_list' to the App Dashboard?");
                }
            });
        } else {
            console.log('User cancelled login or did not fully authorize.');
        }
    }, {scope: 'pages_show_list,pages_read_engagement,pages_manage_posts'});
}

// 4. Save to Supabase
async function saveAccountToSupabase(platform, accountId, name, token) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const { error } = await supabaseClient
        .from('social_accounts')
        .insert({
            user_id: user.id,
            platform: platform,
            platform_account_id: accountId,
            account_name: name,
            access_token: token // Note: In production, encrypt this before sending!
        });

    if(error) {
        console.error('Error saving account:', error);
        alert("Error connecting account: " + error.message);
    } else {
        alert("Successfully connected: " + name);
        loadPage('accounts'); // Refresh UI to show connected state (logic to be added)
    }
}

// 5. Attach Listener
function attachConnectListeners() {
    // Find the Facebook "Connect" button
    // It's in the first .account-card
    const fbCard = document.querySelector('.account-card'); 
    if(fbCard) {
        const btn = fbCard.querySelector('.btn-primary');
        if(btn) {
            btn.onclick = connectFacebook; // direct attach
        }
    }
}
