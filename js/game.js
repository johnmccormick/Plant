var canvasWidth;
var canvasHeight;

var mapWidth;
var mapHeight;

var player = {};

var enemy = {};
var waypoints = [];

var entrance = {};
var exit = {};

var friction = 0.8;

var mainAnimation;

var mouseX, mouseY;
var keys = [];

var tiles = [];

var paddingLeft;
var paddingTop;

var fontSize;

var paused = false;
var editor = false;
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

	mapWidth = (map.cols * map.tsize);
	mapHeight = (map.rows * map.tsize);

	//Sets canvasWidth/Height and padding
	resizeWindow();

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
			} else {
				paused = false;
			}
		}

		if (keys[115]) {
			if (!editor) {
				editor = true;
				canvas3.style.cursor = "crosshair";
			} else {
				editor = false;
				canvas3.style.cursor = "none";
			}
		}

	});

	document.addEventListener('keyup', function(event) {
		keys[event.keyCode] = false;
	});

	window.onresize = function() {
		resizeWindow();
	}

	player.size = 10;

	player.speed = 3;

	player.velX = 0;
	player.velY = 0;

	player.direction = 0;

	player.img = new Image();
	player.img.src = "images/Raiden.png";

	waypoints = [
	[12, 7], [6, 11], [6, 20], [6, 11], [12, 9], [18, 11], [19, 17], [18, 11]
	];

	enemy = [
	{direction: 0, x: 0, y: 0, velX: 0, velY: 0, fov: 90, sightRadius: 150},
	{direction: 0, x: 0, y: 0, velX: 0, velY: 0, fov: 90, sightRadius: 150}
	];

	var w;
	var newWaypoints = waypoints.slice(0);
	for (var i = 0; i < enemy.length; i++) {
		w = Math.floor(Math.random()*newWaypoints.length);

		enemy[i].x = newWaypoints[w][0] * map.tsize;
		enemy[i].y = newWaypoints[w][1] * map.tsize;

		newWaypoints.splice(w, 1);

		enemy[i].waypoint = w + i;

		if (enemy[i].waypoint + 1 == newWaypoints.length) { 
			w = 0;
		} else {
			w++;
		}
	}

	//Define entrance and exit areas
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

	function arrayMin(arr) { return Math.min.apply(Math, arr); };
	function arrayMax(arr) { return Math.max.apply(Math, arr); };

	entrance.x1 = arrayMin(entrance.xtiles) * map.tsize;
	entrance.y1 = arrayMin(entrance.ytiles) * map.tsize;
	entrance.x2 = (arrayMax(entrance.xtiles) + 1) * map.tsize;
	entrance.y2 = (arrayMax(entrance.ytiles) + 1) * map.tsize;

	exit.x1 = arrayMin(exit.xtiles) * map.tsize;
	exit.y1 = arrayMin(exit.ytiles) * map.tsize;
	exit.x2 = (arrayMax(exit.xtiles) + 1) * map.tsize;
	exit.y2 = (arrayMax(exit.ytiles) + 1) * map.tsize;

	//Set player to center of entrance area
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

	if (!gameOver && !paused) {
		movePlayer();
		moveEnemies();
	}

	drawScene();
	
	drawPoint();

	drawPlayer();

	drawEnemies();
	
	if (detectEnemyCollisions()) {
		writeText("Mission Failed", 50, paddingLeft + (canvasWidth / 75), paddingTop + (canvasHeight / 15), "red", true); 
		gameOver = true;
	}
	if (atExit()) {
		writeText("Mission Accomplished", 50, paddingLeft + (canvasWidth / 75), paddingTop + (canvasHeight / 15), "green", true); 
		gameOver = true;
	}


	mainAnimation = requestAnimationFrame(main);	
	
}


