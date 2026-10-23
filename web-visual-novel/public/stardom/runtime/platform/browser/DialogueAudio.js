import { AUDIO_ASSETS } from '../../data/audioData.js';
const clampVolume = (value) => Math.max(0, Math.min(1, value));
/** Plays data-driven audio instructions for one blocking dialogue event. */
export class DialogueAudio {
    constructor(assets = AUDIO_ASSETS, createAudio = () => new Audio(), report = (message) => console.warn(message)) {
        this.createAudio = createAudio;
        this.report = report;
        this.bgm = null;
        this.loopSfx = null;
        this.oneShots = new Set();
        this.ownedAudio = new Set();
        this.fadeTimers = new Set();
        this.assetsById = new Map(assets.map((asset) => [asset.id, asset]));
    }
    /** Call once as a dialogue node is entered, never from render/typing callbacks. */
    enterLine(line) {
        if (line.bgmAudioId !== null)
            this.updateLoopingTrack('bgm', line.bgmAudioId, line.bgmFadeInSeconds, true);
        if (line.loopSfxAudioId !== null)
            this.updateLoopingTrack('loopSfx', line.loopSfxAudioId, line.loopSfxFadeInSeconds, true);
        if (line.sfxAudioId)
            this.playOneShot(line.sfxAudioId, line.sfxFadeInSeconds, line.id);
    }
    /** Stops every sound owned by this event before the dialogue overlay is removed. */
    stopAll() {
        for (const timer of this.fadeTimers)
            globalThis.clearInterval(timer);
        this.fadeTimers.clear();
        for (const audio of this.ownedAudio)
            audio.pause();
        this.ownedAudio.clear();
        this.bgm = null;
        this.loopSfx = null;
        this.oneShots.clear();
    }
    updateLoopingTrack(channel, audioId, fadeInSeconds, isLoop) {
        const current = channel === 'bgm' ? this.bgm : this.loopSfx;
        if (audioId === '0') {
            this.stopTrack(channel);
            return;
        }
        if (current?.id === audioId)
            return;
        const asset = this.getAsset(audioId, channel === 'bgm' ? 'bgm' : 'sfx');
        if (!asset)
            return;
        if (current) {
            if (current.fadeTimer !== null) {
                globalThis.clearInterval(current.fadeTimer);
                this.fadeTimers.delete(current.fadeTimer);
            }
            if (fadeInSeconds > 0)
                this.fade(current, 0, fadeInSeconds);
            else
                current.audio.pause();
        }
        const audio = this.createAudio();
        this.ownedAudio.add(audio);
        audio.src = '/assets/' + asset.assetPath;
        audio.loop = isLoop;
        audio.volume = fadeInSeconds > 0 ? 0 : 1;
        const track = { id: audioId, audio, fadeTimer: null };
        if (channel === 'bgm')
            this.bgm = track;
        else
            this.loopSfx = track;
        void this.startAudio(audio, asset.id, asset.assetLabel, () => this.currentTrack(channel) === track);
        if (fadeInSeconds > 0)
            this.fade(track, 1, fadeInSeconds, channel);
    }
    playOneShot(audioId, fadeInSeconds, dialogueId) {
        const asset = this.getAsset(audioId, 'sfx');
        if (!asset)
            return;
        const audio = this.createAudio();
        this.ownedAudio.add(audio);
        audio.src = '/assets/' + asset.assetPath;
        audio.loop = false;
        audio.volume = fadeInSeconds > 0 ? 0 : 1;
        this.oneShots.add(audio);
        audio.addEventListener('ended', () => {
            this.oneShots.delete(audio);
            this.ownedAudio.delete(audio);
        }, { once: true });
        void this.startAudio(audio, asset.id, `${asset.assetLabel} (${dialogueId})`, () => this.oneShots.has(audio));
        if (fadeInSeconds > 0) {
            const track = { id: audioId, audio, fadeTimer: null };
            this.fade(track, 1, fadeInSeconds);
        }
    }
    getAsset(id, expectedType) {
        const asset = this.assetsById.get(id);
        if (!asset) {
            this.report(`Dialogue audio ${id} is missing from the enabled audio catalog.`);
            return null;
        }
        if (asset.audioType !== expectedType) {
            this.report(`Dialogue audio ${id} has type ${asset.audioType}; expected ${expectedType}.`);
            return null;
        }
        return asset;
    }
    async startAudio(audio, id, label, isActive) {
        try {
            await audio.play();
            if (!isActive()) {
                audio.pause();
                this.ownedAudio.delete(audio);
            }
        }
        catch (error) {
            this.report(`Unable to play dialogue audio ${id} (${label}): ${String(error)}`);
            audio.pause();
            this.ownedAudio.delete(audio);
            this.oneShots.delete(audio);
            for (const channel of ['bgm', 'loopSfx']) {
                const track = this.currentTrack(channel);
                if (track?.audio !== audio)
                    continue;
                if (track.fadeTimer !== null) {
                    globalThis.clearInterval(track.fadeTimer);
                    this.fadeTimers.delete(track.fadeTimer);
                }
                this.setCurrentTrack(channel, null);
            }
        }
    }
    fade(track, target, seconds, channel) {
        const initial = track.audio.volume;
        const startedAt = Date.now();
        const durationMs = seconds * 1000;
        const timer = globalThis.setInterval(() => {
            const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
            track.audio.volume = clampVolume(initial + (target - initial) * progress);
            if (progress >= 1) {
                globalThis.clearInterval(timer);
                this.fadeTimers.delete(timer);
                if (track.fadeTimer === timer)
                    track.fadeTimer = null;
                if (target === 0) {
                    track.audio.pause();
                    this.ownedAudio.delete(track.audio);
                }
                if (channel && target === 0 && this.currentTrack(channel) === track)
                    this.setCurrentTrack(channel, null);
            }
        }, 16);
        this.fadeTimers.add(timer);
        track.fadeTimer = timer;
    }
    stopTrack(channel) {
        const track = this.currentTrack(channel);
        if (!track)
            return;
        if (track.fadeTimer !== null) {
            globalThis.clearInterval(track.fadeTimer);
            this.fadeTimers.delete(track.fadeTimer);
        }
        track.audio.pause();
        this.ownedAudio.delete(track.audio);
        this.setCurrentTrack(channel, null);
    }
    currentTrack(channel) {
        return channel === 'bgm' ? this.bgm : this.loopSfx;
    }
    setCurrentTrack(channel, track) {
        if (channel === 'bgm')
            this.bgm = track;
        else
            this.loopSfx = track;
    }
}
