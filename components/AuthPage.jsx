// ---------------------------------------------------------------------------
// AuthPage — Login / Signup with Google reCAPTCHA v2 support
// ---------------------------------------------------------------------------
const AuthPage = ({ authMode, authForm, error, onAuthInput, handleLogin, handleSignup, setAuthMode, SIGNUP_ROLES, captchaToken, onCaptcha, RECAPTCHA_SITE_KEY }) => {
  const captchaRef = React.useRef(null);
  const widgetIdRef = React.useRef(null);
  const [captchaLoadError, setCaptchaLoadError] = React.useState("");

  React.useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      onCaptcha("");
      widgetIdRef.current = null;
      if (captchaRef.current) captchaRef.current.innerHTML = "";
      setCaptchaLoadError("");
      return;
    }
    setCaptchaLoadError("");

    let cancelled = false;

    const tryRender = () => {
      if (cancelled || !captchaRef.current || !window.grecaptcha || !window.grecaptcha.render) return;

      try {
        if (widgetIdRef.current === null) {
          widgetIdRef.current = window.grecaptcha.render(captchaRef.current, {
            sitekey: RECAPTCHA_SITE_KEY,
            callback: onCaptcha,
            "expired-callback": () => onCaptcha("")
          });
        } else {
          window.grecaptcha.reset(widgetIdRef.current);
          onCaptcha("");
        }
      } catch {
        // ignore render race errors
      }
    };

    tryRender();
    const timer = setInterval(tryRender, 250);
    const stopTimer = setTimeout(() => {
      clearInterval(timer);
      if (!cancelled && widgetIdRef.current === null) {
        setCaptchaLoadError("CAPTCHA could not load. Check internet connection and disable strict ad-blocking for this page.");
      }
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(stopTimer);
    };
  }, [authMode, RECAPTCHA_SITE_KEY, onCaptcha]);

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="auth-hero-overlay"></div>
        <div className="auth-hero-content">
          <p className="chip">FSAD-PS02 Project</p>
          <h1>TribalCraft Connect</h1>
          <p>
            Preserve heritage. Empower artisans. Build a digital marketplace with trust, culture, and community.
          </p>
        </div>
      </section>

      <section className="auth-card">
        <h2>{authMode === "login" ? "Log In" : "Create Account"}</h2>
        <p className="auth-subtitle">
          {authMode === "login"
            ? "Use your role credentials to access your workspace."
            : "Sign up and choose your role to join the platform."}
        </p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={authMode === "login" ? handleLogin : handleSignup}>
          {authMode === "signup" && (
            <>
              <input
                required
                id="auth-name"
                placeholder="Full name"
                value={authForm.name}
                onChange={(e) => onAuthInput("name", e.target.value)}
              />
              <select
                id="auth-role"
                value={authForm.role}
                onChange={(e) => onAuthInput("role", e.target.value)}
              >
                {SIGNUP_ROLES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <input
            required
            id="auth-email"
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) => onAuthInput("email", e.target.value)}
          />
          <input
            required
            id="auth-password"
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) => onAuthInput("password", e.target.value)}
          />

          {RECAPTCHA_SITE_KEY && (
            <div ref={captchaRef} id="auth-captcha" style={{ margin: "8px 0" }}></div>
          )}
          {captchaLoadError && <small style={{ color: "#b42318", display: "block", marginBottom: "8px" }}>{captchaLoadError}</small>}

          <button id="auth-submit" className="primary auth-btn" type="submit">
            {authMode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>

        <button
          id="auth-toggle"
          className="link-btn"
          onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
        >
          {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>

        <div className="demo-box">
          <p>Demo accounts:</p>
          <small>admin@tribalcraft.com / Admin@123</small>
          <small>artisan@tribalcraft.com / Artisan@123</small>
          <small>customer@tribalcraft.com / Customer@123</small>
          <small>consultant@tribalcraft.com / Consultant@123</small>
        </div>
      </section>
    </div>
  );
};

window.TC = window.TC || {};
window.TC.AuthPage = AuthPage;
