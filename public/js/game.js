document.addEventListener('DOMContentLoaded', () => {
  
  // --- ГЛОБАЛЬНІ ЕЛЕМЕНТИ ---
  const testContainer = document.getElementById('test-game-container');
  const exerciseContainer = document.getElementById('exercise-game-container');
  const videoTaskContainer = document.getElementById('video-task-container');
  const startVideoQuizBtn = document.getElementById('start-video-quiz');

  // --- ЗАПУСК ПРИ СТАРТІ ---
  //loadExerciseRound();
  loadTestRound();
  //loadVideoRound();

  if(startVideoQuizBtn) {
    startVideoQuizBtn.addEventListener('click', loadVideoRound);
  }
  
  // Слухач перемикання вкладок
  const tabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
  tabs.forEach(tab => {
    tab.addEventListener('shown.bs.tab', (event) => {
      if (event.target.id === 'tests-tab') loadTestRound();
      if (event.target.id === 'exercises-tab') loadExerciseRound();
      if (event.target.id === 'video-tab') loadVideoRound();
    });
  });


  // ============================================================
  // 1. ЛОГІКА ДЛЯ ВКЛАДКИ "ТЕСТИ" (Medical Quiz)
  // ============================================================
  let quizData = [];
  let currentQuestionIndex = 0;
  let score = 0;

  async function loadTestRound() {
    if (quizData.length === 0) {
      testContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2">Loading Medical Quiz...</p></div>';
      try {
        const response = await fetch('/data/medical_quiz.json');
        if (!response.ok) throw new Error('Failed to load quiz data');
        quizData = await response.json();
      } catch (error) {
        testContainer.innerHTML = `<div class="alert alert-danger">Error loading quiz: ${error.message}</div>`;
        return;
      }
    }

    if (currentQuestionIndex >= quizData.length) {
      showQuizResult();
      return;
    }

    const question = quizData[currentQuestionIndex];

    testContainer.innerHTML = `
      <div class="card border-0 shadow-sm animate-fade-in" style="max-width: 750px; margin: 0 auto;">
        <div class="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
          <span class="badge bg-primary rounded-pill px-3 py-2">Question ${currentQuestionIndex + 1} / ${quizData.length}</span>
          <span class="text-muted small text-uppercase fw-bold badge bg-light text-dark border">${question.category || 'General'}</span>
        </div>
        <div class="card-body p-4">
          <h4 class="card-title mb-4 text-dark fw-bold" style="line-height: 1.5;">${question.question}</h4>
          
          <div class="d-grid gap-2 mb-4">
            ${question.options.map((opt, idx) => `
              <button class="btn btn-outline-dark text-start p-3 quiz-option-btn position-relative" data-idx="${idx}">
                <span class="fw-bold me-2">${String.fromCharCode(65 + idx)}.</span> ${opt.text}
              </button>
            `).join('')}
          </div>

          <div id="quiz-feedback"></div>

          <div class="text-end mt-3">
             <button class="btn btn-primary px-4 d-none" id="next-quiz-btn">
               Next Question <i class="bi bi-arrow-right"></i>
             </button>
          </div>
        </div>
      </div>
    `;

    const buttons = document.querySelectorAll('.quiz-option-btn');
    const feedbackDiv = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('next-quiz-btn');

    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        buttons.forEach(b => b.disabled = true);
        const targetBtn = e.target.closest('.quiz-option-btn');
        const selectedIdx = parseInt(targetBtn.dataset.idx);
        const selectedOption = question.options[selectedIdx];

        if (selectedOption.isCorrect) {
          score++;
          targetBtn.classList.replace('btn-outline-dark', 'btn-success');
          feedbackDiv.innerHTML = `<div class="alert alert-success border-0 bg-success bg-opacity-10 text-success mt-3"><i class="bi bi-check-circle-fill me-2"></i> <strong>Correct!</strong> ${selectedOption.feedback}</div>`;
        } else {
          targetBtn.classList.replace('btn-outline-dark', 'btn-danger');
          feedbackDiv.innerHTML = `<div class="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger mt-3"><i class="bi bi-x-circle-fill me-2"></i> ${selectedOption.feedback}</div>`;
          question.options.forEach((opt, idx) => {
            if (opt.isCorrect) buttons[idx].classList.replace('btn-outline-dark', 'btn-success');
          });
        }
        nextBtn.classList.remove('d-none');
      });
    });

    nextBtn.addEventListener('click', () => {
      currentQuestionIndex++;
      loadTestRound();
    });
  }

  function showQuizResult() {
    const percentage = Math.round((score / quizData.length) * 100);
    let message = "Good job!";
    let color = "text-primary";
    if (percentage >= 90) { message = "Excellent!"; color = "text-success"; }
    else if (percentage < 60) { message = "Keep practicing!"; color = "text-warning"; }

    testContainer.innerHTML = `
      <div class="text-center py-5 animate-fade-in">
        <i class="bi bi-trophy-fill ${color} mb-3" style="font-size: 5rem;"></i>
        <h2 class="fw-bold text-dark">Quiz Completed!</h2>
        <div class="display-1 fw-bold my-3 ${color}">${score} / ${quizData.length}</div>
        <p class="fs-4 text-muted mb-4">(${percentage}%) - ${message}</p>
        <button class="btn btn-primary btn-lg" onclick="location.reload()">Restart Quiz</button>
      </div>
    `;
  }


  // ============================================================
  // 2. ЛОГІКА ДЛЯ ВКЛАДКИ "ВПРАВИ" (Interactive Exercises)
  // ============================================================
  let exercisesData = [];

  window.loadExerciseRound = async function() {
    if (exercisesData.length === 0) {
      exerciseContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-warning"></div><p>Loading exercises...</p></div>';
      try {
        const response = await fetch('/data/medical_exercises.json');
        if (!response.ok) throw new Error('Failed to load exercises');
        exercisesData = await response.json();
      } catch (error) {
        exerciseContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        return;
      }
    }
    renderExerciseMenu();
  }

  function renderExerciseMenu() {
    exerciseContainer.innerHTML = `
      <div class="animate-fade-in">
        <h3 class="mb-4 text-center">Practice Center</h3>
        <div class="row g-3 justify-content-center">
          ${exercisesData.map((ex, idx) => `
            <div class="col-md-8">
              <div class="card shadow-sm border-0 hover-card" onclick="startExercise(${idx})" style="cursor: pointer; transition: transform 0.2s;">
                <div class="card-body d-flex justify-content-between align-items-center p-4">
                  <div>
                    <h5 class="mb-1 text-dark fw-bold">${ex.title}</h5>
                    <span class="badge bg-light text-secondary border">${ex.type.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  <i class="bi bi-chevron-right text-muted"></i>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    window.startExercise = startExercise;
  }

  function startExercise(idx) {
    const exercise = exercisesData[idx];
    const backBtn = `<button class="btn btn-link text-decoration-none mb-3 ps-0" onclick="renderExerciseMenu()"><i class="bi bi-arrow-left"></i> Back to Menu</button>`;
    
    let contentHtml = '';
    if (exercise.type === 'gap_fill_text') contentHtml = renderGapFillText(exercise);
    else if (exercise.type === 'word_formation') contentHtml = renderWordFormation(exercise);
    else if (exercise.type === 'correction') contentHtml = renderCorrection(exercise);
    else if (exercise.type === 'reorder') contentHtml = renderReorder(exercise);

    exerciseContainer.innerHTML = `
      <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto;">
        ${backBtn}
        <div class="card shadow-sm">
          <div class="card-header bg-white py-3">
            <h4 class="mb-0">${exercise.title}</h4>
            <small class="text-muted"><i class="bi bi-info-circle me-1"></i> ${exercise.instruction}</small>
          </div>
          <div class="card-body p-4">
            ${contentHtml}
          </div>
        </div>
      </div>
    `;
  }

  // --- 1. Gap Fill ---
  function renderGapFillText(ex) {
    let textHtml = '';
    ex.textParts.forEach((part, i) => {
      textHtml += part;
      if (i < ex.answers.length) {
        textHtml += `<input type="text" class="form-control d-inline-block mx-1 text-primary fw-bold gap-input text-center" style="width: 140px; border: 0; border-bottom: 2px solid #ced4da; background: #f8f9fa;" data-idx="${i}" autocomplete="off">`;
      }
    });

    setTimeout(() => {
      document.getElementById('check-gap-btn').addEventListener('click', () => {
        let correct = 0;
        document.querySelectorAll('.gap-input').forEach(input => {
          const ans = ex.answers[input.dataset.idx].toLowerCase();
          if (input.value.trim().toLowerCase() === ans) {
            input.classList.add('is-valid', 'border-success');
            input.classList.remove('is-invalid', 'border-danger');
            correct++;
          } else {
            input.classList.add('is-invalid', 'border-danger');
            input.classList.remove('is-valid', 'border-success');
          }
        });
        document.getElementById('ex-result').innerHTML = `<div class="alert ${correct===ex.answers.length?'alert-success':'alert-warning'} mt-3">Score: ${correct} / ${ex.answers.length}</div>`;
      });
    }, 0);

    return `
      <div class="lh-lg fs-5 text-justify">${textHtml}</div>
      <div class="mt-4 pt-3 border-top">
        <small class="fw-bold text-muted d-block mb-2">WORD BANK:</small>
        <div class="d-flex flex-wrap gap-2 mb-3">
          ${ex.wordBank.map(w => `<span class="badge bg-light text-dark border">${w}</span>`).join('')}
        </div>
      </div>
      <button class="btn btn-primary px-4" id="check-gap-btn">Check Answers</button>
      <div id="ex-result"></div>
    `;
  }

  // --- 2. Word Formation ---
  function renderWordFormation(ex) {
    const listHtml = ex.questions.map((q, i) => {
      let sent = q.sentence;
      let count = 0;
      while(sent.includes('%input%')) {
        sent = sent.replace('%input%', `<input type="text" class="form-control d-inline-block wf-input mx-1 text-center fw-bold text-primary" style="width: 140px;" data-q="${i}" data-a="${count++}">`);
      }
      return `<li class="list-group-item border-0 border-bottom py-3 fs-5">${sent}</li>`;
    }).join('');

    setTimeout(() => {
      document.getElementById('check-wf-btn').addEventListener('click', () => {
        document.querySelectorAll('.wf-input').forEach(inp => {
          const correct = ex.questions[inp.dataset.q].answers[inp.dataset.a].toLowerCase();
          if(inp.value.trim().toLowerCase() === correct) {
             inp.classList.add('is-valid', 'border-success'); 
             inp.classList.remove('is-invalid', 'border-danger');
          } else { 
             inp.classList.add('is-invalid', 'border-danger'); 
             inp.classList.remove('is-valid', 'border-success');
          }
        });
      });
    }, 0);

    return `<ul class="list-group list-group-flush">${listHtml}</ul><button class="btn btn-primary mt-3 px-4" id="check-wf-btn">Check Answers</button>`;
  }

  // --- 3. Error Correction ---
  function renderCorrection(ex) {
    const html = ex.questions.map((q, i) => `
      <div class="mb-3 p-3 bg-light rounded border-start border-4 border-danger">
        <p class="mb-2 text-muted fst-italic">"${q.context}"</p>
        <div class="row align-items-center">
          <div class="col-auto"><span class="text-danger fw-bold"><i class="bi bi-x-circle"></i> ${q.error}</span></div>
          <div class="col-auto"><i class="bi bi-arrow-right text-muted"></i></div>
          <div class="col"><input type="text" class="form-control corr-input" data-idx="${i}" placeholder="Type correct phrase..."></div>
        </div>
        <div class="mt-2 small text-success fw-bold feedback-div" id="fb-${i}"></div>
      </div>
    `).join('');

    setTimeout(() => {
      document.getElementById('check-corr-btn').addEventListener('click', () => {
        document.querySelectorAll('.corr-input').forEach(inp => {
          const correct = ex.questions[inp.dataset.idx].correct.toLowerCase();
          const fb = document.getElementById(`fb-${inp.dataset.idx}`);
          if(inp.value.trim().toLowerCase() === correct) {
            inp.classList.add('is-valid');
            inp.classList.remove('is-invalid');
            fb.innerHTML = '<i class="bi bi-check-circle-fill"></i> Correct!';
          } else {
            inp.classList.add('is-invalid');
            inp.classList.remove('is-valid');
            fb.innerText = "";
          }
        });
      });
    }, 0);

    return `<div>${html}</div><button class="btn btn-primary mt-3 px-4" id="check-corr-btn">Check Corrections</button>`;
  }

  // --- 4. Reorder ---
  function renderReorder(ex) {
    const html = ex.questions.map((q, i) => `
      <div class="mb-4">
        <div class="p-3 bg-light rounded mb-2 d-flex flex-wrap gap-2 justify-content-center border">
          ${q.scrambled.split(' / ').map(w => `<span class="badge bg-white text-dark border shadow-sm py-2 px-3 fs-6">${w}</span>`).join('')}
        </div>
        <input type="text" class="form-control reorder-input form-control-lg" data-idx="${i}" placeholder="Type the full sentence here...">
        <div class="mt-1 small text-success fw-bold" id="r-fb-${i}"></div>
      </div>
    `).join('');

    setTimeout(() => {
      document.getElementById('check-reorder-btn').addEventListener('click', () => {
        document.querySelectorAll('.reorder-input').forEach(inp => {
          const normalize = str => str.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
          const correct = normalize(ex.questions[inp.dataset.idx].correct);
          const userVal = normalize(inp.value);
          const fb = document.getElementById(`r-fb-${inp.dataset.idx}`);
          
          if(userVal === correct) {
            inp.classList.add('is-valid');
            inp.classList.remove('is-invalid');
            fb.innerHTML = '<i class="bi bi-check-circle-fill"></i> Correct!';
          } else {
            inp.classList.add('is-invalid');
            inp.classList.remove('is-valid');
            fb.innerText = "";
          }
        });
      });
    }, 0);

    return `<div>${html}</div><button class="btn btn-primary mt-3 px-4" id="check-reorder-btn">Check Sentences</button>`;
  }

  window.renderExerciseMenu = renderExerciseMenu;


  // ============================================================
  // 3. ЛОГІКА ДЛЯ ВКЛАДКИ "ВІДЕО" (Single Video Lesson)
  // ============================================================
  
  let videoLessons = [];
  
  async function loadVideoRound() {
    if (videoLessons.length === 0) {
      videoTaskContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-info"></div><p>Loading video lesson...</p></div>';
      try {
        const response = await fetch('/data/video_lessons.json');
        if (!response.ok) throw new Error('Failed to load video');
        const lessons = await response.json();
        
        // Беремо перший урок з масиву
        if (lessons.length > 0) {
          startVideoLesson(lessons[0]);
        } else {
          videoTaskContainer.innerHTML = '<div class="alert alert-warning">No video lessons available.</div>';
        }
        
      } catch (error) {
        videoTaskContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
      }
    }
  }

  function startVideoLesson(lesson) {
    const vocabListHtml = lesson.vocabulary.map(v => `
      <li class="list-group-item d-flex justify-content-between align-items-start">
        <div class="ms-2 me-auto">
          <div class="fw-bold text-primary">${v.word}</div>
          ${v.def}
        </div>
      </li>
    `).join('');

    const questionsHtml = lesson.questions.map((q, qIdx) => `
      <div class="card mb-3 border-0 shadow-sm bg-light">
        <div class="card-body">
          <p class="fw-bold mb-2">${qIdx + 1}. ${q.question}</p>
          <div class="d-grid gap-2 d-md-block">
            ${q.options.map((opt, oIdx) => `
              <button class="btn btn-outline-dark btn-sm video-quiz-btn me-1 mb-1" 
                data-correct="${opt.isCorrect}" 
                data-feedback="${lesson.questions[qIdx].feedback}">
                ${opt.text}
              </button>
            `).join('')}
          </div>
          <div class="mt-2 feedback-area fw-bold small"></div>
        </div>
      </div>
    `).join('');

    videoTaskContainer.innerHTML = `
      <div class="animate-fade-in">
        <ul class="nav nav-pills mb-3 justify-content-center" id="pills-tab" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active fw-bold px-4" id="pills-vocab-tab" data-bs-toggle="pill" data-bs-target="#pills-vocab" type="button">
              <i class="bi bi-journal-text"></i> Vocabulary Preview
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link fw-bold px-4" id="pills-quiz-tab" data-bs-toggle="pill" data-bs-target="#pills-quiz" type="button">
              <i class="bi bi-check-square"></i> Take the Test
            </button>
          </li>
        </ul>

        <div class="tab-content" id="pills-tabContent">
          <!-- Вкладка Слів -->
          <div class="tab-pane fade show active" id="pills-vocab" role="tabpanel">
            <div class="alert alert-info border-0 bg-info bg-opacity-10"><i class="bi bi-info-circle-fill"></i> Review these words before taking the test.</div>
            <ul class="list-group list-group-flush rounded shadow-sm">
              ${vocabListHtml}
            </ul>
          </div>
          
          <!-- Вкладка Тесту -->
          <div class="tab-pane fade" id="pills-quiz" role="tabpanel">
            <div class="alert alert-warning border-0 bg-warning bg-opacity-10"><i class="bi bi-pencil-fill"></i> Test your understanding of the video.</div>
            ${questionsHtml}
          </div>
        </div>

      </div>
    `;

    // Логіка кліків на питання
    document.querySelectorAll('.video-quiz-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const isCorrect = e.target.dataset.correct === 'true';
        const feedback = e.target.dataset.feedback;
        const feedbackArea = e.target.parentElement.nextElementSibling;
        
        e.target.parentElement.querySelectorAll('button').forEach(b => {
          b.disabled = true;
          if(b.dataset.correct === 'true') b.classList.replace('btn-outline-dark', 'btn-success');
        });

        if (isCorrect) {
          e.target.classList.replace('btn-outline-dark', 'btn-success');
          feedbackArea.innerHTML = `<span class="text-success"><i class="bi bi-check-circle-fill"></i> Correct! ${feedback}</span>`;
        } else {
          e.target.classList.replace('btn-outline-dark', 'btn-danger');
          feedbackArea.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle-fill"></i> Incorrect.</span>`;
        }
      });
    });
  }

});