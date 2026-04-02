document.addEventListener('DOMContentLoaded', () => {
    const subtitle = document.querySelector('.subtitle');
    if (!subtitle || subtitle.dataset.typed === 'false') {
        return;
    }

    const originalText = subtitle.textContent;
    subtitle.textContent = '';

    let index = 0;
    const typeNextCharacter = () => {
        if (index >= originalText.length) {
            return;
        }

        subtitle.textContent += originalText.charAt(index);
        index += 1;
        window.setTimeout(typeNextCharacter, 50);
    };

    window.setTimeout(typeNextCharacter, 500);
});
