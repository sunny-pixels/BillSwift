// WhatsApp service that communicates with our WhatsApp server
// const WHATSAPP_SERVER_URL =
//   (typeof import.meta !== "undefined" &&
//     import.meta.env &&
//     (import.meta.env.VITE_WHATSAPP_SERVER_URL ||
//       import.meta.env.VITE_API_BASE_URL)) ||
//   (typeof process !== "undefined" &&
//     process.env &&
//     (process.env.VITE_WHATSAPP_SERVER_URL || process.env.VITE_API_BASE_URL)) ||
//   "http://localhost:5002";

// Use your actual WhatsApp server URL/port here
const WHATSAPP_SERVER_URL = "https://whatsappserverbillswift.onrender.com/";

// Function to check WhatsApp connection status and get QR code if needed
const checkWhatsAppStatus = async () => {
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/qr`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking WhatsApp status:", error);
    return { status: "error", error: "Failed to connect to WhatsApp server" };
  }
};

// Function to clear WhatsApp session
const clearSession = async () => {
  try {
    const response = await fetch(
      `${WHATSAPP_SERVER_URL}/api/whatsapp/clear-session`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to clear session");
    }
    return true;
  } catch (error) {
    console.error("Error clearing WhatsApp session:", error);
    return false;
  }
};

// Function to force new QR generation
const forceNewQr = async () => {
  try {
    const response = await fetch(
      `${WHATSAPP_SERVER_URL}/api/whatsapp/force-new-qr`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to generate new QR");
    }
    return true;
  } catch (error) {
    console.error("Error forcing new QR:", error);
    return false;
  }
};

// Function to send WhatsApp message
const sendWhatsAppMessage = async (phoneNumber, message, pdfBuffer) => {
  try {
    // Format the phone number (remove any spaces or special characters)
    const formattedNumber = phoneNumber.replace(/\D/g, "");

    // Convert PDF buffer to base64
    const pdfBase64 = btoa(
      new Uint8Array(pdfBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    // Send message to our server
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: formattedNumber,
        message,
        pdfBase64,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send message");
    }

    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
};

export {
  checkWhatsAppStatus,
  sendWhatsAppMessage,
  clearSession,
  forceNewQr,
  WHATSAPP_SERVER_URL,
};
