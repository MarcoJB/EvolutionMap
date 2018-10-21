function Terrain(ctx, terrain_name) {
    var that = this;

    this.props = {
        ctx: null,
        tileSize: 20,
        data: null,
        waterLvl: 60,
        worker: null,
        tileMoistures: [],
        tileMoisturesTexture: null,
        tileHeights: [],
        tileHeightsTexture: null,
        tilePlantDensity: [],
        tilePlantPropability: []
    };


    this.kernelFunctions = {
        stepMoisture: function(time, moistures, heights) {
            var diff = 0;

            if (heights[this.thread.y][this.thread.x] <= this.constants.waterLvl) return 1;

            var temperature = Math.exp((this.constants.waterLvl - heights[this.thread.y][this.thread.x]) / 200);

            for (var y_rel = -1; y_rel <= 1; y_rel++) {
                if (this.thread.y + y_rel >= 0 && this.thread.y + y_rel < 256) {
                    for (var x_rel = -1; x_rel <= 1; x_rel++) {
                        if (this.thread.x + x_rel >= 0 && this.thread.x + x_rel < 256 && (x_rel !== 0 || x_rel !== 0)) {
                            diff += (moistures[this.thread.y + y_rel][this.thread.x + x_rel] - moistures[this.thread.y][this.thread.x]) *
                                Math.exp(-Math.pow(heights[this.thread.y + y_rel][this.thread.x + x_rel] - heights[this.thread.y][this.thread.x], 2) / 200) * 2;
                        }
                    }
                }
            }

            return (moistures[this.thread.y][this.thread.x] + time * diff / 10) * (1 - time / 100 * temperature);
        },
        heightsToTexture: function(heights) {
            return heights[this.thread.y][this.thread.x];
        }
    };

    this.kernels = {
        stepMoisture: Game.gpu.createKernel(this.kernelFunctions.stepMoisture, {
            constants: {
                waterLvl: this.props.waterLvl
            },
            output: [256, 256],
            outputToTexture: true
        }),
        heightsToTexture: Game.gpu.createKernel(this.kernelFunctions.heightsToTexture, {
            output: [256, 256],
            outputToTexture: true
        })
    };


    this.smoothTerrain = function(data) {
        var res = [];

        for (var y = 0; y < 256; y++) {
            res[y] = [];

            for (var x = 0; x < 256; x++) {
                res[y][x] = 0.5 * data[y][x] +
                    0.075 * (
                        data[y > 0 ? y - 1 : 0][x] +
                        data[y < 255 ? y + 1 : 255][x] +
                        data[y][x > 0 ? x - 1 : 0] +
                        data[y][x < 255 ? x + 1 : 255]
                    ) +
                    0.05 * (
                        data[y > 0 ? y - 1 : 0][x > 0 ? x - 1 : 0] +
                        data[y < 255 ? y + 1 : 255][x > 0 ? x - 1 : 0] +
                        data[y > 0 ? y - 1 : 0][x < 255 ? x + 1 : 255] +
                        data[y < 255 ? y + 1 : 255][x < 255 ? x + 1 : 255]
                    )
            }
        }

        return res;
    };

    this.loadData = function(terrain_name, callback) {
        $.get('terrain/' + terrain_name + '.json', function (data) {
            that.props.tileHeights = that.smoothTerrain(data);
            callback();
        }, 'json');
    };


    this.generateTerrain = function() {
        for (var y = 0; y < this.props.tileHeights.length; y++) {
            this.props.tileMoistures[y] = [];
            this.props.tilePlantDensity[y] = [];

            for (var x = 0; x < this.props.tileHeights[y].length; x++) {
                this.props.tileMoistures[y][x] = 0;
                this.props.tilePlantDensity[y][x] = 0;
            }
        }

        this.props.tileHeightsTexture = this.kernels.heightsToTexture(this.props.tileHeights);
        this.props.tileMoisturesTexture = this.kernels.stepMoisture(0.1, this.props.tileMoistures, this.props.tileHeightsTexture);
    };


    this.step = function (time) {
        this.props.tileMoisturesTexture = this.kernels.stepMoisture(time, this.props.tileMoisturesTexture, this.props.tileHeightsTexture);
    };


    this.loadData(terrain_name, function () {
        that.generateTerrain();
        Game.render();
    });
}