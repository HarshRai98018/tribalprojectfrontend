// ---------------------------------------------------------------------------
// HeroBanner — Top hero section with user info and logout
// ---------------------------------------------------------------------------
const HeroBanner = ({ heroClass, user, logout }) => {
  return (
    <header className={heroClass}>
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="/" className="logo">
            Tribal<span>Craft</span>
          </a>
          <div className="user-bar">
            <span className="badge">
              {user.name} ({user.role})
            </span>
            <button id="logout-btn" className="secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="hero-content">
        <p className="tag">FSAD-PS02 | Tribal Livelihood Platform</p>
        <h1>TribalCraft Connect</h1>
        <p>
          A digital marketplace where tribal artisans preserve heritage through handcrafted products
          and reach local and global customers.
        </p>
      </div>
    </header>
  );
};

window.TC = window.TC || {};
window.TC.HeroBanner = HeroBanner;
