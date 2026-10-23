import {t} from '../core/localization.js';
import {CHARACTER_DATA} from '../data/charactersData.js';
import type {DialogueLineData} from '../data/dialogueData.js';
import type {DialogueOptionData} from '../data/dialogueOptionsData.js';
import type {DialogueSpeed, DialogueTranscript} from '../core/DialogueReading.js';
import {renderColorText} from './ColorText.js';

interface ReadingPort { pause():void; resume():void; blocked():boolean; speed():DialogueSpeed; setSpeed(speed:DialogueSpeed):void; }

/** Browser controls; the portable transcript stores stable IDs, never alternate story branches. */
export class DialogueTools {
  private abort = new AbortController();
  private toolbar = document.createElement('nav');
  private panel = document.createElement('section');
  private restore = document.createElement('button');
  private logOpen = false;
  private uiHidden = false;
  get paused():boolean { return this.logOpen || this.uiHidden; }

  constructor(private root:HTMLElement, private transcript:DialogueTranscript, private lines:readonly DialogueLineData[], private options:readonly DialogueOptionData[], private port:ReadingPort) {
    const button=(id:string,action:()=>void)=>{const b=document.createElement('button');b.type='button';b.className='dialogue-tools-button';b.textContent=t(id);b.addEventListener('click',e=>{e.stopPropagation();if(!port.blocked())action();},{signal:this.abort.signal});return b;};
    this.toolbar.className='event-dialogue-tools';
    this.toolbar.append(button('String1142',()=>this.openLog()));
    const label=document.createElement('label');label.textContent=t('String1146');const select=document.createElement('select');select.setAttribute('aria-label',t('String1146'));
    for(const[value,id]of [[50,'String1147'],[100,'String1148'],[150,'String1149']] as const){const option=document.createElement('option');option.value=String(value);option.textContent=t(id);select.append(option);}
    select.value=String(port.speed());select.addEventListener('change',()=>{port.setSpeed(Number(select.value) as DialogueSpeed);},{signal:this.abort.signal});label.append(select);this.toolbar.append(label,button('String1150',()=>this.hideUi()));
    this.restore.type='button';this.restore.className='dialogue-ui-restore dialogue-tools-button';this.restore.textContent=t('String1151');this.restore.hidden=true;
    this.panel.className='dialogue-log-panel';this.panel.hidden=true;this.panel.setAttribute('role','dialog');this.panel.setAttribute('aria-modal','true');this.panel.setAttribute('aria-label',t('String1143'));
    this.root.querySelector('.event-dialogue-scene')!.append(this.toolbar,this.restore,this.panel);
    this.root.addEventListener('click',e=>{if(this.uiHidden){e.preventDefault();e.stopImmediatePropagation();this.showUi();}},{capture:true,signal:this.abort.signal});
    this.panel.addEventListener('click',e=>e.stopPropagation(),{signal:this.abort.signal});
  }
  private hideUi():void {this.uiHidden=true;this.port.pause();this.root.classList.add('is-ui-hidden');this.restore.hidden=false;this.restore.focus();}
  private showUi():void {this.uiHidden=false;this.root.classList.remove('is-ui-hidden');this.restore.hidden=true;if(!this.logOpen)this.port.resume();}
  private openLog():void {
    this.logOpen=true;this.port.pause();this.panel.hidden=false;this.panel.replaceChildren();
    const heading=document.createElement('h2');heading.textContent=t('String1143');
    const list=document.createElement('div');list.className='dialogue-log-entries';
    for(const entry of this.transcript.entries){const line=this.lines.find(l=>l.id===entry.dialogueId);if(!line)continue;
      const item=document.createElement('article'),name=document.createElement('strong'),text=document.createElement('p');
      name.textContent=CHARACTER_DATA.find(c=>c.id===line.characterId)?.name??t('String1152');
      if(entry.kind==='choice'){const option=this.options.find(o=>o.id===entry.optionId);if(!option)continue;name.hidden=true;renderColorText(text,t('String1153').replace('{text}',option.text));}else renderColorText(text,line.text);
      item.append(name,text);list.append(item);
    }
    if(!list.childElementCount){const empty=document.createElement('p');empty.textContent=t('String1145');list.append(empty);}
    const close=document.createElement('button');close.type='button';close.className='dialogue-tools-button';close.textContent=t('String1144');close.onclick=()=>this.closeLog();
    this.panel.append(heading,list,close);close.focus();list.scrollTop=list.scrollHeight;
  }
  private closeLog():void {this.logOpen=false;this.panel.hidden=true;this.panel.replaceChildren();if(!this.uiHidden)this.port.resume();this.toolbar.querySelector<HTMLButtonElement>('button')?.focus();}
  escape():boolean {if(this.logOpen){this.closeLog();return true;}if(this.uiHidden){this.showUi();return true;}return false;}
  dispose():void {this.abort.abort();this.transcript.clear();this.toolbar.remove();this.panel.remove();this.restore.remove();}
}
