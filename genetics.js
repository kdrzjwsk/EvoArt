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
var crossover_rate = 0.8;
var mutation_rate = 0.01;
var uniform_rate = 0.5;
var mutation_amount = 0.1;
var injection_chance = 0.01;
var selection_pressure = 0.15;
var chromosome_length;
var gene_length;

var myPopulation;

/* Animation */
var requestID;

/* Statistics & Analytics */
var max_fitness_score;
var avg_fitness_score;
var min_fitness_score;
var generationCountID;
var maxID;
var avgID;
var minID;
var time;

/* Timing */
var startTime;
var endTime;
var clock_running = false;
var clock_paused = false;
var timeInterval;
var difference;
var updatedTime;
var savedTime;

/* Web App */

function start() {
  generationCountID = document.getElementById("generation");
  maxID = document.getElementById("maxfitness");
  avgID = document.getElementById("avgfitness");
  minID = document.getElementById("minfitness");
  time = document.getElementById("time");

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
  minRadius = 20; //50
  maxRadius = 100; //100?

  /* GA parameters */
  population_size = 50;
  generation_count = 0;
  chromosome_length = 200; //number of shapes
  gene_length = 12;

  /* Animation parameter */
  requestID = undefined;
  resetTimer();

  myPopulation = new Population(population_size);
  myPopulation.generatePopulation();
  myPopulation.drawFittest();
  console.log(myPopulation);
  myPopulation.getStatistics();

  if (!requestID) {
    // Start evolution animation
    startTimer();
    requestID = window.requestAnimationFrame(simulation);
  };

};

function stop() {
  if (requestID) {
    /* Stop evolution animation */
    window.cancelAnimationFrame(requestID);
    requestID = undefined;
    pauseTimer();
  };
};

function startTimer() {
  startTime = new Date().getTime();
  timeInterval = setInterval(showTime, 1000);
};

function pauseTimer(){
  clearInterval(timeInterval);
  savedTime = difference;
  };

function resetTimer(){
  clearInterval(timeInterval);
  savedTime = 0;
  difference = 0;
};

function showTime(){
  updatedTime = new Date().getTime();
  if (savedTime){
    difference = (updatedTime - startTime) + savedTime;
  } else {
    difference =  updatedTime - startTime;
  };
  var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((difference % (1000 * 60)) / 1000);
  var milliseconds = Math.floor((difference % (1000 * 60)) / 100);
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;
  //milliseconds = (milliseconds < 100) ? (milliseconds < 10) ? "00" + milliseconds : "0" + milliseconds : milliseconds;
  time.innerHTML = hours + ':' + minutes + ':' + seconds;
};

function simulation() {
  generation_count++;
  myPopulation = evolvePopulation(myPopulation);
  myPopulation.drawFittest();

  if (myPopulation.getFittest().fitness_score < 1) {
    requestID = window.requestAnimationFrame(simulation);
    myPopulation.getStatistics();
    generationCountID.innerHTML = generation_count;
    maxID.innerHTML = Math.round(max_fitness_score * 100000)/100000;
    avgID.innerHTML = Math.round(avg_fitness_score * 100000)/100000;
    minID.innerHTML = Math.round(min_fitness_score * 100000)/100000;
  } else {
    myPopulation.getStatistics();
    generationCountID.innerHTML = generation_count;
    maxID.innerHTML = Math.round(max_fitness_score * 100000)/100000;
    avgID.innerHTML = Math.round(avg_fitness_score * 100000)/100000;
    minID.innerHTML = Math.round(min_fitness_score * 100000)/100000;
  };
};

/*** Genetic Algorithm ***/

/* Evolution */

