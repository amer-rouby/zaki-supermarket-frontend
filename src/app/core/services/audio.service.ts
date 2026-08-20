import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  private audioElements: Map<string, HTMLAudioElement> = new Map();

  private readonly SOUND_URLS = {
    notification: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    dialogOpen: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
    confirm: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    cancel: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3'
  };

  constructor() {
    this.preloadSounds();
  }

  private preloadSounds(): void {
    Object.entries(this.SOUND_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.load();
      this.audioElements.set(key, audio);
    });
  }

  playSound(type: keyof typeof this.SOUND_URLS, volume: number = 0.8): void {
    const audio = this.audioElements.get(type);

    if (audio) {
      audio.currentTime = 0;
      audio.volume = volume;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`[AudioService] Playback failed for ${type}:`, error);
        });
      }
    }
  }

  playNotificationSound(): void {
    const audioUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    const audio = new Audio(audioUrl);
    audio.load();
    audio.play().catch(error => {
      console.log('Notification sound blocked or failed:', error);
    });
  }
}
