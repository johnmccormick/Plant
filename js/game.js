var context; 		// Canvas context

var height; 		// Canvas height
var width; 		// Canvas width

var canvasWidth;
var canvasHeight;

var player = {};	// Will hold player coords
var enemy = {};

var entrance = {};
var exit = {};

var friction = 0.8;
var speed = 1.5;

var mainAnimation;

var mouseX, mouseY;
var keys = [];

var tiles = [];

var paddingLeft;
var paddingTop;

var fontSize;

var paused = false;
var gameOver = false;

$(document).ready(function() {

	setup();

	if (load()) {
		main();
	}

});

function setup() {
	//Set up canvas, context and width/height
	canvas1 = document.getElementById("canvas1");
	canvas2 = document.getElementById("canvas2");
	canvas3 = document.getElementById("canvas3");

	context1 = canvas1.getContext('2d');
	context2 = canvas2.getContext('2d');
	context3 = canvas3.getContext('2d');

	//Sets canvasWidth/Height and padding
	resizeWindow();

	width = map.cols * map.tsize;

	height = map.rows * map.tsize;

	fontSize = 50;

	//Mouse events
	document.onmousemove = function(event) {	
		mouseX = event.pageX - $('#canvas2').offset().left - paddingLeft;
		mouseY = event.pageY - $('#canvas2').offset().top - paddingTop;
	}

	//Keyboard events
	document.addEventListener('keydown', function(event) {
 		keys[event.keyCode] = true;

 		if (keys[32] && gameOver == false) {
			if (!paused) {
				paused = true;
				window.cancelAnimationFrame(mainAnimation);
				writeText("Paused", 20, 160, 250);
			} else {
				paused = false;
				mainAnimation = window.requestAnimationFrame(main);
			}
		}

	});

	document.addEventListener('keyup', function(event) {
		keys[event.keyCode] = false;
	});

	window.onresize = function() {
		resizeWindow();
	}

	player.size = 10

	player.velX = 0;
	player.velY = 0;

	player.angle = 0;

	player.img = new Image();
	player.img.src = "images/Raiden.png";

	enemy = [
	{x: map.tsize * 6.5, y: (map.tsize * 3), direction: 180, fov: 90, sightRadius: 150, velX: 0, velY: 1.5},
	{x: map.tsize * (map.cols-6.5), y: map. tsize * (map.rows-3), direction: 0, fov: 90, sightRadius: 150, velX: 0, velY: -1.5}
	];


	//define entrance and exit areas
	function arrayMin(arr) { return Math.min.apply(Math, arr); };
	function arrayMax(arr) { return Math.max.apply(Math, arr); };

	entrance.xtiles = [];
	entrance.ytiles = [];
	exit.xtiles = []
	exit.ytiles = []

	for (var c = 0; c < map.cols; c++) {
		for (var r = 0; r < map.rows; r++) {

			var tile = map.getTile(c, r);

			//Entrance
			if (tile == 0) {
				entrance.xtiles.push(c);
				entrance.ytiles.push(r);
			}

			//Exit
			if (tile == 1) {
				exit.xtiles.push(c);
				exit.ytiles.push(r);
			}

		}
	}

	entrance.x1 = arrayMin(entrance.xtiles) * map.tsize;
	entrance.y1 = arrayMin(entrance.ytiles) * map.tsize;
	entrance.x2 = (arrayMax(entrance.xtiles) + 1) * map.tsize;
	entrance.y2 = (arrayMax(entrance.ytiles) + 1) * map.tsize;

	exit.x1 = arrayMin(exit.xtiles) * map.tsize;
	exit.y1 = arrayMin(exit.ytiles) * map.tsize;
	exit.x2 = (arrayMax(exit.xtiles) + 1) * map.tsize;
	exit.y2 = (arrayMax(exit.ytiles) + 1) * map.tsize;


	player.x = (entrance.x1 + (entrance.x2 - entrance.x1) / 2);
	player.y = (entrance.y1 + (entrance.y2 - entrance.y1) / 2);

}

function resizeWindow() {

	canvasWidth = window.innerWidth - $('#canvas2').offset().left;
	canvasHeight = window.innerHeight - $('#canvas2').offset().top;

	canvas1.width = canvasWidth;
	canvas2.width = canvasWidth;
	canvas3.width = window.innerWidth;

	canvas1.height = canvasHeight;
	canvas2.height = canvasHeight;
	canvas3.height = window.innerHeight;

	paddingLeft = ((window.innerWidth/2)-(canvasWidth/2)-$('#canvas2').offset().left);
	paddingTop = ((window.innerHeight/2)-(canvasHeight/2)-$('#canvas2').offset().top);

	canvas1.style.paddingLeft = paddingLeft + "px";
	canvas2.style.paddingLeft = paddingLeft + "px";

	canvas1.style.paddingTop = paddingTop + "px";
	canvas2.style.paddingTop = paddingTop + "px";

}

