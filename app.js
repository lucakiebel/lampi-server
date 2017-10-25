const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));


let scoreBoard = [
    {name: "LamPi-Team", time: ""}
];

const LEDs = [
    {c:1,  sn:"6E:D1:5B:63"},
    {c:2,  sn:"2E:5D:64:63"},
    {c:3,  sn:"AE:F0:5E:63"},
    {c:4,  sn:"4E:EA:60:63"},
    {c:5,  sn:"AE:A9:F9:C3"},
    {c:6,  sn:"EE:CB:5A:63"},
    {c:7,  sn:"E:9F:1:C4"},
    {c:8,  sn:"9E:46:5F:63"},
    {c:9,  sn:"EE:25:64:63"},
    {c:10, sn:"AE:1F:61:63"},
    {c:11, sn:"7E:F9:5F:63"},
    {c:12, sn:"CE:FB:59:63"},
    {c:13, sn:"7E:C5:5E:63"},
    {c:14, sn:"7E:B:61:63"},
    {c:15, sn:"2E:84:1:C4"}
];

let reachedLEDs = [];

let currentLED;

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/highScoreList', (req, res) => {
	res.sendFile(__dirname + '/public/highscorelist.html');
});

io.on('connection', (socket) => {

    let device;
	console.log('A new Client connected at ' + socket.handshake.time);

	socket.on("Echo", data => {
	    console.log("Echo received");
	    console.info(data);
	    socket.emit("Echo", data);
    });

	socket.on("device-car", (data) => {
		// code when a car connects to the server
        device = "Car";
		console.log("The Client is a Car");
		socket.join("Car");
	});

	socket.on("device-user", (data) => {
		// code when a user starts a game
        device = "User";
		console.log("The Client is a User");
		console.log("With the Username " + data.name + " and the uid " + data.uid);
		socket.join("User/" + data.name);
		console.info("------- GAME STARTED -------");
		chooseLED();
		console.info("STARTING WITH LED " + currentLED.c);
	});

	socket.on("device-base", data => {
		// code when the base/board is connected
        device = "Base";
		console.log("The Client is the Base");
		socket.join("Base");
	});


	socket.on("device-highscores", data => {
	    device = "Highscorelist";
	    console.log("The Client is a Highscorelist");
	    socket.join("Highscores");
	    updateHighscores();
    });

    /**
	 * Moving Cars
     */

    // Move Car Forwards
    socket.on("control-start-fwd", data => {
        console.log("Move Car");
        socket.to("Car").emit("control-start-fwd", data);
    });

    // Move Car Backwards
    socket.on("control-start-bwd", data => {
        console.log("Move Car");
        socket.to("Car").emit("control-start-bwd", data);
    });

    // Move Car to the right
    socket.on("control-start-right", data => {
        console.log("Move Car");
        socket.to("Car").emit("control-start-right", data);
    });

    // Move Car to the left
    socket.on("control-start-left", data => {
        console.log("Move Car");
        socket.to("Car").emit("control-start-left", data);
    });

    // Stop Car (any direction)
	socket.on("control-stop", data => {
		console.log("Stop Car");
		socket.to("Car").emit("control-stop", data)
	});



    /**
	 * When Car drives over LED
     */

    socket.on("car-over-led", data => {
        console.log(data);
        console.log("Car drove over LED with uid " + data.sn);
		if (data.sn === currentLED.sn) {
			// Car drove over correct LED
			chooseLED();
			console.info("THUS CHANGING LED TO " + currentLED.c)
		}
	});


    /**
	 * Updating Highscore List
     */

    function updateHighscores() {
        socket.to("Highscores").emit("update-scores", {scores: scoreBoard});
    }

    /**
     * Choosing a LED
     */

    function chooseLED() {
        currentLED = LEDs.nextLED(reachedLEDs);
        socket.to("Base").emit("set-led", {led:currentLED});
        reachedLEDs.push(currentLED);
    }


    /**
     * Handling the on_disconnect Event
     */

	socket.on('disconnect', () => {
		console.log(device+" has disconnected from the Server.....");
	});



});



Array.prototype.nextLED = function (b) {
	let a = this[Math.floor(Math.random() * this.length)];
	while (b.includes(a))
		a = this[Math.floor(Math.random() * this.length)];
	return a;
};

http.listen(80, () => {
	console.log('listening on http://localhost:80');
});