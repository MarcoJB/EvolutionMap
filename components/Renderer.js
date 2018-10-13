function Renderer(ctx) {
    this.props = {
        dataArray: new Uint8ClampedArray(ctx.canvas.width * ctx.canvas.height * 4),
        initialScaleFactor: ctx.canvas.height / 256,
        scaleFactor: 0,
        origin: {}
    };


    this.renderTerrain = function (tileHeights, tileMoistures, waterLvl, origin, zoomLvl) {
        var x, y, tile_x, tile_y, color;

        this.props.origin.x = origin.x;
        this.props.origin.y = origin.y;

        this.props.scaleFactor = Math.pow(2, zoomLvl);

        this.props.origin.x = Helper.clamp(this.props.origin.x, 0, 256 * (1 - 1 / this.props.scaleFactor));
        this.props.origin.y = Helper.clamp(this.props.origin.y, 0, 256 * (1 - 1 / this.props.scaleFactor));

        /*for (y = 0; y < ctx.canvas.height; y++) {
            for (x = 0; x < ctx.canvas.width; x++) {
                tile_y = Math.floor(y / (this.props.scaleFactor * this.props.initialScaleFactor) + this.props.origin.y);
                tile_x = Math.floor(x / (this.props.scaleFactor * this.props.initialScaleFactor) + this.props.origin.x);

                color = tiles[tile_y][tile_x].get('color');

                this.props.dataArray.set(
                    [color.red, color.green, color.blue, 255],
                    y * ctx.canvas.width * 4 + x * 4
                );
            }
        }*/

        var canvasTemp = document.createElement('canvas');
        canvasTemp.width = Math.min(Math.ceil(256 / this.props.scaleFactor) + 1, 256 - Math.floor(this.props.origin.x));
        canvasTemp.height = Math.min(Math.ceil(256 / this.props.scaleFactor) + 1, 256 - Math.floor(this.props.origin.y));
        var ctxTemp = canvasTemp.getContext('2d');
        var dataArrayTemp = new Uint8ClampedArray(canvasTemp.width * canvasTemp.height * 4);

        for (y = 0; y < canvasTemp.height; y++) {
            for (x = 0; x < canvasTemp.width; x++) {
                tile_y = Math.floor(this.props.origin.y) + y;
                tile_x = Math.floor(this.props.origin.x) + x;

                var temperature;
                var color = {};

                if (tileHeights[tile_y][tile_x] > waterLvl) {
                    temperature = Math.exp((waterLvl - tileHeights[tile_y][tile_x]) / 200);

                    color.red = Math.round((240 - 120 * tileHeights[tile_y][tile_x] / 255) * (1 - tileMoistures[tile_y][tile_x]));
                    color.green = Math.round((230 - 180 * tileHeights[tile_y][tile_x] / 255) * (1 - tileMoistures[tile_y][tile_x]));
                    color.blue = Math.round((120 - 90 * tileHeights[tile_y][tile_x] / 255) * (1 - tileMoistures[tile_y][tile_x]));
                } else if (tileHeights[tile_y][tile_x] > waterLvl - 20) {
                    color.red = Math.round(37 + (67 - 37) * (tileHeights[tile_y][tile_x] - (waterLvl - 20)) / 20);
                    color.green = Math.round(84 + (190 - 143) * (tileHeights[tile_y][tile_x] - (waterLvl - 20)) / 20);
                    color.blue = Math.round(132 + (165 - 132) * (tileHeights[tile_y][tile_x] - (waterLvl - 20)) / 20);
                } else {
                    color.red = 37;
                    color.green = 84;
                    color.blue = 132;
                }

                dataArrayTemp.set(
                    [color.red, color.green, color.blue, 255],
                    y * canvasTemp.width * 4 + x * 4
                );
            }
        }

        ctxTemp.putImageData(new ImageData(dataArrayTemp, canvasTemp.width, canvasTemp.height), 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(
            canvasTemp,
            0,
            0,
            canvasTemp.width,
            canvasTemp.height,
            -this.props.origin.x % 1 * this.props.scaleFactor * this.props.initialScaleFactor,
            -this.props.origin.y % 1 * this.props.scaleFactor * this.props.initialScaleFactor,
            canvasTemp.width * this.props.scaleFactor * this.props.initialScaleFactor,
            canvasTemp.height * this.props.scaleFactor * this.props.initialScaleFactor
        );
    };

    this.renderVegetation = function (plants) {
        var plant;

        ctx.fillStyle = 'green';

        for (var i = 0; i < plants.length; i++) {
            plant = plants[i];

            relativPosition = {
                x: plant.props.x - this.props.origin.x,
                y: plant.props.y - this.props.origin.y
            };

            if (relativPosition.x > -plant.props.size / 2 &&
                relativPosition.y > -plant.props.size / 2 &&
                relativPosition.x < 256 / this.props.scaleFactor + plant.props.size / 2 &&
                relativPosition.y < 256 / this.props.scaleFactor + plant.props.size / 2) {
                /*ctx.beginPath();
                ctx.arc(
                    relativPosition.x * this.props.initialScaleFactor * this.props.scaleFactor,
                    relativPosition.y * this.props.initialScaleFactor * this.props.scaleFactor,
                    plant.props.size / 2 * this.props.initialScaleFactor * this.props.scaleFactor,
                    0,
                    2 * Math.PI
                );
                ctx.fill();*/
                ctx.fillRect(
                    relativPosition.x * this.props.initialScaleFactor * this.props.scaleFactor - plant.props.size / 2 * this.props.initialScaleFactor * this.props.scaleFactor,
                    relativPosition.y * this.props.initialScaleFactor * this.props.scaleFactor - plant.props.size / 2 * this.props.initialScaleFactor * this.props.scaleFactor,
                    plant.props.size * this.props.initialScaleFactor * this.props.scaleFactor,
                    plant.props.size * this.props.initialScaleFactor * this.props.scaleFactor
                );
            }
        }
    };

    this.render = function () {
        //ctx.putImageData(new ImageData(this.props.dataArray, ctx.canvas.width, ctx.canvas.height), 0, 0);
    }
}