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
  return ['bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg'].includes(
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
          if (fileContents.match(/[^\u0000-\u007f]/)) return resolve(false)
          resolve(fileContents)
        } catch (err) {
          reject(err)
        }
      }
    })(reader)
    reader.readAsBinaryString(fetchBlob)
  })
}
