let authMode = "signin";

document.addEventListener("DOMContentLoaded", initAuth);

async function initAuth() {
  if (!window.ZayaSupabase?.isConfigured) {
    setAuthMessage("Configure Supabase in js/supabase.js before using authentication.", "error");
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  if (data?.session) {
    location.replace("/admin.html");
    return;
  }

  document.getElementById("authForm")?.addEventListener("submit", handleAuthSubmit);
  document.getElementById("modeToggle")?.addEventListener("click", toggleAuthMode);
}

function toggleAuthMode() {
  authMode = authMode === "signin" ? "signup" : "signin";
  const title = document.getElementById("authTitle");
  const subtitle = document.getElementById("authSubtitle");
  const submit = document.getElementById("authSubmit");
  const toggle = document.getElementById("modeToggle");

  const signup = authMode === "signup";
  title.textContent = signup ? "Create account" : "Welcome back";
  subtitle.textContent = signup
    ? "Create your ZAYA admin account."
    : "Sign in to continue to the ZAYA admin portal.";
  submit.textContent = signup ? "Create account" : "Sign in";
  toggle.textContent = signup
    ? "Already have an account? Sign in"
    : "Need an account? Sign up";
  setAuthMessage("");
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const button = document.getElementById("authSubmit");
  const email = form.email.value.trim();
  const password = form.password.value;

  if (!email || !password) {
    setAuthMessage("Enter your email and password.", "error");
    return;
  }

  button.disabled = true;
  button.textContent = authMode === "signup" ? "Creating…" : "Signing in…";

  try {
    if (authMode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/admin.html`
        }
      });

      if (error) throw error;

      if (data.session) {
        location.replace("/admin.html");
      } else {
        setAuthMessage(
          "Account created. Check your email to confirm the account, then sign in.",
          "success"
        );
        authMode = "signin";
        toggleAuthMode();
      }
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.session) throw new Error("Sign-in completed without an active session.");

      location.replace("/admin.html");
    }
  } catch (error) {
    console.error(error);
    setAuthMessage(error.message || "Authentication failed.", "error");
  } finally {
    button.disabled = false;
    button.textContent = authMode === "signup" ? "Create account" : "Sign in";
  }
}

function setAuthMessage(message, type = "") {
  const element = document.getElementById("authMessage");
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`.trim();
}