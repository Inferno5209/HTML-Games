// Pillar Data
const pillarData = {
    'problem-solving': {
        definition: 'The ability to identify, analyze, and solve complex problems through systematic thinking and creative approaches, demonstrated by:',
        importance: 'Problem-solving skills are essential for success in both academic and professional settings. They enable students to tackle challenges effectively and develop innovative solutions.',
        keyAspects: [
            'Collaboration',
            'Creativity and out-of-the-box thinking',
            'Perseverance and adapting to changes',
            'Determination of root causes of issues',
            'Identification of multiple solutions',
            'Selection of the most sensible approach',
            'Follow through'
        ],
        examples: [
            {
                title: 'Engineering Project',
                description: 'Students designed and built a sustainable water filtration system for a local community.'
            },
            {
                title: 'Robotics Competition',
                description: 'Team successfully programmed a robot to navigate complex obstacles and complete tasks.'
            }
        ],
        resources: [
            {
                title: 'Problem Analysis Worksheet',
                link: 'resources/problem-solving-analysis.pdf'
            },
            {
                title: 'Solution Brainstorming Template',
                link: 'resources/problem-solving-brainstorm.pdf'
            }
        ]
    },
    'respect': {
        definition: 'Demonstrating consideration and appreciation for others, embracing diversity, and maintaining professional conduct, shown through:',
        importance: 'Respect is fundamental to creating a positive learning environment and building strong relationships in both academic and professional settings.',
        keyAspects: [
            'Embracement of cultural diversity',
            'Practice of kindness and consideration',
            'Understanding and respect for organizational structures',
            'Demonstrations of professionalism',
            'Professional and caring communication'
        ],
        examples: [
            {
                title: 'Cultural Awareness Project',
                description: 'Students organized a school-wide celebration of diverse cultural traditions.'
            },
            {
                title: 'Community Service',
                description: 'Volunteer program where students mentor younger students in the community.'
            }
        ],
        resources: [
            {
                title: 'Respect Reflection Journal',
                link: 'resources/respect-journal.pdf'
            },
            {
                title: 'Cultural Awareness Guide',
                link: 'resources/cultural-awareness.pdf'
            }
        ]
    },
    'critical-thinking': {
        definition: 'The ability to analyze information objectively, evaluate evidence, and make informed decisions by:',
        importance: 'Critical thinking enables students to make well-reasoned decisions and solve complex problems in various contexts.',
        keyAspects: [
            'Unbiased analysis and evaluation application',
            'Evaluation of sources of information reliability',
            'Innovation',
            'Willingness to adapt to new information and question things',
            'Rational decision making based on the application of evidence and observation'
        ],
        examples: [
            {
                title: 'Research Project',
                description: 'Students conducted independent research and presented findings with supporting evidence.'
            },
            {
                title: 'Debate Competition',
                description: 'Team won regional debate championship through strong argumentation and evidence-based reasoning.'
            }
        ],
        resources: [
            {
                title: 'Critical Analysis Framework',
                link: 'resources/critical-thinking-framework.pdf'
            },
            {
                title: 'Evidence Evaluation Guide',
                link: 'resources/evidence-evaluation.pdf'
            }
        ]
    },
    'work-readiness': {
        definition: 'Possessing the knowledge, skills, and professional attributes necessary for success in the workplace, including:',
        importance: 'Work readiness prepares students for successful careers by developing essential professional skills and industry knowledge.',
        keyAspects: [
            'Motivation to continue learning',
            'Possession of knowledge and skills in the industry area',
            'Modeling of employability skills; i.e., punctuality, appropriate dress code, dependability, good attitude, and time management',
            'Strong work ethic'
        ],
        examples: [
            {
                title: 'Internship Program',
                description: 'Students completed successful internships with local businesses and organizations.'
            },
            {
                title: 'Industry Certification',
                description: 'Students earned professional certifications in their technical areas.'
            }
        ],
        resources: [
            {
                title: 'Professional Skills Assessment',
                link: 'resources/work-readiness-assessment.pdf'
            },
            {
                title: 'Career Planning Workbook',
                link: 'resources/career-planning.pdf'
            }
        ]
    },
    'social-skills': {
        definition: 'The ability to interact effectively with others, work in teams, and communicate appropriately in various settings, such as:',
        importance: 'Strong social skills are essential for building relationships, collaborating effectively, and succeeding in professional environments.',
        keyAspects: [
            'Effective use of verbal and non-verbal communication skills',
            'Ability to work as part of a team',
            'Interactions with diverse audiences in a manner appropriate for the setting',
            'Empathizing and valuing others'
        ],
        examples: [
            {
                title: 'Team Project',
                description: 'Students collaborated on a complex project requiring effective communication and teamwork.'
            },
            {
                title: 'Leadership Program',
                description: 'Students organized and led school-wide events and initiatives.'
            }
        ],
        resources: [
            {
                title: 'Teamwork Assessment Tool',
                link: 'resources/teamwork-assessment.pdf'
            },
            {
                title: 'Communication Skills Workbook',
                link: 'resources/communication-workbook.pdf'
            }
        ]
    },
    'effective-communication': {
        definition: 'The ability to convey information clearly and effectively through various modes of communication, demonstrated by:',
        importance: 'Effective communication is crucial for success in academic, professional, and personal contexts.',
        keyAspects: [
            'Conveying information for shared understanding in a clear and concise manner',
            'Ability to use multiple modes of communication',
            'Command of the language; written and verbal',
            'Active listening'
        ],
        examples: [
            {
                title: 'Presentation Skills',
                description: 'Students delivered professional presentations to industry experts.'
            },
            {
                title: 'Technical Documentation',
                description: 'Created comprehensive technical documentation for complex projects.'
            }
        ],
        resources: [
            {
                title: 'Presentation Skills Guide',
                link: 'resources/presentation-guide.pdf'
            },
            {
                title: 'Technical Writing Template',
                link: 'resources/technical-writing.pdf'
            }
        ]
    }
};

