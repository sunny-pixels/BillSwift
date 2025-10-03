import React, { useState } from "react";
import toast from "react-hot-toast";

const SignUpModal = ({
  isOpen,
  onClose,
  onSwitchToSignIn,
  onSuccess,
  isDarkMode = false,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const overlayClassName =
    "fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50";
  const modalClassName = `w-full max-w-md ${
    isDarkMode ? "bg-[#1c1c1f] text-white" : "bg-white text-[#141416]"
  } rounded-[24px] p-6`;
  const headerClassName = "text-2xl font-bold";
  const inputBaseClassName = `w-full p-4 rounded-[16px] mb-4 focus:outline-none border transition-colors duration-200 ${
    isDarkMode
      ? "bg-[#2a2a2d]/80 border-white/10 text-white placeholder-[#767c8f] focus:border-[#3379E9]"
      : "bg-[#f4f4f6]/80 border-black/5 text-[#141416] placeholder-[#767c8f] focus:border-[#3379E9]"
  }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setIsSubmitting(true);
      // Placeholder sign-up flow. Replace with API call when backend is ready.
      await new Promise((r) => setTimeout(r, 700));
      toast.success("Account created successfully");
      if (onSuccess) onSuccess({ name, email });
    } catch (err) {
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={overlayClassName} role="dialog" aria-modal="true">
      <div className={modalClassName}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={headerClassName}>Create an account</h2>
          <button
            className="text-inherit opacity-60 hover:opacity-100 text-3xl transition-opacity"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <input
            className={inputBaseClassName}
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <input
            className={inputBaseClassName}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <input
            className={inputBaseClassName}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <input
            className={inputBaseClassName}
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className={`w-full py-3 px-6 bg-[#0a66e5] hover:bg-[#0952b7] text-white font-medium rounded-[16px] transition duration-300 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className={isDarkMode ? "text-white/70" : "text-[#767c8f]"}>
            Already have an account?
          </span>{" "}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-[#0a66e5] hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpModal;
