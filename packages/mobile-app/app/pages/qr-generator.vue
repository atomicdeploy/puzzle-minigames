<template>
  <div class="qr-generator-page">
    <header>
      <h1>🎯 تولید کد QR برای مینی‌گیم‌ها</h1>
      <p class="subtitle">ابزار استاد بازی برای ساخت کدهای دسترسی</p>
    </header>

    <div class="container">
      <div class="controls-panel">
        <h2>تنظیمات QR Code</h2>
        
        <div class="form-group">
          <label for="baseUrl">آدرس پایه (Base URL):</label>
          <input 
            v-model="baseUrl"
            type="url" 
            id="baseUrl" 
            placeholder="https://yourdomain.com/minigame-access"
            dir="ltr"
            style="text-align: start;"
          >
          <small>آدرس پایه‌ای که بازیکنان به آن هدایت می‌شوند</small>
        </div>

        <div class="form-group">
          <label>تعداد QR Code: 9 (یک برای هر مینی‌گیم)</label>
          <div class="info-box">
            <p>برای هر مینی‌گیم یک کد یکتا UUID تولید می‌شود</p>
          </div>
        </div>

        <h3>سفارشی‌سازی ظاهر</h3>

        <div class="form-group">
          <label for="qrStyle">استایل QR Code:</label>
          <select v-model="qrStyle" id="qrStyle">
            <option value="classic">کلاسیک (سیاه و سفید)</option>
            <option value="gradient">گرادیانت رنگی</option>
            <option value="dots">نقطه‌ای مدرن</option>
            <option value="rounded">گوشه‌های گرد</option>
            <option value="infernal">تم اینفرنال (بنفش-صورتی)</option>
            <option value="custom">سفارشی</option>
          </select>
          <small>استایل‌های از پیش طراحی شده برای QR Code</small>
        </div>

        <div v-show="showCustomColors" class="form-group" id="customColorsGroup">
          <label for="qrColor">رنگ QR Code:</label>
          <div class="color-input-group">
            <input v-model="qrColor" type="color" id="qrColor">
            <input v-model="qrColorText" type="text" id="qrColorText">
          </div>
        </div>

        <div v-show="showCustomColors" class="form-group" id="customBgGroup">
          <label for="bgColor">رنگ پس‌زمینه:</label>
          <div class="color-input-group">
            <input v-model="bgColor" type="color" id="bgColor">
            <input v-model="bgColorText" type="text" id="bgColorText">
          </div>
        </div>

        <div class="form-group">
          <label for="errorCorrection">سطح تصحیح خطا:</label>
          <select v-model="errorCorrection" id="errorCorrection">
            <option value="L">پایین (L) - 7%</option>
            <option value="M">متوسط (M) - 15%</option>
            <option value="Q">بالا (Q) - 25%</option>
            <option value="H">خیلی بالا (H) - 30%</option>
          </select>
          <small>سطح بالاتر امکان اضافه کردن لوگو را فراهم می‌کند</small>
        </div>

        <div class="form-group">
          <label for="margin">حاشیه (Margin): <span>{{ margin }}</span></label>
          <input 
            v-model.number="margin"
            type="range" 
            id="margin" 
            min="0" 
            max="10" 
            step="1"
          >
        </div>

        <div class="form-group">
          <label for="scale">مقیاس (Scale): <span>{{ scale }}</span></label>
          <input 
            v-model.number="scale"
            type="range" 
            id="scale" 
            min="5" 
            max="30" 
            step="1"
          >
          <small>مقیاس بالاتر = کیفیت بهتر برای چاپ</small>
        </div>

        <div class="form-group">
          <label for="logoUpload">لوگو (اختیاری):</label>
          <input 
            type="file" 
            id="logoUpload" 
            accept="image/*"
            @change="handleLogoUpload"
          >
          <button v-if="logo" @click="clearLogo" class="btn-secondary">حذف لوگو</button>
          <small>لوگو در مرکز QR Code قرار می‌گیرد</small>
        </div>

        <div class="action-buttons">
          <button @click="generateQRCodes" class="btn-primary" :disabled="isGenerating">
            🔄 تولید QR Codeها
          </button>
          <button @click="downloadZIP" id="downloadBtn" class="btn-success" :disabled="qrCodes.length === 0">
            📥 دانلود فایل ZIP
          </button>
        </div>
      </div>

      <div class="preview-panel">
        <h2>پیش‌نمایش</h2>
        <div class="preview-container">
          <div id="qrPreview" class="qr-preview">
            <p class="placeholder-text">پیش‌نمایش QR Code اینجا نمایش داده می‌شود</p>
          </div>
          <div id="previewInfo" class="preview-info" style="display: none;">
            <p><strong>شماره مینی‌گیم:</strong> <span id="previewGameNumber">1</span></p>
            <p><strong>توکن:</strong> <code id="previewToken"></code></p>
            <p><strong>URL:</strong> <code id="previewUrl"></code></p>
          </div>
        </div>

        <div id="allQRCodes" class="all-qr-codes" style="display: none;">
          <h3>همه QR Codeها</h3>
          <div id="qrGrid" class="qr-grid"></div>
        </div>
      </div>
    </div>

    <div v-if="isGenerating" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>در حال تولید و آماده‌سازی فایل‌ها...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';

