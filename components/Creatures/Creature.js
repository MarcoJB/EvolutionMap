function Creature(randomized) {
    if (typeof randomized !== 'boolean') randomized = true;

    this.props = {
        x: 0,
        y: 0,
        rotation: 0,
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
        this.props.neuralNetwork = new NeuralNetwork(1 + numberColorSensors * 3, numberHiddenNeurons, ['lin', 'lin', 'hs', 'hs']);
    };

    if (randomized) this.initRandomized();


    this.kernelFunctions = {
        getMoisture: function(moisture, x, y) {
            return moisture[y][x];
        }
    };

    this.kernels = {
        getMoisture: Game.gpu.createKernel(this.kernelFunctions.getMoisture, {
            output: [1]
        })
    };


    this.step = function(time) {
        var angle, distance, dx, dy, tile_x, tile_y, red, green, blue, moisture;

        var inputs = [this.props.energy];

        for (var i = 0; i < this.props.colorSensors.length; i++) {
            angle = this.props.rotation + this.props.colorSensors[i].props.direction;
            distance = this.props.colorSensors[i].props.distance;

            dx = Math.sin(angle) * distance;
            dy = Math.cos(angle) * distance;

            tile_x = Helper.clamp(Math.floor(this.props.x + dx), 0, 255);
            tile_y = Helper.clamp(Math.floor(this.props.y + dy), 0, 255);

            moisture = this.kernels.getMoisture(Game.Terrain.props.tileMoisturesTexture, tile_x, tile_y)[0];

            if (Game.Terrain.props.tileHeights[tile_y][tile_x] > Game.Terrain.props.waterLvl) {
                red = ((240 - 120 * Game.Terrain.props.tileHeights[tile_y][tile_x] / 255) * (1 - moisture));
                green = ((230 - 180 * Game.Terrain.props.tileHeights[tile_y][tile_x] / 255) * (1 - moisture));
                blue = ((120 - 90 * Game.Terrain.props.tileHeights[tile_y][tile_x] / 255) * (1 - moisture));
            } else if (Game.Terrain.props.tileHeights[tile_y][tile_x] > Game.Terrain.props.waterLvl - 20) {
                red = (37 + (67 - 37) * (Game.Terrain.props.tileHeights[tile_y][tile_x] - (Game.Terrain.props.waterLvl - 20)) / 20);
                green = (84 + (190 - 143) * (Game.Terrain.props.tileHeights[tile_y][tile_x] - (Game.Terrain.props.waterLvl - 20)) / 20);
                blue = (132 + (165 - 132) * (Game.Terrain.props.tileHeights[tile_y][tile_x] - (Game.Terrain.props.waterLvl - 20)) / 20);
            } else {
                red = 37;
                green = 84;
                blue = 132;
            }

            inputs.push(red / 255);
            inputs.push(green / 255);
            inputs.push(blue / 255);
        }

        var outputs = this.props.neuralNetwork.calc(inputs);

        vx = Math.sin(this.props.rotation) * outputs[0];
        vy = Math.cos(this.props.rotation) * outputs[0];

        this.props.x += time * vx;
        this.props.y += time * vy;
        this.props.rotation += time * outputs[1];
    }
}