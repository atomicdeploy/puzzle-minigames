import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';

// State management
const state = {
    qrCodes: [],
    settings: {
        baseUrl: 'https://example.com/minigame-access',
        errorCorrection: 'M',
        margin: 4,
        scale: 10,
        qrColor: '#000000',
        bgColor: '#ffffff',
        logo: null
    }
};

// Initialize app
function init() {
    setupEventListeners();
    updatePreview();
}

// Setup event listeners
function setupEventListeners() {
    // Input field listeners
    document.getElementById('baseUrl').addEventListener('input', (e) => {
        state.settings.baseUrl = e.target.value;
        updatePreview();
    });

    document.getElementById('qrColor').addEventListener('input', (e) => {
        state.settings.qrColor = e.target.value;
        document.getElementById('qrColorText').value = e.target.value;
        updatePreview();
    });

    document.getElementById('qrColorText').addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
            state.settings.qrColor = e.target.value;
            document.getElementById('qrColor').value = e.target.value;
            updatePreview();
        }
    });

    document.getElementById('bgColor').addEventListener('input', (e) => {
        state.settings.bgColor = e.target.value;
        document.getElementById('bgColorText').value = e.target.value;
        updatePreview();
    });

    document.getElementById('bgColorText').addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
            state.settings.bgColor = e.target.value;
            document.getElementById('bgColor').value = e.target.value;
            updatePreview();
        }
    });

    document.getElementById('errorCorrection').addEventListener('change', (e) => {
        state.settings.errorCorrection = e.target.value;
        updatePreview();
    });

    document.getElementById('margin').addEventListener('input', (e) => {
        state.settings.margin = parseInt(e.target.value);
        document.getElementById('marginValue').textContent = e.target.value;
        updatePreview();
    });

    document.getElementById('scale').addEventListener('input', (e) => {
        state.settings.scale = parseInt(e.target.value);
        document.getElementById('scaleValue').textContent = e.target.value;
        updatePreview();
    });

    document.getElementById('logoUpload').addEventListener('change', handleLogoUpload);
    document.getElementById('clearLogo').addEventListener('click', clearLogo);

    // Action buttons
    document.getElementById('generateBtn').addEventListener('click', generateAllQRCodes);
    document.getElementById('downloadBtn').addEventListener('click', downloadZip);
}

// Handle logo upload
async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            state.settings.logo = img;
            document.getElementById('clearLogo').style.display = 'block';
            updatePreview();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Clear logo
function clearLogo() {
    state.settings.logo = null;
    document.getElementById('logoUpload').value = '';
    document.getElementById('clearLogo').style.display = 'none';
    updatePreview();
}

// Update preview with sample QR code
async function updatePreview() {
    const previewContainer = document.getElementById('qrPreview');
    previewContainer.innerHTML = '';

    // Generate sample QR code with game #1
    const sampleToken = uuidv4();
    const sampleUrl = buildUrl(1, sampleToken);

    try {
        const canvas = await generateQRCanvas(sampleUrl);
        previewContainer.appendChild(canvas);

        // Update preview info
        document.getElementById('previewGameNumber').textContent = '1';
        document.getElementById('previewToken').textContent = sampleToken;
        document.getElementById('previewUrl').textContent = sampleUrl;
        document.getElementById('previewInfo').style.display = 'block';
    } catch (error) {
        console.error('Error generating preview:', error);
        previewContainer.innerHTML = '<p class="placeholder-text">خطا در تولید پیش‌نمایش</p>';
    }
}

// Build URL for minigame access
function buildUrl(gameNumber, token) {
    const url = new URL(state.settings.baseUrl);
    url.searchParams.set('game', gameNumber);
    url.searchParams.set('token', token);
    return url.toString();
}

// Generate QR code canvas
async function generateQRCanvas(data) {
    const canvas = document.createElement('canvas');
    
    const options = {
        errorCorrectionLevel: state.settings.errorCorrection,
        margin: state.settings.margin,
        scale: state.settings.scale,
        color: {
            dark: state.settings.qrColor,
            light: state.settings.bgColor
        }
    };

    await QRCode.toCanvas(canvas, data, options);

    // Add logo if present
    if (state.settings.logo) {
        addLogoToCanvas(canvas, state.settings.logo);
    }

    return canvas;
}

// Add logo to canvas center
function addLogoToCanvas(canvas, logo) {
    const ctx = canvas.getContext('2d');
    const logoSize = Math.floor(canvas.width * 0.2); // 20% of QR code size
    const x = (canvas.width - logoSize) / 2;
    const y = (canvas.height - logoSize) / 2;

    // Draw white background for logo
    ctx.fillStyle = 'white';
    ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);

    // Draw logo
    ctx.drawImage(logo, x, y, logoSize, logoSize);
}

