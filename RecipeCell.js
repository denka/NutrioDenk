'use strict';

var React = require('react-native');
var {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableNativeFeedback,
  View
} = React;

var RecipeCell = React.createClass({
  render: function() {
    var recipe = this.props.recipe;
    var TouchableElement = TouchableHighlight;
    var recipeDetails = recipe.number_of_servings ?
      <Text style={styles.recipeDetail}>
      Serves: {recipe.number_of_servings} • Prep Time: {recipe.prep_time_in_minutes} • Total Time: {recipe.total_time_in_minutes}
      </Text> :
      <Text/>;
    return (
      <View>
        <TouchableElement
          onPress={this.props.onSelect}
          onShowUnderlay={this.props.onHighlight}
          onHideUnderlay={this.props.onUnhighlight}>
          <View style={styles.row}>
            <Text style={styles.recipeName}>
              {this.props.recipe.name}
            </Text>
            {recipeDetails}
          </View>
        </TouchableElement>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  row: {
    backgroundColor: 'white',
    padding: 5,
  },
  recipeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    flexDirection: 'row',
    height: 20,
  },
  recipeDetail: {
    flex: 1,
    flexDirection: 'row',
    fontSize: 11,
  },
  cellImage: {
    backgroundColor: '#dddddd',
    height: 93,
    marginRight: 10,
    width: 60,
  },
});

module.exports = RecipeCell;
