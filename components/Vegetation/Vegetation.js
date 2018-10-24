function Vegetation() {
    this.props = {
        plantDensity: [],
        plants: []
    };


    for (y = 0; y < 256; y++) {
        this.props.plantDensity[y] = [];
        this.props.plants[y] = [];

        for (x = 0; x < 256; x++) {
            this.props.plantDensity[y][x] = [0, 0];
            this.props.plants[y][x] = [0, 0, 0, 0, 0];
        }
    }


    this.kernelFunctions = {
        calcPlantPropability: function(time, gameTime, heights, moistures, plants) {
            if (heights[this.thread.y][this.thread.x] <= this.constants.waterLvl || plants[this.thread.y][this.thread.x][4] !== 0) return 0;

            var wideDensity = 0;
            var localDensity = 0;

            var temperature = Math.exp((this.constants.waterLvl - heights[this.thread.y][this.thread.x]) / 200);

            for (var y_rel = -2; y_rel <= 2; y_rel++) {
                if (this.thread.y + y_rel >= 0 && this.thread.y + y_rel < 256) {
                    for (var x_rel = -3; x_rel <= 3; x_rel++) {
                        if (this.thread.x + x_rel >= 0 && this.thread.x + x_rel < 256 && plants[this.thread.y + y_rel][this.thread.x + x_rel][4] !== 0) {
                            var energy = plants[this.thread.y + y_rel][this.thread.x + x_rel][4] * Math.exp(Math.log(2) * Math.sin(Math.exp(Math.log(2) * (gameTime - plants[this.thread.y + y_rel][this.thread.x + x_rel][2]) / plants[this.thread.y + y_rel][this.thread.x + x_rel][3]) * 3.14159));
                            wideDensity += energy * 2;
                        }
                    }
                }
            }

            for (var y_rel = -1; y_rel <= 1; y_rel++) {
                if (this.thread.y + y_rel >= 0 && this.thread.y + y_rel < 256) {
                    for (var x_rel = -1; x_rel <= 1; x_rel++) {
                        if (this.thread.x + x_rel >= 0 && this.thread.x + x_rel < 256 && plants[this.thread.y + y_rel][this.thread.x + x_rel][4] !== 0) {
                            localDensity += 1;
                        }
                    }
                }
            }

            var propability = (1 - Math.exp(Math.log(48 / 49) * wideDensity))
                * moistures[this.thread.y][this.thread.x]
                * temperature
                / (localDensity + 1);

            return (1 - Math.exp(Math.log(1 - propability) * time));
        },
        calcStartSeedPropability: function(x, y, heights, moistures) {
            if (heights[y][x] <= this.constants.waterLvl) return 0;

            var temperature = Math.exp((this.constants.waterLvl - heights[y][x]) / 200);

            return moistures[y][x] * temperature;
        },
        getTextureValue: function(texture, x, y) {
            return texture[y][x];
        }
    };

    this.kernels = {
        calcPlantPropability: Game.gpu.createKernel(this.kernelFunctions.calcPlantPropability, {
            output: [256, 256],
            constants: {
                waterLvl: Game.Terrain.props.waterLvl
            }
        }),
        calcStartSeedPropability: Game.gpu.createKernel(this.kernelFunctions.calcStartSeedPropability, {
            output: [1],
            constants: {
                waterLvl: Game.Terrain.props.waterLvl
            }
        }),
        getTextureValue: Game.gpu.createKernel(this.kernelFunctions.getTextureValue, {
            output: [1]
        })
    };


    this.createPlant = function(x, y) {
        var moisture = 1; // Performance...
        var temperature = Math.exp((Game.Terrain.props.waterLvl - Game.Terrain.props.tileHeights[y][x]) / 200);

        this.props.plants[y][x] = [
            Math.random(),
            Math.random(),
            Game.time,
            Helper.random(40, 80) * moisture * temperature,
            Helper.random(0.2, 0.5) * moisture * temperature
        ];
    };

    this.killPlant = function(x, y) {
        this.props.plants[y][x] = [0, 0, 0, 0, 0];
    };

    this.seedStartPlant = function() {
        var x = Helper.random(0, 255, true);
        var y = Helper.random(0, 255, true);

        var propability = this.kernels.calcStartSeedPropability(x, y, Game.Terrain.props.tileHeightsTexture, Game.Terrain.props.tileMoisturesTexture);

        if (Math.random() < propability) {
            this.startSeedCounter--;
            this.createPlant(x, y);
        }
    };

    this.initializePlants = function() {
        for (var i = 0; i < 50; i++) {
            this.seedStartPlant();
        }
    };

    this.step = function (time) {
        var plantPropability = this.kernels.calcPlantPropability(
            time,
            Game.time,
            Game.Terrain.props.tileHeightsTexture,
            Game.Terrain.props.tileMoisturesTexture,
            this.props.plants
        );

        for (var y = 0; y < 256; y++) {
            for (var x = 0; x < 256; x++) {
                if (this.props.plants[y][x][4] !== 0 && Game.time - this.props.plants[y][x][2] > this.props.plants[y][x][3]) {
                    this.killPlant(x, y);
                } else if (plantPropability[y][x] !== 0 && plantPropability[y][x] > Helper.random(0, 1)) {
                    this.createPlant(x, y);
                }
            }
        }
    };

    this.testPlant = function() {
        var x, y;

        this.props.plants[0][55] = [0.5, 0.5, Game.time, 15, 0.1];

        for (y = 0; y <= 3; y++) {
            for (x = 52; x <= 58; x++) {
                this.props.plantDensity[y][x][1]++;
            }
        }

        for (y = 0; y <= 1; y++) {
            for (x = 54; x <= 56; x++) {
                this.props.plantDensity[y][x][0]++;
            }
        }
    };
}