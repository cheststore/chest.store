import CheststoreFetch from './CheststoreFetch'
import { handleFetchResponse } from './ApiHelpers'

export default {
  async getForEntity(entityTable, entityId, path = null) {
    const response = await CheststoreFetch(
      `/api/1.0/links/entity/get?entityTable=${entityTable}&entityId=${entityId}&path=${path ||
        ''}`
    )
    return await handleFetchResponse(response)
  },

  async createUpdateLink(info) {
    const response = await CheststoreFetch(`/api/1.0/links/entity/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    })
    return await handleFetchResponse(response)
  },

  async deleteLink(id) {
    const response = await CheststoreFetch(`/api/1.0/links/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return await handleFetchResponse(response)
  },
}
