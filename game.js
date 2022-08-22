var canvas, ctx // canvas and context var type?
var canvasw = 0 // int
var canvash = 0 // int
var loaded = 0 // int
var game = {} // object
var player = {} // object
var attack = {} // oject
var sounds = {} // object
var powerup = {} // object
var balls = [] // array of Ball objects
var backgrounds = [] // array of Image objects
var highscores = [] // array of objects
var levels = [] // array of objects
var adjustForMobile = 1

function checkForMobile() {
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
       return true
    }
    return false
}

window.onload = function() {
    canvas = document.querySelector("#myCanvas");
    ctx = canvas.getContext('2d');
    canvasw = canvas.width;
    canvash = canvas.height;
    if (checkForMobile()) {
        adjustForMobile = 0.5
        canvas.addEventListener('touchstart', touchReaction);
        canvas.addEventListener('touchend', endTouchReaction); 
        canvas.addEventListener('touchcancel', endTouchReaction);  
    } else {
        document.addEventListener('keydown', keyboardReaction);
        document.addEventListener('keyup', endKeyboardReaction);
    }    
    loadSounds();
    gameDataReset();
    levelData();
    loadBGS();
    initPowerup();
    setTimeout(function() {
        highScoreTable();
        startScreen();
        canvas.style.border = '1px solid black';
    }, 500)
}

class Highscore {
    constructor(name, level, score) {
        this.name = name,
        this.level = level,
        this.score = score
    }
}

class Ball {
    constructor(x, y, color, radius, xSpeed, ySpeed) {
        this.x = x,
        this.y = y,
        this.color = color,
        this.radius = radius,
        this.xSpeed = xSpeed,
        this.ySpeed = ySpeed   
    }
    move() {
        this.y += Ball.bounceSpeedCalculation(this.ySpeed) * adjustForMobile;
        this.ySpeed += 2 * adjustForMobile;
        if (this.ySpeed >= 80) {
            this.ySpeed = -79;
        };
        this.x += this.xSpeed * adjustForMobile;
    }
    draw() {
        ctx.save();
        let gradient = ctx.createRadialGradient(this.radius, this.radius, this.radius * 0.1, this.radius *1.5, this.radius *1.5, this.radius*2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.secondColor());
        ctx.translate(this.x, this.y);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.radius, this.radius, this.radius, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.radius, this.radius, this.radius, 0, 2*Math.PI);
        ctx.stroke();
        ctx.restore();
    }
    secondColor() {
        let ogColor = this.color
        if (ogColor == 'red') {
            return '#370000'
        } else if (ogColor == 'green') {
            return '#003700'
        } else if (ogColor == 'blue') {
            return '#000037'
        }
    }
    horizontalCollision() {
        if (this.x + this.radius * 2 > canvasw) {
            this.x = canvasw - this.radius * 2;
            this.xSpeed = -this.xSpeed;
        } else if (this.x < 0) {
            this.x = 0;
            this.xSpeed = -this.xSpeed;
        };
    }
    static bounceSpeedCalculation(degree) {
        let speed = Math.tan(degree * Math.PI / 180) * 12;
        if (speed > 20) {
            speed = speed / 4 + 15
        } else if (speed < -20) {
            speed = speed / 4 - 15
        }
        return speed;
    }
}

// DATA CREATION
function loadSounds() {
    sounds = {
        boop: new Howl({
            urls: ['sounds/boop.mp3']
        }),
        playerHit: new Howl({
            urls: ['sounds/playerHit.mp3']
        }),
        win: new Howl({
            urls: ['sounds/win.mp3']
        }),
        speed: new Howl({
            urls: ['sounds/speed.mp3']
        }),
        points: new Howl({
            urls: ['sounds/points.mp3']
        }),
        shield: new Howl({
            urls: ['sounds/shield.mp3']
        }),

    }
}

function gameDataReset() {
    game = {
        state: false,
        level: 1,
        lives: 3,
        score: 0
    };
}

