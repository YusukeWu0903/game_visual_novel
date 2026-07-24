import dialogs from './data/script.json';

let currentIndex = 0;
let prevState = { bg: null, sprites: [] };

const speakerEl = document.getElementById('speaker');
const textEl = document.getElementById('text');
const gameContainer = document.getElementById('game-container');
let spriteContainer = document.getElementById('sprite-container');

if (!spriteContainer) {
  spriteContainer = document.createElement('div');
  spriteContainer.id = 'sprite-container';
  gameContainer.prepend(spriteContainer);
}

function applyEffect(element, effect) {
  if (effect === 'none') return;
  element.classList.add(effect);
  setTimeout(() => element.classList.remove(effect), 500);
}

function updateUI() {
  const current = dialogs[currentIndex];
  
  // 1. Update Text (No transition)
  speakerEl.textContent = current.speaker;
  textEl.textContent = current.text;
  
  // 2. Update Background (Only if changed)
  if (current.bg !== prevState.bg) {
    gameContainer.style.backgroundImage = `url('/assets/images/${current.bg}')`;
    if (current.bgEffect !== 'none') applyEffect(gameContainer, current.bgEffect || 'fade');
  }
  
  // 3. Update Sprites (Only if changed)
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
      
      if (s.effect !== 'none') applyEffect(wrapper, s.effect || 'fade');
    });
  }
  
  prevState = { bg: current.bg, sprites: current.sprites };
}

document.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % dialogs.length;
  updateUI();
});

updateUI();