// DOM Elements
// Remove modal elements
// const modal = document.getElementById('pillar-modal');
// const closeModal = document.querySelector('.close-modal');
// const modalTitle = document.getElementById('modal-title');
// const modalDefinition = document.getElementById('modal-definition');
// const modalImportance = document.getElementById('modal-importance');
// const modalExamples = document.getElementById('modal-examples');
// const modalResources = document.getElementById('modal-resources');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializePillars();
    setupEventListeners();
    setupLoadingState();
});

// Initialize Pillars
function initializePillars() {
    const pillars = document.querySelectorAll('.pillar');
    pillars.forEach(pillar => {
        const pillarType = pillar.dataset.pillar;
        if (pillarData[pillarType]) {
            // setupPillarContent(pillar, pillarType); // Not needed anymore, hover handled by CSS, click changed
             // Add click handler
            pillar.addEventListener('click', () => {
                // Navigate to the pillar detail page
                window.location.href = `pillar-detail.html?pillar=${pillarType}`;
            });

            // Keep hover effect if desired (currently in CSS)
        }
    });
}

// Setup Pillar Content (function removed as its logic is moved or no longer needed)
// function setupPillarContent(pillar, pillarType) { ... }

// Show Pillar Details (function removed as navigation is used instead)
// function showPillarDetails(pillarType) { ... }

// Setup Event Listeners - Remove modal specific listeners
function setupEventListeners() {
    // Close modal (removed)
    // closeModal.addEventListener('click', () => { ... });

    // Close modal on outside click (removed)
    // window.addEventListener('click', (e) => { ... });

    // Handle keyboard navigation (removed modal escape key listener)
    document.addEventListener('keydown', (e) => {
        // Removed: if (e.key === 'Escape' && modal.style.display === 'block') { ... }
    });
    
    // Keep other event listeners if any
}

// Setup Loading State
function setupLoadingState() {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);

    window.addEventListener('load', () => {
        gsap.to(loading, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                loading.remove();
            }
        });
    });
}

// Handle Navigation
document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.getAttribute('href');
        
        // Add loading state
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(loading);

        // Simulate loading (replace with actual page transition)
        setTimeout(() => {
            window.location.href = target;
        }, 500);
    });
});

// Handle Print
window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.pillar').forEach(pillar => {
        pillar.style.animation = 'none';
    });
});

// Handle Window Resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Update layout if needed
        const pillars = document.querySelectorAll('.pillar');
        pillars.forEach(pillar => {
            pillar.style.height = window.innerWidth < 768 ? '250px' : '300px';
        });
    }, 250);
});

// Export animation functions for use in other files
gsap.from('.modal-content', {
    y: -50,
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out'
}); 