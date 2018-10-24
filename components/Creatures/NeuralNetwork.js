function NeuralNetwork(input_neurons, hidden_neurons, output_activation) {
    var i;
    var maxHiddenNeurons = 20;

    this.props = {
        weights: [],
        hidden_neuron_values: [],
        hidden_neuron_activation: []
    };

    for (i = 0; i < output_activation.length + maxHiddenNeurons; i++) {
        this.props.weights[i] = [];

        for (var j = 0; j < input_neurons + maxHiddenNeurons; j++) {
            if (i - output_activation.length >= hidden_neurons || j - input_neurons.length >= hidden_neurons) {
                this.props.weights[i][j] = 0;
            } else {
                this.props.weights[i][j] = Helper.random(-1, 1);
            }
        }
    }

    for (i = 0; i < maxHiddenNeurons; i++) {
        this.props.hidden_neuron_values[i] = 0;
        this.props.hidden_neuron_activation[i] = 'atan';
    }

    this.calc = function(inputs) {
        if (inputs.length !== input_neurons) throw(new Error('Inputsize differs: ' + inputs.length + ' vs. ' + input_neurons));

        var real_inputs = inputs.concat(this.props.hidden_neuron_values);
        var real_output_configuration = output_activation.concat(this.props.hidden_neuron_activation);

        var real_outputs = Helper.matMul(this.props.weights, real_inputs);

        real_outputs = Helper.activateVector(real_outputs, real_output_configuration);

        this.props.hidden_neuron_values = real_outputs.slice(output_activation.length);

        return real_outputs.slice(0, output_activation.length);
    }
}