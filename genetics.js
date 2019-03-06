var canvas;
var ctx;
var minRadius;
var maxRadius;
var artwork;
var artworkData;
var pixelCount;
var pop_size;
var num_of_shapes;

function start() {
  artwork = document.getElementById("artwork");
  var artwork_canvas = document.createElement("canvas");
  var artwork_ctx = artwork_canvas.getContext("2d");
  artwork_canvas.width = artwork.width;
  artwork_canvas.height = artwork.height;
  artwork_ctx.drawImage(artwork, 0, 0, artwork.width, artwork.height);
  artworkData = artwork_ctx.getImageData(0, 0, artwork_canvas.width, artwork_canvas.height);
  pixelCount = artworkData.data.length;
  console.log(artworkData);

  canvas = document.getElementById("replica");
  ctx = canvas.getContext("2d");
  //ctx.globalAlpha = 0.5;
  //ctx.drawImage(artwork, 0, 0, artwork.width, artwork.height);

  minRadius = 10;
  maxRadius = 70;
  pop_size = 10;
  num_of_shapes = 50;

  var myPopulation = new Population(pop_size);
  myPopulation.generate();
  myPopulation.draw_fittest();
  console.log(myPopulation.individuals);
  /*var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  console.log(imgData);
  console.log(fitness(imgData.data, artworkData.data, pixelCount));*/
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
  this.draw_fittest = draw_fittest;
};

function generate() {
  for (var i = 0; i < this.size; i++) {
    this.individuals.push(new Individual());
  }
};

function draw_fittest() {
  var max_fittness_score = Math.max.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  var fittest_individual = this.individuals.find(function(obj) {return obj.fitness_score == max_fittness_score;});
  console.log("Max: ", max_fittness_score);
  fittest_individual.draw(ctx);
};

function Individual (parentA, parentB) {
  //DNA is a collection of shapes
  this.dna = [];
  this.number_of_shapes = num_of_shapes;
  this.imgData;
  this.draw = draw;
  this.fitness_score;

  if (parentA && parentB) {
    //crossover
  } else {
    for (var i = 0; i < this.number_of_shapes; i++) {
      this.dna.push(new Shape());
    }
    var individual_canvas = document.createElement("canvas");
    var individual_ctx = individual_canvas.getContext("2d");
    this.draw(individual_ctx);
    this.imgData = individual_ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.fitness_score = calculate_fitness(this.imgData);
    console.log(this.fitness_score);
  }
};

function draw(context) {
  for (var i = 0; i < this.number_of_shapes; i++) {
    var data = this.dna[i].data;
    context.beginPath();
    context.ellipse(data.x, data.y, data.radiusX, data.radiusY, data.rotation, data.startAngle, data.endAngle, data.cc);
    context.fillStyle = data.colour;
    context.strokeStyle = data.strokeColour;
    context.lineWidth = data.width;
    context.fill();
    context.stroke();
  }
};

function calculate_fitness(imgData) {
  //calcuating fitness of an individual using Root Mean Square (RMS)
  var sum = 0.0;
  var fitness_value = 0.0;
  if (imgData != undefined && artworkData != undefined && imgData.data.length == artworkData.data.length) {
    for (var i = 0; i < pixelCount; i++){
        difference = imgData.data[i] - artworkData.data[i];
        sum += difference * difference;
    }
    var rms = Math.sqrt(sum/pixelCount); //RMS ranges from 0 (identical) to 255 (completely different)
    fitness_value = 1 - (rms/255);
  }
  /*in order to later maximise the fitness,
  the fitness of identical images will be equal to 1,
  and completely different images - 0*/
  return fitness_value;
};

function Shape () {
  this.data = {};

  this.data.x = Math.random()*canvas.width;
  this.data.y = Math.random()*canvas.height;
  this.data.radiusX = Math.random()*(maxRadius - minRadius) + minRadius;
  this.data.radiusY = Math.random()*(maxRadius - minRadius) + minRadius;
  this.data.startAngle = Math.random()*Math.PI; //or 0*Math.PI
  this.data.endAngle = (Math.random()+1)*Math.PI; //or 2*Math.PI for a full circle
  this.data.rotation = Math.random()*Math.PI;
  this.data.cc = (Math.random() >= 0.5);
  this.data.colour = randomRGBA();
  this.data.strokeColour = randomRGBA();
  this.data.width = Math.floor(Math.random()* 10);
};
