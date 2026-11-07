import { useNavigate } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  Users,
  Receipt,
  Headset,
  PlusCircle,
  Send,
  ArrowUpRight,
  ArrowLeft,
} from "lucide-react";
import "./Services.css";

function Services() {
  const navigate = useNavigate();

  const services = [
    {
      title: "My Wallet",
      description: "View your wallet balance and manage your money.",
      icon: Wallet,
      color: "purple",
      path: "/wallet",
    },
    {
      title: "Add Money",
      description: "Add funds to your GoodPay wallet.",
      icon: PlusCircle,
      color: "green",
      path: "/add-money",
    },
    {
      title: "Send Money",
      description: "Transfer money to another GoodPay user.",
      icon: Send,
      color: "orange",
      path: "/send-money",
    },
    {
      title: "Beneficiaries",
      description: "Manage your saved recipients.",
      icon: Users,
      color: "blue",
      path: "/beneficiaries",
    },
    {
      title: "Payment Cards",
      description: "View and manage your saved cards.",
      icon: CreditCard,
      color: "pink",
      path: "/cards",
    },
    {
      title: "Transactions",
      description: "View your transaction history and receipts.",
      icon: Receipt,
      color: "teal",
      path: "/transactions",
    },
    {
      title: "Help & Support",
      description: "Find answers and get assistance.",
      icon: Headset,
      color: "indigo",
      path: "/support",
    },
  ];

  return (
    <div className="services-page">
      <button
        className="services-back-button"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft size={17} />
        Back to Dashboard
      </button>

      <div className="services-heading">
        <span className="services-eyebrow">GOODPAY SERVICES</span>
        <h1>More services</h1>
        <p>Everything you need to manage your money, all in one place.</p>
      </div>

      <div className="services-grid">
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <button
              className="service-card"
              key={service.title}
              onClick={() => navigate(service.path)}
            >
              <div className={`service-icon ${service.color}`}>
                <Icon size={23} />
              </div>

              <div className="service-card-content">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>

              <ArrowUpRight className="service-arrow" size={19} />
            </button>
          );
        })}
      </div>

      <div className="services-note">
        <span>GoodPay</span>
        <p>Your financial tools, conveniently organised in one place.</p>
      </div>
    </div>
  );
}

export default Services;
