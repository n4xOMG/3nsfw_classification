document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('remove-btn');
    const uploadContent = document.querySelector('.upload-content');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    // Results Elements
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const analysisResult = document.getElementById('analysis-result');
    const verdictText = document.getElementById('verdict-text');
    const verdictConfidence = document.getElementById('verdict-confidence');
    const verdictCard = document.getElementById('verdict-card');
    
    const scoreSafe = document.getElementById('score-safe');
    const barSafe = document.getElementById('bar-safe');
    const scoreMild = document.getElementById('score-mild');
    const barMild = document.getElementById('bar-mild');
    const scoreExplicit = document.getElementById('score-explicit');
    const barExplicit = document.getElementById('bar-explicit');

    // State
    let currentFile = null;
    const API_URL = 'https://n4xtan-nsfw-classification.hf.space/predict';

    // Event Listeners

    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUpload();
    });

    analyzeBtn.addEventListener('click', analyzeImage);

    // Functions
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            previewContainer.classList.remove('hidden');
            uploadContent.style.opacity = '0';
            analyzeBtn.disabled = false;
            
            // Reset results when new image is uploaded
            resetResults();
        };
        
        reader.readAsDataURL(file);
    }

    function resetUpload() {
        currentFile = null;
        fileInput.value = '';
        previewContainer.classList.add('hidden');
        uploadContent.style.opacity = '1';
        analyzeBtn.disabled = true;
        resetResults();
    }

    function resetResults() {
        emptyState.classList.remove('hidden');
        loadingState.classList.add('hidden');
        analysisResult.classList.add('hidden');
    }

    async function analyzeImage() {
        if (!currentFile) return;

        // UI Updates
        emptyState.classList.add('hidden');
        loadingState.classList.remove('hidden');
        analysisResult.classList.add('hidden');
        analyzeBtn.disabled = true;
        
        // Start scanning effect
        previewContainer.classList.add('scanning');

        const formData = new FormData();
        formData.append('image', currentFile);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            console.error('Error:', error);
            alert('Analysis failed. Please check your internet connection or try again later.\n\nNote: If this is a static site, ensure the API supports CORS.');
            resetResults();
        } finally {
            loadingState.classList.add('hidden');
            analyzeBtn.disabled = false;
            // Stop scanning effect
            previewContainer.classList.remove('scanning');
        }
    }

    function displayResults(data) {
        analysisResult.classList.remove('hidden');
        
        // Update Verdict
        verdictText.textContent = data.predicted_class;
        verdictConfidence.textContent = `${(data.confidence * 100).toFixed(2)}% Confidence`;
        
        // Color coding based on result
        verdictCard.style.borderColor = getVerdictColor(data.predicted_class);
        verdictText.style.background = 'linear-gradient(to right, #fff, #cbd5e1)';
        
        if (data.predicted_class === 'NSFW Explicit') {
            verdictText.style.background = 'linear-gradient(to right, #ef4444, #f87171)';
            verdictText.style.webkitBackgroundClip = 'text';
            verdictText.style.webkitTextFillColor = 'transparent';
        } else if (data.predicted_class === 'NSFW Mild') {
            verdictText.style.background = 'linear-gradient(to right, #f59e0b, #fbbf24)';
            verdictText.style.webkitBackgroundClip = 'text';
            verdictText.style.webkitTextFillColor = 'transparent';
        } else {
             verdictText.style.background = 'linear-gradient(to right, #10b981, #34d399)';
             verdictText.style.webkitBackgroundClip = 'text';
             verdictText.style.webkitTextFillColor = 'transparent';
        }

        // Update Scores
        const scores = data.all_scores;
        
        updateBar(scoreSafe, barSafe, scores['Safe']);
        updateBar(scoreMild, barMild, scores['NSFW Mild']);
        updateBar(scoreExplicit, barExplicit, scores['NSFW Explicit']);
    }

    function updateBar(textEl, barEl, score) {
        const percentage = (score * 100).toFixed(1);
        textEl.textContent = `${percentage}%`;
        // Small delay to allow transition
        setTimeout(() => {
            barEl.style.width = `${percentage}%`;
        }, 50);
    }

    function getVerdictColor(className) {
        switch(className) {
            case 'Safe': return 'var(--safe-color)';
            case 'NSFW Mild': return 'var(--mild-color)';
            case 'NSFW Explicit': return 'var(--explicit-color)';
            default: return 'var(--text-muted)';
        }
    }
});
