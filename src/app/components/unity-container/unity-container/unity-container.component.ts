import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  signal,
  ViewChild
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { FamilyTreeService } from '../../../services/family-tree.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import {
  ArmLang,
  CommonAncestorResponse,
  EngLang,
  FamilyMember,
  Languages,
  RuLang,
  UnityMessage
} from '../../../models/family-member.model';
import { PersonDetailsDialogComponent } from '../../person-details-dialog/person-details-dialog.component';
import { DialogRef } from '@angular/cdk/dialog';
import { Subject, throttleTime } from 'rxjs';
import { TranslationService } from '../../../services/translation.service';

declare const createUnityInstance: any;

/**
 * Cap the render resolution on high-DPI / Retina screens. Unity otherwise
 * renders at the full window.devicePixelRatio (e.g. 2x display => 4x the
 * pixels), which is the main reason the build feels smooth standalone but lags
 * badly inside the browser. 1.5 keeps it reasonably crisp while cutting the
 * pixel count dramatically. Lower it towards 1 if more performance is needed.
 */
const MAX_DEVICE_PIXEL_RATIO = 1.5;

@Component({
  selector: 'app-unity-container',
  imports: [TranslatePipe],
  templateUrl: './unity-container.component.html',
  styleUrl: './unity-container.component.scss',
  standalone: true
})
export class UnityContainerComponent {
  @ViewChild('unityCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private destroyRef = inject(DestroyRef);
  private dialog = inject(Dialog);
  private translationService = inject(TranslationService);
  private ngZone = inject(NgZone);


  private unityInstance: any;
  private clickSubject = new Subject<any>();
  private selectedLanguage: string = EngLang;
  private currentDialogRef: DialogRef<any, PersonDetailsDialogComponent> | null = null;

  loading = false;
  nodeData!: FamilyMember;
  commonAncestorData!: CommonAncestorResponse;

  showPersonCard = signal(false);
  showConnectionCard = signal(false);
  dialogType = signal<'individual' | 'connection' | null>(null);
  isUnityLoading = true;
  loadingMessage = 'Loading Family Tree...';
  loadingProgress = 0;

  constructor(private familyTreeService: FamilyTreeService) {}

  ngOnInit() {
    this.loadUnityScripts().then(() => {
      this.initializeUnity();
    });

    // Set up global callback for Unity messages
    (window as any).onUnityMessage = this.handleUnityMessage.bind(this);

    this.clickSubject.pipe(
      throttleTime(300, undefined, { leading: true, trailing: false }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data: UnityMessage) => {
      // Unity runs outside Angular's zone (see initializeUnity), so its messages
      // arrive outside the zone too. Re-enter the zone so the resulting dialogs
      // and signal updates trigger change detection.
      this.ngZone.run(() => this.processClick(data));
    });
  }

  private loadUnityScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/unity/Build/Build.loader.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Unity loader'));
      document.body.appendChild(script);
    });
  }

  private initializeUnity() {
    const canvas = this.canvasRef.nativeElement;

    // Run Unity OUTSIDE Angular's zone. Unity drives a per-frame main loop via
    // setTimeout/requestAnimationFrame; inside the zone, zone.js turns every
    // frame into an Angular change-detection pass, which is wasted work. We
    // re-enter the zone (ngZone.run) only for the callbacks that touch
    // Angular-bound state.
    this.ngZone.runOutsideAngular(() => {
    createUnityInstance(canvas, {
      dataUrl: "assets/unity/Build/Build.data.unityweb",
      frameworkUrl: "assets/unity/Build/Build.framework.js.unityweb",
      codeUrl: "assets/unity/Build/Build.wasm.unityweb",
      streamingAssetsUrl: "StreamingAssets",
      companyName: "iii",
      productName: "Generation_Tree",
      productVersion: "0.1.0",
      // Cache the large build artifacts (data + wasm + framework) in the
      // browser's IndexedDB (Unity's "UnityCache") so they load from disk
      // instead of re-downloading/re-decompressing on every visit and on every
      // reloadUnity() call. "must-revalidate" (not "immutable") is deliberate:
      // it sends a cheap conditional request, so a NEW build is picked up
      // automatically via its ETag while unchanged builds still load from cache.
      cacheControl: (url: string) =>
        /\.(data|wasm|framework\.js)\b/.test(url) || /\.bundle/.test(url)
          ? 'must-revalidate'
          : 'no-store',
      // Cap the drawing-buffer resolution on high-DPI displays. Unity reads
      // Module.devicePixelRatio here; without it Unity renders at the full
      // window.devicePixelRatio (2x screen => 4x pixels), which is expensive on
      // Retina/mobile screens for no visible benefit.
      matchWebGLToCanvasSize: true,
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO),
    }, (progress: number) => {
      this.ngZone.run(() => {
        this.loadingProgress = Math.round(progress * 100);
      });
    }).then((unityInstance: any) => {
      this.ngZone.run(() => {
        this.unityInstance = unityInstance;
        this.isUnityLoading = false;
      });
    }).catch((message: string) => {
      console.error('Unity initialization failed:', message);
    });
    });
  }

  private handleUnityMessage(msg: UnityMessage) {
    let data = msg;
    if (typeof msg === 'string') {
      try { 
        data = JSON.parse(msg); 
      } catch (e) {
        console.error('Failed to parse Unity message:', e);
      }
    }

    // Handle the node click
    if (data && (data.type === 'text' || data.type === 'connections')) {
      this.clickSubject.next(data);
    }
  }

  private processClick(data: UnityMessage) {
    if (data.language || (data.language == 0)) {
      this.selectedLanguage = Languages[data.language];
      this.translationService.setLanguage(this.selectedLanguage);
    }

    if (data.type === 'text') {
      const nodeId = parseInt(data.data, 10);
      this.fetchNodeData(nodeId.toString());
    } else if (data.type === 'connections') {
      const memberIds = Array.isArray(data.data) ? data.data : [data.data];
      if (memberIds.length === 2) {
        this.getRelationship(memberIds);
      }
    }
  }

  private fetchNodeData(nodeId: string): void {
    this.loading = true;
    this.dialogType.set('individual');

    this.familyTreeService.getPersonProfile(nodeId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        switch(this.selectedLanguage) {
          case ArmLang:
            this.nodeData = this.getLocalizedPerson(response, this.selectedLanguage);
            break;
          case RuLang:
            this.nodeData = this.getLocalizedPerson(response, this.selectedLanguage);
            break;
          default:
            const {translations, ...englishData} = response;
            this.nodeData = englishData;
            break;
        }
        this.openDialog(this.nodeData);
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to fetch node data:', error);
        this.loading = false;
      }
    });
  }

  private getLocalizedPerson(person: any, locale: string) {
    const translation = person.translations?.find((t: any) => t.locale === locale);
    
    return {
      ...person,
      ...(translation && {
        name: translation.name,
        surname: translation.surname
      })
    };
  }

  private getRelationship(persons: string[]): void {
    this.loading = true;
    this.dialogType.set('connection');
    this.loading = true;
    this.showConnectionCard.set(true);
    this.familyTreeService.getPersonsRelationship(+persons[0], +persons[1], this.selectedLanguage).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res: CommonAncestorResponse) => {
      this.commonAncestorData = res;
      this.openDialog(this.commonAncestorData);
      this.loading = false;
    });
  }

  private openDialog(data: any): void {
    // Close any dialog still open from a previous node click. Without this each
    // click stacks a new overlay + component + subscriptions that are never
    // released, which is a steady per-interaction memory leak.
    this.currentDialogRef?.close();

    this.currentDialogRef = this.dialog.open(PersonDetailsDialogComponent, {
      width: '70vw',
      data: {
        nodeData: data,
        selectedLanguage: this.selectedLanguage,
        dialogType: this.dialogType
      },
    });

    this.currentDialogRef.closed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentDialogRef = null;
      });
  }

  public reloadUnity() {
    // Close any open dialog so it isn't orphaned across the reload.
    this.currentDialogRef?.close();

    // Show loading message
    this.isUnityLoading = true;
    this.loadingMessage = 'Refreshing tree view...';

    // Destroy current instance
    if (this.unityInstance) {
      try {
        this.unityInstance.Quit();
      } catch (e) {
        console.error('Error quitting Unity:', e);
      }
      this.unityInstance = null;
    }

    // Wait a bit for cleanup, then reinitialize. The build is served from
    // IndexedDB (see cacheControl), so this no longer re-downloads ~20MB.
    setTimeout(() => {
      this.initializeUnity();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.unityInstance) {
      this.unityInstance.Quit();
      this.unityInstance = null;
    }

    this.currentDialogRef?.close();

    // Remove the global callback so the destroyed component (and everything it
    // closes over) can be garbage collected.
    if ((window as any).onUnityMessage) {
      delete (window as any).onUnityMessage;
    }
  }
}
