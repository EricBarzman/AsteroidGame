/*
*  Aloha ! Willkomen ! Bienvenu ! Welcome !
*
*  Ce code est écrit par Eric Barzman !
*
*
*/

const canv = document.querySelector('canvas')
const ctx = canv.getContext('2d')

//

const FPS = 30;  //Frames per Second... obviously

const SHIP_SIZE = 30;  //Taille du vaisseau en pixels
const TURN_SPEED = 360; //Vitesse de rotation, en degrés/sec
const THRUST_SPEED = 8;  //Accéleration en pixels/sec
const FRICTION = 0.2; //coefficient de friction du... vide intersidéral ! (0 = rien, 1 = beaucoup)

const SHIP_EXPLODE_DURATION = 0.12
const SHIP_INVISIBILITY_DUR = 2 //en secondes
const SHIP_BLINK_DUR = 0.1

const ASTEROIDS_NUMBER = 3 ; //nombre d'asteroides au début
const ROIDS_SIZE = 100; //taille de départ d'un asteroide
const ROIDS_SPEED = 30; //vitesse max au démarrage, pix/sec
const ROIDS_VERT = 10; //Nombre moyen de vertices sur un astéroide
const ROIDS_JAGGED = 0.3 //rugosité, imperfection d'un asteroid (0 none, 1 max)
const ROIDS_LGE_POINTS = 20 //les points pour avoir détruit un gros asteroide
const ROIDS_MID_POINTS = 50
const ROIDS_SMALL_POINTS = 100

const TEXT_FADE_TIME = 800 // en seconds
const SOUND_ON = true;


