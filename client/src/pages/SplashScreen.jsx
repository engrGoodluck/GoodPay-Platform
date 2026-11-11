import "./SplashScreen.css";

function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-glow splash-glow-one"></div>
      <div className="splash-glow splash-glow-two"></div>

      <div className="splash-content">
        <div className="splash-logo-wrapper">
          <img src="/goodpay-logo.png" alt="GoodPay" className="splash-logo" />
        </div>

        <p className="splash-tagline">
          Banking made simpler. Life made better.
        </p>

        <div className="splash-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div className="splash-footer">SECURE. SIMPLE. SMART.</div>
    </div>
  );
}

export default SplashScreen;
