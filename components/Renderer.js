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
        }
    };

    this.kernels = {
        renderTerrain: Game.gpu.createKernel(this.kernelFunctions.renderTerrain, {
            outputToTexture: true,
            output: [256, 256],
            graphical: true
        })
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
        var plant, energy, size;

        ctx.fillStyle = 'green';

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
                    ctx.beginPath();
                    ctx.arc(
                        relativPosition.x * this.props.initialScaleFactor * this.props.scaleFactor,
                        relativPosition.y * this.props.initialScaleFactor * this.props.scaleFactor,
                        size / 2 * this.props.initialScaleFactor * this.props.scaleFactor,
                        0,
                        2 * Math.PI
                    );
                    ctx.fill();
                }
            }
        }
    };
}