import { t as tr } from '../core/localization.js';
import { CHARACTER_DATA } from '../data/charactersData.js';
import { MaruIdleMotion } from './MaruIdleMotion.js';
import { GRAPHIC_ID } from '../core/GraphicIds.js';
import { LayeredPortraitMotion } from '../platform/browser/LayeredPortraitMotion.js';
import { DialogueFlowSession } from '../core/DialogueFlowSession.js';
import { getGraphicAssetUrl } from '../platform/browser/GraphicUrls.js';
import { browserAnimationClock } from '../platform/browser/BrowserAnimationClock.js';
import { resolvePortraitPresentation, updateReverseParallaxOffset } from '../core/DialogueStage.js';
import { applyPortraitGeometry } from '../platform/browser/PortraitGeometry.js';
import { SCENE_DATA } from '../data/scenesData.js';
import { fitDialogueScene } from '../platform/browser/GameViewport.js';
import { browserGraphicAssets } from '../platform/browser/BrowserGraphicAssets.js';
import { nextCgGraphicId, restoreCgBeforeLine } from '../core/DialogueVisualState.js';
import { characterWithAppearance, loadAppearanceProfile } from '../platform/browser/CharacterAppearance.js';
import { CHARACTER_EXPRESSIONS } from '../data/portraitExpressionsData.js';
import { dialogueExpressionTarget, resolvePortraitExpression } from '../core/PortraitExpressions.js';
import { DialogueTranscript, dialogueTypingDelay } from '../core/DialogueReading.js';
import { DialogueTools } from './DialogueTools.js';
import { prepareColorText, renderColorText } from './ColorText.js';
const esc = (value) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const TRANSITION_MS = 800;
const sleep = (ms) => new Promise((resolve) => browserAnimationClock.setTimeout(resolve, ms));
const characters = new Map(CHARACTER_DATA.map((character) => [character.id, character]));
export class EventDialoguePlayback {
    constructor(modalRoot, ctrl, audio, projectPortrait = null) {
        this.modalRoot = modalRoot;
        this.ctrl = ctrl;
        this.audio = audio;
        this.projectPortrait = projectPortrait;
        this.speedPercent = 100;
    }
    play(event, date, lines, options = [], rewards = [], initialBackgroundSceneId = null, preview = {}) {
        return new Promise((resolve) => {
            const category = event.category === 'main' ? tr("String0223") : event.category === 'affinity' ? tr("String0224") : tr("String0225");
            const overlay = document.createElement('div');
            overlay.className = 'overlay event-dialogue-overlay';
            overlay.innerHTML = '<section class="event-dialogue-scene" role="dialog" aria-modal="true">'
                + '<header class="event-dialogue-head"><strong class="event-dialogue-category"></strong><time class="event-dialogue-date"></time></header>'
                + '<div class="event-dialogue-background-layer" aria-hidden="true"><div class="event-dialogue-background-image"></div><div class="event-dialogue-background-image"></div></div>'
                + '<div class="event-dialogue-portrait-layer"></div>'
                + '<div class="event-dialogue-cg-layer" hidden aria-hidden="true"></div>'
                + '<div class="event-dialogue-choices" hidden></div>'
                + '<section class="event-dialogue-narration" aria-live="polite" hidden></section>'
                + '<section class="event-dialogue-box" aria-live="polite">'
                + '<div class="event-dialogue-speaker"></div><p class="event-dialogue-text"></p>'
                + '<footer><span class="event-dialogue-progress"' + (preview.showLineNumbers ? '' : ' hidden') + '></span><button type="button" class="event-dialogue-next" hidden aria-label="' + esc(tr("String0220")) + '"><span aria-hidden="true">▼</span></button></footer>'
                + '</section></section>';
            if (preview.phoneCallName) {
                overlay.classList.add('is-phone-call');
                const controls = document.createElement('div');
                controls.className = 'phone-call-controls';
                const name = document.createElement('strong');
                name.textContent = preview.phoneCallName + ' · ' + tr('String21021');
                const hangup = document.createElement('button');
                hangup.type = 'button';
                hangup.className = 'phone-hangup';
                hangup.textContent = tr('String21013');
                hangup.addEventListener('click', () => { void finish(true, true); });
                controls.append(name, hangup);
                overlay.querySelector('.event-dialogue-scene').appendChild(controls);
            }
            overlay.querySelector('.event-dialogue-category').textContent = category;
            overlay.querySelector('.event-dialogue-date').textContent = date;
            overlay.querySelector('.event-dialogue-scene').setAttribute('aria-label', category + ' ' + date);
            const portraitLayer = overlay.querySelector('.event-dialogue-portrait-layer');
            const cgLayer = overlay.querySelector('.event-dialogue-cg-layer');
            const backgroundLayers = [...overlay.querySelectorAll('.event-dialogue-background-image')];
            const speakerEl = overlay.querySelector('.event-dialogue-speaker');
            const textEl = overlay.querySelector('.event-dialogue-text');
            const progressEl = overlay.querySelector('.event-dialogue-progress');
            const nextButton = overlay.querySelector('.event-dialogue-next');
            const choicesEl = overlay.querySelector('.event-dialogue-choices');
            const dialogueBox = overlay.querySelector('.event-dialogue-box');
            const narrationPanel = overlay.querySelector('.event-dialogue-narration');
            const dialogueFooter = dialogueBox.querySelector('footer');
            const session = new DialogueFlowSession(event.id, lines, options, rewards, this.ctrl, preview);
            const rewardsById = new Map(rewards.map((reward) => [reward.id, reward]));
            const portraitHosts = new Map();
            let activeCgId = null;
            const initialCgId = restoreCgBeforeLine(lines, options, session.currentDialogueId, id => this.ctrl.getDialogueChoice(id));
            let portraitSettings = {};
            let standingLineOverride = null;
            const layoutActor = (id, actor) => {
                if (actor.exiting)
                    return;
                const character = characters.get(id);
                const stage = { ...portraitSettings, standingLineYPercent: standingLineOverride ?? portraitSettings.standingLineYPercent };
                const projected = this.projectPortrait?.(actor.presentation, character, stage, backgroundSceneId)
                    ?? { presentation: actor.presentation, character, stage };
                applyPortraitGeometry(actor.element, projected.presentation, projected.character, projected.stage, portraitLayer.clientWidth, portraitLayer.clientHeight);
            };
            let stopSceneSizing = () => { };
            let activeBackgroundLayer = 0;
            let backgroundSceneId = null;
            let backgroundOffsetPx = 0;
            let typing = false;
            let busy = false;
            let finished = false;
            let deferPortraitReveal = false;
            let hasPresentedLine = false;
            let timer = 0;
            let revealedText = null;
            let glyphIndex = 0;
            let resumeTyping = () => { };
            const transcript = new DialogueTranscript();
            const tools = new DialogueTools(overlay, transcript, lines, options, {
                pause: () => browserAnimationClock.clearTimeout(timer),
                resume: () => { if (typing && !finished)
                    resumeTyping(); },
                blocked: () => finished || (busy && choicesEl.hidden),
                speed: () => this.speedPercent,
                setSpeed: speed => {
                    if (![50, 100, 150].includes(speed))
                        return;
                    this.speedPercent = speed;
                    if (typing && !tools.paused) {
                        browserAnimationClock.clearTimeout(timer);
                        resumeTyping();
                    }
                },
            });
            const failPlayback = (error) => {
                console.error(`Dialogue playback failed for ${event.id}; ending this event after cleanup.`, error);
                void finish(true, true);
            };
            const animatePortraitOut = async (characterId) => {
                const actor = portraitHosts.get(characterId);
                if (!actor)
                    return;
                // Retain the current rendered geometry even if a position tween is in flight.
                const bounds = actor.element.getBoundingClientRect();
                const layerBounds = portraitLayer.getBoundingClientRect();
                const scale = layerBounds.width / portraitLayer.clientWidth || 1;
                const geometry = {
                    left: (bounds.left - layerBounds.left) / scale + 'px',
                    top: (bounds.top - layerBounds.top) / scale + 'px',
                    width: bounds.width / scale + 'px',
                    height: bounds.height / scale + 'px',
                };
                actor.exiting = true;
                actor.element.style.transitionProperty = 'opacity';
                Object.assign(actor.element.style, geometry);
                actor.element.classList.remove('is-visible');
                await sleep(TRANSITION_MS);
                actor.motion?.dispose();
                actor.element.remove();
                portraitHosts.delete(characterId);
            };
            const showBackground = (sceneId) => {
                if (sceneId === null || sceneId === backgroundSceneId)
                    return;
                const nextLayerIndex = 1 - activeBackgroundLayer;
                const nextLayer = backgroundLayers[nextLayerIndex];
                const graphicId = sceneId === '0' ? null : SCENE_DATA.find((scene) => scene.id === sceneId)?.backgroundGraphicId ?? null;
                const nextUrl = graphicId ? getGraphicAssetUrl(graphicId) : null;
                if (sceneId !== '0' && !nextUrl) {
                    console.warn(`Dialogue background scene ${sceneId} is not available.`);
                    return;
                }
                nextLayer.style.backgroundImage = nextUrl ? `url("${nextUrl}")` : 'none';
                backgroundOffsetPx = 0;
                nextLayer.style.transform = 'translate3d(0, 0, 0) scale(1.06)';
                nextLayer.classList.add('is-visible');
                backgroundLayers[activeBackgroundLayer].classList.remove('is-visible');
                activeBackgroundLayer = nextLayerIndex;
                backgroundSceneId = sceneId;
                portraitSettings = SCENE_DATA.find(scene => scene.id === sceneId) ?? {};
                standingLineOverride = null;
                for (const [id, actor] of portraitHosts)
                    layoutActor(id, actor);
            };
            const setBackgroundParallax = (deltaXPercent, ratioPercent) => {
                if (!deltaXPercent || !ratioPercent)
                    return;
                const width = overlay.querySelector('.event-dialogue-scene').clientWidth;
                backgroundOffsetPx = updateReverseParallaxOffset(backgroundOffsetPx, deltaXPercent, width, ratioPercent);
                for (const layer of backgroundLayers)
                    layer.style.transform = `translate3d(${backgroundOffsetPx}px, 0, 0) scale(1.06)`;
            };
            const syncSpeakerFocus = (speakerId) => {
                for (const [id, actor] of portraitHosts)
                    actor.element.classList.toggle('is-speaking', id === speakerId);
            };
            const showCg = async (instruction) => {
                const next = nextCgGraphicId(activeCgId, instruction);
                if (next === activeCgId)
                    return;
                if (next) {
                    const image = await browserGraphicAssets.load(next);
                    if (finished)
                        return;
                    if (!image)
                        throw new Error('CG image unavailable: ' + next);
                    if (activeCgId) {
                        cgLayer.classList.remove('is-visible');
                        await sleep(TRANSITION_MS);
                        if (finished)
                            return;
                    }
                    else if (!deferPortraitReveal && !overlay.classList.contains('is-narration')) {
                        portraitLayer.style.transition = 'opacity .8s ease-in-out';
                        portraitLayer.style.opacity = '0';
                        await sleep(TRANSITION_MS);
                        if (finished)
                            return;
                    }
                    cgLayer.style.backgroundImage = `url("${image.src}")`;
                    cgLayer.hidden = false;
                    overlay.classList.add('is-cg');
                    portraitLayer.style.removeProperty('transition');
                    if (!deferPortraitReveal)
                        portraitLayer.style.removeProperty('opacity');
                    void cgLayer.offsetWidth;
                    cgLayer.classList.add('is-visible');
                    activeCgId = next;
                    await sleep(TRANSITION_MS);
                }
                else {
                    cgLayer.classList.remove('is-visible');
                    await sleep(TRANSITION_MS);
                    if (finished)
                        return;
                    cgLayer.hidden = true;
                    cgLayer.style.backgroundImage = '';
                    const revealActors = !deferPortraitReveal && !overlay.classList.contains('is-narration');
                    if (revealActors)
                        portraitLayer.style.opacity = '0';
                    overlay.classList.remove('is-cg');
                    activeCgId = null;
                    if (revealActors) {
                        portraitLayer.style.transition = 'opacity .8s ease-in-out';
                        void portraitLayer.offsetWidth;
                        portraitLayer.style.opacity = '1';
                        await sleep(TRANSITION_MS);
                        if (finished)
                            return;
                        portraitLayer.style.removeProperty('transition');
                        portraitLayer.style.removeProperty('opacity');
                    }
                }
            };
            const showPortrait = async (line) => {
                const applyExpression = async () => {
                    const target = dialogueExpressionTarget(line);
                    if (!target)
                        return;
                    const actor = portraitHosts.get(target);
                    if (!actor || actor.exiting || !(actor.motion instanceof MaruIdleMotion))
                        return;
                    const binding = resolvePortraitExpression(target, actor.element.dataset.motionManifestGraphicId, line.portraitExpression, CHARACTER_EXPRESSIONS);
                    const applied = await actor.motion.setExpressionGraphic(binding?.sourceGraphicId ?? null);
                    if (finished)
                        return;
                    actor.element.dataset.expressionCode = applied && binding ? String(binding.expressionCode) : '0';
                    const fallback = actor.element.querySelector('.dialogue-portrait-fallback');
                    if (fallback)
                        fallback.src = (applied && binding ? getGraphicAssetUrl(binding.fallbackGraphicId) : actor.element.dataset.neutralPortraitUrl) ?? '';
                };
                const actorId = line.portraitCharacterId;
                const command = line.portraitCommand ?? 'auto';
                const shouldHide = command === 'hide' || (command === 'auto' && (line.movement === 'exit-left' || line.movement === 'exit-right'));
                if (shouldHide) {
                    if (actorId)
                        await animatePortraitOut(actorId);
                    syncSpeakerFocus(line.characterId);
                    return;
                }
                if (command === 'keep' || (!actorId && command === 'auto')) {
                    await applyExpression();
                    syncSpeakerFocus(line.characterId);
                    return;
                }
                if (!actorId)
                    return;
                const character = characterWithAppearance(this.ctrl, actorId);
                if (!character?.portraitGraphicId) {
                    console.warn(`Dialogue portrait ${actorId} has no enabled graphic; the line will continue without a portrait.`);
                    return;
                }
                const presentation = resolvePortraitPresentation(line, character);
                const oldActor = portraitHosts.get(actorId);
                const oldX = oldActor ? Number.parseFloat(oldActor.element.dataset.xPercent ?? String(presentation.xPercent)) : presentation.xPercent;
                setBackgroundParallax(presentation.xPercent - oldX, line.backgroundParallaxPercent ?? 8);
                let actor = oldActor;
                if (!actor) {
                    const host = document.createElement('div');
                    host.className = 'event-dialogue-portrait is-entering';
                    const fallback = document.createElement('img');
                    fallback.className = 'dialogue-portrait-fallback';
                    const appearance = this.ctrl.getCharacterAppearance(actorId);
                    host.dataset.appearanceId = appearance?.id ?? '';
                    const portraitUrl = getGraphicAssetUrl(appearance?.portraitGraphicId ?? (character.motionProfileId === 'maru-idle-v4' ? GRAPHIC_ID.maruStaticPortrait : character.portraitGraphicId));
                    if (!portraitUrl)
                        return;
                    fallback.src = portraitUrl;
                    host.dataset.neutralPortraitUrl = portraitUrl;
                    host.dataset.motionManifestGraphicId = character.motionManifestGraphicId ?? '';
                    fallback.alt = '';
                    if (character.motionProfileId !== 'layered-idle-v1')
                        host.appendChild(fallback);
                    portraitLayer.appendChild(host);
                    actor = { element: host, motion: null, presentation };
                    portraitHosts.set(actorId, actor);
                    if (character.motionProfileId === 'maru-idle-v4')
                        actor.motion = new MaruIdleMotion(host, true, undefined, undefined, undefined, () => loadAppearanceProfile(character.motionManifestGraphicId));
                    if (character.motionProfileId === 'layered-idle-v1' && character.motionManifestGraphicId) {
                        const motion = new LayeredPortraitMotion(host, character.motionManifestGraphicId);
                        actor.motion = motion;
                        if (!await motion.ready || finished) {
                            motion.dispose();
                            host.remove();
                            portraitHosts.delete(actorId);
                            return;
                        }
                    }
                }
                await applyExpression();
                const host = actor.element;
                host.dataset.xPercent = String(presentation.xPercent);
                actor.presentation = presentation;
                layoutActor(actorId, actor);
                if (!oldActor) {
                    // Commit final geometry before enabling transitions. Entrance changes only alpha.
                    void host.offsetWidth;
                    browserAnimationClock.requestFrame(() => browserAnimationClock.requestFrame(() => {
                        if (!deferPortraitReveal && !finished && portraitHosts.get(actorId)?.element === host) {
                            host.classList.remove('is-entering');
                            host.classList.add('is-visible');
                        }
                    }));
                }
                syncSpeakerFocus(line.characterId);
            };
            const startTyping = async () => {
                busy = true;
                nextButton.hidden = true;
                const line = session.enterCurrentLine();
                overlay.dataset.dialogueId = line?.id ?? '';
                if (!line) {
                    busy = false;
                    await finish();
                    return;
                }
                const narration = line.presentationType === 1;
                const cgInstruction = line.cgGraphicId ?? (!hasPresentedLine ? initialCgId : null);
                const stagedReturn = overlay.classList.contains('is-narration') && !narration;
                const stagedNarration = hasPresentedLine && !overlay.classList.contains('is-narration') && narration;
                hasPresentedLine = true;
                if (stagedNarration) {
                    overlay.dataset.transitionPhase = 'box-out';
                    dialogueBox.style.opacity = '0';
                    await sleep(450);
                    if (finished)
                        return;
                    dialogueBox.hidden = true;
                    overlay.dataset.transitionPhase = 'actors-out';
                    for (const actor of [...portraitHosts.values()].reverse()) {
                        if (actor.exiting)
                            continue;
                        actor.element.classList.remove('is-visible');
                        await sleep(TRANSITION_MS);
                        if (finished)
                            return;
                    }
                    overlay.dataset.transitionPhase = 'black-in';
                    narrationPanel.style.opacity = '0';
                    narrationPanel.hidden = false;
                    void narrationPanel.offsetWidth;
                    narrationPanel.style.opacity = '1';
                    await sleep(800);
                    if (finished)
                        return;
                    narrationPanel.style.removeProperty('opacity');
                    dialogueBox.style.removeProperty('opacity');
                    delete overlay.dataset.transitionPhase;
                }
                if (stagedReturn) {
                    overlay.dataset.transitionPhase = 'narration-out';
                    overlay.classList.add('is-narration-fading');
                    await sleep(600);
                    if (finished)
                        return;
                    deferPortraitReveal = true;
                    portraitLayer.style.opacity = '0';
                    dialogueBox.style.opacity = '0';
                    for (const actor of portraitHosts.values())
                        actor.element.classList.remove('is-visible');
                }
                overlay.classList.toggle('is-narration', narration);
                dialogueBox.hidden = narration || stagedReturn;
                narrationPanel.hidden = !narration && !stagedReturn;
                textEl.classList.toggle('event-dialogue-narration-text', narration);
                (narration ? narrationPanel : dialogueBox).append(textEl, dialogueFooter);
                const actorId = line.portraitCharacterId;
                const leaving = line.portraitCommand === 'hide' || ((line.portraitCommand ?? 'auto') === 'auto' && ['exit-left', 'exit-right'].includes(line.movement));
                // A background clear/switch must not resize the actor that is about to fade out.
                if (leaving && actorId) {
                    const actor = portraitHosts.get(actorId);
                    if (actor)
                        actor.exiting = true;
                }
                showBackground(line.backgroundSceneId);
                if (line.standingLineYPercent != null)
                    standingLineOverride = line.standingLineYPercent;
                for (const [id, actor] of portraitHosts)
                    layoutActor(id, actor);
                this.audio.enterLine(line);
                await showCg(cgInstruction);
                if (finished)
                    return;
                await showPortrait(line);
                if (finished)
                    return;
                if (stagedReturn) {
                    overlay.dataset.transitionPhase = 'scene-in';
                    overlay.classList.add('is-revealing-dialogue-scene');
                    await sleep(1000);
                    if (finished)
                        return;
                    narrationPanel.hidden = true;
                    overlay.classList.remove('is-narration-fading', 'is-revealing-dialogue-scene');
                    portraitLayer.style.opacity = '1';
                    overlay.dataset.transitionPhase = 'actors-in';
                    for (const actor of portraitHosts.values()) {
                        if (actor.exiting)
                            continue;
                        actor.element.classList.remove('is-entering');
                        actor.element.classList.add('is-visible');
                        await sleep(TRANSITION_MS);
                        if (finished)
                            return;
                    }
                    deferPortraitReveal = false;
                    portraitLayer.style.removeProperty('opacity');
                }
                const speaker = line.characterId ? characters.get(line.characterId) : null;
                speakerEl.textContent = speaker?.name ?? '';
                speakerEl.hidden = !speaker;
                glyphIndex = 0;
                revealedText = prepareColorText(textEl, line.text);
                if (stagedReturn) {
                    overlay.dataset.transitionPhase = 'box-in';
                    dialogueBox.hidden = false;
                    void dialogueBox.offsetWidth;
                    dialogueBox.style.opacity = '1';
                    await sleep(450);
                    if (finished)
                        return;
                    dialogueBox.style.removeProperty('opacity');
                    delete overlay.dataset.transitionPhase;
                }
                typing = true;
                busy = false;
                if (preview.showLineNumbers)
                    progressEl.textContent = (line.lineOrder) + ' / ' + lines.length;
                const writeNext = () => {
                    if (finished || !typing || tools.paused)
                        return;
                    if (!revealedText || glyphIndex >= revealedText.length) {
                        typing = false;
                        nextButton.hidden = false;
                        transcript.line(line.id);
                        return;
                    }
                    revealedText.reveal(++glyphIndex);
                    timer = browserAnimationClock.setTimeout(writeNext, dialogueTypingDelay(line.presentationType, this.speedPercent));
                };
                resumeTyping = writeNext;
                writeNext();
            };
            const finish = async (force = false, aborted = false) => {
                if (finished || (busy && !force))
                    return;
                finished = true;
                typing = false;
                nextButton.hidden = true;
                browserAnimationClock.clearTimeout(timer);
                busy = true;
                window.removeEventListener('keydown', onKeyDown);
                await Promise.all([...portraitHosts.keys()].map((actorId) => animatePortraitOut(actorId)));
                this.audio.stopAll();
                let completed = !aborted;
                try {
                    if (!aborted)
                        session.finish();
                }
                catch (error) {
                    completed = false;
                    console.error(`Unable to finalize dialogue event ${event.id}.`, error);
                }
                finally {
                    stopSceneSizing();
                    for (const actor of portraitHosts.values())
                        actor.motion?.dispose();
                    portraitHosts.clear();
                    this.audio.stopAll();
                    tools.dispose();
                    overlay.remove();
                    try {
                        preview.onPhoneCallEnd?.(completed);
                    }
                    finally {
                        resolve();
                    }
                }
            };
            const onKeyDown = (eventKey) => {
                if (eventKey.key === 'Escape' && tools.escape()) {
                    eventKey.preventDefault();
                    return;
                }
                if (eventKey.key !== 'Escape' || finished || session.pendingReward)
                    return;
                eventKey.preventDefault();
                void finish(true, true);
            };
            const showChoices = (line) => {
                const choices = session.choicesFor(line);
                if (session.resumeSavedChoice(line)) {
                    void startTyping().catch(failPlayback);
                    return;
                }
                if (!choices.length) {
                    void continueAfterLine(line);
                    return;
                }
                busy = true;
                nextButton.hidden = true;
                choicesEl.replaceChildren();
                choicesEl.hidden = false;
                for (const option of choices) {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'btn dialogue-choice-option';
                    renderColorText(button, option.text);
                    button.addEventListener('click', () => {
                        if (finished)
                            return;
                        for (const choiceButton of choicesEl.querySelectorAll('button'))
                            choiceButton.disabled = true;
                        if (!session.choose(line, option))
                            return;
                        transcript.choice(line.id, option.id);
                        choicesEl.hidden = true;
                        busy = false;
                        void startTyping().catch(failPlayback);
                    }, { once: true });
                    choicesEl.appendChild(button);
                }
                choicesEl.querySelector('button')?.focus();
            };
            const showRewards = (receiptRewards) => new Promise((rewardResolve) => {
                const validRewards = receiptRewards.length ? receiptRewards : [];
                if (!validRewards.length) {
                    session.acknowledgeReward();
                    rewardResolve();
                    return;
                }
                busy = true;
                const panel = document.createElement('section');
                panel.className = 'event-dialogue-reward';
                panel.setAttribute('role', 'alertdialog');
                panel.setAttribute('aria-modal', 'true');
                const heading = document.createElement('h2');
                heading.textContent = tr('String0690');
                const list = document.createElement('ul');
                for (const reward of validRewards) {
                    const entry = document.createElement('li');
                    const sign = reward.rewardType === 'item' ? ' × ' : ' +';
                    entry.textContent = `${reward.targetName}${sign}${reward.amount}`;
                    list.appendChild(entry);
                }
                const confirm = document.createElement('button');
                confirm.type = 'button';
                confirm.className = 'btn primary';
                confirm.textContent = tr('String0220');
                confirm.addEventListener('click', () => {
                    session.acknowledgeReward();
                    panel.remove();
                    busy = false;
                    rewardResolve();
                }, { once: true });
                panel.append(heading, list, confirm);
                overlay.querySelector('.event-dialogue-scene').appendChild(panel);
                confirm.focus();
            });
            const continueAfterLine = async (line) => {
                const { nextId, receipt } = session.completeLine(line);
                if (receipt)
                    await showRewards(receipt.rewards);
                if (finished)
                    return;
                if (nextId) {
                    void startTyping().catch(failPlayback);
                }
                else
                    void finish().catch(failPlayback);
            };
            const advance = () => {
                if (finished || busy || tools.paused)
                    return;
                if (typing) {
                    browserAnimationClock.clearTimeout(timer);
                    revealedText?.reveal(revealedText.length);
                    typing = false;
                    if (session.currentLine)
                        transcript.line(session.currentLine.id);
                    nextButton.hidden = false;
                    return;
                }
                const line = session.currentLine;
                if (!line) {
                    void finish();
                    return;
                }
                if (line.nodeType === 'choice')
                    showChoices(line);
                else
                    void continueAfterLine(line).catch(failPlayback);
            };
            nextButton.addEventListener('click', (clickEvent) => { clickEvent.stopPropagation(); advance(); });
            overlay.querySelector('.event-dialogue-box').addEventListener('click', (clickEvent) => {
                clickEvent.stopPropagation();
                advance();
            });
            narrationPanel.addEventListener('click', (clickEvent) => { clickEvent.stopPropagation(); advance(); });
            window.addEventListener('keydown', onKeyDown);
            overlay.addEventListener('click', (clickEvent) => {
                if (clickEvent.target === overlay || clickEvent.target === overlay.querySelector('.event-dialogue-scene')
                    || clickEvent.target === portraitLayer)
                    advance();
            });
            this.modalRoot.appendChild(overlay);
            stopSceneSizing = fitDialogueScene(overlay);
            showBackground(initialBackgroundSceneId);
            const scene = overlay.querySelector('.event-dialogue-scene');
            scene.tabIndex = -1;
            scene.focus();
            const begin = async () => {
            // Host extension: reconstruct the chosen route without granting rewards,
            // replaying one-shot sound effects, or advancing the saved cursor.
            if (preview.restoreLines?.length) {
                overlay.style.visibility = 'hidden';
                try {
                    for (const previous of preview.restoreLines) {
                        if (finished) return;
                        showBackground(previous.backgroundSceneId);
                        if (previous.standingLineYPercent != null) standingLineOverride = previous.standingLineYPercent;
                        await showPortrait(previous);
                        this.audio.enterLine({ ...previous, sfxAudioId: null });
                    }
                } finally { overlay.style.visibility = ''; }
            }
            if (finished) return;
            const pendingReward = session.pendingReward;
            if (pendingReward) {
                busy = true;
                const receiptRewards = pendingReward.rewards ?? pendingReward.rewardIds
                    .map((id) => rewardsById.get(id)).filter((reward) => Boolean(reward));
                void showRewards(receiptRewards).then(() => startTyping());
            }
            else
                void startTyping().catch(failPlayback);
            };
            void begin().catch(failPlayback);
        });
    }
}
