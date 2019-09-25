// import Loader from 'classes/loader'


// TODO
// Add fruit/sweeties which can be collected
// Add clockwise logic for ghosts
// Allow level progression 


const ghosts = []
let pacman = null
let scoreboard = null
let messages = null
let game = null
const levelData = [{ walls: [34, 35, 36, 38, 39, 102, 120, 138, 156, 160, 161, 162, 163, 174, 192, 222, 223, 224, 225, 226,227, 228, 263, 264]}]
let highScores = []

// const loadModal = new Loader('.loader', '#loading-text')

const domProm = new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, false))
const fontsProm = document.fonts.ready
// const levelsProm = new Promise((resolve, reject) => axios.get('/api/levels').then(resolve).catch(reject))
// const scoresProm = axios.get('/api/scores')
// const timeout = new Promise(resolve => setTimeout(resolve, 3000, 'foo'))

// domProm.then(()=>loadModal.msg('Building the display...'), ()=>loadModal.error('DOM'))
// fontsProm.then(()=>loadModal.msg('Formatting text rendering...'), err=>loadModal.error('fonts', err))
// levelsProm.then(()=>loadModal.msg('Loading level data...'), err=>loadModal.error('levels', err))
// scoresProm.then(()=>loadModal.msg('Fetching high scores...'), err=>loadModal.error('scores', err))
// timeout.then(()=>loadModal.msg('Complete.'), ()=>loadModal.error('timeout'))

Promise.all([domProm, fontsProm])
  //all are ready
  .then(res => {
    // loadModal.msg('ALL READY!')
    // levelData = res[2].data
    // highScores = res[3].data
    setTimeout(init, 500)
    // setTimeout(()=>loadModal.complete(), 2000)
  })
  .catch(()=>{
    // loadModal.msg('LOAD HALTING.')
  })

function init() {
  game = new GameDefinition('.squares', 17, 30, levelData)
  pacman = new Player(127)
  game.paintDecoration() //draw the decorations once we initialised the sprites
  // scoreboard = new ScoreboardDefinition('.scoreboard', '.high-scores', highScores, '.capture-name')
  messages = new MessageBar('.message-overlay')
  sizeGrid()
  window.addEventListener('resize', sizeGrid)
  window.addEventListener('keydown', handleKeyDown)

  document.querySelectorAll('.d-pad > div > div')
    .forEach(button => button.addEventListener('click', handlePadDown))
  game.startRound()
}


function sizeGrid(){

  if(window.innerWidth < 567){
    const w = window.innerWidth / 17
    game.gridItems.forEach(item => {
      if(item.classList.contains('grid-item')){
        item.style.width = `${w}px`
        item.style.height = `${w}px`
      }
    })
  } else {
    game.gridItems.forEach(item => {
      if(item.classList.contains('grid-item')){
        item.style.width = ''
        item.style.height = ''
      }
    })
  }

}


function handlePadDown(e){
  console.log(e.target.classList[0])

  //dont do anything if the game is already lost
  if(game.lost) return

  if(!pacman.movable) game.startRound()

  switch (e.target.classList[0]) {
    case 'right':
      pacman.direction = rightMove(pacman.location) ? 'right' : pacman.direction
      break
    case 'left':
      pacman.direction = leftMove(pacman.location) ? 'left' : pacman.direction
      break
    case 'up':
      pacman.direction = upMove(pacman.location) ? 'up' : pacman.direction
      break
    case 'down':
      pacman.direction = downMove(pacman.location) ? 'down' : pacman.direction
      break
  }
}


