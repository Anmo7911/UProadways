let player;
const playlistId = 'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG'; // Replace with your YouTube Playlist ID

// 1. Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

// 2. Initialize Player when API is ready
function onYouTubeIframeAPIReady() {
  player = new YT.Player('youtube-player', {
    height: '0',
    width: '0',
    playerVars: {
      listType: 'playlist',
      list: playlistId,
      autoplay: 1,
      controls: 0,
      loop: 1
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
  updateMetadata();
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    document.getElementById('play-btn').innerText = '⏸';
    updateMetadata();
  } else {
    document.getElementById('play-btn').innerText = '▶';
  }
}

// Controls
document.getElementById('play-btn').addEventListener('click', () => {
  if (player.getPlayerState() === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
});

document.getElementById('next-btn').addEventListener('click', () => player.nextVideo());
document.getElementById('prev-btn').addEventListener('click', () => player.previousVideo());

// Horn SFX
const hornAudio = new Audio('horn.mp3');
document.getElementById('horn-btn').addEventListener('click', () => {
  hornAudio.currentTime = 0;
  hornAudio.play();
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    document.getElementById('play-btn').click();
  } else if (e.code === 'KeyN') {
    player.nextVideo();
  } else if (e.code === 'KeyH') {
    hornAudio.play();
  }
});

function updateMetadata() {
  const videoData = player.getVideoData();
  document.getElementById('track-title').innerText = videoData.title;
  document.getElementById('track-artist').innerText = videoData.author;
}
