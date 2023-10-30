drawVecs = Object;

addEventListener('load', function(e) {
    const canvas = document.querySelector('#drawCanvas');

    drawVecs.Vd = new DrawableVector(canvas, new Vector(0,0), new Vector(0,0), 'blue', '<i>V</i><sub>d</sub>', 0.5);
    drawVecs.Vu = new DrawableVector(canvas, new Vector(0,0), new Vector(0,0), 'blue', '<i>V</i><sub>u</sub>', 0.3);
    drawVecs.Veff = new DrawableVector(canvas, new Vector(0,0), new Vector(0,0), 'blue', '<i>V</i><sub>eff</sub>', 0.3);

    drawVecs.L = new DrawableVector(canvas, new Vector(0,0), new Vector(0,0), 'cyan', '<i>F</i><sub>A</sub>', 1.05);
    drawVecs.D = new DrawableVector(canvas, new Vector(0,0), new Vector(0,0), 'cyan', '<i>F</i><sub>W</sub>', 1.05);
    drawVecs.Ra = new DrawableVector(canvas, new Vector(0,0), new Vector(0,0), 'green', '<i>F</i><sub>res</sub>', 1.05);
    drawVecs.S = new DrawableVector(canvas, new Vector(0,0), new Vector(0,0), 'red', '<i>F</i><sub>S</sub>', 1.05);
    drawVecs.T = new DrawableVector(canvas, new Vector(0,0), new Vector(0,0), 'red', '<i>F</i><sub>T</sub>', 1.05);

    draw();
  });
  
function draw() {
    const canvas = document.querySelector('#drawCanvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'black';

    AOIdeg = +document.getElementById('AOI').querySelector('input').value; // angle of incident
    document.getElementById('AOI').querySelector('.showValue').value = AOIdeg + '°';
    AOI = AOIdeg/180*Math.PI;

    center = new Vector(500, 300);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAirfoil(ctx, center, AOI, 4);

    // draw reference lines
    drawLine(ctx, [center[0], 0], [center[0], canvas.height], 'grey');
    drawLine(ctx, [0, center[1]], [canvas.width, center[1]], 'grey');

    // draw velocities
    let velScale = 3;

    /// get inputs
    let VuTrue = +document.getElementById('VuInput').querySelector('input').value;
    let VdTrue = +document.getElementById('VdInput').querySelector('input').value;
    document.getElementById('VuInput').querySelector('.showValue').value = VuTrue + ' m/s';
    document.getElementById('VdInput').querySelector('.showValue').value = VdTrue + ' m/s';

    /// create vectors
    let Vu = new Vector(VuTrue * velScale, 0);
    let Vd = new Vector(0, VdTrue * velScale);
    let Veff = Vu.add(Vd);

    /// draw vectors
    drawVecs.Vu.newVectorValues(center.add(Vu.mult(-1)), Vu);
    drawVecs.Vd.newVectorValues(center.add(Veff.mult(-1)), Vd);
    drawVecs.Veff.newVectorValues(center.add(Veff.mult(-1)), Veff);

    /// draw angle of attack
    xb = new Vector(-Math.cos(AOI), -Math.sin(AOI));
    drawVectorNoArrow(ctx, center, xb.mult(500), 'grey');
    drawVectorNoArrow(ctx, center, xb.mult(500).mult(-1), 'grey');

    alphaW = Math.atan2(VdTrue, VuTrue);
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.arc(center[0], center[1], Veff.norm()*0.8, Math.PI + alphaW, Math.PI + AOI, (alphaW > AOI));
    ctx.stroke();
    AOA = AOI - alphaW;
    document.getElementById('AOA').value = Math.round(AOA*180/Math.PI * 100) / 100 + '°';

    // draw forces
    let eps = 4; // A/W
    let forceScale = 50;

    /// create Vectors
    let xa = Veff.normalized();
    let ya = new Vector(xa[1], -xa[0]);
    
    let D = xa.mult(forceScale);
    let L = ya.mult(forceScale * eps);
    let Ra = D.add(L);
    let S = new Vector(0, Ra[1]) ; // Thrust
    let T = new Vector(Ra[0], 0) ; // Tangent Force

    // draw vectors
    drawVecs.D.newVectorValues(center, D);
    drawVecs.L.newVectorValues(center, L);
    drawVecs.Ra.newVectorValues(center, Ra);
    drawVecs.S.newVectorValues(center, S);
    drawVecs.T.newVectorValues(center, T);

    /// helper lines
    drawVectorNoArrow(ctx, center.add(L), D, 'grey');
    drawVectorNoArrow(ctx, center.add(D), L, 'grey');

    drawVectorNoArrow(ctx, center.add(Ra), [0, -Ra[1]], 'grey');
    drawVectorNoArrow(ctx, center.add(Ra), [-Ra[0], 0], 'grey');
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
    endPos = [startPos[0] + vec[0], startPos[1] + vec[1]];
    drawLine(ctx, startPos, endPos, color)
}

function drawLine(ctx, start, end, color)
{
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    ctx.lineTo(end[0], end[1]);
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
    norm() {
        return Math.sqrt( this.reduce((prev, x) => x*x + prev, 0) );
    }
    normalized() {
        return this.mult( 1/this.norm() );
    }
}

class DrawableVector {
    constructor(canvas, startPos, vector, color, text, textPos) {
        this.canvas = canvas;
        this.startPos = startPos;
        this.vector = vector;
        this.color = color;
        this.text = text;
        this.textPos = textPos;

        let canvasPos = canvas.getBoundingClientRect();
        this.canvasPosVec = new Vector(canvasPos.left, canvasPos.top);

        this.textEl = document.createElement('div');
        this.textEl.innerHTML = text;
        this.textEl.style.position = 'absolute';
        this.textEl.style.color = color;
        canvas.parentElement.appendChild(this.textEl);

        this.newVectorValues(startPos, vector);
    }

    newVectorValues(startPos, vector) {
        this.startPos = startPos;
        this.vector = vector;

        let textPos = this.canvasPosVec.add(startPos).add(vector.mult(this.textPos));
        //let textPos = this.canvasPosVec;
        this.textEl.style.left = textPos[0] + 5 + 'px';
        this.textEl.style.top = textPos[1]  - 20 + 'px';

        //console.log(this.canvasPosVec, startPos, vector, textPos)
        drawVector(this.canvas.getContext('2d'), startPos, vector, this.color);
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