function load() {
	var tilenames = ["Entrance", "Exit", "Floor", "Wall_T", "Wall_TR", "Wall_R", "Wall_BR", "Wall_B", "Wall_BL", "Wall_L", "Wall_TL", "Wall_BLC", "Wall_TLC", "Wall_TRC", "Wall_BRC"];
	var readyIndex = 0; 

	for (var i = 0; i < tilenames.length; i++) {
		var src = "images/" + tilenames[i] + ".png";

		var imageObject = new Image();
		imageObject.src = src;

		tiles[i] = imageObject;
		tiles[i].onload = readyIndex++;
	}

	if (readyIndex >= tiles.length) {
		return true;
	}

}


function main() {

	context1.clearRect(0, 0, canvasWidth, canvasHeight);
	context2.clearRect(0, 0, canvasWidth, canvasHeight);

	drawScene();

	movePlayer();

	drawPlayer();

	moveEnemies();
	drawEnemies();

	if (detectEnemyCollisions()) {
		gameOverText("MISSION FAILED", "red");
		gameOver = true;
	} else if (atFinish()) {
		gameOverText("MISSION COMPLETE", "green");
		gameOver = true;
	} else {
		mainAnimation = window.requestAnimationFrame(main);	
	}

}

function drawScene() {

	
	context3.fillStyle = "#243147";
	context3.fillRect(0, 0, window.innerWidth, window.innerHeight);
	context3.clearRect(paddingLeft, paddingTop, canvasWidth, canvasHeight);
	

	for (var c = 0; c < map.cols; c++) {
		for (var r = 0; r < map.rows; r++) {

			var tile = map.getTile(c, r);

			var x = (c * map.tsize) - player.x + (canvasWidth / 2);
			var y = (r * map.tsize) - player.y + (canvasHeight / 2);

			if (tile > 1) {		

				context1.drawImage(tiles[tile], x, y);

			} else if (tile > -1) {

				context1.fillStyle = "#FF69B4";
				context1.fillRect(x, y, map.tsize, map.tsize);

			}

		}
	}
}

function movePlayer() {

	//Set velocity based on key press
	if (keys[87]) {
		if (player.velY > -speed) {
			player.velY--;
		}
	}

	if (keys[65]) {
		if (player.velX > -speed) {
			player.velX--;
		}
	}

	if (keys[83]) {
		if (player.velY < speed) {
			player.velY++;
		}
	}

	if (keys[68]) {
		if (player.velX < speed) {
			player.velX++;
		}
	}

	//Multiply by friction constant
	player.velX *= friction;
	player.velY *= friction;

	//Calculate new player coordinate based on velocity
	var newX = player.x + player.velX;
	var newY = player.y + player.velY;

	//If collisions along X-axis, set x velocity to zero
	if (detectWallCollisionsX(newX, player.y)) {
		player.velX = 0;
	}

	//If collisions along Y-axis, set y velocity to zero
	if (detectWallCollisionsY(player.x, newY)) {
		player.velY = 0;
	}
	
	//Add velocity to player position
	player.x += player.velX;
	player.y += player.velY;


	//Calculate player's angle depending on mouse position
	if (mouseX || mouseY) {
		dx = mouseX - canvasWidth / 2;
		dy = mouseY - canvasHeight / 2;
		player.angle = Math.atan2(dy, dx);
	} 

}


function detectWallCollisions(x, y) {
	for (var c = 0; c < map.cols; c++) {
		for (var r = 0; r < map.rows; r++) {

			var tile = map.getTile(c, r);

			if (tile > 2) {
				if (intersects(x, y, c, r)) {
					return true;
				}
			}

		}
	}
}


function intersects(x, y, c, r) {
		var tileSize = map.tsize;
		var tileCenterX = (tileSize * c) + (tileSize / 2);
		var tileCenterY = (tileSize * r) + (tileSize / 2);

	    var playerDistanceX = Math.abs(x - tileCenterX);
	    var playerDistanceY = Math.abs(y - tileCenterY);

	    if (playerDistanceX > (tileSize/2 + player.size)) { return false; }
	    if (playerDistanceY > (tileSize/2 + player.size)) { return false; }

	    if (playerDistanceX <= (tileSize/2)) { return true; } 
	    if (playerDistanceY <= (tileSize/2)) { return true; }

	    var cornerDistance_sq = (playerDistanceX - tileSize/2)^2 +
	                         (playerDistanceY - tileSize/2)^2;

	    return (cornerDistance_sq <= (player.size^2));
}


