Element.prototype.addClass = function(clazz) {
	this.setAttribute('class', this.getAttribute('class') + ' ' + clazz);
}

Element.prototype.removeClass = function(clazz) {
	const old = this.getAttribute('class');
	const splitted = old.split(' ');
	const n = splitted.filter(item => item !== clazz);
	this.setAttribute('class', n.join(' '));
}

Element.prototype.hasClass = function(clazz) {
	return this.getAttribute('class').split(' ').find(item => item === clazz) === clazz;
}

$ms = window.$ms || {};

(function Game(self) {

	const MINE = 1;
	const OTHER = 0;

	const cols = 30;
	const rows = 18;
	const numMines = 99;

	const fieldsToOpen = cols * rows - numMines;
	
	let openCount = 0;
	let markedCount = 0;
	let playing = true;
	const fields = [];
	
	let countFn;
	
	self.startGame = initGame;
	
	function Field(x, y, _fType, _numMines) {
		const me = this;
		this.fType = _fType;
		this.numMines = _numMines;
		this.open = false;
		
		this.createNode = createNode;
		this.click = doClick;
		this.reveal = reveal;
		this.feed = feed;
		
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
		if(++openCount === fieldsToOpen) {
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
			countFn(markedCount);
		}
	}

	function fillBoard() {
		const stage = document.getElementById('stage');
		stage.innerHTML = '';
		let i, j;
		for (i = 0; i < rows; i++) {
			const row = document.createElement('DIV');
			row.setAttribute('class', 'row');
			for(j = 0; j < cols; j++) {
				row.appendChild(fields[j][i].createNode());
			}
			stage.appendChild(row);
		}
	}

	function random(max) {
		return Math.floor(Math.random() * max);
	}

	function createMineCoords() {
		const x = random(cols);
		const y = random(rows);
		if(fields[x][y]) {
			return createMineCoords();
		}
		return [x, y];
	}

	function scanNeighbors4(x, y, fn) {
		const startX = x > 0 ? x - 1 : x;
		const endX = x < cols ? x + 1 : x;
		
		const startY = y > 0 ? y - 1 : y;
		const endY = y < rows ? y + 1 : y;
		
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
		for(let i = 0; i < cols; i++) {
			fields[i] = [];
		}
		for(let i = 0; i < numMines; i++) {
			const coords = createMineCoords();
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
		for(i = 0; i < cols; i++) {
			for(j = 0; j < rows; j++) {
				fn(i, j);
			}
		}	
	}

	function initGame() {
		createFields();
		fillBoard();
		playing = true;
		openCount = 0;
		markedCount = 0;
		countMarked(0);
		// show();
	}

	window.addEventListener('load', function() {
		document.getElementById('stage').oncontextmenu = function(evt) {
			return false;
		}
		initGame();
	});

})($ms);
