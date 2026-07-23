import dialogs from './data/script.json';

let currentIndex = 0;
const speakerEl = document.getElementById('speaker');
const textEl = document.getElementById('text');
const gameContainer = document.getElementById('game-container');
const spriteEl = document.getElementById('sprite');

function updateUI() {
  const current = dialogs[currentIndex];
  
  // Apply effect
  gameContainer.classList.add('fade');
  spriteEl.classList.add('fade');

  setTimeout(() => {
    speakerEl.textContent = current.speaker;
    textEl.textContent = current.text;
    
    // Update visuals
    gameContainer.style.backgroundImage = `url('/src/assets/${current.bg}')`;
    spriteEl.src = `/src/assets/${current.sprite}`;
    spriteEl.style.display = 'block';

    gameContainer.classList.remove('fade');
    spriteEl.classList.remove('fade');
  }, 200);
}

function nextDialog() {
  currentIndex = (currentIndex + 1) % dialogs.length;
  updateUI();
}

document.addEventListener('click', nextDialog);
document.addEventListener('keydown', (e) => { if (e.code === 'Space') nextDialog(); });

updateUI();
