import { Pool, ClientConfig, QueryResult } from 'pg'
import { COMMUNITY_TABLES } from './controllers/community-case-requests-controller';

let pool: Pool;
//TODO: Use Labmda interface to automatically init a pool for lambdas who need DB connection available
export const initPool = async (options: ClientConfig) => {
  if (pool) { return pool }
  else {
    pool = new Pool(options);
    await pool.connect()
    console.log("Created db connection pool")
    return pool;
  }
}

export const pg = {

  done: async () => {
    console.log(`killing connection pool`)
    await pool.end()
    console.log(`Done (killed connection pool`);
  },
  query: (text: string, params: any, callback: any) => {
    return pool.query(text, params, callback)
  }
};

export const readTable = async (scheme: string, tableName: string): Promise<QueryResult> => {
  const str = `
    Select *  from ${scheme}.${tableName}
    `
  console.log(`Running readTable: ${str}`)

  return new Promise(resolve => {
    pg.query(str
      , [],
      (err: any, data: QueryResult) => {
        if (err) {
          console.log(`Error reading table ${scheme}.${tableName}`, err)
        }
        resolve(data)
      })
  })
}

export const createTableIfNotExist = async (schemeName: string, tableName: string, object: any, primarykey?: string, dateColumn?: boolean) => {
  const SQL_CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS ${schemeName}.${tableName} (
        ${Object.keys(object)
      .map(property =>
        primarykey ?
          property === primarykey ?
            `${primarykey} varchar(45) NOT NULL,` : `${property} text,`
          : `${property} text,`)
      .join('\n')
    }
    ${dateColumn ? `posting_date DATE NOT NULL DEFAULT CURRENT_DATE,` : ''}
        PRIMARY KEY (${primarykey ? primarykey : `id SERIAL PRIMARY KEY,`})
      )
`
  await new Promise(resolve => {
    pg.query(SQL_CREATE_TABLE
      , [],
      (err: any, data: QueryResult) => {
        console.log('Created Table:\n' + SQL_CREATE_TABLE)
        resolve(data)
      })
  })
  const SQL_GET_COLUMN_NAMES = `SELECT * FROM ${schemeName}.${tableName} limit 1;`

  const columnNames = await new Promise<QueryResult>(resolve => {
    pg.query(SQL_GET_COLUMN_NAMES
      , [],
      (err: any, data: QueryResult) => {
        resolve(data)
      }
    )
  })

  try {


    // Calculate if there are any new properties that require table alteration
    const newProperties = Object.keys(object).map(key => key.toLowerCase())
      .filter(key => columnNames.fields
        .map(field => field.name.toLowerCase())
        .find(name => name === key) === undefined)

    newProperties.length > 0 ? await alterTable(schemeName, tableName, newProperties) : null
  }
  catch (e) {
    console.log(`Wasn't able to determine if ${tableName} requires alteration`)
  }
}

const alterTable = async (schemeName: string, tableName: string, newColumnsNames: string[]) => {

  console.log(`need to alter table with ${newColumnsNames.length} fields: ${newColumnsNames.join(',')}`);

  return new Promise(resolve => {
    pg.query(`ALTER TABLE ${schemeName}.${tableName} 
        ${newColumnsNames.map(name => `ADD COLUMN ${name} text`).join(',')}`, [], (err: any, data: QueryResult) => {
      if (err) {
        console.log(`Failed to alter table ${tableName}`)
      }
      resolve(data)
    })
  })
}

export const insertRows = async (schemeName: string, tableName: COMMUNITY_TABLES, dataObjects: any[], primaryKeyName?: string) => {
  console.log(`insert to ${schemeName}.${tableName}, no.of object: ${dataObjects.length}` /* Query: \n ${str}*/)

  primaryKeyName ? await createTableIfNotExist(schemeName, tableName, dataObjects[0], primaryKeyName) :
    await createTableIfNotExist(schemeName, tableName, dataObjects[0])
  const str = `insert into ${schemeName}.${tableName}
        (${Object.keys(dataObjects[0]).map(prop => `${prop}`).join(',')})
    values ${dataObjects.map((deal: any) => `(${Object.keys(deal).map(key => `'${deal[key]}'`)})`).join(',')}
        `

  return new Promise(resolve => {
    pg.query(str
      , [],
      (err: any, data: QueryResult) => {
        if (err) {
          console.log(`ERROR: Creating Table: ${tableName}`, err)
        }

        else {
          console.log(`DONE: Inserted To Table: ${tableName} `)
          resolve(data)
        }
      })
  })

}

export default pg;


