const express = require("express");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
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
let isInitializing = false;
const MAX_RECONNECT_ATTEMPTS = 5;

const SESSIONS_DIR = path.join(__dirname, "sessions");

// Restore credentials from environment variable if available
const restoreCredsFromEnv = () => {
  const credsEnv = process.env.WHATSAPP_CREDS;
  if (!credsEnv) return false;
  try {
    if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    const credsPath = path.join(SESSIONS_DIR, "creds.json");
    // Only restore if no existing creds file
    if (!fs.existsSync(credsPath)) {
      const decoded = Buffer.from(credsEnv, "base64").toString("utf-8");
      fs.writeFileSync(credsPath, decoded);
      console.log("Restored WhatsApp credentials from WHATSAPP_CREDS env var.");
      return true;
    }
  } catch (err) {
    console.error("Failed to restore creds from env:", err.message);
  }
  return false;
};

// Export current credentials as base64 (to set as WHATSAPP_CREDS env var)
const exportCredsAsBase64 = () => {
  try {
    const credsPath = path.join(SESSIONS_DIR, "creds.json");
    if (fs.existsSync(credsPath)) {
      return Buffer.from(fs.readFileSync(credsPath, "utf-8")).toString("base64");
    }
  } catch (err) {
    console.error("Failed to export creds:", err.message);
  }
  return null;
};

const clearSession = async () => {
  if (fs.existsSync(SESSIONS_DIR)) {
    fs.rmSync(SESSIONS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(SESSIONS_DIR);

  // Reset states
  sock = null;
  isConnected = false;
  qrCode = null;
  reconnectAttempts = 0;
};

// Gracefully close existing socket before creating a new one
const closeExistingSocket = () => {
  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.end(undefined);
    } catch (e) {
      // ignore
    }
    sock = null;
  }
};

// Check if valid credentials exist on disk
const hasCredentials = () => {
  const credsPath = path.join(SESSIONS_DIR, "creds.json");
  if (!fs.existsSync(credsPath)) return false;
  try {
    const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));
    // If me is set, the device was previously paired
    return !!creds.me;
  } catch {
    return false;
  }
};

// Initialize WhatsApp connection
const initializeWhatsApp = async (forceNew = false) => {
  if (isInitializing) {
    console.log("Already initializing, skipping duplicate call.");
    return;
  }
  isInitializing = true;

  try {
    closeExistingSocket();

    if (forceNew) {
      await clearSession();
    }

    // Create sessions directory if it doesn't exist
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_DIR);

    // Wrap saveCreds to also log updated base64 creds after each save
    const saveCredsAndExport = async () => {
      await saveCreds();
      const b64 = exportCredsAsBase64();
      if (b64) {
        console.log("[CREDS_UPDATE] Set this as your WHATSAPP_CREDS env var on Render:");
        console.log(b64);
      }
    };

    // Fetch the latest WhatsApp Web version to avoid protocol mismatch (405 errors)
    let version;
    try {
      const versionInfo = await fetchLatestWaWebVersion({});
      version = versionInfo.version;
      console.log("Using WA Web version:", version);
    } catch (e) {
      console.warn("Failed to fetch WA Web version, using default:", e.message);
    }

    const socketConfig = {
      auth: state,
      printQRInTerminal: false,
      browser: ["BillSwift", "Chrome", "1.0.0"],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
      fireInitQueries: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      retryRequestDelayMs: 500,
    };
    if (version) {
      socketConfig.version = version;
    }

    sock = makeWASocket(socketConfig);

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
        const statusCode =
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output?.statusCode
            : lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log("Connection closed. Status code:", statusCode);
        isConnected = false;

        if (!shouldReconnect) {
          console.log("Logged out. Clearing session...");
          await clearSession();
        } else if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(5000 * reconnectAttempts, 30000);
          console.log(`Reconnecting... Attempt ${reconnectAttempts} (in ${delay / 1000}s)`);
          setTimeout(async () => {
            await initializeWhatsApp();
          }, delay);
        } else {
          console.log("Max reconnection attempts reached. Will retry after a longer delay...");
          reconnectAttempts = 0;
          setTimeout(async () => {
            await initializeWhatsApp();
          }, 60000); // Wait 60 seconds before trying again
        }
      } else if (connection === "open") {
        isConnected = true;
        qrCode = null;
        reconnectAttempts = 0;
        console.log("WhatsApp connection established");
        console.log("To persist this session across Render restarts, visit: /api/whatsapp/export-creds and set the returned value as WHATSAPP_CREDS env var.");
      }
    });

    sock.ev.on("creds.update", saveCredsAndExport);
  } catch (error) {
    console.error("Error initializing WhatsApp:", error);
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`Retrying initialization... Attempt ${reconnectAttempts}`);
      setTimeout(async () => {
        await initializeWhatsApp();
      }, 5000);
    }
  } finally {
    isInitializing = false;
  }
};

// Initialize WhatsApp on server start — restore creds from env if available
restoreCredsFromEnv();

// Only auto-connect if we have existing credentials; otherwise wait for user to trigger via /api/whatsapp/qr
if (hasCredentials()) {
  console.log("Existing credentials found, auto-connecting...");
  initializeWhatsApp();
} else {
  console.log("No existing WhatsApp credentials. Visit /api/whatsapp/qr to start pairing.");
}

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
    // If not connected and not initializing, start the connection process
    if (!sock && !isInitializing) {
      console.log("QR requested — starting WhatsApp connection...");
      initializeWhatsApp();
    }
    res.json({ status: "waiting", endpoint: endpointUrl });
  }
});

// API endpoint to export credentials as base64 (copy value to WHATSAPP_CREDS env var on Render)
app.get("/api/whatsapp/export-creds", (req, res) => {
  const b64 = exportCredsAsBase64();
  if (b64) {
    res.json({ creds: b64, instructions: "Set this value as the WHATSAPP_CREDS environment variable on Render, then redeploy." });
  } else {
    res.status(404).json({ error: "No credentials found. Scan a QR code first." });
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
