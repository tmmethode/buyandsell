const nodemailer = require('nodemailer');

let transporter;

const isGmailConfigured = () => {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
};

const isSmtpConfigured = () => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM_EMAIL);
};

const isEmailEnabled = () => {
  if (isGmailConfigured()) {
    return true;
  }

  return isSmtpConfigured();
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (isGmailConfigured()) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  return transporter;
};

const resolveFromEmail = () => {
  return process.env.SMTP_FROM_EMAIL || process.env.GMAIL_USER || '';
};

const buildContractEmailHtml = (contract) => {
  const formData = contract.formData || {};
  const contractDate = contract.createdAt
    ? new Date(contract.createdAt).toLocaleDateString('en-CA')
    : 'N/A';
  const contractRef = (contract._id || 'N/A').toString().slice(-8).toUpperCase();
  const isBuyer = formData.contractPartyRole === 'buyer';
  const roleLabel = isBuyer ? 'Umuguzi (Buyer)' : 'Umugurisha (Seller)';
  const partyName = isBuyer
    ? formData.buyerName || 'N/A'
    : formData.sellerName || 'N/A';
  const partyPhone = isBuyer
    ? formData.buyerPhone || 'N/A'
    : formData.sellerPhone || 'N/A';
  const partyEmail = isBuyer
    ? formData.buyerEmail || ''
    : formData.sellerEmail || '';
  const assetType =
    formData.assetType === 'Ibindi'
      ? formData.otherAssetType || 'Ibindi'
      : formData.assetType || contract.itemType || 'N/A';

  return `
<!DOCTYPE html>
<html lang="rw">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #2539a0 0%, #3b5fe0 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">ANNOUNCEMENT AFRICA LTD</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Urubuga ruhuza Umugurisha n'Umuguzi kandi rukoroshya ubucuruzi</p>
            </td>
          </tr>

          <!-- Gold Accent -->
          <tr>
            <td style="background-color:#c8a830;height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="margin:0 0 6px;color:#2539a0;font-size:18px;font-weight:700;">Amasezerano y'Ubucuruzi Yoherejwe</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Inyandiko y'amasezerano yashyizweho umukono yakiriwe neza.</p>

              <!-- Contract Info Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fc;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Nimero y'Inyandiko</td>
                        <td style="padding:6px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">AAC-${contractRef}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-bottom:1px solid #e5e7eb;padding:0;height:1px;"></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Itariki</td>
                        <td style="padding:6px 0;color:#1f2937;font-size:14px;text-align:right;">${contractDate}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-bottom:1px solid #e5e7eb;padding:0;height:1px;"></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Uruhande</td>
                        <td style="padding:6px 0;color:#1f2937;font-size:14px;text-align:right;">${roleLabel}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-bottom:1px solid #e5e7eb;padding:0;height:1px;"></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Amazina</td>
                        <td style="padding:6px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">${partyName}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-bottom:1px solid #e5e7eb;padding:0;height:1px;"></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Telefoni</td>
                        <td style="padding:6px 0;color:#1f2937;font-size:14px;text-align:right;">${partyPhone}</td>
                      </tr>
                      ${partyEmail ? `
                      <tr>
                        <td colspan="2" style="border-bottom:1px solid #e5e7eb;padding:0;height:1px;"></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Email</td>
                        <td style="padding:6px 0;color:#1f2937;font-size:14px;text-align:right;">${partyEmail}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Asset Info Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fc;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Umutungo / Igicuruzwa</p>
                    <p style="margin:0 0 12px;color:#1f2937;font-size:15px;font-weight:600;">${contract.itemName}</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;color:#6b7280;font-size:13px;">Ubwoko:</td>
                        <td style="padding:4px 0;color:#1f2937;font-size:13px;text-align:right;">${assetType}</td>
                      </tr>
                      ${formData.agreedPrice ? `
                      <tr>
                        <td style="padding:4px 0;color:#6b7280;font-size:13px;">Igiciro:</td>
                        <td style="padding:4px 0;color:#1f2937;font-size:13px;font-weight:600;text-align:right;">${formData.agreedPrice} RWF</td>
                      </tr>` : ''}
                      ${formData.assetDescription ? `
                      <tr>
                        <td colspan="2" style="padding:8px 0 0;color:#6b7280;font-size:13px;">${formData.assetDescription}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- PDF Notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0;color:#1e40af;font-size:14px;font-weight:600;">Inyandiko y'amasezerano iri mu PDF</p>
                    <p style="margin:6px 0 0;color:#3b82f6;font-size:13px;">Inyandiko y'amasezerano yuzuye iri ku mugereka uri kuri iyi email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fc;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#1f2937;font-size:14px;font-weight:600;">Announcement Africa Ltd</p>
              <p style="margin:0 0 2px;color:#6b7280;font-size:12px;">Email: announcementafricaltd@gmail.com</p>
              <p style="margin:0 0 2px;color:#6b7280;font-size:12px;">Tel: (+250) 788 820 543</p>
              <p style="margin:0;color:#6b7280;font-size:12px;">Kigali, Rwanda</p>
              <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;">Iyi email yoherejwe mu buryo bw'ikoranabuhanga nyuma yo gusinyira amasezerano kuri website ya Announcement Africa Ltd.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const sendContractSubmissionEmails = async ({ contract, recipients, pdfBuffer }) => {
  if (!isEmailEnabled()) {
    return {
      skipped: true,
      reason: 'Email is not configured (set Gmail or SMTP env vars)',
    };
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return {
      skipped: true,
      reason: 'No recipients provided',
    };
  }

  const uniqueRecipients = [...new Set(recipients.filter(Boolean).map((email) => email.trim()))];
  if (!uniqueRecipients.length) {
    return {
      skipped: true,
      reason: 'No valid recipients provided',
    };
  }

  const formData = contract.formData || {};
  const isBuyer = formData.contractPartyRole === 'buyer';
  const partyName = isBuyer ? formData.buyerName : formData.sellerName;
  const subject = `Amasezerano y'Ubucuruzi — ${partyName || contract.itemName} | Announcement Africa Ltd`;

  const messageText = [
    'ANNOUNCEMENT AFRICA LTD',
    '─────────────────────────────────',
    '',
    "Amasezerano y'Ubucuruzi Yoherejwe",
    '',
    `Nimero: AAC-${(contract._id || '').toString().slice(-8).toUpperCase()}`,
    `Itariki: ${contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('en-CA') : 'N/A'}`,
    `Uruhande: ${isBuyer ? 'Umuguzi' : 'Umugurisha'}`,
    '',
    `Amazina: ${partyName || 'N/A'}`,
    `Asset: ${formData.assetDescription || contract.itemType || 'N/A'}`,
    `Igiciro: ${formData.agreedPrice || 'N/A'} RWF`,
    '',
    '─────────────────────────────────',
    "Inyandiko y'amasezerano yuzuye iri mu PDF iyometseho kuri iyi email.",
    '',
    'Announcement Africa Ltd',
    'Email: announcementafricaltd@gmail.com',
    'Tel: (+250) 788 820 543',
    'Kigali, Rwanda',
  ].join('\n');

  const htmlContent = buildContractEmailHtml(contract);
  const filename = `Amasezerano-AAC-${(contract._id || '').toString().slice(-8).toUpperCase()}.pdf`;

  const info = await getTransporter().sendMail({
    from: `"Announcement Africa Ltd" <${resolveFromEmail()}>`,
    to: uniqueRecipients.join(','),
    subject,
    text: messageText,
    html: htmlContent,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  return {
    skipped: false,
    messageId: info.messageId,
    recipients: uniqueRecipients,
  };
};

module.exports = {
  sendContractSubmissionEmails,
  isEmailEnabled,
};