function handleKeyDown(e){
  //dont do anything if the game is already lost
  if(game.lost) return
  //if pacman isnt movable, and the spacebar or direction is pressed, start the game
  if(!pacman.movable && (e.keyCode === 32 ||
                         e.key === 'ArrowRight' ||
                         e.key === 'ArrowLeft' ||
                         e.key === 'ArrowUp' ||
                         e.key === 'ArrowDown')){
    game.startRound()
    e.preventDefault()
  }
  //if pacman isnt movable, return
  if(!pacman.movable) return

  // console.log(e.key)
  
  //apply the new direction into pacmans direction parameter so it can be picked up next interval, or keep the existing direction if that direction isnt available
  switch (e.key) {
    case 'ArrowRight':
      pacman.direction = rightMove(pacman.location) ? 'right' : pacman.direction
      e.preventDefault()
      break
    case 'ArrowLeft':
      pacman.direction = leftMove(pacman.location) ? 'left' : pacman.direction
      e.preventDefault()
      break
    case ' ':
      //only allow a jump to begin if a downwards movement isnt available
      console.log('down available:', pacman.availableMovements().down)
      
      pacman.jumpBegin = !pacman.availableMovements().down
      e.preventDefault()
      break
  }
  
}

// Move rules:
// 1. Can not move into a wall tile
// 2. Can not move up into a prison tile, but can move left/down/right into a prison tile

function rightMove(currentSquare){
  if(currentSquare % game.gridWidth === game.gridWidth - 1) return null
  if(game.squares[currentSquare + 1].classList.contains('wall')) return null //no move if the square is a wall
  return currentSquare + 1
}
function leftMove(currentSquare){
  if(currentSquare % game.gridWidth === 0) return null
  if(game.squares[currentSquare - 1].classList.contains('wall')) return null //no move if the square is a wall
  return currentSquare - 1
}
function upMove(currentSquare){
  if(currentSquare - game.gridWidth < 0) return currentSquare -= game.gridWidth
  if(game.squares[currentSquare - game.gridWidth].classList.contains('wall')) return null //no move if the square is a wall
  if(game.squares[currentSquare - game.gridWidth].classList.contains('prison')) return null //no move if the square is a prison
  return currentSquare - game.gridWidth
}
function downMove(currentSquare){
  if(currentSquare + game.gridWidth > (game.gridWidth * game.gridWidth - 1)) return null
  if(game.squares[currentSquare + game.gridWidth].classList.contains('wall')) return null //no move if the square is a wall
  return currentSquare + game.gridWidth
}


