document.addEventListener('DOMContentLoaded', () => {
  
  const exerciseContainer = document.getElementById('exercise-game-container');
  let exercisesData = [];

  // Запускаємо завантаження
  loadExercises();

  // --- 1. Завантаження даних ---
  async function loadExercises() {
    exerciseContainer.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-warning mb-3" role="status"></div>
        <h4 class="text-muted">Завантаження вправ...</h4>
      </div>`;

    try {
      const response = await fetch('/data/medical_exercises.json');
      if (!response.ok) throw new Error('Не вдалося завантажити вправи');
      
      exercisesData = await response.json();
      
      if (exercisesData.length > 0) {
        renderMenu();
      } else {
        exerciseContainer.innerHTML = '<div class="alert alert-warning">Список вправ порожній.</div>';
      }

    } catch (error) {
      exerciseContainer.innerHTML = `
        <div class="alert alert-danger">
          <h4>Помилка</h4>
          <p>${error.message}</p>
          <button class="btn btn-outline-danger" onclick="location.reload()">Спробувати ще раз</button>
        </div>`;
    }
  }

  // --- 2. Головне меню вправ ---
  function renderMenu() {
    exerciseContainer.innerHTML = `
      <div class="animate-fade-in">
        <h2 class="text-center mb-4 fw-bold text-dark">
          <i class="bi bi-pencil-square text-warning me-2"></i>Medical Exercises
        </h2>
        <div class="row g-4 justify-content-center">
          ${exercisesData.map((ex, idx) => `
            <div class="col-md-8">
              <div class="card shadow-sm hover-card border-0" onclick="startExercise(${idx})" style="cursor: pointer; transition: transform 0.2s;">
                <div class="card-body d-flex justify-content-between align-items-center p-4">
                  <div>
                    <h5 class="mb-1 text-dark fw-bold">${ex.title}</h5>
                    <span class="badge bg-light text-secondary border">
                      ${formatType(ex.type)}
                    </span>
                  </div>
                  <i class="bi bi-chevron-right text-muted fs-4"></i>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    // Робимо функцію доступною глобально для onclick
    window.startExercise = startExercise;
  }

  function formatType(type) {
    return type.replace(/_/g, ' ').toUpperCase();
  }

  // --- 3. Запуск конкретної вправи ---
  function startExercise(idx) {
    const exercise = exercisesData[idx];
    
    // Шаблон "шапки" вправи
    let headerHtml = `
      <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto;">
        <button class="btn btn-link text-decoration-none mb-3 ps-0 text-muted" onclick="renderMenu()">
          <i class="bi bi-arrow-left"></i> Back to List
        </button>
        <div class="card shadow-lg border-0">
          <div class="card-header bg-white py-4 border-bottom">
            <h3 class="mb-2 text-primary fw-bold">${exercise.title}</h3>
            <div class="alert alert-info mb-0 border-0 bg-info bg-opacity-10 text-dark">
              <i class="bi bi-info-circle-fill me-2 text-info"></i> ${exercise.instruction}
            </div>
          </div>
          <div class="card-body p-4 p-md-5">
    `;

    let contentHtml = '';
    let footerHtml = `</div></div></div>`; // Закриваємо card-body, card, container

    // Вибір рендерера залежно від типу
    if (exercise.type === 'gap_fill_text') {
      contentHtml = renderGapFill(exercise);
    } else if (exercise.type === 'word_formation') {
      contentHtml = renderWordFormation(exercise);
    } else if (exercise.type === 'correction') {
      contentHtml = renderCorrection(exercise);
    } else if (exercise.type === 'reorder') {
      contentHtml = renderReorder(exercise);
    } else if (exercise.type === 'categorization') {
      contentHtml = renderCategorization(exercise);
    }

    exerciseContainer.innerHTML = headerHtml + contentHtml + footerHtml;
    
    // Робимо функцію доступною для кнопки "Back"
    window.renderMenu = renderMenu;
  }


  // ============================================================
  // 4. РЕНДЕРЕРИ ДЛЯ РІЗНИХ ТИПІВ ВПРАВ
  // ============================================================

  // --- A. Gap Fill (Текст з пропусками) ---
  function renderGapFill(ex) {
    let textHtml = '';
    ex.textParts.forEach((part, i) => {
      textHtml += `<span class="lh-lg">${part}</span>`;
      if (i < ex.answers.length) {
        textHtml += `<input type="text" class="form-control d-inline-block mx-1 text-primary fw-bold gap-input text-center shadow-sm" 
          style="width: 160px; border: 0; border-bottom: 2px solid #ced4da; background: #f8f9fa;" 
          data-idx="${i}" autocomplete="off">`;
      }
    });

    // Word Bank (якщо є)
    let wordBankHtml = '';
    if (ex.wordBank) {
      wordBankHtml = `
        <div class="card bg-light border-0 mb-4">
          <div class="card-body">
            <small class="fw-bold text-muted text-uppercase d-block mb-2">Word Bank:</small>
            <div class="d-flex flex-wrap gap-2">
              ${ex.wordBank.map(w => `<span class="badge bg-white text-dark border shadow-sm py-2 px-3">${w}</span>`).join('')}
            </div>
          </div>
        </div>`;
    }

    // Додаємо логіку перевірки
    setTimeout(() => {
      const checkBtn = document.getElementById('check-gap-btn');
      const inputs = document.querySelectorAll('.gap-input');
      const resultDiv = document.getElementById('gap-result');

      checkBtn.addEventListener('click', () => {
        let correctCount = 0;
        inputs.forEach(input => {
          const userAns = input.value.trim().toLowerCase();
          const correctAns = ex.answers[input.dataset.idx].toLowerCase();
          
          if (userAns === correctAns) {
            input.classList.add('is-valid', 'text-success');
            input.classList.remove('is-invalid');
            input.style.borderBottomColor = '#198754';
            correctCount++;
          } else {
            input.classList.add('is-invalid', 'text-danger');
            input.classList.remove('is-valid');
            input.style.borderBottomColor = '#dc3545';
          }
        });

        const percentage = Math.round((correctCount / ex.answers.length) * 100);
        let alertClass = percentage === 100 ? 'alert-success' : 'alert-warning';
        resultDiv.innerHTML = `
          <div class="alert ${alertClass} mt-4 d-flex align-items-center">
            <i class="bi bi-check-circle-fill fs-4 me-3"></i>
            <div>
              <strong>Result:</strong> ${correctCount} / ${ex.answers.length} (${percentage}%)
            </div>
          </div>`;
      });
    }, 0);

    return `
      ${wordBankHtml}
      <div class="mb-5 fs-5 text-justify">${textHtml}</div>
      <div class="d-grid">
        <button class="btn btn-primary btn-lg" id="check-gap-btn"><i class="bi bi-check2-circle me-2"></i>Check Answers</button>
      </div>
      <div id="gap-result"></div>
    `;
  }

  // --- B. Word Formation (Словотвір) ---
  function renderWordFormation(ex) {
    const listHtml = ex.questions.map((q, i) => {
      let sent = q.sentence;
      let count = 0;
      // Заміна %input% на поле вводу
      while(sent.includes('%input%')) {
        sent = sent.replace('%input%', `
          <input type="text" class="form-control d-inline-block wf-input mx-1 text-center fw-bold text-primary" 
          style="width: 150px; display:inline !important;" data-q="${i}" data-a="${count++}" autocomplete="off">
        `);
      }
      return `<li class="list-group-item border-0 border-bottom py-3 fs-5 bg-transparent">${sent}</li>`;
    }).join('');

    setTimeout(() => {
      document.getElementById('check-wf-btn').addEventListener('click', () => {
        document.querySelectorAll('.wf-input').forEach(inp => {
          const qIdx = inp.dataset.q;
          const aIdx = inp.dataset.a;
          const correct = ex.questions[qIdx].answers[aIdx].toLowerCase();
          
          if(inp.value.trim().toLowerCase() === correct) {
             inp.classList.add('is-valid'); 
             inp.classList.remove('is-invalid');
          } else { 
             inp.classList.add('is-invalid'); 
             inp.classList.remove('is-valid');
          }
        });
      });
    }, 0);

    return `
      <ul class="list-group list-group-flush mb-4">${listHtml}</ul>
      <div class="d-grid">
        <button class="btn btn-primary btn-lg" id="check-wf-btn">Check Answers</button>
      </div>
    `;
  }

  // --- C. Error Correction (Виправлення помилок) ---
  function renderCorrection(ex) {
    const listHtml = ex.questions.map((q, i) => `
      <div class="card mb-3 border border-danger border-opacity-25 bg-danger bg-opacity-10">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-5">
               <p class="mb-1 text-muted small text-uppercase fw-bold">Context:</p>
               <p class="fst-italic mb-2">"${q.context}"</p>
               <span class="badge bg-danger bg-opacity-75">Error: ${q.error}</span>
            </div>
            <div class="col-md-1 text-center py-2">
               <i class="bi bi-arrow-right text-muted fs-4 d-none d-md-block"></i>
               <i class="bi bi-arrow-down text-muted fs-4 d-md-none"></i>
            </div>
            <div class="col-md-6">
               <label class="form-label small text-muted">Correct phrase:</label>
               <input type="text" class="form-control corr-input" data-idx="${i}" placeholder="Type correction here...">
               <div class="mt-2 small fw-bold" id="fb-${i}"></div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    setTimeout(() => {
      document.getElementById('check-corr-btn').addEventListener('click', () => {
        document.querySelectorAll('.corr-input').forEach(inp => {
          const correct = ex.questions[inp.dataset.idx].correct.toLowerCase();
          const fb = document.getElementById(`fb-${inp.dataset.idx}`);
          
          // Нормалізуємо (прибираємо зайві пробіли і знаки пунктуації в кінці)
          const userVal = inp.value.trim().toLowerCase().replace(/[.,]$/, '');
          const correctVal = correct.replace(/[.,]$/, '');

          if(userVal === correctVal) {
            inp.classList.add('is-valid');
            inp.classList.remove('is-invalid');
            fb.innerHTML = '<span class="text-success"><i class="bi bi-check-all"></i> Correct!</span>';
          } else {
            inp.classList.add('is-invalid');
            inp.classList.remove('is-valid');
            fb.innerHTML = `<span class="text-danger">Try again.</span>`;
            // Можна показати підказку, якщо хочете:
            // fb.innerHTML += ` <span class="text-muted">(${ex.questions[inp.dataset.idx].correct})</span>`;
          }
        });
      });
    }, 0);

    return `
      <div class="correction-list mb-4">${listHtml}</div>
      <div class="d-grid">
         <button class="btn btn-primary btn-lg" id="check-corr-btn">Check Corrections</button>
      </div>
    `;
  }

  // --- D. Reorder Sentences (Порядок слів) ---
  function renderReorder(ex) {
    const listHtml = ex.questions.map((q, i) => `
      <div class="mb-5">
        <div class="p-3 bg-light rounded-3 mb-3 border d-flex flex-wrap gap-2 justify-content-center">
          ${q.scrambled.split(' / ').map(w => `<span class="badge bg-white text-dark border shadow-sm py-2 px-3 fs-6 user-select-none">${w}</span>`).join('')}
        </div>
        <div class="input-group input-group-lg">
          <span class="input-group-text bg-white"><i class="bi bi-pencil"></i></span>
          <input type="text" class="form-control reorder-input" data-idx="${i}" placeholder="Type the full sentence here...">
        </div>
        <div class="mt-2 ms-2 fw-bold" id="r-fb-${i}"></div>
      </div>
    `).join('');

    setTimeout(() => {
      document.getElementById('check-reorder-btn').addEventListener('click', () => {
        document.querySelectorAll('.reorder-input').forEach(inp => {
          // Прибираємо всі знаки пунктуації та пробіли для порівняння
          const clean = str => str.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          const correct = clean(ex.questions[inp.dataset.idx].correct);
          const userVal = clean(inp.value);
          const fb = document.getElementById(`r-fb-${inp.dataset.idx}`);
          
          if(userVal === correct) {
            inp.classList.add('is-valid');
            inp.classList.remove('is-invalid');
            fb.className = 'mt-2 ms-2 fw-bold text-success';
            fb.innerHTML = '<i class="bi bi-check-circle-fill"></i> Correct!';
          } else {
            inp.classList.add('is-invalid');
            inp.classList.remove('is-valid');
            fb.className = 'mt-2 ms-2 fw-bold text-danger';
            fb.innerHTML = 'Incorrect order.';
          }
        });
      });
    }, 0);

    return `
      <div class="reorder-list mb-4">${listHtml}</div>
      <div class="d-grid">
         <button class="btn btn-primary btn-lg" id="check-reorder-btn">Check Sentences</button>
      </div>
    `;
  }

  // --- E. Categorization (Сортування) ---
  function renderCategorization(ex) {
    // Перемішуємо слова, щоб було цікавіше
    const shuffledQuestions = [...ex.questions].sort(() => Math.random() - 0.5);
    
    const listHtml = shuffledQuestions.map((q, i) => `
      <div class="card mb-4 border-0 shadow-sm">
        <div class="card-body text-center p-4">
          <h4 class="mb-3 fw-bold text-primary">"${q.word}"</h4>
          <p class="text-muted small mb-3">Select category:</p>
          
          <div class="d-flex flex-wrap gap-2 justify-content-center">
            ${ex.categories.map(cat => `
              <button class="btn btn-outline-secondary cat-btn" data-q="${i}" data-cat="${cat}" data-correct="${q.correct}">
                ${cat}
              </button>
            `).join('')}
          </div>
          
          <div class="mt-3 fw-bold" id="cat-res-${i}" style="min-height: 24px;"></div>
        </div>
      </div>
    `).join('');

    setTimeout(() => {
      document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const parentCard = e.target.closest('.card-body');
          const buttons = parentCard.querySelectorAll('.cat-btn');
          const resultDiv = parentCard.querySelector('[id^="cat-res-"]');
          
          const selectedCat = e.target.dataset.cat;
          const correctCat = e.target.dataset.correct;

          // Блокуємо всі кнопки в цій картці
          buttons.forEach(b => {
             b.disabled = true;
             if (b.dataset.cat === correctCat) {
                 b.classList.remove('btn-outline-secondary');
                 b.classList.add('btn-success'); // Показуємо правильну
             }
          });

          if (selectedCat === correctCat) {
             resultDiv.innerHTML = '<span class="text-success"><i class="bi bi-check-lg"></i> Correct!</span>';
             e.target.classList.add('btn-success');
          } else {
             e.target.classList.remove('btn-outline-secondary');
             e.target.classList.add('btn-danger');
             resultDiv.innerHTML = `<span class="text-danger"><i class="bi bi-x-lg"></i> Incorrect.</span>`;
          }
        });
      });
    }, 0);

    return `<div class="categorization-list">${listHtml}</div>`;
  }

});