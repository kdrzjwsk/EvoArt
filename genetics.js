"use strict";

/* Image, canvas & drawing parameters */
var canvas;
var ctx;
var minRadius;
var maxRadius;
var artwork;
var artworkData;
var pixelCount;
/*var test_canvas;
var test_ctx;*/

/* GA parameters */
var population_size;
var shapes;
var generation_count;
var elitism = true;
var crossover_rate = 0.85;
var mutation_rate = 0.15;
var uniform_rate = 0.5;
var mutation_amount = 0.1;
var injection_chance = 0.05;

/* TESTING */
var iPopulation;
var requestID; //for animation

/* Web App */

function start() {
  /* Get original image parameters */
  artwork = document.getElementById("artwork");
  var artwork_canvas = document.createElement("canvas");
  var artwork_ctx = artwork_canvas.getContext("2d");
  artwork_canvas.width = artwork.width;
  artwork_canvas.height = artwork.height;
  artwork_ctx.drawImage(artwork, 0, 0, artwork.width, artwork.height);
  artworkData = artwork_ctx.getImageData(0, 0, artwork_canvas.width, artwork_canvas.height).data;
  pixelCount = artworkData.length;

  canvas = document.getElementById("replica");
  ctx = canvas.getContext("2d");

  /*test_canvas = document.getElementById("test");
  test_ctx = test_canvas.getContext("2d");*/

  /* Drawing parameters */
  minRadius = 100;
  maxRadius = 300;

  /* GA parameters */
  population_size = 10;
  shapes = 10;
  generation_count = 0;

  /* Animation parameter */
  requestID = undefined;

  iPopulation = new Population(population_size);
  iPopulation.generatePopulation();
  iPopulation.drawFittest();
  console.log(iPopulation);
  iPopulation.getStatistics();

  if (!requestID) {
    // Start evolution animation
    requestID = window.requestAnimationFrame(simulation);
  };

  /*var test = iPopulation.individuals.slice();
  console.log(test);*/

  /*var newPop = new Population(iPopulation.size, test);
  var rws = new RouletteWheelSelection(iPopulation);
  var rws2 = new RouletteWheelSelection(newPop);
  console.log(rws.getParent());
  console.log(rws2.getParent());
  console.log(rws.getParents());
  console.log(rws2.getParents());*/


  /*var test = new Individual();
  var chrom1 = test.chromosome.slice(0);
  console.log("Pierwszy test", chrom1);
  console.log(test.chromosome);
  var chrom2 = customMutation(test.chromosome).slice(0);
  console.log("Test", chrom2);*/
};

function pause() {
  if (requestID) {
    /* Stop evolution animation */
    window.cancelAnimationFrame(requestID);
    requestID = undefined;
    console.log("Generation #" + generation_count);
    iPopulation.getStatistics();
    console.log(iPopulation);
  };
};

function simulation() {
  generation_count++;
  iPopulation = evolvePopulation(iPopulation);
  iPopulation.drawFittest();

  if (generation_count < 2000) {
    requestID = window.requestAnimationFrame(simulation);
    console.log("Generation #" + generation_count);
    iPopulation.getStatistics();
    //console.log(iPopulation);
  } else {
    console.log("Generation #" + generation_count);
    iPopulation.getStatistics();
    console.log(iPopulation);
  };
};

/*** Genetic Algorithm ***/

/* Evolution */

function evolvePopulation(population) {
  var new_individuals = [];
  var rws = new RouletteWheelSelection(population);

  /* Copy the fittest individual */
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
  while(new_individuals.length < population.size) {
    if (Math.random() < crossover_rate) {
      // Perform crossover
      var parents = rws.getParents();
      new_individuals.push(new Individual(parents));
    } else if (Math.random() < injection_chance) {
      // Inject a random individual to the new population with some small probability to maintain diversity
      //console.log("Injection");
      new_individuals.push(new Individual());
    } else {
      // Select an individual from the current population, mutate it and add it to the new individuals
      var child = new Individual(rws.getParent().chromosome);
      new_individuals.push(child);
    };
    // Remove duplicates to maintain population diversity
    new_individuals = removeDuplicates(new_individuals).slice(0);
  };

  /* Create a new population consisting of the new individuals */
  var newPopulation = new Population(population.size, new_individuals);

  return newPopulation;
};

/* Mutation */

function intergenicMutation(chromosome) {
  /* Mutate the chromosome with some probability */
  for (var i = 0; i < chromosome.length; i++) {
    if (Math.random() < mutation_rate) {
      chromosome[i] = new Shape();
    };
  };
  return chromosome;
};

