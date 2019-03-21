"use strict";

/* Image, canvas & drawing parameters */
var canvas;
var ctx;
var minRadius;
var maxRadius;
var artwork;
var artworkData;
var pixelCount;

/* GA parameters */
var population_size;
var generation_count;
var elitism = true;
var crossover_rate = 0.6;
var mutation_rate = 0.09;
var uniform_rate = 0.5;
var mutation_amount = 0.2;
var injection_chance = 0.01;
var chromosome_length;
var gene_length;

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

  /* Drawing parameters */
  minRadius = 10;
  maxRadius = 100;

  /* GA parameters */
  population_size = 50;
  generation_count = 0;
  chromosome_length = 150; //number of shapes
  gene_length = 12;

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

  if (generation_count < 1000) {
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

function customMutation(old_chromosome) {
  /* Mutate the chromosome by adjusting some of the values and RGB colour*/

  // Copy chromosome
  var new_chromosome = [];
  for (var n = 0; n < old_chromosome
    ; n++) {
    new_chromosome.push(new Shape(old_chromosome[n].gene.slice(0)));
  };

  for (var i = 0; i < new_chromosome.length; i++) {
    if (Math.random() < mutation_rate) {
      //console.log("DNA #", i);

      // Mutate random 3 values from the gene and RGB colours
      for (var idx = 0; idx < 3; idx++) {
        // Mutate gene values from indices 0-8
        var index = Math.floor(Math.random() * 8);
        new_chromosome[i].gene[index] += (Math.random() * mutation_amount * 2) - mutation_amount;

        if (new_chromosome[i].gene[index] < 0) {
          new_chromosome[i].gene[index] = 0;
        } else if (new_chromosome[i].gene[index] > 1) {
          new_chromosome[i].gene[index] = 1;
        };

        // Mutate RGB colour = indices 8-10
        new_chromosome[i].gene[8 + idx] += Math.floor((Math.random() * mutation_amount * 255 * 2) - mutation_amount * 255);
        if (new_chromosome[i].gene[8 + idx] < 0) {
          new_chromosome[i].gene[8 + idx] = 0;
        } else if (new_chromosome[i].gene[8 + idx] > 255) {
          new_chromosome[i].gene[8 + idx] = 255;
        };
      };
    };
  };
  return new_chromosome;
};

function newMutation(old_chromosome) {
  /* Mutate the chromosome by adjusting the alleles */

  // Copy chromosome
  var new_chromosome = [];
  for (var n = 0; n < chromosome_length; n++) {
    new_chromosome.push(new Shape(old_chromosome[n].gene.slice(0)));
  };

  for (var i = 0; i < chromosome_length; i++) {
    if (Math.random() < mutation_rate) {
      for (var idx = 0; idx < gene_length; idx++) {
        // Mutate gene at index
        new_chromosome[i].gene[idx] += (Math.random() * mutation_amount * 2) - mutation_amount;

        if (new_chromosome[i].gene[idx] < 0) {
          new_chromosome[i].gene[idx] = 0;
        } else if (new_chromosome[i].gene[idx] > 1) {
          new_chromosome[i].gene[idx] = 1;
        };
      };
    };
  };
  return new_chromosome;
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
  for (var i = 0; i < population_size; i++) {
    probabilities_of_selection.push(population.individuals[i].fitness_score/total_fitness);
  };

  //Calculate probability intervals for the idividuals
  var sum = 0;
  for (var i = 0; i < population_size; i++) {
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
  // Calculate average fitness score
  var avg_fitness_score = 0;
  for (var i = 0; i < this.size; i++) {
    avg_fitness_score += this.individuals[i].fitness_score;
  };

  avg_fitness_score = avg_fitness_score/this.size;

  //var avg_fitness_score = this.individuals.reduce(function(prev, curr) {return prev.fitness_score + curr.fitness_score}, 0);
  // Find max & min fitness score
  var max_fittness_score = Math.max.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  var min_fittness_score = Math.min.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  console.log("Max: ", max_fittness_score);
  console.log("Min: ", min_fittness_score);
  console.log("Avg: ", avg_fitness_score);
};

/* Individual */

function Individual(parents, chromosome) {
  /* An individual of the population is a representation of a collection of shapes
  Its chromosome stores the data about all shapes. Each shape is a gene. */
  this.chromosome = [];
  this.number_of_shapes = chromosome_length;
  this.imgData = [];
  this.fitness_score = 0;
  this.draw = draw;
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
    this.chromosome = newMutation(this.chromosome).slice(0);

  } else if (chromosome && chromosome.length === this.number_of_shapes) {
    // Create an individual from an array of shapes (chromosome)
      for (var i = 0; i < this.number_of_shapes; i++) {
        this.chromosome.push(chromosome[i]);
      };

    // Mutate
    this.chromosome = newMutation(this.chromosome).slice(0);

  } else {
    // Random generation
    for (var i = 0; i < this.number_of_shapes; i++) {
        this.chromosome.push(new Shape());
    };
  };

  // Calculate the fitness_score of the individual
  this.imgData = this.createImageData();
  this.fitness_score = this.calculateFitness();
};

function draw(context) {
  /* Draw an individual using its chromosome data */
  context.fillStyle = "#C7D4D8";
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
    context.fillStyle = "rgba(" + Math.floor(data[8] * 256) + ", " + Math.floor(data[9] * 256) + ", " + Math.floor(data[10] * 256) + ", " + (data[11] * (0.8 - 0.2) + 0.2) + ")";
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
  //var imgData = this.imgData;
  var sum = 0.0;
  var fitness_value = 0.0;
  if (this.imgData !== undefined && artworkData !== undefined && this.imgData.length === artworkData.length) {
    for (var i = 0; i < pixelCount; i++) {
        var difference = artworkData[i] - this.imgData[i];
        sum += difference * difference;
    };
    var rms = Math.sqrt(sum/pixelCount); //RMS ranges from 0 (identical) to 255 (completely different)
    fitness_value = 1 - (rms/255);
  };

  return fitness_value;
};

/* Shape */

function Shape(gene) {
  this.gene = [];

  if (gene && gene.length === 12) {
    //Copy gene
    for (var i = 0; i < gene_length; i++) {
      this.gene.push(gene[i]);
    };
  } else {
    // Generate a new random gene
    this.gene[0] = Math.random();   //x
    this.gene[1] = Math.random();   //y
    this.gene[2] = Math.random();   //radiusX
    this.gene[3] = Math.random();   //radiusY
    this.gene[4] = Math.random();   //startAngle
    this.gene[5]= Math.random();    //endAngle
    this.gene[6] = Math.random();   //rotation
    this.gene[7] = Math.random();   //counter-clockwise
    this.gene[8] = Math.random()    //red
    this.gene[9] = Math.random();   //green
    this.gene[10] = Math.random();  //blue
    this.gene[11] = Math.random();  //alpha
  };
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