// Set page metadata
useHead({
  title: 'تولید QR Code',
  meta: [
    { name: 'description', content: 'ابزار تولید QR Code برای استاد بازی' }
  ]
});

// Logo overlay constants
const LOGO_CONFIG = {
  SIZE_PERCENTAGE: 0.2,
  PADDING: 5,
  ADDITIONAL_PADDING: 10
};

// State management
const baseUrl = ref('');
const qrStyle = ref('gradient');
const qrColor = ref('#000000');
const qrColorText = ref('#000000');
const bgColor = ref('#ffffff');
const bgColorText = ref('#ffffff');
const errorCorrection = ref('M');
const margin = ref(4);
const scale = ref(10);
const logo = ref(null);
const qrCodes = ref([]);
const isGenerating = ref(false);
const showCustomColors = computed(() => qrStyle.value === 'custom');

// Initialize
onMounted(() => {
  if (process.client) {
    baseUrl.value = `${window.location.origin}/minigame-access`;
    updatePreview();
  }
});

// Watch for changes
watch([baseUrl, qrStyle, qrColor, bgColor, errorCorrection, margin, scale], () => {
  updatePreview();
}, { deep: true });

// Color sync watchers
watch(qrColor, (val) => {
  if (qrColorText.value !== val) {
    qrColorText.value = val;
  }
});

watch(qrColorText, (val) => {
  if (/^#[0-9A-F]{6}$/i.test(val) && qrColor.value !== val) {
    qrColor.value = val;
  }
});

watch(bgColor, (val) => {
  if (bgColorText.value !== val) {
    bgColorText.value = val;
  }
});

watch(bgColorText, (val) => {
  if (/^#[0-9A-F]{6}$/i.test(val) && bgColor.value !== val) {
    bgColor.value = val;
  }
});

// Get QR code options based on style
function getQROptions(style) {
  const baseOptions = {
    errorCorrectionLevel: errorCorrection.value,
    margin: margin.value,
    scale: scale.value,
    width: 256 * (scale.value / 10)
  };

  const styles = {
    classic: {
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    },
    gradient: {
      color: {
        dark: '#6c5ce7',
        light: '#FFFFFF'
      }
    },
    dots: {
      color: {
        dark: '#4ecdc4',
        light: '#FFFFFF'
      }
    },
    rounded: {
      color: {
        dark: '#fd79a8',
        light: '#FFFFFF'
      }
    },
    infernal: {
      color: {
        dark: '#6c5ce7',
        light: '#1a1a2e'
      }
    },
    custom: {
      color: {
        dark: qrColor.value,
        light: bgColor.value
      }
    }
  };

  return { ...baseOptions, ...styles[style] };
}

// Update preview with optional logo overlay
async function updatePreview() {
  if (!process.client || !baseUrl.value) return;

  const token = uuidv4();
  const url = `${baseUrl.value}?game=1&token=${token}`;

  try {
    const options = getQROptions(qrStyle.value);
    let dataUrl = await QRCode.toDataURL(url, options);

    // Apply logo overlay if logo is uploaded
    if (logo.value) {
      dataUrl = await applyLogoOverlay(dataUrl, logo.value);
    }

    const previewContainer = document.getElementById('qrPreview');
    if (previewContainer) {
      previewContainer.innerHTML = `<img src="${dataUrl}" alt="QR Code Preview" style="max-width: 100%;">`;
    }

    const previewInfo = document.getElementById('previewInfo');
    if (previewInfo) {
      previewInfo.style.display = 'block';
      document.getElementById('previewGameNumber').textContent = '1';
      document.getElementById('previewToken').textContent = token;
      document.getElementById('previewUrl').textContent = url;
    }
  } catch (error) {
    console.error('Error generating QR preview:', error);
  }
}

