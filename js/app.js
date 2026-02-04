
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

// 3. Modal & Posting Logic
// 3. Modal & Media Logic
const postTitleEl = document.getElementById('post-title');
const postContentEl = document.getElementById('post-content');
const postHashtagsEl = document.getElementById('post-hashtags'); 
const postSubmitBtn = document.getElementById('post-now-btn');
const platformChecklist = document.getElementById('platform-checklist');
const scheduleToggle = document.getElementById('schedule-toggle');
const scheduleDateEl = document.getElementById('schedule-datetime');
const mediaInput = document.getElementById('media-upload');
const mediaPreview = document.getElementById('media-preview');

// Open Modal & Load Accounts
composeBtn.addEventListener('click', async () => { /* ... existing fetch logic ... */ 
    composeModal.classList.remove('hidden');
    platformChecklist.innerHTML = '<span class="text-muted text-xs">Loading...</span>';
    const { data: accounts } = await supabaseClient.from('social_accounts').select('*');
    if(!accounts || accounts.length === 0) {
        platformChecklist.innerHTML = '<span class="text-danger text-xs">No accounts connected.</span>';
        return;
    }
    platformChecklist.innerHTML = '';
    accounts.forEach(acc => {
        const id = `chk-${acc.id}`;
        // Platform Pill Design (like reference image)
        const platformClass = acc.platform.toLowerCase();
        const html = `
            <label class="platform-pill ${platformClass} active" data-id="${acc.id}">
                <input type="checkbox" value="${acc.id}" checked class="platform-checkbox" style="display:none;">
                <i data-feather="${acc.platform}" style="width:16px; height:16px;"></i>
                <span>${acc.account_name}</span>
            </label>
        `;
        platformChecklist.insertAdjacentHTML('beforeend', html);
    });
    
    // Add click toggle for pills
    document.querySelectorAll('.platform-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const checkbox = pill.querySelector('input');
            checkbox.checked = !checkbox.checked;
            pill.classList.toggle('active', checkbox.checked);
            pill.classList.toggle('inactive', !checkbox.checked);
        });
    });
    
    feather.replace();
});

// Close
closeModal.addEventListener('click', () => composeModal.classList.add('hidden'));
window.addEventListener('click', (e) => { if (e.target === composeModal) composeModal.classList.add('hidden'); });

// Media Preview
mediaInput.addEventListener('change', (e) => {
    mediaPreview.innerHTML = '';
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const isVideo = file.type.startsWith('video');
            const mediaHtml = isVideo 
                ? `<video src="${ev.target.result}" style="height:60px; border-radius:4px;"></video>`
                : `<img src="${ev.target.result}" style="height:60px; border-radius:4px;">`;
            mediaPreview.insertAdjacentHTML('beforeend', mediaHtml);
        };
        reader.readAsDataURL(file);
    });
});

// Helper: Upload to Supabase Storage
async function uploadToStorage(file) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabaseClient.storage
        .from('post_media')
        .upload(fileName, file);

    if (error) throw error;
    
    // Get Public URL
    const { data: { publicUrl } } = supabaseClient.storage
        .from('post_media')
        .getPublicUrl(fileName);
        
    return publicUrl;
}

