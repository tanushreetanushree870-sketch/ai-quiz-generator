/**
 * AI QUIZ MASTER — Frontend Application Controller
 * Handles client-side routing, state, dynamic topic rendering,
 * secure API calls, quiz interaction, scoring, and answer review.
 */

// Application State
const state = {
  selectedSubject: "physics",
  selectedChapter: "Motion in a Straight Line",
  customChapter: "",
  selectedDifficulty: "medium",
  selectedCount: 5,

  // Active Quiz State
  currentQuiz: null,
  userAnswers: new Map(), // questionId -> selectedOption ('A'|'B'|'C'|'D')
  currentQuestionIndex: 0,
  isGenerating: false,
  isSubmitting: false,

  // Evaluation & Results
  lastResult: null,

  // Cache of fetched chapters by subject
  chaptersCache: new Map()
};

// DOM Selectors
const elements = {
  // Navigation & Indicator
  aiStatusIndicator: document.getElementById("ai-status-indicator"),
  aiStatusText: document.getElementById("ai-status-text"),
  navHome: document.getElementById("nav-home"),
  navCreate: document.getElementById("nav-create"),
  navFeatures: document.getElementById("nav-features"),
  navBrand: document.getElementById("nav-brand"),

  // Views
  viewHome: document.getElementById("view-home"),
  viewQuiz: document.getElementById("view-quiz"),
  viewResults: document.getElementById("view-results"),

  // Form Controls
  quizForm: document.getElementById("quiz-config-form"),
  subjectCards: document.querySelectorAll(".subject-card"),
  topicsGrid: document.getElementById("topics-grid"),
  chapterListTitle: document.getElementById("chapter-list-title"),
  customChapterInput: document.getElementById("custom-chapter-input"),
  btnApplyCustom: document.getElementById("btn-apply-custom"),
  btnClearCustom: document.getElementById("btn-clear-custom"),
  difficultyRadios: document.querySelectorAll('input[name="difficulty"]'),
  countRadios: document.querySelectorAll('input[name="count"]'),
  btnGenerate: document.getElementById("btn-generate-quiz"),
  generateStatusMsg: document.getElementById("generate-status-msg"),

  // Summary Elements
  summarySubject: document.getElementById("summary-subject"),
  summaryChapter: document.getElementById("summary-chapter"),
  summaryDifficulty: document.getElementById("summary-difficulty"),
  summaryCount: document.getElementById("summary-count"),

  // Errors
  errorSubject: document.getElementById("error-subject"),
  errorChapter: document.getElementById("error-chapter"),

  // Quiz Interface
  quizPageTitle: document.getElementById("quiz-page-title"),
  quizBadgeSubject: document.getElementById("quiz-badge-subject"),
  quizBadgeChapter: document.getElementById("quiz-badge-chapter"),
  quizBadgeDiff: document.getElementById("quiz-badge-diff"),
  quizBadgeModeText: document.getElementById("quiz-badge-mode-text"),
  btnAbortQuiz: document.getElementById("btn-abort-quiz"),
  progressCounter: document.getElementById("progress-question-counter"),
  progressPercentText: document.getElementById("progress-percent-text"),
  progressFill: document.getElementById("quiz-progress-fill"),
  currentQTag: document.getElementById("current-q-tag"),
  currentQStatus: document.getElementById("current-q-status"),
  questionTextContent: document.getElementById("question-text-content"),
  optionsContainer: document.getElementById("options-container"),
  btnPrevQ: document.getElementById("btn-prev-q"),
  btnNextQ: document.getElementById("btn-next-q"),
  btnSubmitQuiz: document.getElementById("btn-submit-quiz"),
  questionPalette: document.getElementById("question-palette"),

  // Modal
  unansweredModal: document.getElementById("unanswered-modal"),
  modalUnansweredCount: document.getElementById("modal-unanswered-count"),
  btnModalCancel: document.getElementById("btn-modal-cancel"),
  btnModalConfirm: document.getElementById("btn-modal-confirm"),

  // Results View
  resultsQuizMeta: document.getElementById("results-quiz-meta"),
  resultsPercentVal: document.getElementById("results-percent-val"),
  resultsFeedbackLabel: document.getElementById("results-feedback-label"),
  resultsStatCorrect: document.getElementById("results-stat-correct"),
  resultsStatIncorrect: document.getElementById("results-stat-incorrect"),
  resultsStatUnanswered: document.getElementById("results-stat-unanswered"),
  resultsStatTotal: document.getElementById("results-stat-total"),
  resultsReviewList: document.getElementById("results-review-list"),
  btnRetakeQuiz: document.getElementById("btn-retake-quiz"),
  btnNewQuiz: document.getElementById("btn-new-quiz"),
  btnBackHome: document.getElementById("btn-back-home"),

  // Toast Container
  toastContainer: document.getElementById("toast-container")
};

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", async () => {
  initEventListeners();
  await checkSystemHealth();
  await loadChaptersForSubject(state.selectedSubject);
  updateSelectionSummary();
  handleHashNavigation();
});

