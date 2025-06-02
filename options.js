document.addEventListener('DOMContentLoaded', function() {
  // Элементы интерфейса
  const exportDataBtn = document.getElementById('export-data');
  const importDataBtn = document.getElementById('import-data');
  const importFileInput = document.getElementById('import-file');
  const clearAllBtn = document.getElementById('clear-all');
  const importExportStatus = document.getElementById('import-export-status');
  const dangerStatus = document.getElementById('danger-status');
  
  // Экспорт данных
  exportDataBtn.addEventListener('click', function() {
    chrome.storage.sync.get('savedVideos', function(data) {
      const savedVideos = data.savedVideos || [];
      if (savedVideos.length === 0) {
        showStatus(importExportStatus, 'У вас пока нет сохраненных видео!', 'error');
        return;
      }
      // Создаем объект с экспортируемыми данными
      const exportData = {
        savedVideos: savedVideos,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Преобразуем в JSON и создаем ссылку для скачивания
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Создаем ссылку для скачивания и автоматически кликаем по ней
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `calme_videos_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Освобождаем URL
      URL.revokeObjectURL(url);
      
      // Показываем статус
      showStatus(importExportStatus, 'Данные успешно экспортированы!', 'success');
    });
  });
  
  // Триггер выбора файла для импорта
  importDataBtn.addEventListener('click', function() {
    importFileInput.click();
  });
  
  // Импорт данных
  importFileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Проверяем, что данные имеют нужный формат
        if (!importedData.savedVideos || !Array.isArray(importedData.savedVideos)) {
          throw new Error('Некорректный формат файла');
        }
        
        // Подтверждение импорта
        if (confirm(`Будет импортировано ${importedData.savedVideos.length} видео. Продолжить?`)) {
          // Сначала получаем существующие видео
          chrome.storage.sync.get('savedVideos', function(data) {
            const currentVideos = data.savedVideos || [];
            
            // Фильтруем дубликаты (по URL)
            const existingUrls = new Set(currentVideos.map(v => v.url));
            const newVideos = importedData.savedVideos.filter(v => !existingUrls.has(v.url));
            
            // Объединяем списки
            const combinedVideos = [...currentVideos, ...newVideos];
            
            // Сохраняем в хранилище
            chrome.storage.sync.set({ 'savedVideos': combinedVideos }, function() {
              // Показываем статус
              showStatus(importExportStatus, `Успешно импортировано ${newVideos.length} новых видео!`, 'success');
            });
          });
        }
      } catch (error) {
        showStatus(importExportStatus, `Ошибка импорта: ${error.message}`, 'error');
      }
      
      // Сбрасываем поле выбора файла
      importFileInput.value = '';
    };
    
    reader.onerror = function() {
      showStatus(importExportStatus, 'Ошибка чтения файла', 'error');
      importFileInput.value = '';
    };
    
    reader.readAsText(file);
  });
  
  // Очистка всех данных
  clearAllBtn.addEventListener('click', function() {
    // Запрашиваем подтверждение
    if (confirm('Вы уверены, что хотите удалить ВСЕ сохраненные видео? Это действие нельзя отменить!')) {
      chrome.storage.sync.set({ 'savedVideos': [] }, function() {
        showStatus(dangerStatus, 'Все видео успешно удалены', 'success');
      });
    }
  });
  
  // Функция для отображения статуса
  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status ${type}`;
    element.style.display = 'block';
    
    // Скрываем статус через 5 секунд
    setTimeout(function() {
      element.style.display = 'none';
    }, 5000);
  }
}); 