import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { registerLocaleData } from '@angular/common';

// Import locale data
import localeHy from '@angular/common/locales/hy';
import localeRu from '@angular/common/locales/ru';
import localeEn from '@angular/common/locales/en';
import { inject, provideAppInitializer } from '@angular/core';
import { TranslationService } from './app/services/translation.service';
import { firstValueFrom } from 'rxjs';

// Register locales
registerLocaleData(localeHy, 'hy');
registerLocaleData(localeRu, 'ru');
registerLocaleData(localeEn, 'en');

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAppInitializer(() => {
      const translationService = inject(TranslationService);
      const savedLang = localStorage.getItem('app_language') || 'en';
      return firstValueFrom(translationService.loadTranslations(savedLang));
    })
  ]
}).catch(err => console.error(err));
