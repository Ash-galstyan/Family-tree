import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnityContainerComponent } from './unity-container.component';

describe('UnityContainerComponent', () => {
  let component: UnityContainerComponent;
  let fixture: ComponentFixture<UnityContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnityContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnityContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
