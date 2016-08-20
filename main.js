var vec2 = makevec(2);

var player;
var canvas;
var tileSize = new vec2(64, 64); 

var objs = [];

var GameObj = makeClass({
	init : function(args) {
		this.pos = new vec2(0,0);
		if (map) map.objs.push(this);
		if (args) {
			if (args.pos) this.pos.set(args.pos);
		}
	}
});

var HeroObj = makeClass({
	parent : GameObj,
});

function draw() {
	var ctx = canvas.getContext('2d');
	if (!player) return;

	view.center.set(player.pos);

	ctx.fillRect(0,0,canvas.width,canvas.height);
	
	var widthInTiles = Math.floor(canvas.width / tileSize.x);
	var heightInTiles = Math.floor(canvas.height / tileSize.y);
	view.bbox.min.x = Math.ceil(view.center.x - widthInTiles / 2);
	view.bbox.min.y = Math.ceil(view.center.y - heightInTiles / 2);
	if (!map.wrap) {
		if (view.bbox.min.x + widthInTiles >= map.size.x) view.bbox.min.x = map.size.x - widthInTiles;
		if (view.bbox.min.y + heightInTiles >= map.size.y) view.bbox.min.y = map.size.y - heightInTiles;
		if (view.bbox.min.x < 0) view.bbox.min.x = 0;
		if (view.bbox.min.y < 0) view.bbox.min.y = 0;
	}
	view.bbox.max.x = view.bbox.min.x + widthInTiles;
	view.bbox.max.y = view.bbox.min.y + heightInTiles;
	if (!map.wrap) {
		if (view.bbox.max.x >= map.size.x) view.bbox.max.x = map.size.x-1;
		if (view.bbox.max.y >= map.size.y) view.bbox.max.y = map.size.y-1;
	}
	var x, y, rx, ry;
	//draw tiles first
	for (y = view.bbox.min.y, ry = 0; y <= view.bbox.max.y; y++, ry++) {
		for (x = view.bbox.min.x, rx = 0; x <= view.bbox.max.x; x++, rx++) {
			var tile = map.getTile(x,y);
			
			ctx.drawImage(tile.img, rx * tileSize.x, ry * tileSize.y, tileSize.x, tileSize.y);
			
			if ('objs' in tile) {
				for (var i = 0; i < tile.objs.length; i++) {
					var obj = tile.objs[i];
					if ('draw' in obj) obj.draw(ctx);
				}
			}
		}
	}


}

function update() {
	draw();
}

var baseRatio = 64/2000;	//2000 resolution, 64 tilesize
function onresize() {
	canvas.width = $(window).width();
	canvas.height = $(window).height() - 50;
	tileSize.x = tileSize.y = Math.ceil(canvas.width*baseRatio);
	//fontSize = Math.ceil(canvas.width*64/2000);
	draw();
}

function defaultKeyCallback(key, event) {
	switch (key) {
	case 'ok':
		doMenu();
		return false;
	case 'left': player.move(-1, 0); return true;	//left
	case 'up': player.move(0, -1); return true; //up
	case 'right': player.move(1, 0); return true; //right
	case 'down': player.move(0, 1); return true; //down
	}
	return true;
}

function handleCommand(key, event) {
	if (!keyCallback) keyCallback = defaultKeyCallback;
	if (keyCallback == defaultKeyCallback && clientPromptStack.length) keyCallback = promptKeyCallback;
	if (keyCallback(key, event)) {
		update();
	} else {
		draw();
	}
}


//0 = button mash + repeat key
//1 = button mash, but no repeat keys
//2 = no button mash, no repeat keys 
var keyIntervalMethod = 0;

var keyDownInterval;
var lastKeyEvent;
function keyEventHandler(event) {
	event.preventDefault();
	lastKeyEvent = event;
	if (event.type == 'keydown') {
		if (keyIntervalMethod == 0) {
			handleKeyEvent(lastKeyEvent);
		} else {
			if (keyDownInterval !== undefined) {
				if (keyIntervalMethod == 1) {
					//method 1: repeat keys = repeat events
					clearInterval(keyDownInterval);
				} else if (keyIntervalMethod == 2) {
					//method 2: delay
					return;
				}
			}
			handleKeyEvent(lastKeyEvent);
			keyDownInterval = setInterval(function() {
				handleKeyEvent(lastKeyEvent);
			}, 300);
		}
	} else if (event.type == 'keyup') {
		if (keyIntervalMethod != 0) {
			if (keyDownInterval !== undefined) clearInterval(keyDownInterval);
			keyDownInterval = undefined;
		}
	}
}

$(document).ready(function() {
	canvas = $('<canvas>', {
		css:{
			position:'absolute',
			top:'0px',
			left:'0px'
		}
	})
		.attr('width', 640)
		.attr('height', 480)
		.appendTo(document.body)
		.get(0);

	//scroll past titlebar in mobile devices
	// http://stackoverflow.com/questions/4068559/removing-address-bar-from-browser-to-view-on-android
	//TODO if mobile then set the canvas size to the screen size
	if (navigator.userAgent.match(/Mobile/i)) {
		mobile = true;
		window.scrollTo(0,0); // reset in case prev not scrolled 
		var nPageH = $(document).height(); 
		var nViewH = window.outerHeight; 
		if (nViewH > nPageH) { 
			nViewH /= window.devicePixelRatio;
			$('BODY').css('height',nViewH + 'px'); 
		} 
		window.scrollTo(0,1); 
	}

	$(window).resize(onresize);
	onresize();
	
	$(document).keydown(keyEventHandler);
	$(document).keyup(keyEventHandler);
	
	player = new HeroObj();
});
