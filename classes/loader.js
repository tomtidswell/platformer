class Loader {
  constructor(loaderClass, textId) {
    this.element = document.querySelector(loaderClass)
    this.text = document.querySelector(textId)
    this.lines = []
    //create 30 lines
    for (let i = 0; i < 30; i++) this.divideScreen()
    //refresh the lines every half second
    this.interval = setInterval(()=>this.changeLines(), 100)
  }
  divideScreen() {
    const childDiv = document.createElement('div')
    childDiv.classList.add('load-line')
    childDiv.style.backgroundColor = '#' + Math.random().toString(16).substr(2, 6)
    this.element.append(childDiv)
    this.lines.push(childDiv)
  }
  changeLines() {
    this.lines.forEach(line => line.style.backgroundColor = '#' + Math.random().toString(16).substr(2, 6))
  }
  complete() {
    document.querySelector('body').classList.add('loaded')
    clearInterval(this.interval)
    setTimeout(()=>this.element.classList.add('hidden'),2000)
  }
  msg(text) {
    const childDiv = document.createElement('div')
    childDiv.innerText = `> ${text}`
    // add a slight delay, just for fun
    setTimeout(() => this.text.append(childDiv), 1000)
  }
  error(item, err) {
    const childDiv = document.createElement('div')
    childDiv.innerText = `> ${item} error: ${err.message}`
    this.text.append(childDiv)
    clearInterval(this.interval)
  }
} 

export default Loader