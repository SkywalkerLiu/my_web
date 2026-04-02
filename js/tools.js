document.addEventListener('DOMContentLoaded', () => {
    bindCalculator();
    bindTextCounter();
    bindColorConverter();
    bindUrlTools();
    bindTimestampTool();
    bindPasswordGenerator();
});

function bindCalculator() {
    const display = document.getElementById('calcDisplay');
    const appendButtons = document.querySelectorAll('[data-calc-value]');
    const clearButton = document.getElementById('calcClearBtn');
    const equalsButton = document.getElementById('calcEqualsBtn');

    if (!display || !appendButtons.length || !clearButton || !equalsButton) {
        return;
    }

    let calcValue = display.value || '0';

    const syncDisplay = () => {
        display.value = calcValue;
    };

    const appendValue = value => {
        if (calcValue === '0') {
            if (value === '.') {
                calcValue = '0.';
                syncDisplay();
                return;
            }

            if ([')', '+', '*', '/'].includes(value)) {
                return;
            }

            calcValue = value;
            syncDisplay();
            return;
        }

        calcValue += value;
        syncDisplay();
    };

    const clearValue = () => {
        calcValue = '0';
        syncDisplay();
    };

    const calculateResult = () => {
        try {
            const result = evaluateExpression(calcValue);
            calcValue = formatCalculationResult(result);
            syncDisplay();
        } catch (error) {
            calcValue = '0';
            display.value = 'Error';
        }
    };

    appendButtons.forEach(button => {
        button.addEventListener('click', () => {
            appendValue(button.dataset.calcValue);
        });
    });

    clearButton.addEventListener('click', clearValue);
    equalsButton.addEventListener('click', calculateResult);
}

function evaluateExpression(expression) {
    const tokens = tokenizeExpression(expression);
    let currentIndex = 0;

    const peek = () => tokens[currentIndex];
    const consume = () => tokens[currentIndex++];

    const parseExpression = () => {
        let value = parseTerm();

        while (peek() && ['+', '-'].includes(peek().value)) {
            const operator = consume().value;
            const right = parseTerm();
            value = operator === '+' ? value + right : value - right;
        }

        return value;
    };

    const parseTerm = () => {
        let value = parseFactor();

        while (peek() && ['*', '/'].includes(peek().value)) {
            const operator = consume().value;
            const right = parseFactor();

            if (operator === '/' && right === 0) {
                throw new Error('不能除以 0');
            }

            value = operator === '*' ? value * right : value / right;
        }

        return value;
    };

    const parseFactor = () => {
        const token = peek();
        if (!token) {
            throw new Error('表达式不完整');
        }

        if (token.value === '+') {
            consume();
            return parseFactor();
        }

        if (token.value === '-') {
            consume();
            return -parseFactor();
        }

        if (token.value === '(') {
            consume();
            const value = parseExpression();
            if (!peek() || peek().value !== ')') {
                throw new Error('括号未闭合');
            }
            consume();
            return value;
        }

        if (token.type === 'number') {
            consume();
            return token.value;
        }

        throw new Error('无效表达式');
    };

    const result = parseExpression();
    if (currentIndex !== tokens.length) {
        throw new Error('无效表达式');
    }

    if (!Number.isFinite(result)) {
        throw new Error('计算结果无效');
    }

    return result;
}

function tokenizeExpression(expression) {
    const tokens = [];
    let index = 0;

    while (index < expression.length) {
        const char = expression[index];

        if (/\s/.test(char)) {
            index += 1;
            continue;
        }

        if ('()+-*/'.includes(char)) {
            tokens.push({ type: 'operator', value: char });
            index += 1;
            continue;
        }

        if (/\d|\./.test(char)) {
            let value = '';
            let dotCount = 0;

            while (index < expression.length && /[\d.]/.test(expression[index])) {
                if (expression[index] === '.') {
                    dotCount += 1;
                }
                value += expression[index];
                index += 1;
            }

            if (dotCount > 1 || value === '.') {
                throw new Error('数字格式无效');
            }

            tokens.push({ type: 'number', value: Number(value) });
            continue;
        }

        throw new Error(`不支持的字符: ${char}`);
    }

    return tokens;
}

function formatCalculationResult(value) {
    if (Number.isInteger(value)) {
        return String(value);
    }

    return String(Number(value.toFixed(12)));
}

