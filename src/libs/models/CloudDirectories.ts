// import DatabaseModel from './DatabaseModel'
const DatabaseModel = require('./DatabaseModel').default
const CloudObjects = require('./CloudObjects').default

export default function CloudDirectories(postgres: object) {
  const factoryToExtend = DatabaseModel(postgres, 'cloud_directories')

  return Object.assign(factoryToExtend, {
    accessibleColumns: [
      'bucket_id',
      'parent_directory_id', // if null, it's top level, otherwise is under its parent
      'full_path',
      'name',
    ],

    async getDirectChildren(
      bucketId: number | string,
      directoryId: null | number | string
    ) {
      let filters: string[] = [`d.bucket_id = $1`]
      let params: Array<number | string> = [bucketId]
      if (directoryId) {
        filters.push(`d.parent_directory_id = $2`)
        params.push(directoryId)
      } else {
        filters.push('d.parent_directory_id is null')
      }

      const { rows } = await (postgres as any).query(
        `
          select d.*
          from cloud_directories as d
          ${filters.length > 0 ? `where ${filters.join(' and ')}` : ''}
          order by full_path
        `,
        params
      )
      return rows
    },

    async createDirsAndObjectFromFullPath(
      bucketId: number | string,
      fullObjectPath: string
    ): Promise<object[]> {
      const splitInfo: string[] = fullObjectPath
        .split('/')
        .filter((str: string) => str !== '')
      let info: object[] = []
      for (let ind: number = 0; ind < splitInfo.length; ind++) {
        const dirOrObj: string = splitInfo[ind]
        const parentDirId: number | string = (
          (info[info.length - 1] as any) || {}
        ).id

        // object name
        if (ind === splitInfo.length - 1) {
          const obj = CloudObjects(postgres)
          await obj.findOrCreateBy({
            bucket_id: bucketId,
            full_path: fullObjectPath,
          })
          obj.setRecord({ name: dirOrObj, directory_id: parentDirId })
          await obj.save()
          info.push({ type: 'object', id: obj.record.id })
          continue
        }

        // directory
        const dir = CloudDirectories(postgres)
        await dir.findOrCreateBy({
          bucket_id: bucketId,
          full_path: splitInfo.slice(0, ind + 1).join('/'),
        })
        dir.setRecord({ name: dirOrObj, parent_directory_id: parentDirId })
        await dir.save()
        info.push({ type: 'directory', id: dir.record.id })
      }
      return info
    },
  })
}
