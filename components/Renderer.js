function Renderer(ctx) {
    var props = {
        dataArray: new Uint8ClampedArray(ctx.canvas.width * ctx.canvas.height * 4),
        initialScaleFactor: ctx.canvas.height / 256,
        scaleFactor: 0,
        origin: {}
    };

    this.prepareTerrain = function (tiles, origin, zoomLvl) {
        var x, y, tile_x, tile_y, color;

        props.origin.x = origin.x;
        props.origin.y = origin.y;

        props.scaleFactor = Math.pow(2, zoomLvl);

        props.origin.x = Helper.clamp(props.origin.x, 0, 256 * (1 - props.initialScaleFactor / (props.scaleFactor * props.initialScaleFactor)));
        props.origin.y = Helper.clamp(props.origin.y, 0, 256 * (1 - props.initialScaleFactor / (props.scaleFactor * props.initialScaleFactor)));

        for (y = 0; y < ctx.canvas.height; y++) {
            for (x = 0; x < ctx.canvas.width; x++) {
                tile_y = Math.floor(y / (props.scaleFactor * props.initialScaleFactor) + props.origin.y);
                tile_x = Math.floor(x / (props.scaleFactor * props.initialScaleFactor) + props.origin.x);

                color = tiles[tile_y][tile_x].get('color');

                props.dataArray.set(
                    [color.red, color.green, color.blue, 255],
                    y * ctx.canvas.width * 4 + x * 4
                );
            }
        }
    };

    this.prepareVegetation = function (plants) {
        var plant;

        for (var y = 0; y < plants.length; y++) {
            for (var x = 0; x < plants[y].length; x++) {
                for (var i = 0; i < plants[y][x].length; i++) {
                    plant = plants[y][x][i];

                    relativPosition = {
                        x: plant.get('x') - props.origin.x,
                        y: plant.get('y') - props.origin.y
                    };

                    if (relativPosition.x > -plant.get('size') / 2 &&
                        relativPosition.y > -plant.get('size') / 2 &&
                        relativPosition.x < 256 / props.scaleFactor + plant.get('size') / 2 &&
                        relativPosition.y < 256 / props.scaleFactor + plant.get('size') / 2) {
                        props.dataArray.set(
                            [0, 255, 0, 255],
                            Math.round(relativPosition.y * props.initialScaleFactor * props.scaleFactor) * ctx.canvas.width * 4 +
                            Math.round(relativPosition.x * props.initialScaleFactor * props.scaleFactor) * 4
                        );
                    }
                }
            }
        }
    };

    this.render = function () {
        ctx.putImageData(new ImageData(props.dataArray, ctx.canvas.width, ctx.canvas.height), 0, 0);
    }
}