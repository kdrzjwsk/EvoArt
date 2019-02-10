var canvas;
var ctx;
var minRadius;
var maxRadius;

function start() {
  canvas = document.getElementById("replica");
  ctx = canvas.getContext("2d");
  ctx.globalAlpha = 0.5;

  minRadius = 5;
  maxRadius = 50;

  var myPopulation = new Population(300);
  myPopulation.generate();
  myPopulation.draw();
  /* for (var i = 0; i < size; i++) {
    var x = Math.random()*canvas.width;
    var y = Math.random()*canvas.height;
    var radiusX = Math.random()*(maxRadius - minRadius) + minRadius;
    var radiusY = Math.random()*(maxRadius - minRadius) + minRadius;
    var sAngle = Math.random()*Math.PI; //or 0*Math.PI
    var eAngle = (Math.random()+1)*Math.PI; //or 2*Math.PI for a full circle
    var rotation = Math.random()*Math.PI;
    var counterclockwise = (Math.random() >= 0.5);
    var colour = randomRGB();

    var dna = {x: x, y: y, radiusX: radiusX, radiusY: radiusY, rotation: rotation, startAngle: sAngle, endAngle:eAngle, cc: counterclockwise, colour: colour};
    var individual = new Individual(dna);
    myPopulation.individuals.push(individual);
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, rotation, sAngle, eAngle, counterclockwise);
    ctx.lineWidth = 0.5;
    ctx.fillStyle = colour;
    ctx.fill();
  };*/
};


function randomRGB() {
  var red = Math.floor(Math.random() * 256);
  var blue = Math.floor(Math.random() * 256);
  var green = Math.floor(Math.random() * 256);
  return("rgb(" + red + ", " + blue + ", " + green + ")");
};

function Population (population_size) {
  this.size = population_size;
  this.individuals = [];
  this.generate = generate;
  this.draw = draw;

};

function draw() {
  for (var i = 0; i < this.individuals.length; i++) {
    var dna = this.individuals[i].dna;
    ctx.beginPath();
    ctx.ellipse(dna.x, dna.y, dna.radiusX, dna.radiusY, dna.rotation, dna.startAngle, dna.endAngle, dna.cc);
    ctx.fillStyle = dna.colour;
    ctx.fill();
  }
}

function generate() {
  for (var i = 0; i < this.size; i++) {
    this.individuals.push(new Individual());
  }
}

function Individual (parentA, parentB) {
  this.dna = {};

  if (parentA && parentB) {
    //crossover
  }
  else {
    this.dna.x = Math.random()*canvas.width;
    this.dna.y = Math.random()*canvas.height;
    this.dna.radiusX = Math.random()*(maxRadius - minRadius) + minRadius;
    this.dna.radiusY = Math.random()*(maxRadius - minRadius) + minRadius;
    this.dna.startAngle = Math.random()*Math.PI; //or 0*Math.PI
    this.dna.endAngle = (Math.random()+1)*Math.PI; //or 2*Math.PI for a full circle
    this.dna.rotation = Math.random()*Math.PI;
    this.dna.cc = (Math.random() >= 0.5);
    this.dna.colour = randomRGB();
  }
};
