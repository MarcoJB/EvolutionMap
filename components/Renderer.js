function Renderer(ctx) {
    this.props = {
        dataArray: new Uint8ClampedArray(ctx.canvas.width * ctx.canvas.height * 4),
        initialScaleFactor: ctx.canvas.height / 256,
        scaleFactor: 0,
        origin: {}
    };


    this.renderTerrain = function (tiles, origin, zoomLvl) {
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

                color = tiles[tile_y][tile_x].props.color;

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
                ctx.beginPath();
                ctx.arc(
                    relativPosition.x * this.props.initialScaleFactor * this.props.scaleFactor,
                    relativPosition.y * this.props.initialScaleFactor * this.props.scaleFactor,
                    plant.props.size / 2 * this.props.initialScaleFactor * this.props.scaleFactor,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
            }
        }
    };

    this.render = function () {
        //ctx.putImageData(new ImageData(this.props.dataArray, ctx.canvas.width, ctx.canvas.height), 0, 0);
    }
}