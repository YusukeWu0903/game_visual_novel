const dialogs = [
  { speaker: "AI 助手", text: "你好！很高興能參與這個視覺小說開發項目。" },
  { speaker: "玩家", text: "我也很期待！我們開始吧？" },
  { speaker: "AI 助手", text: "當然，這是我們的第一個測試場景。" }
];

let currentIndex = 0;
const speakerEl = document.getElementById('speaker');
const textEl = document.getElementById('text');

function updateUI() {
  const current = dialogs[currentIndex];
  speakerEl.textContent = current.speaker;
  textEl.textContent = current.text;
}

function nextDialog() {
  currentIndex = (currentIndex + 1) % dialogs.length;
  updateUI();
}

document.addEventListener('click', nextDialog);
document.addEventListener('keydown', (e) => { if (e.code === 'Space') nextDialog(); });

updateUI();
