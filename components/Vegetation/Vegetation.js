function Vegetation(ctx) {
    var props = {
        plants: []
    };


    for (var y = 0; y < 256; y++) {
        props.plants[y] = [];

        for (var x = 0; x < 256; x++) {
            props.plants[y][x] = [];
        }
    }

    this.createPlant = function (x, y) {
        var plant = new Plant(x, y);
        props.plants[Math.round(y)][Math.round(x)].push(plant);
    };


    this.get = function (prop) {
        return props[prop];
    };
}