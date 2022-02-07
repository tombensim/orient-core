import { QueryResult } from "pg";
import db from "../db-client";

export const HUBSPOT_SCHEME_NAME = 'hubspot'
export const CONTACTS_TABLE_NAME = "icontacts"
export const DEALS_TABLE_NAME = "ideals"
export const DEALS_TABLE_PRIMARY_KEY = "dealid"
export const COMPANIES_TABLE_NAME = "icompanies"
export const COMPANIES_TABLE_PRIMARY_KEY = "companyid"
const { escape } = require('sqlutils/pg');


export interface DealBIData {
    dealid: string,
    pipeline:string,
    customer_type: string,
    plan: string,
    contract_payment_type: string,
    source: string,
    subscription_end_date: string,
    subscription_start_date: string,
    subscription_status: string,
    dealtype: string,
    workflow: string,
    franklin_organization_id: string,
    country: string,
    notes_last_contacted: string,
    amount: string,
    billing_user: string,
    send_automated_report:string,

}
export interface CompanyBIData {
    customer_since: string,
    customer_type: string,
    payg_expected: string
}

export type ContactBIData  ={
    deal_pipeline: string,
    lifecyclestage: string,
    hs_lead_status: string,
    hs_sequences_is_enrolled: string,
    hs_latest_sequence_enrolled: string,
    auth0_id: string,
    hs_lifecyclestage_customer_date: string,
    hs_lifecyclestage_lead_date: string,
    hs_lifecyclestage_marketingqualifiedlead_date: string,
    country: string,
    email: string,
    firstname: string,
    lastname: string,
    organization: string,
    professional_role: string,
    first_sequence_enrolment_date: string,
    first_meeting_date: string,
    lead_disqualification_date: string,
    latest_marketing_meeting_date: string
}

export const HSContactBIDataRowPropertiesImpl: ContactBIData = {
    deal_pipeline: 'deal_pipeline',
    lifecyclestage: 'lifecyclestage',
    hs_lead_status: 'hs_lead_status',
    hs_sequences_is_enrolled: 'hs_sequences_is_enrolled',
    hs_latest_sequence_enrolled: 'hs_latest_sequence_enrolled',
    auth0_id: 'auth0_id',
    hs_lifecyclestage_customer_date: 'hs_lifecyclestage_customer_date',
    hs_lifecyclestage_lead_date: 'hs_lifecyclestage_lead_date',
    hs_lifecyclestage_marketingqualifiedlead_date: 'hs_lifecyclestage_marketingqualifiedlead_date',
    country: 'country',
    email: 'email',
    firstname: 'firstname',
    lastname: 'lastname',
    organization: 'organization',
    professional_role: 'professional_role',
    first_sequence_enrolment_date: 'first_sequence_enrolment_date',
    first_meeting_date: 'first_meeting_date',
    lead_disqualification_date: 'lead_disqualification_date',
    latest_marketing_meeting_date: 'latest_marketing_meeting_date',

    
}

export const HSCompanyBIDataRowPropertiesImpl: CompanyBIData = {
    customer_since: "Academic",
    customer_type: "123",
    payg_expected: "123"
}

export const HSDealBIDataRowPropertiesImpl: DealBIData = {
    amount: "133",
    country: "Israel",
    franklin_organization_id: "f432fds-dscsd",
    notes_last_contacted: "2020-10-10",
    customer_type: "Academic",
    dealid: "123",
    plan: "Community",
    contract_payment_type: "PAYG",
    source: "Partner",
    dealtype: "New",
    subscription_end_date: "2020-10-1",
    subscription_start_date: "2020-10-1",
    workflow: "WES Analysis",
    subscription_status: "Active",
    billing_user: "emadmuh@clalit.org.il;tzur_e@mac.org.il",
    send_automated_report: "true",
    pipeline: "Activation"

}

type companyAssociation = {
    associatedCompany: string | unknown
}

type DealBIDataWithCompanyAssociation = DealBIData & companyAssociation

export const queryBIdb = async (query: string): Promise<QueryResult> => {
    console.log(`running query on bi-db ${query}`)
    return new Promise((resolve, reject) => {
        db.query(query, [], (err: any, data: QueryResult) => {
            if (err) {
                console.log(`Error running query on bi-db ${query}`, err)
                reject(err)
            }
            resolve(data)
        })
    })
}