function detectWallCollisionsX(x, y) {
	for (var c = 0; c < map.cols; c++) {
		for (var r = 0; r < map.rows; r++) {
			
			var tile = map.getTile(c, r);

			if (tile > 2) {
				
				var tileTop = r * map.tsize;
				var tileBottom = (r * map.tsize) + map.tsize;
				var tileLeft = c * map.tsize;			
				var tileRight = (c * map.tsize) + map.tsize;

				var playerTop = y - player.size;
				var playerBottom = y + player.size;
				var playerLeft = x - player.size;
				var playerRight = x + player.size;

				if ((playerLeft < 0) || (playerRight > width)) {
					return true;
				}

				if (((playerLeft < tileRight) && (playerLeft > tileLeft))
					&& (((playerTop < tileBottom) && (playerTop > tileTop)) 
					|| ((playerBottom > tileTop) && (playerBottom < tileBottom)))) {
						return true;
				}

				if (((playerRight > tileLeft) && (playerRight < tileRight))
					&& (((playerTop < tileBottom) && (playerTop > tileTop))
					|| ((playerBottom > tileTop) && (playerBottom < tileBottom)))) {
						return true;
				}

			}
		}
	}
}

function detectWallCollisionsY(x, y) {
	for (var c = 0; c < map.cols; c++) {
		for (var r = 0; r < map.rows; r++) {
			
			var tile = map.getTile(c, r);

			if (tile > 2) {
				
				var tileTop = r * map.tsize;
				var tileBottom = (r * map.tsize) + map.tsize;
				var tileLeft = c * map.tsize;			
				var tileRight = (c * map.tsize) + map.tsize;

				var playerTop = y - player.size;
				var playerBottom = y + player.size;
				var playerLeft = x - player.size;
				var playerRight = x + player.size;

				if ((playerTop < 0) || (playerBottom > height)) {
					return true;
				}

				if (((playerTop < tileBottom) && (playerTop > tileTop)) 
					&& (((playerLeft < tileRight) && (playerLeft > tileLeft))
					|| ((playerRight > tileLeft) && (playerRight < tileRight)))) {	
						return true;
				}

				if (((playerBottom > tileTop) && (playerBottom < tileBottom))
					&& (((playerLeft < tileRight) && (playerLeft > tileLeft))
					|| ((playerRight > tileLeft) && (playerRight < tileRight)))) {
						return true;
				}
			}
		}
	}
}

function drawPlayer() {

	context2.save();
	context2.translate(canvasWidth / 2, canvasHeight / 2);
	context2.rotate(player.angle);
	context2.translate(- (map.tsize / 2),- (map.tsize / 2));
	context2.drawImage(player.img, 0, 0);
	context2.restore();
	
}

function moveEnemies() {
	for (var i = 0; i < enemy.length; i++) {

		if ((enemy[i].y < map.tsize * 3) || (enemy[i].y > map.tsize * (map.rows-3))) { 
			enemy[i].velY *= -1;
		}

		enemy[i].x += enemy[i].velX;
		enemy[i].y += enemy[i].velY;

		if (enemy[i].velY > 0) {
			enemy[i].direction = 90
		} if (enemy[i].velY < 0) {
			enemy[i].direction = 270
		}
	}	
}


function drawEnemies() {
	for (var i = 0; i < enemy.length; i++) {

			var x = enemy[i].x - player.x + (canvasWidth / 2);
			var y = enemy[i].y - player.y + (canvasHeight / 2);

			context2.fillStyle = "#000000";
			context2.beginPath();
			context2.arc(x, y, player.size, 0, 2*Math.PI);
			context2.fill();

			context2.fillStyle = 'rgba(255, 0, 0, 0.7)';
			context2.beginPath();
			var v = ((enemy[i].velY > 0) ? 1 : -1) * player.size;
			context2.moveTo(x, y + v);
			context2.arc(x, y + v, 150, toRadians(enemy[i].direction-enemy[i].fov/2), toRadians(enemy[i].direction+enemy[i].fov/2));
			context2.lineTo(x, y + v);
			context2.fill();
	}	
}


function detectEnemyCollisions() {
	for (var i = 0; i < enemy.length; i++) {
		
		//FOV-Enemy Vector
		//Vector 1 = (fovX, fovY), Vector 2 = (-fovX, fovY)
		var fovX = Math.cos(toRadians(enemy[i].direction - (enemy[i].fov/2))) * enemy[i].sightRadius;
		var fovY = Math.sin(toRadians(enemy[i].direction - (enemy[i].fov/2))) * enemy[i].sightRadius;

		//Player-Enemy Vector
		var v = ((enemy[i].velY > 0) ? 1 : -1) * player.size;
		var pVX = player.x - (enemy[i].x + v);
		var pVY = player.y - (enemy[i].y + v);

		//Counter Clockwise Normal of FOV vectors = dy, -dx == (fovY, -fovX) and (fovY, fovX)
		//Dot products of each Counter Clockwise Normal and Player-Enemy vector determines  
		//whether player is CW or CCW to FOV vector. Positive value = CCW, Negative = CW.
		//Code below tests whether player is within angle of FOV sector and radius of FOV circle.
		if (((fovY * pVX) + (-fovX * pVY) < 0) && ((fovY * pVX) + (fovX * pVY) > 0)) {
			if (Math.pow((player.x - enemy[i].x), 2) + Math.pow((player.y - enemy[i].y), 2) < Math.pow(enemy[i].sightRadius, 2)) {
				return true;
			}	
		}
	}
}


