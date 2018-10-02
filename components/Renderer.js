function Renderer(ctx) {
    var initialScaleFactor = ctx.canvas.height / 256;
    var dataArray = new Uint8ClampedArray(ctx.canvas.width * ctx.canvas.height * 4);

    this.render = function (tiles, origin, zoomLvl) {
        var x, y, tile_x, tile_y, color;

        var scaleFactor = Math.pow(2, zoomLvl) * initialScaleFactor;

        origin.x = Helper.clamp(origin.x, 0, 256 * (1 - initialScaleFactor / scaleFactor));
        origin.y = Helper.clamp(origin.y, 0, 256 * (1 - initialScaleFactor / scaleFactor));

        for (y = 0; y < ctx.canvas.height; y++) {
            for (x = 0; x < ctx.canvas.width; x++) {
                tile_y = Math.floor(y / scaleFactor + origin.y);
                tile_x = Math.floor(x / scaleFactor + origin.x);

                color = tiles[tile_y][tile_x].get('color');

                dataArray.set(
                    [color.red, color.green, color.blue, 255],
                    y * ctx.canvas.width * 4 + x * 4
                );
            }
        }

        ctx.putImageData(new ImageData(dataArray, ctx.canvas.width, ctx.canvas.height), 0, 0);
    }
}