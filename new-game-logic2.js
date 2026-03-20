class ValencyGame {
    constructor(puzzleData, containerId, messageId, siteId) {
        // パズルごとのローカルな状態
        this.puzzleData = puzzleData;
        this.userRegions = {};
        this.currentRegionId = null;
        this.numberCells = {};

        // DOM ID
        this.containerElement = document.getElementById(containerId);
        this.messageElement = document.getElementById(messageId);

        // このパズル専用の保存キーを作成
        this.storageKey = `${siteId}_valency_state_${containerId}`;
        // 正解済みかどうかのフラグ
        this.isSolved = false; 

        // 初期化を実行
        this.initGame();
    }

    initGame() {
        // 状態をリセット
        this.userRegions = {};
        this.currentRegionId = null;
        this.numberCells = {};
        this.isSolved = false;
        
        // 【追加】ローカルストレージから保存された盤面データを読み込む
        const savedState = localStorage.getItem(this.storageKey);
        if (savedState) {
            this.userRegions = JSON.parse(savedState);
            this.isSolved = true; // 保存データがあれば正解済み扱いにする
        }

        const data = this.puzzleData;
        const gridInner = this.containerElement;
        
        gridInner.innerHTML = '';
        gridInner.style.gridTemplateColumns = `repeat(${data.width}, 40px)`;
        gridInner.style.gridTemplateRows = `repeat(${data.height}, 40px)`;

        const cells = []; 

        for (let r = 0; r < data.height; r++) {
            for (let c = 0; c < data.width; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                const cellIndex = r * data.width + c;
                cell.dataset.index = cellIndex;

                cell.addEventListener('click', () => this.handleCellClick(cell));

                gridInner.appendChild(cell);
                cells.push(cell);
            }
        }

        // 数字の配置と色分け
        data.numbers.forEach((num) => {
            const cellIndex = num.row * data.width + num.col;
            const color = num.color || '#E4E4E4'; // デフォルト色
            
            this.numberCells[cellIndex] = { value: num.value, color: color };
            
            // 【変更】保存データがない（未クリアの）場合のみ、初期状態として登録
            if (!savedState) {
                this.userRegions[cellIndex] = cellIndex;
            }

            const targetCell = cells[cellIndex];
            targetCell.classList.add('number-cell');

            const numberSpan = document.createElement('span');
            numberSpan.className = 'number';
            numberSpan.textContent = num.value;
            targetCell.appendChild(numberSpan);

            targetCell.style.backgroundColor = color;
            numberSpan.style.color = 'white';
        });

        // 【追加】正解済みの保存データがある場合、空マスにも色を塗って復元する
        if (savedState) {
            cells.forEach((cell, index) => {
                const regionId = this.userRegions[index];
                // そのマスに色が塗られていれば背景色を適用
                if (regionId !== undefined && this.numberCells[regionId]) {
                    cell.style.backgroundColor = this.numberCells[regionId].color;
                }
            });
            // 復元されたらメッセージも表示しておく
            this.messageElement.textContent = "正解です！！";
            this.messageElement.style.color = "#1a73e8";
        }
    }

    handleCellClick(cell) {
        // 【追加】すでに正解済みの場合は、クリックしても色を変えられないようにする
        if (this.isSolved) return;

        const cellIndex = parseInt(cell.dataset.index, 10);

        if (this.numberCells[cellIndex]) {
            this.currentRegionId = cellIndex;
            // 選択状態の更新 (このインスタンス内のグリッドのみ)
            this.containerElement.querySelectorAll('.number-cell').forEach(nc => nc.classList.remove('selected'));
            cell.classList.add('selected');
            
            this.toggleCellColor(cell, cellIndex);
        } else {
            if (this.currentRegionId === null) {
                alert("先に色を塗りたい区域の数字を選んでください。");
                return;
            }
            this.toggleCellColor(cell, cellIndex);
        }
    }

    toggleCellColor(cell, cellIndex) {
        if (this.currentRegionId === null) return;
        
        const currentColor = this.numberCells[this.currentRegionId].color;

        // 数字マスの場合
        if (this.numberCells[cellIndex]) {
            if (this.userRegions[cellIndex] === this.currentRegionId) {
                return;
            }
            this.userRegions[cellIndex] = this.currentRegionId;
            cell.style.backgroundColor = currentColor;
        } 
        // 空マスの場合
        else {
            if (this.userRegions[cellIndex]) {
                cell.style.backgroundColor = '';
                delete this.userRegions[cellIndex];
            } else {
                this.userRegions[cellIndex] = this.currentRegionId;
                cell.style.backgroundColor = currentColor;
            }
        }
    }

    checkAnswer() {
        const userBoundaries = new Set();
        const data = this.puzzleData;
        const width = data.width;
        const height = data.height;

        // 境界線生成ロジック
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                const index1 = r * width + c;
                const region1 = this.userRegions[index1]; 

                if (c < width - 1) {
                    const index2 = r * width + (c + 1);
                    if (region1 !== this.userRegions[index2]) {
                        userBoundaries.add(`${r},${c}-${r},${c + 1}`);
                    }
                }
                if (r < height - 1) {
                    const index2 = (r + 1) * width + c;
                    if (region1 !== this.userRegions[index2]) {
                        userBoundaries.add(`${r},${c}-${r + 1},${c}`);
                    }
                }
            }
        }
        
        // 正誤判定ロジック
        let isCorrect = true;
        const correctBoundaries = data.solution;

        if (userBoundaries.size !== correctBoundaries.size) {
            isCorrect = false;
        } else {
            for (const key of correctBoundaries) {
                if (!userBoundaries.has(key)) {
                    isCorrect = false;
                    break;
                }
            }
        }

        // 結果の表示
        if (isCorrect) {
            this.messageElement.textContent = "正解です！！";
            this.messageElement.style.color = "#1a73e8";

            // 【追加】正解した場合、今の盤面の状態（どこを何色に塗ったか）を保存する
            localStorage.setItem(this.storageKey, JSON.stringify(this.userRegions));
            // 【追加】正解済みに切り替えてクリックを無効化する
            this.isSolved = true;
            
        } else {
            this.messageElement.textContent = "不正解です。";
            this.messageElement.style.color = "#d93025";
        }

        return isCorrect; 
    }
}
