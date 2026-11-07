import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
import "./Transactions.css";

function Transactions() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const token = sessionStorage.getItem("goodpay_token");

  const navigation = [
    { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Transactions", icon: ArrowLeftRight, path: "/transactions" },
    { label: "My Wallet", icon: Wallet, path: "/wallet" },
    { label: "Cards", icon: CreditCard, path: "/cards" },
  ];

  const secondaryNavigation = [
    { label: "Settings", icon: Settings, path: "/settings" },
    { label: "Help & Support", icon: HelpCircle, path: "/support" },
  ];

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Profile loading error:", error);
      }
    };

    fetchUser();
  }, [token]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/transactions/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load summary.");
        }

        setSummary({
          total_income: Number(data.summary.total_income || 0),
          total_expenses: Number(data.summary.total_expenses || 0),
        });
      } catch (error) {
        console.error("Transaction summary error:", error);
      }
    };

    fetchSummary();
  }, [token]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) {
        setError("Please log in to view your transactions.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
        });

        if (search.trim()) params.set("search", search.trim());
        if (type) params.set("type", type);
        if (status) params.set("status", status);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const response = await fetch(`${API_URL}/api/transactions?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load transactions.");
        }

        setTransactions(data.transactions || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        );
      } catch (error) {
        setError(error.message || "Unable to load transactions.");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchTransactions, 350);

    return () => clearTimeout(timer);
  }, [token, page, search, type, status, startDate, endDate]);

  const resetFilters = () => {
    setSearch("");
    setType("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("goodpay_token");
    sessionStorage.removeItem("goodpay_user");
    navigate("/login", { replace: true });
  };

  const firstRecord =
    pagination.total === 0 ? 0 : (page - 1) * pagination.limit + 1;

  const lastRecord = Math.min(page * pagination.limit, pagination.total);

  return (
    <div className="dashboard-layout">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
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
          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">MENU</p>
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className={`nav-item ${
                  item.label === "Transactions" ? "nav-active" : ""
                }`}
                key={item.label}
                onClick={() => navigate(item.path)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-section secondary-nav">
          <p className="sidebar-label">PREFERENCES</p>
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className="nav-item"
                key={item.label}
                onClick={() => navigate(item.path)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">
              <HelpCircle size={20} />
            </div>
            <strong>Need help?</strong>
            <p>Our support team is always ready to help.</p>
            <button onClick={() => navigate("/support")}>
              Get support <ArrowUpRight size={15} />
            </button>
          </div>

          <button className="nav-item logout-item" onClick={handleLogout}>
            <LogOut size={19} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={23} />
            </button>

            <div>
              <p className="welcome-label">Your account</p>
              <h2>Transactions</h2>
            </div>
          </div>

          <div className="topbar-right">
            <button className="notification-button" aria-label="Notifications">
              <Bell size={20} />
            </button>

            <button className="profile-button">
              <div className="avatar">
                {user
                  ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
                  : "GP"}
              </div>

              <div className="profile-info">
                <strong>
                  {user
                    ? `${user.first_name} ${user.last_name}`
                    : "GoodPay User"}
                </strong>
                <span>Personal account</span>
              </div>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>

        <div className="dashboard-content transactions-page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR FINANCIAL ACTIVITY</p>
              <h1>Transaction History</h1>
              <p className="page-subtitle">
                Track, search, and manage all your account transactions.
              </p>
            </div>

            <button
              className="date-filter"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <section className="transaction-summary-grid">
            <div className="transaction-summary-card">
              <div className="transaction-summary-icon purple">
                <Receipt size={21} />
              </div>
              <p>Total transactions</p>
              <h2>{pagination.total.toLocaleString("en-NG")}</h2>
              <span>Matching your current filters</span>
            </div>

            <div className="transaction-summary-card">
              <div className="transaction-summary-icon green">
                <ArrowDownLeft size={21} />
              </div>
              <p>Total income</p>
              <h2>{formatMoney(summary.total_income)}</h2>
              <span>All successful incoming transactions</span>
            </div>

            <div className="transaction-summary-card">
              <div className="transaction-summary-icon orange">
                <ArrowUpRight size={21} />
              </div>
              <p>Total expenses</p>
              <h2>{formatMoney(summary.total_expenses)}</h2>
              <span>All successful outgoing transactions</span>
            </div>
          </section>

          <section className="transaction-history-card">
            <div className="transaction-history-heading">
              <div>
                <h2>All transactions</h2>
                <p>Review your complete transaction activity.</p>
              </div>
            </div>

            <div className="transaction-filters">
              <div className="transaction-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search description or reference..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="transfer">Transfers</option>
                <option value="payment">Payments</option>
              </select>

              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                <option value="successful">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="reversed">Reversed</option>
              </select>

              <button className="transaction-reset" onClick={resetFilters}>
                Reset filters
              </button>
            </div>

            <div className="transaction-date-filters">
              <label>
                <CalendarDays size={16} />
                From
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setPage(1);
                  }}
                />
              </label>

              <label>
                <CalendarDays size={16} />
                To
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
            </div>

            <div className="transaction-table-wrapper">
              <table className="transaction-history-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="transaction-table-message">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="transaction-table-message error"
                      >
                        {error}
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="transaction-table-message">
                        <Receipt size={30} />
                        <strong>No transactions found</strong>
                        <span>Try changing your search or filters.</span>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => {
                      const isCredit = transaction.direction === "credit";

                      return (
                        <tr
                          key={transaction.id}
                          onClick={() =>
                            navigate(`/transactions/${transaction.id}`)
                          }
                          className="transaction-history-row"
                        >
                          <td>
                            <div className="transaction-description-cell">
                              <div
                                className={`transaction-direction-icon ${isCredit ? "credit" : "debit"}`}
                              >
                                {isCredit ? (
                                  <ArrowDownLeft size={18} />
                                ) : (
                                  <ArrowUpRight size={18} />
                                )}
                              </div>

                              <div>
                                <strong>
                                  {transaction.description ||
                                    transaction.transaction_type}
                                </strong>
                                <span>
                                  {isCredit ? "Money received" : "Money sent"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="transaction-reference">
                            {transaction.reference}
                          </td>

                          <td>{formatDate(transaction.created_at)}</td>

                          <td>
                            <span className="transaction-type-label">
                              {transaction.transaction_type}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`transaction-status ${transaction.status}`}
                            >
                              {transaction.status}
                            </span>
                          </td>

                          <td
                            className={`transaction-amount ${isCredit ? "credit-text" : "debit-text"}`}
                          >
                            {isCredit ? "+" : "-"}
                            {formatMoney(transaction.amount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="transaction-pagination">
              <span>
                Showing {firstRecord}–{lastRecord} of {pagination.total}{" "}
                transactions
              </span>

              <div>
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>

                <span>
                  Page {page} of {Math.max(1, pagination.totalPages)}
                </span>

                <button
                  disabled={
                    page >= pagination.totalPages ||
                    loading ||
                    pagination.totalPages === 0
                  }
                  onClick={() => setPage((current) => current + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </section>

          <p className="transactions-disclaimer">
            GoodPay development preview: transaction records and money movements
            shown here are simulated.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Transactions;