function playerDataReset() {
    let source = new Image()
    source.src = 'images/sprite.png'
    sprite = {
        source: source, 
        frameWidth: 49,
        frameHeight: 75,
        totalFrames: 4,
        currentFrame: 0,
        delay: 10,
        currentDelay: 0,
        next() {
            this.currentFrame++
            this.currentFrame = this.currentFrame % this.totalFrames
        }
    }
    player = {
        x: canvasw/2,
        y: canvash - 100,
        height: 80,
        width: 35,
        moveRight: false,
        moveLeft: false,
        shield: {
            active: false,
            timer: 400,
            draw() {
                ctx.save();
                ctx.translate(player.x, player.y -10);
                ctx.drawImage(sprite.source, sprite.frameWidth * 4, 0, sprite.frameWidth, sprite.frameHeight, 0, 0, sprite.frameWidth, sprite.frameHeight)
                ctx.restore();      
            }
        },
        speedBoost: {
            active: false,
            timer: 400,
            modifier: 1
        },
        move() {
            if (this.moveLeft === true) {
                this.x -= 10 * player.speedBoost.modifier * adjustForMobile;
                if (sprite.currentDelay > sprite.delay) {
                    sprite.currentDelay = 0;
                    sprite.next()
                }
                sprite.currentDelay++
            }
            if (this.moveRight === true) {
                this.x += 10  * player.speedBoost.modifier * adjustForMobile;
                if (sprite.currentDelay > sprite.delay) {
                    sprite.currentDelay = 0;
                    sprite.next()
                }
                sprite.currentDelay++
            }
            if (this.x > canvasw - this.width) {
                this.x = canvasw - this.width;
            } else if (this.x < 0) {
                this.x = 0;
            };
            if (player.speedBoost.active)     {
                if (player.speedBoost.timer == 0) {
                    player.speedBoost.active = false
                    player.speedBoost.modifier = 1
                }
                player.speedBoost.timer -= 1
            }
        },
        draw(){
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.drawImage(sprite.source, sprite.frameWidth * sprite.currentFrame, 0, sprite.frameWidth, sprite.frameHeight, 0, 0, sprite.frameWidth, sprite.frameHeight)
            ctx.restore();
        }
    };

    attack = {
        x: 0,
        y: canvash - 100,
        height: 0,
        active: false,
        draw() {
            ctx.save();
            ctx.translate(this.x, player.y + player.height);
            ctx.strokeStyle = 'purple';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(0, -this.height );
            ctx.stroke();
            ctx.restore();
        },
        progress() {
            this.height += 15 * adjustForMobile;
            if (this.height >= canvash - 90) {
                this.height = 0;
                this.active = false;
                game.score -= 50
            };
        },
        init() {
            if (this.height == 0) {
                this.x = player.x + (player.width/2),
                this.height = 10;
                this.active = true;
            };
        }
    };   
}

function levelDataReset() {
    balls = [];
    balls = createBalls(levels[game.level - 1]);
}

function createBalls(ballData) {
    for (i = 0; i < ballData.x.length; i++) {
        balls.push(new Ball(ballData.x[i], ballData.y[i], ballData.color[i], ballData.radius[i], ballData.xSpeed[i], ballData.ySpeed));
    };
    return balls;
}

function levelData() {
    levels = [{
        x: [canvasw/2 - 37.5],
        y: [170],
        color: ['red'],
        radius: [75],
        xSpeed: [4],
        ySpeed: 0,
        bg: 2
    },
    {
        x: [canvasw/4 - 18.75 / 2 , canvasw/4 * 2 - 37.5, canvasw/4 * 4 - 18.75 / 2],
        y: [260, 170, 260], 
        color: ['green', 'red', 'green'],
        radius: [18.75, 75, 18.75],
        xSpeed: [-4, 4, 4],
        ySpeed: 0,
        bg: 2    
    },
    {
        x: [canvasw/3 - 37.5, (canvasw/3 * 2 - 37.5)],
        y: [170, 170],
        color: ['red', 'red'],
        radius: [75, 75],
        xSpeed: [-4, 4],
        ySpeed: 0,
        bg: 3
    },
    {
        x: [canvasw/7 - 18.75 / 2 , canvasw/7 * 2 - 18.75 / 2 , canvasw/7 * 3, canvasw/7 * 4 , canvasw/7 * 5 - 18.75 / 2 , canvasw/7 * 6 - 18.75 / 2],
        y: [260, 260, 225, 225, 260, 260], 
        color: ['red', 'red', 'green', 'green', 'blue', 'blue'],
        radius: [18.75, 18.75, 37.5, 37.5, 18.75, 18.75],
        xSpeed: [4, 4, 4, 4, 4, 4],
        ySpeed: 0,
        bg: 3    
    },
    {
        x: [canvasw/5 - 18.75 / 2 , canvasw/5 * 2 - 37.5, canvasw/5 * 3 - 37.5, canvasw/5 * 4 - 18.75 / 2],
        y: [260, 170, 170, 260], 
        color: ['green', 'red', 'red', 'green'],
        radius: [18.75, 75, 75, 18.75],
        xSpeed: [-4, -4, 4, 4],
        ySpeed: 0,
        bg: 1    
    }];
}

