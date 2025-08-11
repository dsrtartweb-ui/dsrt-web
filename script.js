// Elements
const btnManual = document.getElementById('btnManual');
const btnAI = document.getElementById('btnAI');
const toolbar = document.getElementById('toolbar');
const aiDropdown = document.getElementById('aiDropdown');
const upscaleMenu = document.getElementById('upscaleMenu');
const upscaleDropdown = document.getElementById('upscaleDropdown');
const preserveTexture = document.getElementById('preserveTexture');
const noiseReduction = document.getElementById('noiseReduction');
const uploadBtn = document.getElementById('uploadBtn');
const rotateBtn = document.getElementById('rotateBtn');
const cropBtn = document.getElementById('cropBtn');
const brushBtn = document.getElementById('brushBtn');
const filterBtn = document.getElementById('filterBtn');

const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');

let currentMode = 'manual'; // 'manual' or 'ai'
let cropping = false;
let cropStart = {};
let cropEnd = {};
let painting = false;
let isLoading = false;

// Toggle Modes
btnManual.addEventListener('click', () => {
  if (isLoading) return alert('Tunggu proses selesai dulu');
  currentMode = 'manual';
  btnManual.classList.add('active');
  btnAI.classList.remove('active');
  showManualTools();
});

btnAI.addEventListener('click', () => {
  if (isLoading) return alert('Tunggu proses selesai dulu');
  currentMode = 'ai';
  btnAI.classList.add('active');
  btnManual.classList.remove('active');
  showAITools();
});

function showManualTools() {
  Array.from(toolbar.children).forEach(el => {
    if (el === aiDropdown) el.style.display = 'none';
    else el.style.display = 'inline-block';
  });
}

function showAITools() {
  Array.from(toolbar.children).forEach(el => {
    if (el === aiDropdown) el.style.display = 'inline-block';
    else el.style.display = 'none';
  });
}

// Start with manual tools
showManualTools();


// Upload Image
uploadBtn.addEventListener('click', () => {
  if (isLoading) return alert('Tunggu proses selesai dulu');
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = e => {
    const file = e.target.files[0];
    if (file) loadImageToCanvas(file);
  }
  input.click();
});

function loadImageToCanvas(file) {
  const reader = new FileReader();

  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Resize max 900x500
      const maxWidth = 900;
      const maxHeight = 500;
      let w = img.width;
      let h = img.height;

      if (w > maxWidth) {
        h = h * (maxWidth / w);
        w = maxWidth;
      }
      if (h > maxHeight) {
        w = w * (maxHeight / h);
        h = maxHeight;
      }

      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, w, h);

      // Save current image for crop reference
      canvas.tempImage = new Image();
      canvas.tempImage.src = canvas.toDataURL();
    }
    img.src = e.target.result;
  }
  reader.readAsDataURL(file);
}


// Manual Tools

// Rotate 90°
rotateBtn.addEventListener('click', () => {
  if (!canvas.width || !canvas.height) return alert('Upload dulu gambarnya!');
  rotateCanvas90();
});

function rotateCanvas90() {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx.drawImage(canvas, 0, 0);

  canvas.width = tempCanvas.height;
  canvas.height = tempCanvas.width;

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
  ctx.restore();

  // Update tempImage
  canvas.tempImage = new Image();
  canvas.tempImage.src = canvas.toDataURL();
}

// Crop
cropBtn.addEventListener('click', () => {
  if (!canvas.width || !canvas.height) return alert('Upload dulu gambarnya!');
  alert('Klik dan drag pada canvas untuk memilih area crop');
  cropping = true;
  canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('mousedown', (e) => {
  if (!cropping) return;
  const rect = canvas.getBoundingClientRect();
  cropStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  cropEnd = null;
});

canvas.addEventListener('mousemove', (e) => {
  if (!cropping || !cropStart.x) return;
  const rect = canvas.getBoundingClientRect();
  cropEnd = { x: e.clientX - rect.left, y: e.clientY - rect.top };

  // Draw crop area preview
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (canvas.tempImage) ctx.drawImage(canvas.tempImage, 0, 0, canvas.width, canvas.height);

  if (cropEnd) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropStart.x, cropStart.y, cropEnd.x - cropStart.x, cropEnd.y - cropStart.y);
  }
});

canvas.addEventListener('mouseup', () => {
  if (!cropping) return;
  cropping = false;
  canvas.style.cursor = 'default';
  if (!cropEnd) return;

  const x = Math.min(cropStart.x, cropEnd.x);
  const y = Math.min(cropStart.y, cropEnd.y);
  const width = Math.abs(cropEnd.x - cropStart.x);
  const height = Math.abs(cropEnd.y - cropStart.y);

  const imageData = ctx.getImageData(x, y, width, height);

  canvas.width = width;
  canvas.height = height;
  ctx.putImageData(imageData, 0, 0);

  // Update tempImage
  canvas.tempImage = new Image();
  canvas.tempImage.src = canvas.toDataURL();
});

