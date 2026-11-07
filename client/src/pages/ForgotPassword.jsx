import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, LockKeyhole } from "lucide-react";
import "./Auth.css";
import API_URL from "../api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      setMessage(data.message);
    } catch (err) {
      setError(err.message || "Unable to connect to GoodPay.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />

      <div className="auth-container">
        <Link to="/login" className="auth-brand">
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
        </Link>

        <div className="auth-card">
          <div className="auth-heading">
            <div className="auth-icon">
              <LockKeyhole size={25} />
            </div>

            <p className="auth-eyebrow">ACCOUNT RECOVERY</p>
            <h1>Forgot your password?</h1>
            <p>
              No worries. Enter the email address associated with your GoodPay
              account and we'll help you reset your password.
            </p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {message && <div className="auth-success">{message}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email address</label>

              <div className="password-input">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Sending request..." : "Continue"}
            </button>
          </form>

          <p className="auth-switch">
            Remember your password? <Link to="/login">Back to login</Link>
          </p>
        </div>

        <p className="auth-footer">
          <LockKeyhole size={15} /> Your account security matters to us.
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