function loadBGS() {
    let adresses = ['images/bg1.png', 'images/bg2.png', 'images/bg3.png', 'images/bg4.png']
    adresses.forEach(adress => {
        let img = new Image()
        img.onload = loaded++
        img.src = adress
        backgrounds.push(img)   
    })
}

function highScoreTable() {
    if (!window.localStorage.getItem('highscores')) {
        highscores = [new Highscore('No high scores yet!', 0, 0)]
        window.localStorage.setItem('highscores', JSON.stringify(highscores))
    }
    let table = document.querySelector("#highscores")
    table.innerHTML = "<tr><th scope=\"col\">Name:</th><th scope=\"col\">Level:</th><th scope=\"col\">Score:</th></tr>"
    highscores = JSON.parse(window.localStorage.getItem('highscores'))
    highscores.forEach(score => {
        let row = table.insertRow()
        row.insertCell().innerHTML = score.name
        row.insertCell().innerHTML = score.level
        row.insertCell().innerHTML = score.score
    })
    while (table.rows.length < 11) {
        let row = table.insertRow()
        row.innerHTML = "<td></td><td></td><td></td>"
    }
}

function submitHighscore() {
    let name = document.querySelector("#name").value
    let newHighscore = new Highscore(name, game.level, game.score);
    for (let i = 0; i < highscores.length; i++) {
        if (game.level >= highscores[i].level) {
            if (game.score > highscores[i].score) {
                highscores.splice(i, 0, newHighscore);
                break;
            }
        } 
        if (highscores.length < 10 && i == highscores.length - 1) {
            highscores.push(newHighscore)
            break
        }
    }

    if ((highscores.length > 10) || (highscores[highscores.length - 1].score == 0)) {
        highscores.pop();
    }
    window.localStorage.setItem('highscores', JSON.stringify(highscores))
    document.querySelector("#new-score").style.visibility = 'hidden'
    highScoreTable()
}

function initPowerup() {
    let source = new Image()
    source.src = 'images/powerups.png'
    powerup = {
        name: '',
        active: false,
        taken: false,
        source: source, 
        sound: {},
        width: 80,
        height: 80,
        spriteNum: 0,
        x: 0,
        y: 0,
        action: function() {return},
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.drawImage(this.source, this.width * this.spriteNum, 0, this.width, this.height, 0, 0, this.width, this.height)
            ctx.restore();
        },
        move() {
            if (this.y < canvash - 100) {
                this.y += 4 * adjustForMobile
            } else if (this.y > canvash - 100) {
                this.y = canvash - 100
            }
        }
    }
}

function powerupReset() {
    powerup.active = false
    powerup.taken = false
    powerup.name = ''
    powerup.x = 0
    powerup.y = 0
    powerup.action = function() {return}
}

