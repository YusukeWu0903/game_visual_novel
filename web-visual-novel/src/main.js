import dialogs from './data/script.json';

let currentIndex = 0;
let prevState = { bg: null, sprites: [], bgm: null };
let typingTimer = null;
let currentSpeed = 50;
let bgmAudio = new Audio();

const speakerEl = document.getElementById('speaker');
const textEl = document.getElementById('text');
const gameContainer = document.getElementById('game-container');
const fsBtn = document.getElementById('fs-btn');
const startScreen = document.getElementById('start-screen');
let spriteContainer = document.getElementById('sprite-container');

if (!spriteContainer) {
  spriteContainer = document.createElement('div');
  spriteContainer.id = 'sprite-container';
  gameContainer.prepend(spriteContainer);
}

// Fullscreen logic
fsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    fsBtn.textContent = '退出全螢幕';
  } else {
    document.exitFullscreen();
    fsBtn.textContent = '全螢幕';
  }
});

document.addEventListener('fullscreenchange', () => {
  fsBtn.textContent = document.fullscreenElement ? '退出全螢幕' : '全螢幕';
});

// Speed control setup
document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentSpeed = parseInt(btn.dataset.speed);
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function typeText(text) {
  clearTimeout(typingTimer);
  textEl.textContent = '';
  let i = 0;
  function nextChar() {
    if (i < text.length) {
      textEl.textContent += text.charAt(i);
      i++;
      typingTimer = setTimeout(nextChar, currentSpeed);
    }
  }
  nextChar();
}

function updateUI() {
  if (!dialogs || dialogs.length === 0) return;
  const current = dialogs[currentIndex];
  const bgChanged = current.bg !== prevState.bg;
  if (bgChanged) gameContainer.classList.add('fade');
  
  setTimeout(() => {
    speakerEl.textContent = current.speaker;
    typeText(current.text);
    
    // Play BGM
    if (current.bgm) playBgm(current.bgm);
    
    if (bgChanged) {
      gameContainer.style.backgroundImage = current.bg ? `url('/assets/images/${current.bg}')` : 'none';
      gameContainer.classList.remove('fade');
    }
    
    spriteContainer.innerHTML = '';
    const posCoords = { off_left: '-20%', left: '25%', center: '50%', right: '75%', off_right: '120%' };
    
    current.sprites.forEach(s => {
      // 1. Create wrapper for positioning (Responsibility: Positioning)
      const wrapper = document.createElement('div');
      wrapper.className = `sprite-wrapper`;
      
      if (s.move) {
          const [start, end] = s.move.split('->');
          wrapper.style.left = posCoords[start] || '50%';
          wrapper.style.transform = 'translateX(-50%)';
          
          requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                  wrapper.style.transition = 'all 0.8s ease-out';
                  wrapper.style.left = posCoords[end] || '50%';
              });
          });
      } else {
          wrapper.style.left = posCoords[s.pos] || '50%';
          wrapper.style.transform = 'translateX(-50%)';
      }
      
      // 2. Create img for effects (Responsibility: Acting)
      const img = document.createElement('img');
      img.src = `/assets/images/${s.file}`;
      if (s.effect) img.className = s.effect; // Effect applied to img, NOT wrapper
      
      wrapper.appendChild(img);
      spriteContainer.appendChild(wrapper);
    });
    
    prevState = { bg: current.bg, sprites: current.sprites, bgm: current.bgm };
  }, bgChanged ? 200 : 0);
}

function playBgm(filename) {
  if (bgmAudio.src.includes(filename)) return;
  bgmAudio.src = `/assets/audio/${filename}`;
  bgmAudio.loop = true;
  bgmAudio.play().catch(e => console.log("BGM deferred"));
}

document.getElementById('start-btn').addEventListener('click', () => {
  startScreen.style.opacity = '0';
  setTimeout(() => {
    startScreen.style.display = 'none';
    updateUI();
  }, 500);
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('speed-btn') || e.target.id === 'fs-btn' || startScreen.style.display !== 'none') return;
  
  if (textEl.textContent.length < dialogs[currentIndex].text.length) {
    clearTimeout(typingTimer);
    textEl.textContent = dialogs[currentIndex].text;
  } else {
    currentIndex = (currentIndex + 1) % dialogs.length;
    updateUI();
  }
});
