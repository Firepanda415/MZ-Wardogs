// Exploratory fit of game sight labels; not used by the calculator.
// Run: node docs/mortar-curve-fit.mjs
import assert from 'node:assert/strict';
import { mortarScale } from '../core.mjs';

function quadratic(points) {
  const matrix = Array.from({length:3}, (_,i) => [
    ...Array.from({length:3}, (_,j) => points.reduce((sum,[x]) => sum+x**(i+j),0)),
    points.reduce((sum,[x,y]) => sum+y*x**i,0),
  ]);
  for (let i=0; i<3; i++) {
    let pivot=i;
    for (let j=i+1; j<3; j++) if (Math.abs(matrix[j][i])>Math.abs(matrix[pivot][i])) pivot=j;
    [matrix[i],matrix[pivot]]=[matrix[pivot],matrix[i]];
    const divisor=matrix[i][i];
    assert.ok(Math.abs(divisor)>1e-12, 'Fit requires independent inputs');
    matrix[i]=matrix[i].map(value=>value/divisor);
    for (let j=0; j<3; j++) if (j!==i) {
      const factor=matrix[j][i];
      matrix[j]=matrix[j].map((value,k)=>value-factor*matrix[i][k]);
    }
  }
  const coefficients=matrix.map(row=>row[3]);
  return {coefficients, predict:x=>coefficients[0]+coefficients[1]*x+coefficients[2]*x*x};
}

// Check the solver against a known quadratic independently of the game data.
const known=quadratic([0,.2,.4,.6,.8,1].map(x=>[x,3-2*x+4*x*x]));
known.coefficients.forEach((value,i)=>assert.ok(Math.abs(value-[3,-2,4][i])<1e-9));

const points=mortarScale.map(([range,mil])=>[mil/1000,range]);
for (const limit of [850,950]) {
  const train=points.filter(([x])=>x*1000<=limit);
  const fit=quadratic(train);
  const errors=train.map(([x,y])=>fit.predict(x)-y);
  console.log({milInterval:[150,limit],points:train.length,coefficientsForMilDividedBy1000:fit.coefficients,
    rmseMeters:Math.sqrt(errors.reduce((sum,e)=>sum+e*e,0)/errors.length),
    maxErrorMeters:Math.max(...errors.map(Math.abs))});
  console.table([850,900,950].map(mil=>({mil,observed:mortarScale.find(p=>p[1]===mil)[0],predicted:fit.predict(mil/1000)})));
}
