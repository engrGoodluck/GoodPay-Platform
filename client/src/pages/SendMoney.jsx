import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  UserRound,
  Mail,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  FileText,
} from "lucide-react";
import "./Auth.css";

function SendMoney() {
  const navigate = useNavigate();

  const [recipientEmail, setRecipientEmail] = useState("");
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    const fetchBeneficiaries = async () => {
      const token = sessionStorage.getItem("goodpay_token");

      if (!token) {
        setBeneficiariesLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/beneficiaries",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load beneficiaries.");
        }

        setBeneficiaries(data.beneficiaries || []);
      } catch (err) {
        console.error("Beneficiary loading error:", err);
      } finally {
        setBeneficiariesLoading(false);
      }
    };

    fetchBeneficiaries();
  }, []);

  const quickAmounts = [1000, 5000, 10000, 20000];

  const formattedAmount = Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleReview = (event) => {
    event.preventDefault();
    setError("");

    if (!recipientEmail.trim()) {
      setError("Please enter the recipient's email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid transfer amount.");
      return;
    }

    if (Number(amount) > 10000000) {
      setError("The maximum transfer amount is ₦10,000,000.");
      return;
    }

    setReviewing(true);
  };

  const handleTransfer = async () => {
    setError("");

    const token = sessionStorage.getItem("goodpay_token");

    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          amount: Number(amount).toFixed(2),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Transfer could not be completed.");
      }

      setSuccess({
        transaction: data.transaction,
        recipient: data.recipient,
      });
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

              <h2>Transfer successful!</h2>

              <p>Your money has been sent successfully.</p>

              <div className="funding-summary">
                <span>Amount sent</span>

                <strong>
                  ₦
                  {Number(success.transaction.amount).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>

                <span>Recipient</span>

                <b>
                  {success.recipient.firstName} {success.recipient.lastName}
                </b>

                <small>{success.recipient.email}</small>

                <span>Payment description</span>

                <b>{success.transaction.description || "No description"}</b>

                <span>Transaction reference</span>

                <small>{success.transaction.reference}</small>
              </div>

              <button
                className="auth-submit"
                onClick={() => navigate("/dashboard")}
              >
                Return to dashboard <ArrowRight size={18} />
              </button>

              <button
                className="funding-another"
                onClick={() => {
                  setSuccess(null);
                  setReviewing(false);
                  setRecipientEmail("");
                  setAmount("");
                  setDescription("");
                }}
              >
                Send another transfer
              </button>
            </div>
          ) : reviewing ? (
            <>
              <div className="auth-heading">
                <div className="funding-icon">
                  <ShieldCheck size={25} />
                </div>

                <h1>Review transfer</h1>

                <p>Please confirm these details before sending.</p>
              </div>

              <div className="funding-summary">
                <span>Recipient email</span>
                <b>{recipientEmail}</b>

                <span>Transfer amount</span>
                <strong>₦{formattedAmount}</strong>

                <span>Payment description</span>
                <b>{description.trim() || "No description"}</b>

                <span>Transfer fee</span>
                <b>₦0.00 (development simulation)</b>
              </div>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={17} />
                  {error}
                </div>
              )}

              <button
                className="auth-submit"
                onClick={handleTransfer}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Processing transfer...
                  </>
                ) : (
                  <>
                    Confirm and send <Send size={18} />
                  </>
                )}
              </button>

              <button
                className="funding-another"
                onClick={() => setReviewing(false)}
                disabled={loading}
              >
                Go back and edit
              </button>
            </>
          ) : (
            <>
              <div className="auth-heading">
                <div className="funding-icon">
                  <Send size={25} />
                </div>

                <h1>Send money</h1>

                <p>Transfer money instantly to another GoodPay account.</p>
              </div>

              <form onSubmit={handleReview}>
                <div className="send-recipient-card">
                  {beneficiaries.length > 0 && (
                    <div className="beneficiary-select-wrapper">
                      <label htmlFor="saved-beneficiary">
                        <UserRound size={16} />
                        Choose a saved beneficiary
                      </label>

                      <select
                        id="saved-beneficiary"
                        value={
                          beneficiaries.find(
                            (beneficiary) =>
                              beneficiary.email === recipientEmail,
                          )?.id || ""
                        }
                        onChange={(event) => {
                          const selected = beneficiaries.find(
                            (beneficiary) =>
                              beneficiary.id === event.target.value,
                          );

                          if (selected) {
                            setRecipientEmail(selected.email);
                          }
                        }}
                      >
                        <option value="">Select a beneficiary</option>

                        {beneficiaries.map((beneficiary) => (
                          <option key={beneficiary.id} value={beneficiary.id}>
                            {beneficiary.name} — {beneficiary.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <label htmlFor="recipient-email">
                    Recipient's email address
                  </label>

                  <div className="send-input-wrapper">
                    <Mail size={19} />

                    <input
                      id="recipient-email"
                      type="email"
                      placeholder="Enter recipient's email"
                      value={recipientEmail}
                      onChange={(event) =>
                        setRecipientEmail(event.target.value)
                      }
                      required
                    />
                  </div>

                  <span>
                    The recipient must have an active GoodPay account.
                  </span>
                </div>

                <div className="funding-amount-card">
                  <label htmlFor="transfer-amount">Amount to send</label>

                  <div className="funding-input-wrapper">
                    <span>₦</span>

                    <input
                      id="transfer-amount"
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

                <div className="send-description-card">
                  <label htmlFor="transfer-description">
                    <FileText size={16} />
                    Payment description
                    <span>Optional</span>
                  </label>

                  <textarea
                    id="transfer-description"
                    placeholder="What is this payment for? e.g. School fees, rent..."
                    rows="3"
                    maxLength={160}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />

                  <small>{description.length}/160 characters</small>
                </div>

                {amount && Number(amount) > 0 && (
                  <div className="funding-review">
                    <span>Amount to send</span>
                    <strong>₦{formattedAmount}</strong>
                  </div>
                )}

                {error && (
                  <div className="auth-error">
                    <AlertCircle size={17} />
                    {error}
                  </div>
                )}

                <button type="submit" className="auth-submit">
                  Review transfer <ArrowRight size={18} />
                </button>
              </form>

              <div className="funding-notice">
                <ShieldCheck size={20} />

                <div>
                  <strong>Secure development simulation</strong>
                  <p>
                    Transfers are simulated between GoodPay test wallets. No
                    real money will move.
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

export default SendMoney;
