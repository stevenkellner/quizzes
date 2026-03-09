export interface QuizConfig {
    id: string;
    title: string;
    file: string;
    defaultCount?: number;
    active?: boolean;
}

export interface Answer {
    text: string;
    isCorrect: boolean;
}

export interface Question {
    text: string;
    imageUrl: string | null;
    answers: Answer[];
}

export interface WrongAnswer {
    question: Question;
    selected: Set<number>;
}
