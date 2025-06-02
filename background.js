// Фоновый скрипт для расширения Calme

// Для хранения просмотренных видео в текущей сессии
let viewedVideosInSession = [];

// Инициализируем хранилище при первой установке
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // Инициализируем пустой массив для сохраненных видео
    chrome.storage.sync.set({ 'savedVideos': [] }, function() {
      console.log('Calme: Хранилище инициализировано');
    });
  }
});

// Функция получения случайного видео
function getRandomVideo(callback) {
  chrome.storage.sync.get('savedVideos', function(data) {
    const savedVideos = data.savedVideos || [];
    
    if (savedVideos.length === 0) {
      callback(null);
      return;
    }
    
    // Если просмотрены все видео или список пуст, сбрасываем
    if (viewedVideosInSession.length >= savedVideos.length) {
      viewedVideosInSession = [];
    }
    
    // Фильтруем видео, исключая те, которые уже просмотрены в этой сессии
    const unwatchedVideos = savedVideos.filter(video => 
      !viewedVideosInSession.includes(video.url)
    );
    
    // Если остались непросмотренные видео
    if (unwatchedVideos.length > 0) {
      // Выбираем случайное видео из непросмотренных
      const randomIndex = Math.floor(Math.random() * unwatchedVideos.length);
      const randomVideo = unwatchedVideos[randomIndex];
      
      // Добавляем URL видео в список просмотренных
      viewedVideosInSession.push(randomVideo.url);
      
      callback(randomVideo);
    } else {
      // Если все просмотрены, сбрасываем и берем любое
      viewedVideosInSession = [];
      const randomIndex = Math.floor(Math.random() * savedVideos.length);
      const randomVideo = savedVideos[randomIndex];
      
      // Добавляем в просмотренные
      viewedVideosInSession.push(randomVideo.url);
      
      callback(randomVideo);
    }
  });
}

// Слушаем сообщения от popup.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "getRandomVideo") {
      getRandomVideo(function(video) {
        try {
          sendResponse({video: video});
        } catch (e) {
          console.error("Error sending response:", e);
          sendResponse({error: e.message});
        }
      });
      return true; // Важно для асинхронного ответа
    }
    return false;
  }
); 