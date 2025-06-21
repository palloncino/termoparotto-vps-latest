import nodemailer from 'nodemailer';

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
  return nodemailer.createTransport(emailConfig);
};

// Email di notifica admin per nuova registrazione
export const sendAdminNotification = async (
  adminEmail: string,
  newUser: { name: string; email: string }
) => {
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
    await transporter.sendMail(mailOptions);
    console.log('Email di notifica admin inviata');
  } catch (error) {
    console.error('Errore invio email admin:', error);
  }
};

// Email di conferma approvazione utente
export const sendApprovalEmail = async (
  userEmail: string,
  userName: string
) => {
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
    await transporter.sendMail(mailOptions);
    console.log('Email di approvazione inviata');
  } catch (error) {
    console.error('Errore invio email approvazione:', error);
  }
};

// Email di rifiuto utente
export const sendRejectionEmail = async (
  userEmail: string,
  userName: string,
  reason?: string
) => {
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
    await transporter.sendMail(mailOptions);
    console.log('Email di rifiuto inviata');
  } catch (error) {
    console.error('Errore invio email rifiuto:', error);
  }
}; 