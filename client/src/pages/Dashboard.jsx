import { useState, useEffect } from "react";
import API_URL from "../api";
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
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Menu,
  X,
  MoreHorizontal,
  Send,
  Download,
  ChevronDown,
  Users,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("all");
  const [transactionDateFilter, setTransactionDateFilter] = useState("all");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const filteredTransactions = transactions.filter((transaction) => {
    const searchTerm = transactionSearch.toLowerCase().trim();

    const matchesSearch =
      !searchTerm ||
      transaction.reference?.toLowerCase().includes(searchTerm) ||
      transaction.description?.toLowerCase().includes(searchTerm) ||
      transaction.transaction_type?.toLowerCase().includes(searchTerm) ||
      transaction.reference?.toLowerCase().includes(searchTerm);

    const matchesType =
      transactionTypeFilter === "all" ||
      transaction.transaction_type === transactionTypeFilter;

    const matchesStatus =
      transactionStatusFilter === "all" ||
      transaction.status === transactionStatusFilter;

    const transactionDate = new Date(transaction.created_at);
    const now = new Date();

    const matchesDate =
      transactionDateFilter === "all" ||
      (transactionDateFilter === "7days" &&
        transactionDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) ||
      (transactionDateFilter === "30days" &&
        transactionDate >=
          new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) ||
      (transactionDateFilter === "90days" &&
        transactionDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });
  const [financialSummary, setFinancialSummary] = useState({
    total_income: 0,
    total_expenses: 0,
  });

  const [dashboardDateRange, setDashboardDateRange] = useState("7days");

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlyError, setMonthlyError] = useState("");
  const [chartRange, setChartRange] = useState("7months");
  const [dailySummary, setDailySummary] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState("");
  const hasMonthlyActivity = monthlySummary.some(
    (item) => Number(item.income) > 0 || Number(item.expenses) > 0,
  );

  const hasDailyActivity = dailySummary.some(
    (item) => Number(item.income) > 0 || Number(item.expenses) > 0,
  );
  const [user, setUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      const token = sessionStorage.getItem("goodpay_token");

      if (!token) {
        setWalletError("Please log in to view your wallet.");
        setWalletLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/wallet`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load wallet.");
        }

        const ngnWallet = data.wallets.find(
          (wallet) => wallet.currency === "NGN",
        );

        setWalletBalance(Number(ngnWallet?.balance ?? 0));
      } catch (error) {
        setWalletError(error.message || "Unable to load wallet balance.");
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWallet();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = sessionStorage.getItem("goodpay_token");

      if (!token) {
        setTransactionsError("Please log in to view transactions.");
        setTransactionsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/transactions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load transactions.");
        }

        setTransactions(data.transactions);
      } catch (error) {
        setTransactionsError(error.message || "Unable to load transactions.");
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = sessionStorage.getItem("goodpay_token");

      if (!token) {
        setProfileLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load profile.");
        }

        setUser(data.user);
      } catch (error) {
        console.error("Profile error:", error.message);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      const token = sessionStorage.getItem("goodpay_token");

      if (!token) return;

      try {
        const response = await fetch(
          `${API_URL}/api/notifications`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setUnreadNotificationCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Notifications error:", error.message);
      }
    };

    fetchUnreadNotifications();
  }, []);

  useEffect(() => {
    const fetchFinancialSummary = async () => {
      const token = sessionStorage.getItem("goodpay_token");

      if (!token) {
        setSummaryError("Please log in to view your financial summary.");
        setSummaryLoading(false);
        return;
      }

      try {
        setSummaryLoading(true);
        setSummaryError("");

        const response = await fetch(`${API_URL}/api/transactions/summary?range=${dashboardDateRange}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load financial summary.");
        }

        setFinancialSummary({
          total_income: Number(data.summary.total_income || 0),
          total_expenses: Number(data.summary.total_expenses || 0),
        });
      } catch (error) {
        setSummaryError(error.message || "Unable to load financial summary.");
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchFinancialSummary();
  }, [dashboardDateRange]);

  useEffect(() => {
    const fetchMonthlySummary = async () => {
      const token = sessionStorage.getItem("goodpay_token");

      if (!token) {
        setMonthlyError("Please log in to view your financial activity.");
        setMonthlyLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/transactions/monthly-summary`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load monthly activity.");
        }

        setMonthlySummary(
          data.monthlySummary.map((item) => ({
            ...item,
            income: Number(item.income),
            expenses: Number(item.expenses),
          })),
        );
      } catch (error) {
        setMonthlyError(error.message || "Unable to load monthly activity.");
      } finally {
        setMonthlyLoading(false);
      }
    };

    fetchMonthlySummary();
  }, []);

  useEffect(() => {
    const fetchDailySummary = async () => {
      try {
        const token = sessionStorage.getItem("goodpay_token");

        const response = await fetch(`${API_URL}/api/transactions/daily-summary`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load daily activity.");
        }

        setDailySummary(
          data.dailySummary.map((item) => ({
            ...item,
            income: Number(item.income),
            expenses: Number(item.expenses),
          })),
        );
      } catch (error) {
        setDailyError(error.message);
      } finally {
        setDailyLoading(false);
      }
    };

    fetchDailySummary();
  }, []);

  const navigation = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      active: true,
      path: "/dashboard",
    },
    { label: "Transactions", icon: ArrowLeftRight, path: "/transactions" },
    { label: "My Wallet", icon: Wallet, path: "/wallet" },
    { label: "Cards", icon: CreditCard, path: "/cards" },
  ];

  const secondaryNavigation = [
    { label: "Settings", icon: Settings, path: "/settings" },
    { label: "Help & Support", icon: HelpCircle, path: "/support" },
  ];

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
            className="sidebar-logo"
            style={{
              width: "64px",
              height: "64px",
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
                className={`nav-item ${item.active ? "nav-active" : ""}`}
                onClick={() => navigate(item.path)}
                key={item.label}
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

          <button
            className="nav-item logout-item"
            onClick={() => {
              sessionStorage.removeItem("goodpay_token");
              sessionStorage.removeItem("goodpay_user");
              navigate("/login", { replace: true });
            }}
          >
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
              <p className="welcome-label">Welcome back,</p>
              <h2>
                {profileLoading
                  ? "Loading..."
                  : user
                    ? user.first_name
                    : "there"}{" "}
                <span>👋</span>
              </h2>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <Search size={18} />
              <input placeholder="Search anything..." />
              <span>⌘ K</span>
            </div>
            <button
              className="notification-button"
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
            >
              <Bell size={20} />

              {unreadNotificationCount > 0 && (
                <span className="notification-count">
                  {unreadNotificationCount > 99
                    ? "99+"
                    : unreadNotificationCount}
                </span>
              )}
            </button>
            <div className="profile-menu-container">
              <button
                className="profile-button"
                onClick={() => setProfileMenuOpen((previous) => !previous)}
                aria-expanded={profileMenuOpen}
              >
                <div className="avatar">
                  {user?.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt="Profile"
                      className="dashboard-avatar-image"
                    />
                  ) : user ? (
                    `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
                  ) : (
                    "GP"
                  )}
                </div>

                <div className="profile-info">
                  <strong>
                    {profileLoading
                      ? "Loading..."
                      : user
                        ? `${user.first_name} ${user.last_name}`
                        : "GoodPay User"}
                  </strong>
                  <span>Personal account</span>
                </div>

                <ChevronDown size={16} />
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <Users size={17} />
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate("/settings");
                    }}
                  >
                    <Settings size={17} />
                    Account Settings
                  </button>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate("/settings");
                    }}
                  >
                    <ShieldCheck size={17} />
                    Security
                  </button>

                  <div className="profile-dropdown-divider" />

                  <button
                    className="profile-logout"
                    onClick={() => {
                      sessionStorage.removeItem("goodpay_token");
                      sessionStorage.removeItem("goodpay_user");
                      navigate("/login");
                    }}
                  >
                    <LogOut size={17} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR FINANCIAL OVERVIEW</p>
              <h1>Dashboard</h1>
              <p className="page-subtitle">
                Here's what's happening with your money today.
              </p>
            </div>
            <select
              className="date-filter"
              value={dashboardDateRange}
              onChange={(e) => setDashboardDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <section className="overview-grid">
            <div className="balance-card">
              <div className="balance-card-top">
                <span>Total wallet balance</span>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  aria-label="Toggle balance visibility"
                >
                  {balanceVisible ? <Eye size={19} /> : <EyeOff size={19} />}
                </button>
              </div>
              <h2>
                {!balanceVisible
                  ? "••••••••••"
                  : walletLoading
                    ? "Loading..."
                    : walletError
                      ? "Unavailable"
                      : `₦${walletBalance.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
              </h2>
              <div className="balance-card-footer">
                <span>
                  <i /> Your account is active
                </span>
                <span>NGN Wallet</span>
              </div>
              <div className="balance-decoration" />
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span>Total income</span>
                <div className="stat-icon income-icon">
                  <ArrowDownLeft size={19} />
                </div>
              </div>
              <h3>
                {summaryLoading
                  ? "Loading..."
                  : summaryError
                    ? "Unavailable"
                    : `₦${financialSummary.total_income.toLocaleString(
                        "en-NG",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}`}
              </h3>
              <p className="stat-change positive">
                <ArrowDownLeft size={15} />
                <span>Total successful incoming transactions</span>
              </p>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span>Total expenses</span>
                <div className="stat-icon expense-icon">
                  <ArrowUpRight size={19} />
                </div>
              </div>
              <h3>
                {summaryLoading
                  ? "Loading..."
                  : summaryError
                    ? "Unavailable"
                    : `₦${financialSummary.total_expenses.toLocaleString(
                        "en-NG",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}`}
              </h3>
              <p className="stat-change positive">
                <ArrowUpRight size={15} />
                <span>Total successful outgoing transactions</span>
              </p>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="panel spending-panel">
              <div className="panel-heading">
                <div>
                  <h3>Financial overview</h3>
                  <p>
                    {chartRange === "30days"
                      ? "Your income and expenses over the last 30 days"
                      : chartRange === "6months"
                        ? "Your income and expenses over the last 6 months"
                        : "Your income and expenses over the last 7 months"}
                  </p>
                </div>

                <select
                  className="chart-range-select"
                  value={chartRange}
                  onChange={(e) => setChartRange(e.target.value)}
                >
                  <option value="7months">7 months</option>
                  <option value="6months">6 months</option>
                  <option value="30days">30 days</option>
                </select>
              </div>

              <div className="chart-legend">
                <span>
                  <i className="legend-income" /> Income
                </span>
                <span>
                  <i className="legend-expense" /> Expenses
                </span>
              </div>

              <div className="chart-container">
                {chartRange === "30days" ? (
                  dailyLoading ? (
                    <p className="page-subtitle">Loading daily activity...</p>
                  ) : dailyError ? (
                    <p className="page-subtitle">{dailyError}</p>
                  ) : !hasDailyActivity ? (
                    <div className="chart-empty-state">
                      <div className="chart-empty-icon">
                        <Activity size={26} />
                      </div>
                      <h4>No activity yet</h4>
                      <p>
                        Your daily income and expenses will appear here once you
                        start using your GoodPay wallet.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailySummary}>
                        <defs>
                          <linearGradient
                            id="incomeGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#492AC3"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="#492AC3"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="expenseGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#01B882"
                              stopOpacity={0.15}
                            />
                            <stop
                              offset="95%"
                              stopColor="#01B882"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9698a7", fontSize: 10 }}
                          interval={4}
                          dy={10}
                        />

                        <Tooltip
                          formatter={(value, name) => [
                            `₦${Number(value).toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`,
                            name === "income" ? "Income" : "Expenses",
                          ]}
                        />

                        <Area
                          type="monotone"
                          dataKey="income"
                          stroke="#492AC3"
                          strokeWidth={2.5}
                          fill="url(#incomeGradient)"
                        />
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          stroke="#01B882"
                          strokeWidth={2.5}
                          fill="url(#expenseGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                ) : monthlyLoading ? (
                  <p className="page-subtitle">Loading financial activity...</p>
                ) : monthlyError ? (
                  <p className="page-subtitle">{monthlyError}</p>
                ) : !hasMonthlyActivity ? (
                  <div className="chart-empty-state">
                    <div className="chart-empty-icon">
                      <Activity size={26} />
                    </div>
                    <h4>No activity yet</h4>
                    <p>
                      Your monthly income and expenses will appear here once you
                      start using your GoodPay wallet.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={
                        chartRange === "6months"
                          ? monthlySummary.slice(-6)
                          : monthlySummary
                      }
                    >
                      <defs>
                        <linearGradient
                          id="incomeGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#492AC3"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#492AC3"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="expenseGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#01B882"
                            stopOpacity={0.15}
                          />
                          <stop
                            offset="95%"
                            stopColor="#01B882"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9698a7", fontSize: 12 }}
                        dy={10}
                      />

                      <Tooltip
                        formatter={(value, name) => [
                          `₦${Number(value).toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`,
                          name === "income" ? "Income" : "Expenses",
                        ]}
                      />

                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#492AC3"
                        strokeWidth={2.5}
                        fill="url(#incomeGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#01B882"
                        strokeWidth={2.5}
                        fill="url(#expenseGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="panel quick-actions-panel">
              <div className="panel-heading">
                <div>
                  <h3>Quick actions</h3>
                  <p>Manage your money faster</p>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  className="quick-action"
                  onClick={() => navigate("/send-money")}
                >
                  <div className="action-icon">
                    <Send size={20} />
                  </div>
                  <span>Send money</span>
                  <ArrowUpRight size={16} />
                </button>
                <button
                  className="quick-action"
                  onClick={() => navigate("/add-money")}
                >
                  <div className="action-icon green-action">
                    <Download size={20} />
                  </div>
                  <span>Add money</span>
                  <ArrowUpRight size={16} />
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate("/beneficiaries")}
                >
                  <div className="action-icon">
                    <Users size={20} />
                  </div>
                  <span>Beneficiaries</span>
                  <ArrowUpRight size={16} />
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate("/cards")}
                >
                  <div className="action-icon blue-action">
                    <CreditCard size={20} />
                  </div>
                  <span>Payment cards</span>
                  <ArrowUpRight size={16} />
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate("/send-money")}
                >
                  <div className="action-icon orange-action">
                    <ArrowLeftRight size={20} />
                  </div>
                  <span>Transfer</span>
                  <ArrowUpRight size={16} />
                </button>
                <button
                  className="quick-action"
                  onClick={() => navigate("/services")}
                >
                  <div className="action-icon blue-action">
                    <Plus size={20} />
                  </div>
                  <span>More services</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </section>

          <section className="panel transactions-panel">
            <div className="panel-heading transactions-heading">
              <div>
                <h3>Recent transactions</h3>
                <p>Keep track of your latest activity</p>
              </div>
              <button className="view-all-button">
                View all <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="transaction-filters">
              <input
                type="text"
                className="transaction-search"
                placeholder="Search transactions..."
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
              />

              <select
                className="transaction-filter-select"
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
              >
                <option value="all">All types</option>
                <option value="deposit">Deposits</option>
                <option value="transfer">Transfers</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="payment">Payments</option>
              </select>

              <select
                className="transaction-filter-select"
                value={transactionStatusFilter}
                onChange={(e) => setTransactionStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="successful">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="reversed">Reversed</option>
              </select>

              <select
                className="transaction-filter-select"
                value={transactionDateFilter}
                onChange={(e) => setTransactionDateFilter(e.target.value)}
              >
                <option value="all">All time</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
              </select>
            </div>

            <div className="transaction-list">
              {transactionsLoading ? (
                <p className="page-subtitle">Loading transactions...</p>
              ) : transactionsError ? (
                <p className="page-subtitle">{transactionsError}</p>
              ) : transactions.length === 0 ? (
                <div className="empty-transactions">
                  <div className="action-icon purple-action">
                    <ArrowLeftRight size={22} />
                  </div>
                  <div className="transactions-empty-state">
                    <div className="transactions-empty-icon">
                      <ArrowLeftRight size={24} />
                    </div>
                    <strong>No transactions yet</strong>
                    <p>
                      Your transactions will appear here when you start using
                      GoodPay.
                    </p>
                  </div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="transactions-empty-state">
                  <div className="transactions-empty-icon">
                    <Search size={24} />
                  </div>
                  <strong>No matching transactions</strong>
                  <p>
                    Try changing your search or filters to find what you're
                    looking for.
                  </p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => {
                  const isCredit = transaction.direction === "credit";
                  const transactionName = transaction.transaction_type
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (letter) => letter.toUpperCase());

                  const formattedAmount = new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: transaction.currency || "NGN",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(Number(transaction.amount));

                  const formattedDate = new Date(
                    transaction.created_at,
                  ).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  });

                  return (
                    <div
                      className="transaction-row transaction-row-clickable"
                      key={transaction.id}
                      onClick={() =>
                        navigate(`/transactions/${transaction.id}`)
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/transactions/${transaction.id}`);
                        }
                      }}
                    >
                      <div
                        className={`transaction-icon ${isCredit ? "green" : "red"}`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft size={20} />
                        ) : (
                          <ArrowUpRight size={20} />
                        )}
                      </div>

                      <div className="transaction-details">
                        <strong>{transactionName}</strong>

                        {transaction.description && (
                          <span className="transaction-description">
                            {transaction.description}
                          </span>
                        )}

                        <span>
                          {transaction.status} · {transaction.reference}
                        </span>
                      </div>

                      <span className="transaction-date">{formattedDate}</span>

                      <strong
                        className={`transaction-amount ${
                          isCredit ? "income" : "expense"
                        }`}
                      >
                        {isCredit ? "+" : "-"}
                        {formattedAmount}
                      </strong>

                      <button
                        className="transaction-more"
                        aria-label="Transaction options"
                      >
                        <MoreHorizontal size={19} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <p className="dashboard-disclaimer">
            Your wallet balance, income, expenses, and transaction history are
            account-specific. Money movements are simulated for development and
            do not represent real funds.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
