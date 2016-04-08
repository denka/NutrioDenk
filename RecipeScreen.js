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

var ApiKeys = require('./ApiKeys');
var entities = require('entities');

var API_URL = 'https://api.nutrio.com/api/';
var MEAL_URL = API_URL + 'v3/meals';

var RecipeScreen = React.createClass({
  getInitialState: function() {
    return {
      isLoading: true,
      meal: {},
      recipes: [],
      ingredientsDataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      prepNotesDataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
    };
  },
  render: function() {
    var meal = this.state.meal
    return (
      <ScrollView
        isLoading={this.state.isLoading}>
        <View>
          <Image
            source={{uri: this.getImageUrl(meal.images)}}
            style={styles.detailsImage}
          />
          <Text style={styles.mealName}>{meal.name}</Text>
          <Text style={styles.mealDetail}>Serves: {meal.number_of_servings} * Prep Time: {meal.prep_time_in_minutes} * Total Time: {meal.total_time_in_minutes}</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Ingredients:</Text>
          <ListView
            dataSource={this.state.ingredientsDataSource}
            renderRow={(recipeFood) => <Text>{recipeFood.amount_for_display} {entities.decodeHTML(recipeFood.food.name)}</Text>}
          />
          <Text style={styles.sectionTitle}>Prep Notes:</Text>
          <ListView
            dataSource={this.state.prepNotesDataSource}
            renderRow={(prepNote) => <Text>{entities.decodeHTML(prepNote.action)}</Text>}
          />
        </View>
      </ScrollView>
    );
  },
  
  getImageUrl: function(images: Array<any>) {
    if(images && images.length > 0){
      return("https://demo.nutrio.com/"+images.slice(-1)[0].url);
    }
    return('');
  },
  
  getDataSource: function(field: string, arry: Array<any>): ListView.DataSource {
    return this.state[field].cloneWithRows(arry);
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
          ingredientsDataSource: this.getDataSource('ingredientsDataSource', responseData[0].recipes[0].recipe_foods),
          prepNotesDataSource: this.getDataSource('prepNotesDataSource', responseData[0].recipes[0].prep_notes),
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#327fc1',
    color: 'rgba(255,255,255,0.95)',
    fontSize: 16,
    padding: 10,
    marginTop: -20,
    marginBottom: 10,    
  },
  mealDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#327fc1',
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    padding: 10,
    marginTop: -20,
    marginBottom: 10,    
  },
  sectionTitle: {
    marginTop: 5,
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
    flexDirection: 'row',
    height: 250,
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