function bindTextCounter() {
    const textToCount = document.getElementById('textToCount');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');
    const lineCount = document.getElementById('lineCount');

    if (!textToCount || !charCount || !wordCount || !lineCount) {
        return;
    }

    const updateCounts = () => {
        const text = textToCount.value;
        charCount.textContent = text.length;
        wordCount.textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
        lineCount.textContent = text ? text.split('\n').length : 0;
    };

    updateCounts();
    textToCount.addEventListener('input', updateCounts);
}

function bindColorConverter() {
    const hexInput = document.getElementById('hexInput');
    const rgbInput = document.getElementById('rgbInput');
    const preview = document.getElementById('colorPreview');
    const convertButton = document.getElementById('colorConvertBtn');

    if (!hexInput || !rgbInput || !preview || !convertButton) {
        return;
    }

    const convertColor = () => {
        const hex = hexInput.value.trim();
        const matched = /^#?([a-f\d]{6})$/i.exec(hex);
        if (!matched) {
            rgbInput.value = '请输入 6 位 HEX 颜色值';
            return;
        }

        const normalized = `#${matched[1]}`;
        const r = parseInt(matched[1].slice(0, 2), 16);
        const g = parseInt(matched[1].slice(2, 4), 16);
        const b = parseInt(matched[1].slice(4, 6), 16);

        hexInput.value = normalized;
        rgbInput.value = `${r}, ${g}, ${b}`;
        preview.style.background = normalized;
    };

    convertColor();
    convertButton.addEventListener('click', convertColor);
}

function bindUrlTools() {
    const input = document.getElementById('urlInput');
    const output = document.getElementById('urlOutput');
    const encodeButton = document.getElementById('encodeUrlBtn');
    const decodeButton = document.getElementById('decodeUrlBtn');

    if (!input || !output || !encodeButton || !decodeButton) {
        return;
    }

    encodeButton.addEventListener('click', () => {
        output.value = encodeURIComponent(input.value);
    });

    decodeButton.addEventListener('click', () => {
        try {
            output.value = decodeURIComponent(input.value);
        } catch (error) {
            output.value = 'URL 格式无效，无法解码';
        }
    });
}

function bindTimestampTool() {
    const currentTimestamp = document.getElementById('currentTimestamp');
    const timestampInput = document.getElementById('timestampInput');
    const result = document.getElementById('timestampResult');
    const convertButton = document.getElementById('timestampConvertBtn');

    if (!currentTimestamp || !timestampInput || !result || !convertButton) {
        return;
    }

    const updateCurrentTimestamp = () => {
        currentTimestamp.value = Math.floor(Date.now() / 1000);
    };

    updateCurrentTimestamp();
    window.setInterval(updateCurrentTimestamp, 1000);

    convertButton.addEventListener('click', () => {
        const timestamp = Number(timestampInput.value);
        if (!Number.isFinite(timestamp) || timestamp <= 0) {
            result.textContent = '请输入有效的 Unix 时间戳';
            return;
        }

        result.textContent = new Date(timestamp * 1000).toLocaleString('zh-CN');
    });
}

function bindPasswordGenerator() {
    const passwordField = document.getElementById('generatedPassword');
    const lengthInput = document.getElementById('passwordLength');
    const lengthValue = document.getElementById('lengthValue');
    const includeUpper = document.getElementById('includeUpper');
    const includeLower = document.getElementById('includeLower');
    const includeNumbers = document.getElementById('includeNumbers');
    const includeSymbols = document.getElementById('includeSymbols');
    const generateButton = document.getElementById('passwordGenerateBtn');

    if (
        !passwordField ||
        !lengthInput ||
        !lengthValue ||
        !includeUpper ||
        !includeLower ||
        !includeNumbers ||
        !includeSymbols ||
        !generateButton
    ) {
        return;
    }

    lengthValue.textContent = lengthInput.value;
    lengthInput.addEventListener('input', () => {
        lengthValue.textContent = lengthInput.value;
    });

    generateButton.addEventListener('click', () => {
        let characters = '';

        if (includeUpper.checked) {
            characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        if (includeLower.checked) {
            characters += 'abcdefghijklmnopqrstuvwxyz';
        }
        if (includeNumbers.checked) {
            characters += '0123456789';
        }
        if (includeSymbols.checked) {
            characters += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        }

        if (!characters) {
            passwordField.value = '请至少选择一种字符类型';
            return;
        }

        const length = Number(lengthInput.value);
        let password = '';
        for (let index = 0; index < length; index += 1) {
            password += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        passwordField.value = password;
    });
}
