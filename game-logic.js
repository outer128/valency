
/*
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

*/



// game-logic.js
let puzzleData;
// userSolution (境界線セット) は不要に
// let userSolution = new Set(); 

// どのセルがどの区域(regionId)に属するかを管理
// { [cellIndex]: regionId } (regionId は数字マスの cellIndex)
let userRegions = {}; 
// 現在選択中の数字マス(regionId)
let currentRegionId = null; 
// 数字マスの情報（値と色）を保持
// { [cellIndex]: { value: num.value, color: '#...' } }
let numberCells = {};

// 区域ごとに割り当てる色のリスト
const regionColors = [
    '#FFADAD', // Red
    '#FFD6A5', // Orange
    '#FDFFB6', // Yellow
    '#CAFFBF', // Green
    '#9BF6FF', // Cyan
    '#A0C4FF', // Blue
    '#BDB2FF', // Purple
    '#FFC6FF', // Pink
    '#E4E4E4', // Gray
    '#FFFACD'  // LemonChiffon
];

// ゲームを初期化する関数
function initGame(data) {
    puzzleData = data;
    // 状態をリセット
    userRegions = {};
    currentRegionId = null;
    numberCells = {};

    const gridInner = document.getElementById('grid-inner');
    gridInner.innerHTML = '';
    gridInner.style.gridTemplateColumns = `repeat(${puzzleData.width}, 40px)`;
    gridInner.style.gridTemplateRows = `repeat(${puzzleData.height}, 40px)`;

    const cells = []; // セルのDOM要素を一時的に保持

    for (let r = 0; r < puzzleData.height; r++) {
        for (let c = 0; c < puzzleData.width; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            const cellIndex = r * puzzleData.width + c;
            cell.dataset.index = cellIndex; // cellIndexをdata属性として保持

            // 境界線(boundary)を生成するロジックを削除
            // if (r > 0) { ... }
            // if (c > 0) { ... }
            
            // セル自体にクリックイベントを設定
            cell.addEventListener('click', () => handleCellClick(cell));

            gridInner.appendChild(cell);
            cells.push(cell); // 配列に追加
        }
    }

    // 数字の配置と色分け
    puzzleData.numbers.forEach((num, index) => {
        const cellIndex = num.row * puzzleData.width + num.col;
        const color = regionColors[index % regionColors.length]; // 色を割り当て

        // 数字マスの情報を保存
        numberCells[cellIndex] = { value: num.value, color: color };
        // 数字マスは最初から自分自身の区域に属する
        userRegions[cellIndex] = cellIndex;

        const targetCell = cells[cellIndex];
        targetCell.classList.add('number-cell'); // 数字マス用のクラス
        targetCell.style.backgroundColor = color; // 初期色を設定

        const numberSpan = document.createElement('span');
        numberSpan.className = 'number';
        numberSpan.textContent = num.value;
        targetCell.appendChild(numberSpan);

        // 数字マスの背景色ではなく、数字自体に色を付ける場合（こちらを推奨）
        numberSpan.style.backgroundColor = color;
        // ★ 数字の色も設定（もし背景色と区別したい場合。背景色と同じでも良い）
        numberSpan.style.color = 'white'; // 数字マス背景色に対して見やすいように白に
        // 数字の白い縁取りは、背景色とのコントラストがはっきりするため不要かもしれません。
        // 必要であればCSSで調整してください。
        // もし数字マス自体の背景を塗りたい場合は、上のコメントアウトを解除し、CSSで .number の色を調整してください
    });
}

// セルがクリックされたときの処理
function handleCellClick(cell) {
    const cellIndex = parseInt(cell.dataset.index, 10);

    // 1. クリックされたのが数字マスの場合
    if (numberCells[cellIndex]) {
        currentRegionId = cellIndex; // 選択中の区域を更新
        
        // (オプション) 選択中の数字マスを視覚的に示す
        // 例: 全ての .number-cell から 'selected' クラスを外し、
        //     クリックされたセルにだけ 'selected' クラスを付ける
        document.querySelectorAll('.number-cell').forEach(nc => nc.classList.remove('selected'));
        cell.classList.add('selected');

        // 数字マス自体を塗る/解除する処理（もし数字マス自身もクリックで色付けする場合）
        toggleCellColor(cell, cellIndex); 

    } 
    // 2. クリックされたのが数字のないマスの場合
    else {
        if (currentRegionId === null) {
            // まだ数字マスが選択されていない
            alert("先に色を塗りたい区域の数字を選んでください。");
            return;
        }
        
        // 色を塗る/解除する
        toggleCellColor(cell, cellIndex);
    }
}




