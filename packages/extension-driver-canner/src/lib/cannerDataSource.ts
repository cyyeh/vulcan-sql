import axios from 'axios';
import {
  DataResult,
  DataSource,
  ExecuteOptions,
  ExportOptions,
  InternalError,
  RequestParameter,
  VulcanExtensionId,
} from '@vulcan-sql/core';
import { Pool, PoolConfig, QueryResult } from 'pg';
import * as Cursor from 'pg-cursor';
import { Readable } from 'stream';
import { buildSQL } from './sqlBuilder';
import { mapFromPGTypeId } from './typeMapper';
import * as fs from 'fs';
import * as path from 'path';
import { CannerAdapter } from './cannerAdapter';

export interface PGOptions extends PoolConfig {
  chunkSize?: number;
}

@VulcanExtensionId('canner')
export class CannerDataSource extends DataSource<any, PGOptions> {
  private logger = this.getLogger();
  private poolMapping = new Map<string, { pool: Pool; options?: PGOptions }>();

  public override async onActivate() {
    const profiles = this.getProfiles().values();
    for (const profile of profiles) {
      // try to connect by pg wire protocol and make request to api server
      this.logger.debug(
        `Initializing profile: ${profile.name} using pg wire protocol`
      );
      //=================================================================================================
      // PG wire protocol
      const pool = new Pool(profile.connection);
      // https://node-postgres.com/api/pool#poolconnect
      // When a client is sitting idly in the pool it can still emit errors because it is connected to a live backend.
      // If the backend goes down or a network partition is encountered all the idle, connected clients in your application will emit an error through the pool's error event emitter.
      pool.on('error', (err) => {
        this.logger.warn(
          `Pool client of profile instance ${profile.name} connecting failed, detail error, ${err}`
        );
      });
      await pool.query('select 1');
      this.poolMapping.set(profile.name, {
        pool,
        options: profile.connection,
      });
      this.logger.debug(`Profile ${profile.name} initialized`);
    }
  }

  public override async export({
    sql,
    directory,
    profileName,
  }: ExportOptions): Promise<void> {
    if (!this.poolMapping.has(profileName)) {
      throw new InternalError(`Profile instance ${profileName} not found`);
    }
    // throw if dir is not exist
    if (!fs.existsSync(directory)) {
      throw new InternalError(`Directory ${directory} not found`);
    }
    const { options: connection } = this.poolMapping.get(profileName)!;

    const cannerAdapter = new CannerAdapter(connection);
    try {
      this.logger.debug('Send the async query to the Canner Enterprise');
      const presignedUrls = await cannerAdapter.createAsyncQueryResultUrls(sql);
      this.logger.debug(
        'Start fetching the query result parquet files from URLs'
      );
      await this.downloadFiles(presignedUrls, directory);
      this.logger.debug('Parquet files downloaded successfully');
    } catch (error: any) {
      this.logger.debug('Failed to export data from canner', error);
      throw error;
    }
  }

  private async downloadFiles(urls: string[], directory: string) {
    await Promise.all(
      urls.map(async (url: string, index: number) => {
        const response = await axios.get(url, {
          responseType: 'stream',
        });
        // The file name will be a substring that is after the last "/" and followed by the "?" and the query string
        // ex: https://cannerHost/data/canner/somePath/file-name?X-Amz-Algorithm=AWS4-HMAC-SHA256
        const fileName = url.split('/').pop()?.split('?')[0] || `part${index}`;
        const writeStream = fs.createWriteStream(
          // rename to parquet extension to make cache layer could read
          path.join(directory, `${fileName}.parquet`)
        );
        response.data.pipe(writeStream);
        return new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
      })
    );
  }
  public async execute({
    statement: sql,
    bindParams,
    profileName,
    operations,
  }: ExecuteOptions): Promise<DataResult> {
    if (!this.poolMapping.has(profileName)) {
      throw new InternalError(`Profile instance ${profileName} not found`);
    }
    const { pool, options } = this.poolMapping.get(profileName)!;
    this.logger.debug(`Acquiring connection from ${profileName}`);
    const client = await pool.connect();
    this.logger.debug(`Acquired connection from ${profileName}`);
    try {
      const builtSQL = buildSQL(sql, operations);
      const cursor = client.query(
        new Cursor(builtSQL, Array.from(bindParams.values()))
      );
      cursor.once('done', async () => {
        this.logger.debug(
          `Data fetched, release connection from ${profileName}`
        );
        // It is important to close the cursor before releasing connection, or the connection might not able to handle next request.
        await cursor.close();
        client.release();
      });
      // All promises MUST fulfilled in this function or we are not able to release the connection when error occurred
      return await this.getResultFromCursor(cursor, options);
    } catch (e: any) {
      this.logger.debug(
        `Errors occurred, release connection from ${profileName}`
      );
      client.release();
      throw e;
    }
  }

  public async prepare({ parameterIndex }: RequestParameter) {
    return `$${parameterIndex}`;
  }

  public async destroy() {
    for (const { pool } of this.poolMapping.values()) {
      await pool.end();
    }
  }

  private async getResultFromCursor(
    cursor: Cursor,
    options: PGOptions = {}
  ): Promise<DataResult> {
    const { chunkSize = 100 } = options;
    const cursorRead = this.cursorRead.bind(this);
    const firstChunk = await cursorRead(cursor, chunkSize);
    // save first chunk in buffer for incoming requests
    let bufferedRows = [...firstChunk.rows];
    let bufferReadIndex = 0;
    const fetchNext = async () => {
      if (bufferReadIndex >= bufferedRows.length) {
        bufferedRows = (await cursorRead(cursor, chunkSize)).rows;
        bufferReadIndex = 0;
      }
      return bufferedRows[bufferReadIndex++] || null;
    };
    const stream = new Readable({
      objectMode: true,
      read() {
        fetchNext()
          .then((row) => {
            this.push(row);
          })
          .catch((error) => {
            this.destroy(error);
          });
      },
      destroy(error: Error | null, cb: (error: Error | null) => void) {
        // Send done event to notify upstream to release the connection.
        cursor.emit('done');
        cb(error);
      },
      // automatically destroy() the stream when it emits 'finish' or errors. Node > 10.16
      autoDestroy: true,
    });
    return {
      getColumns: () =>
        firstChunk.result.fields.map((field) => ({
          name: field.name,
          type: mapFromPGTypeId(field.dataTypeID),
        })),
      getData: () => stream,
    };
  }

  public async cursorRead(cursor: Cursor, maxRows: number) {
    return new Promise<{ rows: any[]; result: QueryResult }>(
      (resolve, reject) => {
        cursor.read(maxRows, (err, rows, result) => {
          if (err) {
            return reject(err);
          }
          resolve({ rows, result });
        });
      }
    );
  }
}