function gameOverText(string, colour) {

	/*
    var a = string.split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }

    var s = a.join("");

	var w = context3.measureText(s).width;
    */

    var w = context3.measureText(string).width;

	writeText(string, fontSize, paddingLeft + (canvasWidth / 2) - w * 2.4, paddingTop + (canvasHeight / 2) + w/10, colour);    

	//writeText(s, fontSize, paddingLeft + (canvasWidth / 2) - w * 2.4, paddingTop + (canvasHeight / 2) + w/10, colour);
	//writeText(s, fontSize, (Math.random() * (canvasWidth)) - w/2, (Math.random() * (canvasHeight)) + w/10, colour);

	//var gameOverTimeout = setTimeout(function(){ gameOverText(string, colour); }, 25);

}


function atFinish () {
		var playerTop = player.y - player.size;
		var playerBottom = player.y + player.size;
		var playerLeft = player.x - player.size;
		var playerRight = player.x + player.size;

		if ((playerRight < exit.x2) && (playerLeft > exit.x1) && (playerBottom < exit.y2 - 5) && (playerTop > exit.y1 + 5)) {
				return true;
		}
}


function toRadians(deg) {
	return deg * Math.PI / 180
}

function writeText(txt, sze, x, y, colour) {
	context3.font = sze + "px tahoma";
	if (!colour) { colour = "#FFFFFF"; }
	context3.fillStyle = colour;
	context3.fillText(txt, x, y);

	context3.lineWidth = 1;
	context3.strokeStyle = "#ffffff";
	context3.strokeText(txt, x, y);
}

var map = {
  cols: 24,
  rows: 25,
  tsize: 32,
  tiles: [
	-1, -1, -1, -1, -1, 10, 3, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 3, 4, -1, -1, -1, -1, -1, 
	-1, -1, -1, -1, 10, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 11, 4, -1, -1, -1, -1, 
	-1, -1, -1, -1, 9, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, -1, -1, -1, -1, 
	-1, -1, -1, -1, 9, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, -1, -1, -1, -1, 
	-1, -1, -1, -1, 9, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, -1, -1, -1, -1, 
	-1, -1, -1, -1, 8, 13, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 12, 6, -1, -1, -1, -1, 
	-1, -1, -1, -1, 10, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 11, 4, -1, -1, -1, -1, 
	-1, -1, -1, -1, 9, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, -1, -1, -1, -1, 
	-1, -1, -1, -1, 9, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, -1, -1, -1, -1, 
	10, 3, 3, 3, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 11, 3, 3, 3, 4,
	9, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5,
	9, 2, 2, 2, 2, 2, 2, 2, 12, 7, 7, 7, 7, 7, 7, 13, 2, 2, 2, 2, 2, 2, 2, 5,
	8, 13, 2, 2, 2, 2, 2, 2, 5, 10, 3, 3, 3, 3, 4, 9, 2, 2, 2, 2, 2, 2, 12, 6,
	10, 14, 2, 2, 2, 2, 2, 2, 5, 9, 12, 13, 12, 13, 5, 9, 2, 2, 2, 2, 2, 2, 11, 4,
	9, 2, 2, 2, 2, 2, 2, 2, 12, 13, 11, 14, 11, 14, 12, 13, 2, 2, 2, 2, 2, 2, 2, 5,
	9, 2, 2, 2, 2, 2, 2, 2, 11, 14, 2, 2, 2, 2, 11, 14, 2, 2, 2, 2, 2, 2, 2, 5,
	9, 2, 2, 2, 2, 2, 2, 2, 12, 13, 2, 2, 2, 2, 12, 13, 2, 2, 2, 2, 2, 2, 2, 5,
	9, 2, 2, 2, 2, 2, 2, 2, 11, 14, 2, 2, 2, 2, 11, 14, 2, 2, 2, 2, 2, 2, 2, 5,
	8, 13, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 12, 6,
	10, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 11, 4,
	0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 12, 13, 12, 13, 5,
	9, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 11, 14, 11, 14, 5,
	9, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5,
	8, 13, 2, 2, 2, 2, 2, 2, 2, 2, 2, 12, 13, 2, 2, 2, 2, 2, 2, 2, 2, 2, 12, 6,
	-1, 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, -1
  ],
  getTile: function(col, row) {
	return this.tiles[row * map.cols + col]
  }
};