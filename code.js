drawVecs = new Object;
diags = new Object;

addEventListener('load', function(e) {
    const canvasFig = document.querySelector('#drawCanvas');
    const canvasDiagCL_AOA = document.querySelector('#CL_AOA').querySelector('canvas');
    const canvasDiagCL_CD = document.querySelector('#CL_CD').querySelector('canvas');

    drawVecs.Vd = new DrawableVector(canvasFig, new Vector(0,0), new Vector(0,0), 'blue', '<i>V</i><sub>d</sub>', 0.7);
    drawVecs.Vu = new DrawableVector(canvasFig, new Vector(0,0), new Vector(0,0), 'blue', '<i>V</i><sub>u</sub>', 0.3);
    drawVecs.Veff = new DrawableVector(canvasFig, new Vector(0,0), new Vector(0,0), 'blue', '<i>V</i><sub>eff</sub>', 0.3);
    drawVecs.alphaEff = new DrawableVector(canvasFig, new Vector(0,0), new Vector(0,0), 'red', '<i>α</i><sub>eff</sub>', .98, false);

    drawVecs.L = new DrawableVector(canvasFig, new Vector(0,0), new Vector(0,0), 'cyan', '<i>F</i><sub>A</sub>', 1.05);
    drawVecs.D = new DrawableVector(canvasFig, new Vector(0,0), new Vector(0,0), 'cyan', '<i>F</i><sub>W</sub>', 1.05);
    drawVecs.Ra = new DrawableVector(canvasFig, new Vector(0,0), new Vector(0,0), 'green', '<i>F</i><sub>res</sub>', 1.05);
    drawVecs.S = new DrawableVector(canvasFig, new Vector(0,0), new Vector(0,0), 'red', '<i>F</i><sub>S</sub>', 1.05);
    drawVecs.T = new DrawableVector(canvasFig, new Vector(0,0), new Vector(0,0), 'red', '<i>F</i><sub>T</sub>', 1.05);

    diags.CL_AOA = new Diagram(canvasDiagCL_AOA, [-26, 26], [-1.6, 1.6], 2, 0.2)
    diags.CL_CD = new Diagram(canvasDiagCL_CD, [-0.08, 0.24], [-1.6, 1.6], 0.04, 0.2)

    draw();
  });
  
