function Terrain(ctx, terrain_name) {
    var that = this;

    this.props = {
        ctx: null,
        tileSize: 20,
        data: null,
        waterLvl: 60,
        tiles: [],
        worker: null,
        dataArray: null
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
            that.props.data = that.smoothTerrain(data);
            callback();
        }, 'json');
    };

    this.generateTerrain = function() {
        var tile;
        this.props.tiles = [];

        for (var y = 0; y < this.props.data.length; y++) {
            this.props.tiles[y] = [];

            for (var x = 0; x < this.props.data[y].length; x++) {
                tile = new Tile(x, y, this.props.data[y][x], this.props.waterLvl);

                if (x > 0) {
                    tile.setNeighbor(0, 1, this.props.tiles[y][x - 1]);
                    this.props.tiles[y][x - 1].setNeighbor(2, 1, tile);
                }
                if (y > 0) {
                    tile.setNeighbor(1, 0, this.props.tiles[y - 1][x]);
                    this.props.tiles[y - 1][x].setNeighbor(1, 2, tile);
                }
                if (x > 0 && y > 0) {
                    tile.setNeighbor(0, 0, this.props.tiles[y - 1][x - 1]);
                    this.props.tiles[y - 1][x - 1].setNeighbor(2, 2, tile);
                }
                if (y > 0 && x < 255) {
                    tile.setNeighbor(2, 0, this.props.tiles[y - 1][x + 1]);
                    this.props.tiles[y - 1][x + 1].setNeighbor(0, 2, tile);
                }

                this.props.tiles[y][x] = tile;
            }
        }
    };


    this.step = function (time) {
        for (var y = 0; y < this.props.tiles.length; y++) {
            for (var x = 0; x < this.props.tiles[y].length; x++) {
                this.props.tiles[y][x].setWaterLvl(this.props.waterLvl);
                this.props.tiles[y][x].step(time);
            }
        }
    };

    this.get = function (prop) {
        return this.props[prop];
    };

    this.set = function (prop, value) {
        return this.props[prop] = value;
    };


    this.loadData(terrain_name, function () {
        that.generateTerrain();
        Game.render();
    });



    this.speedTest = function(type) {
        var i = 0;

        var moistures = this.props.tiles.map(function(arr) {
            return arr.map(function(tile) {
                return tile.props.moisture;
            });
        });

        var heights = this.props.tiles.map(function(arr) {
            return arr.map(function(tile) {
                return tile.props.height;
            });
        });

        if (type === 'cpu') {

            var timer = new Timer();
            timer.step();

            for (var i = 0; i < 100; i++) {

                var moistures_old = $.extend(true, [], moistures);

                var diff = 0;
                for (var y = 0; y < 256; y++) {
                    for (var x = 0; x < 256; x++) {
                        diff = 0;

                        for (var y_rel = -1; y_rel <= 1; y_rel++) {
                            if (typeof moistures_old[y + y_rel] !== 'undefined') {
                                for (var x_rel = -1; x_rel <= 1; x_rel++) {
                                    if ((x_rel !== 0 || y_rel !== 0) && typeof moistures_old[y + y_rel][x + x_rel] !== 'undefined') {
                                        diff += (Math.abs(x_rel) === Math.abs(y_rel) ? 0.7 : 1) *
                                            (moistures_old[y + y_rel][x + x_rel] - moistures_old[y][x]);
                                    }
                                }
                            }
                        }

                        moistures[y][x] += diff / 10;
                    }
                }
            }

            timer.step();
            console.log(timer.get('all'));
            console.log(moistures);

        } else {

            var gpu = new GPU();
            var kernel = gpu.createKernel(function(time, moistures, heights, waterLvl) {
                var diff = 0;

                if (heights[this.thread.y][this.thread.x] <= waterLvl) return 1;

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

                return moistures[this.thread.y][this.thread.x] + time * diff / 10;
            }).setOutput([256, 256]).setOutputToTexture(true);

            var timer = new Timer();
            timer.step();

            for (var i = 0; i < 100; i++) {
                moistures = kernel(0.5, moistures, heights, this.props.waterLvl);
            }

            timer.step();
            console.log(timer.get('all'));
            console.log(moistures.toArray(gpu));

        }
    }
}