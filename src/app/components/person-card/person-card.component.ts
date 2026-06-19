import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FamilyMember } from '../../models/family-member.model';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-person-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: 'person-card.component.html',
  styleUrl: 'person-card.component.scss'
})
export class PersonCardComponent implements OnInit {
  ngOnInit(): void {
    console.log(this.person, 'person')
  }
  @Input() person!: FamilyMember;
  @Input() isSelected: boolean = false;
  @Input() showActions: boolean = true;
  @Input() selectedLanguage: string = 'en';
  @Output() select = new EventEmitter<FamilyMember>();
  @Output() cardClick = new EventEmitter<FamilyMember>();
  private translationService = inject(TranslationService);

  getFullName(): string {
    const parts = [
      this.person.name,
      this.person.middle_name,
      this.person.surname
    ].filter(Boolean);
    
    return parts.join(' ') || 'Unknown';
  }

  onSelect(event: Event): void {
    event.stopPropagation();
    this.select.emit(this.person);
  }

  onCardClick(): void {
    this.cardClick.emit(this.person);
  }

  get currentLocale(): string {
    return this.translationService.getCurrentLanguage();
  }
}
