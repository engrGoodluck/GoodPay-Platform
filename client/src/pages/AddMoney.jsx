import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import "./Auth.css";

function AddMoney() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const quickAmounts = [1000, 5000, 10000, 20000];

  const formattedAmount = Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleFunding = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(null);

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (numericAmount > 10000000) {
      setError("The maximum simulated funding amount is ₦10,000,000.");
      return;
    }

    const token = sessionStorage.getItem("goodpay_token");

    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/wallet/fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numericAmount.toFixed(2),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Funding failed.");
      }

      setSuccess({
        amount: data.wallet.balance,
        reference: data.transaction.reference,
      });

      setAmount("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
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

        <div className="auth-card">
          {success ? (
            <div className="funding-success">
              <div className="success-icon">
                <CheckCircle2 size={34} />
              </div>

              <h2>Funding successful!</h2>

              <p>Your simulated wallet funding has been completed.</p>

              <div className="funding-summary">
                <span>Updated wallet balance</span>
                <strong>
                  ₦
                  {Number(success.amount).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>
                <span>Transaction reference</span>
                <small>{success.reference}</small>
              </div>

              <button
                className="auth-submit"
                onClick={() => navigate("/dashboard")}
              >
                Return to dashboard <ArrowRight size={18} />
              </button>

              <button
                className="funding-another"
                onClick={() => setSuccess(null)}
              >
                Fund another amount
              </button>
            </div>
          ) : (
            <>
              <div className="auth-heading">
                <div className="funding-icon">
                  <Wallet size={25} />
                </div>

                <h1>Add money</h1>

                <p>Add funds to your GoodPay NGN wallet.</p>
              </div>

              <form onSubmit={handleFunding}>
                <div className="funding-amount-card">
                  <label htmlFor="funding-amount">Amount to add</label>

                  <div className="funding-input-wrapper">
                    <span>₦</span>

                    <input
                      id="funding-amount"
                      type="number"
                      min="1"
                      max="10000000"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      required
                    />
                  </div>

                  <span className="funding-currency">Nigerian Naira (NGN)</span>
                </div>

                <div className="quick-amounts">
                  {quickAmounts.map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={Number(amount) === value ? "selected" : ""}
                      onClick={() => setAmount(String(value))}
                    >
                      ₦{value.toLocaleString("en-NG")}
                    </button>
                  ))}
                </div>

                {amount && Number(amount) > 0 && (
                  <div className="funding-review">
                    <span>Funding amount</span>
                    <strong>₦{formattedAmount}</strong>
                  </div>
                )}

                {error && (
                  <div className="auth-error">
                    <AlertCircle size={17} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading || !amount}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="funding-notice">
                <ShieldCheck size={20} />

                <div>
                  <strong>Development simulation</strong>
                  <p>
                    This feature uses simulated funding. No real payment or bank
                    transfer will occur.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="auth-footer">
          GoodPay · Secure digital finance experience
        </p>
      </div>
    </div>
  );
}

export default AddMoney;
