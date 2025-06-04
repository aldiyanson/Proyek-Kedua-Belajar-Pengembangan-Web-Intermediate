import OfflineDataModel from '../model/offline-data-model.js';
import OfflineDataView from '../view/offline-data-view.js';

export default class OfflineDataPresenter {
  constructor() {
    this.model = new OfflineDataModel();
    this.view = new OfflineDataView();
  }

  async render() {
    return this.view.renderSection();
  }

  async afterRender() {
    this.bindEvents();
  }

  bindEvents() {
    // Save sample data button
    const saveSampleBtn = document.getElementById('save-sample-data-btn');
    if (saveSampleBtn) {
      saveSampleBtn.addEventListener('click', () => this.handleSaveSampleData());
    }

    // View offline data button
    const viewDataBtn = document.getElementById('view-offline-data-btn');
    if (viewDataBtn) {
      viewDataBtn.addEventListener('click', () => this.handleViewOfflineData());
    }

    // Delete offline data button
    const deleteDataBtn = document.getElementById('delete-offline-data-btn');
    if (deleteDataBtn) {
      deleteDataBtn.addEventListener('click', () => this.handleDeleteOfflineData());
    }

    // Show stats button
    const showStatsBtn = document.getElementById('show-stats-btn');
    if (showStatsBtn) {
      showStatsBtn.addEventListener('click', () => this.handleShowStats());
    }

    // Export data button
    const exportDataBtn = document.getElementById('export-data-btn');
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => this.handleExportData());
    }

    // Clear all data button
    const clearAllBtn = document.getElementById('clear-all-data-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.handleClearAllData());
    }
  }

  async handleSaveSampleData() {
    try {
      this.setButtonLoading('save-sample-data-btn', true);
      this.view.hideDisplays();
      
      // Generate sample data
      const sampleData = this.view.generateSampleData();
      
      // Save to IndexedDB
      const result = await this.model.saveSampleData(sampleData);
      
      if (result.success) {
        this.view.showMessage(result.message, 'success');
        
        // Auto-show the saved data
        setTimeout(() => {
          this.handleViewOfflineData();
        }, 1000);
      } else {
        this.view.showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Error saving sample data:', error);
      this.view.showMessage('Terjadi kesalahan saat menyimpan data sample', 'error');
    } finally {
      this.setButtonLoading('save-sample-data-btn', false);
    }
  }

  async handleViewOfflineData() {
    try {
      this.setButtonLoading('view-offline-data-btn', true);
      this.view.hideDisplays();
      
      const result = await this.model.getAllOfflineData();
      
      if (result.success) {
        this.view.showData(result.data);
        this.view.showMessage('Data offline berhasil dimuat', 'success');
      } else {
        this.view.showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Error viewing offline data:', error);
      this.view.showMessage('Terjadi kesalahan saat memuat data offline', 'error');
    } finally {
      this.setButtonLoading('view-offline-data-btn', false);
    }
  }

  async handleDeleteOfflineData() {
    // Show confirmation dialog
    const confirmed = confirm(
      'Apakah Anda yakin ingin menghapus SEMUA data offline?\n\n' +
      'Tindakan ini tidak dapat dibatalkan dan akan menghapus:\n' +
      '- Semua cerita yang tersimpan\n' +
      '- Antrian offline\n' +
      '- Cache user\n' +
      '- Cache gambar\n' +
      '- Pengaturan aplikasi'
    );

    if (!confirmed) {
      return;
    }

    try {
      this.setButtonLoading('delete-offline-data-btn', true);
      this.view.hideDisplays();
      
      const result = await this.model.deleteAllOfflineData();
      
      if (result.success) {
        this.view.showMessage(result.message, 'success');
      } else {
        this.view.showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Error deleting offline data:', error);
      this.view.showMessage('Terjadi kesalahan saat menghapus data offline', 'error');
    } finally {
      this.setButtonLoading('delete-offline-data-btn', false);
    }
  }

  async handleShowStats() {
    try {
      this.setButtonLoading('show-stats-btn', true);
      this.view.hideDisplays();
      
      const result = await this.model.getDatabaseStats();
      
      if (result.success) {
        this.view.showStats(result.stats);
        this.view.showMessage('Statistik database berhasil dimuat', 'info');
      } else {
        this.view.showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Error showing stats:', error);
      this.view.showMessage('Terjadi kesalahan saat memuat statistik', 'error');
    } finally {
      this.setButtonLoading('show-stats-btn', false);
    }
  }

  async handleExportData() {
    try {
      this.setButtonLoading('export-data-btn', true);
      
      const result = await this.model.exportData();
      
      if (result.success) {
        this.view.showMessage(result.message, 'success');
      } else {
        this.view.showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      this.view.showMessage('Terjadi kesalahan saat mengekspor data', 'error');
    } finally {
      this.setButtonLoading('export-data-btn', false);
    }
  }

  async handleClearAllData() {
    // Show confirmation dialog with more detailed warning
    const confirmed = confirm(
      '⚠️ PERINGATAN: RESET COMPLETE DATABASE ⚠️\n\n' +
      'Tindakan ini akan:\n' +
      '✗ Menghapus SEMUA data secara permanen\n' +
      '✗ Mengosongkan seluruh database IndexedDB\n' +
      '✗ Menghapus semua cache dan pengaturan\n' +
      '✗ TIDAK DAPAT DIBATALKAN\n\n' +
      'Ketik "RESET" untuk melanjutkan:'
    );

    if (!confirmed) {
      return;
    }

    // Additional confirmation
    const confirmation = prompt(
      'Untuk melanjutkan reset database, ketik "RESET" (huruf besar):'
    );

    if (confirmation !== 'RESET') {
      this.view.showMessage('Reset dibatalkan - konfirmasi tidak sesuai', 'warning');
      return;
    }

    try {
      this.setButtonLoading('clear-all-data-btn', true);
      this.view.hideDisplays();
      
      const result = await this.model.deleteAllOfflineData();
      
      if (result.success) {
        this.view.showMessage('Database berhasil direset secara menyeluruh!', 'success');
        
        // Clear displays after reset
        setTimeout(() => {
          this.view.hideDisplays();
        }, 3000);
      } else {
        this.view.showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Error clearing all data:', error);
      this.view.showMessage('Terjadi kesalahan saat mereset database', 'error');
    } finally {
      this.setButtonLoading('clear-all-data-btn', false);
    }
  }

  setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (button) {
      if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        
        // Save original text and show loading
        if (!button.dataset.originalText) {
          button.dataset.originalText = button.innerHTML;
        }
        
        const icon = button.querySelector('i');
        if (icon) {
          icon.className = 'fa-solid fa-spinner fa-spin';
        }
        
        const text = button.querySelector('span') || button.childNodes[button.childNodes.length - 1];
        if (text && text.textContent) {
          text.textContent = ' Loading...';
        }
      } else {
        button.disabled = false;
        button.classList.remove('loading');
        
        // Restore original text
        if (button.dataset.originalText) {
          button.innerHTML = button.dataset.originalText;
        }
      }
    }
  }

  // Method to refresh data after operations
  async refreshDisplayedData() {
    const dataDisplay = document.getElementById('data-display');
    const statsDisplay = document.getElementById('stats-display');
    
    if (!dataDisplay.classList.contains('hidden')) {
      await this.handleViewOfflineData();
    }
    
    if (!statsDisplay.classList.contains('hidden')) {
      await this.handleShowStats();
    }
  }

  // Utility method to check if database is available
  async checkDatabaseAvailability() {
    try {
      const result = await this.model.getDatabaseStats();
      return result.success;
    } catch (error) {
      console.error('Database not available:', error);
      return false;
    }
  }
}