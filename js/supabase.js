
// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
// You need to replace these with your own project details from https://app.supabase.com
// 1. Create a new project
// 2. Go to Project Settings -> API
// 3. Copy "Project URL" and "anon public" key

const SUPABASE_URL = 'https://zhacpagccpesujfadpas.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYWNwYWdjY3Blc3VqZmFkcGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzUzNzcsImV4cCI6MjA4NTc1MTM3N30.o-7PqkWy1AY_zRNRuw8bRfPqx9P_FycZrV4ziDh6WE8';

// Initialize the client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase Client Initialized");
