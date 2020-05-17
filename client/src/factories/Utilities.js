

export async function sleep(timeoutMs=1e3) {
  return await new Promise(resolve => setTimeout(resolve, timeoutMs))
}

export function isImage(imageFile) {
  const splitName = imageFile.split('.')
  return [
    'bmp',
    'gif',
    'jpeg',
    'jpg',
    'png',
    'svg'
  ].includes(splitName[splitName.length - 1])
}