function ColorSensor(randomized) {
    if (typeof randomized !== 'boolean') randomized = true;

    this.props = {
        direction: 0,
        distance: 0
    };

    this.initRandomized = function() {
        this.props.direction = Helper.random(-Math.PI, Math.PI);
        this.props.distance = Math.random();
    }

    if (randomized) this.initRandomized();
}