var app = angular.module("switch-app", [])
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

app.controller("SwitchAppController", function($scope, $http, $window, $interval, $timeout) {
  $scope.loading = true;
  
  //
  // Refreshes the state of all switches
  //
  $scope.reload = function() {
    $http.get($scope.api.links.switches).then(function(response) {
      $scope.loading = false;
      $scope.switches = response.data;
    });
  };
  
  //
  // Gets a description of when a switch will be turning off relative to now.
  // E.G. "in an hour"
  //
  $scope.switchOffWhen = function() {
    if(this.switch.state.is != "on" || !this.switch.state.until) {
      return;
    }
    
    return moment(this.switch.state.until).fromNow();
  }
  
  //
  // Builds the message for the state bar.  Takes a message to display when
  // the switch is unplugged, and a message to describe when it's turning off.
  // Puts them together with a comma if they both need to be displayed.
  //
  $scope.getStateMessage = function(displayParts) {
    var parts = [];
    if(this.switch.state.unplugged) {
      parts.push(displayParts.unplugged);
    }
    if(this.switch.state.until) {
      parts.push(displayParts.until);
    }
    
    var message = parts.join(displayParts.joiner);
    return message.firstLetterToUpperCase();
  }
  
  //
  // Makes an API call to toggle the switch on/off from its current state of
  // off/on.
  //
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
      
      $timeout($scope.reload, 1000);
    });
  }
  
  //
  // Redirects to authorization process
  //
  $scope.authorize = function() {
    $window.location.href = "/authorize";
  };
  
  //
  // Start everything up by calling the API root so we can get our app info
  // and links to other actions.
  //
  $http.get("/api").then(function(response) {
    $scope.api = response.data;
    $scope.reload();
    $interval($scope.reload, 5000);
  });
});

String.prototype.firstLetterToUpperCase = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}