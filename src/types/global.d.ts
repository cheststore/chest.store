interface StringMap {
  [key: string]: any
}

interface IFactoryOptions {
  log: StringMap
  postgres: StringMap
  redis: StringMap
}

interface IRequestOptions extends IFactoryOptions {
  io: StringMap
}

interface IModelCallbacks {
  beforeSave: () => Promise<void>
  afterSave: () => Promise<void>
}

interface IModel {
  accessibleColumns: string[]
  restrictedColumns: string[]
  record: StringMap
  table: string
  isNewRecord: boolean
  callbacks: IModelCallbacks
  _getSanitizedValue: (value: any, shouldSanitize?: boolean) => any
  setRecord: (obj: StringMap, allowRestrictedColumns?: boolean) => StringMap
  unsetColumn: (column: string) => StringMap
  resetRecord: () => StringMap
  getAll: (orderBy: null | string) => Promise<StringMap[]>
  getAllBy: (
    keyValuePairs: StringMap,
    pagination?: null | StringMap,
    orderBy?: null | string
  ) => Promise<StringMap[]>
  find: (id: number | string) => Promise<null | StringMap>
  findBy: (keyValuePairs: StringMap) => Promise<null | StringMap>
  findOrCreateBy: (keyValuePairs: StringMap) => Promise<StringMap>
  updateOrCreateBy: (keyValuePairs: StringMap) => Promise<StringMap>
  save: (
    uniqueColumnIfNoId?: string,
    sanitizeStrings?: boolean
  ) => Promise<boolean | number | string>
  saveMany: (arrayOfObjects: StringMap[]) => Promise<StringMap>
  delete: () => Promise<boolean>
  sanitizeHtmlString: (value: any) => any
}

interface IModelFactory {
  (postgres: object, table: string): IModel
}
