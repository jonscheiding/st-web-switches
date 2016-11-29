import $ from 'jquery'
import deepIs from 'deep-is'
import clone from 'clone'
import moment from 'moment'

import { TimerDialogController } from '.'
import { calculateMinutesFromNow } from 'src/ui/time-helpers'

export default function($scope, $http, $interval, $timeout, $window, $mdDialog) {
  $scope.loading = true
    
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
      case 'on': return this.switch.unplugged ? 'red-400' : 'green-400'
      case 'turning on': return 'orange-400'
      default: return 'grey-400'
    }
  }
  
  $scope.getMdColors = function() {
    return {
      background: this.getStateColor()
    }
  }
  
  $scope.getStateDescription = function() {
    if(this.switch.state.currently == 'on' && this.switch.unplugged) {
      return 'on, unplugged'
    }
    
    return this.switch.state.currently
  }
  
  $scope.getOppositeState = function() {
    switch(this.switch.state.currently) {
      case 'on':
      case 'turning on':
        return 'off'
      case 'off':
      case 'turning off':
        return 'on'
    }
  }
  
  $scope.canToggle = function() {
    switch(this.switch.state.currently) {
      case 'turning on':
      case 'turning off':
        return false
    }
    
    return true
  }
  
  $scope.canExtendTimer = function() {
    return this.switch.state.currently == 'on' && this.switch.timer != null
  }
  
  $scope.canSetTimer = function() {
    return this.switch.state.currently == 'off' && this.switch.timer == null
  }
  
  $scope.canClearTimer = function() {
    return this.switch.timer != null && this.switch.timer.turn == 'on'
  }
  
  $scope.setLoadingWhile = function(promise) {
    $scope.loading = true
    return promise.then(() => $scope.loading = false)
  }
  
  {
    let switches = {}
    $scope.reload = function() {
      return $http.get($scope.api.links.switches).then(function(response) {
        if(deepIs(switches, response.data)) {
          return
        }
        
        switches = response.data
        $scope.switches = clone(switches) // Have to clone because Angular modifies our objects
        $scope.loading = false
      })
    }
  }

  $scope.toggle = function() {
    const newState = this.switch.state.currently == 'off' ? 'on' : 'off'
    
    const url = this.switch.links[newState]
    return this.setLoadingWhile(
      $http.post(url).then(response => {
        this.switch = response.data
        $timeout($scope.reload, 1000)
      })
    )
  }
  
  $scope.extendTimer = function() {
    const url = this.switch.links[`timer/${this.switch.timer.turn}`]
    return this.setLoadingWhile(
      $http.post(url).then(response => {
        this.$parent.switch = response.data
      })
    )
  }
  
  $scope.setTimer = function() {
    const scope = this.$new()
    
    $mdDialog.show({
      template: $('#timer-dialog').text(),
      clickOutsideToClose: true,
      scope: scope,
      controller: TimerDialogController,
      onRemoving: function() {
        document.activeElement.blur()
      }
    }).then(() => {
      const minutes = calculateMinutesFromNow(scope.time)
      const url = this.switch.links[`timer/${this.getOppositeState()}`]
      return this.setLoadingWhile(
        $http.post(`${url}?after=${minutes}`).then(response => {
          //
          // TODO: Understand why we have to use $parent here and above
          // Fix it so it's not so fragile
          //
          this.$parent.switch = response.data
        })
      )
    })
  }
  
  $scope.clearTimer = function() {
    const url = this.switch.links[`timer/${this.switch.timer.turn}`]
    return this.setLoadingWhile(
      //
      // TODO: Need to fix the API proxy so that DELETE returns a resource
      //
      $http.delete(url).then(() => this.reload())
    )
  }
  
  $scope.showHelpDialog = function() {
    $mdDialog.show({
      contentElement: '#help-dialog',
      parent: angular.element(document.body),
      clickOutsideToClose: true
    })
  }
  
  $scope.closeHelpDialog = function() {
    $mdDialog.hide()
  }
  
  //
  // Start everything up by calling the API root so we can get our app info
  // and links to other actions.
  //
  $http.get('/api').then(function(response) {
    $scope.api = response.data
    $scope.isLoggedIn = response.headers('X-Logged-In') === 'true'
    $scope.docUrl = response.headers('X-Doc-Url')
    $scope.reload()
    $interval($scope.reload, 2000)
  })
}
