

export async function sleep(timeoutMs=1e3) {
  return await new Promise(resolve => setTimeout(resolve, timeoutMs))
}