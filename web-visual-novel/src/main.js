import dialogs from './data/script.json';

// ===== 狀態管理 =====
let currentIndex = 0;
let prevState = { bg: null, sprites: [], bgm: null };
let typingTimer = null;
let currentSpeed = 50;
let bgmAudio = new Audio();
let sfxAudio = new Audio();
let isTyping = false;

// 自動播放狀態
let autoPlay = false;
let autoPlayTimer = null;
let autoSpeed = 20; // 5-50 對應 0.5x-5x

// 設定值 (從 LocalStorage 載入)
let settings = {
    masterVolume: 0.8,
    bgmVolume: 0.7,
    sfxVolume: 0.8,
    textSpeed: 50,
    autoSpeed: 20,
    autoAdvance: true,
    skipRead: true,
    hideUI: false
};

// 歷史記錄
const history = [];
const MAX_HISTORY = 200;

// 存檔槽位
const SAVE_SLOTS = 10;
const STORAGE_KEY = 'visual_novel_saves';
const SETTINGS_KEY = 'visual_novel_settings';
const PROGRESS_KEY = 'visual_novel_progress';

// 已讀對話 ID 記錄
let readDialogIds = new Set();

// UI 元素引用
const speakerEl = document.getElementById('speaker');
const textEl = document.getElementById('text');
const gameContainer = document.getElementById('game-container');
const fsBtn = document.getElementById('fs-btn');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const loadBtn = document.getElementById('load-btn');
let spriteContainer = document.getElementById('sprite-container');

if (!spriteContainer) {
    spriteContainer = document.createElement('div');
    spriteContainer.id = 'sprite-container';
    gameContainer.prepend(spriteContainer);
}

// Modal 元素
const settingsModal = document.getElementById('settings-modal');
const saveLoadModal = document.getElementById('save-load-modal');
const logModal = document.getElementById('log-modal');
const historyPanel = document.getElementById('history-panel');
const autoIndicator = document.getElementById('auto-indicator');

// ===== 初始化 =====
async function init() {
    loadSettings();
    applySettings();
    // 恢復原始演戲邏輯：每次刷新都從頭開始 (currentIndex = 0)。
    // 刻意不在此處呼叫 updateUI()：若在頁面載入時就播放 BGM，
    // 會因無使用者手勢被瀏覽器自動播放政策拒絕，且 playBgm() 的
    // src 檢查會導致之後「開始新遊戲」時不再重新播放 (完全靜音)。
    // BGM 由「開始新遊戲」按鈕點擊後觸發 (有使用者手勢) 才能正常播。
    setupEventListeners();
}

function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            settings = { ...settings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.warn('Failed to load settings:', e);
    }
}

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
}

function applySettings() {
    currentSpeed = settings.textSpeed;
    autoSpeed = settings.autoSpeed;
    bgmAudio.volume = settings.masterVolume * settings.bgmVolume;
    sfxAudio.volume = settings.masterVolume * settings.sfxVolume;
    
    // 更新 UI
    document.getElementById('master-volume').value = settings.masterVolume * 100;
    document.getElementById('master-volume-value').textContent = `${Math.round(settings.masterVolume * 100)}%`;
    document.getElementById('bgm-volume').value = settings.bgmVolume * 100;
    document.getElementById('bgm-volume-value').textContent = `${Math.round(settings.bgmVolume * 100)}%`;
    document.getElementById('sfx-volume').value = settings.sfxVolume * 100;
    document.getElementById('sfx-volume-value').textContent = `${Math.round(settings.sfxVolume * 100)}%`;
    document.getElementById('auto-speed').value = settings.autoSpeed;
    updateAutoSpeedLabel(settings.autoSpeed);
    document.getElementById('auto-advance').checked = settings.autoAdvance;
    document.getElementById('skip-read').checked = settings.skipRead;
    document.getElementById('hide-ui').checked = settings.hideUI;
    
    // 更新速度按鈕狀態 (快中慢)
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.speed) === settings.textSpeed);
    });
}