class Player {
  constructor(index){
    this.location = index
    this.movable = false
    this.startSquare = index
    this.direction = null
    this.stepSize = 30
    this.jumpBegin = false
    this.jumpCount = 0
    this.jumpMomentum = null
    this.availableMoves = {}
    this.dead = false
    this.xPos = 0
    this.yPos = 0
    this.sprite = document.querySelector('.player')
  }
  translateCoords(x, y){
    //work out the square number based on x position only
    let sqNumber = Math.floor(x / 30)
    //work out and add the vertical offset
    sqNumber += Math.floor(y / 30) * 17
    return sqNumber
  }
  availableMovements(x, y){
    x = x ? x : this.xPos 
    y = y ? y : this.yPos 
    return {
      left: !(
        x <= 0 || 
        game.squares[this.translateCoords(x - this.stepSize, y)].classList.contains('wall')),
      right: !(
        x + this.stepSize >= game.gridWidth * game.pixels ||
        game.squares[this.translateCoords(x + this.stepSize, y)].classList.contains('wall')),
      up: !(
        y <= 0 ||
        game.squares[this.translateCoords(x, y - this.stepSize)].classList.contains('wall')),
      down: !(
        y + this.stepSize >= game.gridWidth * game.pixels ||
        game.squares[this.translateCoords(x, y + this.stepSize)].classList.contains('wall'))
    }
  }
  move(){
    //dont allow pacman to move if he is dead
    if(this.dead) return
    
    //potential moves of the sprite
    this.availableMoves = this.availableMovements(this.xPos, this.yPos)

    //if we're partway through a jump, decrease the counter
    if (this.jumpCount && this.availableMoves.up) this.jumpCount--
    
    //start jump if we've been told to, and if we can, and if we're not already jumping
    if (this.jumpBegin && this.availableMoves.up && !this.jumpCount) this.jumpCount = 1
    
    //if we're starting a jump and we have a direction, apply it as momentum
    if (this.jumpBegin && this.direction) this.jumpMomentum = this.direction
    
    //disallow movement if the square is not available
    if (this.direction === 'right' && !this.availableMoves.right) this.direction = null
    if (this.direction === 'left' && !this.availableMoves.left) this.direction = null
    
    //remove jump flag if we can't move upwards
    if (this.jumpCount && !this.availableMoves.up) this.jumpCount = 0
    
    //allow falling if we're not jumping and down is available
    if (this.availableMoves.down && !this.jumpCount) this.direction = 'down'

    //remove the momentum if the jump has finished
    if (!this.jumpCount && !this.availableMoves.down) this.jumpMomentum = null
    
    //remove the momentum if the direction isnt available
    // if (this.jumpMomentum === 'left' && !this.availableMoves.left) this.jumpMomentum = null
    // if (this.jumpMomentum === 'right' && !this.availableMoves.right) this.jumpMomentum = null


    // console.log('dir:', this.direction, 'available:', this.availableMoves)
    console.log('available:', this.availableMoves)
    
    //check if pacman should die in the new location, if so, dont move there
    this.checkDead()

    // console.log('pre reposition:', this.direction, this.jumpCount)
    
    //check if the player died, and also if there is a direction to move 
    if(!this.dead && (this.direction || this.jumpCount)){
      //allow move
      this.reposition()
      this.direction = null
    }

    //once we've moved, reset the flags
    this.jumpBegin = false
  }
  reposition(){
    // console.log('repositioning:', this.direction)
    if (this.jumpCount) {
      //jumping logic
      this.yPos -= this.stepSize
      //potential moves of the sprite in the new position
      this.availableMoves = this.availableMovements(this.xPos, this.yPos)
      if (this.jumpMomentum === 'left' && this.availableMoves.left) this.xPos -= this.stepSize
      if (this.jumpMomentum === 'right' && this.availableMoves.right) this.xPos += this.stepSize
    } else if (this.direction === 'down'){
      //falling logic
      this.yPos += this.stepSize
      //potential moves of the sprite in the new position
      this.availableMoves = this.availableMovements(this.xPos, this.yPos)
      if (this.jumpMomentum === 'left' && this.availableMoves.left) this.xPos -= this.stepSize
      if (this.jumpMomentum === 'right' && this.availableMoves.right) this.xPos += this.stepSize
    } else {
      //non-jumping logic
      if (this.direction === 'left') this.xPos -= this.stepSize
      if (this.direction === 'right') this.xPos += this.stepSize
    }

    this.sprite.style.left = `${this.xPos}px`
    this.sprite.style.top = `${this.yPos}px`
    // console.log('X:', this.xPos, 'Y:', this.yPos, 'Direction:', this.direction)

    // console.log('new sq:', this.translateCoords(this.xPos, this.yPos))

  }
  checkDead(){
    //if pacman is already dead, we dont need to check it again
    if(this.dead) return
    //check if pacman is on the same square as a ghost
    ghosts.forEach(ghost => {
      //if pacman is on the same square as a ghost, he should die
      if(ghost.square.current === this.location && ghost.bias.inverted === 0) this.death()
      //if pacman hasnt eaten a big pill and is on the same square, the ghost should die
      if(ghost.square.current === this.location && ghost.bias.inverted > 0){
        scoreboard.up(100)
        ghost.resetPosition()
      }
    })
  }
  reset(){
    if(game.lost) return
    this.dead = false
    pacman.movable = true
    this.location = this.startSquare
    this.direction = null
    game.addSprite(this.name, this.location, 'start')
  }
  death(){
    //if pacman is already dead, we dont need to run this routine again
    if(this.dead) return
    //stop movement if pacman has lives left
    this.dead = true
    game.initiateLoss('pacman')
    //apply the class, and then remove pacman after a timeout, to allow the animation to run. Pacman can die either at this.location or at this.previousLocation
    game.squares[this.location].classList.add('dead')
    setTimeout( ()=> {
      game.squares[this.location].classList.remove('pacman', 'pacman-up', 'pacman-down', 'pacman-left', 'pacman-right', 'dead')
    }, 2000)
  }
}

