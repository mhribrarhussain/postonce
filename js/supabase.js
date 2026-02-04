
// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
// You need to replace these with your own project details from https://app.supabase.com
// 1. Create a new project
// 2. Go to Project Settings -> API
// 3. Copy "Project URL" and "anon public" key

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';

// Initialize the client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase Client Initialized");
