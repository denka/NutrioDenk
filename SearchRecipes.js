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
  ActivityIndicatorIOS,
  ListView,
  Platform,
  ProgressBarAndroid,
  StyleSheet,
  Text,
  View,
} = React;
var TimerMixin = require('react-timer-mixin');
var invariant = require('fbjs/lib/invariant');
var dismissKeyboard = require('dismissKeyboard');

var RecipeScreen = require('./RecipeScreen');
var SearchBar = require('./SearchBar');
var ApiKeys = require('./ApiKeys')
var RecipeCell = require('./RecipeCell');

/**
 * This is for demo purposes only, and rate limited.
 * In case you want to use the Rotten Tomatoes' API on a real app you should
 * create an account at http://developer.rottentomatoes.com/
 */
var API_URL = 'https://api.nutrio.com/api/';
var FEATURED_RECIPES_URL = API_URL + 'v2/search/featured_recipes';

// Results should be cached keyed by the query
// with values of null meaning "being fetched"
// and anything besides null and undefined
// as the result of a valid query
var resultsCache = {
  dataForQuery: {},
  nextPageNumberForQuery: {},
  totalForQuery: {},
};

var LOADING = {};

var SearchRecipes = React.createClass({
  mixins: [TimerMixin],

  timeoutID: (null: any),

  getInitialState: function() {
    return {
      isLoading: false,
      isLoadingTail: false,
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      filter: '',
      queryNumber: 0,
    };
  },

  componentDidMount: function() {
    this.getFeaturedRecipes();
  },

  _urlForQueryAndPage: function(): string {
    return (
      API_URL + 'v5/search/recipes_by_keywords'
    );
  },
  
  getFeaturedRecipes: function() {
    var cachedResultsForQuery = resultsCache.dataForFeaturedRecipes;
    
    this.setState({
      isLoading: true,
      isLoadingTail: false,
    });
    var authEncoded = "Basic "+ btoa('cobrand_api_key_ignored:' + ApiKeys.user);
    var obj = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authEncoded
      }
    }
    
    fetch(FEATURED_RECIPES_URL, obj)
      .then((response) => response.json())
      .catch((error) => {
        resultsCache.dataForFeaturedRecipes = undefined;

        this.setState({
          dataSource: this.getDataSource([]),
          isLoading: false,
        });
      })
      .then((responseData) => {
        this.setState({
          isLoading: false,
          dataSource: this.getDataSource(responseData.hits),
        });
      })
      .done();
  },

  searchRecipes: function(query: string) {
    this.setState({filter: query});

    var cachedResultsForQuery = resultsCache.dataForQuery[query];
    if (cachedResultsForQuery) {
      if (!LOADING[query]) {
        this.setState({
          dataSource: this.getDataSource(cachedResultsForQuery),
          isLoading: false
        });
      } else {
        this.setState({isLoading: true});
      }
      return;
    }
    
    this.setState({
      isLoading: true,
      queryNumber: this.state.queryNumber + 1,
      isLoadingTail: false,
    });
    var authEncoded = "Basic "+ btoa('cobrand_api_key_ignored:' + ApiKeys.user);
    var obj = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authEncoded
      },
      body: JSON.stringify({
        page_size: 10,
        page_number: 1,
        order_by: 'name',
        order_direction: 'asc',
        term: query
      })
    }

    fetch(this._urlForQueryAndPage(), obj)
      .then((response) => response.json())
      .catch((error) => {
        LOADING[query] = false;
        resultsCache.dataForQuery[query] = undefined;

        this.setState({
          dataSource: this.getDataSource([]),
          isLoading: false,
        });
      })
      .then((responseData) => {
        LOADING[query] = false;
        resultsCache.totalForQuery[query] = responseData.total_records;
        resultsCache.dataForQuery[query] = responseData.meals;
        resultsCache.nextPageNumberForQuery[query] = 2;

        if (this.state.filter !== query) {
          // do not update state if the query is stale
          return;
        }

        this.setState({
          isLoading: false,
          dataSource: this.getDataSource(responseData.meals),
        });
      })
      .done();
  },
  
  renderSeparator: function(
    sectionID: number | string,
    rowID: number | string,
    adjacentRowHighlighted: boolean
  ) {
    var style = styles.rowSeparator;
    if (adjacentRowHighlighted) {
      style = [style, styles.rowSeparatorHide];
    }
    return (
      <View key={'SEP_' + sectionID + '_' + rowID}  style={style}/>
    );
  },
  
  renderRow: function(
    recipe: Object,
    // sectionID: number | string,
    // rowID: number | string,
    // highlightRowFunc: (sectionID: ?number | string, rowID: ?number | string) => void,
  ) {
    return (
      <RecipeCell 
        key={recipe.id}
        onSelect={() => this.selectRecipe(recipe)}
        recipe={recipe}
      />
    );
  },

  hasMore: function(): boolean {
    var query = this.state.filter;
    if (!resultsCache.dataForQuery[query]) {
      return true;
    }
    return (
      resultsCache.totalForQuery[query] !==
      resultsCache.dataForQuery[query].length
    );
  },

  onEndReached: function() {
    var query = this.state.filter;
    if (!this.hasMore() || this.state.isLoadingTail) {
      // We're already fetching or have all the elements so noop
      return;
    }

    if (LOADING[query]) {
      return;
    }

    LOADING[query] = true;
    this.setState({
      queryNumber: this.state.queryNumber + 1,
      isLoadingTail: true,
    });

    var page = resultsCache.nextPageNumberForQuery[query];
    invariant(page != null, 'Next page number for "%s" is missing', query);
    fetch(this._urlForQueryAndPage())
      .then((response) => response.json())
      .catch((error) => {
        console.error(error);
        LOADING[query] = false;
        this.setState({
          isLoadingTail: false,
        });
      })
      .then((responseData) => {
        var recipesForQuery = resultsCache.dataForQuery[query].slice();

        LOADING[query] = false;
        // We reached the end of the list before the expected number of results
        if (!responseData.movies) {
          resultsCache.totalForQuery[query] = moviesForQuery.length;
        } else {
          for (var i in responseData.meals) {
            recipesForQuery.push(responseData.meals[i]);
          }
          resultsCache.dataForQuery[query] = recipesForQuery;
          resultsCache.nextPageNumberForQuery[query] += 1;
        }

        if (this.state.filter !== query) {
          // do not update state if the query is stale
          return;
        }

        this.setState({
          isLoadingTail: false,
          dataSource: this.getDataSource(resultsCache.dataForQuery[query]),
        });
      })
      .done();
  },

  getDataSource: function(meals: Array<any>): ListView.DataSource {
    return this.state.dataSource.cloneWithRows(meals);
  },

  selectRecipe: function(recipe: Object) {
    if (Platform.OS === 'ios') {
      this.props.navigator.push({
        name: recipe.name,
        component: RecipeScreen,
        passProps: {recipe},
      });
    } else {
      dismissKeyboard();
      this.props.navigator.push({
        title: recipe.name,
        name: 'recipe',
        movie: recipe,
      });
    }
  },

  onSearchChange: function(event: Object) {
    var filter = event.nativeEvent.text.toLowerCase();

    this.clearTimeout(this.timeoutID);
    this.timeoutID = this.setTimeout(() => this.searchRecipes(filter));
  },

  renderFooter: function() {
    if (!this.hasMore() || !this.state.isLoadingTail) {
      return <View style={styles.scrollSpinner} />;
    }
    if (Platform.OS === 'ios') {
      return <ActivityIndicatorIOS style={styles.scrollSpinner} />;
    } else {
      return (
        <View style={{alignItems: 'center'}}>
          <ProgressBarAndroid styleAttr="Large"/>
        </View>
      );
    }
  },

  render: function() {
    var content = this.state.dataSource.getRowCount() === 0 ?
      <NoRecipes
        filter={this.state.filter}
        isLoading={this.state.isLoading}
      /> :
      <ListView
        ref="listview"
        renderRow={this.renderRow}
        renderSeparator={this.renderSeparator}
        dataSource={this.state.dataSource}
        renderFooter={this.renderFooter}
        automaticallyAdjustContentInsets={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps={true}
        showsVerticalScrollIndicator={false}
      />;
      
    return (
      <View style={styles.container}>
        <SearchBar
          onSearchChange={this.onSearchChange}
          isLoading={this.state.isLoading}
          onFocus={() =>
            this.refs.listview && this.refs.listview.getScrollResponder().scrollTo({ x: 0, y: 0 })}
        />
        <View style={styles.separator} />
        {content}
      </View>
    );
  },
});

var NoRecipes = React.createClass({
  render: function() {
    var text = '';
    if (this.props.filter) {
      text = `No results for "${this.props.filter}"`;
    } else if (!this.props.isLoading) {
      // If we're looking at the latest movies, aren't currently loading, and
      // still have no results, show a message
      text = 'No Recipes found';
    }

    return (
      <View style={[styles.container, styles.centerText]}>
        <Text style={styles.noMoviesText}>{text}</Text>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centerText: {
    alignItems: 'center',
  },
  noMoviesText: {
    marginTop: 80,
    color: '#888888',
  },
  separator: {
    height: 1,
    backgroundColor: '#eeeeee',
  },
  scrollSpinner: {
    marginVertical: 20,
  },
  rowSeparator: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    height: 1,
    marginLeft: 4,
  },
  rowSeparatorHide: {
    opacity: 0.0,
  },
});

module.exports = SearchRecipes;