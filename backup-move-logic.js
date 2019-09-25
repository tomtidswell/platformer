const width = 18
const squares = []
//const walls = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,92,93,94,95]
const walls = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 35, 38, 39, 41, 42, 43, 46, 47, 48, 50, 51, 54, 57, 59, 61, 64, 66, 68, 71, 72, 73, 74, 75, 79, 80, 81, 82, 86, 87, 88, 89, 90, 95, 98, 99, 102, 107, 108, 110, 111, 113, 114, 116, 117, 119, 120, 122, 123, 125, 126, 143, 144, 145, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 160, 161, 168, 173, 180, 186, 191, 197, 198, 204, 209, 215, 216, 217, 218, 219, 222, 223, 226, 227, 233, 234, 251, 252, 269, 270, 287, 288, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323]



let playerIndex = width * width / 2 % 2 === 0 ? Math.floor(width * width / 2 - width / 2) : Math.floor(width * width / 2)

function paintWalls(){
  walls.forEach(wall => squares[wall].classList.add('wall'))
}

function init() {
  //grab the parent div for the Grid
  const grid = document.querySelector('.grid')

  //create the grid with width*width number of squares
  for (let i = 0; i < width * width; i++) {
    const square = document.createElement('div')
    square.classList.add('grid-item')
    square.innerText = i
    square.addEventListener('click', e => e.target.classList.toggle('wall'))
    squares.push(square)
    grid.append(square)
  }

  squares[playerIndex].classList.add('player')
  window.addEventListener('keydown',handleKeyDown)
  paintWalls()
}

function handleKeyDown(e){
  switch (e.key) {
    case 'ArrowRight':
      if(canMoveRight(playerIndex)){
        playerIndex++
        movePlayer()
      }
      break
    case 'ArrowLeft':
      if(canMoveLeft(playerIndex)){
        playerIndex--
        movePlayer()
      }
      break
    case 'ArrowUp':
      if(canMoveUp(playerIndex)){
        playerIndex -= width
        movePlayer()
      }
      break
    case 'ArrowDown':
      if(canMoveDown(playerIndex)){
        playerIndex += width
        movePlayer()
      }
      break
  }
}

function canMoveRight(currentSquare){
  if(currentSquare % width === width - 1) return false //stop at an edge
  if(squares[currentSquare + 1].classList.contains('wall')) return false //check if it is held in the walls array
  return true
}
function canMoveLeft(currentSquare){
  if(currentSquare % width === 0) return false //stop at an edge
  if(walls.includes(currentSquare - 1)) return false //check if it is held in the walls array
  return true
}
function canMoveUp(currentSquare){
  if(currentSquare - width < 0) return false //stop at an edge
  if(walls.includes(currentSquare - width)) return false //check if it is held in the walls array
  return true
}
function canMoveDown(currentSquare){
  if(currentSquare + width > width * width) return false //stop at an edge
  if(walls.includes(currentSquare + width)) return false //check if it is held in the walls array
  return true
}

function createWallArray(){
  const wallSquares = squares.reduce( (total,square,index) => {
    return square.classList.contains('wall') ? total.concat(index) : total //include it if there is a wall class
  },[])
  return wallSquares
}

function movePlayer(){
  console.log('moving')
  squares.forEach(square => square.classList.remove('player'))
  squares[playerIndex].classList.add('player')
}

window.addEventListener('DOMContentLoaded', init)
