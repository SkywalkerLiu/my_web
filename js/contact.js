document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', event => {
            event.preventDefault();
            alert('感谢您的留言！我会尽快回复您。');
            contactForm.reset();
        });
    }

    document.querySelectorAll('.faq-question').forEach(button => {
        button.setAttribute('aria-expanded', 'false');

        button.addEventListener('click', () => {
            const item = button.closest('.faq-item');
            if (!item) {
                return;
            }

            const isOpen = item.classList.toggle('active');
            button.setAttribute('aria-expanded', String(isOpen));
        });
    });
});