function customMutation(oldChromosome) {
  /* Mutate the chromosome by adjusting some of the values */
  //console.log(oldChromosome);
  var chromosome = oldChromosome.slice(0);
  //console.log("Old", oldChromosome);
  for (var i = 0; i < chromosome.length; i++) {
    var colour = chromosome[i].gene[8].slice(0);
    //console.log("Old colour", colour);
    if (Math.random() < mutation_rate) {
      //console.log("Mutating");
      //console.log("DNA #", i);
      for (var colour_idx = 0; colour_idx < 3; colour_idx++) {
        var index = Math.floor(Math.random() * 8);
        chromosome[i].gene[index] += (Math.random() * mutation_amount * 2) - mutation_amount;
        if (chromosome[i].gene[index] < 0) {
          chromosome[i].gene[index] = 0;
        } else if (chromosome[i].gene[index] > 1) {
          chromosome[i].gene[index] = 1;
        };
        colour[colour_idx] += Math.floor((Math.random() * mutation_amount * 255 * 2) - mutation_amount * 255);
        if (colour[colour_idx] < 0) {
          colour[colour_idx] = 0;
        } else if (colour[colour_idx] > 255) {
          colour[colour_idx] = 255;
        };
      };
      colour[3] += (Math.random() * mutation_amount * 2) - mutation_amount;
      if (colour[3] < 0) {
        colour[3] = 0;
      } else if (colour[3] > 1) {
        colour[3] = 1;
      };
    };
    /*console.log("After mutation");
    console.log("New colour", colour);
    chromosome[i].gene[8] = colour.slice(0);
    colour[3] = 55;
    console.log("Po zmianie colour", colour);
    console.log("Roboczy", chromosome[i].gene[8]);
    console.log(oldChromosome);*/
  };
  //console.log(chromosome);
  return chromosome;
};

/* Selection */

