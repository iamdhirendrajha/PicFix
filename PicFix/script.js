// State management
let currentImage = null;
let cropper = null;
let canvas = null;
let ctx = null;
let originalImageData = null;
let currentFilters = { brightness: 100, contrast: 100, blur: 0 };
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 20;

// Get DOM elements
const fileInput = document.getElementById('fileInput');
const mainContent = document.getElementById('mainContent');
const editorPanel = document.getElementById('editorPanel');
const canvasArea = document.getElementById('canvasArea');
const backToHome = document.getElementById('backToHome');
const uploadAnother = document.getElementById('uploadAnother');
const downloadBtn = document.getElementById('downloadBtn');

// New buttons
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const resetBtnMain = document.getElementById('resetBtnMain');

// Crop controls
const cropBtn = document.getElementById('cropBtn');
const cropControls = document.getElementById('cropControls');
const cropOk = document.getElementById('cropOk');
const cropCancel = document.getElementById('cropCancel');

// Tool buttons
const rotateLeft = document.getElementById('rotateLeft');
const rotateRight = document.getElementById('rotateRight');
const flipH = document.getElementById('flipH');
const flipV = document.getElementById('flipV');
const removeBgBtn = document.getElementById('removeBgBtn');
const autoRetouchBtn = document.getElementById('autoRetouchBtn');

// Adjustment controls
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const blurSlider = document.getElementById('blur');
const bVal = document.getElementById('bVal');
const cVal = document.getElementById('cVal');
const blVal = document.getElementById('blVal');

// Compress controls
const originalSizeEl = document.getElementById('originalSize');
const targetSizeInput = document.getElementById('targetSize');
const compressOk = document.getElementById('compressOk');
const compressCancel = document.getElementById('compressCancel');

// History management
function saveToHistory() {
  if (!canvas) return;
  
  // Remove any future states if we're not at the end
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  
  // Save current state
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  history.push({
    imageData: imageData,
    filters: { ...currentFilters }
  });
  
  // Limit history size
  if (history.length > MAX_HISTORY) {
    history.shift();
  } else {
    historyIndex++;
  }
  
  updateHistoryButtons();
}

function updateHistoryButtons() {
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled = historyIndex >= history.length - 1;
  
  if (undoBtn.disabled) {
    undoBtn.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    undoBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
  
  if (redoBtn.disabled) {
    redoBtn.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    redoBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    const state = history[historyIndex];
    ctx.putImageData(state.imageData, 0, 0);
    currentFilters = { ...state.filters };
    updateFilterDisplays();
    updateHistoryButtons();
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    const state = history[historyIndex];
    ctx.putImageData(state.imageData, 0, 0);
    currentFilters = { ...state.filters };
    updateFilterDisplays();
    updateHistoryButtons();
  }
}

function updateFilterDisplays() {
  brightnessSlider.value = currentFilters.brightness;
  contrastSlider.value = currentFilters.contrast;
  blurSlider.value = currentFilters.blur;
  bVal.textContent = currentFilters.brightness + '%';
  cVal.textContent = currentFilters.contrast + '%';
  blVal.textContent = currentFilters.blur + 'px';
}

function resetAll() {
  if (!originalImageData || !canvas) return;
  
  if (confirm('Reset all changes? This will restore the original image.')) {
    // Clear history
    history = [];
    historyIndex = -1;
    
    // Restore original image
    canvas.width = originalImageData.width;
    canvas.height = originalImageData.height;
    ctx.putImageData(originalImageData, 0, 0);
    
    // Reset filters
    currentFilters = { brightness: 100, contrast: 100, blur: 0 };
    updateFilterDisplays();
    
    // Save to history
    saveToHistory();
  }
}

// File input handler
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    loadImage(file);
  }
});

