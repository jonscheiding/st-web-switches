var app = angular.module("app", [])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push(function($q, $rootScope) {
      return {
        'responseError': function(response) {
          if(response.status == 401) {
            $rootScope.authorizationMissing = true;
            $rootScope.loading = false;
          }
          return $q.reject(response);
        }
      };
    });
  });

app.controller("AppController", function($scope, $http, $window) {
  $scope.loading = true;
  
  $http.get("/api/switches").then(function(response) {
    $scope.loading = false;
    $scope.switches = response.data;
  });
  
  $scope.authorize = function() {
    $window.location.href = "/authorize";
  };
  
  $scope.switchOffWhen = function() {
    if(this.switch.state.is != "on" || !this.switch.state.until) {
      return;
    }
    
    return moment(this.switch.state.until).fromNow();
  }
  
  $scope.toggle = function() {
    var $this = this;
    var newState = $this.switch.state.is == "off" ? "on" : "off";
    
    $scope.changingSwitch = {
      label: $this.switch.label,
      to: newState
    };
    
    var url = $this.switch.links[newState];
    $http.put(url).then(function(response) {
      $scope.changingSwitch = null;
      $this.switch = response.data;
    });
  }
});