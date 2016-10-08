import angular from 'angular'
import deepIs from 'deep-is'
import clone from 'clone'
import moment from 'moment'

const app = angular.module('switch-app', [])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push(function($q, $rootScope) {
      return {
        'responseError': function(response) {
          if(response.status == 401) {
            $rootScope.authorizationMissing = true
            $rootScope.loading = false
          }
          return $q.reject(response)
        }
      }
    })
  })

app.controller('SwitchAppController', function($scope, $http, $window, $interval, $timeout) {
  $scope.loading = true
  
  //
  // Refreshes the state of all switches
  //
  {
    let switches = {}
    $scope.reload = function() {
      $http.get($scope.api.links.switches).then(function(response) {
        $scope.loading = false
        if(deepIs(switches, response.data)) {
          return
        }
        
        switches = response.data
        $scope.switches = clone(switches) // Have to clone because Angular modifies our objects
      })
    }
  }
  
  //
  // Gets a description of when a switch will be turning off relative to now.
  // E.G. "in an hour"
  //
  $scope.getTimerDescription = function() {
    if(!this.switch.timer) return null
    return moment(Date.parse(this.switch.timer.at)).fromNow()
  }
  
  $scope.getStateColor = function() {
    switch(this.switch.state.currently) {
      case 'on': return this.switch.unplugged ? 'red' : 'green'
      case 'turning on': return 'orange'
      default: return 'grey'
    }
  }
  
  $scope.getStateDescription = function() {
    if(this.switch.state.currently == 'on' && this.switch.unplugged) {
      return 'on, unplugged'
    }
    
    return this.switch.state.currently
  }
  
  $scope.canToggle = function() {
    switch(this.switch.state.currently) {
      case 'turning on':
      case 'turning off':
        return false
    }
    
    return true
  }
  
  //
  // Makes an API call to toggle the switch on/off from its current state of
  // off/on.
  //
  $scope.toggle = function() {
    const $this = this
    const newState = $this.switch.state.currently == 'off' ? 'on' : 'off'
    
    const url = $this.switch.links[newState]
    $http.post(url).then(function(response) {
      $scope.changingSwitch = null
      $this.switch = response.data
      
      $timeout($scope.reload, 1000)
    })
  }
  
  //
  // Start everything up by calling the API root so we can get our app info
  // and links to other actions.
  //
  $http.get('/api').then(function(response) {
    $scope.api = response.data
    $scope.reload()
    $interval($scope.reload, 2000)
  })
})

String.prototype.firstLetterToUpperCase = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}