function updateAutoSpeedLabel(val) {
    const speed = (val / 10).toFixed(1);
    document.getElementById('auto-speed-value').textContent = `${speed}x`;
}

function loadProgress() {
    try {
        const saved = localStorage.getItem(PROGRESS_KEY);
        if (saved) {
            const progress = JSON.parse(saved);
            currentIndex = Math.min(progress.index || 0, dialogs.length - 1);
            readDialogIds = new Set(progress.readIds || []);
        }
    } catch (e) {
        console.warn('Failed to load progress:', e);
    }
}

function saveProgress() {
    try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify({
            index: currentIndex,
            readIds: Array.from(readDialogIds),
            timestamp: Date.now()
        }));
    } catch (e) {
        console.warn('Failed to save progress:', e);
    }
}

// ===== 事件監聽器 =====
function setupEventListeners() {
    // 全螢幕
    fsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFullscreen();
    });

    document.addEventListener('fullscreenchange', () => {
        fsBtn.textContent = document.fullscreenElement ? '退出全螢幕' : '全螢幕';
    });

    // 速度按鈕
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const speed = parseInt(btn.dataset.speed);
            settings.textSpeed = speed;
            currentSpeed = speed;
            saveSettings();
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // 如果正在打字，重新開始
            if (isTyping && dialogs[currentIndex]) {
                typeText(dialogs[currentIndex].text);
            }
        });
    });

    // 開始按鈕
    startBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        setTimeout(() => {
            startScreen.style.display = 'none';
            updateUI();
        }, 500);
    });

    // 讀取進度按鈕
    loadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openSaveLoadModal('load');
    });

    // 設定按鈕
    document.getElementById('settings-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openSettingsModal();
    });

    document.getElementById('settings-close-btn').addEventListener('click', closeSettingsModal);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettingsModal();
    });

    // 對話紀錄 Log 按鈕
    document.getElementById('log-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openLogModal();
    });

    document.getElementById('log-close-btn').addEventListener('click', closeLogModal);
    logModal.addEventListener('click', (e) => {
        if (e.target === logModal) closeLogModal();
    });

    // 設定滑桿
    setupSettingSlider('master-volume', (val) => {
        settings.masterVolume = val / 100;
        bgmAudio.volume = settings.masterVolume * settings.bgmVolume;
        sfxAudio.volume = settings.masterVolume * settings.sfxVolume;
        saveSettings();
    });
    setupSettingSlider('bgm-volume', (val) => {
        settings.bgmVolume = val / 100;
        bgmAudio.volume = settings.masterVolume * settings.bgmVolume;
        saveSettings();
    });
    setupSettingSlider('sfx-volume', (val) => {
        settings.sfxVolume = val / 100;
        sfxAudio.volume = settings.masterVolume * settings.sfxVolume;
        saveSettings();
    });
    setupSettingSlider('auto-speed', (val) => {
        settings.autoSpeed = val;
        autoSpeed = val;
        saveSettings();
        updateAutoSpeedLabel(val);
    });

    // 設定切換
    document.getElementById('auto-advance').addEventListener('change', (e) => {
        settings.autoAdvance = e.target.checked;
        saveSettings();
    });
    document.getElementById('skip-read').addEventListener('change', (e) => {
        settings.skipRead = e.target.checked;
        saveSettings();
    });
    document.getElementById('hide-ui').addEventListener('change', (e) => {
        settings.hideUI = e.target.checked;
        saveSettings();
    });

    // 存檔/讀檔 Modal
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderSaveSlots(btn.dataset.tab);
        });
    });
    document.getElementById('save-load-close-btn').addEventListener('click', closeSaveLoadModal);
    saveLoadModal.addEventListener('click', (e) => {
        if (e.target === saveLoadModal) closeSaveLoadModal();
    });

    // 歷史面板
    document.getElementById('history-close-btn').addEventListener('click', closeHistoryPanel);
    // 點擊歷史面板外部關閉
    document.addEventListener('click', (e) => {
        if (historyPanel.classList.contains('open') && 
            !historyPanel.contains(e.target) && 
            e.target.id !== 'history-btn') {
            closeHistoryPanel();
        }
    });

    // 鍵盤快捷鍵
    document.addEventListener('keydown', (e) => {
        // ESC 關閉 Modal
        if (e.key === 'Escape') {
            if (settingsModal.classList.contains('open')) closeSettingsModal();
            else if (saveLoadModal.classList.contains('open')) closeSaveLoadModal();
            else if (logModal.classList.contains('open')) closeLogModal();
            else if (historyPanel.classList.contains('open')) closeHistoryPanel();
            else if (autoPlay) toggleAutoPlay();
        }
        // 空白鍵/Enter 推進對話
        if ((e.key === ' ' || e.key === 'Enter') && startScreen.style.display === 'none') {
            e.preventDefault();
            advanceDialog();
        }
        // Ctrl+S 快速存檔
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            quickSave();
        }
        // Ctrl+L 快速讀檔
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            openSaveLoadModal('load');
        }
        // H 開啟歷史
        if (e.key === 'h' && !e.ctrlKey && !e.altKey && startScreen.style.display === 'none') {
            toggleHistoryPanel();
        }
        // A 切換自動播放
        if (e.key === 'a' && !e.ctrlKey && !e.altKey && startScreen.style.display === 'none') {
            toggleAutoPlay();
        }
    });

    // 主點擊事件 - 推進對話
    document.addEventListener('click', (e) => {
        // 忽略 UI 元素點擊
        if (e.target.closest('#controls-area') || 
            e.target.closest('#settings-modal') || 
            e.target.closest('#save-load-modal') ||
            e.target.closest('#log-modal') ||
            e.target.closest('#history-panel') ||
            e.target.closest('#auto-indicator') ||
            startScreen.style.display !== 'none') return;

        // 隱藏 UI 模式
        if (settings.hideUI && !dialogBoxContains(e.target)) {
            toggleUIDisplay();
            return;
        }

        advanceDialog();
    });

    // 觸控支援 - 長按顯示 UI / 滑動歷史
    let touchStartY = 0;
    let touchStartTime = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        const deltaTime = Date.now() - touchStartTime;
        
        // 下滑開啟歷史 (手機上)
        if (deltaY < -50 && deltaTime < 300 && startScreen.style.display === 'none') {
            openHistoryPanel();
        }
        // 長按隱藏/顯示 UI
        if (deltaTime > 500 && Math.abs(deltaY) < 20 && settings.hideUI) {
            toggleUIDisplay();
        }
    }, { passive: true });

    // 滾輪向上開啟歷史
    document.addEventListener('wheel', (e) => {
        if (e.deltaY < 0 && startScreen.style.display === 'none' && !e.ctrlKey) {
            e.preventDefault();
            openHistoryPanel();
        }
    }, { passive: false });
}

