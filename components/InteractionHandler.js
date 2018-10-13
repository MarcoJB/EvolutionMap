function InteractionHandler(ctx) {
    this.props = {
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


    var that = this;

    $('#terrain').on('wheel', function (e) {
        that.zoom(
            Math.sign(e.originalEvent.deltaY),
            e.originalEvent.layerX,
            e.originalEvent.layerY
        );
    });

    $('#map').on('mousedown', function (e) {
        that.onInteractionStart(e);
    });
    $(window).on('mouseup', function (e) {
        that.onInteractionEnd(e);
    }).on('mousemove', function (e) {
        that.onInteractionMove(e);
    });


    this.zoom = function(direction, x, y) {
        var tile;

        tile = {
            before: this.pxToTile(x, y)
        };

        this.props.zoomLvl -= direction * 0.2;
        if (this.props.zoomLvl < 0) this.props.zoomLvl = 0;
        this.props.scaleFactor = Math.pow(2, this.props.zoomLvl);

        tile.after = this.pxToTile(x, y);

        this.props.origin.x += tile.before.x - tile.after.x;
        this.props.origin.y += tile.before.y - tile.after.y;
        this.props.origin.x = Helper.clamp(this.props.origin.x, 0, 256 * (1 - 1 / this.props.scaleFactor));
        this.props.origin.y = Helper.clamp(this.props.origin.y, 0, 256 * (1 - 1 / this.props.scaleFactor));

        Game.render();
    };

    this.onInteractionStart = function(e) {
        this.props.dragging = true;

        this.props.startPos.x = e.screenX;
        this.props.startPos.y = e.screenY;

        $('html').addClass('grabbing');
    };

    this.onInteractionEnd = function() {
        this.props.dragging = false;
        $('html').removeClass('grabbing');
    };

    this.onInteractionMove = function(e) {
        if (this.props.dragging) {
            this.props.origin.x -= 2 * (e.screenX - this.props.startPos.x) / (this.props.scaleFactor * this.props.initialScaleFactor) * ctx.canvas.width / $(ctx.canvas).width();
            this.props.origin.y -= 2 * (e.screenY - this.props.startPos.y) / (this.props.scaleFactor * this.props.initialScaleFactor) * ctx.canvas.height / $(ctx.canvas).height();
            this.props.origin.x = Helper.clamp(this.props.origin.x, 0, 256 * (1 - 1 / this.props.scaleFactor));
            this.props.origin.y = Helper.clamp(this.props.origin.y, 0, 256 * (1 - 1 / this.props.scaleFactor));

            this.props.startPos.x = e.screenX;
            this.props.startPos.y = e.screenY;

            Game.render();
        }
    };

    this.pxToTile = function(cursor_x, cursor_y) {
        var visibleTiles, tile;

        visibleTiles = 256 / this.props.scaleFactor;

        tile = {
            x: this.props.origin.x + cursor_x / $(ctx.canvas).width() * visibleTiles,
            y: this.props.origin.y + cursor_y / $(ctx.canvas).height() * visibleTiles
        };

        return tile;
    };


    this.get = function (prop) {
        return this.props[prop];
    }
}