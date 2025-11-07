
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
let gameCleared = false; // ゲームクリア状態を追跡


/*
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

*/

// ゲームを初期化する関数
function initGame(data) {
    if (!data) return;
    puzzleData = data;
    // 状態をリセット
    userRegions = {};
    currentRegionId = null;
    numberCells = {};
    gameCleared = false;
    document.getElementById('message-area').textContent = '';
    document.getElementById('next-stage-link').innerHTML = ''; // リンクを非表示に

    const gridInner = document.getElementById('grid-inner');
    if (!gridInner) return;
    
    gridInner.innerHTML = ''; 
    gridInner.style.gridTemplateColumns = `repeat(${puzzleData.width}, 1fr)`;

    const cells = []; // セルのDOM要素を一時的に保持

    for (let i = 0; i < puzzleData.width * puzzleData.height; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i; 
        
        // セルにクリックイベントを設定
        cell.addEventListener('click', handleCellClick); 

        gridInner.appendChild(cell);
        cells.push(cell);
    }

    // 数字の配置と色分け
    puzzleData.numbers.forEach(num => { 
        const cellIndex = num.row * puzzleData.width + num.col;
        if (cellIndex >= puzzleData.width * puzzleData.height) return;

        // データに color プロパティがある場合はそれを使用
        const color = num.color; 

        // 数字マスの情報を保存
        numberCells[cellIndex] = { value: num.value, color: color };
        // 数字マスは最初から自分自身の区域に属する
        userRegions[cellIndex] = cellIndex;

        const targetCell = cells[cellIndex];
        targetCell.classList.add('number-cell'); 
        
        // 初期背景色を設定
        targetCell.style.backgroundColor = color; 

        const numberSpan = document.createElement('span');
        numberSpan.className = 'number';
        numberSpan.textContent = num.value;
        targetCell.appendChild(numberSpan);
    });
}


// セルの色をトグルする補助関数
function toggleCellColor(cell, cellIndex) {
    if (currentRegionId === null) return;
    
    const currentColor = numberCells[currentRegionId].color;

    // A. クリックされたセルが「数字マス」である場合
    if (numberCells[cellIndex]) {
        // ★ご要望: 数字マスはキャンセルされない（無反応）
        // 常に上書き（再塗布）することで無反応に見せる
        cell.style.backgroundColor = currentColor; 
        return; 
    } 
    
    // B. クリックされたセルが「非数字マス」である場合
    
    if (userRegions[cellIndex]) {
        // 既に塗られている場合

        // 塗られている区域が、現在選択中の区域と同じか？
        if (userRegions[cellIndex] === currentRegionId) {
            // １．同じ色で塗られている場合 -> 解除（キャンセル）する
            cell.style.backgroundColor = '';
            delete userRegions[cellIndex];
        } else {
            // ２．違う色で塗られている場合 -> 上書きする
            userRegions[cellIndex] = currentRegionId;
            cell.style.backgroundColor = currentColor;
        }
        
    } else {
        // まだ塗られていないマスの場合 -> 塗る
        userRegions[cellIndex] = currentRegionId;
        cell.style.backgroundColor = currentColor;
    }
}


// クリックイベントハンドラ
function handleCellClick(event) {
    // ★追記：勝利状態の場合、操作を即座に中断
    if (gameCleared) {
        return; 
    }

    const cell = event.currentTarget;
    const cellIndex = parseInt(cell.dataset.index);

    // 1. クリックされたのが数字マスの場合
    if (numberCells[cellIndex]) {
        currentRegionId = cellIndex; // 選択中の区域を更新
        
        // 視覚的なハイライトを更新
        document.querySelectorAll('.number-cell').forEach(nc => nc.classList.remove('selected'));
        cell.classList.add('selected');

        // 数字マス自体も色を塗る/上書きする
        toggleCellColor(cell, cellIndex); 
    } 
    // 2. クリックされたのが非数字マスの場合
    else {
        // ★ご要望: 数字マスを選択していない状態で非数字マスを選択すると、何も起こらない
        if (currentRegionId !== null) {
            // 選択中の数字マスがある場合のみ、色をトグルする
            toggleCellColor(cell, cellIndex);
        }
    }
}


