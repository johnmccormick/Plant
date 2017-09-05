var MissionStatus = function () {
	this.level = 0,

	this.accomplished = function () {
		var s = "Mission Accomplished";
		var w = context3.measureText(s).width;
		writeText(s, fontSize, paddingLeft + (canvasWidth / 2) - w * 2.4, paddingTop + (canvasHeight / 2) - w/5, "red", true); 
		gameOver = true;
	}

	this.gameOver = function () {
		var s = "Mission Failed";
		var w = context3.measureText(s).width;
		writeText(s, fontSize, paddingLeft + (canvasWidth / 2) - w * 2.4, paddingTop + (canvasHeight / 2) - w/5, "red", true); 
		gameOver = true;
	}
};