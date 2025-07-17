import React, { useState, useEffect } from "react";
import QRCode from "qrcode.react";
import { checkWhatsAppStatus, clearSession } from "../services/whatsappService";

const QRCodeModal = ({ 
  isOpen, 
  onClose,
  overlayClassName,
  modalClassName,
  headerClassName
}) => {
  const [status, setStatus] = useState('waiting');
  const [qrData, setQrData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedQR, setHasGeneratedQR] = useState(false);

  useEffect(() => {
    let intervalId;

    const checkStatus = async () => {
      try {
        const response = await checkWhatsAppStatus();
        
        if (response.status === 'connected') {
          setStatus('connected');
          onClose();
        } else if (response.qr) {
          setStatus('qr');
          setQrData(response.qr);
          setIsGenerating(false);
          setHasGeneratedQR(true);
        } else if (response.status === 'disconnected' && !isGenerating && !hasGeneratedQR) {
          setStatus('waiting');
          setQrData(null);
        }
      } catch (error) {
        console.error('Error checking WhatsApp status:', error);
        setStatus('waiting');
      }
    };

    if (isOpen) {
      // Only generate new QR if we haven't generated one yet
      if (!hasGeneratedQR && !isGenerating) {
        setIsGenerating(true);
        clearSession().then(() => {
          checkStatus();
        });
      } else {
        // If we already have a QR, just check the status
        checkStatus();
      }

      // Check status every 5 seconds
      intervalId = setInterval(checkStatus, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, hasGeneratedQR, isGenerating]);

  if (!isOpen) return null;

  return (
    <div className={overlayClassName}>
      <div className={modalClassName}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={headerClassName}>WhatsApp Connection</h2>
          <button
            className="text-inherit opacity-60 hover:opacity-100 text-3xl transition-opacity"
            onClick={() => {
              clearSession(); // Clear session when modal is closed
              onClose();
            }}
            type="button"
          >
            ×
          </button>
        </div>

        {status === 'qr' && qrData && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-center opacity-80">
              Scan this QR code with WhatsApp on your phone to connect
            </p>
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={qrData} size={200} />
            </div>
            <p className="text-sm opacity-60">
              Open WhatsApp → Settings → Linked Devices → Link a Device
            </p>
          </div>
        )}

        {status === 'waiting' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-center opacity-80">
              {isGenerating ? 'Generating new QR code...' : 'Waiting for QR code...'}
            </p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3379E9]"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeModal; 