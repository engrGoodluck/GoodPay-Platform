import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  CircleHelp,
  Wallet,
  CreditCard,
  ShieldCheck,
  Send,
  Mail,
  MessageCircle,
  Search,
} from "lucide-react";

const faqs = [
  {
    category: "Wallet",
    question: "How do I add money to my GoodPay wallet?",
    answer:
      "Open My Wallet and select Add Money. Enter your preferred amount and follow the instructions. In this development preview, wallet funding is simulated and does not represent real funds.",
  },
  {
    category: "Wallet",
    question: "How can I check my wallet balance?",
    answer:
      "Visit My Wallet from the sidebar to view your current NGN balance. Your balance is also displayed on your dashboard.",
  },
  {
    category: "Transfers",
    question: "How do I send money to another GoodPay user?",
    answer:
      "Open Send Money, enter the recipient's registered email address, specify the amount and review the transfer details before confirming.",
  },
  {
    category: "Transfers",
    question: "What happens if I enter the wrong recipient email?",
    answer:
      "Always verify the recipient's details before confirming a transfer. If you notice an issue, contact our support team with your transaction reference.",
  },
  {
    category: "Transactions",
    question: "Where can I find my transaction details?",
    answer:
      "Select a transaction from the Recent Transactions section on your dashboard to view its details and download its receipt.",
  },
  {
    category: "Cards",
    question: "How do I add a payment card?",
    answer:
      "Open Cards from the sidebar and use the Add Card option. The current development version stores placeholder card information only and does not process real card payments.",
  },
  {
    category: "Security",
    question: "How can I change my password?",
    answer:
      "Open Settings, navigate to Change Password, enter your current password and choose a new password of at least eight characters.",
  },
  {
    category: "Security",
    question: "What should I do if I forget my password?",
    answer:
      "Use the Forgot Password option on the login page. Follow the password reset instructions sent to your registered email address.",
  },
];

const categories = [
  { label: "Wallet", icon: Wallet },
  { label: "Transfers", icon: Send },
  { label: "Cards", icon: CreditCard },
  { label: "Security", icon: ShieldCheck },
];

function Support() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState(0);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === "All" || faq.category === activeCategory;

    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      faq.question.toLowerCase().includes(searchText) ||
      faq.answer.toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="support-page">
      <div className="support-header">
        <div>
          <button
            className="support-back-button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={17} /> Back to Overview
          </button>

          <h1>Help & Support</h1>
          <p>Find answers and get help with your GoodPay account.</p>
        </div>
      </div>

      <div className="support-hero">
        <div className="support-hero-content">
          <span className="support-hero-tag">
            <CircleHelp size={15} /> GOODPAY HELP CENTRE
          </span>

          <h2>How can we help you today?</h2>

          <p>
            Explore helpful information about your wallet, transfers, cards and
            account security.
          </p>

          <div className="support-search">
            <Search size={19} />
            <input
              type="search"
              placeholder="Search for answers..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setOpenFaq(-1);
              }}
            />
          </div>
        </div>

        <div className="support-hero-decoration">
          <MessageCircle size={75} strokeWidth={1.2} />
        </div>
      </div>

      <section className="support-categories">
        <div className="support-section-heading">
          <h2>Browse by topic</h2>
          <p>Choose a category to find relevant answers.</p>
        </div>

        <div className="support-category-grid">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <button
                className="support-category-card"
                key={category.label}
                onClick={() => {
                  setActiveCategory(category.label);
                  setOpenFaq(-1);
                }}
              >
                <span className="support-category-icon">
                  <Icon size={22} />
                </span>
                <strong>{category.label}</strong>
                <ArrowUpRight size={16} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="support-faq-section">
        <div className="support-section-heading">
          <h2>Frequently asked questions</h2>
          <p>Answers to common questions about using GoodPay.</p>
        </div>

        <div className="support-category-tabs">
          {[
            "All",
            "Wallet",
            "Transfers",
            "Transactions",
            "Cards",
            "Security",
          ].map((category) => (
            <button
              key={category}
              className={
                activeCategory === category ? "support-tab-active" : ""
              }
              onClick={() => {
                setActiveCategory(category);
                setOpenFaq(-1);
              }}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="support-faq-list">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div className="support-faq-item" key={faq.question}>
                <button
                  className="support-faq-question"
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={19}
                    className={openFaq === index ? "faq-chevron-open" : ""}
                  />
                </button>

                {openFaq === index && (
                  <div className="support-faq-answer">{faq.answer}</div>
                )}
              </div>
            ))
          ) : (
            <div className="support-empty">
              No matching questions found. Try another search.
            </div>
          )}
        </div>
      </section>

      <section className="support-contact-card">
        <div className="support-contact-icon">
          <Mail size={25} />
        </div>

        <div className="support-contact-content">
          <span>NEED MORE HELP?</span>
          <h2>We're here to help.</h2>
          <p>
            Can't find the answer you're looking for? Send our support team an
            email and include any relevant transaction reference.
          </p>
          <a href="mailto:goodpaysupport@gmail.com">
            <Mail size={17} /> Contact Support <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      <p className="support-disclaimer">
        GoodPay development preview. Wallet funding, transfers and card features
        are simulated and do not represent real financial services.
      </p>
    </div>
  );
}

export default Support;
