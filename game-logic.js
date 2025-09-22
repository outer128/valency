// game-logic.js
let puzzleData;
let userSolution = new Set();

// ゲームを初期化する関数
function initGame(data) {
    puzzleData = data;
    const gridInner = document.getElementById('grid-inner');
    gridInner.innerHTML = '';
    gridInner.style.gridTemplateColumns = `repeat(${puzzleData.width}, 40px)`;
    gridInner.style.gridTemplateRows = `repeat(${puzzleData.height}, 40px)`;

    for (let r = 0; r < puzzleData.height; r++) {
        for (let c = 0; c < puzzleData.width; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (r > 0) {
                const boundary = document.createElement('div');
                boundary.classList.add('boundary', 'h-boundary');
                boundary.dataset.key = `${r-1},${c}-${r},${c}`;
                boundary.addEventListener('click', () => toggleBoundary(boundary));
                cell.appendChild(boundary);
            }
            if (c > 0) {
                const boundary = document.createElement('div');
                boundary.classList.add('boundary', 'v-boundary');
                boundary.dataset.key = `${r},${c-1}-${r},${c}`;
                boundary.addEventListener('click', () => toggleBoundary(boundary));
                cell.appendChild(boundary);
            }
            gridInner.appendChild(cell);
        }
    }

    const cells = gridInner.children;
    puzzleData.numbers.forEach(num => {
        const cellIndex = num.row * puzzleData.width + num.col;
        const numberSpan = document.createElement('span');
        numberSpan.className = 'number';
        numberSpan.textContent = num.value;
        cells[cellIndex].appendChild(numberSpan);
    });
}

function toggleBoundary(boundaryElement) {
    boundaryElement.classList.toggle('selected');
    const key = boundaryElement.dataset.key;
    if (userSolution.has(key)) {
        userSolution.delete(key);
    } else {
        userSolution.add(key);
    }
}

function checkAnswer() {
    const messageArea = document.getElementById('message-area');
    let isCorrect = true;

    if (userSolution.size !== puzzleData.solution.size) {
        isCorrect = false;
    } else {
        for (const key of puzzleData.solution) {
            if (!userSolution.has(key)) {
                isCorrect = false;
                break;
            }
        }
    }

    if (isCorrect) {
        messageArea.textContent = "正解です！！";
        messageArea.style.color = "#1a73e8";
        document.getElementById('next-stage-link').style.display = 'block';
    } else {
        messageArea.textContent = "不正解です。";
        messageArea.style.color = "#d93025";
    }
}