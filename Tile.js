function Tile (x, y, height, waterLvl, waterDistance) {
    var props = {
        x: x,
        y: y,
        height: height,
        waterLvl: waterLvl,
        waterDistance: waterDistance,
        moisture: 0,
        moisture_old: 0,
        color: {},
        neighbors: [[null, null, null], [null, null, null], [null, null, null]],
        neighborsNumber: 0,
        neighborsHandled: 0
    };

    calcColor();


    function calcColor() {
        if (height > waterLvl) {
            props.color.red = Math.round((225 - 110 * Math.pow(height / 255, 2)) * (1 - props.moisture));
            props.color.green = Math.round((209 - 209 * Math.pow(height / 255, 2)) * (1 - props.moisture));
            props.color.blue = Math.round((101 - 101 * Math.pow(height / 255, 2)) * (1 - props.moisture));
        } else if (height > waterLvl - 20) {
            props.color.red = Math.round(37 + (67 - 37) * (height - (waterLvl - 20)) / 20);
            props.color.green = Math.round(84 + (190 - 143) * (height - (waterLvl - 20)) / 20);
            props.color.blue = Math.round(132 + (165 - 132) * (height - (waterLvl - 20)) / 20);
        } else {
            props.color.red = 37;
            props.color.green = 84;
            props.color.blue = 132;
        }
    }

    function countNeighbors() {
        var neighborsNumber = 0;

        for (var y = 0; y < 3; y++) {
            for (var x = 0; x < 3; x++) {
                if (props.neighbors[y][x] !== null) neighborsNumber++;
            }
        }

        return neighborsNumber;
    }


    this.get = function(prop) {
        return props[prop];
    };

    this.getRelevantMoisture = function() {
        props.neighborsHandled++;

        if (props.neighborsHandled > 0) {
            return props.moisture;
        } else {
            return props.moisture_old;
        }
    };

    this.setWaterLvl = function(value) {
        waterLvl = value;
        calcColor();
    };

    this.setWaterDistance = function(value) {
        waterDistance = value;
    };

    this.setNeighbor = function(x, y, neighbor) {
        props.neighbors[y][x] = neighbor;
        props.neighborsNumber = countNeighbors();
    };

    this.step = function(time) {
        props.moisture_old = props.moisture;

        var diff = 0;
        var relevantMoisture;

        for (var y = 0; y < 3; y++) {
            for (var x = 0; x < 3; x++) {
                if (props.neighbors[y][x] !== null) {
                    relevantMoisture = props.neighbors[y][x].getRelevantMoisture();

                    if (props.height > props.waterLvl) {
                        diff += (Math.abs(x - 1) === Math.abs(y - 1) ? 0.7 : 1) *
                            (relevantMoisture - props.moisture) *
                            Math.exp((props.neighbors[y][x].get('height') - props.height) / 50);
                    }
                }
            }
        }

        if (props.height <= props.waterLvl) {
            props.moisture = 1;
        } else {
            props.moisture += time * diff / 10;
        }

        props.neighborsHandled -= props.neighborsNumber;

        calcColor();
    };


    function log(message) {
        if (x === 20 && y === 0) console.log(message);
    }
}