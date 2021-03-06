/* classes */

// Color constructor
class Color {
    constructor(r, g, b, a) {
            try {
                if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
                    throw "color component not a number";
                else if ((r < 0) || (g < 0) || (b < 0) || (a < 0))
                    throw "color component less than 0";
                else if ((r > 255) || (g > 255) || (b > 255) || (a > 255))
                    throw "color component bigger than 255";
                else {
                    this.r = r;
                    this.g = g;
                    this.b = b;
                    this.a = a;
                }
            } // end try
            catch (e) {
                console.log(e);
            }
        } // end Color constructor

    // Color change method
    change(r, g, b, a) {
            try {
                if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
                    throw "color component not a number";
                else if ((r < 0) || (g < 0) || (b < 0) || (a < 0))
                    throw "color component less than 0";
                else if ((r > 255) || (g > 255) || (b > 255) || (a > 255))
                    throw "color component bigger than 255";
                else {
                    this.r = r;
                    this.g = g;
                    this.b = b;
                    this.a = a;
                }
            } // end throw
            catch (e) {
                console.log(e);
            }
        } // end Color change method
} // end color class

// draw a pixel at x,y using color
function drawPixel(imagedata, x, y, color) {
    try {
        if ((typeof(x) !== "number") || (typeof(y) !== "number"))
            throw "drawpixel location not a number";
        else if ((x < 0) || (y < 0) || (x >= imagedata.width) || (y >= imagedata.height))
            throw "drawpixel location outside of image";
        else if (color instanceof Color) {
            var pixelindex = (y * imagedata.width + x) * 4;
            imagedata.data[pixelindex] = color.r;
            imagedata.data[pixelindex + 1] = color.g;
            imagedata.data[pixelindex + 2] = color.b;
            imagedata.data[pixelindex + 3] = color.a;
        } else
            throw "drawpixel color is not a Color";
    } // end try
    catch (e) {
        console.log(e);
    }
} // end drawPixel

// get the input spheres from the standard class URL
function getInputSpheres() {
    const INPUT_SPHERES_URL =
        "https://ncsucgclass.github.io/prog1/spheres.json";

    // load the spheres file
    var httpReq = new XMLHttpRequest(); // a new http request
    httpReq.open("GET", INPUT_SPHERES_URL, false); // init the request
    httpReq.send(null); // send the request
    var startTime = Date.now();
    while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
        if ((Date.now() - startTime) > 3000)
            break;
    } // until its loaded or we time out after three seconds
    if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE)) {
        console.log * ("Unable to open input spheres file!");
        return String.null;
    } else
        return JSON.parse(httpReq.response);
} // end get input spheres

function drawPixels(context) {
    var inputSpheres = getInputSpheres();
    var w = context.canvas.width;
    var h = context.canvas.height;
    var imagedata = context.createImageData(w, h);

    //const PIXEL_DENSITY = 0.1;
    //var numCanvasPixels = (w*h)*PIXEL_DENSITY;

    var eye = [0.5, 0.5, -0.5];
    var upperLeft = [0, 1, 0];
    var lowerLeft = [0, 0, 0];
    var upperRight = [1, 1, 0];
    var lowerRight = [1, 0, 0];
    var t = 0;
    if (inputSpheres != String.null) {
        for (var i = 0; i <= h; i++) {
            //Calculate left egde L at row r
            // Lr(t) = LL + t(UL - LL)
            var Lr = addArrays(lowerLeft, scalarMultiply(t, subtractArrays(upperLeft, lowerLeft)));
            //same for the right edge
            var Rr = addArrays(lowerRight, scalarMultiply(t, subtractArrays(upperRight, lowerRight)));
            t = t + 1 / (h - 1);
            var s = 0
            for (var j = 0; j <= w; j++) {
                var pixel = addArrays(Lr, scalarMultiply(s, subtractArrays(Rr, Lr)));
                s = s + 1 / (w - 1);
                var directionVector = subtractArrays(pixel, eye);
                //now we have the ray from the eye to the pixel. we need to find if the ray intersects any of the sphere.
                for (var k in inputSpheres) {
                    //Check for every sphere
                    var temp = inputSpheres[k];
                    var radius = temp.r;
                    var center = [temp.x, temp.y, temp.z];
                    //a = dot(D,D)
                    //b = 2*dot(D,(E-C))
                    //c = dot(E-C,E-C) - r^2
                    var a = dotProduct(directionVector, directionVector);
                    var b = 2 * dotProduct(directionVector, subtractArrays(eye, center));
                    var c = dotProduct(subtractArrays(eye, center), subtractArrays(eye, center)) - radius * radius;
                    // now we have a, b and c hence we can solve the discriminant
                    var closestRoot = calculateRoots(a, b, c);
                    if (closestRoot != null) {
                        var surface = addArrays(eye, scalarMultiply(closestRoot, directionVector));
                        //now since we have got an interesection we will calculate the color at this point using local illumination
                        //local illumination = ambient + diffuse + specular
                        //I = La Ka + Ld Kd (N*L) + Ls Ks (R*V)^n
                        // we have to calculate local illumination for each color, RGB.
                        //if( i == 256 && j == 256){
                        //  console.log("Eye" + eye + "root" + closestRoot + " direc " + surface);
                        //}
                        var local = calculateLocalIllumination(center, temp, surface, eye);

                        drawPixel(imagedata, j, i, new Color(
                            local[0] * 255,
                            local[1] * 255,
                            local[2] * 255,
                            255));
                        //console.log(localIllumination);
                        //drawPixel(imagedata, j, i, new Color(temp.diffuse[0] * 255, temp.diffuse[1] * 255, temp.diffuse[2] * 255, 255));

                    }

                }
            }
        }
    } // end for spheres
    context.putImageData(imagedata, 0, 0);
} // end if spheres found


