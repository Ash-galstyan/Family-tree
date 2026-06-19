import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonConnectionCardComponent } from './common-connection-card.component';

describe('CommonConnectionCardComponent', () => {
  let component: CommonConnectionCardComponent;
  let fixture: ComponentFixture<CommonConnectionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonConnectionCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonConnectionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
