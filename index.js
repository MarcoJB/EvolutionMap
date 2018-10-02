var Game = {
    ctx: null,
    init: function (terrain_name) {
        this.ctx = $('#terrain')[0].getContext('2d');

        this.Terrain = new Terrain(this.ctx, terrain_name);
        this.InteractionHandler = new InteractionHandler(this.ctx);
        this.Renderer = new Renderer(this.ctx);
        this.Vegetation = new Vegetation(this.ctx);

        this.ctx.mozImageSmoothingEnabled = false;
    },
    step: function (time) {
        this.Terrain.step(time);
        this.Renderer.prepareTerrain(this.Terrain.get('tiles'), this.InteractionHandler.get('origin'), this.InteractionHandler.get('zoomLvl'));
        this.Renderer.prepareVegetation(this.Vegetation.get('plants'));
        this.Renderer.render();
    },
    render: function () {
        this.Renderer.prepareTerrain(this.Terrain.get('tiles'), this.InteractionHandler.get('origin'), this.InteractionHandler.get('zoomLvl'));
        this.Renderer.prepareVegetation(this.Vegetation.get('plants'));
        this.Renderer.render();
    }
};

var Helper = {
    clamp: function(value, min, max) {
        if (value < min) value = min;
        else if (value > max) value = max;
        return value;
    }
};

$(function() {
    Game.init('terrain2_res');
    /*var ctx = $('canvas')[0].getContext('2d');

    var img = new Image();
    img.src = 'terrain/terrain2.png';
    img.onload = function () {
        ctx.drawImage(img, 0, 0);
    };*/
});