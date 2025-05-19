import React, { useState, useRef } from "react";
import QRCode from "react-qr-code";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../store/authStore";

interface QRCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [size, setSize] = useState<number>(200);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  // Generate the URL for the public menu
  const menuUrl = `${window.location.origin}/menu/${user?.tenantId}`;

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!qrCodeRef.current) return;
    
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const svg = qrCodeRef.current.querySelector("svg");
    
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Fill with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the QR code
      ctx.drawImage(img, 0, 0, size, size);
      
      // Create download link
      const link = document.createElement("a");
      link.download = "restaurant-menu-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const handlePrint = () => {
    if (!qrCodeRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const svg = qrCodeRef.current.querySelector("svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const imgSrc = `data:image/svg+xml;base64,${btoa(svgData)}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${t("menu.qrCodePrint", "Restaurant Menu QR Code")}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
            }
            .qr-code {
              max-width: 100%;
              height: auto;
            }
            .url-text {
              margin-top: 10px;
              font-size: 14px;
              word-break: break-all;
            }
            .instructions {
              margin-top: 20px;
              font-size: 16px;
              max-width: 400px;
              text-align: center;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${imgSrc}" class="qr-code" width="${size}" height="${size}" />
            <p class="url-text">${menuUrl}</p>
            <p class="instructions">${t("menu.scanInstructions", "Scan this QR code to view our menu on your device")}</p>
            <button class="no-print" onclick="window.print(); window.close();" style="margin-top: 20px; padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
              ${t("common.print", "Print")}
            </button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{t("menu.qrCodeGenerator", "Menu QR Code Generator")}</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("menu.qrCodeSize", "QR Code Size")}
          </label>
          <input
            type="range"
            min="100"
            max="400"
            step="10"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-gray-500 mt-1">{size}px</div>
        </div>
        
        <div className="flex justify-center mb-4" ref={qrCodeRef}>
          <QRCode
            value={menuUrl}
            size={size}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        </div>
        
        <div className="text-center mb-4">
          <p className="text-sm text-gray-500 break-all">{menuUrl}</p>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-sm text-gray-700">
            {t("menu.qrCodeInstructions", "Place this QR code on your tables or at the entrance for customers to scan and view your menu.")}
          </p>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={handleDownload}
            className="bg-forest-500 hover:bg-forest-600 text-white px-4 py-2 rounded-md"
          >
            {t("common.download", "Download")}
          </button>
          
          <button
            onClick={handlePrint}
            className="bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded-md"
          >
            {t("common.print", "Print")}
          </button>
          
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
