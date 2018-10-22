function Creature(randomized) {
    if (typeof randomized !== 'boolean') randomized = true;

    this.props = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rotation: 0,
        omega: 0,
        birth: Game.time,
        energy: 1,
        colorSensors: [],
        neuralNetwork: null
    };

    this.initRandomized = function() {
        var colorSensor;

        this.props.x = Helper.random(0, 256);
        this.props.y = Helper.random(0, 256);
        this.props.rotation = Helper.random(-Math.PI, Math.PI);

        var numberColorSensors = Helper.random(0, 5, true);
        for (var i = 0; i < numberColorSensors; i++) {
            colorSensor = new ColorSensor();
            colorSensor.initRandomized();
            this.props.colorSensors.push(colorSensor);
        }

        var numberHiddenNeurons = Helper.random(5, 15, true);
        this.props.neuralNetwork = new NeuralNetwork(1 + numberColorSensors * 3, numberHiddenNeurons, ['atan', 'atan', 'hs', 'hs']);
    };

    if (randomized) this.initRandomized();


    this.step = function(time) {
        this.props.x += time * this.props.vx;
        this.props.y += time * this.props.vy;
        this.props.rotation += time * this.props.omega;

        var angle, distance, dx, dy, x, y, img_x, img_y, color, ax, ay;

        var inputs = [this.props.energy];

        for (var i = 0; i < this.props.colorSensors.length; i++) {
            angle = this.props.rotation + this.props.colorSensors[i].props.direction;
            distance = this.props.colorSensors[i].props.distance;

            dx = Math.sin(angle) * distance;
            dy = Math.cos(angle) * distance;

            x = this.props.x + dx;
            y = this.props.y + dy;

            img_x = Math.round(x * Game.ctx.canvas.height / 256);
            img_y = Math.round(y * Game.ctx.canvas.height / 256);

            color = Game.ctx.getImageData(img_x, img_y, 1, 1).data;

            inputs.push(color[0]);
            inputs.push(color[1]);
            inputs.push(color[2]);
        }

        var outputs = this.props.neuralNetwork.calc(inputs);

        ax = Math.sin(this.props.rotation) * outputs[0];
        ay = Math.cos(this.props.rotation) * outputs[0];

        this.props.vx += time * ax;
        this.props.vy += time * ay;
        this.props.omega += time * outputs[1];
    }
}