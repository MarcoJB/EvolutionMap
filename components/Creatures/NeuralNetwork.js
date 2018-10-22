function NeuralNetwork(input_neurons, hidden_neurons, output_config) {
    this.props = {
        weights: [],
        hidden_neuron_values: [],
        real_output_config: []
    };

    for (var i = 0; i < output_config.length + hidden_neurons; i++) {
        this.props.weights[i] = [];

        for (var j = 0; j < input_neurons + hidden_neurons; j++) {
            this.props.weights[i][j] = Math.pow(Helper.random(-1, 1), 3);
        }
    }

    for ( var i = 0; i < hidden_neurons; i++) {
        this.props.hidden_neuron_values[i] = 0;
        this.props.real_output_config[i] = 'atan';
    }
    this.props.real_output_config = this.props.real_output_config.concat(output_config);

    this.calc = function(inputs) {
        if (inputs.length != input_neurons) throw(new Error('Inputsize differs: ' + inputs.length + ' vs. ' + input_neurons));

        var real_inputs = inputs.concat(this.props.hidden_neuron_values);

        var real_outputs = Helper.matMul(this.props.weights, real_inputs);

        var real_outputs = Helper.activateVector(real_outputs, this.props.real_output_config);

        this.props.hidden_neuron_values = real_outputs.slice(0, hidden_neurons);

        return real_outputs.slice(hidden_neurons);
    }
}