function setupSettingSlider(id, callback) {
    const slider = document.getElementById(id);
    let rafId = null;
    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => callback(val));
    });
}

// ===== 對話推進邏輯 =====
function advanceDialog() {
    if (isTyping) {
        // 正在打字時，直接顯示完整文字
        clearTimeout(typingTimer);
        textEl.textContent = dialogs[currentIndex].text;
        textEl.classList.add('complete');
        isTyping = false;
        return;
    }

    // 記錄已讀
    readDialogIds.add(dialogs[currentIndex].id);
    saveProgress();

    // 移到下一條
    currentIndex = (currentIndex + 1) % dialogs.length;
    updateUI();
}

// ===== 打字機效果 =====
function typeText(text) {
    clearTimeout(typingTimer);
    textEl.textContent = '';
    textEl.classList.remove('complete');
    isTyping = true;
    let i = 0;
    
    function nextChar() {
        if (i < text.length) {
            textEl.textContent += text.charAt(i);
            i++;
            typingTimer = setTimeout(nextChar, currentSpeed);
        } else {
            isTyping = false;
            textEl.classList.add('complete');
            // 自動推進邏輯
            if (autoPlay) {
                scheduleAutoAdvance();
            } else if (settings.autoAdvance) {
                // 非自動播放時，延遲一下再提示可點擊
                setTimeout(() => {
                    if (!isTyping) textEl.classList.add('complete');
                }, 300);
            }
        }
    }
    nextChar();
}

