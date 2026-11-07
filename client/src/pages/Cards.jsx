import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Plus,
  ShieldCheck,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Wallet,
} from "lucide-react";
import "./Auth.css";

function Cards() {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [cardBrand, setCardBrand] = useState("Visa");
  const [lastFour, setLastFour] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");

  const token = sessionStorage.getItem("goodpay_token");

  const fetchCards = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/cards", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load cards.");
      }

      setCards(data.cards || []);
    } catch (err) {
      setError(err.message || "Could not load saved cards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleAddCard = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    setSaving(true);

    try {
      const response = await fetch("http://localhost:5000/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardBrand,
          lastFour,
          expiryMonth: Number(expiryMonth),
          expiryYear: Number(expiryYear),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not add card.");
      }

      setMessage("Development test card added successfully.");
      setLastFour("");
      setExpiryMonth("");
      setExpiryYear("");
      setShowForm(false);

      await fetchCards();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (cardId) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/cards/${cardId}/default`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update default card.");
      }

      setMessage("Default card updated successfully.");
      await fetchCards();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Are you sure you want to remove this card?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/cards/${cardId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not remove card.");
      }

      setMessage("Card removed successfully.");
      await fetchCards();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  };

  const formatExpiry = (month, year) =>
    `${String(month).padStart(2, "0")}/${year}`;

  return (
    <div className="auth-page cards-page">
      <div className="auth-container cards-container">
        <Link to="/dashboard" className="auth-back-link">
          <ArrowLeft size={17} /> Back to dashboard
        </Link>

        <div className="auth-brand">
          <img
            src="/goodpay-logo.png"
            alt="GoodPay"
            className="auth-brand-logo"
            style={{
              width: "150px",
              height: "150px",
              objectFit: "contain",
            }}
          />
        </div>

        <div className="auth-card cards-main-card">
          <div className="auth-heading">
            <div className="funding-icon">
              <CreditCard size={25} />
            </div>

            <h1>Payment cards</h1>
            <p>Manage your saved payment methods in one place.</p>
          </div>

          <div className="cards-summary">
            <div className="cards-summary-icon">
              <Wallet size={22} />
            </div>

            <div>
              <strong>
                {cards.length} saved {cards.length === 1 ? "card" : "cards"}
              </strong>
              <span>Your payment methods</span>
            </div>

            <button
              className="cards-add-button"
              onClick={() => {
                setError("");
                setMessage("");
                setShowForm(!showForm);
              }}
            >
              {showForm ? <X size={17} /> : <Plus size={17} />}
              {showForm ? "Close" : "Add card"}
            </button>
          </div>

          {message && (
            <div className="cards-success-message">
              <CheckCircle2 size={17} />
              {message}
            </div>
          )}

          {error && (
            <div className="auth-error">
              <AlertCircle size={17} />
              {error}
            </div>
          )}

          {showForm && (
            <form className="cards-form" onSubmit={handleAddCard}>
              <div className="cards-form-heading">
                <h3>Add a test card</h3>
                <p>Enter safe test-card details for this development demo.</p>
              </div>

              <label htmlFor="card-brand">Card brand</label>
              <select
                id="card-brand"
                value={cardBrand}
                onChange={(event) => setCardBrand(event.target.value)}
              >
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="Verve">Verve</option>
                <option value="American Express">American Express</option>
              </select>

              <label htmlFor="card-last-four">Last four digits</label>
              <input
                id="card-last-four"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 4242"
                maxLength={4}
                pattern="[0-9]{4}"
                value={lastFour}
                onChange={(event) =>
                  setLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                required
              />

              <div className="cards-expiry-fields">
                <div>
                  <label htmlFor="expiry-month">Expiry month</label>
                  <select
                    id="expiry-month"
                    value={expiryMonth}
                    onChange={(event) => setExpiryMonth(event.target.value)}
                    required
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {String(index + 1).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="expiry-year">Expiry year</label>
                  <select
                    id="expiry-year"
                    value={expiryYear}
                    onChange={(event) => setExpiryYear(event.target.value)}
                    required
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 21 }, (_, index) => {
                      const year = new Date().getFullYear() + index;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <button className="auth-submit" type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Saving card...
                  </>
                ) : (
                  <>
                    Save test card <Plus size={18} />
                  </>
                )}
              </button>

              <div className="cards-security-note">
                <ShieldCheck size={18} />
                <span>
                  Never enter a real card number or CVV. This demo stores only
                  card brand, last four digits and expiry.
                </span>
              </div>
            </form>
          )}

          <div className="cards-list-heading">
            <h3>Your saved cards</h3>
            <span>{cards.length} total</span>
          </div>

          {loading ? (
            <div className="cards-loading">
              <Loader2 size={24} className="spin" />
              <span>Loading your cards...</span>
            </div>
          ) : cards.length === 0 ? (
            <div className="cards-empty">
              <div>
                <CreditCard size={30} />
              </div>
              <h3>No saved cards yet</h3>
              <p>Add a development test card to see it here.</p>
              <button
                className="cards-empty-button"
                onClick={() => setShowForm(true)}
              >
                <Plus size={17} /> Add your first card
              </button>
            </div>
          ) : (
            <div className="cards-list">
              {cards.map((card) => (
                <div className="saved-card-item" key={card.id}>
                  <div className="saved-card-visual">
                    <div className="saved-card-top">
                      <span>GOODPAY</span>
                      <CreditCard size={21} />
                    </div>

                    <div className="saved-card-number">
                      •••• •••• •••• {card.last_four}
                    </div>

                    <div className="saved-card-bottom">
                      <span>{card.card_brand}</span>
                      <span>
                        {formatExpiry(card.expiry_month, card.expiry_year)}
                      </span>
                    </div>
                  </div>

                  <div className="saved-card-details">
                    <div className="saved-card-title">
                      <strong>{card.card_brand}</strong>
                      {card.is_default && (
                        <span className="default-card-badge">
                          <Star size={12} /> Default
                        </span>
                      )}
                    </div>

                    <p>Ending in {card.last_four}</p>
                    <small>
                      Expires{" "}
                      {formatExpiry(card.expiry_month, card.expiry_year)}
                    </small>

                    <div className="saved-card-actions">
                      {!card.is_default && (
                        <button onClick={() => handleSetDefault(card.id)}>
                          <Star size={15} /> Set as default
                        </button>
                      )}

                      <button
                        className="remove-card-button"
                        onClick={() => handleDeleteCard(card.id)}
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="cards-development-notice">
            <ShieldCheck size={19} />
            <div>
              <strong>Development simulation</strong>
              <p>
                These are simulated saved-card records. No real card is
                verified, charged or used for payments.
              </p>
            </div>
          </div>
        </div>

        <p className="auth-footer">
          GoodPay · Secure digital finance experience
        </p>
      </div>
    </div>
  );
}

export default Cards;
