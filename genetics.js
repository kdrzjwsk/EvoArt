function draw() {
  var canvas = document.getElementById("replica");
  var ctx = canvas.getContext("2d");

  var size = 200;
  var minRadius = 5;
  var maxRadius = 50;
  for (var i = 0; i < size; i++) {
    var x = Math.random()*canvas.width;
    var y = Math.random()*canvas.height;
    var radius = Math.random()*(maxRadius - minRadius) + minRadius;
    var sAngle = Math.random()*Math.PI; //or 0*Math.PI
    var eAngle = (Math.random()+1)*Math.PI; //or 2*Math.PI
    var counterclockwise = (Math.random() >= 0.5);
    ctx.beginPath();
    ctx.arc(x, y, radius, sAngle, eAngle, counterclockwise);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = randomRGB();
    ctx.stroke();
  };
};

function randomRGB() {
  var red = Math.floor(Math.random() * 256);
  var blue = Math.floor(Math.random() * 256);
  var green = Math.floor(Math.random() * 256);
  return("rgb(" + red + ", " + blue + ", " + green + ")");
};

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