function draw() {
    const canvas = document.querySelector('#drawCanvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'black';

    AOIdeg = +document.getElementById('AOI').querySelector('input').value; // angle of incident
    document.getElementById('AOI').querySelector('.showValue').value = AOIdeg + '°';
    AOI = AOIdeg/180*Math.PI;

    center = new Vector(600, 350);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAirfoil(ctx, center, AOI, 4);

    // draw reference lines
    drawLine(ctx, [center[0], 0], [center[0], canvas.height], 'grey');
    drawLine(ctx, [0, center[1]], [canvas.width, center[1]], 'grey');

    /*
     *  Draw Velocities
    */
    let velScale = 3;

    /// get inputs
    let VuTrue = +document.getElementById('VuInput').querySelector('input').value;
    let VdTrue = +document.getElementById('VdInput').querySelector('input').value;
    document.getElementById('VuInput').querySelector('.showValue').value = VuTrue + ' m/s';
    document.getElementById('VdInput').querySelector('.showValue').value = VdTrue + ' m/s';

    /// create velocity vectors
    let Vu = new Vector(VuTrue * velScale, 0);
    let Vd = new Vector(0, VdTrue * velScale);
    let Veff = Vu.add(Vd);

    // Coordinate vectors
    let xb = new Vector(-Math.cos(AOI), -Math.sin(AOI));
    let xa = Veff.normalized().mult(-1);
    let za = new Vector(xa[1], -xa[0]);
    if (false) { // debugging
        let scale = 500;
        drawVector(ctx, center, xb.mult(scale), 'grey');
        drawVector(ctx, center, xa.mult(scale), 'grey');
        drawVector(ctx, center, za.mult(scale), 'grey');
    }

    /// draw velocity vectors
    ctx.lineWidth = 2;
    drawVecs.Vu.newVectorValues(center.add(Vu.mult(-1)), Vu);
    drawVecs.Vd.newVectorValues(center.add(Veff.mult(-1)), Vd);
    drawVecs.Veff.newVectorValues(center.add(Veff.mult(-1)), Veff);

    /// draw angle of attack
    let angleScale = 500;
    let aoaRadius = Veff.norm()*0.8;
    let aoaLegendAngeOffset = 2/180*Math.PI;

    ctx.lineWidth = 1;
    ctx.setLineDash([5, 15]);
    drawVectorNoArrow(ctx, center, xb.mult(angleScale), 'grey');
    drawVectorNoArrow(ctx, center, xb.mult(angleScale).mult(-1), 'grey');
    ctx.setLineDash([]);
    /*let alphaEffVecStart = center.add(xb.mult(aoaRadius-aoaLegendOffset));
    let alphaEffVecEnd = center.add(xa.mult(aoaRadius-aoaLegendOffset));
    drawVecs.alphaEff.newVectorValues(alphaEffVecStart, alphaEffVecEnd.add(alphaEffVecStart.mult(-1)));*/
    
    ctx.lineWidth = 2;
    alphaW = Math.atan2(VdTrue, VuTrue);
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.arc(center[0], center[1], aoaRadius, Math.PI + alphaW, Math.PI + AOI, (alphaW > AOI));
    ctx.stroke();
    AOA = AOI - alphaW;
    document.getElementById('AOA').value = Math.round(AOA*180/Math.PI * 100) / 100 + '°';
    let aoaLegendAngle = AOA/2 + alphaW - aoaLegendAngeOffset;
    drawVecs.alphaEff.newVectorValues(center, (new Vector(-Math.cos(aoaLegendAngle), -Math.sin(aoaLegendAngle))).mult(aoaRadius));

    /*
     *  Draw Forces
    */
    let coeffScale = 250;
    let airfoilData = getAirfoilDataAtAngle(AOA);

    /// get inputs
    let CD, CL;
    let CLin = +document.getElementById('CLInput').querySelector('input').value;
    let CDin = +document.getElementById('CDInput').querySelector('input').value;
    let coeffSrc = document.getElementById('usePolarsInput').querySelector('input').checked;

    if (coeffSrc) {
        document.getElementById('CLInput').querySelector('input').disabled = true;
        document.getElementById('CDInput').querySelector('input').disabled = true;

        CL = airfoilData.CL;
        CD = airfoilData.CD;

        document.getElementById('CLInput').querySelector('input').value = CL;
        document.getElementById('CDInput').querySelector('input').value = CD;
    }
    else {
        document.getElementById('CLInput').querySelector('input').disabled = false;
        document.getElementById('CDInput').querySelector('input').disabled = false;

        CL = CLin;
        CD = CDin;
    }

    document.getElementById('CLInput').querySelector('.showValue').value = Math.round(CL*1000)/1000;
    document.getElementById('CDInput').querySelector('.showValue').value = Math.round(CD*1000)/1000;
    


    /// create Vectors
    ctx.lineWidth = 2;
    
    let D = xa.mult(- CD * coeffScale);
    let L = za.mult(- CL * coeffScale);
    let Ra = D.add(L);
    let S = new Vector(0, Ra[1]) ; // Thrust
    let T = new Vector(Ra[0], 0) ; // Tangent Force

    /// draw vectors
    ctx.lineWidth = 2;
    drawVecs.D.newVectorValues(center, D);
    drawVecs.L.newVectorValues(center, L);
    drawVecs.Ra.newVectorValues(center, Ra);
    drawVecs.S.newVectorValues(center, S);
    drawVecs.T.newVectorValues(center, T);

    /// helper lines
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 10]);
    drawVectorNoArrow(ctx, center.add(L), D, 'grey');
    drawVectorNoArrow(ctx, center.add(D), L, 'grey');

    drawVectorNoArrow(ctx, center.add(Ra), [0, -Ra[1]], 'grey');
    drawVectorNoArrow(ctx, center.add(Ra), [-Ra[0], 0], 'grey');
    ctx.setLineDash([]);


    /*
     *  Draw Diagrams
    */
    let airfoilDataAll = getAirfoilData();
    AOAplt = airfoilDataAll.reduce((list, newEl) => list.concat(newEl[0]), []);
    CLplt = airfoilDataAll.reduce((list, newEl) => list.concat(newEl[1]), []);
    CDplt = airfoilDataAll.reduce((list, newEl) => list.concat(newEl[2]), []);

    diags.CL_AOA.plot(AOAplt, CLplt, 'green');
    diags.CL_AOA.setMarker(AOA / Math.PI*180, CL, 'red');
    diags.CL_CD.plot(CDplt, CLplt, 'green');
    diags.CL_CD.setMarker(CD, CL, 'red');
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
    airfoil = airfoilRaw.map( (raw) => [(raw[0]-0.25)*100, raw[1]*100] );

    p0Transformed = rotScaleMovePoint(airfoil[0], rot, scale, startPos);

    ctx.beginPath();
    ctx.moveTo(p0Transformed[0], p0Transformed[1]);

    for (p of airfoil) {
        pTransformed = rotScaleMovePoint(p, rot, scale, startPos);
        ctx.lineTo(pTransformed[0], pTransformed[1]);
    }

    ctx.stroke();
}

