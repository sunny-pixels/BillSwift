import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';

let sock = null;

export const initializeWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
        : true;
      console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      if (shouldReconnect) {
        initializeWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('WhatsApp connection opened');
    }
  });

  return sock;
};

export const sendPDFToWhatsApp = async (phoneNumber, pdfPath, caption = '') => {
  try {
    if (!sock) {
      throw new Error('WhatsApp not initialized');
    }

    // Format phone number (remove + and add @s.whatsapp.net)
    const formattedNumber = phoneNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

    // Read PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Send PDF
    await sock.sendMessage(formattedNumber, {
      document: pdfBuffer,
      mimetype: 'application/pdf',
      fileName: path.basename(pdfPath),
      caption: caption,
    });

    console.log(`PDF sent successfully to ${phoneNumber}`);
    return { success: true, message: 'PDF sent successfully' };
  } catch (error) {
    console.error('Error sending PDF:', error);
    throw error;
  }
};

export const getWhatsAppSocket = () => sock;