function choosePowerup() {
    let powerups = [
        {
            name: 'shield',
            spriteNum: 3,
            sound: sounds.shield,
            action() {
                player.shield.active = true
                player.shield.timer = 400
                powerupReset()
            }
        },
        {
            name: 'life',
            spriteNum: 1,
            sound: sounds.points,
            action() {
                game.lives += 1
                powerupReset()
            }
        },
        {
            name: 'points',
            spriteNum: 2,
            sound: sounds.points,
            action() {
                game.score += 1000
                powerupReset()
            }
        },
        {
            name: 'speed',
            spriteNum: 5,
            sound: sounds.speed,
            action() {
                player.speedBoost.active = true
                player.speedBoost.modifier *= 2
                player.speedBoost.timer = 400
                powerupReset()
            }
        },
        // {
        //     name: 'bow',
        //     action() {

        //     }
        // }

    ]
    let chosen = powerups[Math.floor(Math.random() * 4)]
    powerup.name = chosen.name
    powerup.active = true
    powerup.spriteNum = chosen.spriteNum - 1
    powerup.sound = chosen.sound
    powerup.action = chosen.action 
}

// KEYBOARD

function touchReaction(evt) {
    const rect = evt.target.getBoundingClientRect()
    touchEvent = evt.touches[0]
    let location = {x: touchEvent.clientX-rect.left, y: touchEvent.clientY - rect.top}
    // evt.preventDefault();
    if (game.state === false) {
        // Mid Screen
        if ((location.x > 500 && location.x < 1000) && (location.y > 200 && location.y < 600)) {
            console.log('mid screen')
            game.state = true;
        }
    } else {
        if (location.x < 233 && location.y > 540) { // BOTTOM LEFT
            player.moveLeft = true;
        } else if (location.x > canvasw - 233 && location.y > 540) { // BOTTOM RIGHT
            player.moveRight = true;
        } else { // REST OF SCREEN
            attack.init();
        }
        // ESC
        if (evt.keyCode == 27) {
            game.state = false;
            pauseScreen();
        }
    }
}

function endTouchReaction(evt) {
    const rect = evt.target.getBoundingClientRect()
    touchEvent = evt.touches[0]
    // let location = {x: touchEvent.clientX - rect.left, y: touchEvent.clientY - rect.top}
    // evt.preventDefault();
    if (game.state === true) {
        // BOTTOM LEFT
        // if (location.x < 233 && location.y > 540) {
            player.moveLeft = false;
        // };
        // BOTTOM RIGHT
        // if (location.x < canvasw - 233 && location.y > 540) {
            player.moveRight = false;
        // };
    }
}

function keyboardReaction(evt) {
    if (game.state === false) {
        // SPACE
        if (evt.keyCode == 32) {
            evt.preventDefault();
            game.state = true;
        }
    } else {
        // LEFT ARROW
        if (evt.keyCode == 37) {
            player.moveLeft = true;
        };
        // RIGHT ARROW
        if (evt.keyCode == 39) {
            player.moveRight = true;
        };
        // SPACE
        if (evt.keyCode == 32) {
            evt.preventDefault();
            attack.init();
        }
        // ESC
        if (evt.keyCode == 27) {
            game.state = false;
            pauseScreen();
        }
    }
}

function endKeyboardReaction(evt) {
    if (game.state === true) {
        // LEFT ARROW
        if (evt.keyCode == 37) {
            player.moveLeft = false;
        };
        // RIGHT ARROW
        if (evt.keyCode == 39) {
            player.moveRight = false;
        };
    }
}

// SCREENS

function startScreen() {
    ctx.clearRect(0, 0, canvasw, canvash);
    drawBG(0);
    drawText('Bubble Trouble', canvasw/2, 200, '80px Arial', 'green', true, true)
    drawText('Bubble Trouble', canvasw/2, 200, '80px Arial', 'black', false, true)
    if (checkForMobile()) {
        drawText('Press Here To Start', canvasw/2, 400, '50px Garamond', 'black', true, true)
    } else {
        drawText('Press Space To Start', canvasw/2, 400, '50px Garamond', 'black', true, true)
    }
    let timer = setInterval(function() {
        if (game.state === true) {
            gameDataReset();
            clearInterval(timer);
            nextLevelScreen();
        }
    }, 100)
}

function hitScreen() {
    game.state = false
    powerupReset()
    playerDataReset();
    levelDataReset()
    countdownToGame();
}

