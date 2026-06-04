export function getPremiumInviteEmailHtml(senderName: string, appUrl: string = "https://proforma360.vercel.app") {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #FAFAF8;
    color: #0f172a;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .header {
    padding: 32px 32px 0 32px;
    text-align: center;
  }
  .logo {
    font-size: 24px;
    font-weight: 800;
    color: #0F766E;
    letter-spacing: -0.5px;
    margin: 0;
  }
  .subtitle {
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
  }
  .hero {
    padding: 32px;
    text-align: center;
  }
  .headline {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin: 0 0 16px 0;
    letter-spacing: -0.5px;
  }
  .subheadline {
    font-size: 16px;
    color: #475569;
    line-height: 1.5;
    margin: 0;
  }
  .image-container {
    background: #f1f5f9;
    padding: 24px 32px;
    text-align: center;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
  }
  .screenshot {
    width: 100%;
    max-width: 500px;
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
    border: 1px solid #e2e8f0;
  }
  .features {
    padding: 32px;
    background: #ffffff;
  }
  .feature-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }
  .feature-icon {
    color: #0F766E;
    font-weight: bold;
    margin-right: 12px;
    font-size: 18px;
  }
  .feature-text {
    font-size: 15px;
    font-weight: 500;
    color: #334155;
    margin: 0;
  }
  .cta-container {
    padding: 0 32px 40px 32px;
    text-align: center;
  }
  .btn-primary {
    display: inline-block;
    background-color: #0F766E;
    color: #ffffff !important;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    padding: 14px 32px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(15, 118, 110, 0.2);
    margin-bottom: 16px;
  }
  .btn-secondary {
    display: inline-block;
    color: #475569 !important;
    text-decoration: none;
    font-weight: 600;
    font-size: 15px;
    margin-left: 16px;
  }
  .footer {
    text-align: center;
    padding: 32px;
    background: #FAFAF8;
    border-top: 1px solid #e2e8f0;
  }
  .footer-text {
    font-size: 13px;
    color: #64748b;
    margin: 0 0 8px 0;
  }
  .footer-links {
    font-size: 13px;
    color: #94a3b8;
  }
  .footer-links a {
    color: #0F766E;
    text-decoration: none;
  }
  .social-proof {
    background: #f8fafc;
    padding: 24px 32px;
    text-align: center;
    border-top: 1px solid #f1f5f9;
  }
  .social-proof-text {
    font-size: 14px;
    color: #475569;
    font-style: italic;
    margin: 0;
  }
</style>
</head>
<body>

<div class="container">
  <div class="header">
    <h1 class="logo">Proforma360</h1>
    <p class="subtitle">Workspace Comercial Moderno</p>
  </div>

  <div class="hero">
    <h2 class="headline">CRM, Pipeline e Proformas num único workspace.</h2>
    <p class="subheadline">
      ${senderName ? `${senderName} recomendou o Proforma360 para a sua equipa.` : 'Recomendamos o Proforma360 para a sua equipa.'} 
      Crie propostas profissionais, acompanhe negociações e envie tudo via WhatsApp ou Email.
    </p>
  </div>

  <div class="image-container">
    <!-- Fallback to a styled CSS box if image is not uploaded yet, or point to vercel asset -->
    <img src="${appUrl}/images/email-preview.png" alt="Proforma360 Dashboard" class="screenshot" onerror="this.style.display='none'">
  </div>

  <div class="features">
    <div class="feature-item">
      <span class="feature-icon">✓</span>
      <p class="feature-text">Proformas profissionais em PDF numa fração de segundos</p>
    </div>
    <div class="feature-item">
      <span class="feature-icon">✓</span>
      <p class="feature-text">Pipeline comercial integrado com alertas operacionais</p>
    </div>
    <div class="feature-item">
      <span class="feature-icon">✓</span>
      <p class="feature-text">Partilha instantânea via WhatsApp e Email</p>
    </div>
    <div class="feature-item">
      <span class="feature-icon">✓</span>
      <p class="feature-text">Funcionamento Offline-First super rápido</p>
    </div>
    <div class="feature-item">
      <span class="feature-icon">✓</span>
      <p class="feature-text">Backup automático em Cloud Segura</p>
    </div>
  </div>

  <div class="cta-container">
    <a href="${appUrl}" class="btn-primary">Começar Gratuitamente</a>
    <br>
    <a href="${appUrl}" class="btn-secondary">Ver Demonstração &rarr;</a>
  </div>

  <div class="social-proof">
    <p class="social-proof-text">🚀 Utilizado por equipas comerciais modernas para gerir propostas, clientes e follow-ups num único workspace.</p>
  </div>

  <div class="footer">
    <p class="footer-text">Proforma360</p>
    <p class="footer-links">
      CRM • Pipeline • Proformas • Offline-First<br><br>
      <a href="${appUrl}">${appUrl.replace('https://', '')}</a>
    </p>
  </div>
</div>

</body>
</html>
  `.trim();
}
