
function sigmoid(val, f_max, k, x_0) {
	return f_max / (1 + Math.exp(-1 * k * (val - x_0)));
}
function average(array, max) {
    if(typeof max === 'undefined')
        max = array.length;
    if (array.length == 0)
        return NaN;

    let length = Math.min(array.length, max);
    let sum = 0;
    for (let i = 0; i <length; i++) {
        sum += array[i];
    }
    return (sum / length);
}


function coefficientOfVariation(arr, max){
    let normFactor = average(arr,max);
    return 100 * stddev(arr,max)/normFactor;
}
function stddev(array, max) {
    if(typeof max === 'undefined')
        max = array.length;
    if (array.length == 0)
        return NaN;
    
    let N = Math.min(array.length, max); 
    let u = average(array,max);
    let diffsquare =  0;

    for(let i = 0; i < N; i ++){
        diffsquare += Math.pow(array[i]- u, 2);
    }
    let variance = diffsquare * (1/N);

    return Math.sqrt(variance);
}


function normalizeValues(data) {
    let max = Math.max.apply(Math, data);
    for (let i = 0; i < data.length; i++) {
        if (max != 0) {
            data[i] /= max;
        }
    }
    return data;
}


function linearLeastSquares(data) {
    let xsum = 0, ysum = 0, xx = 0, xy = 0;
    let xmin = Infinity, xmax = -Infinity;
    for (let i = 0; i < data.length; i++) {
        let x = data[i]["x"];
        let y = data[i]["y"];

        if (x < xmin) {
            xmin = x;
        }
        if (x > xmax) {
            xmax = x;
        }
        xsum += x;
        ysum += y;
        xx += (x * x);
        xy += (x * y);
    }
    let N = data.length;
    let slope = (N * xy - (xsum * ysum));
    slope /= ((N * xx) - (xsum * xsum));
    let intercept = (ysum - slope * xsum) / N;

    let f = x => slope * x + intercept;

    return [{ "x": xmin, "y": f(xmin) }, { "x": xmax, "y": f(xmax) }];
}


//less sensitive to outliers
function leastMeanSquares(data){

}


function leastTrimmedSquares(data){


}