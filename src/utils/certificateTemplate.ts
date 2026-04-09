// export const generateCertificateHTML = (userCertificate: any, watermarkBase64: string, logoBase64: string) => {
//   if (!userCertificate) return "";
  
//   const primaryColor = "#8BC34A";
//   const textColor = "#333";
  
//   return `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <style>
//           @page { 
//             size: A4; 
//             margin: 10mm; 
//           }
//           * { box-sizing: border-box; }
//           body { 
//             font-family: 'Helvetica', 'Arial', sans-serif; 
//             background-color: white; 
//             color: ${textColor}; 
//             margin: 0; 
//             padding: 0;
//             display: flex;
//             justify-content: center;
//             align-items: flex-start;
//           }
//           .certificate-border { 
//             border: 10px solid ${primaryColor}; 
//             padding: 30px; 
//             border-radius: 5px; 
//             width: 190mm;
//             min-height: 265mm;
//             display: flex; 
//             flex-direction: column; 
//             position: relative;
//             overflow: hidden;
//             background-color: #fff;
//           }
//           .watermark-overlay {
//             position: absolute;
//             top: 50%;
//             left: 50%;
//             width: 80%;
//             opacity: 0.12;
//             transform: translate(-50%, -50%) rotate(-5deg);
//             z-index: 0;
//             pointer-events: none;
//           }
//           .header { text-align: center; z-index: 10; position: relative; margin-bottom: 20px; }
//           .logo { width: 110px; height: auto; margin-bottom: 10px; }
//           .divider { height: 1.5px; background: ${primaryColor}; opacity: 0.2; margin: 20px 0; }
//           .main-heading { font-size: 24px; font-weight: 900; text-align: center; color: ${primaryColor}; text-decoration: underline; letter-spacing: 4px; margin: 20px 0; z-index: 10; position: relative; }
//           .certify-text { font-size: 14px; text-transform: uppercase; color: #777; text-align: center; margin-bottom: 5px; font-weight: 700; z-index: 10; position: relative; }
//           .salutation { font-size: 15px; font-weight: 600; color: #888; text-align: center; margin-bottom: 5px; z-index: 10; position: relative; }
//           .member-name { font-size: 44px; font-weight: 900; text-align: center; color: #000; text-transform: uppercase; margin: 10px 0; letter-spacing: 2px; z-index: 10; position: relative; }
//           .name-underline { height: 2.5px; background: ${primaryColor}; width: 60%; margin: 15px auto; opacity: 0.5; z-index: 10; position: relative; }
//           .membership-no { font-size: 14px; text-align: center; color: #666; margin-bottom: 30px; z-index: 10; position: relative; }
//           .membership-no b { color: ${primaryColor}; }
//           .stats-container { display: flex; justify-content: center; background: rgba(139, 195, 74, 0.04); padding: 25px; border-radius: 15px; border: 1.2px solid rgba(139, 195, 74, 0.12); margin-bottom: 30px; z-index: 10; position: relative; }
//           .stat-box { text-align: center; flex: 1; }
//           .stat-label { font-size: 12px; font-weight: 800; color: #777; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1.5px; }
//           .stat-value { font-size: 36px; font-weight: 900; color: ${primaryColor}; margin: 0; }
//           .secondary-stats { display: flex; justify-content: space-around; margin-top: 15px; border-top: 1px solid #f0f0f0; padding-top: 20px; font-size: 14px; color: #777; z-index: 10; position: relative; }
//           .footer-text { text-align: center; font-size: 14px; font-style: italic; color: #555; margin-top: 30px; line-height: 1.6; z-index: 10; position: relative; padding: 0 20px; }
//           .official-seal { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; padding: 0 40px; z-index: 10; position: relative; }
//           .seal-line { width: 140px; height: 1.5px; background: ${primaryColor}; margin-bottom: 6px; }
//           .seal-label { font-size: 10px; font-weight: 900; color: ${primaryColor}; letter-spacing: 1.5px; }
//           .seal-badge { width: 62px; height: 62px; border: 3.5px solid rgba(139, 195, 74, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${primaryColor}; font-size: 32px; font-weight: 900; }
//           .disclaimer { font-size: 10px; color: #999; text-align: center; margin-top: auto; padding-top: 40px; text-transform: uppercase; letter-spacing: 0.8px; z-index: 10; position: relative; }
//         </style>
//       </head>
//       <body>
//         <div class="certificate-border">
//           ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark-overlay" />` : ''}
          
//           <div class="header">
//             ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : '<h1 style="color: #8BC34A; margin: 0;">FREE SWING</h1>'}
//             <div style="background: ${primaryColor}; color: white; display: inline-block; padding: 6px 18px; border-radius: 4px; font-size: 10px; font-weight: 900; letter-spacing: 3px; margin: 15px 0;">OFFICIAL DOCUMENT</div>
//             <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 5px; color: #555; font-weight: 600;">Gold Handicap League</div>
//           </div>
          
//           <div class="divider"></div>
          
//           <h2 class="main-heading">HANDICAP CERTIFICATE</h2>
          
//           <div style="text-align: center;">
//             <div class="certify-text">This is to certify that</div>
//             <div class="salutation">Mr. / Mrs. / Master</div>
//             <h3 class="member-name">${userCertificate?.name || 'N/A'}</h3>
//             <div class="name-underline"></div>
//             <div class="membership-no">Membership No: <b>#${userCertificate?.membershipNo || '---'}</b></div>
//           </div>
          
//           <div class="stats-container">
//             <div class="stat-box">
//               <div class="stat-label">HC Index</div>
//               <div class="stat-value">${userCertificate?.handicapIndex || '0.0'}</div>
//             </div>
//             <div style="width: 2px; background: rgba(139, 195, 74, 0.2); margin: 0 10px;"></div>
//             <div class="stat-box">
//               <div class="stat-label">Handicap</div>
//               <div class="stat-value">${userCertificate?.handicap || '0'}</div>
//             </div>
//           </div>
          
//           <div class="secondary-stats">
//             <div>Slope: <b>${userCertificate?.slope || '0'}</b></div>
//             <div>Rating: <b>${userCertificate?.rating || '0.0'}</b></div>
//             <div>Holes: <b>${userCertificate?.completedHolesCount || 0}</b></div>
//           </div>
          
//           <div class="footer-text">
//             Issued on <b>${userCertificate?.date || 'N/A'}</b> for scores submitted at <b>${userCertificate?.golfCourse || "Free Swing"}</b>.
//           </div>
          
//           ${userCertificate?.showCourseApproval ? `
//             <div class="official-seal">
//               <div>
//                 <div class="seal-line"></div>
//                 <div class="seal-label">COURSE OFFICIAL</div>
//               </div>
//               <div class="seal-badge">✓</div>
//             </div>
//           ` : ''}
          
//           <div class="disclaimer">
//             This is an electronically generated document. Valid without physical signature.
//           </div>
//         </div>
//       </body>
//     </html>
//   `;
// };
