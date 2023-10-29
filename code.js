addEventListener('load', function(e) {
    draw();
  });
  
function draw() {
    const canvas = document.querySelector('#drawCanvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'black';

    rotIn = +document.querySelector('#angleInput').value;
    rot = rotIn/180*Math.PI;

    center = [400, 300];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAirfoil(ctx, center, rot, 4);

    // draw reference lines
    ctx.strokeStyle = 'grey';

    ctx.beginPath();
    ctx.moveTo(center[0], 0);
    ctx.lineTo(center[0], canvas.height);
    ctx.stroke();

    ctx.strokeStyle = 'grey';
    ctx.beginPath();
    ctx.moveTo(0, center[1]);
    ctx.lineTo(canvas.width, center[1]);
    ctx.stroke();
    ctx.strokeStyle = 'grey';

    // draw velocities
    velScale = 3;

    Vu = +document.querySelector('#VuInput').value;
    VuPx = Vu * velScale;
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    VuStartX = center[0]-VuPx;
    canvas_arrow(ctx, VuStartX, center[1], center[0], center[1]);
    ctx.stroke();

    Vd = +document.querySelector('#VdInput').value;
    VdPx = Vd * velScale;
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    VuStartY = center[1]+VdPx;
    canvas_arrow(ctx, VuStartX, VuStartY, VuStartX, center[1]);
    ctx.stroke();

    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    VuStartY = center[1]+VdPx;
    canvas_arrow(ctx, VuStartX, VuStartY, center[0], center[1]);
    ctx.stroke();

    //let VeffTxt = document.querySelector('#veff_text');
    canvasPos = canvas.getBoundingClientRect();
    vVeff = new Vector(center[0] - VuStartX, center[1] - VuStartY);
    vCenter = new Vector(canvasPos.left + center[0], canvasPos.top + center[1]);
    textPos = vCenter.subtract(vVeff.mult(1/2));
    b = new Vector(3,5);

    let VeffTxt = document.getElementById('veff_text');
    VeffTxt.style.position = "absolute";
    
    VeffTxt.style.left = textPos[0] + 'px';
    VeffTxt.style.top = textPos[1] - 20 + 'px';


    // draw forces
    eps = 4; // A/W
    scale = 50;
    Veff = [center[0]-VuStartX, center[1]-VuStartY];
    Veff_norm = Math.sqrt(Veff[0]*Veff[0] + Veff[1]*Veff[1]);
    xa = Veff.map((x) => x/Veff_norm);

    W = xa.map((x) => scale*x);
    drawVector(ctx, center, W, 'cyan');

    ya = [xa[1], -xa[0]];
    A = ya.map((x) => scale*eps*x);
    drawVector(ctx, center, A, 'cyan');

    // helper lines
    Aend = [center[0]+A[0], center[1]+A[1]];
    drawVectorNoArrow(ctx, Aend, W, 'grey');
    Wend = [center[0]+W[0], center[1]+W[1]];
    drawVectorNoArrow(ctx, Wend, A, 'grey');

    Ra = [W[0]+A[0], W[1]+A[1]];
    drawVector(ctx, center, Ra, 'green');

    // Forces in blade frame
    Ra_end = [center[0]+Ra[0], center[1]+Ra[1]];
    drawVectorNoArrow(ctx, Ra_end, [0, -Ra[1]], 'grey');
    drawVectorNoArrow(ctx, Ra_end, [-Ra[0], 0], 'grey');

    drawVector(ctx, center, [0, Ra[1]], 'red');
    drawVector(ctx, center, [Ra[0], 0], 'red');
}

function drawVector(ctx, startPos, vec, color)
{
    ctx.strokeStyle = color;
    ctx.beginPath();
    canvas_arrow(ctx, startPos[0], startPos[1], startPos[0] + vec[0], startPos[1] + vec[1]);
    ctx.stroke();
}

function drawVectorNoArrow(ctx, startPos, vec, color)
{
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(startPos[0], startPos[1]);
    ctx.lineTo(startPos[0] + vec[0], startPos[1] + vec[1]);
    ctx.stroke();
}

  
function drawAirfoil(ctx, startPos, rot, scale) {
    airfoilRaw = getAirfoilPoints();
    airfoil = airfoilRaw.map( (raw) => [raw[0]-25, raw[1]] );

    p0Transformed = rotScaleMovePoint(airfoil[0], rot, scale, startPos);

    ctx.beginPath();
    ctx.moveTo(p0Transformed[0], p0Transformed[1]);

    for (p of airfoil) {
        pTransformed = rotScaleMovePoint(p, rot, scale, startPos);
        ctx.lineTo(pTransformed[0], pTransformed[1]);
    }

    ctx.stroke();
}
  
// https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
function canvas_arrow(context, fromx, fromy, tox, toy) {
var headlen = 10; // length of head in pixels
var dx = tox - fromx;
var dy = toy - fromy;
var angle = Math.atan2(dy, dx);
context.moveTo(fromx, fromy);
context.lineTo(tox, toy);
context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
context.moveTo(tox, toy);
context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}
  
function rotScaleMovePoint(point, rot, scale, move) {
scaledPoint = [point[0] * scale, point[1] * scale];
scaledRotatedPoint = [
    Math.cos(rot)*scaledPoint[0] - Math.sin(rot)*scaledPoint[1],
    Math.cos(rot)*scaledPoint[1] + Math.sin(rot)*scaledPoint[0]
]
scaledRotatedMovedPoint = [scaledRotatedPoint[0] + move[0], scaledRotatedPoint[1] + move[1]];

return scaledRotatedMovedPoint;

}
  
class Vector extends Array {
    add(otherVector) {
        return this.map((e, i) => e + otherVector[i]);
    }
    subtract(otherVector) {
        return this.map((e, i) => e - otherVector[i]);
    }
    mult(num) {
        return this.map((e) => e * num);
    }
}


  function getAirfoilPoints() {
  
    return [
  [100.000000,0.126000],
  [99.845900,0.147600],
  [99.384400,0.212000],
  [98.618500,0.318200],
  [97.552800,0.464200],
  [96.194000,0.647800],
  [94.550300,0.865800],
  [92.632000,1.114900],
  [90.450800,1.391400],
  [88.020300,1.691400],
  [85.355300,2.010700],
  [82.472400,2.345200],
  [79.389300,2.690500],
  [76.124900,3.042300],
  [72.699500,3.396200],
  [69.134200,3.747600],
  [65.450800,4.091700],
  [61.672300,4.423700],
  [57.821700,4.738300],
  [53.923000,5.030200],
  [50.000000,5.294000],
  [46.077000,5.524100],
  [42.178300,5.714800],
  [38.327700,5.860900],
  [34.549200,5.957500],
  [30.865800,6.000000],
  [27.300500,5.984800],
  [23.875100,5.909200],
  [20.610700,5.771400],
  [17.527600,5.570900],
  [14.644700,5.308300],
  [11.979700,4.985400],
  [9.549200,4.604900],
  [7.368000,4.170500],
  [5.449700,3.686700],
  [3.806000,3.158000],
  [2.447200,2.589300],
  [1.381500,1.985400],
  [0.615600,1.350300],
  [0.154100,0.687700],
  [0.000000,0.000000],
  [0.154100,-0.687700],
  [0.615600,-1.350300],
  [1.381500,-1.985400],
  [2.447200,-2.589300],
  [3.806000,-3.158000],
  [5.449700,-3.686700],
  [7.368000,-4.170500],
  [9.549200,-4.604900],
  [11.979700,-4.985400],
  [14.644700,-5.308300],
  [17.527600,-5.570900],
  [20.610700,-5.771400],
  [23.875100,-5.909200],
  [27.300500,-5.984800],
  [30.865800,-6.000000],
  [34.549200,-5.957500],
  [38.327700,-5.860900],
  [42.178300,-5.714800],
  [46.077000,-5.524100],
  [50.000000,-5.294000],
  [53.923000,-5.030200],
  [57.821700,-4.738300],
  [61.672300,-4.423700],
  [65.450800,-4.091700],
  [69.134200,-3.747600],
  [72.699500,-3.396200],
  [76.124900,-3.042300],
  [79.389300,-2.690500],
  [82.472400,-2.345200],
  [85.355300,-2.010700],
  [88.020300,-1.691400],
  [90.450800,-1.391400],
  [92.632000,-1.114900],
  [94.550300,-0.865800],
  [96.194000,-0.647800],
  [97.552800,-0.464200],
  [98.618500,-0.318200],
  [99.384400,-0.212000],
  [99.845900,-0.147600],
  [100.000000,-0.126000],
  
  
  ]
  
  }