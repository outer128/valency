let puzzleData;
let userSolution = new Set();

// ゲームを初期化する関数
function initGame(data) {
    puzzleData = data;
    const gridInner = document.getElementById('grid-inner');
    gridInner.innerHTML = '';
    gridInner.style.gridTemplateColumns = `repeat(${puzzleData.width}, 40px)`;
    gridInner.style.gridTemplateRows = `repeat(${puzzleData.height}, 40px)`;

    // セルと境界線を描画
    for (let r = 0; r < puzzleData.height; r++) {
        for (let c = 0; c < puzzleData.width; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            // 上の境界線
            if (r > 0) {
                const boundary = document.createElement('div');
                boundary.classList.add('boundary', 'h-boundary');
                boundary.dataset.key = `${r-1},${c}-${r},${c}`;
                boundary.addEventListener('click', () => toggleBoundary(boundary));
                cell.appendChild(boundary);
            }
            // 左の境界線
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

    // 数字を配置
    const cells = gridInner.children;
    puzzleData.numbers.forEach(num => {
        const cellIndex = num.row * puzzleData.width + num.col;
        const numberSpan = document.createElement('span');
        numberSpan.className = 'number';
        numberSpan.textContent = num.value;
        cells[cellIndex].appendChild(numberSpan);
    });
}

// 境界線をクリックしたときの処理
function toggleBoundary(boundaryElement) {
    boundaryElement.classList.toggle('selected');
    const key = boundaryElement.dataset.key;
    if (userSolution.has(key)) {
        userSolution.delete(key);
    } else {
        userSolution.add(key);
    }
}

// 答えをチェックする関数
function checkAnswer() {
    const messageArea = document.getElementById('message-area');
    if (userSolution.size !== puzzleData.solution.size) {
        messageArea.textContent = "不正解です。線の数が違います。";
        messageArea.style.color = "#d93025";
        return;
    }

    let isCorrect = true;
    for (const key of puzzleData.solution) {
        if (!userSolution.has(key)) {
            isCorrect = false;
            break;
        }
    }

    if (isCorrect) {
        messageArea.textContent = "クリア！おめでとうございます！";
        messageArea.style.color = "#1a73e8";
        document.getElementById('next-stage-link').style.display = 'block';
    } else {
        messageArea.textContent = "不正解です。線の位置が違います。";
        messageArea.style.color = "#d93025";
    }
}