// game-logic.js 内
// game-logic.js 内

// セルの色をトグルする補助関数
function toggleCellColor(cell, cellIndex) {
    // currentRegionIdがnull（数字マスが未選択）の場合は処理しない
    if (currentRegionId === null) return;
    
    // 現在選択中の区域の色を取得
    const currentColor = numberCells[currentRegionId].color;

    // クリックされたセルが「数字マス」である場合
    if (numberCells[cellIndex]) {
        // 既に塗られている区域が、現在選択中の区域と同じか？
        if (userRegions[cellIndex] === currentRegionId) {
            // １．同じ色で塗られている場合 -> 解除（キャンセル）する
            cell.style.backgroundColor = '';
            delete userRegions[cellIndex];
        } else {
            // ２．違う色で塗られている場合 -> 上書きする
            userRegions[cellIndex] = currentRegionId;
            cell.style.backgroundColor = numberCells[currentRegionId].color;
        }
        
    } else {
        // ２．何も塗られていないマスの場合 -> 塗る

        userRegions[cellIndex] = currentRegionId;
        cell.style.backgroundColor = currentColor;
    }
}




 /*
// セルの色をトグルする補助関数
function toggleCellColor(cell, cellIndex) {
    const currentColor = numberCells[currentRegionId].color;

    // 既に現在の区域として塗られているか？
    if (userRegions[cellIndex] === currentRegionId) {
        
        // 色の解除（トグルオフ）を許可しない
        if (numberCells[cellIndex]) {
            return; // 何もせず終了
        }
        // 数字マス以外なら解除する (白に戻す)
        cell.style.backgroundColor = '';
        delete userRegions[cellIndex];
    }
    // 既に *別の* 区域として塗られているか？
    else if (userRegions[cellIndex] && userRegions[cellIndex] !== currentRegionId) {
        // (仕様) 上書きを許可しない場合
        alert("そのマスは既に他の区域に属しています。");
        // (仕様) 上書きを許可する場合
        // userRegions[cellIndex] = currentRegionId;
        // cell.style.backgroundColor = currentColor;
    }
    // まだ塗られていない場合
    else {
        // 塗る
        userRegions[cellIndex] = currentRegionId;
        cell.style.backgroundColor = currentColor;
    }
}

*/

// toggleBoundary 関数は不要になったので削除
// function toggleBoundary(boundaryElement) { ... }

function checkAnswer() {
    const messageArea = document.getElementById('message-area');

    // --- ユーザーの塗りつぶし状況(userRegions)から境界線セットを動的に生成 ---
    const userBoundaries = new Set();
    const width = puzzleData.width;
    const height = puzzleData.height;

    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            const index1 = r * width + c;
            // userRegions[index1] は、そのセルが属する regionId (数字マスのindex)。未割り当てなら undefined
            const region1 = userRegions[index1]; 

            // 右側との境界チェック (c < width - 1)
            if (c < width - 1) {
                const index2 = r * width + (c + 1);
                const region2 = userRegions[index2];
                if (region1 !== region2) { // 区域が異なる (片方がundefinedの場合も含む)
                    userBoundaries.add(`${r},${c}-${r},${c + 1}`);
                }
            }

            // 下側との境界チェック (r < height - 1)
            if (r < height - 1) {
                const index2 = (r + 1) * width + c;
                const region2 = userRegions[index2];
                if (region1 !== region2) { // 区域が異なる
                    userBoundaries.add(`${r},${c}-${r + 1},${c}`);
                }
            }
        }
    }
    // --- 境界線セットの生成完了 ---

    // 元の正解データ (puzzleData.solution) と比較
    let isCorrect = true;
    const correctBoundaries = puzzleData.solution; // これはSetである前提

    if (userBoundaries.size !== correctBoundaries.size) {
        isCorrect = false;
    } else {
        for (const key of correctBoundaries) {
            if (!userBoundaries.has(key)) {
                isCorrect = false;
                break;
            }
        }
        // 念のため、逆方向もチェック（通常はsizeが同じなら不要）
        for (const key of userBoundaries) {
             if (!correctBoundaries.has(key)) {
                isCorrect = false;
                break;
            }
        }
    }

    // 結果の表示
    if (isCorrect) {
        messageArea.textContent = "正解です！！";
        messageArea.style.color = "#1a73e8";
        document.getElementById('next-stage-link').style.display = 'block';
    } else {
        messageArea.textContent = "不正解です。";
        messageArea.style.color = "#d93025";
    }
}
