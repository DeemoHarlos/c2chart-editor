/* PIXI ALIAS */
const App            = PIXI.Application
const loader         = PIXI.loader
const resource       = PIXI.loader.resources
const Sprite         = PIXI.Sprite
const Container      = PIXI.Container
const TextureCache   = PIXI.utils.TextureCache
const Graphics       = PIXI.Graphics
const Ticker         = PIXI.Ticker
const filters        = PIXI.filters

/* CONST VALUES */
const canvasWidth = 1920
const canvasHeight = 1440
const margin = {
	'top': 180,
	'bottom' : 140,
	'side' : 100
}
const noteAreaWidth = canvasWidth - 2 * margin.side
const noteAreaHeight = canvasHeight - margin.top - margin.bottom
const noteRatio = 1

const accelRatio = 1

/* VARIABLES */
var cursor = 0
var playbackListen = true
var stateFunction = states.loading
var state = 'loading'

/* PIXI CANVAS */
const app = new App({
	width        : resolution.width,
	height       : resolution.height,
	antialias    : config.antialias,
	transparent  : config.transparent,
	autoResize   : true,
	resolution   : 1
})

/* AUDIO */
const audio = {
	file: 'ivy001_014.wav',
	format: 'wav',
	delay: 0,
	offset: 0
}

const chartFile = ''

/* ASSETS */
const noteTypes = {
	'regular': {
		up:   { src: 'assets/note_up.png' },
		down: { src: 'assets/note_down.png' }
	},'hold': {
		up:   { src: 'assets/hold_up.png' },
		down: { src: 'assets/hold_down.png' },
		tail: { src: 'assets/hold_tail.png'}
	},'long hold': {
		up:   { src: 'assets/long_hold.png' },
		down: { src: 'assets/long_hold.png' },
		tail: { src: 'assets/long_hold_tail.png'}
	},'chain head': {
		up:   { src: 'assets/chain_head_up.png' },
		down: { src: 'assets/chain_head_down.png' }
	},'chain': {
		up:   { src: 'assets/chain_up.png' },
		down: { src: 'assets/chain_down.png' }
	},'flick': {
		up:   { src: 'assets/flick_up.png' },
		down: { src: 'assets/flick_down.png' }
	},'drag head': {
		up:   { src: 'assets/note_up.png' },
		down: { src: 'assets/note_down.png' }
	},'drag': {
		up:   { src: 'assets/drag_up.png' },
		down: { src: 'assets/drag_down.png' }
	}
}

function loadAssets() {
	return new Promise(resolve=>{
		Object.keys(noteTypes).forEach(key=>{
			loader.add(`${key}_up`  , noteTypes[key].up  .src)
			loader.add(`${key}_down`, noteTypes[key].down.src)
			if (noteTypes[key].tail)
				loader.add(`${key}_tail`, noteTypes[key].tail.src)
		})
		loader.load(()=>{
			Object.keys(noteTypes).forEach(key=>{
				noteTypes[key].up  .txr = loader.resources[`${key}_up`  ].texture
				noteTypes[key].down.txr = loader.resources[`${key}_down`].texture
				if (noteTypes[key].tail)
					noteTypes[key].tail.txr = loader.resources[`${key}_tail`].texture
				resolve()
			})
		})
	}
}

/* SCALING */
document.querySelector('#main').insertAdjacentElement(app.view)
window.addEventListener('resize', ()=>{ scaleToWindow(app.view) })
scaleToWindow(app.view)

/* STATES */
const states = {
	loading() {},
	ready() {},
	play() {
		cursor += app.ticker.elapsedMS * accelRatio
		audioPlaybackListener()
	},
	pause() {
		sound.pause()
	}
}

function switchState(st) {
	var newState = states[st]
	if(!newState) throw `State '${st}' not found.`
	console.log(st)
	state = st
	stateFunction = newState	
}

/* PLAYBACK CONTROL */
document.querySelector('#main').addEventListener('click', ()=>{
	if(state === 'ready' || state === 'pause') {
		playbackListen = true
		switchState('play')
	}
	else if(state === 'play') switchState('pause')
})

/* AUDIO */
function loadAudio(s) {
	return Promise((resolve, reject)=>{
		let sound = s
		if(sound) sound.stop()
		sound = new Howl({
			src              : [audio.file],
			format           : [audio.format],
			autoplay         : false,
			loop             : false,
			volume           : config.audio.volume/Math.max(config.accelRatio,1),
			rate             : config.accelRatio,
		})

		sound.once('end',()=>{
			initParams()
			switchState('ready')
		})

		sound.once('loaderror',(e,msg)=>{
			console.log('Unable to load file: ' + name + ' | error message : ' + msg);
			console.log('First argument error ' + e);
			reject()
		})

		sound.once('load',()=>{
			resolve(sound)
		})
	})
}

function audioPlaybackListener() {
	if (playbackListen && cursor >= audio.delay - audio.offset) {
		sound.seek((cursor + audio.offset - audio.delay)/1000)
		sound.play()
		playbackListen = false
	}
}

/* START */
app.ticker.add(gameLoop)
loadAssets