function Plant(x, y, tile) {
    var props = {
        x: x,
        y: y,
        tile: tile,
        maxEnergy: Math.random() * 0.2 + 0.3,
        energy: 0.01,
        maxSize: 0,
        size: 0
    };

    props.maxSize = Math.sqrt(4 * props.maxEnergy / Math.PI);
    props.size = Math.sqrt(4 * props.energy / Math.PI);


    this.get = function (prop) {
        return props[prop];
    };

    this.step = function (time) {
        props.energy += time * props.energy * (props.maxEnergy - props.energy);
        props.size = Math.sqrt(4 * props.energy / Math.PI);

        for (var try_ = 0; try_ < 5; try_++) {
            if (Math.random() < time * props.energy / props.maxEnergy) {
                var distance = (Math.random() * 3 + 1) * props.size;
                var direction = Math.random() * 2 * Math.PI;

                Game.Vegetation.suggestPlant(props.x + distance * Math.cos(direction), props.y + distance * Math.sin(direction));
            }
        }
    }
}