function pauseScreen() {
    ctx.clearRect(0, 0, canvasw, canvash);
    drawBG(0)
    drawText('Pause', canvasw/2, 200, '80px Arial', 'black', false, true)
    drawText('Press Space To Continue', canvasw/2, 400, '50px Garamond', 'black', true, true)
    let timer = setInterval(function() {
        if (game.state === true) {
            clearInterval(timer);
            gameplay();
        }
    }, 100)    
}

function countdownToGame() {
    let counter = 3;
    let timer = setInterval(function () {
        if (counter == 0) {
            clearInterval(timer);
            game.state = true
            gameplay();
        }
        ctx.clearRect(0, 0, canvasw, canvash);
        drawText('Ouchie!', canvasw/2, 200, '50px Arial', 'black', true, true)
        drawText(counter, canvasw/2, 400, '80px Garamond', 'black', false, true)
        counter -= 1;
    }, 1000)
}

function nextLevelScreen() {
    let counter = 3;
    let timer = setInterval(function () {
        if (counter == 0) {
            powerupReset()
            playerDataReset();
            levelDataReset();
            clearInterval(timer);
            game.state = true
            gameplay();
        }
        ctx.clearRect(0, 0, canvasw, canvash);
        drawBG(levels[game.level - 1].bg)
        drawText('Level ' + game.level, canvasw/2, 200, '80px Arial', 'white', true, true)
        drawText(counter, canvasw/2, 400, '80px Garamond', 'white', true, true)
        drawText('Level ' + game.level, canvasw/2, 200, '80px Arial', 'black', false, true)
        drawText(counter, canvasw/2, 400, '80px Garamond', 'black', false, true)
        counter -= 1;
    }, 1000)
}

function gameOverScreen() {
    let counter = 3;
    let timer = setInterval(function () {
        if (counter == 0) {
            clearInterval(timer);
            startScreen()
            return
        }
        ctx.clearRect(0, 0, canvasw, canvash);
        drawText('Game Over :(', canvasw/2, 300, '80px Arial', 'red', true, true)
        drawText('Game Over :(', canvasw/2, 300, '80px Arial', 'black', false, true)
        if (game.score > highscores[highscores.length - 1].score || highscores.length < 10) {
            drawText('New High Score!', canvasw/2, 450, '80px Arial', 'blue', true, true)
            drawText('New High Score!', canvasw/2, 450, '80px Arial', 'black', false, true)
            document.querySelector("#score").innerHTML = 'Your Score: ' + game.score
            document.querySelector("#new-score").style.visibility = 'visible'
        }
        counter -= 1;
    }, 1000)
}

// DRAWING

function drawText(text, xLocation, yLocation, font, color, filled = true, centered = false) { // string, int, int, string, string, bool, bool
    // text to write, location x , y. OPTIONAL: font option (default '30px arial'), color (deafult 'black'), filled bool (deafult true), centered bool (default false)
    ctx.save();
    font = font || '30px Arial'
    font = 'bold ' + font
    color = color ||'black'
    if (centered) {
        ctx.textAlign = 'center'
    }
    ctx.font = font
    if (filled) {
        ctx.fillStyle = color
        ctx.fillText(text, xLocation, yLocation)        
    } else {
        ctx.strokeStyle = color
        ctx.strokeText(text, xLocation, yLocation)    
    }
    ctx.restore();    
}

function drawTopLine() {
    drawText('Lives: ' + game.lives, canvasw - 200, 40)
    drawText('Score: ' + game.score, 200, 40)
    drawText('Level: ' + game.level, 60, 40)
}

function drawBG(index) {
    ctx.save();
    ctx.drawImage(backgrounds[index], 0, 0, canvasw, canvash)
    ctx.restore();
}


function drawEmptyScreen() {
    drawBG(levels[game.level - 1].bg);
    player.draw();
    drawTopLine();
}

// COLLISION AND HIT

function playerCollision(ball) {
    let xDistance = 0
    if (ball.x + ball.radius > player.x + player.width) {
        xDistance = ball.x + ball.radius - player.x - player.width
    } else if (ball.x + ball.radius < player.x) {
        xDistance = player.x - ball.x - ball.radius
    }
    let yDistance = 0
    if (ball.y + ball. radius < player.y) {
        yDistance = player.y - ball.y - ball.radius
    }
    if (player.shield.active) {
        return false
    }
    return (xDistance * xDistance + yDistance * yDistance <= ball.radius * ball.radius)
}