// ===== 自動播放 =====
function scheduleAutoAdvance() {
    clearTimeout(autoPlayTimer);
    // 基礎延遲：文字長度 * 速度係數 + 基礎間隔
    const textLen = dialogs[currentIndex].text.length;
    const baseDelay = Math.max(1000, textLen * 30);
    const speedFactor = 50 / autoSpeed; // autoSpeed 5-50 -> 10x-1x
    const delay = baseDelay * speedFactor;
    
    autoPlayTimer = setTimeout(() => {
        if (autoPlay) advanceDialog();
    }, delay);
}

function toggleAutoPlay() {
    autoPlay = !autoPlay;
    autoIndicator.classList.toggle('visible', autoPlay);
    
    if (autoPlay) {
        // 立即執行一次
        if (!isTyping) {
            scheduleAutoAdvance();
        }
    } else {
        clearTimeout(autoPlayTimer);
    }
}

// ===== UI 更新 =====
function updateUI() {
    if (!dialogs || dialogs.length === 0) return;
    const current = dialogs[currentIndex];
    const bgChanged = current.bg !== prevState.bg;
    
    if (bgChanged) gameContainer.classList.add('fade');
    
    setTimeout(() => {
        // 更新背景
        if (bgChanged) {
            gameContainer.style.backgroundImage = current.bg ? `url('/assets/images/${current.bg}')` : 'none';
            gameContainer.classList.remove('fade');
        }
        
        // 更新 BGM
        if (current.bgm) playBgm(current.bgm);
        
        // 更新名字標籤 (顯示於對話框左上角，對話框內不再重複名稱)
        updateSpeakerLabel(current.speaker);
        
        // 打字效果
        typeText(current.text);
        
        // 更新立繪
        updateSprites(current.sprites);
        
        // 記錄歷史
        addToHistory(current);
        
        prevState = { bg: current.bg, sprites: current.sprites, bgm: current.bgm };
    }, bgChanged ? 200 : 0);
}

function updateSpeakerLabel(speaker) {
    // 移除舊標籤
    const oldLabel = document.querySelector('.speaker-label');
    if (oldLabel) oldLabel.remove();
    
    if (!speaker || speaker === '旁白' || speaker === '系統') return;
    
    // 建立新標籤
    const label = document.createElement('div');
    label.className = 'speaker-label';
    label.textContent = speaker;
    label.style.setProperty('--speaker-color', `var(--color-${speaker}, var(--ui-accent))`);
    label.style.background = `linear-gradient(135deg, var(--color-${speaker}, var(--ui-accent)) 0%, color-mix(in srgb, var(--color-${speaker}, var(--ui-accent)) 70%, black) 100%)`;
    label.style.borderColor = `var(--color-${speaker}, var(--ui-accent))`;
    
    // 旁白特殊處理
    if (speaker === '旁白' || speaker === '系統') {
        label.classList.add('narrator');
    }
    
    document.getElementById('dialog-box').appendChild(label);
    
    // 不再在對話框內顯示 speaker 名稱（避免重複）
    speakerEl.textContent = '';
}

