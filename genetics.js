function draw() {
  var canvas = document.getElementById("replica");
  var ctx = canvas.getContext("2d");

  var size = 50;

  for (int i = 0; i < size; i++) {
    var x = Math.random();
    var y = Math.random();

  }
}

//DNA = random rgba + random vertices
//Population = number of individual DNAs

/*function DNA(rgb, vertices) {
  this.rgb = rgb;
  this.vertices = vertices;
}

function Population (population_size) {
  this.population_size = population_size
  this.individuals = []
}

function Individual (mother, father) {
  this.dna = [];

  if (mother && father) {
    //crossover
  }
  else {
    //generate a random individual
  }
}*/
