import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
import {
  ArrowLeft,
  UserRound,
  LockKeyhole,
  ShieldCheck,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

function Settings() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("goodpay_token");

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "",
    createdAt: "",
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile.");
        }

        const user = data.user;

        setProfile({
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          email: user.email || "",
          phone: user.phone || "",
          status: user.status || "",
          createdAt: user.created_at || "",
        });
      } catch (error) {
        setProfileError(error.message);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");
    setProfileSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile.");
      }

      setProfile((previous) => ({
        ...previous,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        email: data.user.email,
        phone: data.user.phone || "",
        status: data.user.status,
        createdAt: data.user.created_at,
      }));

      setProfileMessage("Your personal information has been updated.");
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (passwords.newPassword.length < 8) {
      setPasswordError("Your new password must contain at least 8 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("Your new passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/change-password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to change password.");
      }

      setPasswordMessage("Your password has been changed successfully.");

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <button
            className="settings-back-button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={17} /> Back to Overview
          </button>

          <h1>Settings</h1>
          <p>Manage your personal information and account security.</p>
        </div>
      </div>

      {profileLoading ? (
        <div className="settings-message">Loading your settings...</div>
      ) : (
        <>
          <section className="settings-section">
            <div className="settings-section-heading">
              <div className="settings-heading-icon">
                <UserRound size={21} />
              </div>
              <div>
                <h2>Personal Information</h2>
                <p>Update the personal details linked to your account.</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="settings-form-grid">
                <label className="settings-field">
                  First Name
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleProfileChange}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>

                <label className="settings-field">
                  Last Name
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleProfileChange}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>

                <label className="settings-field">
                  Email Address
                  <input type="email" value={profile.email} disabled />
                  <small>Your registered email cannot be changed here.</small>
                </label>

                <label className="settings-field">
                  Phone Number
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    maxLength={30}
                    placeholder="Enter your phone number"
                  />
                </label>
              </div>

              {profileError && <p className="settings-error">{profileError}</p>}

              {profileMessage && (
                <p className="settings-success">{profileMessage}</p>
              )}

              <button
                className="settings-save-button"
                type="submit"
                disabled={profileSaving}
              >
                <Save size={17} />
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>

          <section className="settings-section">
            <div className="settings-section-heading">
              <div className="settings-heading-icon">
                <LockKeyhole size={21} />
              </div>
              <div>
                <h2>Change Password</h2>
                <p>Use a strong password to protect your account.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="settings-password-fields">
                <label className="settings-field">
                  Current Password
                  <input
                    type={showPasswords ? "text" : "password"}
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    maxLength={72}
                    autoComplete="current-password"
                  />
                </label>

                <label className="settings-field">
                  New Password
                  <input
                    type={showPasswords ? "text" : "password"}
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                  />
                </label>

                <label className="settings-field">
                  Confirm New Password
                  <input
                    type={showPasswords ? "text" : "password"}
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <button
                type="button"
                className="settings-visibility-button"
                onClick={() => setShowPasswords((previous) => !previous)}
              >
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPasswords ? "Hide passwords" : "Show passwords"}
              </button>

              {passwordError && (
                <p className="settings-error">{passwordError}</p>
              )}

              {passwordMessage && (
                <p className="settings-success">{passwordMessage}</p>
              )}

              <button
                className="settings-save-button"
                type="submit"
                disabled={passwordSaving}
              >
                <LockKeyhole size={17} />
                {passwordSaving ? "Updating..." : "Update Password"}
              </button>
            </form>
          </section>

          <section className="settings-section settings-account-section">
            <div className="settings-section-heading">
              <div className="settings-heading-icon">
                <ShieldCheck size={21} />
              </div>
              <div>
                <h2>Account Information</h2>
                <p>Details about your GoodPay account.</p>
              </div>
            </div>

            <div className="settings-account-details">
              <div>
                <span>Account Email</span>
                <strong>{profile.email}</strong>
              </div>

              <div>
                <span>Account Status</span>
                <strong className="settings-status">
                  {profile.status || "Unknown"}
                </strong>
              </div>

              <div>
                <span>Member Since</span>
                <strong>{formatDate(profile.createdAt)}</strong>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Settings;
