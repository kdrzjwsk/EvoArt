var canvas;
var ctx;
var minRadius;
var maxRadius;
var artwork;

function start() {
  artwork = document.getElementById("artwork");
  var artwork_canvas = document.createElement("canvas");
  var artwork_ctx = artwork_canvas.getContext("2d");
  artwork_canvas.width = artwork.width;
  artwork_canvas.height = artwork.height;
  artwork_ctx.drawImage(artwork, 0, 0, artwork.width, artwork.height);
  var artworkData = artwork_ctx.getImageData(0, 0, artwork_canvas.width, artwork_canvas.height);
  var pixelCount = artworkData.data.length;
  console.log(artworkData);

  canvas = document.getElementById("replica");
  ctx = canvas.getContext("2d");
  //ctx.globalAlpha = 0.5;
  //ctx.drawImage(artwork, 0, 0, artwork.width, artwork.height);

  minRadius = 10;
  maxRadius = 70;

  var myPopulation = new Population(200);
  myPopulation.generate();
  myPopulation.draw();
  var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  console.log(imgData);
  console.log(fitness(imgData.data, artworkData.data, pixelCount));
};

function randomRGBA() {
  var red = Math.floor(Math.random() * 256);
  var blue = Math.floor(Math.random() * 256);
  var green = Math.floor(Math.random() * 256);
  var opacity = Math.random() * (0.8 - 0.5) + 0.5;
  return("rgba(" + red + ", " + blue + ", " + green + ", " + opacity + ")");
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
    ctx.strokeStyle = dna.strokeColour;
    ctx.lineWidth = dna.width;
    ctx.fill();
    ctx.stroke();
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
    this.dna.colour = randomRGBA();
    this.dna.strokeColour = randomRGBA();
    this.dna.width = Math.floor(Math.random()* 10);
  }
};

function fitness(img_data, art_data, pxlC) {
  //calcuating fitness of an image using Root Mean Square (RMS)
  var sum = 0.0;
  if (img_data.length == art_data.length) {
    for (var i = 0; i < pxlC; i++){
        difference = img_data[i] - art_data[i];
        sum += difference * difference;
    }
  }
  var rms = Math.sqrt(sum/pxlC); //RMS ranges from 0 (identical) to 255 (completely different)
  var fitness_value = 1 - (rms/255);
  /*in order to later maximise the fitness,
  the fitness of identical images will be equal to 1,
  and completely different images 0*/
  return fitness_value;
};
