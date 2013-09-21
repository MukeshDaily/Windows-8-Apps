// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    //canvas variables
    var canvas, context;
    //needs the reference to canvas
    var gameStage;
    var preload;
    // prepareStage function variable to bitmap
    var logoScreenImage, logoScreenBitmap;

    //show main menu or not, will be handled in update fn
    var newGame = true;
    //main game variables
    var player;
    var floorImage, floorBitmap;
    var playerIdleImage, playerIdleBitmap;
    //scaling to fit various devices
    var scaleW = window.innerWidth / 1366;
    var scaleH = window.innerHeight / 768;

    //enemy
    var ghostImage, ghostBitmap;
    var ghosts = [];
    var ghostSpeed = 1.0;
    //timer for new ghost spawn
    var timeToAddNewGhost = 0;
    //what happens when collision
    var isGameOver = false;
    //score
    var scoreText;
    var playerScore = 0;
    //sound
    var BG_SOUND = "sounds/bg.mp3";
    //map
    var mapdata = [];
    var mapWidth = 13;
    var mapHeight = 8;
    var x;
    var mapImage, mapBitmap;
    var maparr = [];
    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };
    //map class
    function mapTile(gfx) {        
        this.setStartPosition = function (j, i) {
            this.positionX = i*100;
            this.positionY = j*100;
        }
        this.mapBitmap = gfx;
    }


    //ghost class
    function Ghost(gfx) {
        this.positionX = Math.random() * 5000 - 2500;
        this.positionY = Math.random() * 3000 - 1500;
        this.setStartPosition = function () {
            if (this.positionX >= 0 && this.positionX <= window.innerWidth) {
                this.positionX = -500;
            }
            if (this.positionY >= 0 && this.positionY <= window.innerHeight) {
                this.positionY = -500;
            }
        }
        this.targetX = 0;
        this.targetY = 0;
        this.move = function (tX, tY) {
            this.targetX = tX;
            this.targetY = tY;
            if (this.targetX > this.positionX) {
                this.positionX += ghostSpeed;
            }
            if (this.targetX < this.positionX) {
                this.positionX -= ghostSpeed;
            }
            if (this.targetY > this.positionY) {
                this.positionY += ghostSpeed;
            }
            if (this.targetY < this.positionY) {
                this.positionY -= ghostSpeed;
            }
        };

        this.isCollision = function (playerX, playerY, playerW, playerH) {
            var centerX = this.positionX + (this.ghostBitmap.image.width * scaleW / 2);
            var centerY = this.positionY + (this.ghostBitmap.image.height * scaleH / 2);
            if ((centerX >= playerX - playerW / 2) && (centerX < playerX + playerW / 2)) {
                if ((centerY >= playerY - playerH / 2) && (centerY < playerY + playerH / 2)) {
                    return true;
                }
            }
            return false;
        }

        this.ghostBitmap = gfx;

    }


    // The player class 
    function Player() {
        this.positionX = window.innerWidth / 2;
        this.positionY = window.innerHeight / 2;
        this.targetX = this.positionX;
        this.targetY = this.positionY;
        this.width = playerIdleBitmap.image.width * scaleW;
        this.height = playerIdleBitmap.image.height * scaleH;
    }
    function initialize() {
    
        //canvas
         canvas = document.getElementById("gameCanvas");
         canvas.width = window.innerWidth;
         canvas.height = window.innerHeight;
         context = canvas.getContext("2d");

         //if user has touched: eventhandler
         canvas.addEventListener("MSPointerUp", pointerUp, false);
         //move player
         canvas.addEventListener("MSPointerMove", pointerMove, false);
         canvas.addEventListener("MSPointerDown", pointerDown, false);

         //error if new is not used
         gameStage =new createjs.Stage(canvas);
         loadContent();

     }
     function pointerUp(event) {
         if (newGame) {
             newGame = false;
         }
         else {
             player.targetX = event.x;
             player.targetY = event.y;
         }
     }
     function pointerMove(event) {
         if (newGame) {
             
         }
         else {
           //  player.targetX = event.x;
             //player.targetY = event.y;
         }

     }
     function pointerDown(event) {
         if (newGame) {

         }
         else {
             player.targetX = event.x;
             player.targetY = event.y;
         }

     }

     function loadContent() {

         //load map
         //map load xml map
         var xmlhttp;         
         if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
             xmlhttp = new XMLHttpRequest();
         }
         else {// code for IE6, IE5
             xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
         }
         xmlhttp.open("GET", "maps/map.xml", false);
         xmlhttp.send();
         var xmlDoc = xmlhttp.responseXML;
         x = xmlDoc.getElementsByTagName("level1");

         //load content
         preload = new createjs.PreloadJS();
         preload.onComplete = prepareStage;
         var manifest = [
             { id: "logoScreen", src: "images/GFX/LogoScreen.png" },
             { id: "floor", src: "images/GFX/floor.png" },
             { id: "ghost", src: "images/GFX/flyingman.gif" },
             { id: "playerIdle", src: "images/GFX/PlayerIdle.png" },
             { id: "mapimg1", src: "images/GFX/mapimg1.png" },
             { id: "mapimg2", src: "images/GFX/mapimg2.png" },
             { id: "gamesound", src: BG_SOUND }
         ];
         preload.loadManifest(manifest);

        
     }
     function playSound(path) {
         var sound = document.createElement("audio");
         sound.src = path;
         sound.autoplay = true;

     }
     function prepareStage() {
         
            logoScreenImage = preload.getResult("logoScreen").result;
            logoScreenBitmap = new createjs.Bitmap(logoScreenImage);

            logoScreenBitmap.scaleX = scaleW;
            logoScreenBitmap.scaleY = scaleH;

         //by default top left corner 0,0
            gameStage.addChild(logoScreenBitmap);
         //floor
            floorImage = preload.getResult("floor").result;
            floorBitmap = new createjs.Bitmap(floorImage);
            floorBitmap.visible = false;
            floorBitmap.scaleX = scaleW;
            floorBitmap.scaleY = scaleH;
            gameStage.addChild(floorBitmap);

         //map data
           
            for (var j = 0; j < mapHeight; j++) {
                mapdata[j] = (x[0].getElementsByTagName("row")[j].childNodes[0].nodeValue);

                for (var i = 0; i < mapWidth; i++) {
                    switch (mapdata[j][i]) {
                        case '#':
                            mapImage = preload.getResult("mapimg1").result;
                            maparr.push(new createjs.Bitmap(mapImage));
                            maparr[maparr.length - 1].scaleX = scaleW;
                            maparr[maparr.length - 1].scaleY = scaleH;
                            maparr[maparr.length - 1].x = i * 100 * scaleW;
                            maparr[maparr.length - 1].y = j * 100 * scaleH;
                            maparr[maparr.length - 1].visible = false;
                            gameStage.addChild(maparr[maparr.length - 1]);
                            
                            /*
                            maparr.push(new mapTile(new createjs.Bitmap(mapImage)));
                            //maparr[maparr.length - 1].setStartPosition(j, i);
                            maparr[maparr.length - 1].positionX = i * 100 + 200;
                            maparr[maparr.length - 1].positionY = j * 100 + 200;
                            maparr[maparr.length - 1].mapBitmap.visible = true;
                            gameStage.addChild(maparr[maparr.length - 1].mapBitmap);
                            */
                            break;
                        case '*':
                            mapImage = preload.getResult("mapimg2").result;
                            maparr.push(new createjs.Bitmap(mapImage));
                            maparr[maparr.length - 1].scaleX = scaleW;
                            maparr[maparr.length - 1].scaleY = scaleH;
                            maparr[maparr.length - 1].x = i * 100 * scaleW;
                            maparr[maparr.length - 1].y = j * 100 * scaleH;
                            maparr[maparr.length - 1].visible = false;
                            gameStage.addChild(maparr[maparr.length - 1]);

                            break;
                        default:
                            break;
                    }
                }
            }



         //idle player playerIdleImage, playerIdleBitmap
            playerIdleImage = preload.getResult("playerIdle").result;
            playerIdleBitmap = new createjs.Bitmap(playerIdleImage);
            playerIdleBitmap.visible = false;
            playerIdleBitmap.scaleX = scaleW;
            playerIdleBitmap.scaleY = scaleH;
            gameStage.addChild(playerIdleBitmap);
         //ghost
            ghostImage = preload.getResult("ghost").result
         //sccoretext
            scoreText = new createjs.Text("Score: " + playerScore, "30px sans-serif", "yellow");
            scoreText.x = canvas.width / 2 - (scoreText.getMeasuredWidth() * scaleW / 2);
            scoreText.scaleX = scaleW;
            scoreText.scaleY = scaleH;
            scoreText.y = 30 * scaleH;
            scoreText.visible = false;
            gameStage.addChild(scoreText);

         //player
            player = new Player();
        
            
         //play sound
            playSound(BG_SOUND);
          //make sure that gameLoop ticks at a good framerate
            createjs.Ticker.setInterval(window.requestAnimationFrame);
            createjs.Ticker.addListener(gameLoop);

          }
     function gameLoop() {
         update();
         draw();
         }
     function update() {
         if (newGame) {
             logoScreenBitmap.visible = true;
             playerIdleBitmap.visible = false;
             floorBitmap.visible = false;
             scoreText.visible = false;
         }
         else {
             if (isGameOver) {
                 isGameOver = false;
                 playerScore = 0;
                 //
                 
                 for (var i = 0; i < ghosts.length; i++) {
                     gameStage.removeChild(ghosts[i].ghostBitmap);
                 }
                 ghosts.length = 0;
                 /*                 
                 gameStage.clear();
                 gameStage.addChild(logoScreenBitmap);
                 gameStage.addChild(floorBitmap);
                 gameStage.addChild(playerIdleBitmap);
                 gameStage.addChild(scoreText);
                 */
                 gameStage.update();
             }
             logoScreenBitmap.visible = false;
             playerIdleBitmap.visible = true;
             floorBitmap.visible = true;
             scoreText.visible = true;
             for (var j = 0; j < maparr.length; j++) {
                 maparr[j].visible = true;
             }
         
             if (player.targetX > player.positionX) {
                 player.positionX += 3;
             }
             if (player.targetX < player.positionX) {
                 player.positionX -= 3;
             }
             if (player.targetY > player.positionY) {
                 player.positionY += 3;
             }
             if (player.targetY < player.positionY) {
                 player.positionY -= 3;
             }

             timeToAddNewGhost -= 1;
             if (timeToAddNewGhost < 0) {
                 timeToAddNewGhost = 1000
                 ghosts.push(new Ghost(new createjs.Bitmap(ghostImage)));
                 ghosts[ghosts.length - 1].setStartPosition();
                 gameStage.addChild(ghosts[ghosts.length - 1].ghostBitmap);
             }
             for (var i = 0; i < ghosts.length; i++) {
                 ghosts[i].ghostBitmap.x = ghosts[i].positionX;
                 ghosts[i].ghostBitmap.y = ghosts[i].positionY;
                 ghosts[i].ghostBitmap.visible = true;
                 ghosts[i].move(player.positionX, player.positionY);
                 isGameOver = ghosts[i].isCollision(player.positionX, player.positionY, player.width, player.height);
                 if (isGameOver) { break; }
             }

             playerIdleBitmap.x = player.positionX - (player.width / 2);
             playerIdleBitmap.y = player.positionY - (player.height / 2);

             //update score: longer stay more score
             playerScore += 1;
             scoreText.text = ("Score: " + playerScore);

         }


         }
     function draw() {
         gameStage.update();
         
     }
 
    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };
    //initialize, once the content is loaded it will call initialize function
    document.addEventListener("DOMContentLoaded", initialize, false);
    
    app.start();
})();