// Brush
brushBtn.addEventListener('click', () => {
  if (!canvas.width || !canvas.height) return alert('Upload dulu gambarnya!');
  alert('Brush aktif: Klik dan drag pada canvas untuk melukis');
  canvas.style.cursor = 'crosshair';

  painting = false;

  canvas.onmousedown = (e) => {
    painting = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  };

  canvas.onmousemove = (e) => {
    if (!painting) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  canvas.onmouseup = () => {
    painting = false;
    canvas.style.cursor = 'default';
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    canvas.onmouseup = null;

    // Update tempImage
    canvas.tempImage = new Image();
    canvas.tempImage.src = canvas.toDataURL();
  };
});

// Filter Grayscale
filterBtn.addEventListener('click', () => {
  if (!canvas.width || !canvas.height) return alert('Upload dulu gambarnya!');

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for(let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i+1] + data[i+2]) / 3;
    data[i] = data[i+1] = data[i+2] = avg;
  }

  ctx.putImageData(imageData, 0, 0);

  // Update tempImage
  canvas.tempImage = new Image();
  canvas.tempImage.src = canvas.toDataURL();
});


// AI Restore Dropdown

// Show/hide upscale dropdown
upscaleMenu.addEventListener('mouseover', () => {
  upscaleDropdown.style.display = 'block';
});
upscaleMenu.addEventListener('mouseout', () => {
  upscaleDropdown.style.display = 'none';
});
upscaleDropdown.addEventListener('mouseover', () => {
  upscaleDropdown.style.display = 'block';
});
upscaleDropdown.addEventListener('mouseout', () => {
  upscaleDropdown.style.display = 'none';
});

// AI Feature click
document.getElementById('aiFeaturesDropdown').addEventListener('click', (e) => {
  e.preventDefault();
  if (e.target.tagName !== 'A') return;
  const feature = e.target.dataset.feature;
  if (!feature) return;

  if (isLoading) return alert('Tunggu proses selesai dulu');

  callAIRestoreBackend(feature, {
    upscale: getSelectedUpscale(),
    preserveTexture: preserveTexture.checked,
    noiseReduction: noiseReduction.checked,
  });
});

// Get selected upscale option
function getSelectedUpscale() {
  const checkedUpscale = Array.from(upscaleDropdown.querySelectorAll('a')).find(a => a.classList.contains('selected'));
  if (checkedUpscale) return checkedUpscale.dataset.upscale;
  return null;
}

// Mark selected upscale option (optional)
upscaleDropdown.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    upscaleDropdown.querySelectorAll('a').forEach(el => el.classList.remove('selected'));
    e.target.classList.add('selected');
  });
});

// Call backend for AI restore
async function callAIRestoreBackend(feature, options = {}) {
  if (!canvas.width || !canvas.height) return alert('Upload dulu gambarnya!');

  isLoading = true;
  showLoading(true);

  try {
    const imageDataURL = canvas.toDataURL('image/png');
    const res = await fetch('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature, options, image: imageDataURL }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');

    const outputURL = await pollPrediction(data.predictionId);
    if (!outputURL) throw new Error('Gagal mendapatkan hasil restore');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.tempImage = new Image();
      canvas.tempImage.src = canvas.toDataURL();

      isLoading = false;
      showLoading(false);
    };
    img.src = outputURL;

  } catch (err) {
    alert('Error: ' + err.message);
    isLoading = false;
    showLoading(false);
  }
}

// Poll backend prediction status
async function pollPrediction(id) {
  try {
    let prediction;
    do {
      const res = await fetch(`/api/prediction?id=${id}`);
      prediction = await res.json();

      if (prediction.status === 'succeeded') return prediction.output;
      if (prediction.status === 'failed') throw new Error('Restore gagal');

      // tunggu 2 detik sebelum polling ulang
      await new Promise(r => setTimeout(r, 2000));
    } while (prediction.status === 'starting' || prediction.status === 'processing');
  } catch (err) {
    alert('Error polling prediction: ' + err.message);
    return null;
  }
}

// Loading indicator simple
function showLoading(show) {
  if (show) {
    if (!document.getElementById('loadingOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.style.position = 'fixed';
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
      overlay.style.color = '#fff';
      overlay.style.fontSize = '24px';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.zIndex = 9999;
      overlay.innerText = 'Memproses restore, mohon tunggu...';
      document.body.appendChild(overlay);
    }
  } else {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.remove();
  }
}
