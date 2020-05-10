import moment from 'moment'

export default {
  dueDateColorClass(dueDate) {
    const daysFromDueDate = moment(dueDate || undefined).diff(moment(), 'days')
    switch (true) {
      case daysFromDueDate < 7:
        return 'text-danger'
      case daysFromDueDate < 30:
        return 'text-info'
    }
    return 'text-primary'
  },

  getFormattedDate(timestamp, format="MMMM Do, YYYY", isUtc=false) {
    //'MMMM Do, YYYY h:mm a' ex: August 11th, 2017 4:00 pm
    const baseMomentObj = (timestamp)
      ? ((isUtc) ? moment.utc(timestamp) : moment(timestamp))
      : ((isUtc) ? moment.utc() : moment())
    return baseMomentObj.format(format)
  },

  getTimeDifferenceFromUnits(dateStart, dateEnd=moment.utc(), units='days') {
    dateEnd = dateEnd || moment.utc()
    return moment.utc(dateEnd).diff(moment.utc(dateStart), units)
  },

  getTimeDifferenceObj(dateStart, dateEnd=moment().toDate(), calculateNegativeDiff=false) {
    if (typeof dateStart === 'undefined') return false

    dateStart = moment(dateStart).toDate()
    dateEnd   = moment(dateEnd).toDate()

    const dateDiff  = dateEnd.getTime() - dateStart.getTime()
    const msDiff = (calculateNegativeDiff) ? Math.abs(dateDiff) : dateDiff
    const duration = moment.duration(msDiff, 'milliseconds')

    return {
      years:    duration.years(),
      months:   duration.months(),
      weeks:    duration.weeks(),
      days:     duration.days(),
      hours:    duration.hours(),
      minutes:  duration.minutes(),
      seconds:  duration.seconds()
    }
  },

  getTimeFromNow(time) {
    return moment(time).fromNow()
  },

  getDaysFromSeconds(seconds, decimalLimit=1) {
    return (seconds / 60 / 60 / 24).toFixed(decimalLimit)
  }
}
