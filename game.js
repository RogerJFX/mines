/**
 * Controller. Should work in many UI contexts without any clashes. 
 * States of fields are marked by classes.
 * 
 * See ui.js.
 * 
 * Written using Geany Editor.
 */
 
$ms = window.$ms || {};

(function Game(self) {

	const MINE = 1;
	const OTHER = 0;

	let settings;
	let classMap;
	
	let openCount = 0;
	let markedCount = 0;
	let playing = true;
	let fields = [];
	
	let countFn;
	let createNodeUiFn;
	let openFieldUiFn;
	let fillBoardUiFn;
	
	self.startGame = initGame;
	self.notifyLoaded = notifyLoaded;
	
	self.subscribeFlagCount = (fn) => {
		countFn = fn;
	};
	
	self.injectFillBoardUiFn = (fn) => {
		fillBoardUiFn = fn;
	};
	
	self.injectOpenFieldUiFn = (fn) => {
		openFieldUiFn = fn;
	};
	
	self.injectCreateNodeFn = (fn) => {
		createNodeUiFn = fn;
	};
	
	self.injectClassMap = (map) => {
		classMap = map;
	};
	
	self.show = () => { // cheat or debug.
		iterate((i, j) => fields[i][j].show());
	};
	
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
		let marked = 0;
		
		me.show = () => { // cheat or debug.
			if(me.fType !== MINE) {
				openFieldUiFn(myNode, me.numMines);
				myNode.addClass(classMap.openField);
			}
		};

		function handleMarx() {
			if(!playing || me.open) {
				return false; // Hm...
			}
			if(++marked > 2) {
				marked = 0;
			}
			switch(marked) {
				case 0:
					myNode.removeClass(classMap.question)
					break;
				case 1:
					countMarked(1);
					myNode.addClass(classMap.marked)
					break;
				case 2:
				default:
					countMarked(-1);
					myNode.removeClass(classMap.marked)
						.addClass(classMap.question);
			}
		}

		function doClick() {
			if(playing && !me.open && !marked) {
				myNode.removeClass(classMap.marked)
					.addClass(classMap.openField);
				if(me.fType === MINE) {
					myNode.addClass(classMap.boom);
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
			openFieldUiFn(myNode, me.numMines);
			if(me.numMines === 0){
				scanNeighbors4(x, y, function(i, j) {
					if(fields[i] && fields[i][j] && !fields[i][j].open) {
						fields[i][j].click();
					}
				});
			} 
		}
		
		function reveal() {
			if(!myNode.hasClass(classMap.openField)) {
				if(me.fType === OTHER) {
					if(myNode.hasClass(classMap.marked)) {
						myNode.addClass(classMap.wrongMark);
					}
				} else if(!myNode.hasClass(classMap.boom) && !myNode.hasClass(classMap.marked)) {
					myNode.removeClass(classMap.question)
						.addClass(classMap.bomb);
				}
			}
		}
		
		function createNode() {
			const element = createNodeUiFn(
				me.numMines,
				doClick,
				handleMarx
			);
			myNode = element;
			return element;
		}
		
		function feed() {
			myNode.removeClass(classMap.marked)
				.addClass(classMap.openField)
				.addClass(classMap.hamburger);
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

	function countMarked(add) {
		markedCount += add;
		if(countFn) {
			countFn(markedCount, settings.numMines);
		}
	}

	function random(max) {
		return Math.floor(Math.random() * max);
	}

	function createMineCoords(settings) {
		const x = random(settings.cols);
		const y = random(settings.rows);
		if(fields[y][x]) {
			return createMineCoords(settings);
		}
		return [y, x];
	}

	function scanNeighbors4(y, x, fn) {
		const startX = x > 0 ? x - 1 : x;
		const endX = x < settings.cols ? x + 1 : x;
		
		const startY = y > 0 ? y - 1 : y;
		const endY = y < settings.rows ? y + 1 : y;
		
		let i, j;
		for(i = startY; i <= endY; i++) {
			for(j = startX; j <= endX; j++) {
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
		for(let i = 0; i < settings.rows; i++) {
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

	function iterate(fn) {
		let i, j;
		for(i = 0; i < settings.rows; i++) {
			for(j = 0; j < settings.cols; j++) {
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
		fillBoardUiFn(stage, fields);
		playing = true;
		openCount = 0;
		markedCount = 0;
		countMarked(0);
	}
	
	function notifyLoaded(_stage, _settings) {
		stage = _stage;
		initGame(_settings);
	}

})($ms.controller = $ms.controller || {});