function addToHistory(entry) {
    history.unshift({
        id: entry.id,
        speaker: entry.speaker,
        text: entry.text,
        timestamp: Date.now()
    });
    
    // 限制歷史長度
    if (history.length > MAX_HISTORY) history.pop();
    
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = history.map((item, index) => `
        <div class="history-item" style="animation-delay: ${index * 0.03}s; border-left-color: var(--color-${item.speaker}, var(--ui-border-dim))">
            <div class="history-speaker" style="color: var(--color-${item.speaker}, var(--ui-accent))">${item.speaker}</div>
            <div class="history-text">${escapeHtml(item.text)}</div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== 立繪更新 =====
function updateSprites(sprites) {
    spriteContainer.innerHTML = '';
    const posCoords = { 
        off_left: '-20%', 
        left: '25%', 
        center: '50%', 
        right: '75%', 
        off_right: '120%' 
    };
    
    sprites.forEach((s, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = `sprite-wrapper`;
        wrapper.style.zIndex = 10 + index;
        
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
        
        const img = document.createElement('img');
        img.src = `/assets/images/${s.file}`;
        img.alt = s.file;
        img.loading = 'lazy';
        
        if (s.effect) {
            img.className = s.effect;
        }
        
        wrapper.appendChild(img);
        spriteContainer.appendChild(wrapper);
    });
}

// ===== BGM 播放 =====
function playBgm(filename) {
    if (bgmAudio.src.includes(filename)) return;
    bgmAudio.src = `/assets/audio/${filename}`;
    bgmAudio.loop = true;
    bgmAudio.volume = settings.masterVolume * settings.bgmVolume;
    bgmAudio.play().catch(e => console.log("BGM deferred:", e));
}

// ===== 音效播放 =====
function playSfx(filename) {
    sfxAudio.src = `/assets/audio/${filename}`;
    sfxAudio.volume = settings.masterVolume * settings.sfxVolume;
    sfxAudio.play().catch(e => console.log("SFX deferred:", e));
}

// ===== Modal 控制 =====
function openSettingsModal() {
    settingsModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeSettingsModal() {
    settingsModal.classList.remove('open');
    document.body.style.overflow = '';
}

function openSaveLoadModal(mode) {
    saveLoadModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // 切換標籤
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === mode);
    });
    renderSaveSlots(mode);
}

function closeSaveLoadModal() {
    saveLoadModal.classList.remove('open');
    document.body.style.overflow = '';
}

function toggleHistoryPanel() {
    if (historyPanel.classList.contains('open')) {
        closeHistoryPanel();
    } else {
        openHistoryPanel();
    }
}

function openHistoryPanel() {
    historyPanel.classList.add('open');
    renderHistory();
}

function closeHistoryPanel() {
    historyPanel.classList.remove('open');
}

// ===== 對話紀錄 (Log) 置中介面 =====
function openLogModal() {
    renderLog();
    logModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLogModal() {
    logModal.classList.remove('open');
    document.body.style.overflow = '';
}

function renderLog() {
    const body = document.getElementById('log-body');
    if (!history.length) {
        body.innerHTML = '<div class="log-empty">尚無對話紀錄</div>';
        return;
    }
    
    // history 是最新的在陣列最前面 (unshift)，還原為時間正序顯示
    const reversed = [...history].reverse();
    body.innerHTML = reversed.map(item => `
        <div class="log-item">
            <div class="log-item-speaker" style="color: var(--color-${item.speaker}, var(--ui-accent))">${item.speaker}</div>
            <div class="log-item-text">${escapeHtml(item.text)}</div>
        </div>
    `).join('');
    
    // 自動捲動到底部 (最新對話)
    body.scrollTop = body.scrollHeight;
}

// ===== 存檔/讀檔系統 =====
function getSaves() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        return {};
    }
}

function saveToSlot(slot) {
    const saves = getSaves();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 生成縮圖 (16:9)
    const scale = 0.25;
    canvas.width = gameContainer.clientWidth * scale;
    canvas.height = gameContainer.clientHeight * scale;
    ctx.drawImage(
        gameContainer, 
        0, 0, canvas.width, canvas.height
    );
    const thumbnail = canvas.toDataURL('image/webp', 0.7);
    
    saves[slot] = {
        index: currentIndex,
        readIds: Array.from(readDialogIds),
        timestamp: Date.now(),
        thumbnail,
        scene: dialogs[currentIndex]?.text?.substring(0, 60) || '',
        speaker: dialogs[currentIndex]?.speaker || '',
        bg: dialogs[currentIndex]?.bg || ''
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    renderSaveSlots('save');
    closeSaveLoadModal();
    showToast(`存檔至槽位 ${parseInt(slot) + 1} 完成`);
}

function loadFromSlot(slot) {
    const saves = getSaves();
    if (!saves[slot]) return;
    
    const save = saves[slot];
    currentIndex = save.index;
    readDialogIds = new Set(save.readIds);
    saveProgress();
    updateUI();
    closeSaveLoadModal();
    showToast(`讀取槽位 ${parseInt(slot) + 1} 完成`);
}

function deleteSave(slot) {
    const saves = getSaves();
    delete saves[slot];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    renderSaveSlots('save');
}

function renderSaveSlots(mode) {
    const grid = document.getElementById('slots-grid');
    const saves = getSaves();
    const isSave = mode === 'save';
    
    grid.innerHTML = Array.from({ length: SAVE_SLOTS }, (_, i) => {
        const slot = String(i);
        const save = saves[slot];
        const isEmpty = !save;
        
        if (isEmpty) {
            return `
                <div class="save-slot empty" data-slot="${slot}">
                    <div class="empty-slot-text">空槽位 ${i + 1}</div>
                </div>
            `;
        }
        
        const date = new Date(save.timestamp).toLocaleString('zh-TW', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        return `
            <div class="save-slot" data-slot="${slot}">
                <img class="slot-thumbnail" src="${save.thumbnail}" alt="存檔縮圖">
                <div class="slot-info">
                    <div class="slot-title">${save.speaker} - ${save.scene}...</div>
                    <div class="slot-meta">
                        <span>${date}</span>
                        <span>第 ${save.index + 1} / ${dialogs.length} 幕</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // 綁定點擊事件
    grid.querySelectorAll('.save-slot').forEach(slotEl => {
        slotEl.addEventListener('click', (e) => {
            const slot = slotEl.dataset.slot;
            if (isSave) {
                if (e.target.classList.contains('delete-btn')) return;
                saveToSlot(slot);
            } else {
                loadFromSlot(slot);
            }
        });
        
        // 右鍵/長按刪除 (存檔模式)
        if (isSave) {
            slotEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const slot = slotEl.dataset.slot;
                if (saves[slot] && confirm(`確定刪除槽位 ${parseInt(slot) + 1} 的存檔？`)) {
                    deleteSave(slot);
                }
            });
        }
    });
}

