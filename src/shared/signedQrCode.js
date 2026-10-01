import QRCode from 'qrcode';

const generateQRCodeDataUrl = async (jwtToken) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(jwtToken);
    // console.log('qrcode---------------',qrDataUrl)
    return qrDataUrl; // base64 image string
  } catch (err) {
    console.error('QR generation error:', err);
    return '';
  }
};

const QrCodeGeneration = {
    generateQRCodeDataUrl
}

export default QrCodeGeneration;