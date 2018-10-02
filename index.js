var Game;
Game = {
    ctx: null,
    init: function (terrain_name) {
        this.ctx = $('#terrain')[0].getContext('2d');

        this.Terrain.init(this.ctx, terrain_name);
        this.Interaction.init(this.ctx);
        this.Renderer.init(this.ctx);

        this.ctx.mozImageSmoothingEnabled = false;
    },
    step: function (time) {
        this.Terrain.step(time);
        this.Renderer.render(this.Terrain.tiles, this.Interaction.origin, this.Interaction.zoomLvl);
    },
    render: function () {
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
        init: function (ctx, terrain_name) {
            var that = this;

            this.ctx = ctx;
            $('#terrain').attr('width', 256).attr('height', 256);

            this.loadData(terrain_name, function () {
                that.generateTerrain();
                Game.render();
            });
        },
        step: function (time) {
            for (var y in this.tiles) {
                for (var x in this.tiles[y]) {
                    this.tiles[y][x].step(time);
                }
            }
        },
        render: function () {
            this.updateTerrain();
        },
        loadData: function (terrain_name, callback) {
            var that = this;

            $.get('terrain/' + terrain_name + '.json', function (data) {
                that.data = that.smoothTerrain(data);
                callback();
            }, 'json');
        },
        smoothTerrain: function (data) {
            var res = [];

            for (var y = 0; y < 256; y++) {
                res[y] = [];

                for (var x = 0; x < 256; x++) {
                    res[y][x] = 0.5 * data[y][x] +
                        0.075 * (data[y > 0 ? y - 1 : 0][x] + data[y < 255 ? y + 1 : 255][x] + data[y][x > 0 ? x - 1 : 0] + data[y][x < 255 ? x + 1 : 255]) +
                        0.05 * (data[y > 0 ? y - 1 : 0][x > 0 ? x - 1 : 0] + data[y < 255 ? y + 1 : 255][x > 0 ? x - 1 : 0] + data[y > 0 ? y - 1 : 0][x < 255 ? x + 1 : 255] + data[y < 255 ? y + 1 : 255][x < 255 ? x + 1 : 255])
                }
            }

            return res;
        },
        generateTerrain: function () {
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
        updateTerrain: function () {
            var x, y, tile;

            for (y = 0; y < this.data.length; y++) {
                for (x = 0; x < this.data[y].length; x++) {
                    tile = this.tiles[y][x];
                    tile.setWaterLvl(this.waterLvl);
                }
            }
        },
        calcWaterDistance: function (x, y, maxDistance) {
            if (typeof maxDistance === 'undefined') maxDistance = 50;
            if (this.data[y][x] <= this.waterLvl) return 0;

            for (var checkDistance = 1; checkDistance < maxDistance; checkDistance++) {
                for (var i = 0; i < checkDistance; i++) {
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
        ctx: null,
        zoomLvl: 0,
        initialScaleFactor: 1,
        dragging: false,
        startPos: {},
        origin: {
            x: 0,
            y: 0
        },
        init: function (ctx) {
            var that = this;

            this.ctx = ctx;

            this.initialScaleFactor = ctx.canvas.height / 256;


            $('#terrain').on('wheel', function (e) {
                that.zoom(
                    Math.sign(e.originalEvent.deltaY),
                    e.originalEvent.layerX,
                    e.originalEvent.layerY
                );
            });

            $('#map').on('mousedown', function (e) {
                that.onInteractionStart(e);
            });
            $(window).on('mouseup', function (e) {
                that.onInteractionEnd(e);
            }).on('mousemove', function (e) {
                that.onInteractionMove(e);
            });
        },
        zoom: function (direction, x, y) {
            var tile;

            tile = {
                before: this.pxToTile(x, y)
            };

            this.zoomLvl -= direction * 0.2;
            if (this.zoomLvl < 0) this.zoomLvl = 0;

            tile.after = this.pxToTile(x, y);

            this.origin.x += tile.before.x - tile.after.x;
            this.origin.y += tile.before.y - tile.after.y;

            Game.render();
        },
        onInteractionStart: function (e) {
            this.dragging = true;

            this.startPos.x = e.screenX;
            this.startPos.y = e.screenY;

            $('html').addClass('grabbing');
        },
        onInteractionEnd: function () {
            this.dragging = false;
            $('html').removeClass('grabbing');
        },
        onInteractionMove: function (e) {
            if (this.dragging) {
                var scaleFactor = Math.pow(2, this.zoomLvl);

                this.origin.x -= 2 * (e.screenX - this.startPos.x) / scaleFactor * this.ctx.canvas.width / $(this.ctx.canvas).width();
                this.origin.y -= 2 * (e.screenY - this.startPos.y) / scaleFactor * this.ctx.canvas.height / $(this.ctx.canvas).height();

                this.startPos.x = e.screenX;
                this.startPos.y = e.screenY;

                Game.render();
            }
        },
        pxToTile: function (cursor_x, cursor_y) {
            var scaleFactor, visibleTiles, tile;

            scaleFactor = Math.pow(2, this.zoomLvl);

            visibleTiles = 256 / scaleFactor;

            tile = {
                x: this.origin.x + cursor_x / $(this.ctx.canvas).width() * visibleTiles,
                y: this.origin.y + cursor_y / $(this.ctx.canvas).height() * visibleTiles
            };

            return tile;
        }
    },
    Renderer: {
        ctx: null,
        dataArray: null,
        initialScaleFactor: 1,
        init: function (ctx) {
            this.ctx = ctx;

            this.initialScaleFactor = ctx.canvas.height / 256;

            this.dataArray = new Uint8ClampedArray(ctx.canvas.width * ctx.canvas.height * 4);
        },
        render: function (tiles, origin, zoomLvl) {
            var x, y, tile_x, tile_y, color;

            var scaleFactor = Math.pow(2, zoomLvl) * this.initialScaleFactor;

            origin.x = Helper.clamp(origin.x, 0, 256 * (1 - this.initialScaleFactor / scaleFactor));
            origin.y = Helper.clamp(origin.y, 0, 256 * (1 - this.initialScaleFactor / scaleFactor));

            for (y = 0; y < this.ctx.canvas.height; y++) {
                for (x = 0; x < this.ctx.canvas.width; x++) {
                    tile_y = Math.floor(y / scaleFactor + origin.y);
                    tile_x = Math.floor(x / scaleFactor + origin.x);

                    color = tiles[tile_y][tile_x].get('color');

                    this.dataArray.set(
                        [color.red, color.green, color.blue, 255],
                        y * this.ctx.canvas.width * 4 + x * 4
                    );
                }
            }

            this.ctx.putImageData(new ImageData(this.dataArray, this.ctx.canvas.width, this.ctx.canvas.height), 0, 0);
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