import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import SplashScreen from "./pages/SplashScreen";

import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AddMoney from "./pages/AddMoney";
import SendMoney from "./pages/SendMoney";
import TransactionDetails from "./pages/TransactionDetails";
import Beneficiaries from "./pages/Beneficiaries";
import Cards from "./pages/Cards";
import Wallet from "./pages/Wallet";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import Transactions from "./pages/Transactions";
import Services from "./pages/Services";
import Notifications from "./pages/Notifications";
import Onboarding from "./pages/Onboarding";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/add-money" element={<AddMoney />} />
        <Route path="/send-money" element={<SendMoney />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:id" element={<TransactionDetails />} />
        <Route path="/beneficiaries" element={<Beneficiaries />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/support" element={<Support />} />
        <Route path="/services" element={<Services />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
