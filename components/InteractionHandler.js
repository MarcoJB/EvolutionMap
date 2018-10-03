function InteractionHandler(ctx) {
    var props = {
        zoomLvl: 0,
        scaleFactor: 1,
        initialScaleFactor: ctx.canvas.height / 256,
        dragging: false,
        startPos: {},
        origin: {
            x: 0,
            y: 0
        }
    };


    $('#terrain').on('wheel', function (e) {
        zoom(
            Math.sign(e.originalEvent.deltaY),
            e.originalEvent.layerX,
            e.originalEvent.layerY
        );
    });

    $('#map').on('mousedown', function (e) {
        onInteractionStart(e);
    });
    $(window).on('mouseup', function (e) {
        onInteractionEnd(e);
    }).on('mousemove', function (e) {
        onInteractionMove(e);
    });


    function zoom(direction, x, y) {
        var tile;

        tile = {
            before: pxToTile(x, y)
        };

        props.zoomLvl -= direction * 0.2;
        if (props.zoomLvl < 0) props.zoomLvl = 0;
        props.scaleFactor = Math.pow(2, props.zoomLvl);

        tile.after = pxToTile(x, y);

        props.origin.x += tile.before.x - tile.after.x;
        props.origin.y += tile.before.y - tile.after.y;
        props.origin.x = Helper.clamp(props.origin.x, 0, 256 * (1 - 1 / props.scaleFactor));
        props.origin.y = Helper.clamp(props.origin.y, 0, 256 * (1 - 1 / props.scaleFactor));

        Game.render();
    }

    function onInteractionStart(e) {
        props.dragging = true;

        props.startPos.x = e.screenX;
        props.startPos.y = e.screenY;

        $('html').addClass('grabbing');
    }

    function onInteractionEnd() {
        props.dragging = false;
        $('html').removeClass('grabbing');
    }

    function onInteractionMove(e) {
        if (props.dragging) {
            props.origin.x -= 2 * (e.screenX - props.startPos.x) / (props.scaleFactor * props.initialScaleFactor) * ctx.canvas.width / $(ctx.canvas).width();
            props.origin.y -= 2 * (e.screenY - props.startPos.y) / (props.scaleFactor * props.initialScaleFactor) * ctx.canvas.height / $(ctx.canvas).height();
            props.origin.x = Helper.clamp(props.origin.x, 0, 256 * (1 - 1 / props.scaleFactor));
            props.origin.y = Helper.clamp(props.origin.y, 0, 256 * (1 - 1 / props.scaleFactor));

            props.startPos.x = e.screenX;
            props.startPos.y = e.screenY;

            Game.render();
        }
    }

    function pxToTile(cursor_x, cursor_y) {
        var visibleTiles, tile;

        visibleTiles = 256 / props.scaleFactor;

        tile = {
            x: props.origin.x + cursor_x / $(ctx.canvas).width() * visibleTiles,
            y: props.origin.y + cursor_y / $(ctx.canvas).height() * visibleTiles
        };

        return tile;
    }


    this.get = function (prop) {
        return props[prop];
    }
}