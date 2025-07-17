import React, { useState } from "react";

const PhoneNumberModal = ({ 
  isOpen, 
  onClose, 
  onPhoneSubmit,
  overlayClassName,
  modalClassName,
  headerClassName,
  inputClassName,
  buttonClassName
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      onPhoneSubmit(phoneNumber);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={overlayClassName}>
      <div className={modalClassName}>
        <div className="flex justify-between items-center">
          <h2 className={headerClassName}>Enter Phone Number</h2>
          <button
            className="text-inherit opacity-60 hover:opacity-100 text-3xl transition-opacity"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            className={inputClassName}
            type="tel"
            placeholder="Enter WhatsApp no. (e.g., 911234567890)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          <button
            type="submit"
            className={buttonClassName}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default PhoneNumberModal; 