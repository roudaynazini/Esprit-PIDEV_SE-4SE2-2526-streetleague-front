import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BadWordsFilterService {

  private readonly badWords: string[] = [
    // 🇬🇧 English
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy',
    'cunt', 'motherfucker', 'whore', 'slut', 'damn', 'faggot',

    // 🇫🇷 Français
    'merde', 'putain', 'connard', 'connasse', 'salope', 'enculé',
    'fils de pute', 'batard', 'bâtard', 'nique', 'con', 'conne',
    'foutre', 'chier', 'pute', 'bite', 'couille', 'couilles',
    'va te faire foutre', 'ta gueule', 'ferme ta gueule',

    // 🇹🇳 Dialecte tunisien
    'zebi', 'zeb', 'kess', 'kess ommek', 'ya khawal', 'a7a',
    'nik', 'omek',  'ta7an', '7arami', 'sharmouta',
    '9a7ba', '9s', '7mar', '7mara', 'koffet', 'bel3a',
    'wled l9a7ba', 'ibn el9a7ba', 'oussou', 'barra',
    'yel3en', 'ya 7aywen', 'ya 9a7ba', 'bne9lb',

    // 🇸🇦 Arabe
    'عاهرة', 'كس', 'زب', 'شرموطة', 'يلعن', 'ابن الكلب',
    'كلب', 'حمار', 'غبي', 'احمق', 'لعنة', 'ملعون',
    'خول', 'منيوك', 'طيز', 'ابن العاهرة', 'يبن الكلب',
    'قحبة', 'نيك', 'أم زبك', 'كس أمك'
  ];

  private readonly pattern: RegExp;

  constructor() {
    const escaped = [...this.badWords]
      .sort((a, b) => b.length - a.length) // les phrases longues en premier
      .map(w => w.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    this.pattern = new RegExp(`(${escaped})`, 'gi');
  }

  filter(text: string): string {
    if (!text || !text.trim()) return text;
    // Reset lastIndex pour éviter les bugs avec les regex globales
    this.pattern.lastIndex = 0;
    return text.replace(this.pattern, match => '*'.repeat(match.length));
  }

  containsBadWords(text: string): boolean {
    if (!text || !text.trim()) return false;
    this.pattern.lastIndex = 0;
    return this.pattern.test(text);
  }
}