function movePlayer() {

	//Calculate player's angle depending on mouse position
	if (mouseX || mouseY) {
		dx = mouseX - canvasWidth / 2;
		dy = mouseY - canvasHeight / 2;
		player.direction = Math.atan2(dy, dx);
	} 

	var vx = Math.cos(player.direction) * player.speed;
	var vy = Math.sin(player.direction) * player.speed;

	var dx = 0;
	var dy = 0;

	var keypresses = 0;
	var ws = false;
	//Set velocity based on key press
	//W
	if (keys[87]) {
			dx += vx;
			dy += vy;
			ws = true;
			keypresses++;
	}

	//S
	if (keys[83]) {
			dx += -vx;
			dy += -vy;
			ws = true;
			keypresses++;
	}

	//A
	if (keys[65]) {
			dx += vy;
			dy += -vx;
			keypresses++;
	}

	//D
	if (keys[68]) {
		dx += -vy;
		dy += vx;
		keypresses++;
	}

	if (keypresses > 0) {
		//Multiply by friction constant
		player.velX = dx / keypresses;
		player.velY = dy / keypresses;
	}

	//Multiply by friction constant
	player.velX *= friction;
	player.velY *= friction;

	//Add velocity to player position
	player.velX = player.velX;
	player.velY = player.velY;

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

}


function drawScene() {

	//Cuts screen from black border if canvas width is set to be smaller than window size
	context3.fillStyle = "#243147";
	context3.fillRect(0, 0, window.innerWidth, window.innerHeight);
	context3.clearRect(paddingLeft, paddingTop, canvasWidth, canvasHeight);
	

	for (var c = 0; c < map.cols; c++) {
		for (var r = 0; r < map.rows; r++) {

			var tile = map.getTile(c, r);

			var x = (c * map.tsize) - Math.round(player.x) + (canvasWidth / 2);
			var y = (r * map.tsize) - Math.round(player.y) + (canvasHeight / 2);

			if (tile > 1) {		

				context1.drawImage(tiles[tile], x, y);

			} else if (tile > -1) {

				context1.fillStyle = "#FF69B4";
				context1.fillRect(x, y, map.tsize, map.tsize);

			}

		}
	}

	if (paused) { writeText("Paused", 20, (canvasWidth / 2), (canvasHeight / 2), true); }

	if (editor) {
		context2.fillStyle = "grey";
		context2.fillRect(3, 5, 120, 28);
		context2.strokeRect(3, 5, 120, 28);
		writeText("Grid view mode", 15, 10, 24, 'black');
	}
}


