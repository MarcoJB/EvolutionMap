function Renderer(ctx) {
    var props = {
        dataArray: new Uint8ClampedArray(ctx.canvas.width * ctx.canvas.height * 4),
        initialScaleFactor: ctx.canvas.height / 256,
        scaleFactor: 0,
        origin: {}
    };


    this.renderTerrain = function (tiles, origin, zoomLvl) {
        var x, y, tile_x, tile_y, color;

        props.origin.x = origin.x;
        props.origin.y = origin.y;

        props.scaleFactor = Math.pow(2, zoomLvl);

        props.origin.x = Helper.clamp(props.origin.x, 0, 256 * (1 - 1 / props.scaleFactor));
        props.origin.y = Helper.clamp(props.origin.y, 0, 256 * (1 - 1 / props.scaleFactor));

        /*for (y = 0; y < ctx.canvas.height; y++) {
            for (x = 0; x < ctx.canvas.width; x++) {
                tile_y = Math.floor(y / (props.scaleFactor * props.initialScaleFactor) + props.origin.y);
                tile_x = Math.floor(x / (props.scaleFactor * props.initialScaleFactor) + props.origin.x);

                color = tiles[tile_y][tile_x].get('color');

                props.dataArray.set(
                    [color.red, color.green, color.blue, 255],
                    y * ctx.canvas.width * 4 + x * 4
                );
            }
        }*/

        var canvasTemp = document.createElement('canvas');
        canvasTemp.width = Math.min(Math.ceil(256 / props.scaleFactor) + 1, 256 - Math.floor(props.origin.x));
        canvasTemp.height = Math.min(Math.ceil(256 / props.scaleFactor) + 1, 256 - Math.floor(props.origin.y));
        var ctxTemp = canvasTemp.getContext('2d');
        var dataArrayTemp = new Uint8ClampedArray(canvasTemp.width * canvasTemp.height * 4);

        for (y = 0; y < canvasTemp.height; y++) {
            for (x = 0; x < canvasTemp.width; x++) {
                tile_y = Math.floor(props.origin.y) + y;
                tile_x = Math.floor(props.origin.x) + x;

                color = tiles[tile_y][tile_x].get('color');

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
            -props.origin.x % 1 * props.scaleFactor * props.initialScaleFactor,
            -props.origin.y % 1 * props.scaleFactor * props.initialScaleFactor,
            canvasTemp.width * props.scaleFactor * props.initialScaleFactor,
            canvasTemp.height * props.scaleFactor * props.initialScaleFactor
        );
    };

    this.renderVegetation = function (plants) {
        var plant;

        ctx.fillStyle = 'lime';

        for (var i = 0; i < plants.length; i++) {
            plant = plants[i];

            relativPosition = {
                x: plant.get('x') - props.origin.x,
                y: plant.get('y') - props.origin.y
            };

            if (relativPosition.x > -plant.get('size') / 2 &&
                relativPosition.y > -plant.get('size') / 2 &&
                relativPosition.x < 256 / props.scaleFactor + plant.get('size') / 2 &&
                relativPosition.y < 256 / props.scaleFactor + plant.get('size') / 2) {
                ctx.beginPath();
                ctx.arc(
                    relativPosition.x * props.initialScaleFactor * props.scaleFactor,
                    relativPosition.y * props.initialScaleFactor * props.scaleFactor,
                    plant.get('size') / 2 * props.initialScaleFactor * props.scaleFactor,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
            }
        }
    };

    this.render = function () {
        //ctx.putImageData(new ImageData(props.dataArray, ctx.canvas.width, ctx.canvas.height), 0, 0);
    }
}