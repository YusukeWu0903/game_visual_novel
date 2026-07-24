import dialogs from './data/script.json';

let currentIndex = 0;
let prevState = { bg: null, sprites: [] };
let typingTimer = null;
let currentSpeed = 50;

const speakerEl = document.getElementById('speaker');
const textEl = document.getElementById('text');
const gameContainer = document.getElementById('game-container');
let spriteContainer = document.getElementById('sprite-container');

if (!spriteContainer) {
  spriteContainer = document.createElement('div');
  spriteContainer.id = 'sprite-container';
  gameContainer.prepend(spriteContainer);
}

// Fullscreen toggle logic
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => console.log(err));
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}

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
  if (e.target.classList.contains('speed-btn')) return;
  
  if (textEl.textContent.length < dialogs[currentIndex].text.length) {
    clearTimeout(typingTimer);
    textEl.textContent = dialogs[currentIndex].text;
  } else {
    // Optional: trigger full screen on first click
    if (!document.fullscreenElement) toggleFullScreen();
    currentIndex = (currentIndex + 1) % dialogs.length;
    updateUI();
  }
});

updateUI();
