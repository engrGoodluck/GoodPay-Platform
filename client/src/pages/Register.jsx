import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  RefreshCw,
} from "lucide-react";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();

  const pendingUserId = sessionStorage.getItem("goodpay_pending_user_id") || "";
  const pendingEmail = sessionStorage.getItem("goodpay_pending_email") || "";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: pendingEmail,
    phone: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(pendingUserId);
  const [code, setCode] = useState("");
  const [stage, setStage] = useState(pendingUserId ? "verify" : "register");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.userId) {
        setUserId(data.userId);
        setStage("verify");

        sessionStorage.setItem("goodpay_pending_user_id", data.userId);
        sessionStorage.setItem("goodpay_pending_email", formData.email);

        if (response.ok) {
          setMessage(data.message);
        } else {
          setError(
            data.message ||
              "Your account was created, but the email could not be sent. Try resending the code.",
          );
        }

        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }
    } catch (err) {
      setError(err.message || "Unable to connect to GoodPay.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/verify-registration",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, code }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed.");
      }

      sessionStorage.setItem("goodpay_token", data.token);
      sessionStorage.setItem("goodpay_user", JSON.stringify(data.user));

      sessionStorage.removeItem("goodpay_pending_user_id");
      sessionStorage.removeItem("goodpay_pending_email");

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to verify your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/resend-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to resend verification code.");
      }

      setCode("");
      setMessage(data.message);
    } catch (err) {
      setError(err.message || "Unable to resend verification code.");
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
          {stage === "register" ? (
            <>
              <div className="auth-heading">
                <div className="auth-icon">
                  <ShieldCheck size={25} />
                </div>
                <p className="auth-eyebrow">GET STARTED WITH GOODPAY</p>
                <h1>Create your account</h1>
                <p>Join GoodPay and take control of your finances.</p>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-input-row">
                  <div className="auth-field">
                    <label htmlFor="firstName">First name</label>
                    <input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </div>

                  <div className="auth-field">
                    <label htmlFor="lastName">Last name</label>
                    <input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    maxLength={255}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="phone">
                    Phone number <span>(optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    maxLength={30}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="password">Password</label>
                  <div className="password-input">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      required
                      minLength={8}
                      maxLength={72}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  <small>Use at least 8 characters.</small>
                </div>

                <button
                  className="auth-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create account"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <p className="auth-switch">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </>
          ) : (
            <>
              <div className="auth-heading">
                <div className="auth-icon">
                  <Mail size={25} />
                </div>
                <p className="auth-eyebrow">EMAIL VERIFICATION</p>
                <h1>Check your inbox</h1>
                <p>
                  We've sent a six-digit verification code to{" "}
                  <strong>{formData.email || pendingEmail}</strong>. Enter it
                  below to activate your GoodPay account.
                </p>
              </div>

              {error && <div className="auth-error">{error}</div>}
              {message && <div className="auth-success">{message}</div>}

              <form onSubmit={handleVerify} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="verificationCode">Verification code</label>
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit code"
                    required
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoFocus
                  />
                  <small>The code expires after 10 minutes.</small>
                </div>

                <button
                  className="auth-submit"
                  type="submit"
                  disabled={loading || code.length !== 6 || !userId}
                >
                  {loading ? "Verifying..." : "Verify email"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#777",
                    marginBottom: "10px",
                  }}
                >
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || !userId}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#492AC3",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <RefreshCw size={16} />
                  {loading ? "Please wait..." : "Resend verification code"}
                </button>
              </div>

              <p className="auth-switch">
                <Link to="/login">Back to login</Link>
              </p>
            </>
          )}
        </div>

        <p className="auth-footer">
          <ShieldCheck size={15} /> Your information is protected.
        </p>
      </div>
    </div>
  );
}

export default Register;