// Window hash navigation support
window.addEventListener("hashchange", handleHashNavigation);

function handleHashNavigation() {
  const hash = window.location.hash || "#home";
  if (hash === "#quiz") {
    if (!state.currentQuiz) {
      showToast("No active quiz in session. Create a quiz to begin!", "info");
      switchView("home");
      window.location.hash = "#home";
    } else {
      switchView("quiz");
    }
  } else if (hash === "#results") {
    if (!state.lastResult) {
      showToast("No quiz results available. Create a quiz first!", "info");
      switchView("home");
      window.location.hash = "#home";
    } else {
      switchView("results");
    }
  } else {
    switchView("home");
  }
}

function switchView(viewName) {
  elements.viewHome.style.display = viewName === "home" ? "block" : "none";
  elements.viewQuiz.style.display = viewName === "quiz" ? "block" : "none";
  elements.viewResults.style.display = viewName === "results" ? "block" : "none";

  // Update nav link styles
  elements.navHome.classList.toggle("active", viewName === "home");
  elements.navCreate.classList.toggle("active", viewName === "home" && window.location.hash === "#configure");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ================= SYSTEM HEALTH & CONFIG =================
async function checkSystemHealth() {
  try {
    const res = await fetch("/api/quiz/health");
    if (!res.ok) throw new Error("Health check failed");
    const data = await res.json();

    elements.aiStatusIndicator.classList.remove("online", "local");
    if (data.status === "available") {
      elements.aiStatusIndicator.classList.add("online");
      elements.aiStatusText.textContent = "Gemini AI Engine Online";
    } else if (data.status === "local_only") {
      elements.aiStatusIndicator.classList.add("local");
      elements.aiStatusText.textContent = "Local Bank Active (Offline)";
    } else {
      elements.aiStatusIndicator.classList.add("local");
      elements.aiStatusText.textContent = "System Degraded";
    }
  } catch (err) {
    elements.aiStatusIndicator.classList.add("local");
    elements.aiStatusText.textContent = "Local Bank Mode";
  }
}

// ================= EVENT LISTENERS =================
function initEventListeners() {
  // Subject Card Click and Keyboard
  elements.subjectCards.forEach(card => {
    card.addEventListener("click", () => handleSubjectSelect(card.dataset.subject));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSubjectSelect(card.dataset.subject);
      }
    });
  });

  // Custom Chapter Button
  elements.btnApplyCustom.addEventListener("click", handleApplyCustomChapter);
  elements.customChapterInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApplyCustomChapter();
    }
  });

  elements.btnClearCustom.addEventListener("click", handleClearCustomChapter);

  // Difficulty Radios
  elements.difficultyRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      state.selectedDifficulty = e.target.value;
      updateSelectionSummary();
    });
  });

  // Question Count Radios
  elements.countRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      state.selectedCount = parseInt(e.target.value, 10);
      updateSelectionSummary();
    });
  });

  // Generate Quiz Form Submit
  elements.quizForm.addEventListener("submit", handleGenerateQuizSubmit);

  // Quiz View Controls
  elements.btnPrevQ.addEventListener("click", () => navigateQuestion(state.currentQuestionIndex - 1));
  elements.btnNextQ.addEventListener("click", () => navigateQuestion(state.currentQuestionIndex + 1));
  elements.btnSubmitQuiz.addEventListener("click", handleQuizSubmissionPrompt);
  elements.btnAbortQuiz.addEventListener("click", handleAbortQuiz);

  // Modal Controls
  elements.btnModalCancel.addEventListener("click", () => {
    elements.unansweredModal.style.display = "none";
  });
  elements.btnModalConfirm.addEventListener("click", () => {
    elements.unansweredModal.style.display = "none";
    performQuizSubmission();
  });

  // Results View Controls
  elements.btnRetakeQuiz.addEventListener("click", handleRetakeQuiz);
  elements.btnNewQuiz.addEventListener("click", () => {
    state.currentQuiz = null;
    state.lastResult = null;
    window.location.hash = "#configure";
  });
  elements.btnBackHome.addEventListener("click", () => {
    state.currentQuiz = null;
    state.lastResult = null;
    window.location.hash = "#home";
  });
}

