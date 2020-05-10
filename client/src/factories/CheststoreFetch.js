import fetchDefaults from 'fetch-defaults'

export default fetchDefaults(fetch, {
  credentials: 'same-origin',
  headers: {
    'x-cheststore-fetch': 'true'
  }
})
