self.addEventListener('message', function (e) {
    self.postMessage({
        callback: e.data.callback,
        data: generateImageData(e.data.data)
    });
});

function generateImageData(data) {
    var segmentSize = {
        original: Math.floor(data.size / (data.splitNumber + 1)),
        x: Math.floor(data.size / (data.splitNumber + 1)),
        y: Math.floor(data.size / (data.splitNumber + 1))
    };

    if (data.x === data.splitNumber) segmentSize.x = data.size - data.x * segmentSize.x;
    if (data.y === data.splitNumber) segmentSize.y = data.size - data.y * segmentSize.y;

    var dataArray = new Uint8ClampedArray(segmentSize.x * segmentSize.y * 4);

    for (y = 0; y < segmentSize.y; y++) {
        for (x = 0; x < segmentSize.x; x++) {
            tile_y = Math.floor((data.y * segmentSize.original + y) / data.scaleFactor + data.origin.y);
            tile_x = Math.floor((data.x * segmentSize.original + x) / data.scaleFactor + data.origin.x);

            dataArray.set(
                [data.colors[tile_y][tile_x][0], data.colors[tile_y][tile_x][1], data.colors[tile_y][tile_x][2], 255],
                y * segmentSize.x * 4 + x * 4
            );
        }
    }

    return new ImageData(dataArray, segmentSize.x, segmentSize.y);
}