//Le Vaisseau
class Ship {
    constructor() {
        this.x = canv.width / 2,
        this.y = canv.height / 2,
        this.r = SHIP_SIZE / 2,  //radius du vaisseau
        this.a = 90 / 180 * Math.PI, //converti en radians
        this.rot = 0,
        this.blinkNum = Math.ceil(SHIP_INVISIBILITY_DUR / SHIP_BLINK_DUR),
        this.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS),
        this.thrusting = false,
        this.thrust = {
            x: 0,
            y: 0
        },
        this.explodeTime = 0,
        this.canShoot = true,
        this.dead = false
    }

    explodeShip() {
        this.explodeTime = Math.ceil(SHIP_EXPLODE_DURATION * FPS);
        //baboom !
        drawExplosion(this.x, this.y, this.r);
        createParticles({
            object : ship,
            color: 'white',
            fades: true,
            nbr: 40,
            speed: 5
        })
        fxExplode.play();
    }

    drawShip(x, y, r, a, colour = "white") {
        ctx.strokeStyle = colour;
        ctx.lineWidth = SHIP_SIZE / 20;
        ctx.beginPath();
        ctx.moveTo(  //proue
            x + 4/3 * r * Math.cos(a),
            y - 4/3 * r * Math.sin(a)
        );
        ctx.lineTo(  //arrière gauche
            x - r * (2/3 * Math.cos(a) + Math.sin(a)),
            y + r * (2/3 * Math.sin(a) - Math.cos(a))
        );
        ctx.lineTo(   //arrière droite
            x - r * (2/3 * Math.cos(a) - Math.sin(a)),
            y + r * (2/3 * Math.sin(a) + Math.cos(a))
        );
        ctx.closePath();
        ctx.fillStyle = "black"
        ctx.fill();
        ctx.stroke();
    }
    
    drawThruster() {
        ctx.fillStyle = "yellow";
        ctx.strokeStyle = "red";
        ctx.lineWidth = SHIP_SIZE / 20;
        ctx.beginPath();
        ctx.moveTo(  //rear gauche
            this.x - this.r * (2/3 * Math.cos(this.a) + 0.5 * Math.sin(this.a)),
            this.y + this.r * (2/3 * Math.sin(this.a) - 0.5 * Math.cos(this.a))
        );
        ctx.lineTo( //rear centre
            this.x - this.r * 6/3 * Math.cos(this.a),
            this.y + this.r * 6/3 * Math.sin(this.a)
        );
        ctx.lineTo(   //rear droite
            this.x - this.r * (2/3 * Math.cos(this.a) - 0.5 * Math.sin(this.a)),
            this.y + this.r * (2/3 * Math.sin(this.a) + 0.5 * Math.cos(this.a))
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    shootLaser() {
        if (this.canShoot && lasers.length < 10) {
            lasers.push({ //depuis la proue du vaisseau
                x: this.x + 4/3 * this.r * Math.cos(this.a),
                y: this.y - 4/3 * this.r * Math.sin(this.a),
                xvel : 500 * Math.cos(this.a) / FPS,
                yvel : -500 * Math.sin(this.a) /FPS,
                dist : 0,   
                explodeTime : 0
            })
            fxLaser.play();
        }
    }
    
}
//piou piou !
function drawLasers() {
    for (const laser of lasers) {
        ctx.fillStyle = "salmon";
        ctx.beginPath();
        ctx.arc(laser.x, laser.y, SHIP_SIZE / 15, 0, Math.PI * 2, false)
        ctx.fill()
    }
}
//boum ! badaboum !
function drawExplosion(x, y, r) {
    ctx.fillStyle = "darkred";
        ctx.beginPath();
        ctx.arc(x, y, r * 1.7, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(x, y, r * 1.5, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(x, y, r * 1.2, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(x, y, r * 0.9, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x, y, r * 0.5, 0, Math.PI * 2, false);
        ctx.fill();
}



//The Belt

class Asteroid {
    constructor(x, y, r) {
        this.lvlMult = 1 + 0.1 * level;
        this.x = x
        this.y = y
        this.vel = {
            x : Math.random() * ROIDS_SPEED * this.lvlMult / FPS *(Math.random() < 0.5 ? 1 : - 1),
            y : Math.random() * ROIDS_SPEED * this.lvlMult / FPS *(Math.random() < 0.5 ? 1 : - 1)
        }
        this.r = r
        this.a = Math.random() * Math.PI * 2,
        this.vert = Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2)
        this.offs = []
        //vertices offset array
        for (let i = 0; i < this.vert; i++) {
            this.offs.push(Math.random() * ROIDS_JAGGED * 2 + 1 - ROIDS_JAGGED)
        }
    }
}

function createAsteroidBelt() {
    roidsTotal = (ASTEROIDS_NUMBER + level) * 7
    roidsLeft = roidsTotal;
    let x, y;
    for (let i = 0; i < ASTEROIDS_NUMBER + level; i++) {
        do {
        x = Math.floor(Math.random() * canv.width)
        y = Math.floor(Math.random() * canv.height)
        } while (distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r);
        asteroids.push(new Asteroid(x, y, ROIDS_SIZE / 2));
    }
};

function destroyAsteroid(index) {
    const x = asteroids[index].x
    const y = asteroids[index].y
    const r = asteroids[index].r

    createParticles({
        object : asteroids[index],
        fades: true,
        nbr: Math.ceil(asteroids[index].r),
        speed: 5
    })

    if (r === Math.ceil(ROIDS_SIZE / 2)) {
        asteroids.splice(index, 1);
        asteroids.push(new Asteroid(x, y, Math.ceil(r / 2)));
        asteroids.push(new Asteroid(x, y, Math.ceil(r / 2)));
        score += ROIDS_LGE_POINTS;
        fxHit.play()
    } 
    else if (r === Math.ceil(ROIDS_SIZE / 4)) {
        asteroids.splice(index, 1);
        asteroids.push(new Asteroid(x, y, Math.ceil(r / 2)));
        asteroids.push(new Asteroid(x, y, Math.ceil(r / 2)));
        score += ROIDS_MID_POINTS;
        fxHit.play();
    } 
    else {
        asteroids.splice(index, 1)
        score += ROIDS_SMALL_POINTS
        fxHit.play();
    }

    if (asteroids.length === 0) {
        level++;
        newLevel();
    }
}

function drawAsteroid() {
    //draw asteroids
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = SHIP_SIZE / 20
    for (const asteroid of asteroids){       
        //draw a path
        ctx.beginPath();
        ctx.moveTo(
            asteroid.x + asteroid.r * asteroid.offs[0] * Math.cos(asteroid.a),
            asteroid.y + asteroid.r * asteroid.offs[0] * Math.sin(asteroid.a)
        );
        //draw the polygon
        for(let j = 0; j < asteroid.vert; j++) {
            ctx.lineTo(
                asteroid.x + asteroid.r * asteroid.offs[j] * Math.cos(asteroid.a + j * Math.PI * 2 / asteroid.vert),
                asteroid.y + asteroid.r * asteroid.offs[j] * Math.sin(asteroid.a + j * Math.PI * 2 / asteroid.vert));
        }
        ctx.closePath();
        ctx.fillStyle = "black"
        ctx.fill();
        ctx.stroke();
    }
}

class Particle {
    constructor({x, y, velocity, radius, color, fades}){
        this.x = x
        this.y = y
        this.velocity = velocity
        this.radius = radius
        this.color = color
        this.opacity = 1
        this.fades = fades
    }

    draw(){
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.closePath()
        ctx.restore()
    }

    update(){
        this.draw()
        this.x += this.velocity.x
        this.y += this.velocity.y
        
        if (this.fades) this.opacity -= 0.01
    }
}



//UTILS

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}
//Oh non !
function gameOver(){
    ship.dead = true;
    level = 0;
    text = "Game Over";
    textAlpha = 1.0;
}

function newLevel() {
    drawSky();
    text = "Level " + (level + 1);
    textAlpha = 1.0;
    createAsteroidBelt();
}

function newGame() {
    if (score > scoreHigh) {
        scoreHigh = score;
    }
    score = 0;
    level = 0;
    lives = 3;
    asteroids = [];
    ship = new Ship();
    newLevel();
    console.log(text);
}

function drawGameText(){
    if (textAlpha >= 0) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255,255,255, " + textAlpha + ")"
        ctx.font = "small-caps " + 38 + "px dejavu sans mono";
        ctx.fillText(text, canv.width / 2, canv.height *0.75);
        textAlpha -= (1.0 / TEXT_FADE_TIME * FPS);
    } else if (ship.dead) newGame();
}

