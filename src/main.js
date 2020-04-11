let CellSize = 9
let HintSize = CellSize / 3

class Cell {
    /**
     * 
     * @param {Boolean} isPrefilled 
     * @param {Number} value 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Array<Number>} hints
     */
    constructor(value, x, y, hints) {
        this.isPrefilled = !!value
        this.value = value
        this.x = x
        this.y = y
        this.hints = hints || []
    }
}

class Zone {
    constructor(cells) {
        this.cells = cells
    }
}

class Board {
    constructor(cells, isDiagonals) {
        this.cells = cells
        this.isDiagonals = isDiagonals
        this.zones = []

        for (let r = 1; r <= 9; r += 1) {
            this.zones.push(cells.filter(cell => cell.y == r))
        }

        for (let c = 1; c <= 9; c += 1) {
            this.zones.push(cells.filter(cell => cell.x == c))
        }

        for (let i = 0; i < 3; i += 1) {
            for (let j = 0; j < 3; j += 1) {
                const l = i * 3 + 1
                const r = i * 3 + 3 + 1
                const t = j * 3 + 1
                const b = j * 3 + 3 + 1
                const z = cells.filter(c => c.x >= l && c.x < r && c.y >= t && c.y < b)
                this.zones.push(z)
            }
        }

        if (isDiagonals) {
            this.zones.push(cells.filter(cell => cell.x == cell.y))
            this.zones.push(cells.filter(cell => cell.x == (10 - cell.y)))
        }
    }
}


class CellView {
    /**
     * @param {HTMLElement} elem 
     * @param {HTMLElement} number 
     * @param {Array<HTMLElement>} hints 
     */
    constructor(elem, number, hints) {
        this.elem = elem
        this.number = number
        this.hints = hints
    }
}

class CellViewModel {
    /**
     * @param {Cell} cell 
     * @param {CellView} view 
     */
    constructor(cell, view) {
        this.cell = cell
        this.view = view
    }
}

class BoardViewModel {
    /**
     * @param {Board} board 
     * @param {Array<CellViewModel>} cells 
     */
    constructor(board, cells) {
        this.board = board
        this.cells = cells
    }

    /**
     * @param {Cell} cell 
     * @returns {CellView}
     */
    cellViewOf(cell) {
        return this.cells.find(c => c.cell.x == cell.x && c.cell.y == cell.y).view
    }
}

/**
 * @param {*} id 
 * @param {*} board 
 * @returns {BoardViewModel}
 */
const render = (id, board, event) => {
    const root = document.getElementById(id)

    const boardElem = document.createElement("div")
    boardElem.classList.add("board")

    let activeCellElem = null
    let activeNumberElem = null
    let activeCell = null

    const cellVMs = board.cells.map(cell => {
        const cellElem = document.createElement("div")
        cellElem.classList.add("cell")

        if (cell.x % 3 == 0) cellElem.classList.add("r")
        if (cell.x % 3 == 1) cellElem.classList.add("l")
        if (cell.y % 3 == 0) cellElem.classList.add("b")
        if (cell.y % 3 == 1) cellElem.classList.add("t")

        if (board.isDiagonals && (cell.x == cell.y || cell.x == (10 - cell.y))) cellElem.classList.add("d")

        boardElem.append(cellElem)
        cellElem.style.top = `${(cell.y - 1) * CellSize}vmin`
        cellElem.style.left = `${(cell.x - 1) * CellSize}vmin`   

        const numberElem = document.createElement("div")
        numberElem.classList.add("number")
        if (cell.value) numberElem.innerText = cell.value

        cellElem.append(numberElem)

        cellElem.onclick = () => {            
            activeCellElem && activeCellElem.classList.remove("active")
            activeCellElem = cellElem
            activeNumberElem = numberElem
            activeCell = cell
            cellElem.classList.add("active")
        }

        cellElem.onmouseenter = () => {

        }

        cellElem.onmouseleave = () => {

        }

        const hints = []
        for (let i = 0; i < 9; i += 1) {
            const hintElem = document.createElement("div")
            const y = Math.floor(i / 3)
            const x = i % 3
            hintElem.classList = "hint"
            hintElem.style.top = `${y * HintSize}vmin`
            hintElem.style.left = `${x * HintSize}vmin`
            cellElem.append(hintElem)        

            hintElem.onclick = (ev) => {
                if (cell.hints.includes(i + 1)) {
                    cell.hints = cell.hints.filter(v => v != (i + 1))
                    hintElem.classList.remove("enabled")
                } else {
                    cell.hints.push(i + 1)
                    hintElem.classList.add("enabled")
                }
            }

            hints.push(hintElem)
        }

        return new CellViewModel(cell, new CellView(cellElem, numberElem, hints))
    })

    event(value => {
        switch (value) {
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                if (activeCell && !activeCell.isPrefilled && activeNumberElem)  {
                    activeNumberElem.innerText = value
                    activeCell.value = value
                }
                break
            case "0":
                if (activeCell && !activeCell.isPrefilled && activeNumberElem)  {
                    activeNumberElem.innerText = ""
                    activeCell.value = null
                }
            default:
                break
        }
    });

    document.addEventListener("keydown", (ev) => {  
       
    })

    root.append(boardElem)

    return new BoardViewModel(board, cellVMs)
}