class Ghost{
  constructor(name, square, homeSquare, startOnClock){
    this.name = name
    this.square = { current: square, start: square, history: [], home: homeSquare }
    this.bias = { directions: [], inverted: 0, targetName: '', targetLocation: '' }
    this.allDirections = ['up','right','down','left']
    this.startDirection = 'left'
    this.direction = this.startDirection
    this.stepCounter = 0
    this.availableMoves = {}
    this.mode = {}
    this.killedPacman = false
    this.startOnClock = startOnClock
  }
  clearSprite(location){
    game.removeSprite(this.name, location)
  }
  resetPosition(){
    //reset the position of the ghost, set a default direction and add the start square to the history
    this.bias.inverted = 0
    this.killedPacman = false
    this.square.current = this.square.start
    this.direction = this.startDirection
    this.addStep(this.square.current)
    //start the ghost with a target to navigate out of the prison
    this.bias.targetName = 'prison-exit'
    this.bias.targetLocation = 212
    
    //draw the ghost in its new position
    game.addSprite(this.name, this.square.current, `${this.name}-${this.direction}`)
  }
  calcAvailableMoves(){
    this.availableMoves.right = rightMove(this.square.current)
    this.availableMoves.left = leftMove(this.square.current)
    this.availableMoves.up = upMove(this.square.current)
    this.availableMoves.down = downMove(this.square.current)
  }
  calcTarget(){
    const theTarget = this.bias.targetName
    switch (theTarget) {
      case 'prison-exit':
        //if we reached the target, reset it to pacman
        if(this.square.current === this.bias.targetLocation){
          this.bias.targetName = 'pacman'
          this.bias.targetLocation = pacman.location
        }
        break
      case 'home-area':
        this.bias.targetLocation = this.square.home
        //if we reached the target, reset it to pacman
        if(this.square.current === this.bias.targetLocation){
          this.bias.targetName = 'pacman'
          this.bias.targetLocation = pacman.location
        }
        break
      case 'pacman':
        //update pacman's location
        this.bias.targetLocation = pacman.location
        break
      default:
        //as a safety, set pacman back to be the target
        this.bias.targetName = 'pacman'
        this.bias.targetLocation = pacman.location
    }
    if(theTarget !== this.bias.targetName) console.log(`${this.name} switched target from ${theTarget} to ${this.bias.targetName}`)
  }
  calcDirectionBias(){
    //work out how far away the ghost is from the target (pacman, home-area or prison-exit)
    const targetColumn = this.bias.targetLocation % game.gridWidth
    const targetRow = Math.floor(this.bias.targetLocation / game.gridWidth)
    const ghostColumn = this.square.current % game.gridWidth
    const ghostRow = Math.floor(this.square.current / game.gridWidth)
    const horizontalDifference = ghostColumn - targetColumn
    const rowDifferential = ghostRow - targetRow
    //wipe the bias to recalculate it, and only add the direction to the bias if it is not zero. Add either left/right because the column (horizontal) difference is greater. Add either up/down because the row (vertical) difference is greater
    this.bias.directions = []
    if (horizontalDifference > 0) this.bias.directions.push('left')
    if (horizontalDifference < 0) this.bias.directions.push('right')
    if (rowDifferential > 0) this.bias.directions.push('up')
    if (rowDifferential < 0) this.bias.directions.push('down')
  }
  checkBiasInversion(){
    if(this.bias.inverted > 0){
      const newDirections = []
      this.bias.directions.forEach(direction => newDirections.push(this.oppositeDirection(direction)))
      this.bias.directions = newDirections
      if(this.bias.inverted === 1) console.log(`${this.name} is now switching back to attacking pacman (ending bias inversion)`)
      this.bias.inverted--
    }
  }
  specialSprite(){
    //bias inversion lasts for 30 turns - when there are only 10 left, signal that it is ending by changing the sprite
    if(this.bias.inverted > 10) return `${this.name}-pilled`
    if(this.bias.inverted > 0) return `${this.name}-pilled-ending`
    return null
  }
  move(forcedLocation){
    //only move if the game clock is after the ghost's startOnClock
    if(game.clock < this.startOnClock) return

    //set the newSquare to be the forced location only if one is passed in otherwise initialise it
    let newSquare = forcedLocation ? forcedLocation : null
    //increase the move stepCounter
    this.stepCounter++

    // generate the direction bias to influence the direction of travel, and work out what the available moves are
    this.calcTarget()
    this.calcDirectionBias()
    this.checkBiasInversion() //when a big pill has been eaten
    this.calcAvailableMoves()


    //understand if we are in a special mode of movement, run the appropriate method
    if(!newSquare){
      switch(this.calcMode()) {
        case 'obstacle':
          newSquare = this.obstacleModeMove()
          break
        default:
          newSquare = this.noModeMove()
      }
    }

    //check to see if this newSquare will kill pacman - if it will, stop play. It returns a revised newSquare value just in case pacman killed the ghost
    newSquare = this.pacmanInteraction(newSquare)
    if(this.killedPacman){
      game.initiateLoss(this.name)
    }

    //if we didnt kill pacman, check we made a choice, then make the move and apply to the object parameters, but only if pacman is alive. If he's dead, dont move there because it will ruin the death animation
    if(newSquare && !this.killedPacman){
      //identify the new direction based on the newSquare variable
      this.direction = Object.keys(this.availableMoves).filter(direction => this.availableMoves[direction] === newSquare )[0]
      //as a backup, use the start direction in case the chosen move isnt available (warping back to the prison may cause this)
      if(!this.direction) this.direction = this.startDirection
      //apply the new square
      this.square.current = newSquare
      //console.log('Chose:', this.direction, this.square)
      //add the square to the loaction history
      this.addStep(this.square.current)

      //move to the square, by moving the sprite
      game.addSprite(this.name, this.square.current, `${this.name}-${this.direction}`, this.specialSprite())
      //we just added the new location to the history, remove the old sprite from history position #1
      this.clearSprite(this.square.history[1])
    }
  }
  noModeMove(){
    // the standard way to calculate the next move when we are not in a special mode
    let newSquare = null
    let newDirection = null

    //work out what the opposite direction is to the current direction of travel
    const cameFrom = this.oppositeDirection(this.direction)
    //add into the array the moves that are possible
    const possibleMoves = this.allDirections.filter(direction => this.availableMoves[direction])
    //decide if I'm at a junction. Grab the available moves, then remove the direction we just came from
    const crossroads = possibleMoves.filter(direction => direction !== cameFrom)

    //Log helper for giving the parameters required when assessing the best move to make
    //console.log('No mode move. Current direction:',this.direction ,'possible:',possibleMoves, 'bias:',this.bias, 'junction:', crossroads)

    //Decide what is best to do:
    // 1. If i'm at a junction, choose the direction which leads to pacman
    // 2. Continue in the same direction if possible
    // 3. If the only appropriate choice is away from pacman, go into obstacle mode
    // 4. Make a random choice

    // I'm at a junction and there are more than one moves available that arent where I came from, choose a direction at the junction which takes me towards pacman
    if(crossroads.length > 1){
      const biasJcnDirections = crossroads.filter(direction => this.bias.directions.includes(direction))
      //console.log('Jcn based on bias', biasJcnDirections, biasJcnDirections.length)
      //decide if the junction options are in the bias or not
      if(biasJcnDirections.length > 0){
        newDirection = biasJcnDirections[Math.floor(Math.random() * biasJcnDirections.length)]
        //console.log('Jcn randomly chose:',newDirection)
        newSquare = this.availableMoves[newDirection]
      }
    }

    // 2. If I havent decided yet, see if I can continue in the direction I was already travelling in
    if(!newSquare && this.availableMoves[this.direction]){
      //console.log('Im going to continue')
      newSquare = this.availableMoves[this.direction]
    }

    // 3. If I havent decided yet and there is only 1 choice and it is away from pacman, go into obstacle mode
    if(!newSquare && crossroads.length === 1 && this.bias.directions.includes(this.oppositeDirection(crossroads[0]))){
      //console.log('theres no good junction choice, so lets go into obstacle mode')
      this.modeSwitch('obstacle')
      //instead of skipping the turn, immediately run the obstacle logic
      newSquare = this.obstacleModeMove()
    }

    // 4. if I havent decided yet, make a random choice of the available directions
    if(!newSquare && possibleMoves.length !== 0){
      newDirection = possibleMoves[Math.floor(Math.random()*possibleMoves.length)]
      newSquare = this.availableMoves[newDirection]
      //console.log('Completely random:', newDirection)
    }

    //finally return the new square value. This should never be null because of item #4 above
    return newSquare
  }
  obstacleModeMove(){
    //obstacle mode requires the ghost to move anticlockwise around any obstacles
    //console.log('OPERATING IN OBSTACLE MODE')

    //to move in an anticlocwise direction, we need to identify the last direction of travel and choose the first available direction an index before our previous direction
    const directionPreferenceOrder = this.anticlockwiseDirections(this.direction)

    //the array items are listed in anticlockwise order, so find the first index that is allowed
    const preferredDirection = directionPreferenceOrder.find(direction => this.availableMoves[direction])
    //console.log('Obstacle navigation chose:', direction)
    return this.availableMoves[preferredDirection]
  }
  addStep(step){
    //add the new step to the start of the history, and see if we have more than 4 steps recorded
    this.square.history.unshift(step)
    while(this.square.history.length > 4){
      this.square.history.pop()
    }
  }
  pacmanInteraction(index){
    let revisedIndex = index
    //will kill pacman if he is on the same square, and the bias is not inverted
    if(game.squares[index].classList.contains('pacman') && this.bias.inverted === 0){
      this.killedPacman = true
    }
    //if the bias is inverted and pacman is on this square, gain 100 points and fly back to the prison
    if(this.bias.inverted > 0 && game.squares[index].classList.contains('pacman')){
      this.resetPosition()
      revisedIndex = this.square.current //reset position changed this.square.current to the start position
      scoreboard.up(100)
    }
    return revisedIndex
  }
  oppositeDirection(direction){
    switch(direction){
      case 'up': return 'down'
      case 'down': return 'up'
      case 'left': return 'right'
      case 'right': return 'left'
    }
  }
  anticlockwiseDirections(direction){
    if (direction === 'down') return ['right','down','left','up']
    if (direction === 'right') return ['up','right','down','left']
    if (direction === 'up') return ['left','up','right','down']
    if (direction === 'left') return ['down','left','up','right']
  }
  calcMode(){
    //if there is a mode defined, and it should end this turn, end it
    if(this.mode.name && this.mode.ends === this.stepCounter){
      console.log(`${this.name} is ending ${this.mode.name} mode`)
      this.mode = {}
    }
    //if there is a mode active, return the name of it
    return this.mode.name
  }
  modeSwitch(mode){
    //if there isnt a mode in operation, set it to the new mode, and record the step number
    if(!this.mode.name){
      console.log(`${this.name} is starting ${mode} mode`)
      this.mode.name = mode
      this.mode.started = this.stepCounter
      this.mode.ends = this.stepCounter + 3
    }
    //TODO: future modes
    //case 'poison': this.mode = 'poison'
  }
}

