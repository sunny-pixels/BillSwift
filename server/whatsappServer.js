const express = require("express");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-terminal");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Store the WhatsApp client
let sock = null;
let isConnected = false;
let qrCode = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const clearSession = async () => {
  const sessionsDir = path.join(__dirname, "sessions");
  if (fs.existsSync(sessionsDir)) {
    fs.rmSync(sessionsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(sessionsDir);

  // Reset states
  sock = null;
  isConnected = false;
  qrCode = null;
  reconnectAttempts = 0;
};

// Initialize WhatsApp connection
const initializeWhatsApp = async (forceNew = false) => {
  try {
    if (forceNew) {
      await clearSession();
    }

    // Create sessions directory if it doesn't exist
    const sessionsDir = path.join(__dirname, "sessions");
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir);
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["BillSwift", "Chrome", "1.0.0"],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: false,
      fireInitQueries: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Generate QR code for client to scan
        qrCode = qr;
        qrcode.generate(qr, { small: true });
        console.log("New QR code generated. Please scan with WhatsApp.");
        console.log("QR Code:", qr);
        // Print the endpoint URL
        const endpoint = `/api/whatsapp/qr`;
        if (process.env.HOST && process.env.PORT) {
          console.log(
            `QR API endpoint: http://${process.env.HOST}:${process.env.PORT}${endpoint}`
          );
        } else {
          console.log(`QR API endpoint: ${endpoint}`);
        }
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error instanceof Boom)?.output
          ?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log("Connection closed. Status code:", statusCode);
        isConnected = false;

        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
          setTimeout(async () => {
            await initializeWhatsApp();
          }, 5000); // Wait 5 seconds before reconnecting
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.log("Max reconnection attempts reached. Clearing session...");
          await clearSession();
          await initializeWhatsApp(true);
        }
      } else if (connection === "open") {
        isConnected = true;
        qrCode = null;
        reconnectAttempts = 0;
        console.log("WhatsApp connection established");
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (error) {
    console.error("Error initializing WhatsApp:", error);
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`Retrying initialization... Attempt ${reconnectAttempts}`);
      setTimeout(async () => {
        await initializeWhatsApp();
      }, 5000);
    }
  }
};

// Initialize WhatsApp on server start
initializeWhatsApp(true); // Force new session on server start

// API endpoint to get QR code
app.get("/api/whatsapp/qr", (req, res) => {
  const endpoint = "/api/whatsapp/qr";
  let endpointUrl = endpoint;
  if (req.hostname && req.socket && req.socket.localPort) {
    endpointUrl = `http://${req.hostname}:${req.socket.localPort}${endpoint}`;
  }
  if (qrCode) {
    res.json({ qr: qrCode, endpoint: endpointUrl });
  } else if (isConnected) {
    res.json({ status: "connected", endpoint: endpointUrl });
  } else {
    res.json({ status: "waiting", endpoint: endpointUrl });
  }
});

// API endpoint to clear session and force new QR
app.post("/api/whatsapp/clear-session", async (req, res) => {
  try {
    await clearSession();
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing session:", error);
    res.status(500).json({ error: "Failed to clear session" });
  }
});

// API endpoint to force new QR generation
app.post("/api/whatsapp/force-new-qr", async (req, res) => {
  try {
    await initializeWhatsApp(true);
    res.json({ success: true });
  } catch (error) {
    console.error("Error forcing new QR:", error);
    res.status(500).json({ error: "Failed to generate new QR" });
  }
});

// API endpoint to restart WhatsApp connection
app.post("/api/whatsapp/restart", async (req, res) => {
  try {
    await initializeWhatsApp(true);
    res.json({ success: true });
  } catch (error) {
    console.error("Error restarting WhatsApp:", error);
    res.status(500).json({ error: "Failed to restart WhatsApp" });
  }
});

// API endpoint to logout
app.post("/api/whatsapp/logout", async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
    await clearSession();
    res.json({ success: true });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});

// API endpoint to send WhatsApp message
app.post("/api/whatsapp/send", async (req, res) => {
  if (!isConnected) {
    return res.status(400).json({ error: "WhatsApp not connected" });
  }

  const { phoneNumber, message, pdfBase64 } = req.body;

  try {
    // Format the phone number (remove any spaces or special characters)
    const formattedNumber = phoneNumber.replace(/\D/g, "");

    // Send text message
    await sock.sendMessage(`${formattedNumber}@s.whatsapp.net`, {
      text: message,
    });

    // Send PDF file if provided
    if (pdfBase64) {
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      await sock.sendMessage(`${formattedNumber}@s.whatsapp.net`, {
        document: pdfBuffer,
        mimetype: "application/pdf",
        fileName: "invoice.pdf",
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Start the server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`WhatsApp server running on port ${PORT}`);
});
