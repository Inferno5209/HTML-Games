// Pillar Data (copied from main.js for self-containment)
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
            { title: 'Respect Reflection Journal', link: 'resources/respect-journal.pdf' },
            { title: 'Cultural Awareness Guide', link: 'resources/cultural-awareness.pdf' }
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
            { title: 'Research Project', description: 'Students conducted independent research and presented findings with supporting evidence.' },
            { title: 'Debate Competition', description: 'Team won regional debate championship through strong argumentation and evidence-based reasoning.' }
        ],
        resources: [
            { title: 'Critical Analysis Framework', link: 'resources/critical-thinking-framework.pdf' },
            { title: 'Evidence Evaluation Guide', link: 'resources/evidence-evaluation.pdf' }
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
            { title: 'Internship Program', description: 'Students completed successful internships with local businesses and organizations.' },
            { title: 'Industry Certification', description: 'Students earned professional certifications in their technical areas.' }
        ],
        resources: [
            { title: 'Professional Skills Assessment', link: 'resources/work-readiness-assessment.pdf' },
            { title: 'Career Planning Workbook', link: 'resources/career-planning.pdf' }
        ]
    },
    'skilled-socially': {
        definition: 'The ability to navigate social situations with confidence, build meaningful relationships, and contribute positively to group dynamics, demonstrated through:',
        importance: 'Being skilled socially is crucial for personal growth, professional success, and creating positive environments in both academic and workplace settings.',
        keyAspects: [
            'Effective use of verbal and non-verbal communication skills',
            'Ability to work as part of a team',
            'Interactions with diverse audiences in a manner appropriate for the setting',
            'Empathizing and valuing others'
        ],
        examples: [
            {
                title: 'Peer Mentoring Program',
                description: 'Students successfully mentored and supported their peers through academic and personal challenges.'
            },
            {
                title: 'Community Engagement Project',
                description: 'Led initiatives that brought together diverse groups to address community needs.'
            }
        ],
        resources: [
            {
                title: 'Social Intelligence Assessment',
                link: 'resources/social-intelligence-assessment.pdf'
            },
            {
                title: 'Relationship Building Guide',
                link: 'resources/relationship-building.pdf'
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
            { title: 'Presentation Skills', description: 'Students delivered professional presentations to industry experts.' },
            { title: 'Technical Documentation', description: 'Created comprehensive technical documentation for complex projects.' }
        ],
        resources: [
            { title: 'Presentation Skills Guide', link: 'resources/presentation-guide.pdf' },
            { title: 'Technical Writing Template', link: 'resources/technical-writing.pdf' }
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pillarType = urlParams.get('pillar');

    if (pillarType && pillarData[pillarType]) {
        displayPillarDetails(pillarType);
    } else {
        // Handle case where pillar type is not found
        document.getElementById('pillar-detail-title').textContent = 'Pillar Not Found';
        document.getElementById('pillar-definition').innerHTML = '<p>The requested pillar could not be found.</p>';
        document.getElementById('pillar-importance').textContent = '';
        document.getElementById('pillar-examples').innerHTML = '';
        document.getElementById('page-title').textContent = 'Pillar Not Found';
    }
});

function displayPillarDetails(pillarType) {
    const data = pillarData[pillarType];

    // Update page title
    document.getElementById('page-title').textContent = `${pillarType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} - Windham Technical High School VoG Connect`;

    // Update hero title
    document.getElementById('pillar-detail-title').textContent = pillarType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // Update definition and key aspects
    let definitionHTML = `<p>${data.definition}</p>`;
    if (data.keyAspects && data.keyAspects.length > 0) {
        definitionHTML += '<ul>' + data.keyAspects.map(aspect => `<li>${aspect}</li>`).join('') + '</ul>';
    }
    document.getElementById('pillar-definition').innerHTML = definitionHTML;

    // Update importance
    document.getElementById('pillar-importance').textContent = data.importance;

    // Update examples
    const examplesContainer = document.getElementById('pillar-examples');
    if (data.examples && data.examples.length > 0) {
        examplesContainer.innerHTML = data.examples.map(example => `
            <div class="example-item">
                <h4>${example.title}</h4>
                <p>${example.description}</p>
            </div>
        `).join('');
    } else {
        examplesContainer.innerHTML = '<p>No student examples available for this pillar yet.</p>';
    }

    // Note: Resources are not explicitly requested for this new page structure,
    // so they are not included in this display function.
} 