class GameDefinition{
  constructor(gridClass, gridWidth, pixels, levelData){
    this.gridClass = gridClass
    this.grid = document.querySelector(this.gridClass)
    console.log('found the grid:',this.grid)
    this.pixels = pixels
    this.gridItems = null
    this.gridWidth = gridWidth
    this.levelData = levelData
    this.currentLevel = 0
    this.squares = []
    this.lost = false
    this.roundLost = false
    this.totalPills = 0
    this.pillsRemaining = null
    this.clock = 0
    this.playerIntervalId = null
    this.playerInterval = 200
    this.paintGrid()
    //this.paintDecoration()
  
  }
  startMovement(){
    //each game turn runs the playerMove function
    if (!this.playerIntervalId) this.playerIntervalId = 
      setInterval( ()=> this.playerMove() , this.playerInterval)
  }
  stopMovement(){
    clearInterval(this.playerIntervalId)
    this.playerIntervalId = null
  }
  playerMove(){
    //this code is run for each game 'turn' - pacman and the ghosts are moved, the clock advanced, and a decision is made about what target mode the ghosts should operate in

    //GAME
    this.clock++
    //console.log(this.clock)

    //if pacman is dead but there are more lives remaining, skip the chance for the ghosts to move
    if(pacman.dead && scoreboard.lives > 0) return

    //PACMAN - pacman could die on his turn, and before the ghosts' turns so we need to check before they run
    pacman.move()
    if(pacman.dead){
      this.initiateLoss('player died on their turn')
    }

    //if pacman is dead but there are more lives remaining, skip the chance for the ghosts to move
    if(pacman.dead && scoreboard.lives > 0) return

    //GHOSTS - the switch targets is a game wide setting that determines if the ghosts target pacman or their home area (each quarter of the grid homes one ghost)
    // ghosts.forEach(ghost => ghost.move())

    // if(pacman.dead){
    //   this.initiateLoss('player died on enemy turn')
    // }
  }

