import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresVerification && data.userId) {
          sessionStorage.setItem("goodpay_pending_user_id", data.userId);
          sessionStorage.setItem("goodpay_pending_email", email);
          navigate("/register");
          return;
        }

        throw new Error(data.message || "Login failed.");
      }

      sessionStorage.setItem("goodpay_token", data.token);
      sessionStorage.setItem("goodpay_user", JSON.stringify(data.user));

      navigate("/dashboard");
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
        <Link to="/dashboard" className="auth-brand">
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
            <p className="auth-eyebrow">WELCOME BACK TO GOODPAY</p>
            <h1>Welcome back!</h1>
            <p>Log in to access your wallet and manage your money.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>

              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  maxLength={72}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "-8px",
                marginBottom: "8px",
              }}
            >
              <Link
                to="/forgot-password"
                style={{
                  color: "#492AC3",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </Link>
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in to GoodPay"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create account</Link>
          </p>
        </div>

        <p className="auth-footer">
          <LockKeyhole size={15} /> Secure access to your account.
        </p>
      </div>
    </div>
  );
}

export default Login;
