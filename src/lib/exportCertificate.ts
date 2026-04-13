/**
 * Generate a PDF completion certificate for a course.
 * Opens a print-ready window with a styled certificate.
 */
export function generateCertificate(
  studentName: string,
  courseTitle: string,
  completionDate: string,
  totalPages: number,
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const dateStr = new Date(completionDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Certificat - ${courseTitle} - Ilmify</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: landscape A4; margin: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .certificate {
      width: 900px;
      padding: 60px;
      background: linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0f1419 100%);
      border: 3px solid #d4ad4a;
      border-radius: 12px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 1px solid rgba(212, 173, 74, 0.3);
      border-radius: 8px;
      pointer-events: none;
    }
    .pattern {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      opacity: 0.03;
      background-image: repeating-linear-gradient(45deg, #d4ad4a 0, #d4ad4a 1px, transparent 0, transparent 50%);
      background-size: 20px 20px;
      pointer-events: none;
    }
    .bismillah {
      font-size: 1.5rem;
      color: #d4ad4a;
      margin-bottom: 20px;
      font-family: 'Playfair Display', serif;
    }
    .title {
      font-family: 'Playfair Display', serif;
      font-size: 2.5rem;
      font-weight: 800;
      color: #d4ad4a;
      margin-bottom: 8px;
      letter-spacing: 0.05em;
    }
    .subtitle {
      font-size: 0.85rem;
      color: rgba(212, 173, 74, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 30px;
    }
    .presented-to {
      font-size: 0.85rem;
      color: #8b9dc3;
      margin-bottom: 8px;
    }
    .student-name {
      font-family: 'Playfair Display', serif;
      font-size: 2rem;
      font-weight: 700;
      color: #efe9dd;
      margin-bottom: 20px;
    }
    .for-completing {
      font-size: 0.85rem;
      color: #8b9dc3;
      margin-bottom: 8px;
    }
    .course-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.4rem;
      font-weight: 600;
      color: #2e9e8c;
      margin-bottom: 30px;
    }
    .details {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 30px;
    }
    .detail-item {
      text-align: center;
    }
    .detail-label {
      font-size: 0.7rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 0.9rem;
      color: #efe9dd;
      font-weight: 500;
    }
    .divider {
      width: 200px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #d4ad4a, transparent);
      margin: 20px auto;
    }
    .footer {
      font-size: 0.7rem;
      color: #4b5563;
    }
    .ilmify-logo {
      font-family: 'Playfair Display', serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: #d4ad4a;
      margin-top: 12px;
    }
    @media print {
      body { background: white; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="pattern"></div>
    <div style="position:relative;z-index:1">
      <div class="bismillah">﷽</div>
      <div class="title">Certificat de Complétion</div>
      <div class="subtitle">Certificate of Completion</div>
      
      <div class="presented-to">Décerné à</div>
      <div class="student-name">${studentName}</div>
      
      <div class="for-completing">Pour avoir complété avec succès le cours</div>
      <div class="course-name">« ${courseTitle} »</div>
      
      <div class="details">
        <div class="detail-item">
          <div class="detail-label">Date de complétion</div>
          <div class="detail-value">${dateStr}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Pages étudiées</div>
          <div class="detail-value">${totalPages}</div>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="footer">
        Ce certificat atteste que l'étudiant a complété l'intégralité du cours sur la plateforme Ilmify.
      </div>
      <div class="ilmify-logo">☪ Ilmify</div>
    </div>
  </div>
</body>
</html>`);

  printWindow.document.close();
  setTimeout(() => printWindow.print(), 800);
}
