import QRCode from "qrcode";

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 300,
      margin: 2,
    });
    return dataUrl;
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    throw new Error("QR code generation failed");
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(text: string): Promise<string> {
  try {
    const svg = await QRCode.toString(text, {
      errorCorrectionLevel: "M",
      type: "svg",
      width: 300,
      margin: 2,
    });
    return svg;
  } catch (error) {
    console.error("Failed to generate QR code SVG:", error);
    throw new Error("QR code generation failed");
  }
}