// ================= SUBJECT & CHAPTER LOGIC =================
async function handleSubjectSelect(subjectKey) {
  if (state.selectedSubject === subjectKey) return;

  state.selectedSubject = subjectKey;
  state.customChapter = "";
  elements.customChapterInput.value = "";
  elements.customChapterInput.classList.remove("active-custom");
  elements.btnClearCustom.style.display = "none";
  hideFieldError(elements.errorSubject);
  hideFieldError(elements.errorChapter);

  // Update card visuals
  elements.subjectCards.forEach(card => {
    const isSelected = card.dataset.subject === subjectKey;
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-checked", isSelected ? "true" : "false");
  });

  await loadChaptersForSubject(subjectKey);
  updateSelectionSummary();
}

async function loadChaptersForSubject(subjectKey) {
  elements.topicsGrid.innerHTML = `
    <div class="empty-topics-prompt">
      <div class="btn-spinner" style="display:inline-block; margin-right:8px;"></div>
      <span>Loading ${subjectKey} chapters...</span>
    </div>
  `;

  elements.chapterListTitle.textContent = `${subjectKey.toUpperCase()} CHAPTERS`;

  let chapters = state.chaptersCache.get(subjectKey);

  if (!chapters) {
    try {
      const res = await fetch(`/api/chapters/${subjectKey}`);
      if (!res.ok) throw new Error("Failed to fetch chapters");
      const data = await res.json();
      chapters = data.chapters || [];
      state.chaptersCache.set(subjectKey, chapters);
    } catch (err) {
      showToast("Unable to fetch chapters from server", "error");
      elements.topicsGrid.innerHTML = `
        <div class="empty-topics-prompt">
          <span>Failed to load chapters. Check server connectivity.</span>
        </div>
      `;
      return;
    }
  }

  renderTopics(chapters);
}

function renderTopics(chapters) {
  elements.topicsGrid.innerHTML = "";

  if (!chapters || chapters.length === 0) {
    elements.topicsGrid.innerHTML = `
      <div class="empty-topics-prompt">
        <span>No predefined chapters found for this subject.</span>
      </div>
    `;
    return;
  }

  // Set default chapter to first one if not set or incompatible
  const currentExists = chapters.some(c => c.name === state.selectedChapter);
  if (!state.customChapter && (!state.selectedChapter || !currentExists)) {
    state.selectedChapter = chapters[0].name;
  }

  chapters.forEach(chap => {
    const isSelected = !state.customChapter && state.selectedChapter === chap.name;

    const box = document.createElement("div");
    box.className = `topic-box ${isSelected ? "selected" : ""}`;
    box.tabIndex = 0;
    box.setAttribute("role", "radio");
    box.setAttribute("aria-checked", isSelected ? "true" : "false");

    const nameEl = document.createElement("div");
    nameEl.className = "topic-name";
    nameEl.textContent = chap.name;

    const descEl = document.createElement("div");
    descEl.className = "topic-desc";
    descEl.textContent = chap.description;

    box.appendChild(nameEl);
    box.appendChild(descEl);

    box.addEventListener("click", () => handleSelectTopic(chap.name));
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelectTopic(chap.name);
      }
    });

    elements.topicsGrid.appendChild(box);
  });
}

