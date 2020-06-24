// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export function debounce(func, waitMs = 500, immediate = false) {
  var timeout
  return function() {
    var context = this,
      args = arguments
    var later = function() {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    var callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, waitMs)
    if (callNow) func.apply(context, args)
  }
}

export async function sleep(timeoutMs = 1e3) {
  return await new Promise((resolve) => setTimeout(resolve, timeoutMs))
}

export function isImage(imageFile) {
  const splitName = imageFile.split('.')
  return ['bmp', 'gif', 'ico', 'jpeg', 'jpg', 'png', 'svg', 'webp'].includes(
    splitName[splitName.length - 1]
  )
}

export async function checkFileAscii(fetchBlob) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (function(theReader) {
      return function(/*evt*/) {
        try {
          const fileContents = theReader.result
          // if (fileContents.match(/[^\u0000-\u007f]/)) return resolve(false)
          // https://stackoverflow.com/questions/1677644/detect-non-printable-characters-in-javascript
          if (fileContents.match(/[\x00-\x08\x0E-\x1F]/)) return resolve(false)
          resolve(fileContents)
        } catch (err) {
          reject(err)
        }
      }
    })(reader)
    reader.readAsBinaryString(fetchBlob)
  })
}

export var fileExtensionIconClasses = {
  default: ['fa', 'fa-file-alt'],

  avi: ['fa', 'fa-file-video'],
  bmp: ['fa', 'fa-image'],
  csv: ['fa', 'fa-file-csv'],
  doc: ['fa', 'fa-file-word'],
  docx: ['fa', 'fa-file-word'],
  gif: ['fa', 'fa-image'],
  gz: ['fa', 'fa-file-archive'],
  ico: ['fa', 'fa-image'],
  img: ['fa', 'fa-image'],
  jpg: ['fa', 'fa-image'],
  jpeg: ['fa', 'fa-image'],
  mov: ['fa', 'fa-file-video'],
  mp4: ['fa', 'fa-file-video'],
  mpeg: ['fa', 'fa-file-video'],
  mpg: ['fa', 'fa-file-video'],
  nessus: ['fa', 'fa-file-code'],
  pdf: ['fa', 'fa-file-pdf'],
  png: ['fa', 'fa-image'],
  ppt: ['fa', 'fa-file-powerpoint'],
  pptx: ['fa', 'fa-file-powerpoint'],
  tar: ['fa', 'fa-file-archive'],
  webp: ['fa', 'fa-image'],
  wmv: ['fa', 'fa-file-video'],
  xls: ['fa', 'fa-file-excel'],
  xlsx: ['fa', 'fa-file-excel'],
  xml: ['fa', 'fa-file-code'],
  zip: ['fa', 'fa-file-archive'],
}
