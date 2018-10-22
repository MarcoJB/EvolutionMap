function Creatures() {
    this.props = {
        creatures: []
    };

    this.createCreature = function() {
        this.props.creatures.push(new Creature());
    };

    this.step = function(time) {
        for (var i = 0; i < this.props.creatures.length; i++) {
            this.props.creatures[i].step(time);
        }
    };
}