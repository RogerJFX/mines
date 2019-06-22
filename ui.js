/**
 * Ui for HTML. For anything else, define a new class "Element" with all required properties.
 * 
 * Note, there are some typical statements left in index.html.
 * 
 * Written using Geany Editor.
 */

$ms = window.$ms || {};

(function Ui(self) {
	
	Element.prototype.addClass = Element.prototype.addClass || function (clazz) {
		const existing = this.getAttribute('class');
		this.setAttribute('class', existing ? existing + ' ' + clazz : clazz);
		return this;
	};

	Element.prototype.removeClass = Element.prototype.removeClass || function (clazz) {
		this.setAttribute('class', 
			this.getAttribute('class').split(' ').filter(item => item !== clazz).join(' ')
		);
		return this;
	};

	Element.prototype.hasClass = Element.prototype.hasClass || function (clazz) {
		return this.getAttribute('class').split(' ').find(item => item === clazz) === clazz;
	};
	
	const classMap = {
		marked: 'marked',
		question: 'question',
		openField: 'openfield',
		boom: 'boom',
		wrongMark: 'wrongMark',
		hamburger: 'hamburger',
		bomb: 'bomb',
		row: 'row',
		field: 'field',
		color: 'color'
	};
	
	self.classMap = classMap;
	
	self.openField = (element, numMines) => {
		element.innerHTML = numMines === 0 ? '' : numMines;
	};
	
	self.fillBoard = (stage, fields) => {
		stage.innerHTML = '';
		let i, j;
		for (i = 0; i < fields.length; i++) {
			const row = document.createElement('DIV');
			row.addClass(classMap.row);
			for(j = 0; j < fields[i].length; j++) {
				row.appendChild(fields[i][j].createNode());
			}
			stage.appendChild(row);
		}
	};
	
	self.createNode = (numMines, clickFn, rightClickFn) => {
		const element = document.createElement('DIV');
		element.addClass(classMap.field).addClass(classMap.color + numMines);
		element.addEventListener('contextmenu', rightClickFn);
		element.addEventListener('click', clickFn);
		return element;
	};
	
	self.init = (stage) => {
		stage.oncontextmenu = function(evt) {
			return false;
		}
	};
	
})($ms.ui = $ms.ui || {});
