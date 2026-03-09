import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    signal,
    viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Question, StatusMessage, WrongAnswer } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';
import { QuizStartComponent } from './components/quiz-start/quiz-start';
import { QuizSelectComponent } from './components/quiz-select/quiz-select';
import { QuizQuestionComponent } from './components/quiz-question/quiz-question';
import { QuizFinishedComponent } from './components/quiz-finished/quiz-finished';

type QuizView = 'start' | 'select' | 'question' | 'finished';

@Component({
    selector: 'app-quiz',
    templateUrl: './quiz.html',
    styleUrl: './quiz.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, QuizStartComponent, QuizSelectComponent, QuizQuestionComponent, QuizFinishedComponent],
    host: { '(document:keydown)': 'onKeydown($event)' },
})
export class QuizComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly quizService = inject(QuizService);

    private readonly startRef = viewChild(QuizStartComponent);
    private readonly selectRef = viewChild(QuizSelectComponent);
    private readonly questionRef = viewChild(QuizQuestionComponent);

    protected readonly loading = signal(true);
    protected readonly loadError = signal<string | null>(null);
    protected readonly quizTitle = signal('Quiz');
    protected readonly quizId = signal('');

    protected readonly allQuestions = signal<Question[]>([]);
    private readonly quizDefaultCount = signal<number | null>(null);

    protected readonly view = signal<QuizView>('start');
    protected readonly questions = signal<Question[]>([]);
    protected readonly currentIndex = signal(0);
    protected readonly score = signal(0);
    protected readonly revealed = signal(false);
    protected readonly wrongAnswers = signal<WrongAnswer[]>([]);
    private readonly startedFromSelect = signal(false);
    private readonly lastRequestedCount = signal<number | null>(null);
    private readonly quizStartTime = signal<number>(0);

    protected readonly selectedAnswers = signal<boolean[]>([]);
    protected readonly selectedIndices = signal<Set<number>>(new Set());

    protected readonly maxQuestions = computed(() => this.allQuestions().length);

    protected readonly defaultCount = computed(() => {
        const last = this.lastRequestedCount();
        const def = this.quizDefaultCount();
        const max = this.maxQuestions();
        const base = last !== null ? last : (def !== null ? def : max);
        return Math.min(base, max);
    });

    protected readonly isLastQuestion = computed(
        () => this.currentIndex() + 1 >= this.questions().length
    );

    protected readonly currentQuestion = computed(() => {
        const qs = this.questions();
        const idx = this.currentIndex();
        return qs[idx] ?? null;
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

    protected readonly questionStatusMessage = signal<StatusMessage>({ text: '', kind: 'neutral' });
    protected readonly finishedStatusMessage = signal<StatusMessage>({ text: '', kind: 'neutral' });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        this.quizId.set(id);

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
                        setTimeout(() => this.startRef()?.focus(), 0);
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

    protected openSelectCard(): void {
        if (this.selectedIndices().size === 0) {
            this.selectedIndices.set(new Set(this.allQuestions().map((_, i) => i)));
        }
        this.view.set('select');
        setTimeout(() => this.selectRef()?.focus(), 0);
    }

    protected backToStart(): void {
        this.view.set('start');
        setTimeout(() => this.startRef()?.focus(), 0);
    }

    protected onStart(count: number): void {
        this.lastRequestedCount.set(count);
        const subset = this.quizService.shuffle([...this.allQuestions()]).slice(0, count);
        this.beginQuiz(subset, false);
    }

    protected onStartWithSelected(): void {
        const subset = this.quizService.shuffle(
            Array.from(this.selectedIndices()).map(i => this.allQuestions()[i])
        );
        this.beginQuiz(subset, true);
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
        this.questionStatusMessage.set({ text: '', kind: 'neutral' });
        this.selectedAnswers.set(questionsSubset[0]?.answers.map(() => false) ?? []);
        this.view.set('question');
    }

    protected toggleAnswer(answerIdx: number): void {
        this.selectedAnswers.update(arr => arr.map((v, i) => (i === answerIdx ? !v : v)));
    }

    protected onConfirm(): void {
        this.revealCurrentAnswer();
    }

    protected onNext(): void {
        this.goToNextOrFinish();
    }

    protected onRestart(): void {
        if (this.startedFromSelect()) {
            this.openSelectCard();
        } else {
            this.view.set('start');
            setTimeout(() => this.startRef()?.focus(), 0);
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

        this.questionStatusMessage.set({
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
            this.questionStatusMessage.set({ text: '', kind: 'neutral' });
            this.selectedAnswers.set(nextQ.answers.map(() => false));
        }
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Enter' || event.repeat) return;
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const target = event.target as HTMLElement | null;
        if (target?.tagName === 'BUTTON' || target?.tagName === 'A') return;
        event.preventDefault();
        const v = this.view();
        if (v === 'start') this.startRef()?.attemptStart();
        else if (v === 'select') this.selectRef()?.attemptStart();
        else if (v === 'question') this.questionRef()?.onAction();
        else if (v === 'finished') this.onRestart();
    }

    private finishQuiz(): void {
        const elapsed = Date.now() - this.quizStartTime();
        const totalSec = Math.round(elapsed / 1000);
        const minutes = Math.floor(totalSec / 60);
        const seconds = totalSec % 60;
        const timeStr = minutes > 0 ? `${minutes} Min. ${seconds} Sek.` : `${seconds} Sek.`;
        const percent = ((this.score() / this.questions().length) * 100).toFixed(1);
        this.finishedStatusMessage.set({
            text: `Quiz beendet. Ergebnis: ${percent}% (${this.score()} / ${this.questions().length} richtig) – Zeit: ${timeStr}`,
            kind: 'neutral',
        });
        this.view.set('finished');
    }
}
