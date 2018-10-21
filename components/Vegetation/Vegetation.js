function Vegetation() {
    var x, y;

    this.props = {
        plants: {
            byTile: [],
            unsorted: []
        },
        plantDensity: [],
        plantDensityArray: [],
        plantsArray: []
    };


    for (y = 0; y < 256; y++) {
        this.props.plants.byTile[y] = [];
        this.props.plantDensity[y] = [];

        for (x = 0; x < 256; x++) {
            this.props.plants.byTile[y][x] = [];
            this.props.plantDensity[y][x] = 0;
        }
    }


    for (y = 0; y < 256; y++) {
        this.props.plantDensityArray[y] = [];
        this.props.plantsArray[y] = [];

        for (x = 0; x < 256; x++) {
            this.props.plantDensityArray[y][x] = [0, 0];
            this.props.plantsArray[y][x] = [0, 0, 0, 0, 0];
        }
    }


    this.kernelFunctions = {
        calcPlantPropability: function(time, gameTime, heights, moistures, plants) {
            if (heights[this.thread.y][this.thread.x] <= this.constants.waterLvl || plants[this.thread.y][this.thread.x][4] !== 0) return 0;

            var wideDensity = 0;
            var localDensity = 0;

            var temperature = Math.exp((this.constants.waterLvl - heights[this.thread.y][this.thread.x]) / 200);

            for (var y_rel = -3; y_rel <= 3; y_rel++) {
                if (this.thread.y + y_rel >= 0 && this.thread.y + y_rel < 256) {
                    for (var x_rel = -3; x_rel <= 3; x_rel++) {
                        if (this.thread.x + x_rel >= 0 && this.thread.x + x_rel < 256 && plants[this.thread.y + y_rel][this.thread.x + x_rel][4] !== 0) {
                            var energy = plants[this.thread.y + y_rel][this.thread.x + x_rel][4] * Math.exp(Math.log(2) * Math.sin(Math.exp(Math.log(2) * (gameTime - plants[this.thread.y + y_rel][this.thread.x + x_rel][2]) / plants[this.thread.y + y_rel][this.thread.x + x_rel][3]) * 3.14159));
                            wideDensity += energy * 10;
                        }
                    }
                }
            }

            for (var y_rel = -1; y_rel <= 1; y_rel++) {
                if (this.thread.y + y_rel >= 0 && this.thread.y + y_rel < 256) {
                    for (var x_rel = -1; x_rel <= 1; x_rel++) {
                        if (this.thread.x + x_rel >= 0 && this.thread.x + x_rel < 256 && plants[this.thread.y + y_rel][this.thread.x + x_rel][4] !== 0) {
                            var energy = plants[this.thread.y + y_rel][this.thread.x + x_rel][4] * Math.exp(Math.log(2) * Math.sin(Math.exp(Math.log(2) * (gameTime - plants[this.thread.y + y_rel][this.thread.x + x_rel][2]) / plants[this.thread.y + y_rel][this.thread.x + x_rel][3]) * 3.14159));
                            localDensity += energy * 10;
                        }
                    }
                }
            }

            var propability = (1 - Math.exp(Math.log(48 / 49) * wideDensity))
                * moistures[this.thread.y][this.thread.x]
                * moistures[this.thread.y][this.thread.x]
                * temperature
                / (localDensity + 1);

            return (1 - Math.exp(Math.log(1 - propability) * time));
        }
    };

    this.kernels = {
        calcPlantPropability: Game.gpu.createKernel(this.kernelFunctions.calcPlantPropability, {
            output: [256, 256],
            constants: {
                waterLvl: Game.Terrain.props.waterLvl
            }
        })
    };


    this.createPlant = function (x, y) {
        var tile_x = Math.floor(x);
        var tile_y = Math.floor(y);

        if (typeof this.props.plants.byTile[tile_y] === 'undefined' || typeof this.props.plants.byTile[tile_y][tile_x] === 'undefined') return;

        if (Game.Terrain.props.tiles[tile_y][tile_x].props.height > Game.Terrain.props.waterLvl) {
            for (var neighbor_y = tile_y - 1; neighbor_y <= tile_y + 1; neighbor_y++) {
                for (var neighbor_x = tile_x - 1; neighbor_x <= tile_x + 1; neighbor_x++) {
                    if (typeof this.props.plantDensity[neighbor_y] !== 'undefined' && typeof this.props.plantDensity[neighbor_y][neighbor_x] !== 'undefined') {
                        this.props.plantDensity[neighbor_y][neighbor_x]++;
                    }
                }
            }
            this.props.plantDensity[tile_y][tile_x]++;

            var plant = new Plant(x, y, Game.Terrain.props.tiles[tile_y][tile_x]);
            this.props.plants.unsorted.push(plant);
            this.props.plants.byTile[tile_y][tile_x].push(plant);
        }
    };

    this.seedPlant = function (x, y) {
        var tile_x = Math.floor(x);
        var tile_y = Math.floor(y);

        if (typeof this.props.plants.byTile[tile_y] === 'undefined' || typeof this.props.plants.byTile[tile_y][tile_x] === 'undefined') return;

        var tile = Game.Terrain.props.tiles[tile_y][tile_x];

        if (Math.random() < 0.2 * tile.props.moisture * tile.props.temperature / this.props.plantDensity[tile_y][tile_x]) {
            this.createPlant(x, y);
        }
    };

    this.killPlant = function(plant) {
        var tile_x = Math.floor(plant.props.x);
        var tile_y = Math.floor(plant.props.y);

        for (var neighbor_y = tile_y - 1; neighbor_y <= tile_y + 1; neighbor_y++) {
            for (var neighbor_x = tile_x - 1; neighbor_x <= tile_x + 1; neighbor_x++) {
                if (typeof this.props.plantDensity[neighbor_y] !== 'undefined' && typeof this.props.plantDensity[neighbor_y][neighbor_x] !== 'undefined') {
                    this.props.plantDensity[neighbor_y][neighbor_x]--;
                }
            }
        }
        this.props.plantDensity[tile_y][tile_x]--;

        for (var i = 0; i < this.props.plants.byTile[tile_y][tile_x].length; i++) {
            if (this.props.plants.byTile[tile_y][tile_x][i] === plant) {
                this.props.plants.byTile[tile_y][tile_x].splice(i, 1);
                break;
            }
        }

        for (var i = 0; i < this.props.plants.unsorted.length; i++) {
            if (this.props.plants.unsorted[i] === plant) {
                this.props.plants.unsorted.splice(i, 1);
                break;
            }
        }
    };

    this.get = function (prop) {
        return this.props[prop];
    };

    this.step = function (time) {
        var plantPropability = this.kernels.calcPlantPropability(
            time,
            Game.time,
            Game.Terrain.props.tileHeightsTexture,
            Game.Terrain.props.tileMoisturesTexture,
            this.props.plantsArray
        );

        for (var y = 0; y < 256; y++) {
            for (var x = 0; x < 256; x++) {
                if (this.props.plantsArray[y][x][4] !== 0 && Game.time - this.props.plantsArray[y][x][2] > this.props.plantsArray[y][x][3]) {
                    this.props.plantsArray[y][x] = [0, 0, 0, 0, 0];
                } else if (plantPropability[y][x] > 0.001 && plantPropability[y][x] > Math.random()) {
                    this.props.plantsArray[y][x] = [Math.random(), Math.random(), Game.time, 15, 0.1];
                }
            }
        }
    };

    this.testPlant = function() {
        var x, y;

        this.props.plantsArray[0][55] = [0.5, 0.5, Game.time, 15, 0.1];

        for (y = 0; y <= 3; y++) {
            for (x = 52; x <= 58; x++) {
                this.props.plantDensityArray[y][x][1]++;
            }
        }

        for (y = 0; y <= 1; y++) {
            for (x = 54; x <= 56; x++) {
                this.props.plantDensityArray[y][x][0]++;
            }
        }
    };
}