function RouletteWheelSelection(population) {
  /* Create a roulette wheel for a population */
  this.rouletteWheel = [];

  this.getParent = function() {
    var parent;
    while (parent == undefined) {
      var pointer = Math.random();
      for (var i = 0; i < population.size; i++) {
        if (pointer <= this.rouletteWheel[i]) {
          parent = population.individuals[i];
          break;
        };
      };
    };
    return parent;
  };

  this.getParents = function() {
    var parents = [];
    while (parents.length < 2) {
      var pointer = Math.random();
      for (var i = 0; i < population.size; i++) {
        if (pointer <= this.rouletteWheel[i]) {
          if (!parents.includes(population.individuals[i])) {
            parents.push(population.individuals[i]);
            //console.log("Pointer @ " + pointer + " Parent @ " + i);
            break;
          } else {
            pointer = Math.random();
            break;
          };
        };
      };
    };
    //console.log(parents);
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
  //console.log(this.rouletteWheel);
};

/* Maintaining diversity */

function removeDuplicates(individuals) {
  var obj = {};

  for (var i = 0; i < individuals.length; i++) {
    obj[individuals[i]['fitness_score']] = individuals[i];
  };
  //console.log(obj);

  var no_duplicates = [];
  for (var key in obj) {
      no_duplicates.push(obj[key]);
  };
  return no_duplicates;
};

/* Population */

function Population(population_size, new_individuals) {
  this.size = population_size;
  this.individuals = [];
  this.generatePopulation = generatePopulation;
  this.drawFittest = drawFittest;
  this.getFittest = getFittest;
  this.getStatistics = getStatistics;

  if (new_individuals !== undefined && new_individuals.length === population_size) {
    for (var i = 0; i < this.size; i++) {
      this.individuals.push(new_individuals[i]);
    };
  };
};

function generatePopulation() {
  /* Initialise the population by creating a number of new random individuals */

  if (this.individuals === undefined || this.individuals.length === 0) {
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
  var max_fitness_score = Math.max.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  //console.log(max_fitness_score);
  var fittest_individual = this.individuals.find(function(obj) {return obj.fitness_score == max_fitness_score;});
  //console.log(fittest_individual);
  return fittest_individual;
};

function getStatistics() {
  var max_fittness_score = Math.max.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  var min_fittness_score = Math.min.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  console.log("Max: ", max_fittness_score);
  console.log("Min: ", min_fittness_score);

  //average fitness_score
  //average time for improvement
};

function getWorst() {
  var min_fittness_score = Math.min.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  var worst_individual = this.individuals.find(function(obj) {return obj.fitness_score == min_fittness_score;});

  return worst_individual;
};

/* Individual */

function Individual(parents, chromosome) {
  /* An individual of the population is a representation of a collection of shapes
  Its chromosome stores the data about all shapes. Each shape is a gene. */
  this.chromosome = [];
  this.number_of_shapes = shapes;
  this.imgData = [];
  this.draw = draw;
  this.fitness_score = 0;
  this.createImageData = createImageData;
  this.calculateFitness = calculateFitness;

  if (parents && parents.length === 2) {
    // Crossover using uniform crossover method with crossover_rate = 0.5
    for (var i = 0; i < this.number_of_shapes; i++) {
      if (Math.random() <= uniform_rate) {
        this.chromosome.push(parents[0].chromosome[i]);
      } else {
        this.chromosome.push(parents[1].chromosome[i]);
      };
    };

    // Mutate
    this.chromosome = customMutation(this.chromosome).slice(0);

  } else if (chromosome && chromosome.length === this.number_of_shapes) {
    // Create an individual from an array of shapes (chromosome)
      for (var i = 0; i < this.number_of_shapes; i++) {
        this.chromosome.push(chromosome[i]);
      };

    // Mutate
    this.chromosome = customMutation(this.chromosome).slice(0);

  } else {
    // Random generation
    for (var i = 0; i < this.number_of_shapes; i++) {
        this.chromosome.push(new Shape());
    };
  };

  // Calculate the fitness_score of the individual
  this.imgData = this.createImageData();
  this.fitness_score = this.calculateFitness();
  //console.log(this.fitness_score);
};

function draw(context) {
  /* Draw an individual using its chromosome data "#C7D4D8"*/
  //context.fillStyle = "#C7D4D8";
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < this.number_of_shapes; i++) {
    var data = this.chromosome[i].gene;
    context.beginPath();
    context.ellipse(data[0] * canvas.width,
      data[1] * canvas.height,
      data[2] * (maxRadius - minRadius) + minRadius,
      data[3] * (maxRadius - minRadius) + minRadius,
      data[4] * Math.PI,
      data[5] * Math.PI,
      (data[6] + 1) * Math.PI,
      (data[7] >= 0.5));
    context.closePath();
    context.fillStyle = "rgba(" + data[8][0] + ", " + data[8][1] + ", " + data[8][2] + ", " + data[8][3] + ")";
    //context.strokeStyle = data.strokeColour;
    //context.lineWidth = data.width;
    context.fill();
    //context.stroke();
  };
};

function createImageData() {
  var individual_canvas = document.createElement("canvas");
  var individual_ctx = individual_canvas.getContext("2d");
  this.draw(individual_ctx);
  return individual_ctx.getImageData(0, 0, canvas.width, canvas.height).data;
};

function calculateFitness() {
  /* Calcuate the fitness of an individual using Root Mean Square (RMS)*/
  var imgData = this.imgData;
  var sum = 0.0;
  var fitness_value = 0.0;
  if (imgData !== undefined && artworkData !== undefined && imgData.length === artworkData.length) {
    for (var i = 0; i < pixelCount; i++) {
        var difference = artworkData[i] - imgData[i];
        sum += difference * difference;
    };
    var rms = Math.sqrt(sum/pixelCount); //RMS ranges from 0 (identical) to 255 (completely different)
    fitness_value = 1 - (rms/255);
  };

  return fitness_value;
};

/* Shape */

function Shape() {
  this.gene = [];

  this.gene[0] = Math.random(); //x
  this.gene[1] = Math.random(); //y
  this.gene[2] = Math.random(); //radiusX
  this.gene[3] = Math.random(); //radiusY
  this.gene[4] = Math.random(); //startAngle
  this.gene[5]= Math.random(); //endAngle
  this.gene[6] = Math.random(); //rotation
  this.gene[7] = Math.random(); //counter-clockwise
  this.gene[8] = randomRGBA().slice(0); //colour

  /*
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
  this.gene.width = Math.floor(Math.random()*10);*/
};

function randomRGBA() {
  /* Return a random RGBA data */
  var rgba = [];
  rgba.push(Math.floor(Math.random() * 256)); //Red
  rgba.push(Math.floor(Math.random() * 256)); //Green
  rgba.push(Math.floor(Math.random() * 256)); //Blue
  rgba.push(Math.random() * (0.8 - 0.2) + 0.2); //Alpha
  return rgba;
  //return("rgba(" + red + ", " + blue + ", " + green + ", " + opacity + ")");
};
