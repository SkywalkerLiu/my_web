document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (!filterButtons.length || !galleryItems.length) {
        return;
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(item => item.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;
            galleryItems.forEach(item => {
                item.style.display = filter === 'all' || item.dataset.category === filter ? 'block' : 'none';
            });
        });
    });
});