export const readTable = async (scheme: string, tableName: string): Promise<QueryResult> => {
    const str = `
    Select * from ${scheme}.${tableName}
    `
    console.log(`Running readTable: ${str}`)

    return new Promise(resolve => {
        db.query(str
            , [],
            (err: any, data: QueryResult) => {
                if (err) {
                    console.log(`Error reading table ${scheme}.${tableName}`, err)
                }
                resolve(data)
            })
    })
}

const createTable = async (tableName: string, primarykey: string, object: any) => {
    const SQL_CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS hubspot.${tableName} (
        ${Object.keys(object)
            .map(property => property === primarykey ?
                `${primarykey} varchar(45) NOT NULL,` : `${property} text,`).join('\n')}
        PRIMARY KEY (${primarykey})
      )

`
    await new Promise(resolve => {
        db.query(SQL_CREATE_TABLE
            , [],
            (err: any, data: QueryResult) => {
                console.log('Created Table (if not exist): ', tableName)
                resolve(data)
            })
    })
    const SQL_GET_COLUMN_NAMES = `SELECT * FROM hubspot.${tableName} limit 1;`

    const columnNames = await new Promise<QueryResult>(resolve => {
        db.query(SQL_GET_COLUMN_NAMES
            , [],
            (err: any, data: QueryResult) => {
                resolve(data)
            }
        )
    })

    // Calculate if there are any new properties that require table alteration
    const newProperties = Object.keys(object).map(key => key.toLowerCase())
        .filter(key => columnNames.fields
            .map(field => field.name.toLowerCase())
            .find(name => name === key) === undefined)

    newProperties.length > 0 ? await alterTable(tableName, newProperties) : null
}

const alterTable = async (tableName: string, newColumnsNames: string[]) => {

    console.log(`need to alter table with ${newColumnsNames.length} fields: ${newColumnsNames.join(',')}`);

    return new Promise(resolve => {
        db.query(`ALTER TABLE hubspot.${tableName} 
        ${newColumnsNames.map(name => `ADD COLUMN ${name} text`).join(',')}`, [], (err: any, data: QueryResult) => {
            if (err) {
                console.log(`Failed to alter table ${tableName}`)
            }
            resolve(data)
        })
    })
}

export const insertRows = async (dataObjects: any[], tableName: string, primaryKeyName: string) => {
    await createTable(tableName, primaryKeyName, dataObjects[0])

    const str = `insert into hubspot.${tableName}
        (${Object.keys(dataObjects[0]).map(prop => `${prop}`).join(',')})
    values ${dataObjects.map((row: any) => `(${Object.keys(row).map(key => escape(row[key]))})`).join(',')}
        `

    console.log(`insert to hubspot.${tableName}, no.of object: ${dataObjects.length}` /* Query: \n ${str}*/)
    return new Promise((resolve, reject) => {
        db.query(str
            , [],
            (err: any, data: QueryResult) => {
                if (err) {
                    console.log(`ERROR: inserting to Table: ${tableName}\n Query: ${str}`, err)
                    reject(err)
                }

                else {
                    console.log(`DONE: Inserted To Table: ${tableName} `)
                    resolve(data)
                }
            })
    })

}

export const deleteTables = async () => {
    const tables = [DEALS_TABLE_NAME, COMPANIES_TABLE_NAME]
    console.log(`Dropping tables: ${tables.join(", ")} `)

    return await Promise.all(tables.map(table => new Promise((resolve, reject) => {
        db.query(
            `
TRUNCATE hubspot.${table}
`, [],
            (err: any, data: QueryResult) => {
                if (err) {
                    console.log(`Error TRUNCATE  Table(${table}}): ${JSON.stringify(err)} `)
                    reject(err);
                }
                console.log(`TRUNCATE Table ${table} `)
                resolve(data)
            })
    })))

}

export const deleteTable = async (tableName: string) => {
    console.log(`Dropping all rows from table: ${tableName}`)

    return new Promise((resolve, reject) =>
        db.query(
            `
TRUNCATE hubspot.${tableName}
`, [],
            (err: any, data: QueryResult) => {
                if (err) {
                    console.log(`Error TRUNCATE  Table(${tableName}}): ${JSON.stringify(err)} `)
                    reject(err);
                }
                console.log(`TRUNCATED tableName ${tableName} `)
                resolve(data)
            }
        )

    )

}
