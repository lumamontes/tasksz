/**
 * SoundSection Component
 * Pomodoro sound and audio settings
 */

import { useStore } from '@nanostores/react';
import { $settings, updateSettings, updatePomodoroSettings, resetSounds, resetPomodoro } from '../../../stores/settingsStore';
import { useState, useRef, useEffect } from 'react';

export function SoundSection() {
  const settings = useStore($settings);
  const [isPlayingTest, setIsPlayingTest] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const soundOptions = [
    { value: 'none', label: 'Silencioso', description: 'Sem sons' },
    { value: 'white-noise', label: 'Ruído Branco', description: 'Som constante e uniforme' },
    { value: 'pink-noise', label: 'Ruído Rosa', description: 'Som mais suave que o branco' },
    { value: 'brown-noise', label: 'Ruído Marrom', description: 'Som profundo e relaxante' },
    { value: 'rain', label: 'Chuva', description: 'Som de chuva leve' },
    { value: 'cafe', label: 'Café', description: 'Ambiente de cafeteria' }
  ];

  // Generate noise using Web Audio API
  const generateNoise = (type: string, duration: number = 2) => {
    if (typeof window === 'undefined' || !window.AudioContext) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufferSize = audioContext.sampleRate * duration;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      if (type === 'white-noise') {
        output[i] = Math.random() * 2 - 1;
      } else if (type === 'pink-noise') {
        // Simplified pink noise approximation
        output[i] = (Math.random() * 2 - 1) * Math.pow(Math.random(), 0.5);
      } else if (type === 'brown-noise') {
        // Simplified brown noise approximation
        output[i] = (Math.random() * 2 - 1) * Math.pow(Math.random(), 0.25);
      }
    }

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = noiseBuffer;
    gainNode.gain.setValueAtTime(settings.soundVolume * 0.3, audioContext.currentTime); // Lower volume for test
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start(0);
    
    return () => {
      source.stop();
      audioContext.close();
    };
  };

  const playTestSound = (soundType: string) => {
    if (isPlayingTest) {
      stopTestSound();
      return;
    }

    setIsPlayingTest(soundType);

    if (soundType.includes('noise')) {
      // Generate synthetic noise
      const stopNoise = generateNoise(soundType);
      setTimeout(() => {
        stopNoise?.();
        setIsPlayingTest(null);
      }, 2000);
    } else if (soundType === 'rain' || soundType === 'cafe') {
      // For natural sounds, we'll simulate with a placeholder
      // In a real implementation, you'd load actual audio files
      const audio = new Audio();
      audio.volume = settings.soundVolume * 0.5;
      
      // Placeholder - in real app, load from /public/sounds/
      console.log(`Playing ${soundType} sound (placeholder)`);
      
      setTimeout(() => {
        setIsPlayingTest(null);
      }, 2000);
    }
  };

  const stopTestSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingTest(null);
  };

  useEffect(() => {
    return () => {
      stopTestSound();
    };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Master Sound Toggle */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Som Principal</h3>
        <label className="flex items-center justify-between p-3 rounded-lg border border-theme-border hover:border-theme-accent/50 transition-colors cursor-pointer">
          <div>
            <div className="font-medium text-theme-text">Ativar sons</div>
            <div className="text-sm text-theme-muted">
              Habilita todos os sons do aplicativo
            </div>
          </div>
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 ${
              settings.soundEnabled ? 'bg-theme-accent' : 'bg-theme-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-theme-sidebar transition-transform ${
                settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Pomodoro Sound Selection */}
      <div className={settings.soundEnabled ? '' : 'opacity-50 pointer-events-none'}>
        <h3 className="text-base font-medium text-theme-text mb-4">Som do Pomodoro</h3>
        <div className="space-y-3">
          {soundOptions.map(option => (
            <div key={option.value} className="flex items-center justify-between p-3 rounded-lg border border-theme-border">
              <div className="flex-1">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pomodoroSound"
                    value={option.value}
                    checked={settings.pomodoroSound === option.value}
                    onChange={(e) => updateSettings({ pomodoroSound: e.target.value as any })}
                    disabled={!settings.soundEnabled}
                    className="w-4 h-4 text-theme-accent border-theme-border focus:ring-theme-accent focus:ring-2"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-theme-text">{option.label}</div>
                    <div className="text-sm text-theme-muted">{option.description}</div>
                  </div>
                </label>
              </div>
              
              {option.value !== 'none' && settings.soundEnabled && (
                <button
                  onClick={() => playTestSound(option.value)}
                  disabled={isPlayingTest !== null}
                  className={`ml-3 px-3 py-1 text-xs rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                    isPlayingTest === option.value
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-theme-sidebar border-theme-border text-theme-text hover:border-theme-accent'
                  }`}
                >
                  {isPlayingTest === option.value ? 'Parar' : 'Testar'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Audio Files Note */}
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-orange-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-orange-800">Sons personalizados</p>
              <p className="text-orange-700 mt-1">
                Para adicionar seus próprios sons, coloque arquivos de áudio na pasta <code className="bg-orange-100 px-1 rounded">public/sounds/</code> 
                com os nomes: rain.mp3, cafe.mp3, etc.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Control */}
      <div className={settings.soundEnabled && settings.pomodoroSound !== 'none' ? '' : 'opacity-50 pointer-events-none'}>
        <h3 className="text-base font-medium text-theme-text mb-4">Volume</h3>
        <div className="p-3 rounded-lg border border-theme-border">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-theme-muted" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12 5a1 1 0 011.414 0L15 6.586l1.586-1.586a1 1 0 011.414 1.414L16.414 8 18 9.586a1 1 0 01-1.414 1.414L15 9.414l-1.586 1.586a1 1 0 01-1.414-1.414L13.586 8 12 6.414A1 1 0 0112 5z" clipRule="evenodd" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.soundVolume}
              onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
              disabled={!settings.soundEnabled || settings.pomodoroSound === 'none'}
              className="flex-1 h-2 bg-theme-border rounded-lg appearance-none cursor-pointer slider"
            />
            <svg className="w-4 h-4 text-theme-muted" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-theme-muted min-w-8">{Math.round(settings.soundVolume * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Tick Sound */}
      <div className={settings.soundEnabled ? '' : 'opacity-50 pointer-events-none'}>
        <h3 className="text-base font-medium text-theme-text mb-4">Som de Tique</h3>
        <label className="flex items-center justify-between p-3 rounded-lg border border-theme-border hover:border-theme-accent/50 transition-colors cursor-pointer">
          <div>
            <div className="font-medium text-theme-text">Tique do relógio</div>
            <div className="text-sm text-theme-muted">
              Som sutil de tique durante o timer (opcional)
            </div>
          </div>
          <button
            onClick={() => updateSettings({ tickSoundEnabled: !settings.tickSoundEnabled })}
            disabled={!settings.soundEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 ${
              settings.tickSoundEnabled && settings.soundEnabled ? 'bg-theme-accent' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.tickSoundEnabled && settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Pomodoro Settings */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Durações do Pomodoro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Tempo de foco (min)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={settings.pomodoro.focusMinutes}
              onChange={(e) => updatePomodoroSettings({ focusMinutes: parseInt(e.target.value) || 25 })}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-sidebar text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Pausa curta (min)
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={settings.pomodoro.shortBreakMinutes}
              onChange={(e) => updatePomodoroSettings({ shortBreakMinutes: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-sidebar text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Pausa longa (min)
            </label>
            <input
              type="number"
              min="15"
              max="30"
              value={settings.pomodoro.longBreakMinutes}
              onChange={(e) => updatePomodoroSettings({ longBreakMinutes: parseInt(e.target.value) || 15 })}
              className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-sidebar text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
            />
          </div>
        </div>
      </div>

      {/* Reset Sounds */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Restaurar Sons</h3>
        <div className="p-4 rounded-lg border border-theme-border bg-theme-sidebar">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-theme-text mb-1">Restaurar configurações de som</div>
              <div className="text-sm text-theme-muted">Volta sons e volume para os padrões</div>
            </div>
            <button
              onClick={resetSounds}
              className="px-4 py-2 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm font-medium"
            >
              Restaurar
            </button>
          </div>
        </div>
      </div>

      {/* Reset Pomodoro */}
      <div>
        <h3 className="text-base font-medium text-theme-text mb-4">Restaurar Pomodoro</h3>
        <div className="p-4 rounded-lg border border-theme-border bg-theme-sidebar">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-theme-text mb-1">Restaurar configurações do pomodoro</div>
              <div className="text-sm text-theme-muted">Volta durações de foco e pausa para os padrões</div>
            </div>
            <button
              onClick={resetPomodoro}
              className="px-4 py-2 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm font-medium"
            >
              Restaurar
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}