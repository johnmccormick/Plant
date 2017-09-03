function enemyCollisionTestData () {
	for (var i = 0; i < enemy.length; i++) {
		
		if (Math.pow((player.x - enemy[i].x), 2) + Math.pow((player.y - enemy[i].y), 2) < Math.pow(enemy[i].sightRadius, 2)) {
			console.log(i + " In Radius");
		}
		
		//FOV-Enemy Vector
		//Vector 1 = (fovX, fovY), Vector 2 = (-fovX, fovY)
		var fovX = Math.cos(toRadians(enemy[i].direction - (enemy[i].fov/2))) * enemy[i].sightRadius;
		var fovY = Math.sin(toRadians(enemy[i].direction - (enemy[i].fov/2))) * enemy[i].sightRadius;

		console.log(i + " fovV1: " + (fovX) + ", " + (fovY));	
		console.log(i + " fovV2: " + (-fovX) + ", " + (fovY));

		//Player-Enemy Vector
		var pVX = player.x - enemy[i].x;
		var pVY = player.y - enemy[i].y;

		console.log(i + " pV: " + pVX + ", " + pVY);

		//Label enemies
		writeText("E" + i, 10, enemy[i].x, enemy[i].y);

		//Draw Vector 1 angles
		context2.fillStyle = "#000000";
		context2.beginPath();
		context2.moveTo(enemy[i].x, enemy[i].y);
		context2.lineTo(enemy[i].x + fovX, enemy[i].y);
		context2.lineTo(enemy[i].x + fovX, enemy[i].y + fovY);
		ontext2.closePath();

		//Draw Vector 2 angles
		context2.lineTo(enemy[i].x - fovX, enemy[i].y);
		context2.lineTo(enemy[i].x - fovX, enemy[i].y + fovY);
		context2.closePath();

		//Vector 1 CCW Normal = dy, -dx
		context2.lineTo(enemy[i].x + fovY, enemy[i].y);
		context2.lineTo(enemy[i].x + fovY, enemy[i].y - fovX);
		context2.closePath();

		//Vector 2 CCW Normal = dy, -dx
		context2.lineTo(enemy[i].x + fovY, enemy[i].y);
		context2.lineTo(enemy[i].x + fovY, enemy[i].y - fovX);
		context2.closePath();
		context2.stroke();

		//Label Vectors
		writeText(i + " V1", 10, enemy[i].x + fovX, enemy[i].y + fovY);
		writeText(i + " V2", 10, enemy[i].x -fovX, enemy[i].y + fovY);

		//Label Vector Normals
		writeText("V1CCWN", 10, enemy[i].x + fovY, enemy[i].y - fovX);
		writeText("V2CCWN", 10, enemy[i].x + fovY, enemy[i].y + fovX);

		// Dot product of V1CCWN.pV: = ((fovY * pVX) + (-fovX * pVY))
		// Dot product of V2CCWN.pV = ((fovX * pVX) + (fovY * pVY))
		console.log(i + " Dot product V1CCWN.pV: " + ((fovY * pVX) + (-fovX * pVY))); /* If negative, CW from V1 */
		console.log(i + " Dot product V2CCWN.pV: " + ((fovY * pVX) + (fovX * pVY))); /* If positive, CCW from V2 */
		// V1 negative and V2 positive = Within sector angle


		if (((fovY * pVX) + (-fovX * pVY) < 0) && ((fovX * pVX) + (fovY * pVY) > 0)) {
			console.log(i + " In sector");
		}

		if (((fovY * pVX) + (-fovX * pVY) < 0) && ((fovX * pVX) + (fovY * pVY) > 0)) {
			if (Math.pow((player.x - enemy[i].x), 2) + Math.pow((player.y - enemy[i].y), 2) < Math.pow(enemy[i].sightRadius, 2)) {
			console.log(i + "In fov");
			}	
		}
	}
}