function drawScores(){
    //Score
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white"
    ctx.font = "35px dejavu sans mono";
    ctx.fillText(score, canv.width - SHIP_SIZE *3, SHIP_SIZE);

    //High score
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white"
    ctx.font = "px dejavu sans mono";
    ctx.fillText(`High Score : ${scoreHigh}`, canv.width / 2, SHIP_SIZE);
}

//constructor({x, y, velocity, radius, color, fades}){

function drawSky() {
    for(let i=0; i<100; i++){
        particles.push(new Particle({
            x: Math.random()*canv.width,
            y: Math.random()*canv.height,
            velocity:{
                x: 0,
                y: 0.5
            },
            radius : Math.random()*1.5,
            color: 'white'
        }))
    }
}

function createParticles({object, color, fades, radius, nbr, speed=3}){
    for(let i=0; i<nbr; i++){
        particles.push(new Particle({
            x : object.x,
            y : object.y,
            velocity:{
                x: (Math.random() - 0.5)*speed,
                y: (Math.random() - 0.5)*speed
            },
            radius : Math.random()*3,
            color: color || '#BAA0DE',
            fades : fades
        }))
    }
}


//MUSIC

//Sound effectssssss
class Sound {
    constructor(src, maxStreams = 1, vol = 1.0) {
        this.streamNum = 0;
        this.streams = [];
        for (let i = 0; i < maxStreams; i++) {
            this.streams.push(new Audio(src));
            this.streams[i].volume = vol;
        }
        if (SOUND_ON) {
            this.play = function () {
                this.streamNum = (this.streamNum + 1) % maxStreams;
                this.streams[this.streamNum].play();
            };
        }
        this.stop = function () {
            this.streams[this.streamNum].pause();
            this.streams[this.streamNum].currentTime = 0;
        };
    }
}


const fxLaser = new Sound("./sounds/laser.m4a", 5, 0.05)
const fxExplode = new Sound("./sounds/explode.m4a", 1, 0.4)
const fxHit = new Sound("./sounds/hit.m4a", 5, 0.3)
const thrust = new Sound("./sounds/thrust.m4a", 1, 0.1)

const particles = []

const lasers = [];
let asteroids = []

let score = 0;
let scoreHigh = 1000;

let level = 0;
let ship
let textAlpha = 1.0;
let lives = 3;
let text = "";
let lifeColour = "";

newGame();


//Event handler
document.addEventListener('keydown', (event) => {
    if (ship.dead) return;
    switch(event.key) {
        case 'ArrowLeft':
            ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
            break;
        case 'ArrowRight':
            ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
            break;
        case 'ArrowUp':
            ship.thrusting = true;
            break;
        case ' ':
            ship.shootLaser();
            ship.canShoot = false;
            break;
    }
});

document.addEventListener("keyup", (event) => {
    if (ship.dead) return;
    switch(event.key) {
        case 'ArrowLeft':
            ship.rot = 0;
            break;
        case 'ArrowRight':
            ship.rot = 0;
            break;
        case 'ArrowUp':
            ship.thrusting = false;
            break;
        case ' ':
            ship.canShoot = true;
            break;
    }
} );


setInterval(update, 1000 / FPS)

