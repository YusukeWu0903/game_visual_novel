import dialogs from './data/script.json';

let currentIndex = 0;
let prevState = { bg: null, sprites: [] };
let typingTimer = null;
let currentSpeed = 50;

const speakerEl = document.getElementById('speaker');
const textEl = document.getElementById('text');
const gameContainer = document.getElementById('game-container');
const fsBtn = document.getElementById('fs-btn');
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
  const current = dialogs[currentIndex];
  const bgChanged = current.bg !== prevState.bg;
  if (bgChanged) gameContainer.classList.add('fade');
  
  setTimeout(() => {
    speakerEl.textContent = current.speaker;
    typeText(current.text);
    
    if (bgChanged) {
      gameContainer.style.backgroundImage = `url('/assets/images/${current.bg}')`;
      gameContainer.classList.remove('fade');
    }
    
    const spritesChanged = JSON.stringify(current.sprites) !== JSON.stringify(prevState.sprites);
    if (spritesChanged) {
      spriteContainer.innerHTML = '';
      current.sprites.forEach(s => {
        const wrapper = document.createElement('div');
        wrapper.className = `sprite-wrapper`;
        const posMap = { left: '25%', center: '50%', right: '75%' };
        wrapper.style.left = posMap[s.pos] || '50%';
        wrapper.style.transform = 'translateX(-50%)';
        const img = document.createElement('img');
        img.src = `/assets/images/${s.file}`;
        wrapper.appendChild(img);
        spriteContainer.appendChild(wrapper);
      });
    }
    prevState = { bg: current.bg, sprites: current.sprites };
  }, bgChanged ? 200 : 0);
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('speed-btn') || e.target.id === 'fs-btn') return;
  
  if (textEl.textContent.length < dialogs[currentIndex].text.length) {
    clearTimeout(typingTimer);
    textEl.textContent = dialogs[currentIndex].text;
  } else {
    currentIndex = (currentIndex + 1) % dialogs.length;
    updateUI();
  }
});

updateUI();
