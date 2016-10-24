import moment from 'moment'

export const calculateMinutesFromNow = (time) => {
  const now = moment()
  const setDate = normalizeTime(time)
  if(setDate.isBefore(now)) {
    setDate.add(1, 'days')
  }
  
  return setDate.diff(now, 'minutes')
}

export const normalizeTime = (time) => {
  const inputTime = moment(time)
  const timeInMinutes = inputTime.diff(inputTime.clone().startOf('day'), 'minutes')
  return moment().startOf('day').add(timeInMinutes, 'minutes')
}