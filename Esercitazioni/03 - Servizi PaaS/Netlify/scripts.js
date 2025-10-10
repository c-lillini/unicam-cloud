document.addEventListener('DOMContentLoaded', () => {
    const yearTarget = document.getElementById('current-year');
    if (yearTarget) {
        yearTarget.textContent = new Date().getFullYear();
    }

    const revealTargets = document.querySelectorAll(
        '.hero__content, section, .card, .contact-card'
    );

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        }
    );

    revealTargets.forEach((target, index) => {
        target.classList.add('reveal');
        const delay = Math.min(index * 40, 400);
        target.style.setProperty('--reveal-delay', `${delay}ms`);
        revealObserver.observe(target);
    });

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const targetId = anchor.getAttribute('href').slice(1);
            if (!targetId) {
                return;
            }
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                event.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    const scrollTopButton = document.createElement('button');
    scrollTopButton.className = 'scroll-top';
    scrollTopButton.type = 'button';
    scrollTopButton.setAttribute('aria-label', 'Torna all\'inizio');
    scrollTopButton.textContent = 'Top';

    scrollTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(scrollTopButton);

    const toggleScrollTop = () => {
        if (window.scrollY > 320) {
            scrollTopButton.classList.add('is-active');
        } else {
            scrollTopButton.classList.remove('is-active');
        }
    };

    window.addEventListener('scroll', toggleScrollTop, { passive: true });
    toggleScrollTop();
});
