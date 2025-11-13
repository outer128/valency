// new-game-logic.js

class ValencyGame {
    constructor(puzzleData, containerId, messageId) {
        // パズルごとのローカルな状態
        this.puzzleData = puzzleData;
        this.userRegions = {};
        this.currentRegionId = null;
        this.numberCells = {};

        // DOM ID
        this.containerElement = document.getElementById(containerId);
        this.messageElement = document.getElementById(messageId);

        // 初期化を実行
        this.initGame();
    }

    initGame() {
        // 状態をリセット (constructorで初期化済みだが、念のため)
        this.userRegions = {};
        this.currentRegionId = null;
        this.numberCells = {};
        
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

                // 【変更点】クリックイベントをインスタンスのメソッドにバインド
                cell.addEventListener('click', () => this.handleCellClick(cell));

                gridInner.appendChild(cell);
                cells.push(cell);
            }
        }

        // 数字の配置と色分け (以前のロジックと同じ)
        data.numbers.forEach((num) => {
            const cellIndex = num.row * data.width + num.col;
            const color = num.color || '#E4E4E4'; // デフォルト色
            
            this.numberCells[cellIndex] = { value: num.value, color: color };
            this.userRegions[cellIndex] = cellIndex;

            const targetCell = cells[cellIndex];
            targetCell.classList.add('number-cell');

            const numberSpan = document.createElement('span');
            numberSpan.className = 'number';
            numberSpan.textContent = num.value;
            targetCell.appendChild(numberSpan);

            targetCell.style.backgroundColor = color;
            numberSpan.style.color = 'white';
        });
    }

    handleCellClick(cell) {
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

        // 境界線生成ロジック (既存ロジックとほぼ同じ)
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
        
        // 正誤判定ロジック (既存ロジックとほぼ同じ)
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

        // 結果の表示 (このインスタンス専用のメッセージエリアに出力)
        if (isCorrect) {
            this.messageElement.textContent = "正解です！！";
            this.messageElement.style.color = "#1a73e8";
        } else {
            this.messageElement.textContent = "不正解です。";
            this.messageElement.style.color = "#d93025";
        }

        return isCorrect; // 外部で全問正解をチェックするために結果を返す
    }
}