function handleSelectTopic(chapterName) {
  state.selectedChapter = chapterName;
  state.customChapter = "";
  elements.customChapterInput.value = "";
  elements.customChapterInput.classList.remove("active-custom");
  elements.btnClearCustom.style.display = "none";
  hideFieldError(elements.errorChapter);

  // Update topic cards selected class
  const allTopicBoxes = elements.topicsGrid.querySelectorAll(".topic-box");
  allTopicBoxes.forEach(box => {
    const isSelected = box.querySelector(".topic-name").textContent === chapterName;
    box.classList.toggle("selected", isSelected);
    box.setAttribute("aria-checked", isSelected ? "true" : "false");
  });

  updateSelectionSummary();
}

function handleApplyCustomChapter() {
  const val = elements.customChapterInput.value.trim();

  if (val.length < 2) {
    showFieldError(elements.errorChapter, "Custom chapter must contain at least 2 characters.");
    return;
  }

  if (val.length > 100) {
    showFieldError(elements.errorChapter, "Custom chapter name cannot exceed 100 characters.");
    return;
  }

  hideFieldError(elements.errorChapter);
  state.customChapter = val;
  state.selectedChapter = val;
  elements.customChapterInput.classList.add("active-custom");
  elements.btnClearCustom.style.display = "inline-flex";

  // Deselect topic boxes
  const allTopicBoxes = elements.topicsGrid.querySelectorAll(".topic-box");
  allTopicBoxes.forEach(box => {
    box.classList.remove("selected");
    box.setAttribute("aria-checked", "false");
  });

  showToast(`Custom chapter set: "${val}"`, "info");
  updateSelectionSummary();
}

function handleClearCustomChapter() {
  state.customChapter = "";
  elements.customChapterInput.value = "";
  elements.customChapterInput.classList.remove("active-custom");
  elements.btnClearCustom.style.display = "none";
  hideFieldError(elements.errorChapter);

  // Re-select first available topic
  const chapters = state.chaptersCache.get(state.selectedSubject);
  if (chapters && chapters.length > 0) {
    handleSelectTopic(chapters[0].name);
  }
}

function updateSelectionSummary() {
  elements.summarySubject.textContent = capitalize(state.selectedSubject);
  elements.summaryChapter.textContent = state.selectedChapter || "None Selected";
  elements.summaryDifficulty.textContent = capitalize(state.selectedDifficulty);
  elements.summaryCount.textContent = `${state.selectedCount} Questions`;
}

// ================= QUIZ GENERATION =================
async function handleGenerateQuizSubmit(e) {
  e.preventDefault();

  if (state.isGenerating) return;

  // Validation
  let hasError = false;

  if (!state.selectedSubject) {
    showFieldError(elements.errorSubject, "Please choose a subject.");
    hasError = true;
  } else {
    hideFieldError(elements.errorSubject);
  }

  if (!state.selectedChapter && !state.customChapter) {
    showFieldError(elements.errorChapter, "Please select or enter a chapter.");
    hasError = true;
  } else {
    hideFieldError(elements.errorChapter);
  }

  if (hasError) return;

  // Set loading state
  state.isGenerating = true;
  elements.btnGenerate.disabled = true;
  elements.btnGenerate.classList.add("loading");
  elements.generateStatusMsg.textContent = "Crafting your personalized quiz...";

  const targetChapter = state.customChapter || state.selectedChapter;

  try {
    const response = await fetch("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: state.selectedSubject,
        chapter: targetChapter,
        difficulty: state.selectedDifficulty,
        count: state.selectedCount
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || "Failed to generate quiz. Please try again.";
      throw new Error(errMsg);
    }

    // Quiz Generation Succeeded
    state.currentQuiz = data;
    state.userAnswers.clear();
    state.currentQuestionIndex = 0;

    showToast("Quiz generated successfully!", "success");
    initializeQuizView();
    window.location.hash = "#quiz";
  } catch (err) {
    showToast(err.message, "error");
    elements.generateStatusMsg.textContent = `Error: ${err.message}`;
  } finally {
    state.isGenerating = false;
    elements.btnGenerate.disabled = false;
    elements.btnGenerate.classList.remove("loading");
  }
}

