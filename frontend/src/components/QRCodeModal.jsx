import React, { useState, useEffect } from "react";
import QRCode from "qrcode.react";
import { checkWhatsAppStatus, clearSession } from "../services/whatsappService";

const QRCodeModal = ({
  isOpen,
  onClose,
  overlayClassName,
  modalClassName,
  headerClassName,
  isDarkMode // <-- add this prop
}) => {
  const [status, setStatus] = useState('waiting');
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrEndpoint, setQrEndpoint] = useState('');

  useEffect(() => {
    let intervalId;
    let cancelled = false;

    const pollForQR = () => {
      intervalId = setInterval(async () => {
        const response = await checkWhatsAppStatus();
        if (response.status === 'connected') {
          setStatus('connected');
          setQrData(null);
          setQrEndpoint(response.endpoint || '');
          setLoading(false);
          clearInterval(intervalId);
          onClose();
        } else if (response.qr) {
          setStatus('qr');
          setQrData(response.qr);
          setQrEndpoint(response.endpoint || '');
          setLoading(false);
        } else {
          setStatus('waiting');
          setQrData(null);
          setQrEndpoint(response.endpoint || '');
        }
      }, 2000);
    };

    const handleOpen = async () => {
      setLoading(true);
      setStatus('waiting');
      setQrData(null);
      setQrEndpoint('');
      // First check if QR is already available
      const response = await checkWhatsAppStatus();
      if (cancelled) return;
      if (response.status === 'connected') {
        setStatus('connected');
        setQrData(null);
        setQrEndpoint(response.endpoint || '');
        setLoading(false);
        return onClose();
      }
      if (response.qr) {
        setStatus('qr');
        setQrData(response.qr);
        setQrEndpoint(response.endpoint || '');
        setLoading(false);
        pollForQR();
      } else {
        setStatus('waiting');
        setQrData(null);
        setQrEndpoint(response.endpoint || '');
        setLoading(true);
        // Only clear session and poll if no QR is available
        await clearSession();
        if (cancelled) return;
        pollForQR();
      }
    };

    if (isOpen) {
      handleOpen();
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      setStatus('waiting');
      setQrData(null);
      setQrEndpoint('');
      setLoading(false);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={overlayClassName}>
      <div className={modalClassName + (isDarkMode ? ' text-white' : ' text-black')}>
        <div className={"flex justify-between items-center mb-6"}>
          <h2 className={headerClassName + (isDarkMode ? ' text-white' : ' text-black')}>WhatsApp Connection</h2>
          <button
            className={"text-inherit opacity-60 hover:opacity-100 text-3xl transition-opacity"}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {status === 'qr' && qrData && (
          <div className="flex flex-col items-center gap-4">
            <span className={isDarkMode ? 'text-white' : 'text-black'}>
              Scan this QR code with WhatsApp on your phone to connect
            </span>
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={qrData} size={200} />
            </div>
            <span className={"text-sm mt-2 " + (isDarkMode ? 'text-white' : 'text-black')}>
              Open WhatsApp → Settings → Linked Devices → Link a Device
            </span>
          </div>
        )}

        {(status === 'waiting' || loading) && (
          <div className="flex flex-col items-center gap-4">
            <span className={isDarkMode ? 'text-white' : 'text-black'}>
              {loading ? 'Generating new QR code...' : 'Waiting for QR code...'}
            </span>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3379E9]"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeModal; 