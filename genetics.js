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
var shapes;
var generation_count;
var elitism = true;
var crossover_rate = 0.8;
var mutation_rate = 0.01;
var uniform_rate = 0.5;
var mutation_amount = 0.1;

/* TESTING */
var iPopulation;
var requestID; //for animation

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
  maxRadius = 90;

  /* GA parameters */
  population_size = 10;
  shapes = 150;
  generation_count = 0;

  /* Animation parameter */
  requestID = undefined;

  iPopulation = new Population(population_size);
  iPopulation.generatePopulation();
  iPopulation.drawFittest();
  console.log(iPopulation);
  iPopulation.getStats();

  if (!requestID) {
    /* Start evolution animation */
    requestID = window.requestAnimationFrame(simulation);
  };
};

function pause() {
  if (requestID) {
    /* Stop evolution animation */
    window.cancelAnimationFrame(requestID);
    requestID = undefined;
    console.log("Generation #" + generation_count);
    iPopulation.getStats();
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
    iPopulation.getStats();
    console.log(iPopulation);
  } else {
    console.log("Generation #" + generation_count);
    iPopulation.getStats();
    console.log(iPopulation);
  };
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

function evolvePopulation(population) {
  var new_individuals = []
  var rws = new RouletteWheelSelection(population);
  var sorted_individuals = population.individuals.sort(function(a, b) {
    return a.fitness_score - b.fitness_score;
  }).slice();
  //console.log(sorted_individuals);

  /* Copy the fittest individual */
  if (elitism) {
    new_individuals.push(population.getFittest());
  };

  var elitism_offset;
  if (elitism) {
    elitism_offset = 1;
    sorted_individuals.pop();
  } else {
    elitism_offset = 0;
  };

  /* Select parents and breed the new individuals of the population */
  for (var i = elitism_offset; i < population.size; i++) {
    if (Math.random() < crossover_rate) {
      var parents = rws.getParents();
      new_individuals.push(new Individual(parents));
    } else {
      // Generate a random individual
      //new_individuals.push(new Individual());
      //console.log(sorted_individuals);
      var last = sorted_individuals[sorted_individuals.length - 1];
      new_individuals.push(last);
      //console.log(last);
      sorted_individuals.pop();
      //console.log(sorted_individuals);
      //console.log("org: " + population.individuals);
    };
  };

  /* Create a new population consisting of the new individuals */
  var newPopulation = new Population(population.size, new_individuals);

  /* Regular Mutation
  for (var i = 0; i < newPopulation.size; i++) {
    if (Math.random() < mutation_rate) {
      newPopulation.individuals[i].chromosome = mutation(newPopulation.individuals[i].chromosome);
      //console.log("Mutation");
    };
  };*/

  /* Intergenic Mutation */
  for (var i = 0; i < newPopulation.size; i++) {
    newPopulation.individuals[i].chromosome = customMutation(newPopulation.individuals[i].chromosome);
    newPopulation.individuals[i].imgData = createImageData(newPopulation.individuals[i]);
    newPopulation.individuals[i].fitness_score = calculateFitness(newPopulation.individuals[i]);
  };

  return newPopulation;
};

function RouletteWheelSelection(population) {
  /* Create a roulette wheel for a population */
  this.rouletteWheel = [];

  /*this.getParent = function() {
    var parent;
    while (parent == undefined) {
      var pointer = Math.random();
      for (var i = 0; i < population.size; i++) {
        if (pointer <= this.rouletteWheel[i]) {
          if (population.individuals[i] != population.getFittest()) {
            parent = population.individuals[i];
            break;
          } else {
            pointer = Math.random();
            break;
          };
        };
      };
    };
    return parent;
  };*/

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

function mutation(chromosome) {
  /* Mutate the chromosome by swapping a random gene with a new gene */
  var gene_position = Math.round(Math.random()*shapes)-1; //range 0-49
  //console.log(gene_position);
  //console.log(chromosome[gene_position]);
  chromosome[gene_position] = new Shape();
  //console.log(chromosome[gene_position]);
  return chromosome;
};

function intergenicMutation(chromosome) {
  /* Mutate the chromosome with some probability */
  for (var i = 0; i < chromosome.length; i++) {
    if (Math.random() < mutation_rate) {
      chromosome[i] = new Shape();
    };
  };
  return chromosome;
};

function customMutation(chromosome) {
  /* Mutate the chromosome by adjusting some of the values */
  for (var i = 0; i < chromosome.length; i++) {
    var colour = chromosome[i].gene[8];
    if (Math.random() < mutation_rate) {
      for (var colour_idx = 0; colour_idx < 3; colour_idx++) {
        var index = Math.floor(Math.random() * 8);
        chromosome[i].gene[index] += (Math.random() * mutation_amount * 2) - mutation_amount;
        if (chromosome[i].gene[index] < 0) {
          chromosome[i].gene[index] = 0;
        } else if (chromosome[i].gene[index] > 1) {
          chromosome[i].gene[index] = 1;
        };
        colour[colour_idx] += (Math.random() * mutation_amount*255*2) - mutation_amount*255;
        if (colour[colour_idx] < 0) {
          colour[colour_idx] = 0;
        } else if (colour[colour_idx] > 255) {
          colour[colour_idx] = 255;
        };
      };
      //var colour_idx = Math.floor(Math.random() * 3);
    };
  };
  return chromosome;
};

function Population(population_size, new_individuals) {
  this.size = population_size;
  this.individuals = new_individuals || [];
  this.generatePopulation = generatePopulation;
  this.drawFittest = drawFittest;
  this.getFittest = getFittest;
  this.getStats = getStats;
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
  //var min_fittness_score = Math.min.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  var fittest_individual = this.individuals.find(function(obj) {return obj.fitness_score == max_fittness_score;});
  //console.log("Max: ", max_fittness_score);
  //console.log("Min: ", min_fittness_score);
  return fittest_individual;
};

function getStats() {
  var max_fittness_score = Math.max.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  var min_fittness_score = Math.min.apply(Math, this.individuals.map(function(obj) {return obj.fitness_score;}));
  console.log("Max: ", max_fittness_score);
  console.log("Min: ", min_fittness_score);
};

function Individual(parents) {
  /* An individual of the population is a representation of a collection of shapes
  Its chromosome stores the data about all shapes. Each shape is a gene. */
  this.chromosome = [];
  this.number_of_shapes = shapes;
  this.imgData = [];
  this.draw = draw;
  this.fitness_score = 0;
  if (parents && parents.length == 2) {
    // Crossover using uniform crossover method with crossover_rate = 0.5
    for (var i = 0; i < this.number_of_shapes; i++) {
      if (Math.random() <= uniform_rate) {
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
  /*var individual_canvas = document.createElement("canvas");
  var individual_ctx = individual_canvas.getContext("2d");
  this.draw(individual_ctx);
  this.imgData = individual_ctx.getImageData(0, 0, canvas.width, canvas.height).data;*/
  this.imgData = createImageData(this);
  this.fitness_score = calculateFitness(this);
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
    context.fillStyle = "rgba(" + data[8][0] + ", " + data[8][1] + ", " + data[8][2] + ", " + data[8][3] + ")";
    //context.strokeStyle = data.strokeColour;
    //context.lineWidth = data.width;
    context.fill();
    //context.stroke();
  };
};

function createImageData(individual) {
  var individual_canvas = document.createElement("canvas");
  var individual_ctx = individual_canvas.getContext("2d");
  individual.draw(individual_ctx);
  return individual_ctx.getImageData(0, 0, canvas.width, canvas.height).data;
};

function calculateFitness(individual) {
  /* Calcuate the fitness of an individual using Root Mean Square (RMS)*/
  var imgData = individual.imgData;
  var sum = 0.0;
  var fitness_value = 0.0;
  if (imgData != undefined && artworkData != undefined && imgData.length == artworkData.length) {
    for (var i = 0; i < pixelCount; i++) {
        difference = artworkData[i] - imgData[i];
        sum += difference * difference;
    };
    var rms = Math.sqrt(sum/pixelCount); //RMS ranges from 0 (identical) to 255 (completely different)
    fitness_value = 1 - (rms/255);
  };

  return fitness_value;
};

function Shape () {
  this.gene = [];

  this.gene[0] = Math.random(); //x
  this.gene[1] = Math.random(); //y
  this.gene[2] = Math.random(); //radiusX
  this.gene[3] = Math.random(); //radiusY
  this.gene[4] = Math.random(); //startAngle
  this.gene[5]= Math.random(); //endAngle
  this.gene[6] = Math.random(); //rotation
  this.gene[7] = Math.random(); //counter-clockwise
  this.gene[8] = randomRGBA(); //colour

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
