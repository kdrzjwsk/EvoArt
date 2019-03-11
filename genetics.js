/* Image and canvas parameters */
var canvas;
var ctx;
var minRadius;
var maxRadius;
var artwork;
var artworkData;
var pixelCount;

/* GA parameters */
var population_size;
var shapes;
var generation_count;
var elitism = true;
var crossover_rate = 0.5
var mutation_rate = 0.8;

/* TESTING */
var iPopulation;
var requestID; //for animation

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
  maxRadius = 90;

  population_size = 10;
  shapes = 50;
  generation_count = 0;

  requestID = undefined;
  console.log("Should be undefined: " + requestID);

  iPopulation = new Population(population_size);
  iPopulation.generatePopulation();
  iPopulation.drawFittest();
  console.log(iPopulation);
  if (!requestID) {
    requestID = window.requestAnimationFrame(simulation);
  };

  /*while(generation_count < 10) {
    window.requestAnimationFrame(simulation);
  };*/

  /*window.addEventListener('click', function() {
    setTimeout(simulation(iPopulation), 1000);
  });*/
};

function pause() {
  if (requestID) {
    window.cancelAnimationFrame(requestID);
    requestID = undefined;
  };
};

function simulation() {
  generation_count++;
  console.log("Generation: " + generation_count + " Fittest: " + iPopulation.getFittest().fitness_score);
  iPopulation = evolvePopulation(iPopulation);
  iPopulation.drawFittest();
  console.log(iPopulation);
  if (generation_count < 200) {
    requestID = window.requestAnimationFrame(simulation);
  };
};

function randomRGBA() {
  /* Return a random RGBA data */
  var red = Math.floor(Math.random() * 256);
  var blue = Math.floor(Math.random() * 256);
  var green = Math.floor(Math.random() * 256);
  var opacity = Math.random() * (0.8 - 0.5) + 0.5;
  return("rgba(" + red + ", " + blue + ", " + green + ", " + opacity + ")");
};

function evolvePopulation(population) {
  var new_individuals = []
  var rws = new RouletteWheelSelection(population);

  if (elitism) {
    new_individuals.push(population.getFittest());
  };

  var elitism_offset;
  if (elitism) {
    elitism_offset = 1;
  } else {
    elitism_offset = 0;
  };

  /* Select parents and breed the new individuals of the population */
  for (var i = elitism_offset; i < population.size; i++) {
    var parents = rws.getParents();
    new_individuals.push(new Individual(parents));
  };

  /* Create a new population consisting of the new individuals */
  var newPopulation = new Population(population.size, new_individuals);

  for (var i = 0; i < newPopulation.size; i++) {
    if (Math.random() < mutation_rate) {
      newPopulation.individuals[i].chromosome = mutation(newPopulation.individuals[i].chromosome);
      console.log("Mutation");
    };
  };
  return newPopulation;
};

function RouletteWheelSelection(population) {
  /* Create a roulette wheel for a population */
  this.rouletteWheel = [];
  this.getParents = function() {
    var parents = [];
    for (var n = 0; n < 2; n++) {
      var pointer = Math.random();
      for (var i = 0; i < population.size; i++) {
        if (pointer <= this.rouletteWheel[i]) {
          parents.push(population.individuals[i]);
          break;
        };
      };
    };
    return parents;
  };

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
  var sum = 0;
  for (var i = 0; i < probabilities_of_selection.length; i++) {
    sum += probabilities_of_selection[i];
    this.rouletteWheel.push(sum);
  };
};

function mutation(chromosome) {
  /* Mutate the chromosome with some probability */
  var gene_position = Math.round(Math.random()*shapes);
  //console.log(gene_position);
  //console.log(chromosome[gene_position]);
  chromosome[gene_position] = new Shape();
  //console.log(chromosome[gene_position]);
  return chromosome;
};

function Population (population_size, new_individuals) {
  this.size = population_size;
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
  //console.log("Max: ", max_fittness_score);
  return fittest_individual;
};

function Individual(parents) {
  /* An individual of the population is a representation of a collection of shapes
  Its chromosome stores the data about all shapes. Each shape is a gene. */
  this.chromosome = [];
  this.number_of_shapes = shapes;
  this.imgData;
  this.draw = draw;
  this.fitness_score = 0;
  if (parents && parents.length == 2) {
    // Crossover using uniform crossover method
    for (var i = 0; i < this.number_of_shapes; i++) {
      if (Math.random() <= crossover_rate) {
        this.chromosome.push(parents[0].chromosome[i]);
      } else {
        this.chromosome.push(parents[1].chromosome[i]);
      };
    };
  } else {
    // Random generation
    for (var i = 0; i < this.number_of_shapes; i++) {
        this.chromosome.push(new Shape());
    };
  };
  var individual_canvas = document.createElement("canvas");
  var individual_ctx = individual_canvas.getContext("2d");
  this.draw(individual_ctx);
  this.imgData = individual_ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  this.fitness_score = calculateFitness(this.imgData);
};

function draw(context) {
  /* Draw an individual using its chromosome data */
  context.fillStyle = "#C7D4D8";
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < this.number_of_shapes; i++) {
    var data = this.chromosome[i].gene;
    context.beginPath();
    context.ellipse(data.x, data.y, data.radiusX, data.radiusY, data.rotation, data.startAngle, data.endAngle, data.cc);
    context.closePath();
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
