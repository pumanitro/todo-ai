// Utility functions for providing audio and haptic feedback

/**
 * Fallback function to create a simple beep sound using Web Audio API
 */
const playFallbackBeepSound = () => {
  try {
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      return;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);

    setTimeout(() => audioContext.close(), 300);
  } catch (error) {
    console.log('Fallback beep sound failed:', error);
  }
};

/**
 * Fallback function to create a reverse beep sound using Web Audio API
 */
const playFallbackReverseBeepSound = () => {
  try {
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      return;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start at a lower frequency and go higher (reverse of completion)
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.2);
    oscillator.type = 'sine';

    // Reverse gain envelope - start quiet, get louder, then fade
    gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);

    setTimeout(() => audioContext.close(), 300);
  } catch (error) {
    console.log('Fallback reverse beep sound failed:', error);
  }
};

/**
 * Plays a pleasant completion sound using MP3 audio file with fallback
 */
export const playTaskCompletionSound = () => {
  try {
    // Create audio element and play the completion sound
    const audio = new Audio('/sounds/task-completed.mp3');
    
    // Set volume to a pleasant level
    audio.volume = 0.3;
    
    // Add more detailed debugging
    console.log('🔊 Attempting to play task completion sound...');
    
    // Handle successful loading
    audio.onloadeddata = () => {
      console.log('✅ MP3 file loaded successfully');
    };
    
    // Handle errors (file not found, etc.)
    audio.onerror = (e) => {
      console.error('❌ Audio file error - file not found or format not supported:', e);
      console.log('🔄 Using fallback beep sound instead');
      playFallbackBeepSound();
    };
    
    // Play the sound
    audio.play()
      .then(() => {
        console.log('🎵 MP3 completion sound played successfully');
      })
      .catch((error) => {
        // Handle autoplay restrictions or other errors
        console.error('❌ Could not play MP3 completion sound:', error);
        console.log('🔄 Using fallback beep sound instead');
        playFallbackBeepSound();
      });

  } catch (error) {
    console.error('❌ Could not create audio element:', error);
    console.log('🔄 Using fallback beep sound instead');
    playFallbackBeepSound();
  }
};

/**
 * Plays the completion sound backwards using Web Audio API
 */
const playTaskCompletionSoundBackwards = () => {
  try {
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      console.log('🔄 Web Audio API not supported, using fallback reverse beep');
      playFallbackReverseBeepSound();
      return;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();

    // Load the completion sound file
    fetch('/sounds/task-completed.mp3')
      .then(response => response.arrayBuffer())
      .then(data => audioContext.decodeAudioData(data))
      .then(audioBuffer => {
        console.log(`🎵 Original audio duration: ${audioBuffer.duration.toFixed(2)}s`);
        
        // Calculate samples to cut (1.5 seconds total)
        const samplesToCut = audioBuffer.sampleRate * 1.5; // 1.5 seconds worth of samples
        const newLength = Math.max(audioBuffer.length - samplesToCut, audioBuffer.sampleRate * 0.2); // Minimum 0.2 seconds
        
        console.log(`🎵 New audio duration will be: ${(newLength / audioBuffer.sampleRate).toFixed(2)}s`);
        
        // Create a new buffer with reversed audio (1.5 seconds shorter)
        const reversedBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          newLength,
          audioBuffer.sampleRate
        );

        // Reverse each channel and cut 1.5 seconds
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const originalData = audioBuffer.getChannelData(channel);
          const reversedData = reversedBuffer.getChannelData(channel);
          
          // Copy reversed data, skipping the first 1.5 seconds worth of samples from the original
          for (let i = 0; i < newLength; i++) {
            const originalIndex = audioBuffer.length - 1 - i - samplesToCut;
            reversedData[i] = originalIndex >= 0 ? originalData[originalIndex] : 0;
          }
        }

        // Play the reversed buffer
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        
        source.buffer = reversedBuffer;
        gainNode.gain.value = 0.3; // Same volume as completion sound
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        source.start();
        
        console.log('🎵 Reversed completion sound (1.5s shorter) played successfully');
        
        // Clean up after the sound finishes
        setTimeout(() => audioContext.close(), reversedBuffer.duration * 1000 + 100);
      })
      .catch(error => {
        console.error('❌ Could not load or reverse MP3 file:', error);
        console.log('🔄 Using fallback reverse beep sound instead');
        playFallbackReverseBeepSound();
      });

  } catch (error) {
    console.error('❌ Could not create reversed audio:', error);
    console.log('🔄 Using fallback reverse beep sound instead');
    playFallbackReverseBeepSound();
  }
};

/**
 * Triggers haptic vibration feedback for task completion
 */
export const triggerTaskCompletionVibration = () => {
  try {
    // Check if Vibration API is supported
    if (!navigator.vibrate) {
      console.log('📳 Vibration API not supported on this device/browser');
      return;
    }

    // Create a pleasant vibration pattern: short-long-short
    // Pattern: [vibrate_ms, pause_ms, vibrate_ms, pause_ms, vibrate_ms]
    const vibrationPattern = [50, 30, 100, 30, 50];
    
    console.log('📳 Triggering vibration pattern:', vibrationPattern);
    navigator.vibrate(vibrationPattern);
    console.log('✅ Vibration triggered successfully');
    
  } catch (error) {
    console.log('❌ Could not trigger vibration:', error);
  }
};

/**
 * Triggers reverse haptic vibration feedback for task uncompleting
 */
export const triggerTaskUncompletionVibration = () => {
  try {
    // Check if Vibration API is supported
    if (!navigator.vibrate) {
      console.log('📳 Vibration API not supported on this device/browser');
      return;
    }

    // Create a reverse vibration pattern: long-short-long (opposite of completion)
    // Pattern: [vibrate_ms, pause_ms, vibrate_ms, pause_ms, vibrate_ms]
    const vibrationPattern = [100, 30, 50, 30, 100];
    
    console.log('📳 Triggering reverse vibration pattern:', vibrationPattern);
    navigator.vibrate(vibrationPattern);
    console.log('✅ Reverse vibration triggered successfully');
    
  } catch (error) {
    console.log('❌ Could not trigger reverse vibration:', error);
  }
};

/**
 * Provides complete feedback for task completion (sound + vibration)
 */
export const triggerTaskCompletionFeedback = () => {
  playTaskCompletionSound();
  triggerTaskCompletionVibration();
};

/**
 * Provides complete feedback for task uncompleting (reverse sound + reverse vibration)
 */
export const triggerTaskUncompletionFeedback = () => {
  playTaskCompletionSoundBackwards();
  triggerTaskUncompletionVibration();
}; 