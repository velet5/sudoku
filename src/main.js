let CellSize = 9
let HintSize = CellSize / 3
let Values = [1, 2, 3, 4, 5, 6, 7, 8, 9]

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
        this.available = Values.filter(v => !this.hints.includes(v))
    }

    addHint(value) {
        value = Number(value)
        if (!this.isPrefilled && !this.hints.includes(value)) {
            this.hints.push(value)
            this.available = this.available.filter(v => v != value)
        }
    }

    removeHint(value) {
        value = Number(value)
        if (this.hints.includes(value)) {
            this.available.push(value)
            this.hints = this.hints.filter(v => v != value)
        }
    }

    is(other) {
        return this.x == other.x && this.y == other.y
    }
}

class Zone {
    constructor(cells, isDiagonal) {
        this.cells = cells
        this.id = cells.map(c => `${c.x}:${c.y}`).reduce((a, b) => `${a} ${b}`)
        this.isDiagonal = !!isDiagonal
    }

    some(predicate) {
        return this.cells.some(predicate)
    }

    forEach(action) {
        this.cells.forEach(action)
    }

    available(value) {
        return this.cells.filter(cell => !cell.isPrefilled && cell.available.includes(value))
    }

    contains(cell) {
        return this.cells.some(c => c.x == cell.x && c.y == cell.y)
    }

    // includes(predicate) {
    //     console.log("ZONE INCLUDES")
    //     return this.cells.includes(predicate)
    // }
}

class Board {
    /**
     * @param {Array<Cell>} cells 
     * @param {Boolean} isDiagonals 
     */
    constructor(cells, isDiagonals) {
        this.cells = cells
        this.isDiagonals = isDiagonals
        this.zones = []

        for (let r = 1; r <= 9; r += 1) {
            this.zones.push(new Zone(cells.filter(cell => cell.y == r)))
        }

        for (let c = 1; c <= 9; c += 1) {
            this.zones.push(new Zone(cells.filter(cell => cell.x == c)))
        }

        for (let i = 0; i < 3; i += 1) {
            for (let j = 0; j < 3; j += 1) {
                const l = i * 3 + 1
                const r = i * 3 + 3 + 1
                const t = j * 3 + 1
                const b = j * 3 + 3 + 1
                const z = cells.filter(c => c.x >= l && c.x < r && c.y >= t && c.y < b)
                this.zones.push(new Zone(z))
            }
        }

        if (isDiagonals) {
            this.zones.push(new Zone(cells.filter(cell => cell.x == cell.y), true))
            this.zones.push(new Zone(cells.filter(cell => cell.x == (10 - cell.y)), true))
        }

        this.diagonals = this.zones.filter(z => z.isDiagonal)
        this.center = this.cells.find(c => c.x == 5 && c.y == 5)
    }

    /**
     * @param {Array<Cell>} cells 
     * @returns {Array<Array<Cell>>} zones
     */
    intersections(cells) {
        return this.zones.filter(zone => cells.every(cell => zone.contains(cell)))
    }

    isOnDiagonal(cell) {
        return this.diagonals.some(d => d.contains(cell))
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

    addHint(cell, value) {
        const c = this.cells.find(c => !c.cell.isPrefilled && c.cell.x == cell.x && c.cell.y == cell.y)
        
        if (c) {
            cell.addHint(value)
            c.view.hints[value - 1].classList.add("enabled")
        }
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
                    cell.removeHint(i + 1)
                    hintElem.classList.remove("enabled")
                } else {
                    cell.addHint(i + 1)
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
                if (activeCell && !activeCell.isPrefilled && activeNumberElem) {
                    activeNumberElem.innerText = value
                    activeCell.value = value
                }
                break
            case "0":
                if (activeCell && !activeCell.isPrefilled && activeNumberElem) {
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

        return s(1, 2, 7) || s(1, 6, 9) || s(1, 7, 4) || s(1, 8, 5) ||
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

    const digits = document.getElementsByClassName("digit")

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
                                vm.addHint(other, value)
                            }
                        }
                    })
                }
            })
        }

        board.zones.forEach(fillZone)

        board.zones.forEach(zone => {
            Values.forEach(value => {
                const cells = zone.available(value)
                if (cells.length < 2) return;

                if (!zone.isDiagonal && 
                    cells.length == 2 && 
                    cells.every(c => board.diagonals.some(z => z.contains(c))) &&
                    !cells.some(c => c.is(board.center))) {
                       vm.addHint(board.center, value)
                }

                if (!zone.isDiagonal && cells.length == 2 && cells.every(c => board.isOnDiagonal(c))) {
                    const a = cells[0]
                    const b = cells[1]
                    if (a.x != b.x && a.y != b.y) return;
                    vm.addHint(board.center, value)
                    board.diagonals.forEach(d => {
                        d.cells.forEach(cell => {
                            if (!cells.some(c => c.is(cell))) {
                                if (cell.x == a.x || cell.x == b.x || cell.y == a.y || cell.y == b.y) {
                                   vm.addHint(cell, value)
                                }
                            }
                        })
                    })
                }

                if (cells.length == 2 && cells.some(c => board.isOnDiagonal(c)) && cells.some(c => !board.isOnDiagonal(c))) {
                    const a = cells.find(c => board.isOnDiagonal(c))
                    const b = cells.find(c => !board.isOnDiagonal(c))                   

                    let x
                    let y

                    if (a.y == b.y) {
                        if (a.x == a.y) {
                            x = b.x
                            y = a.y - (a.x - b.x)
                        } else {
                            x = b.x
                            y = a.y - (b.x - a.x)                      
                        }
                    } else {
                        if (a.x == a.y) {
                            y = b.y
                            x = a.x - (a.y - b.y)
                        } else {
                            y = b.y
                            x = a.x - (b.y - a.y)
                        } 
                    }

                    const c = board.cells.find(c => c.x == x && c.y == y && !cells.some(c2 => c2.is(c)))
                    if (c && !c.hints.includes(value) && !c.isPrefilled) {
                        console.log(a.x, a.y, b.x, b.y, "|", x, y, "|", value)
                        vm.addHint(c, value)
                    }
                }

                const intersections = board.intersections(cells)

                intersections
                    .filter(i => i.id != zone.id)
                    .forEach(zone => {
                        zone.cells
                            .filter(c => !cells.some(cell => cell.x == c.x && cell.y == c.y))
                            .forEach(cell => {
                                vm.addHint(cell, value)
                            })
                    })
            })
        })
    }

    const fillButton = document.getElementById("fill-button")
    fillButton.onclick = () => fill()

    // const zonesOf = cell => {
    //     return board.zones.filter(zone => zone.cells.some(c => c.x == cell.x && c.y == cell.y))
    // }

    // const hightlightZone = zone => {
    //     zone.forEach(cell => {
    //         vm.cellViewOf(cell).elem.classList.add("hightlight")
    //     })
    // }

    // const deHightlightZone = zone => {
    //     zone.forEach(cell => {
    //         vm.cellViewOf(cell).elem.classList.remove("hightlight")
    //     })
    // }

    // vm.cells.forEach(cell => {
    //     cell.view.elem.onmouseenter = () => zonesOf(cell.cell).forEach(zone => hightlightZone(zone))
    //     cell.view.elem.onmouseleave = () => zonesOf(cell.cell).forEach(zone => deHightlightZone(zone))
    // })

}

window.addEventListener('DOMContentLoaded', play)
