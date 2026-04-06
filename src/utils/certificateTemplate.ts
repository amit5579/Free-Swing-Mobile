export const generateCertificateHTML = (userCertificate: any, watermarkBase64: string) => {
  if (!userCertificate) return "";
  
  const primaryColor = "#8BC34A";
  const textColor = "#333";
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 0mm; size: A4; }
          body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            padding: 15px; 
            background-color: white; 
            color: ${textColor}; 
            margin: 0; 
            line-height: 1.5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .certificate-border { 
            border: 12px solid ${primaryColor}; 
            padding: 35px; 
            border-radius: 10px; 
            box-shadow: 0 0 15px rgba(0,0,0,0.05); 
            width: 88%;
            max-width: 700px;
            min-height: 85vh;
            display: flex; 
            flex-direction: column; 
            justify-content: space-around;
            position: relative;
            overflow: hidden;
          }
          .watermark-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 85%;
            opacity: 0.15;
            transform: translate(-50%, -50%) rotate(-5deg);
            z-index: 0;
            pointer-events: none;
            user-select: none;
          }
          .header { text-align: center; margin-bottom: 20px; z-index: 10; position: relative; }
          .brand-title { font-size: 44px; font-weight: 900; color: ${primaryColor}; margin: 0; letter-spacing: 2px; }
          .brand-sub { font-size: 13px; text-transform: uppercase; letter-spacing: 4px; color: #666; margin-top: 8px; }
          .divider { height: 1.5px; background: ${primaryColor}; opacity: 0.2; margin: 25px 0; }
          .main-heading { font-size: 26px; font-weight: 900; text-align: center; color: ${primaryColor}; text-decoration: underline; letter-spacing: 3px; margin-bottom: 30px; z-index: 10; position: relative; }
          .certify-text { font-size: 15px; text-transform: uppercase; color: #888; text-align: center; margin-bottom: 8px; font-weight: 700; z-index: 10; position: relative; }
          .salutation { font-size: 16px; font-weight: 600; color: #777; text-align: center; margin-bottom: 2px; z-index: 10; position: relative; }
          .member-name { font-size: 50px; font-weight: 900; text-align: center; color: #000; text-transform: uppercase; margin: 0; letter-spacing: 1.5px; z-index: 10; position: relative; }
          .name-underline { height: 3px; background: ${primaryColor}; width: 60%; margin: 15px auto; opacity: 0.6; z-index: 10; position: relative; }
          .membership-no { font-size: 14px; text-align: center; color: #666; margin-bottom: 35px; z-index: 10; position: relative; }
          .membership-no b { color: ${primaryColor}; }
          .stats-container { display: flex; justify-content: center; background: rgba(139, 195, 74, 0.04); padding: 25px; border-radius: 15px; border: 1px solid rgba(139, 195, 74, 0.1); margin-bottom: 35px; z-index: 10; position: relative; }
          .stat-box { text-align: center; flex: 1; }
          .stat-label { font-size: 12px; font-weight: 800; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
          .stat-value { font-size: 38px; font-weight: 900; color: ${primaryColor}; margin: 0; }
          .secondary-stats { display: flex; justify-content: space-around; margin-top: 20px; border-top: 1px solid #f0f0f0; padding-top: 20px; font-size: 14px; color: #888; z-index: 10; position: relative; }
          .secondary-stats b { color: #333; }
          .footer-text { text-align: center; font-size: 14px; font-style: italic; color: #666; margin-top: 25px; z-index: 10; position: relative; }
          .footer-text b { font-weight: 900; }
          .disclaimer { font-size: 9px; color: #bbb; text-align: center; margin-top: auto; padding-top: 30px; text-transform: uppercase; letter-spacing: 0.5px; z-index: 10; position: relative; }
          .official-seal { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding: 0 20px; z-index: 10; position: relative; }
          .seal-line { width: 140px; height: 1.5px; background: ${primaryColor}; margin-bottom: 6px; }
          .seal-label { font-size: 9px; font-weight: 900; color: ${primaryColor}; letter-spacing: 1px; }
          .seal-badge { width: 60px; height: 60px; border: 3px solid rgba(139, 195, 74, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${primaryColor}; font-size: 30px; font-weight: 900; }
        </style>
      </head>
      <body>
        <div class="certificate-border">
          ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark-overlay" />` : ''}
          <div class="header">
            <div style="background: ${primaryColor}; color: white; display: inline-block; padding: 4px 14px; border-radius: 4px; font-size: 9px; font-weight: 900; letter-spacing: 2px; margin-bottom: 15px;">OFFICIAL DOCUMENT</div>
            <h1 class="brand-title">FREE SWING</h1>
            <div class="brand-sub">Gold Handicap League</div>
          </div>
          
          <div class="divider"></div>
          
          <h2 class="main-heading">HANDICAP CERTIFICATE</h2>
          
          <div style="margin-bottom: 40px; text-align: center; z-index: 10; position: relative;">
            <div class="certify-text">This is to certify that</div>
            <div class="salutation">Mr. / Mrs. / Master</div>
            <h3 class="member-name">${userCertificate?.name}</h3>
            <div class="name-underline"></div>
            <div class="membership-no">Membership No: <b>#${userCertificate?.membershipNo}</b></div>
          </div>
          
          <div class="stats-container">
            <div class="stat-box">
              <div class="stat-label">HC Index</div>
              <div class="stat-value">${userCertificate?.handicapIndex}</div>
            </div>
            <div style="width: 2px; background: #eee;"></div>
            <div class="stat-box">
              <div class="stat-label">Handicap</div>
              <div class="stat-value">${userCertificate?.handicap}</div>
            </div>
          </div>
          
          <div class="secondary-stats">
            <div>Slope: <b>${userCertificate?.slope}</b></div>
            <div>Rating: <b>${userCertificate?.rating}</b></div>
            <div>Holes: <b>${userCertificate?.completedHolesCount || 0}</b></div>
          </div>
          
          <div class="footer-text">
            Issued on <b>${userCertificate?.date}</b> for scores submitted at <b>${userCertificate?.golfCourse || "Free Swing"}</b>.
          </div>
          
          ${userCertificate?.showCourseApproval ? `
            <div class="official-seal">
              <div>
                <div class="seal-line"></div>
                <div class="seal-label">COURSE OFFICIAL</div>
              </div>
              <div class="seal-badge">✓</div>
            </div>
          ` : ''}
          
          <div class="disclaimer">
            This is an electronically generated document. Valid without physical signature.
          </div>
        </div>
      </body>
    </html>
  `;
};
