import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
import {
  ArrowLeft,
  Camera,
  UserRound,
  MapPin,
  Mail,
  Phone,
  CalendarDays,
  Save,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const token = sessionStorage.getItem("goodpay_token");

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    gender: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    profilePictureUrl: "",
    status: "",
    createdAt: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("${API_URL}/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your profile.");
        }

        const user = data.user;

        setProfile({
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          nickname: user.nickname || "",
          gender: user.gender || "",
          dateOfBirth: user.date_of_birth
            ? String(user.date_of_birth).split("T")[0]
            : "",
          email: user.email || "",
          phone: user.phone || "",
          addressLine1: user.address_line_1 || "",
          addressLine2: user.address_line_2 || "",
          city: user.city || "",
          state: user.state || "",
          postalCode: user.postal_code || "",
          country: user.country || "",
          profilePictureUrl: user.profile_picture_url || "",
          status: user.status || "",
          createdAt: user.created_at || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePictureUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Your profile picture must not exceed 2 MB.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    const reader = new FileReader();

    reader.onload = () => {
      setPreview(reader.result);
    };

    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await fetch(
        "${API_URL}/api/user/profile-picture",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to upload your picture.");
      }

      setProfile((previous) => ({
        ...previous,
        profilePictureUrl: data.profilePictureUrl,
      }));

      setPreview("");
      setMessage("Your profile picture has been uploaded successfully.");
    } catch (err) {
      setPreview("");
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRemovePicture = async () => {
    if (!profile.profilePictureUrl) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove your profile picture?",
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setUploading(true);

    try {
      const response = await fetch(
        "${API_URL}/api/user/profile-picture",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove your picture.");
      }

      setProfile((previous) => ({
        ...previous,
        profilePictureUrl: "",
      }));

      setPreview("");
      setMessage("Your profile picture has been removed successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save your profile.");
      }

      const user = data.user;

      setProfile((previous) => ({
        ...previous,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        nickname: user.nickname || "",
        gender: user.gender || "",
        dateOfBirth: user.date_of_birth
          ? String(user.date_of_birth).split("T")[0]
          : "",
        email: user.email || "",
        phone: user.phone || "",
        addressLine1: user.address_line_1 || "",
        addressLine2: user.address_line_2 || "",
        city: user.city || "",
        state: user.state || "",
        postalCode: user.postal_code || "",
        country: user.country || "",
        profilePictureUrl: user.profile_picture_url || "",
        status: user.status || "",
        createdAt: user.created_at || "",
      }));

      setMessage("Your profile has been updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

  if (loading) {
    return (
      <div className="goodpay-profile-page">
        <div className="profile-loading">
          <LoaderCircle className="profile-spinner" size={28} />
          Loading your profile...
        </div>
      </div>
    );
  }

  return (
    <div className="goodpay-profile-page">
      <div className="profile-page-header">
        <div>
          <button
            className="profile-back-button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Overview
          </button>

          <h1>My Profile</h1>
          <p>Manage your personal information and how your account appears.</p>
        </div>

        <div className="profile-account-status">
          <ShieldCheck size={16} />
          {profile.status || "Account"}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <section className="profile-hero-card">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {preview || profile.profilePictureUrl ? (
                <img
                  src={preview || profile.profilePictureUrl}
                  alt="Your profile"
                />
              ) : (
                <span>{initials || <UserRound size={48} />}</span>
              )}
            </div>

            <button
              type="button"
              className="profile-camera-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Upload profile picture"
            >
              {uploading ? (
                <LoaderCircle className="profile-spinner" size={18} />
              ) : (
                <Camera size={18} />
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePictureUpload}
              hidden
            />
          </div>

          <div className="profile-hero-info">
            <h2>
              {profile.firstName || profile.lastName
                ? `${profile.firstName} ${profile.lastName}`.trim()
                : "Your Name"}
            </h2>

            <p>{profile.email}</p>

            <div className="profile-picture-actions">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera size={15} />
                {uploading ? "Uploading..." : "Change Photo"}
              </button>

              {profile.profilePictureUrl && (
                <button
                  type="button"
                  className="profile-remove-photo-button"
                  onClick={handleRemovePicture}
                  disabled={uploading}
                >
                  Remove Photo
                </button>
              )}

              <span>JPG, PNG or WEBP · Maximum 2 MB</span>
            </div>
          </div>
        </section>

        {error && (
          <div className="profile-alert profile-alert-error">{error}</div>
        )}
        {message && (
          <div className="profile-alert profile-alert-success">{message}</div>
        )}

        <section className="profile-content-card">
          <div className="profile-section-heading">
            <div className="profile-section-icon">
              <UserRound size={20} />
            </div>
            <div>
              <h2>Personal Information</h2>
              <p>Your basic identity and contact details.</p>
            </div>
          </div>

          <div className="profile-form-grid">
            <label className="profile-field">
              First Name
              <input
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
              />
            </label>

            <label className="profile-field">
              Last Name
              <input
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
              />
            </label>

            <label className="profile-field">
              Nickname
              <input
                name="nickname"
                value={profile.nickname}
                onChange={handleChange}
                maxLength={50}
                placeholder="What should we call you?"
              />
            </label>

            <label className="profile-field">
              Gender
              <select
                name="gender"
                value={profile.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>

            <label className="profile-field">
              Date of Birth
              <input
                type="date"
                name="dateOfBirth"
                value={profile.dateOfBirth}
                onChange={handleChange}
              />
            </label>

            <label className="profile-field">
              <span className="profile-label-icon">
                <Phone size={15} /> Mobile Number
              </span>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                maxLength={30}
                placeholder="Enter your mobile number"
              />
            </label>

            <label className="profile-field profile-full-width">
              <span className="profile-label-icon">
                <Mail size={15} /> Email Address
              </span>
              <input type="email" value={profile.email} disabled />
              <small>Your registered email cannot be changed here.</small>
            </label>
          </div>
        </section>

        <section className="profile-content-card">
          <div className="profile-section-heading">
            <div className="profile-section-icon">
              <MapPin size={20} />
            </div>
            <div>
              <h2>Residential Address</h2>
              <p>Your current residential and mailing address.</p>
            </div>
          </div>

          <div className="profile-form-grid">
            <label className="profile-field profile-full-width">
              Address Line 1
              <input
                name="addressLine1"
                value={profile.addressLine1}
                onChange={handleChange}
                maxLength={255}
                placeholder="Street address"
              />
            </label>

            <label className="profile-field profile-full-width">
              Address Line 2
              <input
                name="addressLine2"
                value={profile.addressLine2}
                onChange={handleChange}
                maxLength={255}
                placeholder="Apartment, suite, unit (optional)"
              />
            </label>

            <label className="profile-field">
              City
              <input
                name="city"
                value={profile.city}
                onChange={handleChange}
                maxLength={100}
              />
            </label>

            <label className="profile-field">
              State / Province
              <input
                name="state"
                value={profile.state}
                onChange={handleChange}
                maxLength={100}
              />
            </label>

            <label className="profile-field">
              Postal Code
              <input
                name="postalCode"
                value={profile.postalCode}
                onChange={handleChange}
                maxLength={20}
              />
            </label>

            <label className="profile-field">
              Country
              <input
                name="country"
                value={profile.country}
                onChange={handleChange}
                maxLength={100}
                placeholder="Enter your country"
              />
            </label>
          </div>
        </section>

        <div className="profile-save-area">
          <div>
            <strong>Keep your information up to date</strong>
            <p>Your changes will be securely saved to your GoodPay account.</p>
          </div>

          <button
            type="submit"
            className="profile-save-button"
            disabled={saving || uploading}
          >
            {saving ? (
              <LoaderCircle className="profile-spinner" size={17} />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Profile;
