var Game = {
    ctx: null,
    init: function(terrain_name) {
        this.ctx = $('#map #terrain')[0].getContext('2d');

        this.Terrain.init(this.ctx, terrain_name);
        this.Interaction.init();
        this.Renderer.init(this.ctx);
    },
    step: function(time) {
        this.Terrain.step(time);
        this.Renderer.render(this.Terrain.tiles, this.Interaction.origin, this.Interaction.zoomLvl);
    },
    render: function() {
        this.Renderer.render(this.Terrain.tiles, this.Interaction.origin, this.Interaction.zoomLvl);
    },
    Terrain: {
        ctx: null,
        tileSize: 20,
        data: null,
        waterLvl: 60,
        tiles: [],
        worker: null,
        dataArray: null,
        init: function(ctx, terrain_name) {
            var that = this;

            this.ctx = ctx;
            $('#map canvas').attr('width', $('#map canvas').height()).attr('height', $('#map canvas').height());

            this.dataArray = new Uint8ClampedArray(262144);

            this.loadData(terrain_name, function() {
                that.generateTerrain();
                Game.render();
            });
        },
        step: function(time) {
            for (var y in this.tiles) {
                for (var x in this.tiles[y]) {
                    this.tiles[y][x].step(time);
                }
            }
        },
        render: function() {
            this.updateTerrain();
        },
        loadData: function(terrain_name, callback) {
            var that = this;

            $.get('terrain/' + terrain_name + '.json', function(data) {
                that.data = that.smoothTerrain(data);
                callback();
            }, 'json');
        },
        smoothTerrain: function(data) {
            var res = [];

            for (var y = 0; y < 256; y++) {
                res[y] = [];

                for (var x = 0; x < 256; x++) {
                    res[y][x] = 0.5 * data[y][x] +
                        0.075 * (data[y>0?y-1:0][x] + data[y<255?y+1:255][x] + data[y][x>0?x-1:0] + data[y][x<255?x+1:255]) +
                        0.05 * (data[y>0?y-1:0][x>0?x-1:0] + data[y<255?y+1:255][x>0?x-1:0] + data[y>0?y-1:0][x<255?x+1:255] + data[y<255?y+1:255][x<255?x+1:255])
                }
            }

            return res;
        },
        generateTerrain: function() {
            var tile;
            this.tiles = [];

            for (var y = 0; y < this.data.length; y++) {
                this.tiles[y] = [];

                for (var x = 0; x < this.data[y].length; x++) {
                    tile = new Tile(x, y, this.data[y][x], this.waterLvl, this.calcWaterDistance(x, y));

                    if (x > 0) {
                        tile.setNeighbor(0, 1, this.tiles[y][x - 1]);
                        this.tiles[y][x - 1].setNeighbor(2, 1, tile);
                    }
                    if (y > 0) {
                        tile.setNeighbor(1, 0, this.tiles[y - 1][x]);
                        this.tiles[y - 1][x].setNeighbor(1, 2, tile);
                    }
                    if (x > 0 && y > 0) {
                        tile.setNeighbor(0, 0, this.tiles[y - 1][x - 1]);
                        this.tiles[y - 1][x - 1].setNeighbor(2, 2, tile);
                    }
                    if (y > 0 && x < 255) {
                        tile.setNeighbor(2, 0, this.tiles[y - 1][x + 1]);
                        this.tiles[y - 1][x + 1].setNeighbor(0, 2, tile);
                    }

                    this.tiles[y][x] = tile;
                }
            }
        },
        updateTerrain: function() {
            var x, y;

            for (y = 0; y < this.data.length; y++) {
                for (x = 0; x < this.data[y].length; x++) {
                    tile = this.tiles[y][x];
                    tile.setWaterLvl(this.waterLvl);
                }
            }
        },
        calcWaterDistance: function(x, y, maxDistance) {
            if (typeof maxDistance === 'undefined') maxDistance = 50;
            if (this.data[y][x] <= this.waterLvl) return 0;

            var checkDistance, i;

            for (checkDistance = 1; checkDistance < maxDistance; checkDistance++) {
                for (i = 0; i < checkDistance; i++) {
                    if (x + (checkDistance - i) < 256 && y + i < 256 && this.data[y + i][x + (checkDistance - i)] <= this.waterLvl) return checkDistance;
                    if (x - i >= 0 && y + (checkDistance - i) < 256 && this.data[y + (checkDistance - i)][x - i] <= this.waterLvl) return checkDistance;
                    if (x - (checkDistance - i) >= 0 && y - i >= 0 && this.data[y - i][x - (checkDistance - i)] <= this.waterLvl) return checkDistance;
                    if (x + i < 256 && y - (checkDistance - i) >= 0 && this.data[y - (checkDistance - i)][x + i] <= this.waterLvl) return checkDistance;
                }
            }

            return maxDistance;
        }
    },
    Interaction: {
        zoomLvl: 0,
        dragging: false,
        startPos: {},
        origin: {
            x: 0,
            y: 0
        },
        init: function() {
            var that = this;

            $('#map canvas').on('wheel', function(e) {
                that.zoom(Math.sign(e.originalEvent.deltaY), e.originalEvent.layerX / 3, e.originalEvent.layerY / 3);
            });

            $('#map').on('mousedown', function(e) {
                that.onInteractionStart(e);
            });
            $(window).on('mouseup', function(e) {
                that.onInteractionEnd(e);
            }).on('mousemove', function(e) {
                that.onInteractionMove(e);
            });
        },
        zoom: function(direction, x, y) {
            var scaleFactor = Math.pow(2, this.zoomLvl);
            var cursor = {
                before: {
                    "x": x / scaleFactor,
                    "y": y / scaleFactor
                }
            };

            this.zoomLvl -= direction * 0.2;
            if (this.zoomLvl < 0) this.zoomLvl = 0;
            scaleFactor = Math.pow(2, this.zoomLvl);

            cursor.after = {
                "x": x / scaleFactor,
                "y": y / scaleFactor
            };

            this.origin.x += cursor.before.x - cursor.after.x;
            this.origin.y += cursor.before.y - cursor.after.y;

            Game.render();
        },
        onInteractionStart: function(e) {
            this.dragging = true;
            this.startPos.x = e.screenX;
            this.startPos.y = e.screenY;
            $('html').addClass('grabbing');
        },
        onInteractionEnd: function(e) {
            this.dragging = false;
            $('html').removeClass('grabbing');
        },
        onInteractionMove: function(e) {
            if (this.dragging) {
                var scaleFactor = Math.pow(2, this.zoomLvl);

                this.origin.x -= 2 * (e.screenX - this.startPos.x) / 3 / scaleFactor;
                this.origin.y -= 2 * (e.screenY - this.startPos.y) / 3 / scaleFactor;

                this.startPos.x = e.screenX;
                this.startPos.y = e.screenY;

                Game.render();
            }
        }
    },
    Renderer: {
        ctx: null,
        rendering: 0,
        dataArray: null,
        initialScaleFactor: 1,
        renderWorkers: {
            splitNumber: 1,
            workers: []
        },
        init: function(ctx) {
            this.ctx = ctx;

            this.initialScaleFactor = ctx.canvas.height / 256;

            for (var y = 0; y < this.renderWorkers.splitNumber + 1; y++) {
                this.renderWorkers.workers[y] = [];

                for (var x = 0; x < this.renderWorkers.splitNumber + 1; x++) {
                    this.renderWorkers.workers[y][x] = Game.Manager.getWorker('renderWorker.js');
                }
            }

            this.dataArray = new Uint8ClampedArray(ctx.canvas.width * ctx.canvas.height * 4);
        },
        render: function(tiles, origin, zoomLvl) {
            var timer = new Timer();
            timer.step();

            var that = this;

            if (this.rendering > 0) return;
            this.rendering = Math.pow(this.renderWorkers.splitNumber + 1, 2);

            var x, y, scaleFactor, colors;

            scaleFactor = Math.pow(2, zoomLvl) * this.initialScaleFactor;

            origin.x = Helper.clamp(origin.x, 0, 256 * (1 - this.initialScaleFactor / scaleFactor));
            origin.y = Helper.clamp(origin.y, 0, 256 * (1 - this.initialScaleFactor / scaleFactor));

            colors = [];
            for (y in tiles) {
                colors[y] = [];

                for (x in tiles[y]) {
                    colors[y][x] = tiles[y][x].get('color');
                    colors[y][x] = [colors[y][x].red, colors[y][x].green, colors[y][x].blue];
                }
            }

            for (y = 0; y < this.renderWorkers.workers.length; y++) {
                for (x = 0; x < this.renderWorkers.workers[y].length; x++) {
                    Game.Manager.sendMessage(this.renderWorkers.workers[y][x], {
                        size: this.ctx.canvas.height,
                        splitNumber: this.renderWorkers.splitNumber,
                        x: x,
                        y: y,
                        origin: origin,
                        scaleFactor: scaleFactor,
                        colors: colors,
                        timeStamp: new Date().getTime()
                    }, function (data, sentData) {
                        timer.step();
                        that.ctx.putImageData(
                            data,
                            sentData.x * Math.floor(sentData.size / (sentData.splitNumber + 1)),
                            sentData.y * Math.floor(sentData.size / (sentData.splitNumber + 1))
                        );
                        that.rendering--;
                        if (that.rendering === 0) console.log(timer.get('all'));
                    });
                }
            }
        }
    },
    Manager: {
        workers: {},
        callbacks: {},
        init: function () {

        },
        getWorker: function (path) {
            var that = this;

            var workerId = Math.round(Math.random() * 100000);

            this.workers[workerId] = new Worker(path);
            this.workers[workerId].addEventListener('message', function (e) {
                that.receiveMessage(e.data);
            });

            return workerId;
        },
        sendMessage: function (worker, data, callback) {
            var callbackId = null;

            if (typeof callback !== 'undefined') {
                callbackId = Math.round(Math.random() * 100000);
                this.callbacks[callbackId] = {
                    data: data,
                    callback: callback
                };
            }

            this.workers[worker].postMessage({
                callback: callbackId,
                data: data
            });
        },
        receiveMessage: function (data) {
            this.callbacks[data.callback].callback(data.data, this.callbacks[data.callback].data);
            delete this.callbacks[data.callback];
        }
    }
};

var Helper = {
    clamp: function(value, min, max) {
        if (value < min) value = min;
        else if (value > max) value = max;
        return value;
    }
};

$(function() {
    Game.init('terrain2_res');
    /*var ctx = $('canvas')[0].getContext('2d');

    var img = new Image();
    img.src = 'terrain/terrain2.png';
    img.onload = function () {
        ctx.drawImage(img, 0, 0);
    };*/
});