// ================= QUIZ INTERFACE VIEW =================
function initializeQuizView() {
  const quiz = state.currentQuiz;
  if (!quiz) return;

  // Update Header Badges
  elements.quizPageTitle.textContent = quiz.title || `${quiz.chapter} Quiz`;
  elements.quizBadgeSubject.textContent = capitalize(quiz.subject);
  elements.quizBadgeChapter.textContent = quiz.chapter;
  elements.quizBadgeDiff.textContent = capitalize(quiz.difficulty);

  // Generation Mode Badge
  if (quiz.generationMode === "ai") {
    elements.quizBadgeModeText.textContent = "Generated by Gemini AI";
  } else if (quiz.generationMode === "cache") {
    elements.quizBadgeModeText.textContent = "Loaded from Cached Results";
  } else {
    elements.quizBadgeModeText.textContent = "Practice Mode: Local Question Bank";
  }

  buildQuestionPalette();
  renderCurrentQuestion();
}

function buildQuestionPalette() {
  elements.questionPalette.innerHTML = "";
  const total = state.currentQuiz.questions.length;

  for (let i = 0; i < total; i++) {
    const q = state.currentQuiz.questions[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "palette-btn";
    btn.textContent = (i + 1).toString();
    btn.setAttribute("aria-label", `Go to Question ${i + 1}`);

    btn.addEventListener("click", () => navigateQuestion(i));
    elements.questionPalette.appendChild(btn);
  }
}

function navigateQuestion(newIndex) {
  const total = state.currentQuiz.questions.length;
  if (newIndex < 0 || newIndex >= total) return;

  state.currentQuestionIndex = newIndex;
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const quiz = state.currentQuiz;
  const currentQ = quiz.questions[state.currentQuestionIndex];
  const total = quiz.questions.length;
  const currNum = state.currentQuestionIndex + 1;

  // Progress Bar
  const progressPercent = Math.round((currNum / total) * 100);
  elements.progressCounter.textContent = `Question ${currNum} of ${total}`;
  elements.progressPercentText.textContent = `${progressPercent}% Completed`;
  elements.progressFill.style.width = `${progressPercent}%`;

  // Question Header
  elements.currentQTag.textContent = `Question ${currNum}`;
  const isAnswered = state.userAnswers.has(currentQ.id);
  elements.currentQStatus.textContent = isAnswered ? "Answered" : "Unanswered";
  elements.currentQStatus.classList.toggle("answered", isAnswered);

  // Question Text - SAFELY assigned via textContent
  elements.questionTextContent.textContent = currentQ.question;

  // Options Container
  elements.optionsContainer.innerHTML = "";
  const selectedOptionId = state.userAnswers.get(currentQ.id);

  currentQ.options.forEach(opt => {
    const isSelected = selectedOptionId === opt.id;

    const optBtn = document.createElement("button");
    optBtn.type = "button";
    optBtn.className = `option-btn ${isSelected ? "selected" : ""}`;
    optBtn.setAttribute("role", "radio");
    optBtn.setAttribute("aria-checked", isSelected ? "true" : "false");

    const keyBox = document.createElement("span");
    keyBox.className = "option-key";
    keyBox.textContent = opt.id;

    const textSpan = document.createElement("span");
    textSpan.className = "option-text";
    textSpan.textContent = opt.text; // SAFELY textContent

    optBtn.appendChild(keyBox);
    optBtn.appendChild(textSpan);

    optBtn.addEventListener("click", () => handleSelectOption(currentQ.id, opt.id));

    elements.optionsContainer.appendChild(optBtn);
  });

  // Nav Buttons State
  elements.btnPrevQ.disabled = state.currentQuestionIndex === 0;
  elements.btnNextQ.style.display = state.currentQuestionIndex === total - 1 ? "none" : "inline-flex";

  // Update Palette Buttons
  const paletteBtns = elements.questionPalette.querySelectorAll(".palette-btn");
  paletteBtns.forEach((btn, idx) => {
    const qId = quiz.questions[idx].id;
    const answered = state.userAnswers.has(qId);
    const isCurr = idx === state.currentQuestionIndex;

    btn.classList.toggle("current", isCurr);
    btn.classList.toggle("answered", answered);
  });
}

function handleSelectOption(questionId, optionId) {
  state.userAnswers.set(questionId, optionId);
  renderCurrentQuestion();
}

function handleQuizSubmissionPrompt() {
  const total = state.currentQuiz.questions.length;
  const answeredCount = state.userAnswers.size;
  const unansweredCount = total - answeredCount;

  if (unansweredCount > 0) {
    elements.modalUnansweredCount.textContent = unansweredCount.toString();
    elements.unansweredModal.style.display = "flex";
  } else {
    performQuizSubmission();
  }
}

async function performQuizSubmission() {
  if (state.isSubmitting) return;

  state.isSubmitting = true;
  elements.btnSubmitQuiz.disabled = true;

  // Format payload
  const submissionAnswers = state.currentQuiz.questions.map(q => ({
    questionId: q.id,
    selectedAnswer: state.userAnswers.get(q.id) || null
  }));

  try {
    const response = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId: state.currentQuiz.quizId,
        answers: submissionAnswers
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to submit quiz.");
    }

    state.lastResult = data;
    showToast("Quiz submitted successfully!", "success");
    renderResultsView();
    window.location.hash = "#results";
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    state.isSubmitting = false;
    elements.btnSubmitQuiz.disabled = false;
  }
}

