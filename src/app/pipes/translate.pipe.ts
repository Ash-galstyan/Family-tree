// translate.pipe.ts
import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { effect } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Important: makes pipe reactive to signal changes
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  
  constructor() {
    // Re-render when translations change
    effect(() => {
      this.translationService.getTranslations();
      this.cdr.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, string>): string {
    return this.translationService.translate(key, params);
  }
}