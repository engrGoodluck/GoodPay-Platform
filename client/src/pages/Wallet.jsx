import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet as WalletIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

function Wallet() {
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = sessionStorage.getItem("goodpay_token");

        const response = await fetch("http://localhost:5000/api/wallet", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load wallet.");
        }

        const wallets = Array.isArray(data) ? data : data.wallets || [];

        setWallet(wallets.find((item) => item.currency === "NGN") || null);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(Number(amount || 0));

  return (
    <div className="wallet-page">
      <div className="wallet-page-header">
        <div>
          <button
            className="wallet-back-button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={17} /> Back to Overview
          </button>
          <h1>My Wallet</h1>
          <p>Manage your GoodPay wallet and view your available balance.</p>
        </div>

        <button
          className="wallet-refresh-button"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={17} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="wallet-message">Loading your wallet...</div>
      ) : error ? (
        <div className="wallet-message wallet-error">{error}</div>
      ) : (
        <>
          <div className="wallet-balance-card">
            <div className="wallet-card-top">
              <div className="wallet-card-icon">
                <WalletIcon size={23} />
              </div>
              <span>NGN WALLET</span>
            </div>

            <p>Available balance</p>
            <h2>{formatMoney(wallet?.balance)}</h2>

            <div className="wallet-card-bottom">
              <span>
                <ShieldCheck size={16} /> Development wallet
              </span>
              <strong>NGN</strong>
            </div>
          </div>

          <div className="wallet-actions">
            <button onClick={() => navigate("/add-money")}>
              <ArrowDownToLine size={19} />
              <span>
                <strong>Add Money</strong>
                <small>Fund your wallet</small>
              </span>
            </button>

            <button onClick={() => navigate("/send-money")}>
              <ArrowUpFromLine size={19} />
              <span>
                <strong>Send Money</strong>
                <small>Transfer to another user</small>
              </span>
            </button>
          </div>

          <div className="wallet-information">
            <div className="wallet-info-icon">
              <ShieldCheck size={21} />
            </div>
            <div>
              <h3>Your wallet is protected</h3>
              <p>
                Your wallet balance is linked to your GoodPay account. Money
                movements in this development preview are simulated and do not
                represent real funds.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Wallet;
