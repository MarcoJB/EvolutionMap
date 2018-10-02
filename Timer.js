function Timer() {
    var moments = [];

    this.step = function() {
        moments.push(new Date().getTime())
    }

    this.get = function(what) {
        if (moments.length < 1) return false;

        if (what == 'first') {
            return moments[1] - moments[0];
        } else if (what == 'last') {
            return moments[moments.length - 1] - moments[moments.length - 2];
        } else if (what == 'min') {
            return Math.min(...this.get('all'));
        } else if (what == 'max') {
            return Math.max(...this.get('all'));
        } else if (what == 'avg') {
            return (moments[moments.length-1] - moments[0]) / (moments.length - 1);
        } else if (what == 'total') {
            return moments[moments.length-1] - moments[0];
        } else if (what == 'all') {
            var times = [];
            for (var i = 0; i < moments.length - 1; i++) {
                times.push(moments[i + 1] - moments[i]);
            }
            return times;
        } else if (typeof what == 'number' && what < moments.length - 1) {
            return moments[what + 1] - moments[what];
        }
    }

    this.reset = function() {
        moments = [];
    }
}