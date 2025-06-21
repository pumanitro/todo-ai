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
 * Provides complete feedback for task completion (sound + vibration)
 */
export const triggerTaskCompletionFeedback = () => {
  playTaskCompletionSound();
  triggerTaskCompletionVibration();
}; 