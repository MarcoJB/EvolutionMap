function Plant(x, y, tile) {
    this.props = {
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

    this.props.maxAge = Helper.random(40, 80) * tile.props.moisture * tile.props.temperature;
    this.props.maxEnergy = Helper.random(0.2, 0.5) * tile.props.moisture * tile.props.temperature;
    this.props.maxSize = Math.sqrt(4 * this.props.maxEnergy / Math.PI);


    this.get = function (prop) {
        return this.props[prop];
    };

    this.step = function (time) {
        this.props.age += time;
        if (this.props.age > this.props.maxAge) {
            Game.Vegetation.killPlant(this);
            return;
        }

        this.props.energy = this.props.maxEnergy * Math.pow(Math.sin(Math.pow(this.props.age / this.props.maxAge, 2) * Math.PI), 2);
        this.props.size = Math.sqrt(4 * this.props.energy / Math.PI);

        for (var try_ = 0; try_ < 20; try_++) {
            if (Math.random() < time * this.props.energy) {
                var distance = (Math.random() * 3 + 1) * this.props.size;
                var direction = Math.random() * 2 * Math.PI;

                Game.Vegetation.seedPlant(this.props.x + distance * Math.cos(direction), this.props.y + distance * Math.sin(direction));
            }
        }
    };


    function log() {
        if (x === 30 && y === 10) console.log(...arguments);
    }
}