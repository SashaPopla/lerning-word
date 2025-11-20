document.addEventListener('DOMContentLoaded', () => {
  
  const videoContainer = document.getElementById('video-task-container');
  let videoLessons = [];

  loadVideoLessons();

  async function loadVideoLessons() {
    videoContainer.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-info mb-3" role="status"></div>
        <h4 class="text-muted">Loading video lessons...</h4>
      </div>`;

    try {
      const response = await fetch('/data/video_lessons.json');
      if (!response.ok) throw new Error('Failed to load video lessons');
      
      videoLessons = await response.json();
      
      if (videoLessons.length > 0) {
        renderLessonList();
      } else {
        videoContainer.innerHTML = '<div class="alert alert-warning">No video lessons available.</div>';
      }
      
    } catch (error) {
      videoContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
  }

  function renderLessonList() {
    videoContainer.innerHTML = `
      <div class="animate-fade-in">
        <h2 class="mb-4 text-center fw-bold text-dark"><i class="bi bi-collection-play me-2 text-danger"></i>Video Lessons</h2>
        <div class="row g-4 justify-content-center">
          ${videoLessons.map((lesson, idx) => `
            <div class="col-md-6 col-lg-4">
              <div class="card h-100 shadow-sm hover-card border-0" style="transition: transform 0.2s;">
                <div class="position-relative" style="cursor: pointer;" onclick="window.startVideoLesson(${idx})">
                  <img src="https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg" class="card-img-top" alt="Video thumbnail" style="object-fit: cover; height: 200px;">
                  <div class="position-absolute top-50 start-50 translate-middle text-white bg-dark bg-opacity-75 rounded-circle p-3 shadow">
                    <i class="bi bi-play-fill fs-1"></i>
                  </div>
                </div>
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title fw-bold">${lesson.title}</h5>
                  <p class="card-text small text-muted mb-4">${lesson.description}</p>
                  <button class="btn btn-outline-danger w-100 mt-auto" onclick="window.startVideoLesson(${idx})">
                    Start Lesson
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="text-center mt-5">
            <a href="/" class="btn btn-link text-decoration-none text-muted"><i class="bi bi-arrow-left"></i> Back to Home</a>
        </div>
      </div>
    `;
  }

  window.startVideoLesson = function(idx) {
    const lesson = videoLessons[idx];
    
    const vocabListHtml = lesson.vocabulary.map(v => `
      <li class="list-group-item d-flex justify-content-between align-items-start border-0 border-bottom py-3">
        <div class="ms-2 me-auto">
          <div class="fw-bold text-primary fs-5 mb-1">${v.word}</div>
          <span class="text-muted">${v.def}</span>
        </div>
      </li>
    `).join('');

    const questionsHtml = lesson.questions.map((q, qIdx) => `
      <div class="card mb-4 border-0 shadow-sm bg-white">
        <div class="card-body p-4">
          <p class="fw-bold mb-3 fs-5 text-dark">
            <span class="badge bg-secondary me-2">${qIdx + 1}</span> ${q.question}
          </p>
          <div class="d-grid gap-2 d-md-block">
            ${q.options.map((opt) => `
              <button class="btn btn-outline-dark video-quiz-btn me-2 mb-2" 
                data-correct="${opt.isCorrect}" 
                data-feedback="${lesson.questions[qIdx].feedback}">
                ${opt.text}
              </button>
            `).join('')}
          </div>
          <div class="mt-3 feedback-area fw-bold small"></div>
        </div>
      </div>
    `).join('');

    videoContainer.innerHTML = `
      <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto;">
        <!-- Навігація назад -->
        <button class="btn btn-light mb-4 text-decoration-none shadow-sm" onclick="window.location.reload()">
          <i class="bi bi-arrow-left me-2"></i>Back to Lessons
        </button>
        
        <h2 class="mb-3 fw-bold text-dark">${lesson.title}</h2>
        
        <!-- Відео плеєр -->
        <div class="ratio ratio-16x9 mb-5 shadow-lg rounded-3 overflow-hidden bg-dark">
            <video width="320" height="240" controls>
                <source src="./video/videoplayback.mp4" type="video/mp4">
            </video>
        </div>

        <!-- Вкладки -->
        <ul class="nav nav-pills nav-fill mb-4 bg-white p-2 rounded shadow-sm" id="pills-tab" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active fw-bold" id="pills-vocab-tab" data-bs-toggle="pill" data-bs-target="#pills-vocab" type="button">
              <i class="bi bi-journal-text me-2"></i>Vocabulary
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link fw-bold" id="pills-quiz-tab" data-bs-toggle="pill" data-bs-target="#pills-quiz" type="button">
              <i class="bi bi-check-square me-2"></i>Quiz
            </button>
          </li>
        </ul>

        <!-- Контент вкладок -->
        <div class="tab-content" id="pills-tabContent">
          
          <!-- Вкладка Слів -->
          <div class="tab-pane fade show active" id="pills-vocab" role="tabpanel">
            <div class="alert alert-info border-0 bg-info bg-opacity-10 mb-4">
              <i class="bi bi-info-circle-fill me-2"></i> Review these words before watching the video.
            </div>
            <ul class="list-group list-group-flush rounded shadow-sm bg-white">
              ${vocabListHtml}
            </ul>
          </div>
          
          <!-- Вкладка Тесту -->
          <div class="tab-pane fade" id="pills-quiz" role="tabpanel">
            <div class="alert alert-warning border-0 bg-warning bg-opacity-10 mb-4">
              <i class="bi bi-pencil-fill me-2"></i> Watch the video first, then answer these questions.
            </div>
            ${questionsHtml}
            <div class="text-center mt-5">
              <button class="btn btn-primary btn-lg px-5" onclick="window.location.reload()">
                Finish Lesson
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    initQuizButtons();
  };

  function initQuizButtons() {
    document.querySelectorAll('.video-quiz-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clickedBtn = e.target;
        const isCorrect = clickedBtn.dataset.correct === 'true';
        const feedbackText = clickedBtn.dataset.feedback;
        const feedbackArea = clickedBtn.parentElement.nextElementSibling;
        const parentDiv = clickedBtn.parentElement;
        
        parentDiv.querySelectorAll('button').forEach(b => {
          b.disabled = true;
          if(b.dataset.correct === 'true') {
             b.classList.remove('btn-outline-dark');
             b.classList.add('btn-success');
          }
        });

        if (isCorrect) {
          clickedBtn.classList.remove('btn-outline-dark');
          clickedBtn.classList.add('btn-success');
          feedbackArea.innerHTML = `
            <div class="alert alert-success mt-3 py-2">
              <i class="bi bi-check-circle-fill me-2"></i> Correct! <span class="fw-normal">${feedbackText}</span>
            </div>`;
        } else {
          clickedBtn.classList.remove('btn-outline-dark');
          clickedBtn.classList.add('btn-danger');
          feedbackArea.innerHTML = `
            <div class="alert alert-danger mt-3 py-2">
              <i class="bi bi-x-circle-fill me-2"></i> Incorrect.
            </div>`;
        }
      });
    });
  }

});