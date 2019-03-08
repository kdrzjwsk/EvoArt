var canvas;
var ctx;
var minRadius;
var maxRadius;
var artwork;
var artworkData;
var pixelCount;
var pop_size;
var num_of_shapes;
var generation_count = 0;
var elitism = false;

function start() {
  artwork = document.getElementById("artwork");
  var artwork_canvas = document.createElement("canvas");
  var artwork_ctx = artwork_canvas.getContext("2d");
  artwork_canvas.width = artwork.width;
  artwork_canvas.height = artwork.height;
  artwork_ctx.drawImage(artwork, 0, 0, artwork.width, artwork.height);
  artworkData = artwork_ctx.getImageData(0, 0, artwork_canvas.width, artwork_canvas.height).data;
  pixelCount = artworkData.length;
  //console.log(artworkData);

  canvas = document.getElementById("replica");
  ctx = canvas.getContext("2d");

  minRadius = 10;
  maxRadius = 70;
  pop_size = 10;
  num_of_shapes = 50;

  var myPopulation = new Population(pop_size);
  myPopulation.generatePopulation();
  myPopulation.drawFittest();
  console.log(myPopulation.individuals);
  console.log(selection(myPopulation));
};

function randomRGBA() {
  /* Return a random RGBA data */
  var red = Math.floor(Math.random() * 256);
  var blue = Math.floor(Math.random() * 256);
  var green = Math.floor(Math.random() * 256);
  var opacity = Math.random() * (0.8 - 0.5) + 0.5;
  return("rgba(" + red + ", " + blue + ", " + green + ", " + opacity + ")");
};

function Population (population_size, new_individuals) {
  this.size = population_size || new_individuals.length;
  this.individuals = new_individuals || [];
  this.generatePopulation = generatePopulation;
  this.drawFittest = drawFittest;
  this.getFittest = getFittest;
};

function generatePopulation() {
  /* Initialise the population by creating a number of new random individuals */

  if (this.individuals === undefined || this.individuals.length == 0) {
    for (var i = 0; i < this.size; i++) {
      this.individuals.push(new Individual());
    };
  };
};

function drawFittest() {
  /* Draw the fittest individual of the population */
  this.getFittest().draw(ctx);
};

function getFittest() {
  /* Return the fittest individual of the population */
  var max_fittness_score = Math.max.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  var fittest_individual = this.individuals.find(function(obj) {return obj.fitness_score == max_fittness_score;});
  console.log("Max: ", max_fittness_score);
  return fittest_individual;
};

function Individual() {
  /* An individual of the population is a representation of a collection of shapes
  Its chromosome stores the data about all shapes. Each shape is a gene. */
  this.chromosome = [];
  this.number_of_shapes = num_of_shapes;
  this.imgData;
  this.draw = draw;
  this.fitness_score = 0;


  for (var i = 0; i < this.number_of_shapes; i++) {
      this.chromosome.push(new Shape());
  }
  var individual_canvas = document.createElement("canvas");
  var individual_ctx = individual_canvas.getContext("2d");
  this.draw(individual_ctx);
  this.imgData = individual_ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  this.fitness_score = calculateFitness(this.imgData);
  //console.log(this.fitness_score);
};

function draw(context) {
  /* Draw an individual using its chromosome data */
  for (var i = 0; i < this.number_of_shapes; i++) {
    var data = this.chromosome[i].gene;
    context.beginPath();
    context.ellipse(data.x, data.y, data.radiusX, data.radiusY, data.rotation, data.startAngle, data.endAngle, data.cc);
    context.fillStyle = data.colour;
    context.strokeStyle = data.strokeColour;
    context.lineWidth = data.width;
    context.fill();
    context.stroke();
  }
};

function calculateFitness(imgData) {
  /* Calcuate the fitness of an individual using Root Mean Square (RMS)*/
  var sum = 0.0;
  var fitness_value = 0.0;
  if (imgData != undefined && artworkData != undefined && imgData.length == artworkData.length) {
    for (var i = 0; i < pixelCount; i++){
        difference = imgData[i] - artworkData[i];
        sum += difference * difference;
    }
    var rms = Math.sqrt(sum/pixelCount); //RMS ranges from 0 (identical) to 255 (completely different)
    fitness_value = 1 - (rms/255);
  }

  return fitness_value;
};

function selection(population) {
  /* Select n (=pop_size) individuals from the population to be parents using Roulette Wheel Selection */
  var parents = [];

  //Find the total fitness of the population
  var total_fitness = 0;
  for (var i = 0; i < population.size; i++) {
    total_fitness += population.individuals[i].fitness_score;
  };

  //Calculate the probability of selection for each individual from the formula prob = fitness_of_individual/total_fitness
  var probabilities_of_selection = [];
  for (var i = 0; i < population.size; i++) {
    probabilities_of_selection.push(population.individuals[i].fitness_score/total_fitness);
  };

  //Calculate probability intervals for the idividuals
  var probability_intervals = [];
  var sum = 0;
  for (var i = 0; i < probabilities_of_selection.length; i++) {
    sum += probabilities_of_selection[i];
    probability_intervals.push(sum);
  };
  //console.log(probability_intervals);

  if (elitism) {
  //Copy the fittest individual & select n - 1 parents for the new generation??
    parents.push(population.getFittest());
    for (var n = 0; n < population.size - 1; n++) {
      var pointer = Math.random();
      for (var i = 0; i < population.size; i++) {
        if (pointer <= probability_intervals[i]) {
          parents.push(population.individuals[i]);
          break;
        };
      };
    };
  } else {
  //Select n parents
    for (var n = 0; n < population.size; n++) {
      var pointer = Math.random();
      for (var i = 0; i < population.size; i++) {
        if (pointer <= probability_intervals[i]) {
          parents.push(population.individuals[i]);
          break;
        };
      };
    };
  };
  return parents;
};

function crossover(population, parents) {
  /* Crossover the selected individuals using the crossover point */
  //return offspring
};

function mutation(offspring) {
  /* Mutate the offspring with some probability */
  //return new Population, generation_count++
};

function Shape () {
  this.gene = {};

  this.gene.x = Math.random()*canvas.width;
  this.gene.y = Math.random()*canvas.height;
  this.gene.radiusX = Math.random()*(maxRadius - minRadius) + minRadius;
  this.gene.radiusY = Math.random()*(maxRadius - minRadius) + minRadius;
  this.gene.startAngle = Math.random()*Math.PI; //or 0*Math.PI
  this.gene.endAngle = (Math.random()+1)*Math.PI; //or 2*Math.PI for a full circle
  this.gene.rotation = Math.random()*Math.PI;
  this.gene.cc = (Math.random() >= 0.5);
  this.gene.colour = randomRGBA();
  this.gene.strokeColour = randomRGBA();
  this.gene.width = Math.floor(Math.random()* 10);
};
