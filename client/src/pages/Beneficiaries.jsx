import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Mail,
  Users,
  LoaderCircle,
} from "lucide-react";
import "./Auth.css";

function Beneficiaries() {
  const navigate = useNavigate();

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  const token = sessionStorage.getItem("goodpay_token");

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/beneficiaries", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load beneficiaries.");
      }

      setBeneficiaries(data.beneficiaries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setEditingId(null);
    setFormError("");
    setShowForm(false);
  };

  const handleEdit = (beneficiary) => {
    setEditingId(beneficiary.id);
    setName(beneficiary.name);
    setEmail(beneficiary.email || "");
    setFormError("");
    setMessage("");
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setMessage("");

    try {
      const response = await fetch(
        editingId
          ? `http://localhost:5000/api/beneficiaries/${editingId}`
          : "http://localhost:5000/api/beneficiaries",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save beneficiary.");
      }

      resetForm();
      setMessage(data.message);
      await fetchBeneficiaries();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (beneficiary) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${beneficiary.name}?`,
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/beneficiaries/${beneficiary.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to remove beneficiary.");
      }

      setMessage(data.message);
      await fetchBeneficiaries();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredBeneficiaries = beneficiaries.filter((beneficiary) =>
    `${beneficiary.name} ${beneficiary.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const getInitials = (name) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");

  return (
    <div className="beneficiaries-page">
      <div className="beneficiaries-container">
        <button
          className="beneficiaries-back"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="beneficiaries-heading">
          <div>
            <span className="beneficiaries-eyebrow">YOUR CONTACTS</span>
            <h1>Beneficiaries</h1>
            <p>Manage your saved recipients and make transfers more easily.</p>
          </div>

          <button
            className="beneficiary-add-button"
            onClick={() => {
              resetForm();
              setMessage("");
              setShowForm(true);
            }}
          >
            <Plus size={19} />
            Add Beneficiary
          </button>
        </div>

        <div className="beneficiary-summary-card">
          <div className="beneficiary-summary-icon">
            <Users size={23} />
          </div>
          <div>
            <span>Saved beneficiaries</span>
            <strong>{beneficiaries.length}</strong>
          </div>
        </div>

        {message && (
          <div className="beneficiary-success-message">{message}</div>
        )}

        {error && <div className="beneficiary-error-message">{error}</div>}

        {showForm && (
          <div className="beneficiary-form-card">
            <div className="beneficiary-form-heading">
              <div>
                <h2>{editingId ? "Edit Beneficiary" : "Add Beneficiary"}</h2>
                <p>Enter the recipient's details below.</p>
              </div>

              <button
                className="beneficiary-close-button"
                onClick={resetForm}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="beneficiary-error-message">{formError}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="beneficiary-form-field">
                <label htmlFor="beneficiary-name">Full name</label>
                <div className="beneficiary-input-wrapper">
                  <UserRound size={18} />
                  <input
                    id="beneficiary-name"
                    type="text"
                    placeholder="Enter recipient's name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="beneficiary-form-field">
                <label htmlFor="beneficiary-email">Email address</label>
                <div className="beneficiary-input-wrapper">
                  <Mail size={18} />
                  <input
                    id="beneficiary-email"
                    type="email"
                    placeholder="recipient@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    maxLength={255}
                    required
                  />
                </div>
              </div>

              <div className="beneficiary-form-actions">
                <button
                  type="button"
                  className="beneficiary-cancel-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="beneficiary-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Save Beneficiary"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="beneficiary-list-card">
          <div className="beneficiary-list-heading">
            <div>
              <h2>Saved recipients</h2>
              <p>Your personal beneficiary list</p>
            </div>

            <div className="beneficiary-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search beneficiaries..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="beneficiary-state">
              <LoaderCircle className="spin-icon" size={27} />
              <p>Loading beneficiaries...</p>
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="beneficiary-state">
              <div className="beneficiary-empty-icon">
                <Users size={28} />
              </div>
              <h3>
                {search ? "No matching beneficiaries" : "No beneficiaries yet"}
              </h3>
              <p>
                {search
                  ? "Try another name or email address."
                  : "Add someone you transfer money to regularly."}
              </p>
              {!search && (
                <button
                  className="beneficiary-empty-button"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={17} />
                  Add your first beneficiary
                </button>
              )}
            </div>
          ) : (
            <div className="beneficiary-list">
              {filteredBeneficiaries.map((beneficiary) => (
                <div className="beneficiary-item" key={beneficiary.id}>
                  <div className="beneficiary-avatar">
                    {getInitials(beneficiary.name)}
                  </div>

                  <div className="beneficiary-person-details">
                    <strong>{beneficiary.name}</strong>
                    <span>{beneficiary.email}</span>
                  </div>

                  <div className="beneficiary-item-actions">
                    <button
                      onClick={() => handleEdit(beneficiary)}
                      title="Edit beneficiary"
                      aria-label={`Edit ${beneficiary.name}`}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() => handleDelete(beneficiary)}
                      title="Delete beneficiary"
                      aria-label={`Delete ${beneficiary.name}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Beneficiaries;
