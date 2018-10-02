function Terrain(ctx, terrain_name) {
    var props = {
        ctx: null,
        tileSize: 20,
        data: null,
        waterLvl: 60,
        tiles: [],
        worker: null,
        dataArray: null
    };

    $('#terrain').attr('width', 256).attr('height', 256);

    loadData(terrain_name, function () {
        generateTerrain();
        Game.render();
    });


    function loadData(terrain_name, callback) {
        $.get('terrain/' + terrain_name + '.json', function (data) {
            props.data = smoothTerrain(data);
            callback();
        }, 'json');
    }

    function smoothTerrain(data) {
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
    }

    function generateTerrain() {
        var tile;
        props.tiles = [];

        for (var y = 0; y < props.data.length; y++) {
            props.tiles[y] = [];

            for (var x = 0; x < props.data[y].length; x++) {
                tile = new Tile(x, y, props.data[y][x], props.waterLvl, calcWaterDistance(x, y));

                if (x > 0) {
                    tile.setNeighbor(0, 1, props.tiles[y][x - 1]);
                    props.tiles[y][x - 1].setNeighbor(2, 1, tile);
                }
                if (y > 0) {
                    tile.setNeighbor(1, 0, props.tiles[y - 1][x]);
                    props.tiles[y - 1][x].setNeighbor(1, 2, tile);
                }
                if (x > 0 && y > 0) {
                    tile.setNeighbor(0, 0, props.tiles[y - 1][x - 1]);
                    props.tiles[y - 1][x - 1].setNeighbor(2, 2, tile);
                }
                if (y > 0 && x < 255) {
                    tile.setNeighbor(2, 0, props.tiles[y - 1][x + 1]);
                    props.tiles[y - 1][x + 1].setNeighbor(0, 2, tile);
                }

                props.tiles[y][x] = tile;
            }
        }
    }

    function updateTerrain() {
        var x, y, tile;

        for (y = 0; y < props.data.length; y++) {
            for (x = 0; x < props.data[y].length; x++) {
                tile = props.tiles[y][x];
                tile.setWaterLvl(props.waterLvl);
            }
        }
    }

    function calcWaterDistance(x, y, maxDistance) {
        if (typeof maxDistance === 'undefined') maxDistance = 50;
        if (props.data[y][x] <= props.waterLvl) return 0;

        for (var checkDistance = 1; checkDistance < maxDistance; checkDistance++) {
            for (var i = 0; i < checkDistance; i++) {
                if (x + (checkDistance - i) < 256 && y + i < 256 && props.data[y + i][x + (checkDistance - i)] <= props.waterLvl) return checkDistance;
                if (x - i >= 0 && y + (checkDistance - i) < 256 && props.data[y + (checkDistance - i)][x - i] <= props.waterLvl) return checkDistance;
                if (x - (checkDistance - i) >= 0 && y - i >= 0 && props.data[y - i][x - (checkDistance - i)] <= props.waterLvl) return checkDistance;
                if (x + i < 256 && y - (checkDistance - i) >= 0 && props.data[y - (checkDistance - i)][x + i] <= props.waterLvl) return checkDistance;
            }
        }

        return maxDistance;
    }


    this.step = function (time) {
        for (var y in props.tiles) {
            for (var x in props.tiles[y]) {
                props.tiles[y][x].step(time);
            }
        }
    };

    this.render = function () {
        updateTerrain();
    };

    this.get = function (prop) {
        return props[prop];
    };
}