//The Fabled Game Loop !
function update(){   
    
    let blinkOn = ship.blinkNum % 2 === 0;
    let exploding = ship.explodeTime > 0;

    //draw background
    ctx.fillStyle = "black";
    ctx.fillRect( 0, 0, canv.width, canv.height);
    

    //Le Ciel étoilé
    particles.forEach((particle, i) => {  
        //Respawn the stars (particles as well) within the screen
        if (particle.y - particle.radius >= canv.height) {
            particle.x = Math.random()*canv.width
            particle.y = Math.random()*canv.height
        }
        
        //If they fade, they're gone
        if (particle.opacity <= 0){
            setTimeout(() => {
                particles.splice(i, 1)
            },0)
        } else particle.update()
    })

    //En avant !
    if (ship.thrusting && !ship.dead) {
        ship.thrust.x += THRUST_SPEED * Math.cos(ship.a) / FPS;
        ship.thrust.y -= THRUST_SPEED * Math.sin(ship.a) / FPS;
        thrust.play();

        if (blinkOn && !ship.dead) {
        //draw the thruster !
            ship.drawThruster();
        }        
    } else {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
        thrust.stop();
    }

    //draw triangular ship
    if (!exploding && blinkOn && !ship.dead) {
        ship.drawShip(ship.x, ship.y, ship.r, ship.a);
    }
    if (ship.blinkNum > 0) {
        ship.blinkTime--;           
        if (ship.blinkTime == 0) {
            ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS)
            ship.blinkNum--;
        }
    }

    drawLasers();

    drawGameText();
    
    //Check for Laser-Asteroid collision
    asteroids.forEach((asteroid, index) => {
        lasers.forEach((laser, ind) => {
            if (distBetweenPoints(asteroid.x, asteroid.y, laser.x, laser.y) < asteroid.r) {
                drawExplosion(laser.x, laser.y, asteroid.r - 3)
                lasers.splice(ind, 1);
                destroyAsteroid(index);
            }
        })
    })

    if (!exploding) {
        if (ship.blinkNum == 0 && !ship.dead) {
            //Check for ship - asteroid collision
            asteroids.forEach((asteroid, index) => {
                if (distBetweenPoints(ship.x, ship.y, asteroid.x, asteroid.y) < ship.r + asteroid.r - 2) {
                    if (lives > 0) {
                        ship.explodeShip();
                        destroyAsteroid(index);
                        lives--;
                    }
                    if (lives === 0) {
                        ship.explodeShip();
                        destroyAsteroid(index);
                        //Oh non !
                        gameOver();
                    }
                }
            })
            //rotate ship
            ship.a += ship.rot;
            //move ship
            ship.x += ship.thrust.x;
            ship.y += ship.thrust.y;
        }
    } else {
        ship.explodeTime--;
        if (ship.explodeTime === 0 && !ship.dead) {
            ship = new Ship();
        }
    }   

    //L'espace-temps n'est qu'un torus... un gros beignet géant
    if (ship.x < 0 - ship.r) {
        ship.x = canv.width + ship.r;
    } else if (ship.x > canv.width + ship.r)
        ship.x = 0 - ship.r

    if (ship.y < 0 - ship.r) {
        ship.y = canv.height + ship.r;
    } else if (ship.y > canv.height + ship.r)
        ship.y = 0 - ship.r;

    drawAsteroid()

    //Draw lives
    for (let i = 0; i < lives; i++) {
        lifeColour = exploding && i == lives - 1 ? "red" : "white";
        ship.drawShip( 70 + SHIP_SIZE + i * SHIP_SIZE *1.2, SHIP_SIZE, ship.r, 0.5 * Math.PI, lifeColour)
    }
    
    drawScores();
    
    //Update the Lasers
    lasers.forEach((laser, index) => {
        //check distance ( 0.6 = max )
        if (laser.dist > 0.6 * canv.width) {
            lasers.splice(index, 1)
        }
        //Move laser
        laser.x += laser.xvel;
        laser.y += laser.yvel;

        //calculer distance parcourue
        laser.dist += Math.sqrt(Math.pow(laser.xvel, 2) + Math.pow(laser.yvel, 2))

        if (laser.x < 0)
            laser.x = canv.width
        else if (laser.x > canv.width)
            laser.x = 0
        if (laser.y < 0)
            laser.y = canv.height
        else if (laser.y > canv.height)
            laser.y = 0
    })

    for (const asteroid of asteroids) {
        //move the asteroid
        asteroid.x += asteroid.vel.x
        asteroid.y += asteroid.vel.y
        
        //téléportation d'un côté à l'autre
        if (asteroid.x < 0 - asteroid.r / 2) {
            asteroid.x = canv.width + asteroid.r / 2
        } else if (asteroid.x > canv.width + asteroid.r / 2) {
            asteroid.x = 0 - asteroid.r / 2
        }
        if (asteroid.y < 0 - asteroid.r / 2) {
            asteroid.y = canv.height + asteroid.r / 2
        } else if (asteroid.y > canv.height + asteroid.r / 2) {
            asteroid.y = 0 - asteroid.r / 2
        }
    }
}