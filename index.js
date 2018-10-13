var Game = {
    ctx: null,
    vegetationStarted: false,
    renderActive: true,
    speed: 1,
    init: function (terrain_name) {
        var that = this;

        this.ctx = $('#terrain')[0].getContext('2d');
        $(this.ctx.canvas).attr('width', $(this.ctx.canvas).height()).attr('height', $(this.ctx.canvas).height());

        this.Terrain = new Terrain(this.ctx, terrain_name);
        this.InteractionHandler = new InteractionHandler(this.ctx);
        this.Renderer = new Renderer(this.ctx);
        this.Vegetation = new Vegetation(this.ctx);

        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;


        $('#start_time').on('click', function () {
            if ($(this).hasClass('start')) {
                $(this).text('Pausieren');
                if (!$('#start_vegetation').hasClass('started')) $('#start_vegetation').prop('disabled', false);

                that.start('time');
            } else {
                $(this).text('Fortsetzen');
                that.stop();
            }

            $(this).toggleClass('start pause');
        });

        $('#start_vegetation').on('click', function () {
            that.start('vegetation');
            $(this).addClass('started').prop('disabled', true);
        });

        $('#game_speed').on('input', function(e) {
            that.speed = Math.pow(2, e.target.value / 10);
        });

        $('#render_active').on('change', function(e) {
            that.renderActive = e.target.checked;
        });
    },
    step: function (time) {
        this.Terrain.step(time);
        if (this.vegetationStarted) this.Vegetation.step(time);
        if (this.renderActive) this.render();
    },
    render: function () {
        this.Renderer.renderTerrain(this.Terrain.props.tiles, this.InteractionHandler.props.origin, this.InteractionHandler.props.zoomLvl);
        if (this.vegetationStarted) this.Renderer.renderVegetation(this.Vegetation.props.plants.unsorted);
    },
    stopped: false,
    timer: null,
    start: function (what) {
        if (what === 'time') {
            this.stopped = false;
            this.timer = new Timer();
            this.timer.step();
            this.run(0.01);
        } else if (what === 'vegetation') {
            this.vegetationStarted = true;
        }
    },
    run: function (time) {
        var that = this;

        if (!this.stopped) {
            this.step(Math.min(1, time * this.speed));
            this.timer.step();
            $('#fps').text(Math.round(10000 / this.timer.get('last')) / 10 + ' fps');

            setTimeout(function () {
                that.run(that.timer.get('last') / 1000);
            });
        }
    },
    stop: function () {
        this.stopped = true;
    }
};

var Helper = {
    clamp: function(value, min, max) {
        if (value < min) value = min;
        else if (value > max) value = max;
        return value;
    },
    random: function(min, max, int) {
        if (typeof int === 'undefined') int = false;

        if (int) {
            return Math.floor(Math.random() * (max + 1 - min)) + min;
        } else {
            return Math.random() * (max - min) + min;
        }
    }
};

var Analyzer = {
    values: {},
    add: function (category, value) {
        if (typeof this.values[category] === 'undefined') this.values[category] = [];
        this.values[category].push(value);
    },
    get: function (category, what) {
        if (what === 'min') {
            return Math.min(...this.values[category]);
        } else if (what === 'max') {
            return Math.max(...this.values[category]);
        } else if (what === 'avg') {
            return this.get(category, 'sum') / this.values[category].length;
        } else if (what === 'sum') {
            var sum = 0;
            for (var i = 0; i < this.values[category].length; i++) {
                sum += this.values[category][i]
            }
            return sum;
        }
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