function evolvePopulation(population) {
  var new_individuals = [];
  var rws = new RouletteWheelSelection(population);
  var es = new EliteSelection(population);

  /* Copy the fittest individual */
  if (elitism) {
    new_individuals.push(population.getFittest());
  };

  /* var elitism_offset;
  if (elitism) {
    elitism_offset = 1;
  } else {
    elitism_offset = 0;
  };*/

  /* Select parents and breed the new individuals of the population */
  while(new_individuals.length < population.size) {
    if (Math.random() < crossover_rate) {
      // Perform crossover
      var parents = es.getParents();
      //console.log(parents);
      new_individuals.push(new Individual(parents));
    } else if (Math.random() < injection_chance) {
      // Inject a random individual to the new population with some small probability to maintain diversity
      new_individuals.push(new Individual());
    } else {
      // Select an individual from the current population, mutate it and add it to the new individuals
      var child = new Individual(es.getParent());
      new_individuals.push(child);
    };
    // Remove duplicates to maintain population diversity every 50 generations
    if (generation_count % 10 === 0) {
      new_individuals = removeDuplicates(new_individuals);
    };
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

function newMutation(old_chromosome) {
  /* Mutate the chromosome by adjusting the alleles */

  // Copy chromosome
  var new_chromosome = [];
  for (let n = 0; n < chromosome_length; n++) {
    new_chromosome.push(new Shape(old_chromosome[n].gene.slice(0)));
  };

  for (let i = 0; i < chromosome_length; i++) {
    if (Math.random() < mutation_rate) {
      for (let idx = 0; idx < gene_length; idx++) {
        // Mutate the gene at index
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
      for (let i = 0; i < population.size; i++) {
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
      for (let i = 0; i < population.size; i++) {
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
  for (let i = 0; i < population.size; i++) {
    total_fitness += population.individuals[i].fitness_score;
  };

  //Calculate the probability of selection for each individual from the formula prob = fitness_of_individual/total_fitness
  var probabilities_of_selection = [];
  for (let i = 0; i < population_size; i++) {
    probabilities_of_selection.push(population.individuals[i].fitness_score/total_fitness);
  };

  //Calculate probability intervals for the idividuals
  var sum = 0;
  for (let i = 0; i < population_size; i++) {
    sum += probabilities_of_selection[i];
    this.rouletteWheel.push(sum);
  };
  //console.log(this.rouletteWheel);
};

function EliteSelection(population) {
  /* Select a number of fittest parents to breed the next generation */
  this.fittest_individuals = [];
  this.sorted_individuals = population.individuals.sort(function(a, b) {
    return b.fitness_score - a.fitness_score;
  }).slice();

  this.cutoff_index = Math.floor(selection_pressure*this.sorted_individuals.length);

  for (let i = 0; i < this.cutoff_index; i++) {
    this.fittest_individuals.push(this.sorted_individuals[i]);
  };
  //console.log(this.fittest_individuals);

  this.getParents = function() {
    var parents = [];
    while (parents.length < 2) {
      var index = Math.floor(Math.random() * this.cutoff_index);
      if (!parents.includes(this.fittest_individuals[index])) {
        parents.push(this.fittest_individuals[index]);
      } else {
        index = Math.floor(Math.random() * this.cutoff_index);
      };
    };
    return parents;
  };

  this.getParent = function() {
    var parent;
    while (parent === undefined) {
      var index = Math.floor(Math.random() * this.cutoff_index);
      parent = this.fittest_individuals[index];
    };
    return parent;
  };
};

/* Maintaining diversity */

function removeDuplicates(individuals) {
  var obj = {};

  for (let i = 0; i < individuals.length; i++) {
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
    for (let i = 0; i < this.size; i++) {
      this.individuals.push(new_individuals[i]);
    };
  };
};

function generatePopulation() {
  /* Initialise the population by creating a number of new random individuals */

  if (this.individuals === undefined || this.individuals.length === 0) {
    for (let i = 0; i < this.size; i++) {
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
  max_fitness_score = Math.max.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  //console.log(max_fitness_score);
  var fittest_individual = this.individuals.find(function(obj) {return obj.fitness_score == max_fitness_score;});
  //console.log(fittest_individual);
  return fittest_individual;
};

function getStatistics() {
  // Calculate average fitness score
  avg_fitness_score = 0;
  for (let i = 0; i < this.size; i++) {
    avg_fitness_score += this.individuals[i].fitness_score;
  };

  avg_fitness_score = avg_fitness_score/this.size;

  //var avg_fitness_score = this.individuals.reduce(function(prev, curr) {return prev.fitness_score + curr.fitness_score}, 0);
  // Find max & min fitness score
  //max_fitness_score = Math.max.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  min_fitness_score = Math.min.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  /*console.log("Max: ", max_fittness_score);
  console.log("Min: ", min_fittness_score);
  console.log("Avg: ", avg_fitness_score);*/
};

/* Individual */

function Individual(parents) {
  /* An individual of the population is a representation of a collection of shapes
  Its chromosome stores the data about all shapes. Each shape has a gene. */
  this.chromosome = [];
  this.number_of_shapes = chromosome_length;
  this.imgData = [];
  this.fitness_score = 0;
  this.draw = draw;
  this.createImageData = createImageData;
  this.calculateFitness = calculateFitness;

  if (parents && parents.length === 2) {
    // Crossover using uniform crossover method with crossover_rate = 0.5
    //console.log("2 parents - testing mutation")
    for (let i = 0; i < this.number_of_shapes; i++) {
      if (Math.random() <= uniform_rate) {
        this.chromosome.push(new Shape(parents[0].chromosome[i].gene.slice(0)));
        //console.log(this.chromosome);
      } else {
        this.chromosome.push(new Shape(parents[1].chromosome[i].gene.slice(0)));
        //console.log(this.chromosome);
      };
    };

    // Mutate
    this.chromosome = newMutation(this.chromosome);

  } else if (parents && parents instanceof Individual) {
    //console.log("1 parent");
    // Create an individual from an array of shapes (chromosome)
    for (let i = 0; i < this.number_of_shapes; i++) {
      this.chromosome.push(new Shape(parents.chromosome[i].gene.slice(0)));
    };

    // Mutate
    this.chromosome = newMutation(this.chromosome);

  } else {
    // Random generation
    for (let i = 0; i < this.number_of_shapes; i++) {
        this.chromosome.push(new Shape());
    };
    //console.log("random");
  };

  // Calculate the fitness_score of the individual
  this.imgData = this.createImageData();
  this.fitness_score = this.calculateFitness();
};

function draw(context) {
  /* Draw an individual using its chromosome data */
  context.fillStyle = "#C7D4D8";
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < this.number_of_shapes; i++) {
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
    //context.strokeStyle = "rgba(" + Math.floor(data[13] * 256) + ", " + Math.floor(data[14] * 256) + ", " + Math.floor(data[15] * 256) + ", " + (data[16] * 0.5) + ")";
    //context.lineWidth = Math.floor(data[12]*10);
    context.fill();
    //context.stroke();
  };
};

function createImageData() {
  var individual_canvas = document.createElement("canvas");
  individual_canvas.width = artwork.width;
  individual_canvas.height = artwork.height;
  var individual_ctx = individual_canvas.getContext("2d");
  this.draw(individual_ctx);
  //console.log(individual_ctx.getImageData(0, 0, canvas.width, canvas.height).data);
  return individual_ctx.getImageData(0, 0, canvas.width, canvas.height).data;
};

function calculateFitness() {
  /* Calcuate the fitness of an individual using Root Mean Square (RMS)*/
  //var imgData = this.imgData;
  var sum = 0.0;
  var fitness_value = 0.0;
  if (this.imgData !== undefined && artworkData !== undefined && this.imgData.length === artworkData.length) {
    for (let i = 0; i < pixelCount; i++) {
        var difference = artworkData[i] - this.imgData[i];
        sum += difference * difference;
    };
    var rms = Math.sqrt(sum/pixelCount); //RMS ranges from 0 (identical) to 255 (completely different)
    //var mse = sum/(pixelCount * 255 * 255);
    fitness_value = 1 - rms/255;
  };

  return fitness_value;
};

/* Shape */

function Shape(gene) {
  this.gene = [];

  if (gene && gene.length === gene_length) {
    //Copy gene
    for (let i = 0; i < gene_length; i++) {
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
    /*this.gene[12] = Math.random();  //stroke width
    this.gene[13] = Math.random();  //red - stroke
    this.gene[14] = Math.random();  //green - stroke
    this.gene[15] = Math.random();  //blue - stroke
    this.gene[16] = Math.random();  //alpha - stroke*/
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
