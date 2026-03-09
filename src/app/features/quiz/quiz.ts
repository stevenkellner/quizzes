import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    inject,
    OnInit,
    signal,
    viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Question, WrongAnswer } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';

type QuizView = 'start' | 'select' | 'question' | 'finished';
type StatusKind = 'neutral' | 'correct' | 'incorrect';

@Component({
    selector: 'app-quiz',
    templateUrl: './quiz.html',
    styleUrl: './quiz.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink],
})
export class QuizComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly quizService = inject(QuizService);

    private readonly questionCountInputRef = viewChild<ElementRef<HTMLInputElement>>('questionCountInput');
    private readonly selectSearchRef = viewChild<ElementRef<HTMLInputElement>>('selectSearch');
    private readonly answersFormRef = viewChild<ElementRef<HTMLFormElement>>('answersForm');

    protected readonly loading = signal(true);
    protected readonly loadError = signal<string | null>(null);
    protected readonly quizTitle = signal('Quiz');

    protected readonly allQuestions = signal<Question[]>([]);
    protected readonly quizDefaultCount = signal<number | null>(null);

    protected readonly view = signal<QuizView>('start');
    protected readonly questions = signal<Question[]>([]);
    protected readonly currentIndex = signal(0);
    protected readonly score = signal(0);
    protected readonly revealed = signal(false);
    protected readonly wrongAnswers = signal<WrongAnswer[]>([]);
    protected readonly startedFromSelect = signal(false);
    protected readonly lastRequestedCount = signal<number | null>(null);
    protected readonly quizStartTime = signal<number>(0);

    // Tracks which answer checkboxes are checked (one boolean per answer option)
    protected readonly selectedAnswers = signal<boolean[]>([]);

    protected readonly selectedIndices = signal<Set<number>>(new Set());
    protected readonly selectSearchTerm = signal('');

    protected readonly maxQuestions = computed(() => this.allQuestions().length);

    protected readonly defaultCount = computed(() => {
        const last = this.lastRequestedCount();
        const def = this.quizDefaultCount();
        const max = this.maxQuestions();
        const base = last !== null ? last : (def !== null ? def : max);
        return Math.min(base, max);
    });

    protected readonly progressText = computed(() => {
        const v = this.view();
        if (v === 'start') return `Anzahl der Fragen wählen (1–${this.maxQuestions()})`;
        if (v === 'select') return 'Fragen für das Quiz auswählen';
        if (v === 'question') {
            return `Frage ${this.currentIndex() + 1} / ${this.questions().length} | Punkte: ${this.score()}`;
        }
        return `Endergebnis: ${this.score()} / ${this.questions().length}`;
    });

    protected readonly actionButtonText = computed(() => {
        const v = this.view();
        if (v === 'start') return 'Starten';
        if (v === 'select') return 'Quiz mit Auswahl starten';
        if (v === 'finished') return 'Neu starten';
        if (!this.revealed()) return 'Antwort bestätigen';
        return this.currentIndex() + 1 >= this.questions().length ? 'Quiz beenden' : 'Nächste Frage';
    });

    protected readonly actionButtonDisabled = computed(() =>
        this.view() === 'select' ? this.selectedIndices().size === 0 : false
    );

    protected readonly currentQuestion = computed(() => {
        const qs = this.questions();
        const idx = this.currentIndex();
        return qs[idx] ?? null;
    });

    protected readonly selectInfoText = computed(() =>
        `${this.selectedIndices().size} von ${this.allQuestions().length} Fragen ausgewählt`
    );

    protected readonly filteredSelectEntries = computed(() => {
        const term = this.selectSearchTerm().trim().toLowerCase();
        return this.allQuestions()
            .map((q, idx) => ({ q, idx }))
            .filter(({ q }) => {
                if (!term) return true;
                if (q.text.toLowerCase().includes(term)) return true;
                return q.answers.some(a => a.text.toLowerCase().includes(term));
            });
    });

    protected readonly statusMessage = signal<{ text: string; kind: StatusKind }>(
        { text: '', kind: 'neutral' }
    );

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        this.quizService.loadConfig().subscribe({
            next: configs => {
                const quiz = id ? configs.find(q => q.id === id) : configs[0];
                if (!quiz) {
                    this.loadError.set('Quiz nicht gefunden.');
                    this.loading.set(false);
                    return;
                }

                this.quizTitle.set(quiz.title + ' Quiz');
                this.quizDefaultCount.set(
                    typeof quiz.defaultCount === 'number' && quiz.defaultCount > 0 ? quiz.defaultCount : null
                );

                this.quizService.loadQuestions(quiz.file).subscribe({
                    next: questions => {
                        this.allQuestions.set(this.quizService.shuffle(questions));
                        this.loading.set(false);
                        this.view.set('start');
                        setTimeout(() => this.questionCountInputRef()?.nativeElement.focus(), 0);
                    },
                    error: (err: unknown) => {
                        this.loadError.set(err instanceof Error ? err.message : 'Fragen konnten nicht geladen werden.');
                        this.loading.set(false);
                    },
                });
            },
            error: (err: unknown) => {
                this.loadError.set(err instanceof Error ? err.message : 'Konfiguration konnte nicht geladen werden.');
                this.loading.set(false);
            },
        });
    }

    protected isIndexSelected(idx: number): boolean {
        return this.selectedIndices().has(idx);
    }

    protected toggleSelectEntry(idx: number): void {
        const set = new Set(this.selectedIndices());
        if (set.has(idx)) {
            set.delete(idx);
        } else {
            set.add(idx);
        }
        this.selectedIndices.set(set);
    }

    protected selectAll(): void {
        this.selectedIndices.set(new Set(this.allQuestions().map((_, i) => i)));
    }

    protected deselectAll(): void {
        this.selectedIndices.set(new Set());
    }

    protected onSearchInput(value: string): void {
        this.selectSearchTerm.set(value);
    }

    protected openSelectCard(): void {
        if (this.selectedIndices().size === 0) {
            this.selectedIndices.set(new Set(this.allQuestions().map((_, i) => i)));
        }
        this.selectSearchTerm.set('');
        this.view.set('select');
        setTimeout(() => this.selectSearchRef()?.nativeElement.focus(), 0);
    }

    protected backToStart(): void {
        this.view.set('start');
        setTimeout(() => this.questionCountInputRef()?.nativeElement.focus(), 0);
    }

    private beginQuiz(questionsSubset: Question[], fromSelect: boolean): void {
        this.questions.set(questionsSubset.map(q => ({
            ...q,
            answers: this.quizService.shuffle([...q.answers]),
        })));
        this.wrongAnswers.set([]);
        this.currentIndex.set(0);
        this.score.set(0);
        this.revealed.set(false);
        this.startedFromSelect.set(fromSelect);
        this.quizStartTime.set(Date.now());
        this.statusMessage.set({ text: '', kind: 'neutral' });
        this.selectedAnswers.set(questionsSubset[0]?.answers.map(() => false) ?? []);
        this.view.set('question');
        setTimeout(() => {
            this.answersFormRef()?.nativeElement.querySelector<HTMLElement>('label')?.focus();
        }, 0);
    }

    private startQuizWithCount(count: number): void {
        const subset = this.quizService.shuffle([...this.allQuestions()]).slice(0, count);
        this.beginQuiz(subset, false);
    }

    private startQuizWithSelected(): void {
        const subset = this.quizService.shuffle(
            Array.from(this.selectedIndices()).map(i => this.allQuestions()[i])
        );
        this.beginQuiz(subset, true);
    }

    protected toggleAnswer(answerIdx: number): void {
        this.selectedAnswers.update(arr => arr.map((v, i) => (i === answerIdx ? !v : v)));
    }

    protected onActionClick(): void {
        const v = this.view();

        if (v === 'start') {
            const input = this.questionCountInputRef()?.nativeElement;
            if (!input) return;
            const max = this.maxQuestions();
            const requested = Number.parseInt(input.value, 10);
            if (!Number.isInteger(requested) || requested < 1 || requested > max) {
                this.statusMessage.set({
                    text: `Bitte gib eine ganze Zahl zwischen 1 und ${max} ein.`,
                    kind: 'incorrect',
                });
                input.focus();
                return;
            }
            this.lastRequestedCount.set(requested);
            this.startQuizWithCount(requested);
            return;
        }

        if (v === 'select') {
            if (this.selectedIndices().size === 0) {
                this.statusMessage.set({ text: 'Bitte wähle mindestens eine Frage aus.', kind: 'incorrect' });
                return;
            }
            this.startQuizWithSelected();
            return;
        }

        if (v === 'finished') {
            if (this.startedFromSelect()) {
                this.openSelectCard();
            } else {
                this.view.set('start');
                setTimeout(() => this.questionCountInputRef()?.nativeElement.focus(), 0);
            }
            return;
        }

        // question view
        if (!this.revealed()) {
            this.revealCurrentAnswer();
        } else {
            this.goToNextOrFinish();
        }
    }

    private revealCurrentAnswer(): void {
        const q = this.currentQuestion();
        if (!q) return;

        const selected = new Set(
            this.selectedAnswers()
                .map((checked, i) => (checked ? i : -1))
                .filter((i): i is number => i >= 0)
        );

        const correct = new Set(
            q.answers
                .map((a, i) => (a.isCorrect ? i : -1))
                .filter((i): i is number => i >= 0)
        );

        let exactMatch = selected.size === correct.size;
        if (exactMatch) {
            for (const idx of selected) {
                if (!correct.has(idx)) { exactMatch = false; break; }
            }
        }

        if (exactMatch) {
            this.score.update(s => s + 1);
        } else {
            this.wrongAnswers.update(wa => [...wa, { question: q, selected }]);
        }

        this.statusMessage.set({
            text: exactMatch ? 'Richtig' : 'Falsch',
            kind: exactMatch ? 'correct' : 'incorrect',
        });
        this.revealed.set(true);
    }

    private goToNextOrFinish(): void {
        const nextIndex = this.currentIndex() + 1;
        if (nextIndex >= this.questions().length) {
            this.finishQuiz();
        } else {
            const nextQ = this.questions()[nextIndex];
            this.currentIndex.set(nextIndex);
            this.revealed.set(false);
            this.statusMessage.set({ text: '', kind: 'neutral' });
            this.selectedAnswers.set(nextQ.answers.map(() => false));
            setTimeout(() => {
                this.answersFormRef()?.nativeElement.querySelector<HTMLElement>('label')?.focus();
            }, 0);
        }
    }

    private finishQuiz(): void {
        const elapsed = Date.now() - this.quizStartTime();
        const totalSec = Math.round(elapsed / 1000);
        const minutes = Math.floor(totalSec / 60);
        const seconds = totalSec % 60;
        const timeStr = minutes > 0 ? `${minutes} Min. ${seconds} Sek.` : `${seconds} Sek.`;
        const percent = ((this.score() / this.questions().length) * 100).toFixed(1);
        this.statusMessage.set({
            text: `Quiz beendet. Ergebnis: ${percent}% (${this.score()} / ${this.questions().length} richtig) – Zeit: ${timeStr}`,
            kind: 'neutral',
        });
        this.view.set('finished');
    }

    protected onImageError(img: HTMLImageElement): void {
        img.hidden = true;
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Enter' || event.repeat) return;
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (this.actionButtonDisabled()) return;
        event.preventDefault();
        this.onActionClick();
    }
}
