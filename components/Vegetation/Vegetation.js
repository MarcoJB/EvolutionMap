function Vegetation(ctx) {
    this.props = {
        plants: {
            byTile: [],
            unsorted: []
        },
        plantDensity: []
    };


    for (var y = 0; y < 256; y++) {
        this.props.plants.byTile[y] = [];
        this.props.plantDensity[y] = [];

        for (var x = 0; x < 256; x++) {
            this.props.plants.byTile[y][x] = [];
            this.props.plantDensity[y][x] = 0;
        }
    }


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
        for (var plant = 0; plant < this.props.plants.unsorted.length; plant++) {
            this.props.plants.unsorted[plant].step(time);
        }
    };

        return plantDensity;
    }
}