import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { FamilyTreeService } from '../../../services/family-tree.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { Subject, throttleTime } from 'rxjs';
import { TranslationService } from '../../../services/translation.service';

declare const createUnityInstance: any;

@Component({
  selector: 'app-unity-container',
  imports: [],
  templateUrl: './unity-container.component.html',
  styleUrl: './unity-container.component.scss',
  standalone: true
})
export class UnityContainerComponent {
  @ViewChild('unityCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private destroyRef = inject(DestroyRef);
  private dialog = inject(Dialog);
  private translationService = inject(TranslationService);

  
  private unityInstance: any;
  private clickSubject = new Subject<any>();
  private selectedLanguage: string = EngLang;
  private memoryCheckInterval: any;
  private memoryWarningThreshold = 0.85; // 85% of heap limit

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
      this.startMemoryMonitoring();
    });
    
    // Set up global callback for Unity messages
    (window as any).onUnityMessage = this.handleUnityMessage.bind(this);

    this.clickSubject.pipe(
      throttleTime(300, undefined, { leading: true, trailing: false })
    ).subscribe((data: UnityMessage) => {
      // console.log('✅ Click passed throttle, processing:', data);
      this.processClick(data);
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
    
    createUnityInstance(canvas, {
      dataUrl: "assets/unity/Build/Build.data.unityweb",
      frameworkUrl: "assets/unity/Build/Build.framework.js.unityweb",
      codeUrl: "assets/unity/Build/Build.wasm.unityweb",
      streamingAssetsUrl: "StreamingAssets",
      companyName: "iii",
      productName: "Generation_Tree",
      productVersion: "0.1.0",
      // Increase memory allocation
      initialMemory: 512 * 1024 * 1024,  // 512MB (default is 256MB)
      maximumMemory: 1024 * 1024 * 1024  // 1GB max growth
    }, (progress: number) => {
      this.loadingProgress = Math.round(progress * 100);
    }).then((unityInstance: any) => {
      this.unityInstance = unityInstance;
      this.isUnityLoading = false;
    }).catch((message: string) => {
      console.error('Unity initialization failed:', message);
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
    const dialogRef = this.dialog.open(PersonDetailsDialogComponent, {
      width: '70vw',
      data: {
        nodeData: data,
        selectedLanguage: this.selectedLanguage,
        dialogType: this.dialogType
      },
    });

    dialogRef.closed.subscribe(result => {
      // console.log('The dialog was closed');
    });
  }

  private startMemoryMonitoring() {
    if (!(performance as any).memory) {
      console.warn('Memory monitoring not available in this browser');
      return;
    }

    this.memoryCheckInterval = setInterval(() => {
      const memory = (performance as any).memory;
      const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      console.log('Memory usage:', {
        used: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        limit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
        percentage: (usedRatio * 100).toFixed(2) + '%'
      });

      // If approaching memory limit, warn user
      if (usedRatio > this.memoryWarningThreshold) {
        console.warn('⚠️ Memory usage critical! Reloading Unity...');
        this.reloadUnity();
      }
    }, 5000); // Check every 5 seconds
  }

  public reloadUnity() {
    // Clear the interval to prevent multiple reloads
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

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

    // Wait a bit for cleanup, then reinitialize
    setTimeout(() => {
      this.initializeUnity();
      this.startMemoryMonitoring();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.unityInstance) {
      this.unityInstance.Quit();
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }
}
