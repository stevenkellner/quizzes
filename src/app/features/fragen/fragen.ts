import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Question } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';

@Component({
    selector: 'app-fragen',
    templateUrl: './fragen.html',
    styleUrl: './fragen.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink],
})
export class FragenComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly quizService = inject(QuizService);

    protected readonly loading = signal(true);
    protected readonly loadError = signal<string | null>(null);
    protected readonly pageTitle = signal('Fragenübersicht');
    protected readonly allQuestions = signal<Question[]>([]);
    protected readonly searchTerm = signal('');

    protected readonly filteredQuestions = computed(() => {
        const term = this.searchTerm().trim().toLowerCase();
        const questions = this.allQuestions();
        if (!term) return questions;
        return questions.filter(q => {
            if (q.text.toLowerCase().includes(term)) return true;
            return q.answers.some(a => a.text.toLowerCase().includes(term));
        });
    });

    protected readonly searchInfoText = computed(() => {
        const term = this.searchTerm().trim();
        const total = this.allQuestions().length;
        const visible = this.filteredQuestions().length;
        return term ? `${visible} von ${total} Fragen angezeigt` : `${total} Fragen insgesamt`;
    });

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

                this.pageTitle.set(quiz.title + ' – Fragenübersicht');

                this.quizService.loadQuestions(quiz.file).subscribe({
                    next: questions => {
                        this.allQuestions.set(questions);
                        this.loading.set(false);
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

    protected onSearchInput(value: string): void {
        this.searchTerm.set(value);
    }

    protected highlight(text: string, term: string): string {
        if (!term.trim()) return this.escapeHtml(text);
        const escaped = this.escapeHtml(text);
        const escapedTerm = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return escaped.replace(new RegExp(`(${escapedTerm})`, 'gi'), '<mark>$1</mark>');
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
