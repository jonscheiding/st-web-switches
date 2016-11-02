import moment from 'moment'

//
// Gets the number of minutes between now and the specified time.
//
export const calculateMinutesFromNow = (time, now = moment()) => {
  const setDate = normalizeTime(time, now)
  if(setDate.isBefore(now)) {
    setDate.add(1, 'days')
  }
  
  return setDate.diff(now, 'minutes')
}

//
// Returns the soonest future time with the same hour/minute/second as the provided
// time.  For example, if 'now' is 10/25/2016 12:00 PM:
//
//  1/1/1970 1:00 PM    ->  10/25/2016 1:00 PM
//  10/25/2016 1:00 PM  ->  10/25/2016 1:00 PM
//  10/25/2016 11:00 AM ->  10/26/2016 11:00 AM
//
export const normalizeTime = (time, now = moment()) => {
  const timeObj = moment(time).toObject()
  const nowObj = moment(now).toObject()
  
  const result = moment([
    nowObj.years,
    nowObj.months,
    nowObj.date,
    timeObj.hours,
    timeObj.minutes,
    timeObj.seconds,
    timeObj.milliseconds
  ])
  
  if(result.isBefore(now)) {
    result.add(1, 'days')
  }
  
  return result
}