function calculateLocalIllumination(center, sphere, surface, eye) {

    var res = [0, 0, 0];
    var sambient = sphere.ambient;
    var sdiffuse = sphere.diffuse;
    var sspecular = sphere.specular;
    var n = sphere.n;

    for (var i in lightDefinition) {
        var light = [lightDefinition[i].x, lightDefinition[i].y, lightDefinition[i].z];
        var lightColor = { ambient: lightDefinition[i].ambient, diffuse: lightDefinition[i].diffuse, specular: lightDefinition[i].specular};
        var N = normalizeVector(subtractArrays(surface, center));
        //console.log(surface);
        var L = normalizeVector(subtractArrays(light, surface));
        //console.log(L);
        var nl = dotProduct(N, L);
        if(nl < 0)
          nl = 0;
        var R = normalizeVector(subtractArrays(scalarMultiply(dotProduct(N, L), scalarMultiply(2, N)), L));
        var V = normalizeVector(subtractArrays(eye, surface));
        var rv = dotProduct(R, V);
        if(rv < 0)
          rv = 0;

        //calculate for rgb
        for (var j = 0; j < 3; j++) {
            //I = La Ka + Ld Kd (N*L) + Ls Ks (R*V)^n
            var ambient = sambient[j] * lightColor.ambient[j];
            var diffuse = sdiffuse[j] * lightColor.diffuse[j] * nl;
            var specular = sspecular[j] * lightColor.specular[j] * Math.pow(rv, n);
            var finalColor = ambient + diffuse + specular;
            res[j] += finalColor;
        }
    }
    for (var i = 0; i <= 2; i++) {
        if (res[i] > 1)
          res[i] = 1;
    }
    return res;
}

//lights array, more lights can be added
var lightDefinition = [{
    x: 2,
    y: 4,
    z: -0.5,
    ambient: [1, 1, 1],
    diffuse: [1, 1, 1],
    specular: [1, 1, 1]
}];

//find unit vector
function normalizeVector(x) {
    var denom = Math.sqrt(x[0] * x[0] + x[1] * x[1] + x[2] * x[2]);
    return [x[0] / denom, x[1] / denom, x[2] / denom];
}

//function to find discriminant
function calculateRoots(a, b, c) {
    var discriminant = ((b * b) - (4 * a * c));
    if (discriminant < 0) {
        return null;
    } else if (discriminant == 0) {
        return -b / (2 * a);
    } else {
        root1 = (0.5 / a) * (-b + Math.sqrt(discriminant));
        root2 = (0.5 / a) * (-b - Math.sqrt(discriminant));
        //we need to return the closest root.
        if (root1 < root2) {
            return root1;
        } else {
            return root2;
        }
    }
}

// separate function to handle addition of two arrays.
function addArrays(x, y) {
    return [x[0] + y[0], x[1] + y[1], x[2] + y[2]];
}

// separate function to handle subtraction of two arrays.
function subtractArrays(x, y) {
    return [x[0] - y[0], x[1] - y[1], x[2] - y[2]];
}

// separate function to scalar multiplication.
function scalarMultiply(x, y) {
    return [x * y[0], x * y[1], x * y[2]];
}

// separate function to calculate dot product of two arrays.
function dotProduct(x, y) {
    return x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
}

/* main -- here is where execution begins after window load */
function main() {

    // Get the canvas and context
    var canvas = document.getElementById("viewport");
    var context = canvas.getContext("2d");
    // shows how to draw pixels and read input file
    drawPixels(context);
}