// Generate all 9 QR codes
async function generateAllQRCodes() {
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const loading = document.getElementById('loading');

    generateBtn.disabled = true;
    loading.style.display = 'flex';

    try {
        state.qrCodes = [];
        
        // Generate 9 QR codes
        for (let i = 1; i <= 9; i++) {
            const token = uuidv4();
            const url = buildUrl(i, token);
            const canvas = await generateQRCanvas(url);
            
            state.qrCodes.push({
                gameNumber: i,
                token: token,
                url: url,
                canvas: canvas
            });
        }

        // Display all QR codes
        displayAllQRCodes();

        // Enable download button
        downloadBtn.disabled = false;

        // Show success notification
        showNotification('✅ تمام QR Codeها با موفقیت تولید شدند!', 'success');
    } catch (error) {
        console.error('Error generating QR codes:', error);
        showNotification('❌ خطا در تولید QR Codeها', 'error');
    } finally {
        generateBtn.disabled = false;
        loading.style.display = 'none';
    }
}

// Display all generated QR codes
function displayAllQRCodes() {
    const allQRCodesSection = document.getElementById('allQRCodes');
    const qrGrid = document.getElementById('qrGrid');

    qrGrid.innerHTML = '';

    state.qrCodes.forEach((qrData) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'qr-grid-item';
        
        const canvas = qrData.canvas.cloneNode(true);
        const label = document.createElement('p');
        label.textContent = `مینی‌گیم ${qrData.gameNumber}`;
        
        gridItem.appendChild(canvas);
        gridItem.appendChild(label);
        qrGrid.appendChild(gridItem);
    });

    allQRCodesSection.style.display = 'block';
}

// Convert canvas to high-resolution image with CMYK simulation
async function canvasToHighResBlob(canvas, dpi = 300) {
    // Create high-resolution canvas
    const scaleFactor = dpi / 96; // Standard screen DPI is 96
    const highResCanvas = document.createElement('canvas');
    highResCanvas.width = canvas.width * scaleFactor;
    highResCanvas.height = canvas.height * scaleFactor;

    const ctx = highResCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.scale(scaleFactor, scaleFactor);
    ctx.drawImage(canvas, 0, 0);

    return new Promise((resolve) => {
        highResCanvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
    });
}

// Download all QR codes as ZIP
async function downloadZip() {
    const downloadBtn = document.getElementById('downloadBtn');
    const loading = document.getElementById('loading');

    downloadBtn.disabled = true;
    loading.style.display = 'flex';

    try {
        const zip = new JSZip();
        const qrFolder = zip.folder('qr-codes');

        // Add README file
        const readme = generateReadme();
        qrFolder.file('README.txt', readme);

        // Add tokens JSON file
        const tokensData = state.qrCodes.map(qr => ({
            gameNumber: qr.gameNumber,
            token: qr.token,
            url: qr.url
        }));
        qrFolder.file('tokens.json', JSON.stringify(tokensData, null, 2));

        // Add high-resolution QR code images
        for (const qrData of state.qrCodes) {
            const blob = await canvasToHighResBlob(qrData.canvas, 300);
            qrFolder.file(
                `minigame-${qrData.gameNumber}-qr-code.png`,
                blob
            );
        }

        // Generate ZIP file
        const zipBlob = await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });

        // Download ZIP file
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `qr-codes-${new Date().toISOString().split('T')[0]}.zip`;
        link.click();

        showNotification('✅ فایل ZIP با موفقیت دانلود شد!', 'success');
    } catch (error) {
        console.error('Error creating ZIP:', error);
        showNotification('❌ خطا در ایجاد فایل ZIP', 'error');
    } finally {
        downloadBtn.disabled = false;
        loading.style.display = 'none';
    }
}

// Generate README content
function generateReadme() {
    return `
کدهای QR مینی‌گیم‌های اینفرنال
================================

این فایل شامل QR Codeهای تولید شده برای 9 مینی‌گیم است.

محتویات:
---------
- minigame-[1-9]-qr-code.png: تصاویر با کیفیت بالا (300 DPI) مناسب برای چاپ
- tokens.json: اطلاعات توکن‌ها و URLها به فرمت JSON

مشخصات تصاویر:
--------------
- فرمت: PNG
- کیفیت: 300 DPI (مناسب برای چاپ)
- رزولوشن: بالا
- رنگ: RGB (برای تبدیل به CMYK از نرم‌افزار گرافیکی استفاده کنید)

نحوه استفاده:
-------------
1. تصاویر را چاپ کنید
2. QR Codeها را در محیط بازی قرار دهید
3. بازیکنان با اسکن کد، به صفحه مینی‌گیم هدایت می‌شوند
4. توکن امنیتی به صورت خودکار اعتبارسنجی می‌شود

توجه:
------
توکن‌های UUID منحصر به فرد هستند و نباید افشا شوند.
فایل tokens.json را برای مرجع خود نگه دارید.

تاریخ تولید: ${new Date().toLocaleString('fa-IR')}
`;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        font-weight: 700;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
