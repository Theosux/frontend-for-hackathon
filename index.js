// JS to extract to index.js
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            const featureCards = document.querySelectorAll('.feature-card');
            const featureContainer = document.querySelector('.feature-container');
            const processContainer = document.querySelector('.process-container');
            const exploreBtn = document.getElementById('explore-features-btn');

            // --- Scroll Reveal Logic ---
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const card = entry.target;
                        const delay = parseInt(card.getAttribute('data-delay') || 0);
                        
                        // Ensure main containers are visible
                        featureContainer.classList.add('visible');
                        processContainer.classList.add('visible');

                        // Sequential animation for cards
                        setTimeout(() => {
                            card.classList.add('visible');
                        }, delay);
                        
                        observer.unobserve(card);
                    }
                });
            }, {
                rootMargin: '0px',
                threshold: 0.1
            });

            // --- Scroll Button Logic ---
            if (exploreBtn) {
                exploreBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // 1. Smoothly scroll to the features section
                    const target = document.getElementById('features');
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }

                    // 2. Immediately trigger the fade-in for the main containers
                    featureContainer.classList.add('visible');
                    processContainer.classList.add('visible');

                    // 3. Start observing to trigger sequential card animations
                    featureCards.forEach(card => {
                        observer.observe(card);
                    });
                });
            }

            // Start observing for regular scroll if the button isn't used
            // This ensures the animation still works if the user manually scrolls
            featureCards.forEach(card => {
                observer.observe(card);
            });
        });
