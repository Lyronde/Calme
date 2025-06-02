// Управление табами
document.addEventListener('DOMContentLoaded', function() {
  // Получаем элементы табов
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Переключение между табами
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Удаляем активный класс со всех кнопок и панелей
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Добавляем активный класс нажатой кнопке и соответствующей панели
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // SOS кнопка
  const sosButton = document.getElementById('sos-button');
  sosButton.addEventListener('click', openRandomVideo);
  
  // Форма добавления видео
  const addVideoButton = document.getElementById('add-video');
  addVideoButton.addEventListener('click', addVideo);
  
  // Загрузка сохраненных видео
  loadSavedVideos();
});

// Функция для открытия случайного видео
function openRandomVideo() {
  // Напрямую используем функцию из background.js через хранилище
  chrome.storage.sync.get('savedVideos', function(data) {
    const savedVideos = data.savedVideos || [];
    
    if (savedVideos.length === 0) {
      alert('У вас пока нет сохраненных видео! Сначала добавьте видео во вкладке "Мои видео".');
      return;
    }
    
    // Отправляем сообщение в background для получения случайного видео
    chrome.runtime.sendMessage({action: "getRandomVideo"}, function(response) {
      // Проверяем наличие ответа и видео в нем
      if (response && response.video && response.video.url) {
        // Открываем видео в новой вкладке
        chrome.tabs.create({ url: response.video.url });
      } else {
        alert('Не удалось получить случайное видео. Попробуйте снова.');
      }
    });
  });
}

// Функция для добавления нового видео
function addVideo() {
  const urlInput = document.getElementById('video-url');
  const titleInput = document.getElementById('video-title');
  
  const url = urlInput.value.trim();
  const title = titleInput.value.trim() || extractVideoTitle(url);
  
  if (!url) {
    alert('Пожалуйста, введите URL видео');
    return;
  }
  
  if (!isValidUrl(url)) {
    alert('Пожалуйста, введите корректный URL');
    return;
  }
  
  // Получаем текущие сохраненные видео
  chrome.storage.sync.get('savedVideos', function(data) {
    const savedVideos = data.savedVideos || [];
    
    // Добавляем новое видео
    savedVideos.push({
      url: url,
      title: title,
      addedAt: new Date().toISOString()
    });
    
    // Сохраняем обновленный список
    chrome.storage.sync.set({ 'savedVideos': savedVideos }, function() {
      // Очищаем поля ввода
      urlInput.value = '';
      titleInput.value = '';
      
      // Обновляем отображение списка
      loadSavedVideos();
    });
  });
}

// Функция для загрузки сохраненных видео
function loadSavedVideos() {
  const videoList = document.getElementById('saved-videos');
  
  chrome.storage.sync.get('savedVideos', function(data) {
    const savedVideos = data.savedVideos || [];
    
    // Очищаем текущий список
    videoList.innerHTML = '';
    
    // Если нет видео, показываем сообщение
    if (savedVideos.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.textContent = 'У вас пока нет сохраненных видео';
      emptyMessage.style.padding = '10px';
      emptyMessage.style.color = '#777';
      videoList.appendChild(emptyMessage);
      return;
    }
    
    // Добавляем каждое видео в список
    savedVideos.forEach((video, index) => {
      const videoItem = document.createElement('li');
      videoItem.className = 'video-item';
      
      const videoLink = document.createElement('a');
      videoLink.className = 'video-title';
      videoLink.textContent = video.title;
      videoLink.href = video.url;
      videoLink.target = '_blank'; // Открывать в новой вкладке
      videoLink.title = video.url; // Показываем URL при наведении
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-video';
      deleteButton.textContent = '×';
      deleteButton.title = 'Удалить видео';
      deleteButton.addEventListener('click', (e) => {
        e.preventDefault(); // Предотвращаем переход по ссылке при нажатии на кнопку удаления
        deleteVideo(index);
      });
      
      videoItem.appendChild(videoLink);
      videoItem.appendChild(deleteButton);
      videoList.appendChild(videoItem);
    });
  });
}

// Функция для удаления видео
function deleteVideo(index) {
  chrome.storage.sync.get('savedVideos', function(data) {
    const savedVideos = data.savedVideos || [];
    
    // Удаляем видео по индексу
    savedVideos.splice(index, 1);
    
    // Сохраняем обновленный список
    chrome.storage.sync.set({ 'savedVideos': savedVideos }, function() {
      // Обновляем отображение списка
      loadSavedVideos();
    });
  });
}

// Вспомогательная функция для проверки корректности URL
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

// Вспомогательная функция для извлечения заголовка из URL
function extractVideoTitle(url) {
  try {
    const urlObj = new URL(url);
    
    // Для YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.searchParams.get('v') || urlObj.pathname.slice(1);
      return `YouTube видео (${videoId})`;
    }
    
    // Для других сайтов
    return `Видео с ${urlObj.hostname}`;
  } catch (error) {
    return 'Неизвестное видео';
  }
} 