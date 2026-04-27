const { useEffect, useMemo, useState, useCallback } = React;
const { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } = window.ReactRouterDOM;

// ---------------------------------------------------------------------------
// Set this to your Render backend URL for production deployment
// e.g. "https://tribalcraft-connect.onrender.com"
// Leave empty ("") when backend serves the frontend (same origin)
// ---------------------------------------------------------------------------
function resolveApiBaseUrl() {
  const DEFAULT_AZURE_API = "https://tribal-craft-api-feczhkg7gehfazhs.centralindia-01.azurewebsites.net";

  if (window.TC_API_BASE_URL && typeof window.TC_API_BASE_URL === "string") {
    return window.TC_API_BASE_URL.replace(/\/$/, "");
  }
  if (window.localStorage) {
    const stored = window.localStorage.getItem("TC_API_BASE_URL");
    if (stored && typeof stored === "string") return stored.replace(/\/$/, "");
  }

  // Use the Azure backend as the default for cloud-connected environments
  if (
    window.location.hostname.endsWith(".vercel.app") ||
    window.location.hostname.includes("localhost") ||
    window.location.hostname.includes("azurewebsites.net")
  ) {
    return DEFAULT_AZURE_API;
  }

  // Default to same-origin for other cases
  return "";
}

const DEFAULT_API_BASE_URL = resolveApiBaseUrl();

const ORDER_STATUSES = ["confirmed", "processing", "shipped", "delivered", "cancelled"];
const AUTH_STATUSES = ["pending", "review_requested", "approved", "rejected"];
const SIGNUP_ROLES = [
  { value: "customer", label: "Customer" },
  { value: "artisan", label: "Artisan" },
  { value: "consultant", label: "Cultural Consultant" },
  { value: "admin", label: "Admin" }
];
const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1459908676235-d5f02a50184b?auto=format&fit=crop&w=800&q=70";
const API_REQUEST_TIMEOUT_MS = 12000;
const API_RETRY_DELAY_MS = 1200;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const money = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    value || 0
  );

function metricCards(metrics, role) {
  if (!metrics || !metrics[role]) return [];
  return Object.entries(metrics[role]).map(([key, value]) => ({
    key,
    title: key.replace(/([A-Z])/g, " $1").replace(/^./, (m) => m.toUpperCase()),
    value
  }));
}

// ---------------------------------------------------------------------------
// Lazy-loading utility: fetch JSX → Babel transform → inject as script tag
// ---------------------------------------------------------------------------
window.TC = window.TC || {};
const _loadCache = {};

