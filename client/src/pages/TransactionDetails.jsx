import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_URL from "../api";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  XCircle,
  Copy,
  Receipt,
  LoaderCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import "./Auth.css";

function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`${API_URL}/api/transactions/${id}`, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("goodpay_token")}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load transaction details.",
          );
        }

        setTransaction(data.transaction);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  const formatAmount = (amount, currency) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-NG", {
      dateStyle: "long",
      timeStyle: "short",
    });

  const downloadReceipt = () => {
    if (!transaction) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();

    const purple = [73, 42, 195];
    const dark = [41, 37, 60];
    const muted = [125, 120, 145];
    const green = [1, 184, 130];

    const isCredit = transaction.direction === "credit";

    const sender = fullName(
      transaction.sender_first_name,
      transaction.sender_last_name,
    );

    const recipient = fullName(
      transaction.recipient_first_name,
      transaction.recipient_last_name,
    );

    const amount = formatAmount(transaction.amount, transaction.currency);

    const date = formatDate(transaction.created_at);

    // Header
    pdf.setFillColor(...purple);
    pdf.roundedRect(15, 15, pageWidth - 30, 38, 4, 4, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(23);
    pdf.text("GoodPay", 25, 31);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("TRANSACTION RECEIPT", 25, 43);

    // Amount section
    pdf.setTextColor(...muted);
    pdf.setFontSize(10);
    pdf.text("TRANSACTION AMOUNT", 20, 72);

    pdf.setTextColor(...dark);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.text(amount, 20, 87);

    // Status
    const statusColor =
      transaction.status === "successful"
        ? green
        : transaction.status === "pending"
          ? [190, 130, 20]
          : [195, 60, 74];

    pdf.setFillColor(...statusColor);
    pdf.roundedRect(20, 96, 38, 10, 3, 3, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text(transaction.status.toUpperCase(), 39, 102.5, { align: "center" });

    // Divider
    pdf.setDrawColor(230, 228, 238);
    pdf.line(20, 118, pageWidth - 20, 118);

    // Transaction information
    pdf.setTextColor(...purple);
    pdf.setFontSize(12);
    pdf.text("TRANSACTION INFORMATION", 20, 132);

    const details = [
      ["Transaction type", transactionName],
      ["Reference", transaction.reference],
      ["Date and time", date],
      ["Description", transaction.description || "No description"],
      ["Currency", transaction.currency || "NGN"],
    ];

    let y = 147;

    details.forEach(([label, value]) => {
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(label, 20, y);

      pdf.setTextColor(...dark);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);

      const wrappedValue = pdf.splitTextToSize(String(value), 95);

      pdf.text(wrappedValue, pageWidth - 20, y, {
        align: "right",
      });

      y += Math.max(12, wrappedValue.length * 5);
    });

    // People involved
    y += 8;

    pdf.setDrawColor(230, 228, 238);
    pdf.line(20, y, pageWidth - 20, y);

    y += 15;

    pdf.setTextColor(...purple);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("PEOPLE INVOLVED", 20, y);

    y += 14;

    const people = [
      ["From", sender, transaction.sender_email],
      ["To", recipient, transaction.recipient_email],
    ].filter((person) => person[2]);

    people.forEach(([label, name, email]) => {
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(label, 20, y);

      pdf.setTextColor(...dark);
      pdf.setFont("helvetica", "bold");
      pdf.text(name, pageWidth - 20, y, {
        align: "right",
      });

      y += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...muted);
      pdf.text(email, pageWidth - 20, y, {
        align: "right",
      });

      y += 12;
    });

    // Footer
    const footerY = Math.max(y + 15, 265);

    pdf.setDrawColor(230, 228, 238);
    pdf.line(20, footerY, pageWidth - 20, footerY);

    pdf.setTextColor(...purple);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Thank you for using GoodPay.", pageWidth / 2, footerY + 10, {
      align: "center",
    });

    pdf.setTextColor(...muted);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      "This receipt records a transaction on the GoodPay development platform.",
      pageWidth / 2,
      footerY + 17,
      { align: "center" },
    );

    const safeReference = String(transaction.reference).replace(
      /[^a-zA-Z0-9-]/g,
      "",
    );

    pdf.save(`GoodPay-Receipt-${safeReference}.pdf`);
  };

  const copyReference = async () => {
    if (transaction?.reference) {
      await navigator.clipboard.writeText(transaction.reference);
    }
  };

  const fullName = (firstName, lastName) =>
    [firstName, lastName].filter(Boolean).join(" ") || "GoodPay user";

  if (loading) {
    return (
      <div className="transaction-page-state">
        <LoaderCircle className="spin-icon" size={30} />
        <p>Loading transaction details...</p>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="transaction-page-state">
        <XCircle size={36} />
        <h2>Transaction unavailable</h2>
        <p>{error || "We couldn't find this transaction."}</p>
        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isCredit = transaction.direction === "credit";
  const isSuccessful = transaction.status === "successful";
  const isPending = transaction.status === "pending";

  const transactionName = transaction.transaction_type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div className="transaction-page">
      <button
        className="transaction-back-button"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <div className="transaction-detail-card">
        <div className="transaction-detail-heading">
          <div className="transaction-detail-icon">
            {isCredit ? (
              <ArrowDownLeft size={25} />
            ) : (
              <ArrowUpRight size={25} />
            )}
          </div>

          <span className="transaction-detail-type">{transactionName}</span>

          <h1>
            {isCredit ? "+" : "-"}
            {formatAmount(transaction.amount, transaction.currency)}
          </h1>

          <span
            className={`transaction-status ${
              isSuccessful
                ? "status-success"
                : isPending
                  ? "status-pending"
                  : "status-failed"
            }`}
          >
            {isSuccessful ? (
              <CheckCircle2 size={15} />
            ) : isPending ? (
              <Clock3 size={15} />
            ) : (
              <XCircle size={15} />
            )}
            {transaction.status}
          </span>
        </div>

        <div className="transaction-detail-divider" />

        <div className="transaction-information">
          <h3>Transaction information</h3>

          <div className="transaction-info-row">
            <span>Transaction type</span>
            <strong>{transactionName}</strong>
          </div>

          <div className="transaction-info-row">
            <span>Date and time</span>
            <strong>{formatDate(transaction.created_at)}</strong>
          </div>

          <div className="transaction-info-row">
            <span>Reference</span>
            <strong className="transaction-reference">
              {transaction.reference}
              <button onClick={copyReference} title="Copy reference">
                <Copy size={15} />
              </button>
            </strong>
          </div>

          {transaction.description && (
            <div className="transaction-info-row">
              <span>Description</span>
              <strong>{transaction.description}</strong>
            </div>
          )}
        </div>

        <div className="transaction-detail-divider" />

        <div className="transaction-information">
          <h3>People involved</h3>

          {transaction.sender_email && (
            <div className="transaction-person">
              <span>From</span>
              <div>
                <strong>
                  {fullName(
                    transaction.sender_first_name,
                    transaction.sender_last_name,
                  )}
                </strong>
                <small>{transaction.sender_email}</small>
              </div>
            </div>
          )}

          {transaction.recipient_email && (
            <div className="transaction-person">
              <span>To</span>
              <div>
                <strong>
                  {fullName(
                    transaction.recipient_first_name,
                    transaction.recipient_last_name,
                  )}
                </strong>
                <small>{transaction.recipient_email}</small>
              </div>
            </div>
          )}
        </div>

        <button className="download-receipt-button" onClick={downloadReceipt}>
          <Receipt size={18} />
          Download PDF Receipt
        </button>

        <div className="transaction-receipt-note">
          <Receipt size={17} />
          <span>
            GoodPay transaction record · Keep your reference for future
            enquiries.
          </span>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetails;
