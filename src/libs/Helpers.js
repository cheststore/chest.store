export function arrayGroupBy(ary, mapper) {
  return ary.reduce((agg, item) => {
    const aggKey = mapper(item).toString()
    agg[aggKey] = (agg[aggKey] || []).concat([item])
    return agg
  }, {})
}

export async function sleep(timeoutMs=1000) {
  return await new Promise(resolve => setTimeout(resolve, timeoutMs))
}

export function titleCase(string, removeUnderscores=false) {
  if (!string)
    return ''

  if (removeUnderscores)
    string = string.replace(/_/g, ' ')
  return string.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}