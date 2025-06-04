// Quiz data
const quizData = {
    pillar: {
        title: "Which Pillar Are You?",
        questions: [
            {
                question: "When faced with a problem, you tend to:",
                options: [
                    "Analyze it from multiple angles before making a decision",
                    "Research and learn from similar past experiences",
                    "Discuss it with others to get different perspectives",
                    "Work with a team to find the best solution"
                ],
                weights: {
                    "Critical Thinking": [4, 1, 2, 2],
                    "Lifelong Learning": [2, 4, 2, 1],
                    "Communication": [1, 2, 4, 2],
                    "Collaboration": [2, 1, 2, 4]
                }
            },
            {
                question: "In a group project, you typically:",
                options: [
                    "Focus on finding the most efficient solution",
                    "Learn new skills while contributing",
                    "Ensure everyone's ideas are heard",
                    "Coordinate team efforts and delegate tasks"
                ],
                weights: {
                    "Critical Thinking": [4, 1, 2, 2],
                    "Lifelong Learning": [1, 4, 2, 1],
                    "Communication": [1, 2, 4, 2],
                    "Collaboration": [2, 1, 2, 4]
                }
            },
            {
                question: "Your ideal learning environment is:",
                options: [
                    "Solving complex puzzles and challenges",
                    "Exploring new topics and ideas",
                    "Discussing concepts with others",
                    "Working on team projects"
                ],
                weights: {
                    "Critical Thinking": [4, 2, 1, 1],
                    "Lifelong Learning": [2, 4, 2, 1],
                    "Communication": [1, 2, 4, 2],
                    "Collaboration": [1, 1, 2, 4]
                }
            }
        ]
    },
    communication: {
        title: "Communication Skills Assessment",
        questions: [
            {
                question: "When presenting to a group, you:",
                options: [
                    "Focus on clear, logical arguments",
                    "Research thoroughly to ensure accuracy",
                    "Engage the audience with stories and examples",
                    "Encourage group discussion and feedback"
                ],
                weights: {
                    "Clarity": [4, 2, 3, 1],
                    "Accuracy": [2, 4, 2, 1],
                    "Engagement": [1, 2, 4, 2],
                    "Interaction": [1, 1, 2, 4]
                }
            },
            {
                question: "In a disagreement, you typically:",
                options: [
                    "Present facts and logical arguments",
                    "Research the topic to understand both sides",
                    "Listen carefully to understand others' perspectives",
                    "Work to find a compromise that satisfies everyone"
                ],
                weights: {
                    "Clarity": [4, 2, 1, 2],
                    "Accuracy": [2, 4, 2, 1],
                    "Engagement": [1, 2, 4, 2],
                    "Interaction": [2, 1, 2, 4]
                }
            }
        ]
    }
};

// Quiz state
let currentQuiz = null;
let currentQuestion = 0;
let answers = [];
let scores = {};

// DOM Elements
const quizContainer = document.getElementById('quiz-container');
const resultsContainer = document.getElementById('results-container');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressBar = document.getElementById('quiz-progress');
const questionNumber = document.getElementById('question-number');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Start quiz
function startQuiz(quizType) {
    currentQuiz = quizData[quizType];
    currentQuestion = 0;
    answers = [];
    scores = {};
    
    // Hide quiz cards and show quiz container
    document.querySelector('.quiz-grid').style.display = 'none';
    quizContainer.style.display = 'block';
    resultsContainer.style.display = 'none';
    
    // Initialize the first question
    showQuestion();
}

// Show current question
function showQuestion() {
    const question = currentQuiz.questions[currentQuestion];
    questionText.textContent = question.question;
    
    // Update progress
    const progress = ((currentQuestion + 1) / currentQuiz.questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    questionNumber.textContent = `Question ${currentQuestion + 1}/${currentQuiz.questions.length}`;
    
    // Clear and populate options
    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        if (answers[currentQuestion] === index) {
            optionElement.classList.add('selected');
        }
        optionElement.textContent = option;
        optionElement.onclick = () => selectOption(index);
        optionsContainer.appendChild(optionElement);
    });
    
    // Update navigation buttons
    prevBtn.disabled = currentQuestion === 0;
    nextBtn.textContent = currentQuestion === currentQuiz.questions.length - 1 ? 'Finish' : 'Next';
}

// Select an option
function selectOption(index) {
    answers[currentQuestion] = index;
    showQuestion();
}

// Previous question
function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion();
    }
}

// Next question
function nextQuestion() {
    if (currentQuestion < currentQuiz.questions.length - 1) {
        currentQuestion++;
        showQuestion();
    } else {
        calculateResults();
    }
}

// Calculate results
function calculateResults() {
    // Initialize scores
    Object.keys(currentQuiz.questions[0].weights).forEach(pillar => {
        scores[pillar] = 0;
    });
    
    // Calculate scores
    currentQuiz.questions.forEach((question, qIndex) => {
        const answer = answers[qIndex];
        Object.keys(question.weights).forEach(pillar => {
            scores[pillar] += question.weights[pillar][answer];
        });
    });
    
    // Find dominant pillar
    let maxScore = 0;
    let dominantPillar = '';
    Object.entries(scores).forEach(([pillar, score]) => {
        if (score > maxScore) {
            maxScore = score;
            dominantPillar = pillar;
        }
    });
    
    // Show results
    showResults(dominantPillar);
}

// Show results
function showResults(dominantPillar) {
    quizContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    const resultsContent = document.getElementById('results-content');
    const recommendations = document.getElementById('recommendations');
    
    // Display results
    resultsContent.innerHTML = `
        <h3>Your Dominant Pillar: ${dominantPillar}</h3>
        <p>Based on your answers, you show strong alignment with the ${dominantPillar} pillar.</p>
    `;
    
    // Display recommendations based on the dominant pillar
    const pillarRecommendations = {
        "Critical Thinking": [
            "Practice solving complex problems",
            "Engage in analytical discussions",
            "Learn a new programming language"
        ],
        "Lifelong Learning": [
            "Take an online course in a new subject",
            "Read books outside your comfort zone",
            "Attend workshops and seminars"
        ],
        "Communication": [
            "Join a public speaking group",
            "Practice active listening",
            "Write a blog or journal"
        ],
        "Collaboration": [
            "Join a team project",
            "Participate in group activities",
            "Practice conflict resolution"
        ]
    };
    
    recommendations.innerHTML = `
        <h4>Recommended Activities:</h4>
        <ul>
            ${pillarRecommendations[dominantPillar].map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    `;
}

// Restart quiz
function restartQuiz() {
    resultsContainer.style.display = 'none';
    document.querySelector('.quiz-grid').style.display = 'grid';
} 