import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

type Translations = Record<string, any>;

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations = signal<Translations>({});
  private currentLang = signal<string>('en');
  
  readonly availableLanguages = ['en', 'hy', 'ru'];
  
  constructor(private http: HttpClient) {
    this.initializeLanguage();
  }

  /**
   * Load translations for a specific language
   */
  public loadTranslations(lang: string): Observable<Translations> {
    return this.http.get<Translations>(`assets/i18n/${lang}.json`).pipe(
      tap(translations => {
        this.translations.set(translations);
        this.currentLang.set(lang);
        localStorage.setItem('app_language', lang);
      }),
      catchError(error => {
        console.error(`Failed to load translations for ${lang}:`, error);
        return of({});
      })
    );
  }

  /**
   * Change current language
   */
  setLanguage(lang: string): void {
    if (this.availableLanguages.includes(lang)) {
      this.loadTranslations(lang).subscribe();
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLang();
  }

  /**
   * Get translation by key (supports nested keys with dot notation)
   * Example: translate('common.save') or translate('person.name')
   */
  translate(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.translations();

    // Navigate through nested object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return key if translation not found
      }
    }

    // Replace parameters if provided
    if (params && typeof value === 'string') {
      Object.keys(params).forEach(param => {
        value = value.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });
    }

    return value;
  }

  /**
   * Get all translations for current language (used by pipe to track changes)
   */
  getTranslations(): Translations {
    return this.translations();
  }

  /**
   * Initialize language from localStorage or browser settings
   */
  private initializeLanguage(): void {
    const savedLang = localStorage.getItem('app_language');
    const browserLang = navigator.language.split('-')[0];
    
    const lang = savedLang || 
                 (this.availableLanguages.includes(browserLang) ? browserLang : 'en');
    
    this.setLanguage(lang);
  }
}