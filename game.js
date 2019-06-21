Element.prototype.addClass = Element.prototype.addClass || function(clazz) {
	this.setAttribute('class', this.getAttribute('class') + ' ' + clazz);
}

Element.prototype.removeClass = Element.prototype.removeClass || function(clazz) {
	this.setAttribute('class', 
		this.getAttribute('class').split(' ').filter(item => item !== clazz).join(' ')
	);
}

Element.prototype.hasClass = Element.prototype.hasClass || function(clazz) {
	return this.getAttribute('class').split(' ').find(item => item === clazz) === clazz;
}

$ms = window.$ms || {};

(function Game(self) {

	const MINE = 1;
	const OTHER = 0;

	let settings = {
		cols: 30,
		rows: 18,
		numMines: 99,
		fieldsToOpen: this.cols * this.rows - this.numMines
	};
	
	let openCount = 0;
	let markedCount = 0;
	let playing = true;
	let fields = [];
	
	let countFn;
	
	self.startGame = initGame;
	self.notifyLoaded = notifyLoaded;
	
	function Field(x, y, _fType, _numMines) {
		const me = this;
		this.fType = _fType;
		this.numMines = _numMines;
		this.open = false;
		
		this.createNode = createNode;
		this.click = doClick;
		this.reveal = reveal;
		this.feed = feed;
		
		let stage;
		let myNode;
		let marked = false;
		
		function checkMarked(nMarked) {
			if(marked && !nMarked) {
				countMarked(-1);
			} else if(!marked && nMarked) {
				countMarked(1);
			}
			marked = nMarked;
		}

		function doClick() {
			if(playing && !me.open && !marked) {
				checkMarked(false);
				myNode.removeClass('marked');
				myNode.addClass('openfield');
				if(me.fType === MINE) {
					myNode.addClass('boom');
					playing = false;
					revealAll();
				} else {
					openField();
					checkReady();
				}
			}
		}

		function openField() {
			me.open = true;
			myNode.innerHTML = me.numMines === 0 ? '' : me.numMines;
			if(me.numMines === 0){
				scanNeighbors4(x, y, function(i, j) {
					if(fields[i] && fields[i][j] && !fields[i][j].open) {
						fields[i][j].click();
					}
				});
			} 
		}
		
		function reveal() {
			if(!myNode.hasClass('openfield')) {
				if(me.fType === OTHER) {
					if(myNode.hasClass('marked')) {
						myNode.addClass('wrongMark');
					}
				} else if(!myNode.hasClass('boom') && !myNode.hasClass('marked')) {
					myNode.addClass('bomb');
				}
			}
		}
		
		me.show = function() {
			if(me.fType !== MINE) {
				myNode.innerHTML = me.numMines === 0 ? '' : me.numMines;
				myNode.addClass('openfield');
			}
		}
		
		function createNode() {
			const element = document.createElement('DIV');
			element.setAttribute('class', 'field color' + me.numMines);
			element.addEventListener('contextmenu', function(evt) {
				if(playing && !me.open) {
					marked ? element.removeClass('marked') : element.addClass('marked');
					checkMarked(!marked);
				}
			});
			element.addEventListener('click', doClick);
			myNode = element;
			return element;
		}
		
		function feed() {
			myNode.removeClass('marked');
			myNode.addClass('openfield');
			myNode.addClass('hamburger');
		}
	}

	function yahoo() {
		iterate((i, j) => {
			if(fields[i][j].fType === MINE) {
				fields[i][j].feed();
			}
		});
	}

	function checkReady() {
		if(++openCount === settings.fieldsToOpen) {
			yahoo();
			playing = false;
		}
	}

	self.subscribeFlagCount = function(fn) {
		countFn = fn;
	}

	function countMarked(add) {
		markedCount += add;
		if(countFn) {
			countFn(markedCount, settings.numMines);
		}
	}

	function fillBoard() {
		stage.innerHTML = '';
		let i, j;
		for (i = 0; i < settings.rows; i++) {
			const row = document.createElement('DIV');
			row.setAttribute('class', 'row');
			for(j = 0; j < settings.cols; j++) {
				row.appendChild(fields[j][i].createNode());
			}
			stage.appendChild(row);
		}
	}

	function random(max) {
		return Math.floor(Math.random() * max);
	}

	function createMineCoords(settings) {
		const x = random(settings.cols);
		const y = random(settings.rows);
		if(fields[x][y]) {
			return createMineCoords(settings);
		}
		return [x, y];
	}

	function scanNeighbors4(x, y, fn) {
		const startX = x > 0 ? x - 1 : x;
		const endX = x < settings.cols ? x + 1 : x;
		
		const startY = y > 0 ? y - 1 : y;
		const endY = y < settings.rows ? y + 1 : y;
		
		let i, j;
		for(i = startX; i <= endX; i++) {
			for(j = startY; j <= endY; j++) {
				fn(i, j);
			}
		} 
	}

	function countMines(x, y) {
		let result = 0;
		scanNeighbors4(x, y, (i, j) => {
			if(fields[i] && fields[i][j] && fields[i][j].fType === MINE) {
				result++;
			}
		});
		return result;
	}

	function createFields() {
		fields = [];
		for(let i = 0; i < settings.cols; i++) {
			fields[i] = [];
		}
		for(let i = 0; i < settings.numMines; i++) {
			const coords = createMineCoords(settings);
			fields[coords[0]][coords[1]] = new Field(coords[0], coords[1], MINE, 0);
		}
		iterate((i, j) => { 
			if(!fields[i][j]) {
				fields[i][j] = new Field(i, j, OTHER, countMines(i, j));
			}
		});
	}

	function revealAll() {
		iterate((i, j) => fields[i][j].reveal());
	}

	function show() {
		iterate((i, j) => fields[i][j].show());
	}

	function iterate(fn) {
		let i, j;
		for(i = 0; i < settings.cols; i++) {
			for(j = 0; j < settings.rows; j++) {
				fn(i, j);
			}
		}	
	}

	function initGame(_settings) {
		if(_settings) {
			const a = JSON.parse(_settings);
			settings = {cols:a[0], rows:a[1], numMines:a[2], fieldsToOpen: a[0] * a[1] - a[2]};
		}
		createFields();
		fillBoard();
		playing = true;
		openCount = 0;
		markedCount = 0;
		countMarked(0);
		// show();
	}
	
	function notifyLoaded(_stage) {
		stage = _stage;
		stage.oncontextmenu = function(evt) {
			return false;
		}
		initGame();
	}

})($ms);