function loadImage(file) {
  // Calculate and display original size
  const sizeKB = (file.size / 1024).toFixed(2);
  originalSizeEl.textContent = sizeKB + ' KB';
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      initEditor(img);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function initEditor(img) {
  // Show editor
  mainContent.style.display = 'none';
  editorPanel.style.display = 'block';
  
  // Clear canvas area
  canvasArea.innerHTML = '';
  
  // Create canvas
  canvas = document.createElement('canvas');
  canvas.id = 'editCanvas';
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '100%';
  canvas.style.objectFit = 'contain';
  
  const maxWidth = 1200;
  const maxHeight = 800;
  let width = img.width;
  let height = img.height;
  
  if (width > maxWidth) {
    height = (maxWidth / width) * height;
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = (maxHeight / height) * width;
    height = maxHeight;
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);
  
  // Save original state
  originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Initialize history
  history = [];
  historyIndex = -1;
  saveToHistory();
  
  canvasArea.appendChild(canvas);
}

// Navigation
backToHome.addEventListener('click', () => {
  if (confirm('Are you sure you want to go back? Unsaved changes will be lost.')) {
    editorPanel.style.display = 'none';
    mainContent.style.display = 'block';
    fileInput.value = '';
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  }
});

uploadAnother.addEventListener('click', () => {
  fileInput.click();
});

// Undo/Redo
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// Reset
resetBtnMain.addEventListener('click', resetAll);

// Crop functionality
cropBtn.addEventListener('click', () => {
  if (!canvas) return;
  
  if (cropper) {
    cropper.destroy();
    cropper = null;
    cropControls.classList.add('hidden');
    cropBtn.innerHTML = '<i class="fa-solid fa-crop-simple"></i> Crop';
    return;
  }
  
  const img = new Image();
  img.src = canvas.toDataURL();
  img.onload = () => {
    canvasArea.innerHTML = '';
    canvasArea.appendChild(img);
    
    cropper = new Cropper(img, {
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.8,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    });
    
    cropControls.classList.remove('hidden');
    cropBtn.innerHTML = '<i class="fa-solid fa-crop-simple"></i> Cropping...';
  };
});

cropOk.addEventListener('click', () => {
  if (!cropper) return;
  
  const croppedCanvas = cropper.getCroppedCanvas();
  canvas.width = croppedCanvas.width;
  canvas.height = croppedCanvas.height;
  ctx.drawImage(croppedCanvas, 0, 0);
  
  cropper.destroy();
  cropper = null;
  canvasArea.innerHTML = '';
  canvasArea.appendChild(canvas);
  
  cropControls.classList.add('hidden');
  cropBtn.innerHTML = '<i class="fa-solid fa-crop-simple"></i> Crop';
  
  saveToHistory();
});

cropCancel.addEventListener('click', () => {
  if (!cropper) return;
  
  cropper.destroy();
  cropper = null;
  canvasArea.innerHTML = '';
  canvasArea.appendChild(canvas);
  
  cropControls.classList.add('hidden');
  cropBtn.innerHTML = '<i class="fa-solid fa-crop-simple"></i> Crop';
});

// Rotate and Flip
rotateLeft.addEventListener('click', () => {
  if (!canvas) return;
  rotateCanvas(-90);
  saveToHistory();
});

rotateRight.addEventListener('click', () => {
  if (!canvas) return;
  rotateCanvas(90);
  saveToHistory();
});

flipH.addEventListener('click', () => {
  if (!canvas) return;
  flipCanvas('horizontal');
  saveToHistory();
});

flipV.addEventListener('click', () => {
  if (!canvas) return;
  flipCanvas('vertical');
  saveToHistory();
});

function rotateCanvas(degrees) {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  if (Math.abs(degrees) === 90) {
    tempCanvas.width = canvas.height;
    tempCanvas.height = canvas.width;
  } else {
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
  }
  
  tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
  tempCtx.rotate((degrees * Math.PI) / 180);
  tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  
  canvas.width = tempCanvas.width;
  canvas.height = tempCanvas.height;
  ctx.drawImage(tempCanvas, 0, 0);
}

function flipCanvas(direction) {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  
  tempCtx.translate(
    direction === 'horizontal' ? canvas.width : 0,
    direction === 'vertical' ? canvas.height : 0
  );
  tempCtx.scale(
    direction === 'horizontal' ? -1 : 1,
    direction === 'vertical' ? -1 : 1
  );
  tempCtx.drawImage(canvas, 0, 0);
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(tempCanvas, 0, 0);
}

// Adjustments
brightnessSlider.addEventListener('input', (e) => {
  currentFilters.brightness = e.target.value;
  bVal.textContent = e.target.value + '%';
  applyFilters();
});

contrastSlider.addEventListener('input', (e) => {
  currentFilters.contrast = e.target.value;
  cVal.textContent = e.target.value + '%';
  applyFilters();
});

blurSlider.addEventListener('input', (e) => {
  currentFilters.blur = e.target.value;
  blVal.textContent = e.target.value + 'px';
  applyFilters();
});

brightnessSlider.addEventListener('change', () => saveToHistory());
contrastSlider.addEventListener('change', () => saveToHistory());
blurSlider.addEventListener('change', () => saveToHistory());

function applyFilters() {
  if (!canvas || historyIndex < 0) return;
  
  const baseState = history[historyIndex];
  ctx.putImageData(baseState.imageData, 0, 0);
  
  const filterStr = `brightness(${currentFilters.brightness}%) contrast(${currentFilters.contrast}%) blur(${currentFilters.blur}px)`;
  ctx.filter = filterStr;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
}

// Auto Retouch
autoRetouchBtn.addEventListener('click', () => {
  currentFilters = { brightness: 110, contrast: 105, blur: 0 };
  updateFilterDisplays();
  applyFilters();
  saveToHistory();
});

// Remove Background (placeholder)
removeBgBtn.addEventListener('click', () => {
  alert('Remove Background feature requires an external API. This is a placeholder.');
});

// Compress functionality
compressOk.addEventListener('click', () => {
  if (!canvas) return;
  
  const targetKB = parseFloat(targetSizeInput.value);
  if (isNaN(targetKB) || targetKB <= 0) {
    alert('Please enter a valid target size in KB');
    return;
  }
  
  compressToSize(targetKB);
});

compressCancel.addEventListener('click', () => {
  targetSizeInput.value = '';
});

function compressToSize(targetKB) {
  const targetBytes = targetKB * 1024;
  let quality = 0.9;
  let compressed = canvas.toDataURL('image/jpeg', quality);
  
  // Binary search for optimal quality
  let minQuality = 0.1;
  let maxQuality = 1.0;
  let iterations = 0;
  const maxIterations = 10;
  
  while (iterations < maxIterations && Math.abs(getBase64Size(compressed) - targetBytes) > targetBytes * 0.05) {
    const currentSize = getBase64Size(compressed);
    
    if (currentSize > targetBytes) {
      maxQuality = quality;
    } else {
      minQuality = quality;
    }
    
    quality = (minQuality + maxQuality) / 2;
    compressed = canvas.toDataURL('image/jpeg', quality);
    iterations++;
  }
  
  const finalSizeKB = (getBase64Size(compressed) / 1024).toFixed(2);
  
  if (confirm(`Compressed to ${finalSizeKB} KB. Apply this compression?`)) {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      saveToHistory();
      alert(`Image compressed to ${finalSizeKB} KB`);
    };
    img.src = compressed;
  }
}

function getBase64Size(base64) {
  const base64Length = base64.length - (base64.indexOf(',') + 1);
  const padding = (base64.charAt(base64.length - 2) === '=') ? 2 : ((base64.charAt(base64.length - 1) === '=') ? 1 : 0);
  return base64Length * 0.75 - padding;
}

// Download
downloadBtn.addEventListener('click', () => {
  if (!canvas) return;
  
  const link = document.createElement('a');
  link.download = `PicFix-edited-${Date.now()}.png`;
  link.href = canvas.toDataURL();
  link.click();
});