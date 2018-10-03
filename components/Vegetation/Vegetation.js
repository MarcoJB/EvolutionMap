function Vegetation(ctx) {
    var props = {
        plants: {
            byTile: [],
            unsorted: []
        }
    };


    for (var y = 0; y < 256; y++) {
        props.plants.byTile[y] = [];

        for (var x = 0; x < 256; x++) {
            props.plants.byTile[y][x] = [];
        }
    }


    this.createPlant = function (x, y) {
        var tile_x = Math.floor(x);
        var tile_y = Math.floor(y);

        if (typeof props.plants.byTile[tile_y] === 'undefined' || typeof props.plants.byTile[tile_y][tile_x] === 'undefined') return;

        if (Game.Terrain.get('tiles')[tile_y][tile_x].get('height') > Game.Terrain.get('waterLvl')) {
            var plant = new Plant(x, y, Game.Terrain.get('tiles')[tile_y][tile_x]);
            props.plants.unsorted.push(plant);
            props.plants.byTile[tile_y][tile_x].push(plant);
        }
    };

    this.suggestPlant = function (x, y) {
        var tile_x = Math.floor(x);
        var tile_y = Math.floor(y);

        if (typeof props.plants.byTile[tile_y] === 'undefined' || typeof props.plants.byTile[tile_y][tile_x] === 'undefined') return;

        var tile = Game.Terrain.get('tiles')[tile_y][tile_x];

        if (Math.random() < Math.pow(tile.get('moisture') * tile.get('temperature'), 4) / Math.pow(this.calcPlantDensity(x, y, 3), 2)) {
            this.createPlant(x, y);
        }
    };

    this.get = function (prop) {
        return props[prop];
    };

    this.step = function (time) {
        for (var plant = 0; plant < props.plants.unsorted.length; plant++) {
            props.plants.unsorted[plant].step(time);
        }
    };

    this.calcPlantDensity = function (x, y, distance) {
        var plant, plantDistance;

        var range = {
            x: {
                min: Math.floor(x - distance),
                max: Math.floor(x + distance)
            },
            y: {
                min: Math.floor(y - distance),
                max: Math.floor(y + distance)
            }
        };

        var plantDensity = 1;

        for (var tile_y = range.y.min; tile_y <= range.y.max; tile_y++) {
            for (var tile_x = range.x.min; tile_x <= range.x.max; tile_x++) {
                if (typeof props.plants.byTile[tile_y] === 'undefined' || typeof props.plants.byTile[tile_y][tile_x] === 'undefined') continue;

                for (var i = 0; i < props.plants.byTile[tile_y][tile_x].length; i++) {
                    plant = props.plants.byTile[tile_y][tile_x][i];
                    plantDistance = Math.sqrt(Math.pow(x - plant.get('x'), 2) + Math.pow(y - plant.get('y'), 2));

                    if (plantDistance < distance) {
                        plantDensity += Math.exp(-plantDistance);
                    }
                }
            }
        }

        return plantDensity;
    }
}