function drawPoint() {

	var x = mouseX;
	var y = mouseY;

	if (editor) {

		var relativeX = (mouseX - (canvasWidth / 2) + player.x);
		var relativeY = (mouseY - (canvasHeight / 2) + player.y);

		var newX = (Math.round((relativeX) / map.tsize) * map.tsize); 
		x = (newX + (canvasWidth / 2) - player.x);

		var newY = (Math.round((relativeY) / map.tsize) * map.tsize); ;
		y = (newY + (canvasHeight / 2) - player.y);

		var xCoor = (Math.round(relativeX / map.tsize));
		var yCoor = (Math.round(relativeY / map.tsize));

		writeText("( " + xCoor + ", " + yCoor + " )", 10, x, y-10);
		
	}

	context2.fillStyle = "black";
	context3.fillRect(x, y, 5, 5); 

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

				if ((playerLeft < 0) || (playerRight > mapWidth)) {
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

				if ((playerTop < 0) || (playerBottom > mapHeight)) {
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
	context2.rotate(player.direction);
	context2.translate(- (map.tsize / 2),- (map.tsize / 2));
	context2.drawImage(player.img, 0, 0);
	context2.restore();
	
}


function moveEnemies() {
	var w;
	for (var i = 0; i < enemy.length; i++) {

		w = enemy[i].waypoint;

		//Distance from waypoint
		enemy[i].dx = (waypoints[w][0] * map.tsize) - enemy[i].x;
		enemy[i].dy = (waypoints[w][1] * map.tsize) - enemy[i].y;

		if (Math.abs(enemy[i].dx) < 1 && Math.abs(enemy[i].dy) < 1) {
			if (enemy[i].waypoint + 1 == waypoints.length) { 
				enemy[i].waypoint = 0; 
			} else {
				enemy[i].waypoint++;
			}
		}

		var newDirection;
		
		if (enemy[i].dy/enemy[i].dx) {
			newDirection = Math.atan(enemy[i].dy/enemy[i].dx);
		} else {
			newDirection = 0;
		}

		//Enemy speed = 1.5
		enemy[i].velX = Math.cos(newDirection) * 1.5;
		enemy[i].velY = Math.sin(newDirection) * 1.5;

		//Correct angle based on quadrant
		if (enemy[i].dx < 0 || (enemy[i].dx < 0 && enemy[i].dy < 0)) {
			newDirection += toRadians(180);	
		}

		var directionDifference = newDirection - enemy[i].direction;
		if (directionDifference > 0.01) {
			enemy[i].direction += 0.1 * Math.abs(directionDifference);
		} else if (directionDifference < -0.01) {
			enemy[i].direction -= 0.1 * Math.abs(directionDifference);
		}

		if ((enemy[i].dx < 0 && enemy[i].dy > 0) || (enemy[i].dx < 0 && enemy[i].dy < 0)) {
			enemy[i].velX *= -1;
			enemy[i].velY *= -1;
		}

		enemy[i].x += enemy[i].velX;
		enemy[i].y += enemy[i].velY;

	}	
}


function drawEnemies() {
	for (var i = 0; i < enemy.length; i++) {

			var x = enemy[i].x - player.x + (canvasWidth / 2);
			var y = enemy[i].y - player.y + (canvasHeight / 2);

			context2.fillStyle = "#000000";
			context2.beginPath();
			context2.fillRect(x - (player.size / 2), y - (player.size / 2), player.size, player.size); // fill in the pixel at (10,10)
			context2.fill();

			context2.fillStyle = 'rgba(255, 0, 0, 0.7)';
			context2.beginPath();

			context2.moveTo(x, y);
			context2.arc(x, y, 150, enemy[i].direction-toRadians(enemy[i].fov/2), enemy[i].direction+toRadians(enemy[i].fov/2));
			context2.lineTo(x, y);
			context2.fill();
	}	
}


function detectEnemyCollisions() {
	for (var i = 0; i < enemy.length; i++) {

		//FOV vectors
		var fovX1 = Math.cos(enemy[i].direction - toRadians((enemy[i].fov/2))) * enemy[i].sightRadius;
		var fovY1 = Math.sin(enemy[i].direction - toRadians((enemy[i].fov/2))) * enemy[i].sightRadius;
		var fovX2 = Math.cos(enemy[i].direction + toRadians((enemy[i].fov/2))) * enemy[i].sightRadius;
		var fovY2 = Math.sin(enemy[i].direction + toRadians((enemy[i].fov/2))) * enemy[i].sightRadius;


		//Player-enemy vector
		var pVX = player.x - (enemy[i].x);
		var pVY = player.y - (enemy[i].y);

		//Counter Clockwise Normal of FOV vectors = dy, -dx
		//Dot products of each Counter Clockwise Normal and Player-Enemy vector determines  
		//whether player is CW or CCW to FOV vector. Positive value = CCW, Negative = CW.
		//Code below tests whether player is within angle of FOV sector and radius of FOV circle.
		if (((fovY1 * pVX) + (-fovX1 * pVY) < 0) && ((fovY2 * pVX) + (-fovX2 * pVY) > 0)) {
			if (Math.pow(pVX, 2) + Math.pow(pVY, 2) < Math.pow(enemy[i].sightRadius, 2)) {
				return true;
			}	
		}
	}
}

function atExit () {
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

function toDegrees(rad) {
	return rad * 180 / Math.PI
}


function writeText(txt, sze, x, y, colour, outline) {
	context3.font = sze + "px tahoma";
	if (!colour) { colour = "#FFFFFF"; }
	context3.fillStyle = colour;
	context3.fillText(txt, x, y);

	if (outline) { 
		context3.lineWidth = 1;
		context3.strokeStyle = "#000000";
		context3.strokeText(txt, x, y); 
	}

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
