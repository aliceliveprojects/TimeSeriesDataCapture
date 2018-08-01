app.controller('homeController', ['$scope', '$log', '$filter', 'authenticationService', 'oneDriveAuthenticationService', 'searchPageService', 'dtFormatterService', '$state', '$stateParams', 'JSTagsCollection', function ($scope, $log, $filter, authenticationService, oneDriveAuthenticationService, searchPageService, dtFormatterService, $state, $stateParams, JSTagsCollection) {

    $scope.login = function () {
        authenticationService.login();
    }


    $scope.results = [];

    $scope.loginOneDrive = function () {
        oneDriveAuthenticationService.login();
    }

    $scope.inputChange = function (search) {
        if (search.length > 0) {
            searchPageService.tagPrediction($filter('lowercase')(search)).then(function (result) {
                if (result.length > 0) {
                    $scope.search = result[0].tag;
                    $scope.$apply();
                }
            });
        }
    }

    $scope.searchClick = function () {

        $log.log($scope.tags.tags)
        if (Object.keys($scope.tags.tags).length > 0) {
            $state.go('.', {
                query: $scope.extractTags()
            });
        }

    }

    $scope.extractTags = function () {
        var query = '';
        Object.keys($scope.tags.tags).forEach(function (key, index) {
            query += ' ' + ($scope.tags.tags[key].value);
        });
        return query;
    }

    $scope.dateDecode = function (date) {
        return dtFormatterService.dateDecode(date);
    }

    $scope.timeDecode = function (time) {
        return dtFormatterService.timeDecode(time);
    }

    this.uiOnParamsChanged = function (newParams) {
        if (newParams.query != undefined) {
            searchPageService.search(newParams.query).then(function (result) {
                $scope.results = result;
                $scope.$apply();
            })
        }

    }

    if ($stateParams.query != undefined) {
        $log.log($stateParams);
        this.uiOnParamsChanged($stateParams);
        $scope.search = $stateParams.query;
        var queryArray = ($stateParams.query.split(' '));
        queryArray = (queryArray.splice(1));
        $scope.tags = new JSTagsCollection(queryArray);


    } else {
        $scope.tags = new JSTagsCollection([]);
    }

  // Export jsTags options, inlcuding our own tags object
  $scope.jsTagOptions = {
    'tags': $scope.tags
  };

  // **** Typeahead code **** //

  // Build suggestions array
  var suggestions = ['gold','silver'];
  suggestions = suggestions.map(function(item) { return { "suggestion": item } });
 
  // Instantiate the bloodhound suggestion engine
  var suggestions = new Bloodhound({
    datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.suggestion); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: suggestions
  });


  // Initialize the bloodhound suggestion engine
  suggestions.initialize();

  // Single dataset example
  $scope.exampleData = {
    displayKey: 'suggestion',
    source: suggestions.ttAdapter()
  };

  // Typeahead options object
  $scope.exampleOptions = {
    hint: false,
    highlight: true
  };



  



















}])