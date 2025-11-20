document.addEventListener('DOMContentLoaded', () => {
  const testContainer = document.getElementById('test-game-container');
  
  let quizData = [];
  let currentQuestionIndex = 0;
  let score = 0;

  loadTests();

  async function loadTests() {
    testContainer.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
        <h4 class="text-muted">Loading Medical Quiz...</h4>
      </div>`;

    try {
      const response = await fetch('/data/medical_quiz.json');
      if (!response.ok) {
        throw new Error('Failed to load quiz data');
      }
      
      quizData = await response.json();
      
      if (quizData.length > 0) {
        renderQuestion(quizData[currentQuestionIndex]);
      } else {
        testContainer.innerHTML = `
          <div class="alert alert-warning text-center">
            <h4>No questions found.</h4>
            <p>Please check <code>medical_quiz.json</code> file.</p>
            <a href="/" class="btn btn-primary mt-2">Go Home</a>
          </div>`;
      }

    } catch (error) {
      console.error(error);
      testContainer.innerHTML = `
        <div class="alert alert-danger text-center">
          <h4>Error loading quiz</h4>
          <p>${error.message}</p>
          <button class="btn btn-outline-danger mt-2" onclick="location.reload()">Try Again</button>
        </div>`;
    }
  }

  function renderQuestion(question) {
    const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);

    testContainer.innerHTML = `
      <div class="card border-0 shadow-lg animate-fade-in" style="max-width: 800px; margin: 2rem auto;">
        
        <!-- Шапка: Прогрес та Категорія -->
        <div class="card-header bg-white border-bottom-0 pt-4 px-4 d-flex justify-content-between align-items-center">
          <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 border border-primary">
            Question ${currentQuestionIndex + 1} / ${quizData.length}
          </span>
          <span class="badge bg-light text-secondary border">
            ${question.category || 'Medical English'}
          </span>
        </div>

        <div class="card-body p-4 p-md-5">
          <!-- Текст питання -->
          <h3 class="card-title mb-4 text-dark fw-bold lh-base text-center">
            ${question.question}
          </h3>
          
          <!-- Варіанти відповідей -->
          <div class="d-grid gap-3 mb-4">
            ${shuffledOptions.map((opt, idx) => `
              <button class="btn btn-outline-dark text-start p-3 fs-5 quiz-option-btn position-relative shadow-sm" 
                      data-idx="${idx}">
                <div class="d-flex align-items-center">
                  <span class="fw-bold me-3 bg-light rounded-circle px-3 py-1 border text-secondary" style="min-width: 40px; text-align: center;">
                    ${String.fromCharCode(65 + idx)}
                  </span>
                  <span>${opt.text}</span>
                </div>
              </button>
            `).join('')}
          </div>

          <!-- Блок пояснення (Feedback) - спочатку прихований -->
          <div id="quiz-feedback"></div>

          <!-- Кнопка Наступне - спочатку прихована -->
          <div class="text-end mt-4" style="min-height: 50px;">
             <button class="btn btn-primary btn-lg px-5 d-none shadow" id="next-quiz-btn">
               Next Question <i class="bi bi-arrow-right ms-2"></i>
             </button>
          </div>
        </div>

        <!-- Прогрес бар -->
        <div class="progress" style="height: 5px;">
          <div class="progress-bar bg-success" role="progressbar" 
               style="width: ${((currentQuestionIndex) / quizData.length) * 100}%"></div>
        </div>
      </div>
    `;

    const buttons = document.querySelectorAll('.quiz-option-btn');
    const nextBtn = document.getElementById('next-quiz-btn');
    const feedbackDiv = document.getElementById('quiz-feedback');

    buttons.forEach((btn, index) => {
      btn.dataset.isCorrect = shuffledOptions[index].isCorrect;
      btn.dataset.feedback = shuffledOptions[index].feedback || '';

      btn.addEventListener('click', (e) => {
        handleAnswerClick(btn, buttons, feedbackDiv, nextBtn);
      });
    });

    nextBtn.addEventListener('click', () => {
      currentQuestionIndex++;
      if (currentQuestionIndex >= quizData.length) {
        showQuizResult();
      } else {
        renderQuestion(quizData[currentQuestionIndex]);
      }
    });
  }

  function handleAnswerClick(selectedBtn, allButtons, feedbackContainer, nextBtn) {
    allButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.cursor = 'default';
    });

    const isCorrect = selectedBtn.dataset.isCorrect === 'true';
    const feedbackText = selectedBtn.dataset.feedback;

    if (isCorrect) {
      score++;
      selectedBtn.classList.remove('btn-outline-dark');
      selectedBtn.classList.add('btn-success');
      
      feedbackContainer.innerHTML = `
        <div class="alert alert-success border-0 bg-success bg-opacity-10 mt-3 animate-fade-in">
          <div class="d-flex">
            <i class="bi bi-check-circle-fill text-success me-3 fs-4"></i>
            <div>
              <h5 class="alert-heading fw-bold text-success mb-1">Correct!</h5>
              <p class="mb-0 text-dark opacity-75">${feedbackText}</p>
            </div>
          </div>
        </div>`;
    } else {
      selectedBtn.classList.remove('btn-outline-dark');
      selectedBtn.classList.add('btn-danger');
      
      feedbackContainer.innerHTML = `
        <div class="alert alert-danger border-0 bg-danger bg-opacity-10 mt-3 animate-fade-in">
          <div class="d-flex">
            <i class="bi bi-x-circle-fill text-danger me-3 fs-4"></i>
            <div>
              <h5 class="alert-heading fw-bold text-danger mb-1">Incorrect</h5>
              <p class="mb-0 text-dark opacity-75">${feedbackText}</p>
            </div>
          </div>
        </div>`;

      allButtons.forEach(btn => {
        if (btn.dataset.isCorrect === 'true') {
          btn.classList.remove('btn-outline-dark');
          btn.classList.add('btn-outline-success'); // Тільки зелена рамка
          btn.classList.add('fw-bold');
        }
      });
    }

    nextBtn.classList.remove('d-none');
    nextBtn.focus();
  }

  function showQuizResult() {
    const percentage = Math.round((score / quizData.length) * 100);
    
    let message = "Good effort!";
    let colorClass = "text-primary";
    let icon = "bi-emoji-smile";
    let alertClass = "alert-primary";

    if (percentage >= 90) { 
      message = "Excellent! You are a medical English pro."; 
      colorClass = "text-success"; 
      icon = "bi-trophy-fill";
      alertClass = "alert-success";
    } else if (percentage >= 60) {
      message = "Good job! Keep practicing.";
      colorClass = "text-info";
      icon = "bi-hand-thumbs-up-fill";
      alertClass = "alert-info";
    } else { 
      message = "Review the vocabulary and try again."; 
      colorClass = "text-warning"; 
      icon = "bi-book-half";
      alertClass = "alert-warning";
    }

    testContainer.innerHTML = `
      <div class="card border-0 shadow-lg text-center animate-fade-in" style="max-width: 600px; margin: 3rem auto;">
        <div class="card-body p-5">
          
          <div class="mb-4">
             <div class="d-inline-block p-4 rounded-circle bg-light">
               <i class="bi ${icon} ${colorClass}" style="font-size: 5rem;"></i>
             </div>
          </div>

          <h2 class="fw-bold text-dark mb-2">Test Completed!</h2>
          <p class="text-muted mb-4">Here is your result</p>
          
          <div class="display-1 fw-bold mb-2 ${colorClass}">
            ${percentage}%
          </div>
          <p class="fs-5 text-muted mb-4">(${score} out of ${quizData.length} correct)</p>
          
          <div class="alert ${alertClass} mb-5 border-0 rounded-3 p-3">
            <i class="bi bi-info-circle me-2"></i> <strong>${message}</strong>
          </div>
          
          <div class="d-grid gap-3 col-md-8 mx-auto">
            <button class="btn btn-primary btn-lg shadow-sm" onclick="location.reload()">
              <i class="bi bi-arrow-repeat me-2"></i> Restart Quiz
            </button>
            <a href="/" class="btn btn-outline-secondary">
              <i class="bi bi-house me-2"></i> Back to Home
            </a>
          </div>

        </div>
      </div>
    `;
  }

});