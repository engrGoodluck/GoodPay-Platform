import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Wallet,
  ShieldCheck,
  ArrowLeftRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import "./Onboarding.css";

const onboardingScreens = [
  {
    eyebrow: "WELCOME TO GOODPAY",
    title: "Your money.\nYour control.",
    description:
      "A smarter way to manage your money. Enjoy a simple, convenient wallet experience designed around you.",
    icon: Wallet,
    visual: "wallet",
  },
  {
    eyebrow: "SIMPLE. SECURE. SEAMLESS.",
    title: "Move money\nwith confidence.",
    description:
      "Manage your wallet, send money, and keep track of your finances with a secure and seamless experience.",
    icon: ShieldCheck,
    visual: "security",
  },
];

function Onboarding() {
  const navigate = useNavigate();

  const [currentScreen, setCurrentScreen] = useState(0);

  const hasCompletedOnboarding =
    localStorage.getItem("goodpay_onboarding_complete") === "true";

  if (hasCompletedOnboarding) {
    return <Navigate to="/login" replace />;
  }

  const finishOnboarding = () => {
    localStorage.setItem("goodpay_onboarding_complete", "true");
    navigate("/login", { replace: true });
  };

  const nextScreen = () => {
    if (currentScreen === onboardingScreens.length - 1) {
      finishOnboarding();
    } else {
      setCurrentScreen((previous) => previous + 1);
    }
  };

  const previousScreen = () => {
    setCurrentScreen((previous) => Math.max(0, previous - 1));
  };

  const screen = onboardingScreens[currentScreen];
  const IllustrationIcon = screen.icon;

  return (
    <main className="onboarding-page">
      <div className="onboarding-background-orb orb-one" />
      <div className="onboarding-background-orb orb-two" />

      <div className="onboarding-container">
        <header className="onboarding-header">
          <div className="onboarding-brand">
            <img src="/goodpay-logo.png" alt="GoodPay" />
          </div>

          <button
            type="button"
            className="onboarding-skip"
            onClick={finishOnboarding}
          >
            Skip
          </button>
        </header>

        <section className="onboarding-content" key={currentScreen}>
          <div className={`onboarding-illustration ${screen.visual}`}>
            <div className="illustration-glow" />

            <div className="illustration-orbit orbit-one" />
            <div className="illustration-orbit orbit-two" />

            <div className="illustration-main-card">
              <div className="illustration-card-top">
                <div className="illustration-brand-mark">
                  <Wallet size={23} />
                </div>
                <Sparkles size={20} className="illustration-sparkle" />
              </div>

              <div className="illustration-card-label">GOODPAY WALLET</div>

              <div className="illustration-card-balance">
                Your money, simplified
              </div>

              <div className="illustration-card-bottom">
                <span>•••• •••• •••• 2026</span>
                <ArrowLeftRight size={22} />
              </div>
            </div>

            <div className="illustration-floating-icon floating-icon-one">
              <IllustrationIcon size={27} />
            </div>

            <div className="illustration-floating-icon floating-icon-two">
              <CheckCircle2 size={25} />
            </div>

            <div className="illustration-floating-icon floating-icon-three">
              <ArrowLeftRight size={24} />
            </div>
          </div>

          <div className="onboarding-text">
            <span className="onboarding-eyebrow">{screen.eyebrow}</span>

            <h1>
              {screen.title.split("\n").map((line, index) => (
                <span key={index}>
                  {line}
                  {index === 0 && <br />}
                </span>
              ))}
            </h1>

            <p>{screen.description}</p>
          </div>
        </section>

        <footer className="onboarding-footer">
          <div className="onboarding-progress">
            {onboardingScreens.map((_, index) => (
              <span
                key={index}
                className={index === currentScreen ? "active" : ""}
              />
            ))}
          </div>

          <div className="onboarding-navigation">
            {currentScreen > 0 ? (
              <button
                type="button"
                className="onboarding-back"
                onClick={previousScreen}
                aria-label="Go to previous screen"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div className="onboarding-back-placeholder" />
            )}

            <span className="onboarding-step">
              0{currentScreen + 1} <span>/ 02</span>
            </span>

            <button
              type="button"
              className="onboarding-next"
              onClick={nextScreen}
            >
              {currentScreen === 0 ? "Continue" : "Get Started"}
              <ArrowRight size={19} />
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default Onboarding;
