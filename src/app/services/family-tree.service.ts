import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonAncestorResponse, FamilyMember } from '../models/family-member.model';

@Injectable({
  providedIn: 'root'
})
export class FamilyTreeService {
  private apiUrl = '/api';
  
  // Global state for selected person
  selectedPerson = signal<FamilyMember | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get person profile by ID
   */
  getPersonProfile(id: string): Observable<FamilyMember> {
    return this.http.get<FamilyMember>(`${this.apiUrl}/person-profile/${id}`);
  }

  /**
   * Get relationship between two persons
   */
  getPersonsRelationship(firstId: number, secondId: number, lang: string): Observable<CommonAncestorResponse> {
    return this.http.get<CommonAncestorResponse>(`${this.apiUrl}/persons`, {
      params: {
        first: firstId.toString(),
        second: secondId.toString(),
        lang
      }
    });
  }

  /**
   * Set selected person globally
   */
  setSelectedPerson(person: FamilyMember | null): void {
    this.selectedPerson.set(person);
  }

  /**
   * Get selected person
   */
  getSelectedPerson(): FamilyMember | null {
    return this.selectedPerson();
  }
}