function loadComponent(scriptPath) {
  if (_loadCache[scriptPath]) return _loadCache[scriptPath];

  _loadCache[scriptPath] = new Promise((resolve, reject) => {
    fetch(scriptPath, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache"
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${scriptPath}`);
        return res.text();
      })
      .then((jsxSource) => {
        const transformed = Babel.transform(jsxSource, { presets: ["react"] }).code;
        const scriptEl = document.createElement("script");
        scriptEl.textContent = transformed;
        document.head.appendChild(scriptEl);
        resolve();
      })
      .catch(reject);
  });

  return _loadCache[scriptPath];
}

function loadComponents(paths) {
  return Promise.all(paths.map(loadComponent));
}

async function readJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function withTimeout(fetcher, timeoutMs = API_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(new Error("Request timed out")), timeoutMs);
  return fetcher(controller.signal).finally(() => window.clearTimeout(timer));
}

function isApiHtmlFallback(path, response) {
  if (!path.startsWith("/api/")) return false;
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  return contentType.includes("text/html");
}

function shouldRetryRequest(method, response, error, attempt) {
  const normalizedMethod = (method || "GET").toUpperCase();
  if (!["GET", "HEAD"].includes(normalizedMethod)) return false;
  if (attempt >= 1) return false;
  if (error) return true;
  if (!response) return false;
  return RETRYABLE_STATUS_CODES.has(response.status);
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isInvoiceRoute = location.pathname === "/invoice";
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [bootstrapState, setBootstrapState] = useState("idle");

  const [token, setToken] = useState(localStorage.getItem("tc_token") || "");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [captchaToken, setCaptchaToken] = useState("");
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
  const [backendWakeState, setBackendWakeState] = useState("starting");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer"
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [issues, setIssues] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [metrics, setMetrics] = useState({});

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);

  const [newListing, setNewListing] = useState({
    name: "",
    category: "Painting",
    price: "",
    stock: "",
    artisanName: "",
    region: "",
    imageUrl: "",
    description: "",
    culturalNote: ""
  });
  const [listingImageFile, setListingImageFile] = useState(null);

  const [reviewForm, setReviewForm] = useState({ productId: "", rating: 5, comment: "" });
  const [issueForm, setIssueForm] = useState({ type: "delivery", message: "" });
  const [paymentForm, setPaymentForm] = useState({ method: "upi", details: "", address: "" });

  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [gatewayPayment, setGatewayPayment] = useState(null);
  const [gatewayBusy, setGatewayBusy] = useState(false);
  const [gatewayResult, setGatewayResult] = useState("");

  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceError, setInvoiceError] = useState("");

  // Component lazy-load state
  const [authPageReady, setAuthPageReady] = useState(!!window.TC.AuthPage);
  const [invoicePageReady, setInvoicePageReady] = useState(!!window.TC.InvoicePage);
  const [coreReady, setCoreReady] = useState(!!window.TC.HeroBanner);
  const [rolePanelsReady, setRolePanelsReady] = useState(false);

  // ---------------------------------------------------------------------------
  // API helpers
  // ---------------------------------------------------------------------------
  const apiFetch = useCallback(
    async (path, options = {}) => {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      const { protocol, hostname } = window.location;
      const method = (options.method || "GET").toUpperCase();
      const candidates = [];
      const seen = new Set();
      const push = (base) => {
        const safeBase = (base || "").replace(/\/$/, "");
        if (seen.has(safeBase)) return;
        seen.add(safeBase);
        candidates.push(safeBase);
      };

      // Priority: current working base -> explicit override -> common local backends -> same-origin
      push(apiBaseUrl);
      if (window.TC_API_BASE_URL && typeof window.TC_API_BASE_URL === "string") {
        push(window.TC_API_BASE_URL);
      }
      push(`${protocol}//${hostname}:8080`);
      push(`${protocol}//${hostname}:8081`);
      push(`${protocol}//${hostname}:3000`);
      push("");

      let lastError = null;
      let lastResponse = null;
      let sawFallbackResponse = false;
      for (const base of candidates) {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            const headers = { Accept: "application/json", ...(options.headers || {}) };
            if (normalizedPath.startsWith("/api/")) {
              headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
              headers.Pragma = "no-cache";
            }

            const response = await withTimeout((signal) =>
              fetch(base + normalizedPath, {
                ...options,
                headers,
                cache: normalizedPath.startsWith("/api/") ? "no-store" : options.cache,
                signal
              })
            );

            // On static hosts, rewritten /api/* requests can return index.html with HTTP 200.
            // Skip those false positives and keep probing real backend candidates.
            if (
              normalizedPath.startsWith("/api/") &&
              (response.status === 404 || isApiHtmlFallback(normalizedPath, response))
            ) {
              sawFallbackResponse = true;
              break;
            }

            if (shouldRetryRequest(method, response, null, attempt)) {
              lastResponse = response;
              await delay(API_RETRY_DELAY_MS);
              continue;
            }

            if (base !== apiBaseUrl) {
              setApiBaseUrl(base);
              try {
                window.localStorage.setItem("TC_API_BASE_URL", base);
              } catch {
                // ignore storage failures
              }
            }
            return response;
          } catch (err) {
            lastError = err?.name === "AbortError" ? new Error("Request timed out") : err;
            if (!shouldRetryRequest(method, null, err, attempt)) break;
            await delay(API_RETRY_DELAY_MS);
          }
        }
      }

      if (lastResponse) return lastResponse;
      if (lastError) throw lastError;
      if (sawFallbackResponse) {
        throw new Error("API endpoint was not found on the current host. Check the backend base URL.");
      }
      throw new Error("Unable to reach backend");
    },
    [apiBaseUrl]
  );

  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = { ...(options.headers || {}), "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      return apiFetch(url, { ...options, headers });
    },
    [token, apiFetch]
  );

  const hydrateUser = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await authFetch("/api/auth/me", { method: "GET" });
      if (!res.ok) throw new Error("Session expired");
      const data = await res.json();
      setUser(data.user);
      setError("");
    } catch {
      localStorage.removeItem("tc_token");
      setToken("");
      setUser(null);
      setError("Please log in again");
    } finally {
      setLoading(false);
    }
  }, [token, authFetch]);

  const fetchBootstrap = useCallback(async ({ silent = false } = {}) => {
    if (!token) return;
    try {
      setDashboardLoading(true);
      if (!silent) setLoading(true);
      setBootstrapState("loading");
      const res = await authFetch("/api/bootstrap");
      if (!res.ok) throw new Error("Failed to fetch platform data");
      const data = await res.json();
      setProducts(data.products || []);
      setOrders(data.orders || []);
      setPromotions(data.promotions || []);
      setReviews(data.reviews || []);
      setIssues(data.issues || []);
      setPayments(data.payments || []);
      setActivityLogs(data.activityLogs || []);
      setMetrics(data.metrics || {});
      setError("");
      setBootstrapState("ready");
    } catch (err) {
      setBootstrapState("error");
      setError(err.message || "Something went wrong");
    } finally {
      setDashboardLoading(false);
      if (!silent) setLoading(false);
    }
  }, [token, authFetch]);

  // Lightweight product-only refresh (skips orders/metrics/etc.)
  const fetchProducts = useCallback(async () => {
    if (!token) return;
    try {
      setCatalogLoading(true);
      setLoading(true);
      const res = await authFetch("/api/products");
      if (!res.ok) return;
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data.products || []));
    } catch {
      // silent; optimistic update already applied elsewhere
    } finally {
      setCatalogLoading(false);
      setLoading(false);
    }
  }, [token, authFetch]);

  const refreshDashboard = useCallback(() => {
    fetchBootstrap({ silent: true });
  }, [fetchBootstrap]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  useEffect(() => { hydrateUser(); }, []);

  useEffect(() => {
    if (user) return undefined;

    let active = true;
    let timerId = null;

    const loadPublicConfig = async () => {
      try {
        if (active) {
          setBackendWakeState((prev) => (prev === "ready" ? prev : "starting"));
        }
        const res = await apiFetch("/api/public/config");
        if (!res.ok) throw new Error("Backend not ready yet");
        const data = await res.json();
        if (!active) return;
        setRecaptchaSiteKey(data.recaptchaSiteKey || "");
        setBackendWakeState("ready");
      } catch {
        if (!active) return;
        setBackendWakeState("starting");
        timerId = window.setTimeout(loadPublicConfig, 5000);
      }
    };
    loadPublicConfig();

    return () => {
      active = false;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [apiFetch, user]);

  useEffect(() => {
    if (!user) return;
    fetchProducts();
    fetchBootstrap({ silent: true });
  }, [user, fetchBootstrap, fetchProducts]);

  useEffect(() => {
    if (!user || bootstrapState !== "error") return undefined;
    const retryTimer = window.setTimeout(() => {
      fetchBootstrap();
    }, 2500);
    return () => window.clearTimeout(retryTimer);
  }, [bootstrapState, fetchBootstrap, user]);

  useEffect(() => {
    setPaymentForm((prev) => ({
      ...prev,
      address: user?.savedAddress || prev.address || ""
    }));
  }, [user?.savedAddress]);

  useEffect(() => {
    if (!user || !isInvoiceRoute) return;
    const paymentId = new URLSearchParams(window.location.search).get("paymentId");
    if (!paymentId) { setInvoiceError("Missing paymentId in invoice URL"); return; }

    const loadInvoice = async () => {
      try {
        setInvoiceLoading(true);
        setInvoiceError("");
        const res = await authFetch(`/api/payments/${paymentId}/invoice`);
        const data = await readJsonSafe(res);
        if (!res.ok) { setInvoiceError(data.error || "Failed to load invoice"); return; }
        setInvoiceData(data);
      } catch (err) {
        setInvoiceError(err.message || "Failed to load invoice");
      } finally {
        setInvoiceLoading(false);
      }
    };
    loadInvoice();
  }, [user, isInvoiceRoute]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(timer);
  }, [notice]);

  // Lazy-load components
  useEffect(() => {
    if (!user && !authPageReady) {
      loadComponent("/components/AuthPage.jsx").then(() => setAuthPageReady(true));
    }
  }, [user, authPageReady]);

  useEffect(() => {
    if (user && isInvoiceRoute && !invoicePageReady) {
      loadComponent("/components/InvoicePage.jsx").then(() => setInvoicePageReady(true));
    }
  }, [user, isInvoiceRoute, invoicePageReady]);

  useEffect(() => {
    if (user && !isInvoiceRoute && !coreReady) {
      const corePaths = [
        "/components/HeroBanner.jsx",
        "/components/DashboardMetrics.jsx",
        "/components/CraftCatalog.jsx",
        "/components/PaymentGatewayModal.jsx"
      ];

      if (user.role === "customer") {
        corePaths.push("/components/CartCheckout.jsx", "/components/ReviewsPanel.jsx");
      }

      loadComponents(corePaths).then(() => setCoreReady(true));
    }
  }, [user, isInvoiceRoute, coreReady]);

  useEffect(() => {
    if (!coreReady || !user || isInvoiceRoute || rolePanelsReady) return;
    const role = user.role;
    const panelPaths = [];

    if (role === "customer") panelPaths.push("/components/CartCheckout.jsx", "/components/ReviewsPanel.jsx");
    if (role === "artisan") panelPaths.push("/components/ArtisanPanel.jsx", "/components/AdminPanel.jsx");
    if (role === "consultant") panelPaths.push("/components/ConsultantPanel.jsx");
    if (role === "admin") panelPaths.push("/components/ArtisanPanel.jsx", "/components/AdminPanel.jsx", "/components/ConsultantPanel.jsx");

    if (panelPaths.length > 0) {
      Promise.allSettled(panelPaths.map(loadComponent)).then(() => setRolePanelsReady(true));
    } else {
      setRolePanelsReady(true);
    }
  }, [coreReady, user, isInvoiceRoute, rolePanelsReady]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const role = user?.role || "customer";
  const heroClass = `hero hero-${role}`;
  const cards = metricCards(metrics, role);
  const categories = useMemo(() => ["All", ...new Set(products.map((p) => p.category))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Admins and consultants see everything
      const isPrivileged = role === "admin" || role === "consultant";
      if (!isPrivileged) {
        // Artisans: only see their own products (all statuses)
        if (role === "artisan") {
          if (product.artisanName !== user?.name) return false;
        } else {
          // Customers and everyone else: only approved products
          if (product.authenticityStatus !== "approved") return false;
        }
      }
      const byCategory = category === "All" || product.category === category;
      const byQuery =
        query.trim() === "" ||
        `${product.name} ${product.region} ${product.artisanName}`.toLowerCase().includes(query.toLowerCase());
      return byCategory && byQuery;
    });
  }, [products, category, query, role, user]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const onAuthInput = (key, value) => setAuthForm((prev) => ({ ...prev, [key]: value }));

  const handleLogin = async (event) => {
    event.preventDefault();
    if (recaptchaSiteKey && !captchaToken) {
      setError("Please complete the CAPTCHA verification");
      return;
    }
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, password: authForm.password, captchaToken })
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        setError(data.error || data.message || "Login failed");
        return;
      }
      localStorage.setItem("tc_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setAuthForm({ ...authForm, password: "" });
      setCaptchaToken("");
      setError("");
      setNotice(`Welcome, ${data.user.name}`);
    } catch (err) {
      setError(err.message || "Unable to reach backend. Start backend and check API base URL.");
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    if (recaptchaSiteKey && !captchaToken) {
      setError("Please complete the CAPTCHA verification");
      return;
    }
    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...authForm, captchaToken })
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        setError(data.error || data.message || "Signup failed");
        return;
      }
      localStorage.setItem("tc_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setError("");
      setNotice(`Account created for ${data.user.name}`);
    } catch (err) {
      setError(err.message || "Unable to reach backend. Start backend and check API base URL.");
    }
  };

  const logout = async () => {
    try { await authFetch("/api/auth/logout", { method: "POST" }); } catch { /* ignore */ }
    localStorage.removeItem("tc_token");
    setToken(""); setUser(null); setCart([]); setNotice(""); setError("");
    setAuthForm({ name: "", email: "", password: "", role: "customer" });
    setAuthMode("login");
    setPaymentForm({ method: "upi", details: "", address: "" });
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      setError(`${product.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, qty: Math.min(item.qty + 1, product.stock) } : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }];
    });
    setNotice(`${product.name} added to cart`);
  };

  const updateCartQty = (productId, qty) => {
    const product = products.find((item) => item.id === productId);
    const maxQty = product?.stock ?? qty;
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, qty: Math.min(Math.max(0, qty), maxQty) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    if (!paymentForm.method) { setError("Please select a payment method"); return; }
    if (!paymentForm.address.trim()) { setError("Please provide a delivery address"); return; }
    try {
      const res = await authFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart,
          paymentMethod: paymentForm.method,
          paymentDetails: paymentForm.details,
          shippingAddress: paymentForm.address.trim()
        })
      });
      const data = await readJsonSafe(res);
      if (!res.ok) { setError(data.error || "Failed to place order"); return; }
      if (data.user) setUser(data.user);
      if (data.order) setOrders((prev) => [data.order, ...prev]);
      if (data.payment) setPayments((prev) => [data.payment, ...prev]);
      if (paymentForm.method === "cod") {
        setCart([]);
        setPaymentForm({ method: "upi", details: "", address: data.user?.savedAddress || paymentForm.address });
        setNotice(`Order placed with COD. Ref: ${data.payment.transactionRef}`);
        refreshDashboard();
        downloadInvoice(data.payment);
        return;
      }
      setGatewayPayment(data.payment); setGatewayOpen(true); setGatewayResult("");
      setNotice(`Order created. Complete payment for ref: ${data.payment.transactionRef}`);
    } catch (err) {
      setError(err.message || "Checkout failed. Please try again.");
    }
  };

  const createListing = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...newListing };
      if (!payload.artisanName) payload.artisanName = user.name;
      const res = await authFetch("/api/products", { method: "POST", body: JSON.stringify(payload) });
      const data = await readJsonSafe(res);
      if (!res.ok) { setError(data.error || "Could not create listing"); return; }

      // Optimistic insert: show the new product card instantly
      const optimisticProduct = { ...data, imageUrl: "" };
      setProducts((prev) => [optimisticProduct, ...prev]);

      setNewListing({ name: "", category: "Painting", price: "", stock: "", artisanName: user.name || "", region: "", imageUrl: "", description: "", culturalNote: "" });
      setListingImageFile(null);

      if (listingImageFile) {
        const uploadData = new FormData();
        uploadData.append("file", listingImageFile);
        const uploadHeaders = {};
        if (token) uploadHeaders.Authorization = `Bearer ${token}`;
        const uploadRes = await apiFetch(`/api/products/${encodeURIComponent(data.id)}/upload-image`, {
          method: "POST", headers: uploadHeaders, body: uploadData
        });
        const uploadJson = await readJsonSafe(uploadRes);
        if (!uploadRes.ok) {
          setError(uploadJson.error || "Listing created, but image upload failed");
          setNotice(`Listing published: ${data.name}`);
          // Refresh just products to get server state
          fetchProducts();
        } else {
          setNotice(`Listing published with image: ${data.name}`);
          // Patch the optimistic entry with the real imageUrl returned by server
          setProducts((prev) =>
            prev.map((p) => (p.id === data.id ? { ...p, imageUrl: uploadJson.imageUrl || uploadJson.image_url || p.imageUrl } : p))
          );
        }
      } else {
        setNotice(`Listing published: ${data.name}`);
      }
    } catch (err) {
      setError(err.message || "Could not create listing");
    }
  };

  const updateAuth = async (productId, authenticityStatus) => {
    const previousStatus = products.find((product) => product.id === productId)?.authenticityStatus;
    // Optimistic update: flip badge immediately
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, authenticityStatus } : p))
    );
    try {
      const res = await authFetch(`/api/products/${productId}/authenticity`, { method: "PATCH", body: JSON.stringify({ authenticityStatus }) });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, authenticityStatus: previousStatus } : p))
        );
        setError(data.error || "Unable to update authenticity status");
        return;
      }
      // Confirm with server's response value
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, authenticityStatus: data.authenticityStatus } : p))
      );
      setNotice(`Authenticity set to ${data.authenticityStatus}`);
    } catch (err) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, authenticityStatus: previousStatus } : p))
      );
      setError(err.message || "Unable to update authenticity status");
    }
  };

  const deleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This will also remove the image from storage.`)) return;
    // Optimistic remove: hide the card immediately
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      const res = await authFetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!res.ok) {
        let msg = "Failed to delete product";
        try { const d = await res.json(); msg = d.error || d.message || msg; } catch { }
        setError(msg);
        // Revert: refetch products to restore the accidentally removed card
        fetchProducts();
        return;
      }
      setNotice(`"${productName}" deleted successfully`);
    } catch (err) {
      setError(`Delete error: ${err.message}`);
      fetchProducts(); // Revert on network error
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      const data = await readJsonSafe(res);
      if (!res.ok) { setError(data.error || "Unable to update order status"); return; }
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: data.status } : order)));
      setNotice(`Order moved to ${data.status}`);
      refreshDashboard();
    } catch (err) {
      setError(err.message || "Unable to update order status");
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      const res = await authFetch("/api/reviews", { method: "POST", body: JSON.stringify(reviewForm) });
      const data = await readJsonSafe(res);
      if (!res.ok) { setError(data.error || "Failed to submit review"); return; }
      setReviews((prev) => [data, ...prev]);
      setNotice("Review submitted");
      setReviewForm({ productId: "", rating: 5, comment: "" });
      fetchProducts();
    } catch (err) {
      setError(err.message || "Failed to submit review");
    }
  };

  const submitIssue = async (event) => {
    event.preventDefault();
    try {
      const res = await authFetch("/api/issues", { method: "POST", body: JSON.stringify(issueForm) });
      const data = await readJsonSafe(res);
      if (!res.ok) { setError(data.error || "Failed to create issue"); return; }
      setIssues((prev) => [data, ...prev]);
      setIssueForm({ type: "delivery", message: "" });
      setNotice("Issue reported");
      refreshDashboard();
    } catch (err) {
      setError(err.message || "Failed to create issue");
    }
  };

  const resolveIssue = async (issueId) => {
    try {
      const res = await authFetch(`/api/issues/${issueId}/resolve`, { method: "PATCH" });
      const data = await readJsonSafe(res);
      if (!res.ok) { setError(data.error || "Could not resolve issue"); return; }
      setIssues((prev) => prev.map((issue) => (issue.id === issueId ? { ...issue, status: data.status } : issue)));
      setNotice(`Issue ${data.id} resolved`);
      refreshDashboard();
    } catch (err) {
      setError(err.message || "Could not resolve issue");
    }
  };

  const updatePaymentStatus = async (paymentId, status) => {
    try {
      const res = await authFetch(`/api/payments/${paymentId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      const data = await readJsonSafe(res);
      if (!res.ok) { setError(data.error || "Could not update payment status"); return; }
      setPayments((prev) => prev.map((payment) => (payment.id === paymentId ? { ...payment, status: data.status } : payment)));
      setNotice(`Payment ${data.id} marked ${data.status}`);
      refreshDashboard();
    } catch (err) {
      setError(err.message || "Could not update payment status");
    }
  };

  const processFakePayment = async () => {
    if (!gatewayPayment) return;
    try {
      setGatewayBusy(true); setGatewayResult("processing"); setError("");
      await new Promise((resolve) => setTimeout(resolve, 1400));
      const res = await authFetch(`/api/payments/${gatewayPayment.id}/process`, { method: "POST", body: JSON.stringify({}) });
      const data = await readJsonSafe(res);
      if (!res.ok) { setGatewayResult("failed"); setError(data.error || "Payment processing failed"); return; }
      if (data.status === "success") {
        setGatewayResult("success");
        setCart([]);
        setPaymentForm((prev) => ({ method: "upi", details: "", address: prev.address }));
        setPayments((prev) => prev.map((payment) => (payment.id === gatewayPayment.id ? { ...payment, ...data } : payment)));
        setOrders((prev) => prev.map((order) => (order.id === data.orderId ? { ...order, status: "processing" } : order)));
        setNotice(`Payment successful. Ref: ${data.transactionRef}`);
        refreshDashboard();
        downloadInvoice(data);
        return;
      }
      setGatewayResult("failed");
      setError("Payment failed. Please retry.");
      refreshDashboard();
    } catch (err) {
      setGatewayResult("failed");
      setError(err.message || "Payment processing failed");
    } finally {
      setGatewayBusy(false);
    }
  };

  const downloadInvoice = (payment) => {
    const w = window.open(`/invoice?paymentId=${encodeURIComponent(payment.id)}`, "_blank");
    if (!w) setError("Popup blocked. Allow popups to open invoice.");
  };

  // ---------------------------------------------------------------------------
  // Render: Auth Page (lazy)
  // ---------------------------------------------------------------------------
  if (!user) {
    if (!authPageReady) return <div className="alert">Loading...</div>;
    const AuthPage = window.TC.AuthPage;
    const authUI = (
      <AuthPage
        authMode={authMode}
        authForm={authForm}
        error={error}
        backendWakeState={backendWakeState}
        onAuthInput={onAuthInput}
        handleLogin={handleLogin}
        handleSignup={handleSignup}
        setAuthMode={setAuthMode}
        SIGNUP_ROLES={SIGNUP_ROLES}
        captchaToken={captchaToken}
        onCaptcha={setCaptchaToken}
        RECAPTCHA_SITE_KEY={recaptchaSiteKey}
      />
    );
    return (
      <Routes>
        <Route path="*" element={authUI} />
      </Routes>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Invoice Page (lazy)
  // ---------------------------------------------------------------------------
  if (isInvoiceRoute) {
    if (!invoicePageReady) return <div className="alert">Loading invoice...</div>;
    const InvoicePage = window.TC.InvoicePage;
    return (
      <InvoicePage
        invoiceLoading={invoiceLoading}
        invoiceError={invoiceError}
        invoiceData={invoiceData}
        money={money}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Main Dashboard (lazy)
  // ---------------------------------------------------------------------------
  if (!coreReady) return <div className="alert">Loading dashboard...</div>;

  const HeroBanner = window.TC.HeroBanner;
  const DashboardMetrics = window.TC.DashboardMetrics;
  const CraftCatalog = window.TC.CraftCatalog;
  const PaymentGatewayModal = window.TC.PaymentGatewayModal;
  const routeLoadingFallback = <div className="alert info">Loading this section...</div>;

  const navLinks = (
    <nav className="navbar" style={{ padding: '10px', background: '#eee', marginBottom: '10px', display: 'flex', gap: '15px' }}>
      <Link to="/">Home & Catalog</Link>
      {role === "customer" && <Link to="/cart">Cart</Link>}
      {role === "customer" && <Link to="/reviews">Reviews</Link>}
      {role === "artisan" && <Link to="/artisan">Artisan Panel</Link>}
      {(role === "artisan" || role === "admin") && <Link to="/admin">Admin Panel</Link>}
      {(role === "consultant" || role === "admin") && <Link to="/consultant">Consultant Panel</Link>}
      <button onClick={logout} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#e74c3c', fontWeight: 'bold', cursor: 'pointer', padding: '0 10px' }}>Logout</button>
    </nav>
  );

  return (
    <div className="page">
      <HeroBanner heroClass={heroClass} user={user} logout={logout} />
      {navLinks}

      <main className="container">
        {notice && <div className="alert success">{notice}</div>}
        {error && <div className="alert error">{error}</div>}
        {bootstrapState === "loading" && <div className="alert info">Loading the latest dashboard data...</div>}
        {bootstrapState === "error" && (
          <div className="alert info">
            Backend data is still syncing. Retrying automatically, so you should not need to refresh again.
          </div>
        )}


        
          <Routes>
            <Route path="/" element={
              <>
                <DashboardMetrics cards={cards} user={user} loading={dashboardLoading} />
                <CraftCatalog
                  filteredProducts={filteredProducts}
                  loading={catalogLoading}
                  query={query}
                  setQuery={setQuery}
                  category={category}
                  setCategory={setCategory}
                  categories={categories}
                  role={role}
                  addToCart={addToCart}
                  updateAuth={updateAuth}
                  deleteProduct={deleteProduct}
                  money={money}
                  DEFAULT_PRODUCT_IMAGE={DEFAULT_PRODUCT_IMAGE}
                  AUTH_STATUSES={AUTH_STATUSES}
                />
              </>
            } />
            
            <Route path="/cart" element={
              role !== "customer" ? <Navigate to="/" /> : window.TC.CartCheckout ? (
                <window.TC.CartCheckout
                  cart={cart}
                  cartTotal={cartTotal}
                  paymentForm={paymentForm}
                  setPaymentForm={setPaymentForm}
                  checkout={checkout}
                  updateCartQty={updateCartQty}
                  removeFromCart={removeFromCart}
                  promotions={promotions}
                  payments={payments}
                  user={user}
                  money={money}
                  downloadInvoice={downloadInvoice}
                />
              ) : routeLoadingFallback
            } />

            <Route path="/artisan" element={
              !(role === "artisan" || role === "admin") ? <Navigate to="/" /> : window.TC.ArtisanPanel ? (
                <window.TC.ArtisanPanel
                  newListing={newListing}
                  setNewListing={setNewListing}
                  listingImageFile={listingImageFile}
                  setListingImageFile={setListingImageFile}
                  createListing={createListing}
                  orders={orders}
                  money={money}
                />
              ) : routeLoadingFallback
            } />

            <Route path="/admin" element={
              !(role === "artisan" || role === "admin") ? <Navigate to="/" /> : rolePanelsReady && window.TC.AdminPanel ? (
                <window.TC.AdminPanel
                  products={products}
                  orders={orders}
                  updateOrderStatus={updateOrderStatus}
                  ORDER_STATUSES={ORDER_STATUSES}
                  issues={issues}
                  issueForm={issueForm}
                  setIssueForm={setIssueForm}
                  submitIssue={submitIssue}
                  resolveIssue={resolveIssue}
                  payments={payments}
                  updatePaymentStatus={updatePaymentStatus}
                  activityLogs={activityLogs}
                  money={money}
                  downloadInvoice={downloadInvoice}
                  role={role}
                />
              ) : routeLoadingFallback
            } />

            <Route path="/consultant" element={
              !(role === "consultant" || role === "admin") ? <Navigate to="/" /> : rolePanelsReady && window.TC.ConsultantPanel ? (
                <window.TC.ConsultantPanel
                  products={products}
                  updateAuth={updateAuth}
                  AUTH_STATUSES={AUTH_STATUSES}
                />
              ) : routeLoadingFallback
            } />

            <Route path="/reviews" element={
              role !== "customer" ? <Navigate to="/" /> : window.TC.ReviewsPanel ? (
                <window.TC.ReviewsPanel
                  reviewForm={reviewForm}
                  setReviewForm={setReviewForm}
                  submitReview={submitReview}
                  products={products}
                  reviews={reviews}
                />
              ) : routeLoadingFallback
             } />
             
             <Route path="*" element={<Navigate to="/" />} />
          </Routes>


      </main>

      {gatewayOpen && gatewayPayment && (
        <PaymentGatewayModal
          gatewayPayment={gatewayPayment}
          gatewayBusy={gatewayBusy}
          gatewayResult={gatewayResult}
          processFakePayment={processFakePayment}
          setGatewayOpen={setGatewayOpen}
          setGatewayResult={setGatewayResult}
          setGatewayPayment={setGatewayPayment}
          money={money}
        />
      )}
    </div>
  );
}

const RouterComponent = BrowserRouter;
ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterComponent>
    <AppContent />
  </RouterComponent>
);
