export default class AddView {
  renderSection() {
    return `
      <section class="container">
        <div class="add-story-container">
          <h1><i class="fa-solid fa-plus-circle" aria-hidden="true"></i> Tambah Cerita Baru</h1>
          <form id="add-story-form" autocomplete="off">
            <div class="form-group">
              <label for="description">Cerita Anda</label>
              <textarea id="description" name="description" placeholder="Bagikan pengalaman atau cerita menarik Anda di sini..." required></textarea>
            </div>
            <div class="form-group">
              <label for="camera-preview">Foto</label>
              <div class="camera-container">
                <video id="camera-preview" autoplay playsinline></video>
                <canvas id="camera-canvas" style="display:none;"></canvas>
                <div class="camera-buttons">
                  <button type="button" id="capture-btn" class="btn-primary">
                    <i class="fa-solid fa-camera" aria-hidden="true"></i> Ambil Foto
                  </button>
                  <button type="button" id="recapture-btn" class="btn-secondary" style="display:none;">
                    <i class="fa-solid fa-rotate" aria-hidden="true"></i> Ambil Ulang
                  </button>
                </div>
                <img id="captured-image" alt="Pratinjau foto yang diambil" style="display:none;" />
              </div>
            </div>
            <div class="form-group">
              <label for="location-map">Lokasi</label>
              <p>Klik pada peta untuk menandai lokasi cerita Anda</p>
              <div id="location-map" class="map-container"></div>
              <div class="location-display">
                <input type="text" id="latitude" name="latitude" placeholder="Latitude" required readonly />
                <input type="text" id="longitude" name="longitude" placeholder="Longitude" required readonly />
              </div>
            </div>
            <div class="form-submit">
              <button type="submit" id="submit-btn">
                <i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Kirim Cerita
              </button>
            </div>
          </form>
          <div id="add-story-message" aria-live="polite"></div>
        </div>
      </section>
    `;
  }

  showMessage(type, message) {
    const messageArea = document.getElementById('add-story-message');
    if (!messageArea) return;
    let icon = '';
    if (type === 'success') {
      icon = '<i class="fa-solid fa-check-circle" aria-hidden="true"></i>';
      messageArea.innerHTML = `<div class="alert alert-success">${icon} ${message}</div>`;
    } else {
      icon = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>';
      messageArea.innerHTML = `<div class="alert alert-error">${icon} ${message}</div>`;
    }
  }
  setSubmitButtonState(loading) {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      if (loading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Mengirim...';
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Kirim Cerita';
      }
    }
  }

  onFormSubmit(callback) {
    const form = document.getElementById('add-story-form');
    if (form) {
      form.addEventListener('submit', callback);
    }
  }

  resetFormUI() {
    const img = document.getElementById('captured-image');
    const video = document.getElementById('camera-preview');
    const captureBtn = document.getElementById('capture-btn');
    const recaptureBtn = document.getElementById('recapture-btn');
    if (img) img.style.display = 'none';
    if (video) video.style.display = 'block';
    if (captureBtn) captureBtn.style.display = 'inline-block';
    if (recaptureBtn) recaptureBtn.style.display = 'none';
  }

  navigateTo(url, delay = 0) {
    setTimeout(() => {
      window.location.href = url;
    }, delay);
  }
  setLatLngInputs(lat, lng) {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
  }

  // Camera and map setup for MVP compliance
  setupCameraAndMap({ onCapture, onRecapture, onMapClick, onGeoSuccess, onGeoError }) {
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('camera-canvas');
    const captureBtn = document.getElementById('capture-btn');
    const recaptureBtn = document.getElementById('recapture-btn');
    const img = document.getElementById('captured-image');
    const mapContainer = document.getElementById('location-map');
    this.stream = null;

    // Camera setup
    canvas.width = 640;
    canvas.height = 480;

    const startCamera = async () => {
      try {
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        };
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = this.stream;
        captureBtn.disabled = false;
      } catch (err) {
        if (onGeoError) onGeoError('Kamera tidak dapat diakses. Pastikan Anda memberikan izin kamera.');
      }
    };

    const stopCamera = () => {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    };
    
    // Store stopCamera method for external access
    this.stopCamera = stopCamera;

    captureBtn.addEventListener('click', () => {
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (onCapture) onCapture(blob, img, video, captureBtn, recaptureBtn);
      }, 'image/jpeg', 0.95);
    });

    recaptureBtn.addEventListener('click', () => {
      if (onRecapture) onRecapture(img, video, captureBtn, recaptureBtn);
    });

    window.addEventListener('beforeunload', stopCamera);
    window.addEventListener('pagehide', stopCamera);
    
    // Store cleanup function
    this._cleanup = () => {
      window.removeEventListener('beforeunload', stopCamera);
      window.removeEventListener('pagehide', stopCamera);
      stopCamera();
    };

    startCamera();

    // Map setup
    if (typeof L !== 'undefined') {
      const map = L.map('location-map').setView([-2.5, 118.0], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      let marker = null;
      map.on('click', (e) => {
        if (onMapClick) onMapClick(e, map, marker, (m) => { marker = m; });
      });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (onGeoSuccess) onGeoSuccess(position, map, marker, (m) => { marker = m; });
        },
        (error) => {
          if (onGeoError) onGeoError(error);
        }
      );
    }
  }

  // Clean up camera and event listeners
  destroy() {
    console.log('Cleaning up camera and resources...');
    if (this._cleanup) {
      this._cleanup();
    }
    if (this.stopCamera) {
      this.stopCamera();
    }
  }
}