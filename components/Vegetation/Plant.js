function Plant(x, y, tile) {
    var props = {
        x: x,
        y: y,
        tile: tile,
        energy: 0.01,
        maxEnergy: Math.random() * 0.2 + 0.3,
        size: 0,
        maxSize: 0,
        age: 0,
        maxAge: 0
    };

    props.maxAge = Helper.random(40, 80) * tile.get('moisture') * tile.get('temperature');
    props.maxEnergy = Helper.random(0.2, 0.5) * tile.get('moisture') * tile.get('temperature');
    props.maxSize = Math.sqrt(4 * props.maxEnergy / Math.PI);


    this.get = function (prop) {
        return props[prop];
    };

    this.step = function (time) {
        props.age += time;
        if (props.age > props.maxAge) {
            Game.Vegetation.killPlant(this);
            return;
        }

        props.energy = props.maxEnergy * Math.pow(Math.sin(Math.pow(props.age / props.maxAge, 2) * Math.PI), 2);
        props.size = Math.sqrt(4 * props.energy / Math.PI);

        for (var try_ = 0; try_ < 20; try_++) {
            if (Math.random() < time * props.energy) {
                var distance = (Math.random() * 3 + 1) * props.size;
                var direction = Math.random() * 2 * Math.PI;

                Game.Vegetation.seedPlant(props.x + distance * Math.cos(direction), props.y + distance * Math.sin(direction));
            }
        }
    };


    function log() {
        if (x === 30 && y === 10) console.log(...arguments);
    }
}