// 勝利判定ロジック (checkAnswer()から呼ばれる)
function checkAnswer() {
    // 既にクリアしている場合は何もしない
    if (gameCleared) return;
    
    const messageArea = document.getElementById('message-area');

    // 1. 全てのセルが塗られているか？ (簡易チェック)
    const totalCells = puzzleData.width * puzzleData.height;
    if (Object.keys(userRegions).length !== totalCells) {
        messageArea.textContent = 'まだ全てのマスが塗りつぶされていません。'; 
        return;
    }

    // 2. 区域ごとのセル数が正しいか？
    let countsMatch = true;
    for (const regionId in numberCells) {
        const requiredCount = numberCells[regionId].value;
        const actualCount = Object.values(userRegions).filter(id => id === parseInt(regionId)).length;

        if (actualCount !== requiredCount) {
            countsMatch = false;
            break;
        }
    }
    if (!countsMatch) {
        messageArea.textContent = '残念、区域のマス数が合っていません。';
        return;
    }

    // 3. 正解データとユーザーの塗りが一致するか？ (最終チェック)
    let solutionMatch = true;
    for (let i = 0; i < totalCells; i++) {
        // solution配列は cellIndex と同じ順序で並んでいる前提
        const correctRegionId = puzzleData.solution[i];
        const userRegionId = userRegions[i] ? userRegions[i] : null;

        if (userRegionId !== correctRegionId) {
            solutionMatch = false;
            break;
        }
    }


    if (solutionMatch) {
        // ★勝利処理
        gameCleared = true;
        messageArea.textContent = 'クリア！おめでとうございます！';
        
        // 次の問題へのリンクを動的に表示
        const nextLinkArea = document.getElementById('next-stage-link');
        nextLinkArea.innerHTML = `<a href="problem-02.html">次の問題へ進む</a>`;

    } else {
        messageArea.textContent = '残念、どこか間違っています。'; 
    }
}

// 盤面外クリックによる選択解除の制御
document.addEventListener('click', (event) => {
    // クリックされた要素がグリッドコンテナの子孫要素でないか、またはボタンではないかを確認
    const gridContainer = document.getElementById('grid-container');
    const button = document.querySelector('button');

    // 盤面外、かつボタン外のクリックであった場合に選択解除
    if (currentRegionId !== null && 
        !(gridContainer && gridContainer.contains(event.target)) &&
        !(button && button.contains(event.target))) 
    {
        currentRegionId = null;
        document.querySelectorAll('.number-cell').forEach(nc => nc.classList.remove('selected'));
    }
});


// === 初期化実行 ===
document.addEventListener('DOMContentLoaded', () => {
    // problem-01.html などに定義されている puzzleData を使用
    if (typeof puzzleData !== 'undefined') {
        initGame(puzzleData);
    }
});

/*

// セルがクリックされたときの処理
function handleCellClick(cell) {
    // ★★★ 追記：勝利状態の場合、操作を即座に中断 ★★★
    if (checkWin()) {
        return; 
    }
    // ★★★ 追記ここまで ★★★

    const cell = event.currentTarget;
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

/*
// game-logic.js 内

// セルの色をトグルする補助関数
function toggleCellColor(cell, cellIndex) {
    // currentRegionIdがnull（数字マスが未選択）の場合は処理しない
    if (currentRegionId === null) return;
    
    // 現在選択中の区域の色を取得
    const currentColor = numberCells[currentRegionId].color;

    // A. クリックされたセルが「数字マス」である場合
    if (numberCells[cellIndex]) {
        // ★★★ 修正点: 数字マスは常に上書き（キャンセル不可） ★★★
        userRegions[cellIndex] = currentRegionId;
        cell.style.backgroundColor = currentColor; 
        return; // 数字マスはここで処理終了
    } 
    
    // B. クリックされたセルが「非数字マス」である場合 (ご要望のロジックを適用)
    
    // 既に何らかの区域として塗られているか？
    if (userRegions[cellIndex]) {
        // 既に塗られている場合

        // １．塗られている区域が、現在選択中の区域と同じか？
        if (userRegions[cellIndex] === currentRegionId) {
            // 同じ色で塗られている場合 -> 解除（キャンセル）する
            cell.style.backgroundColor = '';
            delete userRegions[cellIndex];
        } else {
            // ２．違う色で塗られている場合 -> 上書きする
            userRegions[cellIndex] = currentRegionId;
            cell.style.backgroundColor = currentColor;
        }
        
    } else {
        // まだ塗られていないマスの場合 -> 塗る
        userRegions[cellIndex] = currentRegionId;
        cell.style.backgroundColor = currentColor;
    }
}


/*

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



///旧版



 
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

*/
