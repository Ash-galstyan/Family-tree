import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, Signal } from '@angular/core';
import { PersonCardComponent } from '../person-card/person-card.component';
import { CommonConnectionCardComponent } from '../common-connection-card/common-connection-card.component';

@Component({
  selector: 'app-person-details-dialog',
  imports: [PersonCardComponent, CommonConnectionCardComponent],
  templateUrl: './person-details-dialog.component.html',
  styleUrl: './person-details-dialog.component.scss'
})
export class PersonDetailsDialogComponent {
  isIndividual = computed(() => this.data.dialogType() === 'individual');
  isConnection = computed(() => this.data.dialogType() === 'connection');

  dialogRef = inject<DialogRef<string>>(DialogRef<string>);
  data = inject<{
    nodeData: any;
    dialogType: Signal<'individual' | 'connection' | null>;
    selectedLanguage: string;
  }>(DIALOG_DATA);
}
