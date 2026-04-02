document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        if (!navLinks.id) {
            navLinks.id = 'site-navigation';
        }

        hamburger.setAttribute('aria-controls', navLinks.id);

        const syncMenuState = isOpen => {
            navLinks.classList.toggle('active', isOpen);
            hamburger.classList.toggle('active', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
        };

        syncMenuState(false);

        hamburger.addEventListener('click', () => {
            syncMenuState(!navLinks.classList.contains('active'));
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                syncMenuState(false);
            });
        });
    }

    if (navbar) {
        const handleScroll = () => {
            navbar.classList.toggle('is-scrolled', window.scrollY > 50);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    initRevealAnimations();
});

function initRevealAnimations() {
    const revealTargets = document.querySelectorAll(
        '.skill-card, .stat-item, .highlight-card, .gallery-item, .tool-card, .contact-card, .tip-card, .sponsor-card'
    );

    if (!revealTargets.length) {
        return;
    }

    if (!('IntersectionObserver' in window)) {
        revealTargets.forEach(element => {
            element.classList.add('is-visible');
        });
        return;
    }

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }
    );

    revealTargets.forEach(element => {
        element.classList.add('reveal-ready');
        observer.observe(element);
    });
}