  startRound(){
    //reset the round variables
    this.clock = 0
    this.roundLost = false
    //reset the sprites
    pacman.reset()
    ghosts.forEach(ghost => ghost.resetPosition())
    messages.newSequence(['3','2','1','GO!',''],1000)
    setTimeout( ()=> this.startMovement(), 3000)
  }
  initiateWin(){
    //check that we havent already lost the game, or the round
    if(this.lost) return
    if(this.roundLost) return
    this.stopMovement()
    messages.newSingle('Level Complete')
    setTimeout(()=>this.exitGame(), 2000)
  }
  initiateLoss(lossTrigger){
    //check that we havent already lost the game, or this round
    if(this.lost) return
    if(this.roundLost) return

    //set that the round has been lost
    this.roundLost = true

    console.log('Loss trigger:',lossTrigger)
    //ensure pacman is dead
    pacman.death()
    scoreboard.updateLives(-1)
    //if there are no more lives to lose set the game to lost, and signal game over. If there are more lives to lose, stop the ghosts from moving
    if(scoreboard.lives === 0){
      messages.newSingle('Game over')
      this.lost = true
      setTimeout(()=>this.exitGame(), 2000)
    } else {
      this.stopMovement()
      messages.newSingle('Life lost - Press space to continue', 'small')
    }
  }
  exitGame(){
    this.stopMovement()
    this.grid.innerHTML = ''
    document.querySelector('.d-pad').classList.add('hide')
    scoreboard.captureName()
  }
  addSprite(spriteClass, spriteIndex, spriteVariant, spriteVariant2){
    this.squares[spriteIndex].classList.add(spriteClass, spriteVariant)
    if(spriteVariant2) this.squares[spriteIndex].classList.add(spriteVariant2)
  }
  removeSprite(spriteClass, spriteIndex){
    //for the first step, there will not be an old sprite to remove
    if(!spriteIndex) return
    this.squares[spriteIndex].classList.remove(spriteClass, `${spriteClass}-pilled`, `${spriteClass}-pilled-ending`, `${spriteClass}-left`, `${spriteClass}-right`, `${spriteClass}-up`, `${spriteClass}-down`)
  }
  paintGrid(){
    //create the grid with width*width number of squares
    this.grid.innerHTML = ''
    for (let i = 0; i < this.gridWidth * this.gridWidth; i++) {
      const square = document.createElement('div')
      square.classList.add('grid-item')
      //square.classList.add(`index${i}`)
      square.addEventListener('click', e => e.target.classList.toggle('wall'))
      this.squares.push(square)
      this.grid.append(square)
    }
    this.gridItems = this.grid.querySelectorAll('.grid-item')
  }
  paintDecoration(){
    console.log(this.levelData[this.currentLevel])
    
    this.levelData[this.currentLevel].walls.forEach(wall => this.squares[wall].classList.add('wall'))

  }
  createWallArray(){
    const wallSquares = this.squares.reduce( (total,square,index) => {
      return square.classList.contains('wall') ? total.concat(index) : total //include it if there is a wall class
    },[])
    return wallSquares.toString().replace(/,/g,', ')
  }
}

