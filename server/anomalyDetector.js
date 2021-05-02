class anomalyDetector {
    constructor(query, body, model) {
        this.model = model;
        this.model_type = Object.values(query)[0];
        this.threshold = 0.9;
        this.correlatedFeatures = [];
        this.anomalyReports = [];
        this.columnLen = Object.keys(body).length;

    }

    async learn(body, keys) {
        var vals = [];
        var len = body[keys[0]].length;
        var i;
        for (i = 0; i < keys.length; i++)
            vals[i] = [];
        for (i = 0; i < keys.length; i++) {
            let x = body[keys[i]];
            for (let j = 0; j < len; j++) {
                vals[i][j] = x[j];
            }
        }

        for (i = 0; i < keys.length; i++) {
            let f1 = keys[i];
            let max = 0;
            let jmax = 0;
            for (let j = i + 1; j < keys.length; j++) {
                let p = Math.abs(pearson(vals[i], vals[j], len));
                if (p > max) {
                    max = p;
                    jmax = j;
                }
            }
            let f2 = keys[jmax];
            var ps = this.toPoints(body[f1], body[f2]);

            this.regressionLearnHelper(body, keys, max, f1, f2, ps);
            if (this.model_type.localeCompare("hybrid") === 0)
                this.hybridLearnHelper(body, keys, max, f1, f2, ps);
        }
    }

    regressionLearnHelper(body, keys, p/*pearson*/, f1, f2, ps) {
        if (p > this.threshold) {
            let len = body[keys[0]].length;
            var c = {
                feature1: f1,
                feature2: f2,
                corrlation: p,
                lin_reg: linear_reg(ps, len),
            };
            c.threshold = this.findThreshold(ps, len, c.lin_reg) * 1.1
            this.correlatedFeatures.push(c);
        }
    }


    hybridLearnHelper(body, keys, p/*pearson*/, f1, f2, ps) {
        // this.regressionLearnHelper(body,keys, p/*pearson*/, f1, f2, ps);
        if (p > 0.5 && p < this.threshold) {
            const enclosingCircle = require('smallest-enclosing-circle')
            const circle = enclosingCircle(ps);
            let c = {
                feature1: f1,
                feature2: f2,
                corrlation: p,
                threshold: circle.r * 1.1, // 10% increase
                cx: circle.x,
                cy: circle.y,
            };
            this.correlatedFeatures.push(c)

        }

    }

    async detect(body) {
        for (let i = 0; i < this.correlatedFeatures.length; i++) {
            var x = body[this.correlatedFeatures[i].feature1];
            var y = body[this.correlatedFeatures[i].feature2];
            for (let j = 0; j < x.length; j++) {
                if (this.isAnomalous(x[j], y[j], this.correlatedFeatures[i])) {
                    let d = this.correlatedFeatures[i].feature1 + "," + this.correlatedFeatures[i].feature2;
                    let ar = {
                        description: d,
                        timeStep: j + 1
                    };
                    this.anomalyReports.push(ar);
                }
            }
        }
    }

    isAnomalous(x, y, c) {
        if (this.model_type.localeCompare("hybrid") === 0)
            if ((c.corrlation >= this.threshold && Math.abs(y - c.lin_reg.f(x)) > c.threshold) ||
                (c.corrlation > 0.5 && c.corrlation < this.threshold && dist(new Point(c.cx, c.cy), new Point(x, y)) > c.threshold))
                return true;
            else
                return false;
        else if (Math.abs(y - c.lin_reg.f(x)) > c.threshold)
            return true;
        else
            return false;
    }

    findThreshold(ps, len, rl) {
        let max = 0;
        for (let i = 0; i < len; i++) {
            let d = Math.abs(ps[i].y - rl.f(ps[i].x));
            if (d > max)
                max = d;
        }
        return max;
    }

    toPoints(x, y) {
        var ps = [];
        for (let i = 0; i < x.length; i++) {
            ps[i] = new Point(x[i], y[i]);
        }
        return ps;
    }


}

module.exports = anomalyDetector;

function dist(a, b) {
    let x2 = (a.x - b.x) * (a.x - b.x);
    let y2 = (a.y - b.y) * (a.y - b.y);
    return Math.sqrt(x2 + y2);
}


class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Line {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }

    f(x) {
        return this.a * x + this.b;
    }
}

class Circle {
    constructor(point, radius) {
        this.center = new Point(point.x, point.y);
        this.radius = radius;
    }

}

function avg(x, size) {
    let sum = 0;
    for (let i = 0; i < size; i++) {
        sum += x[i];
    }
    return sum / size;
}

// returns the variance of X and Y
function variance(x, size) {
    let sum1 = 0, avg1 = 0, avg2 = 0;
    for (let i = 0; i < size; i++) {
        sum1 += Math.pow(x[i], 2);
    }
    avg1 = sum1 / size;
    avg2 = avg(x, size);
    return avg1 - Math.pow(avg2, 2);
}

// returns the covariance of X and Y
function cov(x, y, size) {
    let cov = 0, sum = 0;
    // getting the average of X and Y
    let Ex = avg(x, size);
    let Ey = avg(y, size);
    for (let i = 0; i < size; i++) {
        sum += (x[i] - Ex) * (y[i] - Ey);
    }
    cov = sum / size;
    return cov;
}

// returns the Pearson correlation coefficient of X and Y
function pearson(x, y, size) {
    let sigmaX = Math.sqrt(variance(x, size));
    let sigmaY = Math.sqrt(variance(y, size));
    return cov(x, y, size) / (sigmaX * sigmaY);
}

// performs a linear regression and returns the line equation
function linear_reg(points, size) {
    // creating arrays of each coordinate
    let coorX = [];
    let coorY = [];
    for (let i = 0; i < size; i++) {
        coorX[i] = points[i].x;
        coorY[i] = points[i].y;
    }
    // getting the average of X and Y
    let avgX = avg(coorX, size);
    let avgY = avg(coorY, size);
    // getting the "a" and "b" of the line equation
    let a = cov(coorX, coorY, size) / variance(coorX, size);
    let b = avgY - a * avgX;

    return new Line(a, b);
}

// returns the deviation between point p and the line equation of the points
function dev(p, points, size) {
    // initializng a line from the given points
    let line = linear_reg(points, size);
    // getting the y coordinate of the given x on the line
    let fx = line.f(p.x);
    // getting the deviation
    let dev = Math.abs(p.y - fx);
    return dev;
}

// returns the deviation between point p and the line
function dev(p, l) {
    let fx = l.f(p.x);
    let dev = Math.abs(p.y - fx);
    return dev;
}

