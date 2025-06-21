"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRejectionEmail = exports.sendApprovalEmail = exports.sendAdminNotification = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Configurazione email (da spostare in .env)
const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true per 465, false per altri porti
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
};
// Creare transporter
const createTransporter = () => {
    return nodemailer_1.default.createTransport(emailConfig);
};
// Email di notifica admin per nuova registrazione
const sendAdminNotification = (adminEmail, newUser) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = createTransporter();
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmail,
        subject: 'Nuova Richiesta di Registrazione - Termoparotto',
        html: `
      <h2>Nuova Richiesta di Registrazione</h2>
      <p>Un nuovo utente ha richiesto l'accesso all'applicazione:</p>
      <ul>
        <li><strong>Nome:</strong> ${newUser.name}</li>
        <li><strong>Email:</strong> ${newUser.email}</li>
      </ul>
      <p>Per approvare o rifiutare la richiesta, accedi alla dashboard admin.</p>
      <p>Link: <a href="http://termoparotto.micro-cloud.it/admin/users">Dashboard Admin</a></p>
    `,
    };
    try {
        yield transporter.sendMail(mailOptions);
        console.log('Email di notifica admin inviata');
    }
    catch (error) {
        console.error('Errore invio email admin:', error);
    }
});
exports.sendAdminNotification = sendAdminNotification;
// Email di conferma approvazione utente
const sendApprovalEmail = (userEmail, userName) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = createTransporter();
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Account Approvato - Termoparotto',
        html: `
      <h2>Account Approvato!</h2>
      <p>Ciao ${userName},</p>
      <p>Il tuo account è stato approvato dall'amministratore.</p>
      <p>Ora puoi accedere all'applicazione:</p>
      <p><a href="http://termoparotto.micro-cloud.it/login">Accedi all'App</a></p>
      <p>Grazie!</p>
    `,
    };
    try {
        yield transporter.sendMail(mailOptions);
        console.log('Email di approvazione inviata');
    }
    catch (error) {
        console.error('Errore invio email approvazione:', error);
    }
});
exports.sendApprovalEmail = sendApprovalEmail;
// Email di rifiuto utente
const sendRejectionEmail = (userEmail, userName, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = createTransporter();
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Richiesta Account Rifiutata - Termoparotto',
        html: `
      <h2>Richiesta Account Rifiutata</h2>
      <p>Ciao ${userName},</p>
      <p>La tua richiesta di registrazione è stata rifiutata dall'amministratore.</p>
      ${reason ? `<p>Motivo: ${reason}</p>` : ''}
      <p>Per ulteriori informazioni, contatta l'amministratore.</p>
    `,
    };
    try {
        yield transporter.sendMail(mailOptions);
        console.log('Email di rifiuto inviata');
    }
    catch (error) {
        console.error('Errore invio email rifiuto:', error);
    }
});
exports.sendRejectionEmail = sendRejectionEmail;
