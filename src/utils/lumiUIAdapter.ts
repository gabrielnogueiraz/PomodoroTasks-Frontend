import { LumiMoodType } from '../services/lumiService';

export interface MoodTheme {
  primaryColor: string;
  backgroundColor: string;
  emoji: string;
  animation: string;
}

export class LumiUIAdapter {
  private moodThemes: Record<LumiMoodType, MoodTheme> = {
    [LumiMoodType.MOTIVATED]: {
      primaryColor: '#FF6B35',
      backgroundColor: '#FFF8F5',
      emoji: '🚀',
      animation: 'energetic'
    },
    [LumiMoodType.FOCUSED]: {
      primaryColor: '#4A90E2',
      backgroundColor: '#F7FBFF',
      emoji: '🎯',
      animation: 'calm'
    },
    [LumiMoodType.STRUGGLING]: {
      primaryColor: '#7B68EE',
      backgroundColor: '#F9F8FF',
      emoji: '💙',
      animation: 'gentle'
    },
    [LumiMoodType.OVERWHELMED]: {
      primaryColor: '#98D8C8',
      backgroundColor: '#F7FFFC',
      emoji: '🌸',
      animation: 'soothing'
    },
    [LumiMoodType.CELEBRATING]: {
      primaryColor: '#FFD700',
      backgroundColor: '#FFFEF7',
      emoji: '🎉',
      animation: 'festive'
    },
    [LumiMoodType.RETURNING]: {
      primaryColor: '#FF69B4',
      backgroundColor: '#FFF7FC',
      emoji: '👋',
      animation: 'welcoming'
    },
    [LumiMoodType.ENCOURAGING]: {
      primaryColor: '#FF6B35',
      backgroundColor: '#FFF8F5',
      emoji: '💪',
      animation: 'energetic'
    },
    [LumiMoodType.SUPPORTIVE]: {
      primaryColor: '#98D8C8',
      backgroundColor: '#F7FFFC',
      emoji: '🤗',
      animation: 'gentle'
    },
    [LumiMoodType.EXCITED]: {
      primaryColor: '#FFD700',
      backgroundColor: '#FFFEF7',
      emoji: '🎉',
      animation: 'festive'
    },
    [LumiMoodType.PROUD]: {
      primaryColor: '#FFD700',
      backgroundColor: '#FFFEF7',
      emoji: '⭐',
      animation: 'festive'
    },
    [LumiMoodType.CONCERNED]: {
      primaryColor: '#7B68EE',
      backgroundColor: '#F9F8FF',
      emoji: '😕',
      animation: 'gentle'
    },
    [LumiMoodType.MOTIVATIONAL]: {
      primaryColor: '#FF6B35',
      backgroundColor: '#FFF8F5',
      emoji: '🚀',
      animation: 'energetic'
    }
  };

  adaptUIToMood(mood: LumiMoodType): void {
    const theme = this.moodThemes[mood];
    
    if (!theme) return;

    document.documentElement.style.setProperty('--lumi-primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--lumi-bg-color', theme.backgroundColor);
    
    this.updateLumiAvatar(theme.emoji);
    this.applyAnimation(theme.animation);
  }

  private updateLumiAvatar(emoji: string): void {
    const avatars = document.querySelectorAll('.lumi-avatar-emoji');
    avatars.forEach((avatar) => {
      if (avatar.textContent !== emoji) {
        avatar.textContent = emoji;
      }
    });
  }

  private applyAnimation(animationType: string): void {
    const container = document.querySelector('.lumi-container');
    if (container) {
      container.className = container.className.replace(/animation-\w+/g, '');
      container.classList.add(`animation-${animationType}`);
    }
  }

  getMoodEmoji(mood: LumiMoodType): string {
    return this.moodThemes[mood]?.emoji || '✨';
  }

  getMoodTheme(mood: LumiMoodType): MoodTheme | null {
    return this.moodThemes[mood] || null;
  }
}

export const lumiUIAdapter = new LumiUIAdapter();
export default lumiUIAdapter;
