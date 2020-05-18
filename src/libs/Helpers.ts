export function arrayGroupBy(ary: any[], mapper: Function): StringMap {
  return ary.reduce((agg: StringMap, item: any) => {
    const aggKey: string = mapper(item).toString()
    agg[aggKey] = (agg[aggKey] || []).concat([item])
    return agg
  }, {})
}

export async function sleep(timeoutMs=1000): Promise<void> {
  return await new Promise((resolve: Function) => setTimeout(resolve, timeoutMs))
}

export function titleCase(string: string, removeUnderscores: boolean=false) {
  if (!string)
    return ''

  if (removeUnderscores)
    string = string.replace(/_/g, ' ')
  return string.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}