function getAirfoilDataAtAngle(angleRad) {
    let angleDeg = angleRad*180/Math.PI;

    airfoilData = getAirfoilData();
    // find angle in airfoil data
    airfoilDataAtAOA = interp1_piecewise_linear(airfoilData, angleDeg);

    let retObj = new Object;
    retObj.AOA = airfoilDataAtAOA[0];
    retObj.CL = airfoilDataAtAOA[1];
    retObj.CD = airfoilDataAtAOA[2];

    return retObj;
}

// https://afelipe.hashnode.dev/1d-interpolation-in-javascript
function interp1_piecewise_linear(data, x) 
{
    if (x <= data[0][0])
        return data[0];
    else if (x >= data[data.length-1][0])
        return data[data.length-1];

    for(let i = 0; i < data.length; ++i){
      if(data[i][0] <= x && data[i+1][0] >= x) {
        // Use the equation for the line passing through 
        // (ts[i], ys[i]) and (ts[i+1], ys[i+1])
        let a = (x - data[i][0]) / (data[i+1][0] - data[i][0]);
        return data[i].map( (value, index) => (1-a)*value + a*data[i+1][index] )
      }
    }
  }
  
// https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
function canvas_arrow(context, fromx, fromy, tox, toy) 
{
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
  
function rotScaleMovePoint(point, rot, scale, move) 
{
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
    constructor(canvas, startPos, vector, color, text, textPos, plotVector = true) {
        this.canvas = canvas;
        this.startPos = startPos;
        this.vector = vector;
        this.color = color;
        this.text = text;
        this.textPos = textPos;
        this.plotVector = plotVector;

        let canvasData = canvas.getBoundingClientRect();
        let bodyData = document.body.getBoundingClientRect();
        this.canvasPosVec = new Vector(canvasData.left - bodyData.left, canvasData.top - bodyData.top);

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
        this.textEl.style.left = textPos[0] + 10 + 'px';
        this.textEl.style.top = textPos[1]  + 'px';

        //console.log(this.canvasPosVec, startPos, vector, textPos)
        if (this.plotVector)
            drawVector(this.canvas.getContext('2d'), startPos, vector, this.color);
    }
}

class Diagram {
    constructor(canvas, xlim, ylim, xticks, yticks) {
        let canvasData = canvas.getBoundingClientRect();
        let bodyData = document.body.getBoundingClientRect();
        this.canvasSize = [canvasData.width, canvasData.height];
        this.canvasPos = new Vector(canvasData.left - bodyData.left, canvasData.top - bodyData.top);

        this.xrange = xlim[1] - xlim[0];
        this.yrange = ylim[1] - ylim[0];
        this.p0t = new Vector(
            -xlim[0] / this.xrange * this.canvasSize[0],
            ylim[1] / this.yrange * this.canvasSize[1]
        );

        this.canvas = canvas;
        this.xlim = xlim;
        this.ylim = ylim;

        // convert ticks
        if (typeof xticks === 'number') {
            let nTicks = Math.round(this.xrange / xticks);
            this.xticks = [...Array(nTicks).keys()].map((x) => x*xticks + xlim[0]);
        }
        else {
            this.xticks = xticks;
        }

        if (typeof yticks === 'number') {
            let nTicks = Math.round(this.yrange / yticks);
            this.yticks = [...Array(nTicks).keys()].map((x) => x*yticks + ylim[0]);
        }
        else {
            this.yticks = yticks;
        }


        // write ticks on canvas
        for (let dir of ['x', 'y']) {
            let ticks = dir == 'x' ? this.xticks : this.yticks;

            for (let tick of ticks) {
                let divPosInCanvas = dir == 'x' ? this.unit2px([tick,0]) : this.unit2px([0, tick]);
                let divPos = this.canvasPos.add(divPosInCanvas);
                let textEl = document.createElement('div');
                textEl.innerHTML = Number(tick.toFixed(2));
                textEl.style.position = 'absolute';
                textEl.style.top = divPos[1] + 'px';
                textEl.style.left = divPos[0] + 'px';
                this.canvas.parentElement.appendChild(textEl);
            }
        }

        this.draw();
    }

    unit2px(unit) {
        return new Vector(
            unit[0]  / this.xrange * this.canvasSize[0] + this.p0t[0],
            -unit[1] / this.yrange * this.canvasSize[1] + this.p0t[1],
        );
    }

    draw() {
        let ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // draw axis
        drawLine(this.canvas.getContext('2d'), [0, this.p0t[1]], [this.canvasSize[0], this.p0t[1]], 'black');
        drawLine(this.canvas.getContext('2d'), [this.p0t[0], 0], [this.p0t[0], this.canvasSize[1]], 'black');

        // draw ticks
        const tickLen = 10;
        
        for (let tick of this.xticks) {
            let tickLenUnit = tickLen * this.yrange / this.canvasSize[1];
            drawLine(ctx, this.unit2px([tick,-tickLenUnit/2]), this.unit2px([tick,tickLenUnit/2]), 'black');
        }

        for (let tick of this.yticks) {
            let tickLenUnit = tickLen * this.xrange / this.canvasSize[0];
            drawLine(ctx, this.unit2px([-tickLenUnit/2, tick]), this.unit2px([tickLenUnit/2, tick]), 'black');
        }
    }

    plot(x, y, color) {
        this.draw();

        let ctx = this.canvas.getContext('2d');
        ctx.strokeStyle = color;
        ctx.beginPath();

        let p = this.unit2px([x[0], y[0]]);
        ctx.moveTo(p[0], p[1]);
        x.forEach((e, i) => {
            p = this.unit2px([e, y[i]]);
            ctx.lineTo(p[0], p[1]);
        });

        ctx.stroke();
    }

    setMarker(x, y, color) {
        let ctx = this.canvas.getContext('2d');

        ctx.fillStyle = color;
        ctx.beginPath();

        let p = this.unit2px([x, y]);
        ctx.arc(p[0], p[1], 3, 0, 2*Math.PI);

        ctx.fill();

        let px = this.unit2px([x, 0]);
        let py = this.unit2px([0, y]);
        drawLine(ctx, p, px, 'grey');
        drawLine(ctx, p, py, 'grey');
    }

}

// http://airfoiltools.com/airfoil/details?airfoil=n63015a-il
function getAirfoilPoints() {
    return [
        [0.000000,  0.000000],
        [0.005000,  0.012030],
        [0.007500,  0.014480],
        [0.012500,  0.018440],
        [0.025000,  0.025790],
        [0.050000,  0.036180],
        [0.075000,  0.043820],
        [0.100000,  0.049970],
        [0.150000,  0.059420],
        [0.200000,  0.066190],
        [0.250000,  0.070910],
        [0.300000,  0.073840],
        [0.350000,  0.074960],
        [0.400000,  0.074350],
        [0.450000,  0.072150],
        [0.500000,  0.068580],
        [0.550000,  0.063870],
        [0.600000,  0.058200],
        [0.650000,  0.051730],
        [0.700000,  0.044680],
        [0.750000,  0.037310],
        [0.800000,  0.029910],
        [0.850000,  0.022520],
        [0.900000,  0.015120],
        [0.950000,  0.007720],
        [1.000000,  0.000320],
        [0.000000,  0.000000],
        [0.005000, -0.012030],
        [0.007500, -0.014480],
        [0.012500, -0.018440],
        [0.025000, -0.025790],
        [0.050000, -0.036180],
        [0.075000, -0.043820],
        [0.100000, -0.049970],
        [0.150000, -0.059420],
        [0.200000, -0.066190],
        [0.250000, -0.070910],
        [0.300000, -0.073840],
        [0.350000, -0.074960],
        [0.400000, -0.074350],
        [0.450000, -0.072150],
        [0.500000, -0.068580],
        [0.550000, -0.063870],
        [0.600000, -0.058200],
        [0.650000, -0.051730],
        [0.700000, -0.044680],
        [0.750000, -0.037310],
        [0.800000, -0.029910],
        [0.850000, -0.022520],
        [0.900000, -0.015120],
        [0.950000, -0.007720],
        [1.000000, -0.000320],
  ]
}

// http://airfoiltools.com/airfoil/details?airfoil=n63015a-il
function getAirfoilData() 
{ 
    // alpha    CL        CD       CDp       CM     Top_Xtr  Bot_Xtr
    return [
        [ -19.750,-1.0441,0.13855,0.13524,0.0097,1.0000,0.0118],
    [ -19.500,-1.0606,0.13090,0.12746,0.0053,1.0000,0.0118],
    [ -19.250,-1.0755,0.12380,0.12023,0.0014,1.0000,0.0119],
    [ -19.000,-1.0898,0.11700,0.11331,-0.0022,1.0000,0.0119],
    [ -18.750,-1.1029,0.11063,0.10682,-0.0055,1.0000,0.0120],
    [ -18.500,-1.1150,0.10452,0.10059,-0.0086,1.0000,0.0120],
    [ -18.250,-1.1261,0.09875,0.09470,-0.0114,1.0000,0.0121],
    [ -18.000,-1.1364,0.09326,0.08910,-0.0140,1.0000,0.0121],
    [ -17.750,-1.1454,0.08808,0.08381,-0.0163,1.0000,0.0122],
    [ -17.500,-1.1534,0.08318,0.07879,-0.0184,1.0000,0.0122],
    [ -17.250,-1.1602,0.07856,0.07406,-0.0204,1.0000,0.0123],
    [ -17.000,-1.1662,0.07420,0.06959,-0.0221,1.0000,0.0124],
    [ -16.750,-1.1710,0.07010,0.06539,-0.0236,1.0000,0.0124],
    [ -16.500,-1.1745,0.06627,0.06145,-0.0249,1.0000,0.0125],
    [ -16.250,-1.1773,0.06266,0.05774,-0.0260,1.0000,0.0126],
    [ -16.000,-1.1791,0.05928,0.05426,-0.0270,1.0000,0.0127],
    [ -15.750,-1.1798,0.05610,0.05098,-0.0277,1.0000,0.0128],
    [ -15.500,-1.1795,0.05316,0.04794,-0.0284,1.0000,0.0129],
    [ -15.250,-1.1786,0.05038,0.04507,-0.0288,1.0000,0.0131],
    [ -15.000,-1.1765,0.04781,0.04240,-0.0291,1.0000,0.0132],
    [ -14.750,-1.1737,0.04536,0.03986,-0.0292,1.0000,0.0134],
    [ -14.500,-1.1702,0.04306,0.03745,-0.0293,1.0000,0.0136],
    [ -14.250,-1.1658,0.04087,0.03517,-0.0292,1.0000,0.0137],
    [ -14.000,-1.1607,0.03879,0.03301,-0.0290,1.0000,0.0139],
    [ -13.750,-1.1550,0.03682,0.03094,-0.0287,1.0000,0.0140],
    [ -13.500,-1.1484,0.03498,0.02900,-0.0284,1.0000,0.0141],
    [ -13.250,-1.1410,0.03324,0.02718,-0.0279,1.0000,0.0143],
    [ -13.000,-1.1327,0.03162,0.02548,-0.0274,1.0000,0.0144],
    [ -12.750,-1.1235,0.03012,0.02389,-0.0268,1.0000,0.0146],
    [ -12.500,-1.1151,0.02860,0.02229,-0.0260,1.0000,0.0147],
    [ -12.250,-1.1075,0.02706,0.02069,-0.0251,1.0000,0.0150],
    [ -12.000,-1.0979,0.02574,0.01931,-0.0242,1.0000,0.0152],
    [ -11.750,-1.0869,0.02458,0.01810,-0.0232,1.0000,0.0155],
    [ -11.500,-1.0749,0.02355,0.01702,-0.0221,1.0000,0.0158],
    [ -11.250,-1.0622,0.02261,0.01603,-0.0209,1.0000,0.0161],
    [ -11.000,-1.0488,0.02176,0.01512,-0.0196,1.0000,0.0164],
    [ -10.750,-1.0350,0.02099,0.01430,-0.0183,1.0000,0.0169],
    [ -10.500,-1.0209,0.02029,0.01355,-0.0168,1.0000,0.0173],
    [ -10.250,-1.0066,0.01966,0.01287,-0.0151,1.0000,0.0178],
    [ -10.000,-0.9934,0.01904,0.01221,-0.0132,1.0000,0.0183],
    [-9.750,-0.9805,0.01841,0.01155,-0.0111,1.0000,0.0189],
    [-9.500,-0.9649,0.01787,0.01099,-0.0095,1.0000,0.0196],
    [-9.250,-0.9490,0.01738,0.01048,-0.0077,1.0000,0.0205],
    [-9.000,-0.9322,0.01693,0.00999,-0.0061,0.9992,0.0214],
    [-8.750,-0.9024,0.01636,0.00939,-0.0073,0.9891,0.0228],
    [-8.500,-0.8728,0.01580,0.00883,-0.0084,0.9773,0.0248],
    [-8.250,-0.8425,0.01534,0.00832,-0.0094,0.9638,0.0269],
    [-8.000,-0.8140,0.01483,0.00781,-0.0101,0.9480,0.0300],
    [-7.750,-0.7874,0.01444,0.00737,-0.0102,0.9296,0.0332],
    [-7.500,-0.7641,0.01404,0.00694,-0.0096,0.9100,0.0376],
    [-7.250,-0.7415,0.01369,0.00656,-0.0088,0.8910,0.0428],
    [-7.000,-0.7189,0.01335,0.00618,-0.0080,0.8735,0.0500],
    [-6.750,-0.6962,0.01301,0.00583,-0.0073,0.8578,0.0593],
    [-6.500,-0.6731,0.01267,0.00548,-0.0066,0.8434,0.0706],
    [-6.000,-0.6261,0.01199,0.00483,-0.0054,0.8181,0.1009],
    [-5.750,-0.6033,0.01156,0.00449,-0.0048,0.8071,0.1278],
    [-5.500,-0.5809,0.01109,0.00414,-0.0041,0.7968,0.1642],
    [-5.000,-0.5357,0.01009,0.00347,-0.0028,0.7779,0.2535],
    [-4.750,-0.5134,0.00957,0.00315,-0.0021,0.7689,0.3079],
    [-4.500,-0.4907,0.00911,0.00289,-0.0014,0.7608,0.3655],
    [-4.250,-0.4668,0.00876,0.00271,-0.0009,0.7523,0.4140],
    [-4.000,-0.4412,0.00857,0.00258,-0.0005,0.7448,0.4444],
    [-3.750,-0.4147,0.00843,0.00247,-0.0003,0.7369,0.4653],
    [-3.500,-0.3879,0.00833,0.00237,-0.0002,0.7296,0.4822],
    [-3.250,-0.3607,0.00823,0.00228,-0.0001,0.7219,0.4977],
    [-3.000,-0.3338,0.00815,0.00220,0.0001,0.7147,0.5168],
    [-2.750,-0.3066,0.00807,0.00214,0.0002,0.7074,0.5337],
    [-2.500,-0.2794,0.00801,0.00208,0.0003,0.7000,0.5469],
    [-2.250,-0.2519,0.00795,0.00202,0.0003,0.6932,0.5591],
    [-2.000,-0.2241,0.00791,0.00197,0.0003,0.6857,0.5702],
    [-1.750,-0.1964,0.00788,0.00193,0.0004,0.6789,0.5799],
    [-1.500,-0.1684,0.00785,0.00189,0.0003,0.6716,0.5873],
    [-1.000,-0.1122,0.00782,0.00182,0.0002,0.6575,0.6015],
    [-0.750,-0.0844,0.00780,0.00180,0.0002,0.6505,0.6086],
    [-0.500,-0.0560,0.00780,0.00178,0.0001,0.6436,0.6157],
    [-0.250,-0.0281,0.00778,0.00177,0.0001,0.6363,0.6224],
    [0.000,0.0000,0.00779,0.00177,0.0000,0.6297,0.6297],
    [0.250,0.0281,0.00778,0.00177,-0.0001,0.6224,0.6363],
    [0.500,0.0560,0.00780,0.00178,-0.0001,0.6157,0.6436],
    [0.750,0.0844,0.00780,0.00180,-0.0002,0.6086,0.6504],
    [1.000,0.1122,0.00782,0.00182,-0.0002,0.6015,0.6575],
    [1.500,0.1684,0.00785,0.00189,-0.0003,0.5872,0.6715],
    [1.750,0.1964,0.00788,0.00193,-0.0004,0.5799,0.6788],
    [2.000,0.2241,0.00791,0.00197,-0.0003,0.5702,0.6857],
    [2.250,0.2519,0.00795,0.00202,-0.0003,0.5591,0.6932],
    [2.500,0.2794,0.00801,0.00208,-0.0003,0.5469,0.7000],
    [2.750,0.3066,0.00807,0.00214,-0.0002,0.5338,0.7074],
    [3.000,0.3338,0.00815,0.00220,-0.0001,0.5169,0.7147],
    [3.250,0.3607,0.00823,0.00228,0.0001,0.4977,0.7219],
    [3.500,0.3879,0.00833,0.00237,0.0002,0.4822,0.7296],
    [3.750,0.4147,0.00843,0.00247,0.0003,0.4654,0.7370],
    [4.000,0.4412,0.00856,0.00258,0.0005,0.4445,0.7448],
    [4.250,0.4668,0.00876,0.00271,0.0009,0.4138,0.7524],
    [4.500,0.4907,0.00911,0.00289,0.0014,0.3656,0.7609],
    [4.750,0.5134,0.00957,0.00315,0.0021,0.3082,0.7690],
    [5.000,0.5357,0.01009,0.00346,0.0028,0.2535,0.7779],
    [5.250,0.5583,0.01058,0.00379,0.0035,0.2075,0.7869],
    [5.750,0.6033,0.01156,0.00449,0.0048,0.1278,0.8072],
    [6.000,0.6261,0.01199,0.00483,0.0054,0.1009,0.8181],
    [6.500,0.6731,0.01267,0.00548,0.0066,0.0706,0.8434],
    [6.750,0.6961,0.01301,0.00583,0.0073,0.0594,0.8578],
    [7.000,0.7189,0.01335,0.00618,0.0080,0.0500,0.8735],
    [7.250,0.7415,0.01369,0.00656,0.0088,0.0428,0.8911],
    [7.500,0.7640,0.01404,0.00694,0.0096,0.0375,0.9101],
    [7.750,0.7874,0.01444,0.00737,0.0102,0.0332,0.9297],
    [8.000,0.8141,0.01483,0.00781,0.0101,0.0300,0.9480],
    [8.250,0.8425,0.01534,0.00832,0.0094,0.0269,0.9638],
    [8.500,0.8729,0.01580,0.00883,0.0083,0.0248,0.9774],
    [8.750,0.9025,0.01636,0.00939,0.0073,0.0228,0.9892],
    [9.000,0.9323,0.01693,0.00999,0.0061,0.0214,0.9993],
    [9.250,0.9491,0.01738,0.01047,0.0077,0.0205,1.0000],
    [9.500,0.9650,0.01786,0.01099,0.0094,0.0196,1.0000],
    [9.750,0.9806,0.01841,0.01155,0.0111,0.0189,1.0000],
    [10.000,0.9936,0.01904,0.01220,0.0132,0.0183,1.0000],
    [10.250,1.0069,0.01966,0.01286,0.0151,0.0178,1.0000],
    [10.500,1.0212,0.02029,0.01355,0.0167,0.0173,1.0000],
    [10.750,1.0354,0.02099,0.01430,0.0182,0.0169,1.0000],
    [11.000,1.0492,0.02176,0.01512,0.0196,0.0164,1.0000],
    [11.250,1.0626,0.02261,0.01603,0.0208,0.0161,1.0000],
    [11.500,1.0754,0.02354,0.01701,0.0220,0.0158,1.0000],
    [11.750,1.0875,0.02457,0.01809,0.0231,0.0155,1.0000],
    [12.000,1.0986,0.02573,0.01930,0.0241,0.0152,1.0000],
    [12.250,1.1082,0.02704,0.02067,0.0250,0.0150,1.0000],
    [12.500,1.1159,0.02859,0.02227,0.0259,0.0147,1.0000],
    [12.750,1.1244,0.03010,0.02386,0.0267,0.0146,1.0000],
    [13.000,1.1337,0.03160,0.02545,0.0272,0.0144,1.0000],
    [13.250,1.1420,0.03322,0.02716,0.0278,0.0143,1.0000],
    [13.500,1.1495,0.03495,0.02897,0.0282,0.0141,1.0000],
    [13.750,1.1563,0.03679,0.03091,0.0285,0.0140,1.0000],
    [14.000,1.1620,0.03876,0.03297,0.0288,0.0139,1.0000],
    [14.250,1.1672,0.04083,0.03513,0.0290,0.0137,1.0000],
    [14.500,1.1716,0.04302,0.03741,0.0291,0.0136,1.0000],
    [14.750,1.1753,0.04532,0.03982,0.0290,0.0134,1.0000],
    [15.000,1.1783,0.04774,0.04233,0.0289,0.0132,1.0000],
    [15.250,1.1803,0.05033,0.04502,0.0286,0.0131,1.0000],
    [15.500,1.1813,0.05310,0.04788,0.0281,0.0129,1.0000],
    [15.750,1.1818,0.05603,0.05091,0.0275,0.0128,1.0000],
    [16.000,1.1811,0.05920,0.05418,0.0267,0.0127,1.0000],
    [16.250,1.1794,0.06258,0.05766,0.0258,0.0126,1.0000],
    [16.500,1.1767,0.06619,0.06137,0.0246,0.0125,1.0000],
    [16.750,1.1732,0.07002,0.06531,0.0233,0.0124,1.0000],
    [17.000,1.1685,0.07412,0.06951,0.0218,0.0124,1.0000],
    [17.250,1.1626,0.07847,0.07397,0.0201,0.0123,1.0000],
    [17.500,1.1558,0.08309,0.07871,0.0181,0.0122,1.0000],
    [17.750,1.1479,0.08799,0.08371,0.0160,0.0122,1.0000],
    [18.000,1.1388,0.09319,0.08903,0.0136,0.0121,1.0000],
    [18.250,1.1285,0.09868,0.09463,0.0111,0.0120,1.0000],
    [18.500,1.1175,0.10446,0.10053,0.0083,0.0120,1.0000],
    [18.750,1.1053,0.11060,0.10678,0.0052,0.0119,1.0000],
    [19.000,1.0921,0.11699,0.11329,0.0019,0.0119,1.0000],
    [19.250,1.0778,0.12380,0.12024,-0.0018,0.0119,1.0000]
    ];
}