// HANDLE SUBMISSION
postSubmitBtn.addEventListener('click', async () => {
    const title = postTitleEl.value;
    const content = postContentEl.value;
    const hashtags = postHashtagsEl.value;
    const isScheduled = scheduleToggle.checked;
    const files = mediaInput.files;
    const fullMessage = `${content}\n\n${hashtags}`;

    if(!content && files.length === 0) return alert("Write something or add media!");

    const checkboxes = document.querySelectorAll('.platform-checkbox:checked');
    if(checkboxes.length === 0) return alert("Select at least one platform.");
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    postSubmitBtn.innerText = "Processing...";

    try {
        // 1. Upload Media if present
        let mediaUrls = [];
        if (files.length > 0) {
            postSubmitBtn.innerText = "Uploading Media...";
            for (const file of files) {
                const url = await uploadToStorage(file);
                mediaUrls.push(url);
            }
        }

        // 2. Fetch Accounts
        const { data: accounts } = await supabaseClient
            .from('social_accounts')
            .select('*')
            .in('id', selectedIds);

        // 3. IF SCHEDULED -> Save DB
        if(isScheduled) {
            const dateVal = scheduleDateEl.value;
            if(!dateVal) throw new Error("Pick a date!");
            
            await supabaseClient.from('posts').insert({
                user_id: (await supabaseClient.auth.getUser()).data.user.id,
                content: fullMessage,
                media_urls: mediaUrls,
                scheduled_time: new Date(dateVal).toISOString(),
                status: 'scheduled'
            });
            alert("Scheduled successfully!");
            composeModal.classList.add('hidden');
            postSubmitBtn.innerText = "Schedule Post";
            return;
        }

        // 4. POST NOW -> Loop
        postSubmitBtn.innerText = "Posting...";
        let successCount = 0;
        
        for (const page of accounts) {
            if(page.platform === 'facebook') {
                await new Promise((resolve) => {
                    const endpoint = mediaUrls.length > 0 ? `/${page.platform_account_id}/photos` : `/${page.platform_account_id}/feed`;
                    const payload = { access_token: page.access_token };
                    
                    if(mediaUrls.length > 0) {
                        payload.url = mediaUrls[0]; // FB Graph API handles 1 photo simply this way
                        payload.caption = fullMessage;
                    } else {
                        payload.message = fullMessage;
                    }

                    FB.api(endpoint, 'POST', payload, function(resp) {
                        if (resp && !resp.error) {
                            successCount++; 
                            console.log("Success FB:", resp);
                        } else {
                            console.error("FB Error:", resp);
                            alert(`Error on ${page.account_name}: ` + (resp ? resp.error.message : 'Unknown'));
                        }
                        resolve();
                    });
                });
            }
        }

        if(successCount > 0) {
            alert(`Posted to ${successCount} accounts!`);
            composeModal.classList.add('hidden');
            // Reset
            postContentEl.value = '';
            mediaPreview.innerHTML = '';
            mediaInput.value = '';
        }

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        postSubmitBtn.innerText = isScheduled ? "Schedule Post" : "Post Now";
    }
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

async function loadPage(page) {
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
        contentArea.innerHTML = '<p class="text-muted">Loading accounts...</p>';

        // Fetch Accounts
        const { data: accounts } = await supabaseClient.from('social_accounts').select('*');
        const fbAccount = accounts ? accounts.find(a => a.platform === 'facebook') : null;

        // Render Code
        const fbButton = fbAccount 
            ? `<button class="btn btn-outline-danger" style="width:100%; border-color: #ff4d4d; color:#ff4d4d;" onclick="disconnectAccount('${fbAccount.id}')">Disconnect</button>` 
            : `<button class="btn btn-primary" style="width:100%" onclick="connectFacebook()">Connect</button>`;
        
        const fbStatus = fbAccount 
            ? `<span style="color:#4ade80; font-size:0.8rem;">● Connected as ${fbAccount.account_name}</span>`
            : `<p class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.9rem;">Connect your business page</p>`;

        contentArea.innerHTML = `
            <div class="accounts-grid">
                <!-- Facebook -->
                <div class="account-card">
                    <div class="platform-icon facebook"><i data-feather="facebook"></i></div>
                    <h3 class="text-lg">Facebook Page</h3>
                    ${fbStatus}
                    <div style="margin-top:1rem">${fbButton}</div>
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
        // remove setTimeout(attachConnectListeners, 500); as we use inline onclick now
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
                    // Save ALL pages found in the response
                    let addedCount = 0;
                    const promises = pageResponse.data.map(page => 
                        saveAccountToSupabase('facebook', page.id, page.name, page.access_token)
                    );
                    
                    Promise.all(promises).then(() => {
                         alert("Successfully connected/updated your pages!");
                         loadPage('accounts');
                    });

                } else {
                    alert("No Facebook Pages found. \n\n1. Do you have a Page? \n2. Did you select it in the popup? \n3. Did you add 'pages_show_list' to the App Dashboard?");
                }
            });
        } else {
            console.log('User cancelled login or did not fully authorize.');
        }
    }, {scope: 'pages_show_list,pages_read_engagement,pages_manage_posts'});
}

// 4. Save to Supabase (Upsert Logic)
async function saveAccountToSupabase(platform, accountId, name, token) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // Check if exists
    const { data: existing } = await supabaseClient
        .from('social_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .eq('platform_account_id', accountId)
        .maybeSingle();

    if (existing) {
        // Update Token if needed
        const { error } = await supabaseClient
            .from('social_accounts')
            .update({ 
                access_token: token,
                account_name: name 
            })
            .eq('id', existing.id);
            
        if(error) console.error("Error updating:", error);
    } else {
        // Insert New
        const { error } = await supabaseClient
            .from('social_accounts')
            .insert({
                user_id: user.id,
                platform: platform,
                platform_account_id: accountId,
                account_name: name,
                access_token: token
            });

        if(error) console.error("Error inserting:", error);
    }
}

// 5. Attach Listener
// 6. Connect Logic (Global for onclick)
window.connectFacebook = connectFacebook; 

// 7. Disconnect Logic
window.disconnectAccount = async function(id) {
    if(!confirm("Are you sure you want to disconnect this account?")) return;

    const { error } = await supabaseClient
        .from('social_accounts')
        .delete()
        .eq('id', id);

    if(error) {
        alert("Error disconnecting: " + error.message);
    } else {
        alert("Account disconnected.");
        loadPage('accounts'); // Refresh
    }
};