// Apply logo overlay to QR code
async function applyLogoOverlay(qrDataUrl, logoDataUrl) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const qrImg = new Image();
    qrImg.onload = () => {
      // Set canvas size
      canvas.width = qrImg.width;
      canvas.height = qrImg.height;
      
      // Draw QR code
      ctx.drawImage(qrImg, 0, 0);
      
      // Load and draw logo
      const logoImg = new Image();
      logoImg.onload = () => {
        const logoSize = Math.floor(qrImg.width * LOGO_CONFIG.SIZE_PERCENTAGE);
        const logoX = (qrImg.width - logoSize) / 2;
        const logoY = (qrImg.height - logoSize) / 2;
        
        // Draw white background with padding
        const bgSize = logoSize + LOGO_CONFIG.ADDITIONAL_PADDING;
        const bgX = (qrImg.width - bgSize) / 2;
        const bgY = (qrImg.height - bgSize) / 2;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(bgX, bgY, bgSize, bgSize);
        
        // Draw logo
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        
        resolve(canvas.toDataURL());
      };
      logoImg.onerror = () => reject(new Error('Failed to load logo'));
      logoImg.src = logoDataUrl;
    };
    qrImg.onerror = () => reject(new Error('Failed to load QR code'));
    qrImg.src = qrDataUrl;
  });
}

// Generate all QR codes
async function generateQRCodes() {
  isGenerating.value = true;
  qrCodes.value = [];

  try {
    for (let i = 1; i <= 9; i++) {
      const token = uuidv4();
      const url = `${baseUrl.value}?game=${i}&token=${token}`;
      const options = getQROptions(qrStyle.value);
      let dataUrl = await QRCode.toDataURL(url, options);

      // Apply logo overlay if logo is uploaded
      if (logo.value) {
        dataUrl = await applyLogoOverlay(dataUrl, logo.value);
      }

      qrCodes.value.push({
        gameNumber: i,
        token,
        url,
        dataUrl
      });
    }

    // Display all QR codes
    const allQRCodes = document.getElementById('allQRCodes');
    const qrGrid = document.getElementById('qrGrid');

    if (allQRCodes && qrGrid) {
      allQRCodes.style.display = 'block';
      qrGrid.innerHTML = qrCodes.value.map(qr => `
        <div class="qr-item">
          <img src="${qr.dataUrl}" alt="QR Code ${qr.gameNumber}">
          <p>مینی‌گیم ${qr.gameNumber}</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error generating QR codes:', error);
  } finally {
    isGenerating.value = false;
  }
}

// Download ZIP file
async function downloadZIP() {
  if (qrCodes.value.length === 0) return;

  try {
    const zip = new JSZip();
    const folder = zip.folder('qr-codes');

    for (const qr of qrCodes.value) {
      const base64Data = qr.dataUrl.split(',')[1];
      folder.file(`minigame-${qr.gameNumber}.png`, base64Data, { base64: true });

      const txtContent = `Mini-Game ${qr.gameNumber}\nToken: ${qr.token}\nURL: ${qr.url}`;
      folder.file(`minigame-${qr.gameNumber}.txt`, txtContent);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `qr-codes-${Date.now()}.zip`;
    link.click();
  } catch (error) {
    console.error('Error creating ZIP:', error);
  }
}

// Handle logo upload
function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    logo.value = e.target.result;
    updatePreview();
  };
  reader.readAsDataURL(file);
}

// Clear logo
function clearLogo() {
  logo.value = null;
  const input = document.getElementById('logoUpload');
  if (input) input.value = '';
  updatePreview();
}
</script>

<style lang="scss" scoped>
@import '@/assets/scss/qr-generator.scss';

.qr-generator-page {
  width: 100%;
  min-height: 100vh;
}
</style>
