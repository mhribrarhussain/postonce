
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const toggleBtn = document.getElementById('toggle-mode-btn');
const toggleText = document.getElementById('toggle-text');
const pageTitle = document.getElementById('page-title');
const errorMsg = document.getElementById('error-msg');
const successMsg = document.getElementById('success-msg');

let isLoginMode = true;

// CHECK SESSION
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'dashboard.html';
    }
}
checkSession();

if (toggleBtn) {
    // TOGGLE MODE (Login <-> Signup)
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        if (isLoginMode) {
            pageTitle.innerText = "Welcome Back";
            submitBtn.innerText = "Sign In";
            toggleText.innerText = "Don't have an account?";
            toggleBtn.innerText = "Sign Up";
        } else {
            pageTitle.innerText = "Create Account";
            submitBtn.innerText = "Get Started";
            toggleText.innerText = "Already have an account?";
            toggleBtn.innerText = "Sign In";
        }
        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';
    });
}

if (authForm) {
    // SUBMIT FORM
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;

        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.innerText = "Processing...";

        try {
            if (isLoginMode) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                window.location.href = 'dashboard.html';
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password
                });
                if (error) throw error;
                successMsg.innerText = "Account created! Check your email to confirm.";
                successMsg.style.display = 'block';
            }
        } catch (error) {
            errorMsg.innerText = error.message;
            errorMsg.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = isLoginMode ? "Sign In" : "Get Started";
        }
    });
}
