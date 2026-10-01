import crypto from 'crypto';

function encryptData(data) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    
    return { encryptedData, key: key.toString('hex'), iv: iv.toString('hex') };
}

function decryptData(encryptedData, key, iv) {
    const algorithm = 'aes-256-cbc';

    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');
    
    return decryptedData;
}

const encryptDecrypt = { encryptData, decryptData};

export default encryptDecrypt;
