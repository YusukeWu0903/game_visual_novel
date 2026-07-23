import dialogs from './data/script.json';

let currentIndex = 0;
const speakerEl = document.getElementById('speaker');
const textEl = document.getElementById('text');
const gameContainer = document.getElementById('game-container');
const spriteContainer = document.getElementById('sprite-container') || document.createElement('div');
spriteContainer.id = 'sprite-container';
gameContainer.prepend(spriteContainer);

function updateUI() {
  const current = dialogs[currentIndex];
  gameContainer.classList.add('fade');
  
  setTimeout(() => {
    speakerEl.textContent = current.speaker;
    textEl.textContent = current.text;
    
    gameContainer.style.backgroundImage = `url('/assets/images/${current.bg}')`;
    
    // Clear old sprites
    spriteContainer.innerHTML = '';
    
    // Add new sprites
    current.sprites.forEach(s => {
      const wrapper = document.createElement('div');
      wrapper.className = `sprite-wrapper ${s.pos}`;
      wrapper.style.left = s.pos === 'left' ? '10%' : s.pos === 'right' ? '60%' : '35%';
      
      const img = document.createElement('img');
      img.src = `/assets/images/${s.file}`;
      wrapper.appendChild(img);
      spriteContainer.appendChild(wrapper);
    });

    gameContainer.classList.remove('fade');
  }, 200);
}

document.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % dialogs.length;
  updateUI();
});

updateUI();
