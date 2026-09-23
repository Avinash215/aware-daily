import { TableClient, odata } from '@azure/data-tables'

/**
 * Storage for community data behind one small interface, so the handlers can
 * be tested against memory and run against Azure Table Storage (or Azurite)
 * unchanged. Entities use `partitionKey` / `rowKey`, as @azure/data-tables does.
 */

export const TABLES = ['likes', 'userlikes', 'comments', 'storystats', 'ratelimits']

const conflict = () => Object.assign(new Error('conflict'), { statusCode: 409 })
const precondition = () => Object.assign(new Error('precondition failed'), { statusCode: 412 })

export function createMemoryStore() {
  const tables = new Map(TABLES.map((name) => [name, new Map()]))
  let version = 0
  const keyOf = (pk, rk) => `${pk}\u0000${rk}`
  const table = (name) => {
    const found = tables.get(name)
    if (!found) throw new Error(`unknown table ${name}`)
    return found
  }
  const copy = (entity) => (entity ? structuredClone(entity) : null)

  return {
    async get(name, pk, rk) {
      return copy(table(name).get(keyOf(pk, rk)))
    },
    async insert(name, entity) {
      const key = keyOf(entity.partitionKey, entity.rowKey)
      if (table(name).has(key)) throw conflict()
      version += 1
      table(name).set(key, { ...structuredClone(entity), etag: String(version) })
    },
    async replace(name, entity, etag) {
      const key = keyOf(entity.partitionKey, entity.rowKey)
      const current = table(name).get(key)
      if (!current) throw Object.assign(new Error('not found'), { statusCode: 404 })
      if (etag && current.etag !== etag) throw precondition()
      version += 1
      const { etag: _ignored, ...rest } = entity
      void _ignored
      table(name).set(key, { ...structuredClone(rest), etag: String(version) })
    },
    async remove(name, pk, rk) {
      table(name).delete(keyOf(pk, rk))
    },
    async partition(name, pk) {
      return [...table(name).values()].filter((entity) => entity.partitionKey === pk).map(copy)
    },
    async where(name, field, value) {
      return [...table(name).values()].filter((entity) => entity[field] === value).map(copy)
    },
    async partitionsFrom(name, pkMin) {
      return [...table(name).values()].filter((entity) => entity.partitionKey >= pkMin).map(copy)
    },
  }
}

export function createTableStore(connectionString) {
  const clients = new Map()
  const ready = new Map()
  const allowInsecureConnection = /UseDevelopmentStorage=true|127\.0\.0\.1|localhost/i.test(connectionString)

  function client(name) {
    if (!TABLES.includes(name)) throw new Error(`unknown table ${name}`)
    if (!clients.has(name)) {
      clients.set(name, TableClient.fromConnectionString(connectionString, `aware${name}`, { allowInsecureConnection }))
    }
    return clients.get(name)
  }

  async function table(name) {
    const tableClient = client(name)
    if (!ready.has(name)) {
      ready.set(name, tableClient.createTable().catch((error) => {
        ready.delete(name)
        throw error
      }))
    }
    await ready.get(name)
    return tableClient
  }

  async function collect(iterator) {
    const out = []
    for await (const entity of iterator) out.push(entity)
    return out
  }

  const missingTable = (error) => error?.statusCode === 404 && /TableNotFound/i.test(String(error?.code || error?.message))

  // A table deleted underneath a warm instance is recreated once, not reported as a failure.
  async function withTable(name, work) {
    try {
      return await work(await table(name))
    } catch (error) {
      if (!missingTable(error)) throw error
      ready.delete(name)
      return work(await table(name))
    }
  }

  return {
    async get(name, pk, rk) {
      try {
        return await withTable(name, (client) => client.getEntity(pk, rk))
      } catch (error) {
        if (error?.statusCode === 404) return null
        throw error
      }
    },
    async insert(name, entity) {
      await withTable(name, (client) => client.createEntity(entity))
    },
    async replace(name, entity, etag) {
      const { etag: _ignored, 'odata.metadata': _meta, timestamp: _timestamp, ...rest } = entity
      void _ignored
      void _meta
      void _timestamp
      await withTable(name, (client) => client.updateEntity(rest, 'Replace', etag ? { etag } : undefined))
    },
    async remove(name, pk, rk) {
      try {
        await withTable(name, (client) => client.deleteEntity(pk, rk))
      } catch (error) {
        if (error?.statusCode !== 404) throw error
      }
    },
    async partition(name, pk) {
      return withTable(name, (client) => collect(client.listEntities({ queryOptions: { filter: odata`PartitionKey eq ${pk}` } })))
    },
    async where(name, field, value) {
      if (!/^[A-Za-z][A-Za-z0-9]*$/.test(field)) throw new Error('bad field')
      const literal = typeof value === 'boolean' ? String(value) : `'${String(value).replace(/'/g, "''")}'`
      return withTable(name, (client) => collect(client.listEntities({ queryOptions: { filter: `${field} eq ${literal}` } })))
    },
    async partitionsFrom(name, pkMin) {
      return withTable(name, (client) => collect(client.listEntities({ queryOptions: { filter: odata`PartitionKey ge ${pkMin}` } })))
    },
  }
}

let shared = null

/** The configured store, or `null` when community storage is not configured. */
export function configuredStore() {
  const connection = process.env.AWARE_STORAGE_CONNECTION
  if (!connection) return null
  if (!shared) shared = createTableStore(connection)
  return shared
}