const play = () => { 
    const cells = []   
  
    const v = (x, y) => {
        const s = (r, c, v) => (c == x && r == y) ? v : null;

        return s(1, 2, 7) || s(1, 6, 9) || s(1, 7, 4) || s (1, 8, 5) ||
            s(2, 1, 4) || s(2, 4, 6) || s(2, 7, 2) || s(2, 9, 1) ||
            s(4, 3, 6) ||
            s(5, 1, 5) || s(5, 2, 2) || s(5, 6, 1) ||
            s(6, 3, 7) ||
            s(7, 1, 3) || s(7, 6, 4) || s(7, 7, 8) || s(7, 9, 7) ||
            s(8, 8, 1) || s(8, 9, 5) ||
            s(9, 2, 8) || s(9, 4, 5)
    }

    for (let x = 1; x <= 9; x += 1) {
        for (let y = 1; y <= 9; y += 1) {
            let value = v(x, y) 
            
            cells.push(new Cell(value, x, y))                         
        }
    }    

    const board = new Board(cells, true)

    const listeners = []

    const addListener = (cb) => listeners.push(cb)

    document.addEventListener("keydown", (ev) => {
        listeners.forEach(l => l(ev.key))
    })
   
    const digits =  document.getElementsByClassName("digit")

    console.log(digits)

    for (let i = 0; i < digits.length; i += 1) {
        const digit = digits[i]
        const value = digit.getAttribute("data-value")
        digit.onclick = () => listeners.forEach(l => l(value))
    }

    /** {BoardViewModel} */
    const vm = render('game', board, addListener)    

    const fill = () => {
        const fillZone = (zone) => {
            zone.forEach(cell => {          
                if (cell.value) {
                    const value = Number(cell.value)
                    zone.forEach(other => {
                        if ((other.x != cell.x || other.y != cell.y) && !other.value) {
                            if (!other.hints.includes(value)) {
                                other.hints.push(value)
                                const c = vm.cells.find(c => c.cell.x == other.x && c.cell.y == other.y)
                                if (c) {
                                    c.view.hints[value - 1].classList.add("enabled")
                                }
                            }
                        }
                    })
                }
            })
        }

        board.zones.forEach(zone => {
            console.log(zone.map(c => `${c.y}:${c.x}`).reduce((a, b) => a + " " + b))
            fillZone(zone)
        })
    }

    const fillButton = document.getElementById("fill-button")
    fillButton.onclick = () => fill()

    const zonesOf = cell => {
        return board.zones.filter(zone => zone.some(c => c.x == cell.x && c.y == cell.y))
    }

    const hightlightZone = zone => {
        zone.forEach(cell => {
            vm.cellViewOf(cell).elem.classList.add("hightlight")
        })
    }

    const deHightlightZone = zone => {
        zone.forEach(cell => {
            vm.cellViewOf(cell).elem.classList.remove("hightlight")
        })
    }

    vm.cells.forEach(cell => {
        cell.view.elem.onmouseenter = () => zonesOf(cell.cell).forEach(zone => hightlightZone(zone))            
        cell.view.elem.onmouseleave = () =>  zonesOf(cell.cell).forEach(zone => deHightlightZone(zone))        
    })    

}

window.addEventListener('DOMContentLoaded', play)