function handleAbortQuiz() {
  if (confirm("Are you sure you want to exit? Your quiz progress will be lost.")) {
    state.currentQuiz = null;
    state.userAnswers.clear();
    window.location.hash = "#home";
  }
}

// ================= RESULTS VIEW =================
function renderResultsView() {
  const result = state.lastResult;
  const quiz = state.currentQuiz;
  if (!result || !quiz) return;

  elements.resultsQuizMeta.textContent = `${capitalize(quiz.subject)} / ${quiz.chapter} / ${capitalize(quiz.difficulty)}`;
  elements.resultsPercentVal.textContent = `${result.percentage}%`;

  // Feedback based on score
  if (result.percentage >= 90) {
    elements.resultsFeedbackLabel.textContent = "🏆 Outstanding Mastery!";
  } else if (result.percentage >= 70) {
    elements.resultsFeedbackLabel.textContent = "🎉 Great Performance!";
  } else if (result.percentage >= 50) {
    elements.resultsFeedbackLabel.textContent = "👍 Solid Understanding — Keep Practicing!";
  } else {
    elements.resultsFeedbackLabel.textContent = "💡 Good Effort — Review the Explanations!";
  }

  // Metrics
  elements.resultsStatCorrect.textContent = result.correctAnswers.toString();
  elements.resultsStatIncorrect.textContent = result.incorrectAnswers.toString();
  elements.resultsStatUnanswered.textContent = result.unanswered.toString();
  elements.resultsStatTotal.textContent = result.totalQuestions.toString();

  // Render Detailed Review List SAFELY
  elements.resultsReviewList.innerHTML = "";

  result.results.forEach((item, idx) => {
    const itemCard = document.createElement("div");
    itemCard.className = `review-item-card ${
      item.isUnanswered ? "is-unanswered" : item.isCorrect ? "is-correct" : "is-incorrect"
    }`;

    // Header
    const itemHeader = document.createElement("div");
    itemHeader.className = "review-item-header";

    const qTag = document.createElement("span");
    qTag.className = "review-q-tag";
    qTag.textContent = `Question ${idx + 1}`;

    const statusBadge = document.createElement("span");
    if (item.isUnanswered) {
      statusBadge.className = "review-status-badge badge-unanswered";
      statusBadge.textContent = "Unanswered";
    } else if (item.isCorrect) {
      statusBadge.className = "review-status-badge badge-correct";
      statusBadge.textContent = "✓ Correct (+1 pt)";
    } else {
      statusBadge.className = "review-status-badge badge-incorrect";
      statusBadge.textContent = "✗ Incorrect";
    }

    itemHeader.appendChild(qTag);
    itemHeader.appendChild(statusBadge);

    // Question Text
    const qText = document.createElement("h4");
    qText.className = "review-q-text";
    qText.textContent = item.question;

    // Options Grid
    const optGrid = document.createElement("div");
    optGrid.className = "review-options-grid";

    item.options.forEach(opt => {
      const optEl = document.createElement("div");
      optEl.className = "review-opt";

      const isThisCorrect = opt.id === item.correctAnswer;
      const isThisUserSelected = opt.id === item.selectedAnswer;

      if (isThisCorrect) {
        optEl.classList.add("opt-correct");
      }
      if (isThisUserSelected && !isThisCorrect) {
        optEl.classList.add("opt-selected-wrong");
      }

      const keySpan = document.createElement("strong");
      keySpan.textContent = `[${opt.id}]`;

      const textSpan = document.createElement("span");
      textSpan.textContent = opt.text;

      optEl.appendChild(keySpan);
      optEl.appendChild(textSpan);

      if (isThisCorrect) {
        const checkSpan = document.createElement("span");
        checkSpan.textContent = "✓ (Correct)";
        checkSpan.style.marginLeft = "auto";
        checkSpan.style.fontWeight = "bold";
        optEl.appendChild(checkSpan);
      } else if (isThisUserSelected) {
        const yourSpan = document.createElement("span");
        yourSpan.textContent = "(Your Choice)";
        yourSpan.style.marginLeft = "auto";
        optEl.appendChild(yourSpan);
      }

      optGrid.appendChild(optEl);
    });

    // Explanation Box
    const expBox = document.createElement("div");
    expBox.className = "review-explanation-box";

    const expHeading = document.createElement("div");
    expHeading.className = "explanation-heading";
    expHeading.textContent = "Educational Solution & Rationale:";

    const expText = document.createElement("p");
    expText.className = "explanation-text";
    expText.textContent = item.explanation;

    expBox.appendChild(expHeading);
    expBox.appendChild(expText);

    itemCard.appendChild(itemHeader);
    itemCard.appendChild(qText);
    itemCard.appendChild(optGrid);
    itemCard.appendChild(expBox);

    elements.resultsReviewList.appendChild(itemCard);
  });
}

function handleRetakeQuiz() {
  state.userAnswers.clear();
  state.currentQuestionIndex = 0;
  state.lastResult = null;
  initializeQuizView();
  window.location.hash = "#quiz";
}

// ================= TOAST NOTIFICATION UTILITY =================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: "✓",
    error: "⚠️",
    warning: "⚡",
    info: "ℹ️"
  };

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.textContent = iconMap[type] || "ℹ️";

  const body = document.createElement("div");
  body.className = "toast-body";
  body.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(body);

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

function showFieldError(errorEl, message) {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.add("active");
}

function hideFieldError(errorEl) {
  if (!errorEl) return;
  errorEl.textContent = "";
  errorEl.classList.remove("active");
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
