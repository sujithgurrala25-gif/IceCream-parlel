import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const heroImage =
  "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1600&q=90";
const fallbackImage = "https://loremflickr.com/900/650/indian,street,food?lock=900";

function handleImageError(event) {
  if (event.currentTarget.src !== fallbackImage) {
    event.currentTarget.src = fallbackImage;
  }
}

/* ── Skeleton card shown while loading ── */
function SkeletonCard() {
  return (
    <article className="menu-card skeleton-card">
      <div className="dish-photo skeleton-photo" />
      <div className="dish-content">
        <div className="skeleton-line short" />
        <div className="skeleton-line" />
        <div className="skeleton-line medium" />
      </div>
      <div className="card-actions">
        <div className="skeleton-btn" />
        <div className="skeleton-line tiny" />
        <div className="skeleton-btn" />
      </div>
    </article>
  );
}

function App() {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInitialData() {
      const [menuResponse, categoriesResponse] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/categories")
      ]);
      setMenu(await menuResponse.json());
      setCategories(await categoriesResponse.json());
      setLoading(false);
    }
    fetchInitialData().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (query.trim()) params.set("q", query.trim());

    setLoading(true);
    fetch(`/api/menu?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then(setMenu)
      .catch((err) => { if (err.name !== "AbortError") setMenu([]); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [activeCategory, query]);

  const featured = useMemo(() => menu.slice(0, 3), [menu]);
  const cartItems = useMemo(
    () =>
      Object.values(cart)
        .filter((e) => e.quantity > 0)
        .sort((a, b) => a.item.name.localeCompare(b.item.name)),
    [cart]
  );
  const total = cartItems.reduce((s, e) => s + e.item.price * e.quantity, 0);
  const itemCount = cartItems.reduce((s, e) => s + e.quantity, 0);

  function addItem(item) {
    setCart((c) => ({ ...c, [item.id]: { item, quantity: (c[item.id]?.quantity || 0) + 1 } }));
  }

  function removeItem(item) {
    setCart((c) => {
      const next = (c[item.id]?.quantity || 0) - 1;
      if (next <= 0) { const { [item.id]: _, ...rest } = c; return rest; }
      return { ...c, [item.id]: { item, quantity: next } };
    });
  }

  return (
    <main>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-media">
          <img src={heroImage} alt="Fresh pav bhaji and chaat" />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Street-style freshness, made to order</p>
          <h1>Kiran Chat Bhandar</h1>
          <p className="hero-text">
            Authentic pav bhaji, ragda, dahi chaat &amp; pani puri — crafted fresh.
            Browse the full menu, build your plate, and show it at the counter.
          </p>
          <div className="hero-actions">
            <a className="menu-link" href="#menu">
              🍽️ &nbsp;Explore Menu
            </a>
          </div>
        </div>
      </section>

      {/* ── MENU SHELL ── */}
      <section className="menu-shell" id="menu" aria-label="Restaurant menu">
        {/* Toolbar */}
        <div className="toolbar">
          <label className="search">
            <span>🔍&nbsp; Search dishes</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try pav bhaji, cheese, pani puri…"
            />
          </label>
          <div className="category-tabs" aria-label="Menu categories">
            {categories.map((cat) => (
              <button
                key={cat}
                className={cat === activeCategory ? "active" : ""}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="layout">
          {/* ── Menu Panel ── */}
          <section className="menu-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow" style={{ color: "var(--text-muted)", marginBottom: 4 }}>Menu</p>
                <h2>{activeCategory === "All" ? "All dishes" : activeCategory}</h2>
              </div>
              <span>{menu.length} items</span>
            </div>

            {/* Featured strip */}
            {featured.length > 0 && (
              <div className="featured-strip">
                {featured.map((item) => (
                  <article key={item.id} className="featured-card" onClick={() => addItem(item)}>
                    <img src={item.image} alt={item.imageAlt || item.name} onError={handleImageError} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>₹{item.price}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Grid */}
            <div className="menu-grid">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              ) : menu.length === 0 ? (
                <p className="empty">No dishes match your search. Try something else!</p>
              ) : (
                menu.map((item) => (
                  <article key={item.id} className="menu-card">
                    <div className="dish-photo">
                      <img
                        src={item.image}
                        alt={item.imageAlt || item.name}
                        loading="lazy"
                        onError={handleImageError}
                      />
                      <strong>₹{item.price}</strong>
                    </div>
                    <div className="dish-content">
                      <div className="card-topline">
                        <span>{item.category}</span>
                        {item.tags.includes("popular") && <strong>🔥 Popular</strong>}
                      </div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <div className="tags">
                        {item.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="ghost"
                        onClick={() => removeItem(item)}
                        aria-label={`Remove ${item.name}`}
                        disabled={!cart[item.id]?.quantity}
                      >
                        −
                      </button>
                      <span>{cart[item.id]?.quantity || 0}</span>
                      <button onClick={() => addItem(item)} aria-label={`Add ${item.name}`}>
                        +
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* ── Order Panel ── */}
          <aside className="order-panel" aria-label="Order summary">
            <div className="section-heading">
              <div>
                <p className="eyebrow" style={{ color: "var(--text-muted)", marginBottom: 4 }}>Quick order</p>
                <h2>Your plate 🍛</h2>
              </div>
              <span>{itemCount}</span>
            </div>

            {cartItems.length === 0 ? (
              <p className="empty">Add items from the menu to see your estimated total here.</p>
            ) : (
              <div className="order-list">
                {cartItems.map(({ item, quantity }) => (
                  <div className="order-row" key={item.id}>
                    <img src={item.image} alt="" onError={handleImageError} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>₹{item.price} × {quantity}</span>
                    </div>
                    <span>₹{item.price * quantity}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="total-row">
              <span>Estimated total</span>
              <strong>₹{total}</strong>
            </div>
            <button className="wide-button" disabled={cartItems.length === 0}>
              Show at counter →
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
