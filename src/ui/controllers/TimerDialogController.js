import moment from 'moment'
import { normalizeTime } from 'src/ui/time-helpers'

export default function($scope, $mdDialog) {
  $scope.cancel = function() { 
    $mdDialog.cancel()
  }
  
  $scope.done = function() { 
    $scope.loading = true
    $mdDialog.hide()
  }
  
  $scope.isTimeValid = function() {
    return this.time instanceof Date && isFinite(this.time)
  }
  
  $scope.getTodayOrTomorrow = function() {
    const setDay = normalizeTime(this.time).startOf('day')
    const today = moment().startOf('day')
    return setDay.isAfter(today) ? 'Tomorrow' : 'Today'
  }
  
  if(process.env.TIMER_DEFAULT != null) {
    $scope.time = moment(process.env.TIMER_DEFAULT, 'h:mm A').toDate()
  }
}