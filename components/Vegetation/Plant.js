function Plant(x, y) {
    var props = {
        x: x,
        y: y,
        maxEnergy: Math.random * 0.4 + 0.8,
        energy: 0,
        size: 0.5
    };


    this.get = function (prop) {
        return props[prop];
    };
}