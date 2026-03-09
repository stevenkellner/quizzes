import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HomeComponent } from './home';
import type { QuizConfig } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';

const mockConfigs: QuizConfig[] = [
    { id: 'mta', title: 'MTA Basics', file: 'mta.json', active: true },
    { id: 'azure', title: 'Azure 900', file: 'az900.json', active: true },
];

describe('HomeComponent', () => {
    function setupTestBed(loadConfig: () => ReturnType<QuizService['loadConfig']>) {
        TestBed.configureTestingModule({
            imports: [HomeComponent],
            providers: [
                provideRouter([]),
                { provide: QuizService, useValue: { loadConfig } },
            ],
        });
    }

    it('creates successfully', async () => {
        setupTestBed(() => of(mockConfigs));
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(HomeComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('shows loading state before detectChanges', async () => {
        setupTestBed(() => of(mockConfigs));
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(HomeComponent);
        // ngOnInit hasn't run yet – loading signal is true
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.loading()).toBe(true);
    });

    it('renders the quiz list after loading succeeds', async () => {
        setupTestBed(() => of(mockConfigs));
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(HomeComponent);
        fixture.detectChanges();
        const links = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.quiz-link');
        expect(links).toHaveLength(2);
        expect(links[0].textContent?.trim()).toBe('MTA Basics');
        expect(links[1].textContent?.trim()).toBe('Azure 900');
    });

    it('renders a "Fragenübersicht" link for each quiz', async () => {
        setupTestBed(() => of(mockConfigs));
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(HomeComponent);
        fixture.detectChanges();
        const fragenLinks = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.quiz-fragen-link');
        expect(fragenLinks).toHaveLength(2);
    });

    it('shows "Keine Quizze verfügbar" for an empty config', async () => {
        setupTestBed(() => of([]));
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(HomeComponent);
        fixture.detectChanges();
        const muted = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.muted');
        expect(muted?.textContent).toContain('Keine Quizze');
    });

    it('shows an error message when the config fails to load', async () => {
        setupTestBed(() => throwError(() => new Error('Network error')));
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(HomeComponent);
        fixture.detectChanges();
        const alert = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role=alert]');
        expect(alert).not.toBeNull();
    });

    it('hides the loading indicator after data loads', async () => {
        setupTestBed(() => of(mockConfigs));
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(HomeComponent);
        fixture.detectChanges();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.loading()).toBe(false);
    });
});
