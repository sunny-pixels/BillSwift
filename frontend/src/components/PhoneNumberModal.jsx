import React, { useState } from "react";

const PhoneNumberModal = ({
  isOpen,
  onClose,
  onPhoneSubmit,
  overlayClassName,
  modalClassName,
  headerClassName,
  inputClassName,
  buttonClassName,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      const digits = phoneNumber.replace(/\D/g, "");
      const fullWithCode = digits.startsWith("91") ? digits : `91${digits}`;
      onPhoneSubmit(fullWithCode);
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
            className="text-white opacity-60 hover:opacity-100 text-3xl transition-opacity"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 mb-6 flex-nowrap w-full">
            <div className="px-4 py-4 rounded-[16px] border select-none font-medium text-[#141416] bg-[#f4f4f6] hidden" />
            <div className="px-4 py-4 rounded-[16px] border select-none font-medium bg-[#2a2a2d]/80 text-white border-white/10 shrink-0">
              +91
            </div>
            <input
              className={`px-4 py-4 rounded-[16px] border bg-[#2a2a2d]/80 text-white border-white/10 flex-1 min-w-0`}
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={buttonClassName}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default PhoneNumberModal;
