function Tile (x, y, height, waterLvl) {
    this.props = {
        x: x,
        y: y,
        height: height,
        waterLvl: waterLvl,
        moisture: 0,
        moisture_old: 0,
        color: {},
        neighbors: [[null, null, null], [null, null, null], [null, null, null]],
        neighborsNumber: 0,
        neighborsHandled: 0,
        temperature: 1
    };


    this.reCalc = function() {
        if (this.props.height > this.props.waterLvl) {
            this.props.temperature = Math.exp((this.props.waterLvl - this.props.height) / 200);

            this.props.color.red = Math.round((240 - 120 * this.props.height / 255) * (1 - this.props.moisture));
            this.props.color.green = Math.round((230 - 180 * this.props.height / 255) * (1 - this.props.moisture));
            this.props.color.blue = Math.round((120 - 90 * this.props.height / 255) * (1 - this.props.moisture));
        } else if (this.props.height > this.props.waterLvl - 20) {
            this.props.color.red = Math.round(37 + (67 - 37) * (this.props.height - (this.props.waterLvl - 20)) / 20);
            this.props.color.green = Math.round(84 + (190 - 143) * (this.props.height - (this.props.waterLvl - 20)) / 20);
            this.props.color.blue = Math.round(132 + (165 - 132) * (this.props.height - (this.props.waterLvl - 20)) / 20);
        } else {
            this.props.color.red = 37;
            this.props.color.green = 84;
            this.props.color.blue = 132;
        }
    };

    this.countNeighbors = function() {
        var neighborsNumber = 0;

        for (var y = 0; y < 3; y++) {
            for (var x = 0; x < 3; x++) {
                if (this.props.neighbors[y][x] !== null) neighborsNumber++;
            }
        }

        return neighborsNumber;
    };


    this.get = function(prop) {
        return this.props[prop];
    };

    this.getRelevantMoisture = function() {
        this.props.neighborsHandled++;

        if (this.props.neighborsHandled > 0) {
            return this.props.moisture;
        } else {
            return this.props.moisture_old;
        }
    };

    this.setWaterLvl = function(value) {
        this.props.waterLvl = value;
    };

    this.setNeighbor = function(x, y, neighbor) {
        this.props.neighbors[y][x] = neighbor;
        this.props.neighborsNumber = this.countNeighbors();
    };

    this.step = function(time) {
        this.props.moisture_old = this.props.moisture;

        var diff = 0;
        var relevantMoisture;

        for (var y = 0; y < 3; y++) {
            for (var x = 0; x < 3; x++) {
                if (this.props.neighbors[y][x] !== null) {
                    relevantMoisture = this.props.neighbors[y][x].getRelevantMoisture();

                    if (this.props.height > this.props.waterLvl) {
                        diff += (Math.abs(x - 1) === Math.abs(y - 1) ? 0.7 : 1) *
                            (relevantMoisture - this.props.moisture) *
                            Math.exp(-Math.pow(this.props.neighbors[y][x].props.height - this.props.height, 2) / 200) * 2;
                    }
                }
            }
        }

        if (this.props.height <= this.props.waterLvl) {
            this.props.moisture = 1;
        } else {
            this.props.moisture += time * diff / 10;
            this.props.moisture *= 1 - time / 100 * this.props.temperature;
        }

        this.props.neighborsHandled -= this.props.neighborsNumber;

        this.reCalc();

        if (this.props.height > this.props.waterLvl) {
            if (Math.random() < time * 0.000001 * this.props.moisture * this.props.temperature) {
                Game.Vegetation.createPlant(this.props.x + 0.5, this.props.y + 0.5);
            }
        }

        this.reCalc();
    };


    this.log = function(message) {
        if (this.props.x === 20 && this.props.y === 0) console.log(message);
    }
}