function attackCollision(ball) {
    let xDistance = 0;
    if (ball.x > attack.x) {
        xDistance = ball.x - attack.x;
    } else if (ball.x + ball.radius * 2 < attack.x) {
        xDistance = attack.x - ball.x - ball.radius * 2;
    };
    let yDistance = 0;
    if (ball.y < attack.y - attack.height) {
        yDistance = Math.abs(ball.y - attack.y + attack.height);
    };
    return (xDistance * xDistance + yDistance * yDistance <= ball.radius * ball.radius)
}

function powerupCollision() {
    let xDistance = 0;
    if (powerup.x > player.x + player.width) {
        xDistance = powerup.x - player.x - player.width;
    } else if (powerup.x + powerup.width < player.x) {
        xDistance = player.x - powerup.x - powerup.width;
    };
    let yDistance = 0
    if (player.y > powerup.y + powerup.height) {
        yDistance = player.y - powerup.y - powerup.height;
    }
    return (xDistance + yDistance <= 0)   
}

function attackHit(ball, index) {
    attack.height = 0;
    attack.active = false;
    if (ball.radius / 2 > 5) {
        game.score += 100
        let newBalls = {
        x: [ball.x + ball.radius / 2, ball.x - ball.radius / 2],
        y: [ball.y + ball.radius * 1.1, ball.y + ball.radius * 1.1],
        color: [ball.color, ball.color],
        radius: [ball.radius/2, ball.radius/2],
        xSpeed: [4, -4],
        ySpeed: -Math.abs(ball.ySpeed)
        }
        createBalls(newBalls);
    } else {
        game.score += 150
    }
    balls.splice(index, 1)
    if (balls.length == 0) {
        sounds.win.play()
        ctx.clearRect(0, 0, canvasw, canvash);
        drawEmptyScreen()
        game.state = false;
        game.level += 1;
        nextLevelScreen();
    }
    let randomNumber = Math.ceil(Math.random() * 100)
    if (randomNumber <= (game.level ** 2) / 2) {
        choosePowerup()
        powerup.y = ball.y + ball.radius * 2
        powerup.x = ball.x + ball.radius - powerup.width / 2

    }
}

function playerHit(index) {
    game.lives -= 1;
    ctx.clearRect(0, 0, canvasw, canvash);
    drawEmptyScreen()
    balls[index].draw();
    drawTopLine();
    if (game.lives > 0) {
        hitScreen();
    }
    if (game.lives == 0) {
        game.state = false;
        gameOverScreen();
    }
}

// GAME

function gameplay() {
    if (game.state === true) {
        ctx.clearRect(0, 0, canvasw, canvash);
        drawBG(levels[game.level - 1].bg);
        if (attack.active === true) {
            attack.draw();
            attack.progress();
        };
        player.move();
        if (player.shield.active) {
            if (player.shield.timer == 0) {
                player.shield.active = false
                player.shield.timer = 400
            }
            if (!((player.shield.timer % 60 > 30) && (player.shield.timer < 145))) {
                player.shield.draw()
            }
            player.shield.timer -= 1
        }
        player.draw();
        if (powerup.active) {
            if (powerup.taken) {
                powerup.action()
            } else {
                powerup.draw()
                if (powerupCollision()) {
                    powerup.sound.play()
                    powerup.taken = true
                }
                powerup.move()
            }
        }
        balls.forEach(function(ball, index) {
            if (game.state === true) {
                ball.draw();
                ball.horizontalCollision();
                if (attack.active === true) {
                    if (attackCollision(ball)) {
                        sounds.boop.play();
                        attackHit(ball, index);
                    };
                };
                if (playerCollision(ball)) {
                    sounds.playerHit.play()
                    playerHit(index);
                }  
                ball.move();
            }
        });
        if (game.state === true) {
            if (game.lives > 0) {
                drawTopLine();
            }
            requestAnimationFrame(gameplay);
    }
    }
}