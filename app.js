const progressEl = document.getElementById('progress');
const statusEl = document.getElementById('status');
const quizTitleEl = document.getElementById('quizTitle');
const startCardEl = document.getElementById('startCard');
const reviewCardEl = document.getElementById('reviewCard');
const reviewListEl = document.getElementById('reviewList');
const startFormEl = document.getElementById('startForm');
const questionCountInputEl = document.getElementById('questionCountInput');
const questionCardEl = document.getElementById('questionCard');
const questionTextEl = document.getElementById('questionText');
const questionImageEl = document.getElementById('questionImage');
const answersFormEl = document.getElementById('answersForm');
const actionButtonEl = document.getElementById('actionButton');

function setStatus(message, kind = 'neutral') {
  statusEl.textContent = message;
  statusEl.classList.remove('correct', 'incorrect');
  if (kind === 'correct') {
    statusEl.classList.add('correct');
  } else if (kind === 'incorrect') {
    statusEl.classList.add('incorrect');
  }
}

let questions = [];
let allQuestions = [];
let wrongAnswers = [];
let lastRequestedCount = null;
let quizDefaultCount = null;
let quizStartTime = null;
let currentIndex = 0;
let score = 0;
let revealed = false;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function normalizeQuestion(raw) {
  const hasImage = typeof raw.imageUrl === 'string' && raw.imageUrl.trim().length > 0;
  return {
    text: typeof raw.text === 'string' ? raw.text : '',
    imageUrl: hasImage ? raw.imageUrl.trim() : null,
    answers: shuffle(
      (Array.isArray(raw.answers) ? raw.answers : [])
        .filter((a) => a && typeof a.text === 'string')
        .map((a) => ({ text: a.text, isCorrect: Boolean(a.isCorrect) }))
    ),
  };
}

function showStartCard() {
  const maxQuestions = allQuestions.length;

  questions = [];
  wrongAnswers = [];
  currentIndex = 0;
  score = 0;
  revealed = false;
  reviewCardEl.hidden = true;

  progressEl.textContent = `Anzahl der Fragen wählen (1–${maxQuestions})`;
  questionCardEl.hidden = true;
  startCardEl.hidden = false;
  actionButtonEl.disabled = false;
  actionButtonEl.textContent = 'Starten';

  questionCountInputEl.min = '1';
  questionCountInputEl.max = String(maxQuestions);
  const defaultCount = lastRequestedCount !== null ? lastRequestedCount : (quizDefaultCount !== null ? quizDefaultCount : maxQuestions);
  questionCountInputEl.value = String(Math.min(defaultCount, maxQuestions));
  questionCountInputEl.focus();
  setStatus('');
}

function startQuizWithCount(requestedCount) {
  questions = shuffle([...allQuestions]).slice(0, requestedCount);
  wrongAnswers = [];
  currentIndex = 0;
  score = 0;
  revealed = false;
  reviewCardEl.hidden = true;

  startCardEl.hidden = true;
  questionCardEl.hidden = false;
  actionButtonEl.disabled = false;
  actionButtonEl.textContent = 'Antwort bestätigen';
  setStatus('');
  quizStartTime = Date.now();

  renderQuestion();
}

async function loadQuiz(quiz) {
  quizDefaultCount = (typeof quiz.defaultCount === 'number' && quiz.defaultCount > 0) ? quiz.defaultCount : null;
  document.title = quiz.title + ' Quiz';
  quizTitleEl.textContent = quiz.title + ' Quiz';
  progressEl.textContent = 'Fragen werden geladen...';

  try {
    const quizFilePath = 'data/' + quiz.file;
    const response = await fetch(quizFilePath, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Datei konnte nicht geladen werden: ${quizFilePath} (${response.status})`);
    }

    const rawData = await response.json();
    allQuestions = shuffle(
      (Array.isArray(rawData) ? rawData : [])
        .map(normalizeQuestion)
        .filter((q) => q.answers.length > 0)
    );

    if (!allQuestions.length) {
      throw new Error('Keine gültigen Fragen in der Datei gefunden.');
    }

    showStartCard();
  } catch (err) {
    startCardEl.hidden = true;
    questionCardEl.hidden = true;
    actionButtonEl.disabled = true;
    progressEl.textContent = 'Quiz konnte nicht gestartet werden';
    setStatus(`${err.message} Starte die App über einen lokalen Server, z. B. 'python -m http.server'.`);
  }
}

async function init() {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const response = await fetch('data/config.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Konfiguration konnte nicht geladen werden (${response.status})`);
    }

    const quizzes = await response.json();
    const active = (Array.isArray(quizzes) ? quizzes : []).filter((q) => q.active !== false);
    const quiz = id ? active.find((q) => q.id === id) : active[0];

    if (!quiz) {
      window.location.replace('index.html');
      return;
    }

    await loadQuiz(quiz);
  } catch (err) {
    questionCardEl.hidden = true;
    actionButtonEl.disabled = true;
    progressEl.textContent = 'Fehler beim Laden';
    setStatus(`${err.message} Starte die App über einen lokalen Server, z. B. 'python -m http.server'.`);
  }
}

