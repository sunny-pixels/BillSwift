import React, { useState, useEffect } from "react";
import QRCode from "qrcode.react";
import {
  checkWhatsAppStatus,
  clearSession,
  forceNewQr,
  WHATSAPP_SERVER_URL,
} from "../services/whatsappService";

const QRCodeModal = ({
  isOpen,
  onClose,
  overlayClassName,
  modalClassName,
  headerClassName,
  isDarkMode, // <-- add this prop
}) => {
  const [status, setStatus] = useState("waiting");
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrEndpoint, setQrEndpoint] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let intervalId;
    let cancelled = false;

    const pollForQR = () => {
      intervalId = setInterval(async () => {
        try {
          const response = await checkWhatsAppStatus();
          if (cancelled) return;
          if (response.status === "connected") {
            setStatus("connected");
            setQrData(null);
            setQrEndpoint(response.endpoint || "");
            setLoading(false);
            clearInterval(intervalId);
            onClose();
          } else if (response.qr) {
            setStatus("qr");
            setQrData(response.qr);
            setQrEndpoint(response.endpoint || "");
            setLoading(false);
          } else if (response.status === "waiting") {
            setStatus("waiting");
            setQrData(null);
            setQrEndpoint(response.endpoint || "");
          } else if (response.status === "error") {
            setError(response.error || "Failed to reach WhatsApp server");
            setLoading(false);
          }
        } catch (err) {
          if (cancelled) return;
          setError("Network error while polling QR");
          setLoading(false);
        }
      }, 3000); // poll every 3s
    };

    const handleOpen = async () => {
      setLoading(true);
      setStatus("waiting");
      setQrData(null);
      setQrEndpoint("");
      setError("");
      try {
        // First check if QR is already available
        const response = await checkWhatsAppStatus();
        if (cancelled) return;
        if (response.status === "connected") {
          setStatus("connected");
          setQrData(null);
          setQrEndpoint(response.endpoint || "");
          setLoading(false);
          return onClose();
        }
        if (response.qr) {
          setStatus("qr");
          setQrData(response.qr);
          setQrEndpoint(response.endpoint || "");
          setLoading(false);
          pollForQR();
        } else {
          setStatus("waiting");
          setQrData(null);
          setQrEndpoint(response.endpoint || "");
          setLoading(true);
          // Do NOT auto clear session here; user can click Regenerate if needed
          pollForQR();
        }
      } catch (err) {
        if (cancelled) return;
        setError("Failed to contact WhatsApp server");
        setLoading(false);
      }
    };

    if (isOpen) {
      handleOpen();
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      setStatus("waiting");
      setQrData(null);
      setQrEndpoint("");
      setLoading(false);
      setError("");
    };
  }, [isOpen, onClose]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleRegenerate = async () => {
    setLoading(true);
    setError("");
    // Prefer force new QR to avoid logging out on every attempt
    const ok = await forceNewQr();
    if (!ok) {
      // fallback to clear session if force fails
      await clearSession();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className={overlayClassName}>
      <div className={modalClassName}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={headerClassName}>WhatsApp Connection</h2>
          <button
            className={`opacity-60 hover:opacity-100 text-3xl transition-opacity ${
              isDarkMode ? "text-white" : "text-[#141416]"
            }`}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {status === "qr" && qrData && (
          <div className="flex flex-col items-center gap-4">
            <span
              className={`${
                isDarkMode ? "text-white" : "text-[#141416]"
              } text-sm`}
            >
              Scan this QR code with WhatsApp on your phone to connect
            </span>
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={qrData} size={200} />
            </div>
            <span
              className={`text-sm mt-2 ${
                isDarkMode ? "text-[#9aa0ae]" : "text-[#767c8f]"
              }`}
            >
              Open WhatsApp → Settings → Linked Devices → Link a Device
            </span>
          </div>
        )}

        {(status === "waiting" || loading) && (
          <div className="flex flex-col items-center gap-4">
            <span
              className={`${
                isDarkMode ? "text-white" : "text-[#141416]"
              } text-sm`}
            >
              {loading ? "Generating new QR code..." : "Waiting for QR code..."}
            </span>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3379E9]"></div>
          </div>
        )}

        {error && (
          <div
            className={`mt-4 text-sm ${
              isDarkMode ? "text-red-400" : "text-red-600"
            }`}
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div
            className={`text-xs ${
              isDarkMode ? "text-[#9aa0ae]" : "text-[#767c8f]"
            }`}
          >
            Server: {WHATSAPP_SERVER_URL}
            {qrEndpoint ? ` (${qrEndpoint})` : ""}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRegenerate}
              className={`px-3 py-2 rounded-[12px] text-sm font-medium ${
                isDarkMode
                  ? "bg-[#2a2a2d] text-white"
                  : "bg-[#f4f4f6] text-[#141416]"
              }`}
            >
              Regenerate QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
