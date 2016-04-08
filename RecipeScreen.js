/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ListView,
} = React;

var ApiKeys = require('./ApiKeys')

var API_URL = 'https://api.nutrio.com/api/';
var MEAL_URL = API_URL + 'v3/meals';

var RecipeScreen = React.createClass({
  getInitialState: function() {
    return {
      isLoading: true,
      meal: {},
      recipes: [],
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
    };
  },
  render: function() {
    var meal = this.state.meal
    return (
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        isLoading={this.state.isLoading}>
        <View>
          <Image
            source={{uri: this.getImageUrl(meal.images)}}
            style={styles.detailsImage}
          />
        </View>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text>Serves: {meal.number_of_servings}</Text>
        <Text>Prep Time: {meal.prep_time_in_minutes}</Text>
        <Text>Total Time: {meal.total_time_in_minutes}</Text>
        <Text>needs attention: {meal.needs_attention}</Text>
        <Text>Ingredients:</Text>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={(recipeFood) => <Text>{recipeFood.amount_for_display} {recipeFood.food.name}</Text>}
        />
      </ScrollView>
    );
  },
  
  getImageUrl: function(images: Array<any>) {
    if(images && images.length > 0){
      return("https://demo.nutrio.com/"+images.slice(-1)[0].url);
    }
    return('');
  },
  
  getDataSource: function(recipes: Array<any>): ListView.DataSource {
    return this.state.dataSource.cloneWithRows(recipes);
  },
  
  componentDidMount: function() {
    this.getMeal(this.props.recipe.guid);
  },
  
  getMeal: function(mealGuid: string) {
    var obj = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': "Basic "+ btoa('api_key_ignored:' + ApiKeys.user)
      }
    }
    fetch(MEAL_URL + "?guid=" + mealGuid, obj)
      .then((response) => response.json())
      .catch((error) => {
        this.setState({
          meal: {},
          isLoading: false,
        });
      })
      .then((responseData) => {
        this.setState({
          isLoading: false,
          meal: responseData[0].meal,
          dataSource: this.getDataSource(responseData[0].recipes[0].recipe_foods),
        });
      })
      .done();
  },
});

var styles = StyleSheet.create({
  contentContainer: {
    padding: 10,
  },
  rightPane: {
    justifyContent: 'space-between',
    flex: 1,
  },
  mealName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  rating: {
    marginTop: 10,
  },
  ratingTitle: {
    fontSize: 14,
  },
  ratingValue: {
    fontSize: 28,
    fontWeight: '500',
  },
  mpaaWrapper: {
    alignSelf: 'flex-start',
    borderColor: 'black',
    borderWidth: 1,
    paddingHorizontal: 3,
    marginVertical: 5,
  },
  mpaaText: {
    fontFamily: 'Palatino',
    fontSize: 13,
    fontWeight: '500',
  },
  mainSection: {
    flexDirection: 'row',
  },
  detailsImage: {
    width: 134,
    height: 200,
    backgroundColor: '#eaeaea',
    marginRight: 10,
  },
  separator: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  castTitle: {
    fontWeight: '500',
    marginBottom: 3,
  },
  castActor: {
    marginLeft: 2,
  },
});

module.exports = RecipeScreen;
