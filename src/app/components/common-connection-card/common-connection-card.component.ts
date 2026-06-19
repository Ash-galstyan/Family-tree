import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ArmLang, CommonAncestorResponse, CommonPersonBase, CommonResponseMember, Lineage, RuLang } from '../../models/family-member.model';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-common-connection-card',
  imports: [TranslatePipe],
  providers: [DatePipe],
  standalone: true,
  templateUrl: './common-connection-card.component.html',
  styleUrl: './common-connection-card.component.scss'
})
export class CommonConnectionCardComponent implements OnChanges {
  @Input() commonAncestorData!: CommonAncestorResponse;
  private translationService = inject(TranslationService);
  private datePipe = inject(DatePipe);
  member1Lineage: CommonResponseMember[] = [];
  member2Lineage: CommonResponseMember[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['commonAncestorData'] && this.commonAncestorData) {
      this.member1Lineage = [];
      this.member2Lineage = [];
      
      if (this.commonAncestorData.member1) {
        this.createLineage(this.commonAncestorData.member1, this.member1Lineage);
      }

      if (this.commonAncestorData.member2) {
        this.createLineage(this.commonAncestorData.member2, this.member2Lineage);
      }
    }
  }

  createLineage(familyMember: CommonResponseMember | CommonPersonBase, lineageArr: Lineage[]) {
    if (familyMember.father && familyMember.father.id !== this.commonAncestorData.common_ancestor.id) {
      let fatherWithTranslation;
      const translations = familyMember.father.translation;
      switch(this.currentLocale) {
          case ArmLang:
            fatherWithTranslation = {
              ...familyMember.father,
              ...translations[0]
            };
            break;
          case RuLang:
            fatherWithTranslation = {
              ...familyMember.father,
              ...translations[1]
            };
            break;
          default:
            const { translation, father, ...englishData } = familyMember.father;
            fatherWithTranslation = englishData;
            break;
        }
      lineageArr.push(fatherWithTranslation);
      this.createLineage(familyMember.father, lineageArr);
    }
  }

  formatYear(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    const locale = this.currentLocale;

    // Map locale codes to Angular locale identifiers
    const localeMap: Record<string, string> = {
      'en': 'en',
      'hy': 'hy',
      'ru': 'ru'
    };

    const angularLocale = localeMap[locale] || 'en';
    
    return this.datePipe.transform(dateString, 'yyyy', undefined, angularLocale) || 'Unknown';
  }

  get currentLocale(): string {
    return this.translationService.getCurrentLanguage();
  }
}