class ScoreboardDefinition{
  constructor(scoreboardClass, highScoresClass, highScores, formClass){
    this.score = 0
    this.highScores = highScores
    this.highScore = highScores[0].value
    this.lives = 3
    this.gameLost = false
    this.playerName = null
    this.boardElement = document.querySelector(scoreboardClass)
    this.highScoresElement = document.querySelector(highScoresClass)
    this.formElement = document.querySelector(formClass)
    this.scoreElement = this.boardElement.querySelector('.score')
    this.highElement = this.boardElement.querySelector('.high')
    this.livesElement = this.boardElement.querySelector('.lives')
    this.updateLives()
    this.up(0)
  }
  up(newPoints){
    this.score = this.score + newPoints
    this.scoreElement.innerText = `Score ${this.score}`
    if (this.score > this.highScore) this.highScore = this.score
    this.highElement.innerText = `High ${this.highScore}`
  }
  reset(){
    this.score = 0
    this.element.innerText = this.score
  }
  updateLives(change){
    if(change) this.lives += parseInt(change)
    this.livesElement.innerHTML = ''
    for (let i = 0; i < this.lives; i++) {
      const life = document.createElement('div')
      life.classList.add('pacman', 'grid-item')
      this.livesElement.append(life)
    }
  }
  captureName(){
    messages.newSequence(['Enter the hall of fame', ''], 1000)
    this.formElement.classList.remove('hide')
    this.formElement.addEventListener('submit', (e)=>this.submitForm(e))
  }
  submitForm(e){
    e.preventDefault()
    this.formElement.classList.add('hide')
    this.playerName = e.target.name.value
    console.log('hello', this.playerName)
    this.submitScore()
  }
  submitScore(){
    if (!this.playerName) this.captureName()
    else {
      //update the back end with the new score
      axios.post('/api/scores', { name: this.playerName, value: this.score })
        .then(({ data }) => {
          //capture the data as the new high scores
          this.highScores = data
          this.showTable()
        })
    }
  }
  showTable(){
    console.log('Showing the table now!!')
    console.log('high scores:', this.highScores)

    if (this.score === this.highScore) messages.newSequence(['New high score', ''], 1000)
    
    //unhide the scores
    this.highScoresElement.classList.remove('hide')
    
    //build the score table
    const tableBody = this.highScoresElement.querySelector('tbody')
    //build table
    this.highScores.forEach((score, i) => {
      const scoreRow = document.createElement('tr')
      const rank = document.createElement('td')
      const value = document.createElement('td')
      const name = document.createElement('td')
      rank.innerHTML = i + 1
      name.innerHTML = score.name
      value.innerHTML = score.value
      scoreRow.append(rank)
      scoreRow.append(value)
      scoreRow.append(name)
      tableBody.append(scoreRow)
    })
    

  }
}

class MessageBar{
  constructor(messageBarClass){
    this.element = document.querySelector(messageBarClass)
    this.newSingle('press direction to begin', 'small')
  }
  newSequence(messages,timeBetween){
    messages.forEach( (message, index) => {
      setTimeout(()=>this.newSingle(message), timeBetween * (index+1))
    })
  }
  newSingle(message, size){
    this.element.innerHTML = ''
    const childDiv = document.createElement('div')
    childDiv.innerText = message
    childDiv.classList.add('message')
    if(size) childDiv.classList.add(size)
    this.element.append(childDiv)
  }
}