function renderQuestion() {
  const q = questions[currentIndex];
  revealed = false;

  progressEl.textContent = `Frage ${currentIndex + 1} / ${questions.length} | Punkte: ${score}`;
  questionTextEl.textContent = q.text || '(Kein Fragetext)';

  if (typeof q.imageUrl === 'string' && q.imageUrl.length > 0) {
    questionImageEl.src = q.imageUrl;
    questionImageEl.hidden = false;
  } else {
    questionImageEl.hidden = true;
    questionImageEl.removeAttribute('src');
  }

  answersFormEl.innerHTML = '';

  q.answers.forEach((answer, idx) => {
    const row = document.createElement('label');
    row.className = 'answer-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'answer';
    checkbox.value = String(idx);

    const text = document.createElement('span');
    text.textContent = answer.text;

    row.appendChild(checkbox);
    row.appendChild(text);
    answersFormEl.appendChild(row);
  });

  actionButtonEl.textContent = 'Antwort bestätigen';
  setStatus('');
}

function revealCurrentQuestion() {
  const q = questions[currentIndex];
  const answerRows = Array.from(answersFormEl.querySelectorAll('.answer-item'));
  const selected = new Set(
    Array.from(answersFormEl.querySelectorAll('input[name="answer"]:checked')).map(
      (el) => Number(el.value)
    )
  );

  const correct = new Set();
  q.answers.forEach((a, idx) => {
    if (a.isCorrect) {
      correct.add(idx);
    }
  });

  let exactMatch = selected.size === correct.size;
  if (exactMatch) {
    for (const idx of selected) {
      if (!correct.has(idx)) {
        exactMatch = false;
        break;
      }
    }
  }

  if (exactMatch) {
    score += 1;
  } else {
    wrongAnswers.push({ q, selected: new Set(selected) });
  }

  answerRows.forEach((row, idx) => {
    const cb = row.querySelector('input');
    cb.disabled = true;

    if (correct.has(idx)) {
      row.classList.add('correct');
    } else if (!exactMatch) {
      row.classList.add('incorrect');
    }
  });

  progressEl.textContent = `Frage ${currentIndex + 1} / ${questions.length} | Punkte: ${score}`;
  actionButtonEl.textContent =
    currentIndex + 1 >= questions.length ? 'Quiz beenden' : 'Nächste Frage';
  setStatus(exactMatch ? 'Richtig' : 'Falsch', exactMatch ? 'correct' : 'incorrect');
  revealed = true;
}

function renderReview() {
  if (!wrongAnswers.length) {
    reviewCardEl.hidden = true;
    return;
  }

  reviewListEl.innerHTML = '';

  wrongAnswers.forEach(({ q, selected }, i) => {
    const entry = document.createElement('div');
    entry.className = 'review-entry';

    const qText = document.createElement('p');
    qText.className = 'review-question';
    qText.textContent = `${i + 1}. ${q.text || '(Kein Fragetext)'}`;
    entry.appendChild(qText);

    if (q.imageUrl) {
      const img = document.createElement('img');
      img.src = q.imageUrl;
      img.className = 'question-image';
      img.alt = 'Fragenillustration';
      entry.appendChild(img);
    }

    q.answers.forEach((answer, idx) => {
      const row = document.createElement('div');
      row.className = 'review-answer';
      if (answer.isCorrect) {
        row.classList.add('correct');
      } else if (selected.has(idx)) {
        row.classList.add('incorrect');
      }
      row.textContent = answer.text;
      entry.appendChild(row);
    });

    reviewListEl.appendChild(entry);
  });

  reviewCardEl.hidden = false;
}

function nextQuestionOrFinish() {
  currentIndex += 1;
  if (currentIndex >= questions.length) {
    const elapsed = Date.now() - quizStartTime;
    const totalSec = Math.round(elapsed / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const timeStr = minutes > 0
      ? `${minutes} Min. ${seconds} Sek.`
      : `${seconds} Sek.`;
    const percent = ((score / questions.length) * 100).toFixed(1);
    questionCardEl.hidden = true;
    actionButtonEl.disabled = false;
    actionButtonEl.textContent = 'Neu starten';
    progressEl.textContent = `Endergebnis: ${score} / ${questions.length}`;
    setStatus(`Quiz beendet. Ergebnis: ${percent}% (${score} / ${questions.length} richtig) – Zeit: ${timeStr}`);
    renderReview();
    return;
  }
  renderQuestion();
}

actionButtonEl.addEventListener('click', () => {
  if (!questions.length) {
    startFormEl.requestSubmit();
    return;
  }

  if (!revealed) {
    revealCurrentQuestion();
  } else if (currentIndex >= questions.length) {
    showStartCard();
  } else {
    nextQuestionOrFinish();
  }
});

startFormEl.addEventListener('submit', (event) => {
  event.preventDefault();

  const maxQuestions = allQuestions.length;
  const requestedCount = Number.parseInt(questionCountInputEl.value, 10);
  if (!Number.isInteger(requestedCount) || requestedCount < 1 || requestedCount > maxQuestions) {
    setStatus(`Bitte gib eine ganze Zahl zwischen 1 und ${maxQuestions} ein.`, 'incorrect');
    questionCountInputEl.focus();
    return;
  }

  lastRequestedCount = requestedCount;
  startQuizWithCount(requestedCount);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.repeat) {
    return;
  }
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
  }
  if (actionButtonEl.disabled) {
    return;
  }

  event.preventDefault();
  actionButtonEl.click();
});

questionImageEl.addEventListener('error', () => {
  questionImageEl.hidden = true;
  setStatus('Das Bild für diese Frage konnte nicht geladen werden.');
});

init();