function quickSave() {
    // 找第一個空槽或覆蓋最舊
    const saves = getSaves();
    let targetSlot = Object.keys(saves).length < SAVE_SLOTS 
        ? String(Object.keys(saves).length)
        : Object.entries(saves).sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
    
    saveToSlot(targetSlot);
}

// ===== Toast 提示 =====
function showToast(message) {
    // 移除舊的
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: var(--ui-panel);
        border: 2px solid var(--ui-accent);
        color: var(--ui-accent);
        padding: 12px 24px;
        border-radius: 24px;
        font-weight: 600;
        z-index: 2000;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ===== 全螢幕切換 =====
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// ===== UI 顯示切換 =====
function dialogBoxContains(target) {
    return target.closest('#dialog-box') !== null;
}

function toggleUIDisplay() {
    const dialogBox = document.getElementById('dialog-box');
    const controls = document.getElementById('controls-area');
    const spriteContainer = document.getElementById('sprite-container');
    
    const isHidden = dialogBox.style.display === 'none';
    
    dialogBox.style.display = isHidden ? 'flex' : 'none';
    controls.style.display = isHidden ? 'flex' : 'none';
    
    if (isHidden) {
        dialogBox.style.animation = 'dialogEnter 0.3s ease forwards';
    }
}

// ===== 啟動 =====
init();

// 開發工具：暴露給 console
window.__VN_DEV__ = {
    dialogs,
    getCurrentIndex: () => currentIndex,
    jumpTo: (idx) => { currentIndex = Math.max(0, Math.min(idx, dialogs.length - 1)); updateUI(); },
    settings,
    history,
    getSaves,
    autoPlay: () => autoPlay,
    toggleAutoPlay
};