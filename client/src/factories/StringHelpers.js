export default {
  capitalize(s) {
    if (typeof s !== 'string')
      return ''

    return `${s.charAt(0).toUpperCase()}${s.slice(1)}`
  },

  replaceNewlines(string) {
    if (typeof string === 'string')
      return (string || '').replace(/\n|\r\n/g, '<br>')

    return string
  },

  titleCase(string, removeUnderscores=false) {
    if (!string)
      return ''

    if (removeUnderscores)
      string = string.replace(/_/g, ' ')
    return string.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
  },

  truncateString(str, length=200, extraString=' ...') {
    if (str) {
      if (str.length > length)
        return `${(str || '').slice(0, length)}${extraString}`
      return str
    }
    return ''
  },

  humanFileSize(bytes, si=false) {
    const thresh = si ? 1000 : 1024
    if (Math.abs(bytes) < thresh)
      return `${bytes} B`
    
    const units = si
      ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
      : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB']
    
    let u = -1
    do {
      bytes /= thresh
      ++u
    } while(Math.abs(bytes) >= thresh && u < units.length - 1)
    
    return `${bytes.toFixed(1)} ${units[u]}`
  },

  qsSerialize(obj) {
    let a = []
    for (const _key in obj) {
      if (obj[_key] instanceof Array) {
        for (let _i = 0; _i < obj[_key].length; _i++) {
          a.push(encodeURIComponent(_key) + '=' + encodeURIComponent(obj[_key][_i]))
        }
      } else {
        a.push(encodeURIComponent(_key) + '=' + encodeURIComponent(obj[_key]))
      }
    }
    return a.join("&")
  },

  qsUnserialize(string) {
    string = (/^\?/.test(string)) ? string.substring(1) : string
    const a = string.split("&")
    let obj = {}
    for (let _i = 0; _i < a.length; _i++) {
      var _a = a[_i].split("=")
      obj[ decodeURIComponent(_a[0]) ] = decodeURIComponent(_a[1])
    }
    return obj
  }
}