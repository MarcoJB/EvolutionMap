function Renderer(ctx) {
    this.props = {
        dataArray: new Uint8ClampedArray(ctx.canvas.width * ctx.canvas.height * 4),
        initialScaleFactor: ctx.canvas.height / 256,
        scaleFactor: 0,
        origin: {}
    };


    this.kernelFunctions = {
        renderTerrain: function (heights, moistures, waterLvl) {
            var red, green, blue;

            if (heights[255 - this.thread.y][this.thread.x] > waterLvl) {
                red = ((240 - 120 * heights[255 - this.thread.y][this.thread.x] / 255) * (1 - moistures[255 - this.thread.y][this.thread.x]));
                green = ((230 - 180 * heights[255 - this.thread.y][this.thread.x] / 255) * (1 - moistures[255 - this.thread.y][this.thread.x]));
                blue = ((120 - 90 * heights[255 - this.thread.y][this.thread.x] / 255) * (1 - moistures[255 - this.thread.y][this.thread.x]));
            } else if (heights[255 - this.thread.y][this.thread.x] > waterLvl - 20) {
                red = (37 + (67 - 37) * (heights[255 - this.thread.y][this.thread.x] - (waterLvl - 20)) / 20);
                green = (84 + (190 - 143) * (heights[255 - this.thread.y][this.thread.x] - (waterLvl - 20)) / 20);
                blue = (132 + (165 - 132) * (heights[255 - this.thread.y][this.thread.x] - (waterLvl - 20)) / 20);
            } else {
                red = 37;
                green = 84;
                blue = 132;
            }

            this.color(red/255, green/255, blue/255);
        },
        render: function(origin, zoomLvl, waterLvl, heights, moistures, plants) {
            this.color(1, 0.5, 1);
        }
    };

    this.kernels = {
        renderTerrain: Game.gpu.createKernel(this.kernelFunctions.renderTerrain, {
            output: [256, 256],
            graphical: true
        }),
        render: Game.gpu.createKernel(this.kernelFunctions.render, {
            output: [ctx.canvas.height, ctx.canvas.height],
            outputToTexture: true,
            graphical: true
        })
    };


    this.render = function(origin, zoomLvl, waterLvl, tileHeights, tileMoistures, plants) {
        this.kernels.render([origin.x, origin.y], zoomLvl, waterLvl, tileHeights, tileMoistures, plants);

        /*var canvasTemp = this.kernels.render.getCanvas();

        ctx.drawImage(
            canvasTemp,
            0,
            0,
            canvasTemp.width,
            canvasTemp.height
        );*/
    };


    this.renderTerrain = function (tileHeights, tileMoistures, waterLvl, origin, zoomLvl) {
        this.props.origin.x = origin.x;
        this.props.origin.y = origin.y;

        this.props.scaleFactor = Math.pow(2, zoomLvl);

        this.props.origin.x = Helper.clamp(this.props.origin.x, 0, 256 * (1 - 1 / this.props.scaleFactor));
        this.props.origin.y = Helper.clamp(this.props.origin.y, 0, 256 * (1 - 1 / this.props.scaleFactor));


        this.kernels.renderTerrain(tileHeights, tileMoistures, waterLvl);
        var canvasTemp = this.kernels.renderTerrain.getCanvas();

        ctx.drawImage(
            canvasTemp,
            0,
            0,
            canvasTemp.width,
            canvasTemp.height,
            -this.props.origin.x * this.props.scaleFactor * this.props.initialScaleFactor,
            -this.props.origin.y * this.props.scaleFactor * this.props.initialScaleFactor,
            canvasTemp.width * this.props.scaleFactor * this.props.initialScaleFactor,
            canvasTemp.height * this.props.scaleFactor * this.props.initialScaleFactor
        );
    };

    this.renderVegetation = function (plants) {
        //this.kernels.renderVegetation(plants);

        var plant, energy, size, relativPosition;

        ctx.fillStyle = 'green';
        ctx.beginPath();

        for (var y = 0; y < plants.length; y++) {
            for (var x = 0; x < plants[y].length; x++) {
                plant = plants[y][x];

                if (plant[4] === 0) continue;

                energy = plant[4] * Math.pow(Math.sin(Math.pow((Game.time - plant[2]) / plant[3], 2) * Math.PI), 2);
                size = Math.sqrt(4 * energy / Math.PI);

                relativPosition = {
                    x: x + plant[0] - this.props.origin.x,
                    y: y + plant[1] - this.props.origin.y
                };

                if (relativPosition.x > -size / 2 &&
                    relativPosition.y > -size / 2 &&
                    relativPosition.x < 256 / this.props.scaleFactor + size / 2 &&
                    relativPosition.y < 256 / this.props.scaleFactor + size / 2) {
                    ctx.moveTo(
                        (relativPosition.x + size / 2) * this.props.initialScaleFactor * this.props.scaleFactor,
                        relativPosition.y * this.props.initialScaleFactor * this.props.scaleFactor
                    );
                    ctx.arc(
                        relativPosition.x * this.props.initialScaleFactor * this.props.scaleFactor,
                        relativPosition.y * this.props.initialScaleFactor * this.props.scaleFactor,
                        size / 2 * this.props.initialScaleFactor * this.props.scaleFactor,
                        0,
                        2 * Math.PI
                    );
                    //ctx.fill();
                    /*ctx.fillRect(
                        (relativPosition.x - size / 2) * this.props.initialScaleFactor * this.props.scaleFactor,
                        (relativPosition.y - size / 2) * this.props.initialScaleFactor * this.props.scaleFactor,
                        size * this.props.initialScaleFactor * this.props.scaleFactor,
                        size * this.props.initialScaleFactor * this.props.scaleFactor
                    );*/
                }
            }
        }

        ctx.fill();
    };

    this.renderCreatures = function(creatures) {
        var relativPosition, creature, colorSensor, dx, dy;

        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'black';

        for (var i = 0; i < creatures.length; i++) {
            creature = creatures[i];
            relativPosition = {
                x: creature.props.x - this.props.origin.x,
                y: creature.props.y - this.props.origin.y
            };

            ctx.beginPath();
            ctx.arc(
                relativPosition.x * this.props.initialScaleFactor * this.props.scaleFactor,
                relativPosition.y * this.props.initialScaleFactor * this.props.scaleFactor,
                1 / 4 * this.props.initialScaleFactor * this.props.scaleFactor,
                0,
                2 * Math.PI
            );
            ctx.fill();
            /*ctx.fillRect(
                (relativPosition.x - 1 / 2) * this.props.initialScaleFactor * this.props.scaleFactor,
                (relativPosition.y - 1 / 2) * this.props.initialScaleFactor * this.props.scaleFactor,
                1 * this.props.initialScaleFactor * this.props.scaleFactor,
                1 * this.props.initialScaleFactor * this.props.scaleFactor
            );*/

            ctx.beginPath();
            for (var j = 0; j < creature.props.colorSensors.length; j++) {
                colorSensor = creature.props.colorSensors[j];

                dx = Math.sin(creature.props.rotation + colorSensor.props.direction) * colorSensor.props.distance;
                dy = Math.cos(creature.props.rotation + colorSensor.props.direction) * colorSensor.props.distance;

                ctx.moveTo(
                    relativPosition.x * this.props.initialScaleFactor * this.props.scaleFactor,
                    relativPosition.y * this.props.initialScaleFactor * this.props.scaleFactor
                );
                ctx.lineTo(
                    (relativPosition.x + dx) * this.props.initialScaleFactor * this.props.scaleFactor,
                    (relativPosition.y + dy) * this.props.initialScaleFactor * this.props.scaleFactor
                );
            }
            ctx.stroke();
        }
    }
}