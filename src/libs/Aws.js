import AWS from 'aws-sdk'
import { sleep } from './Helpers'

export { AWS }
export default function Aws({
  accessKeyId,
  secretAccessKey,
  region,
  ...options
}) {
  const baseOptions = {
    ...options,
    accessKeyId,
    secretAccessKey,
    region: region || 'us-east-1'
  }

  return {
    STS: {
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html
      _sts: new AWS.STS(baseOptions),

      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#getCallerIdentity-property
      async getCallerIdentity() {
        return await new Promise((resolve, reject) => {
          this._sts.getCallerIdentity({}, function(err, data) {
            if (err)
              return reject(err)
            resolve(data)
          })
        })
      }
    },

    S3: {
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
      _s3: new AWS.S3(baseOptions),
      defaultbucket: options.bucket,

      async doesFileExist({
        filename,
        bucket,
        ...options
      }) {
        return await new Promise((resolve, reject) => {
          const params = {
            Bucket: bucket || this.defaultbucket,
            Key: filename,
            ...options
          }
          this._s3.headObject(params, function(err/*, data */) {
            if (err) {
              if (err.code === 'NotFound')
                return resolve(false)
              return reject(err)
            }
            resolve(true)
          })
        })
      },

      async getSignedUrl(options) {
        return await new Promise((resolve, reject) => {
          const operation     = options.operation || 'putObject'
          const filename      = options.filename || options.Key
          const bucket        = options.bucket || this.defaultbucket
          const extraOptions  = options.options || { Expires: 60 }
          const params        = { Bucket: bucket, Key: filename, ...extraOptions }
          this._s3.getSignedUrl(operation, params, function(err, url) {
            if (err)
              return reject(err)
            resolve(url)
          })
        })
      },

      async createPresignedPost(options) {
        return await new Promise((resolve, reject) => {
          const filename = options.filename || options.Key
          const bucket   = options.bucket || this.defaultbucket
          const extraOptions = options.options || {}
          const params = {
            Bucket: bucket,
            Expires: 60,
            Fields: {
              Key: filename,
              ...extraOptions
            }
          }

          this._s3.createPresignedPost(params, function(err, data) {
            if (err)
              return reject(err)
            resolve(data)
          })
        })
      },

      async listFilesRecursive(bucket, setCallback, nextPageToken=null) {
        return await new Promise((resolve, reject) => {
          const params = {
            Bucket: bucket, 
            MaxKeys: 1000,
            ContinuationToken: nextPageToken
          }
          this._s3.listObjectsV2(params, async (err, data) => {
            try {
              if (err)
                return reject(err)

              await setCallback(data.Contents)

              // get more results if available
              if (data.NextContinuationToken)
                await this.listFilesRecursive(bucket, setCallback, data.NextContinuationToken)

              resolve()

            } catch(parseErr) {
              reject(parseErr)
            }
          })
        })
      },

      async getFile({
        filename,
        bucket,
        ...options
      }) {
        return await new Promise((resolve, reject) => {
          const params = {
            Bucket: bucket || this.defaultbucket,
            Key: filename,
            ...options
          }
          // Note the raw buffer data in the file is returned in callback(err,data) {}
          // as data.Body
          this._s3.getObject(params, (err, res) => {
            if (err) return reject(err)
            resolve(res)
          })
        })
      },

      async getFileStreamWithBackoff(streamToPipeTo, options, backoffAttempt=1) {
        const totalAllowedBackoffTries = 5
        const backoffSecondsToWait = 2 + Math.pow(backoffAttempt, 2)

        return await new Promise((resolve, reject) => {
          const filename = options.filename
          const bucket = options.bucket || this.defaultbucket
          const extraOptions = options.options || {}
          const params = Object.assign({ Bucket: bucket, Key: filename }, extraOptions)

          this._s3.getObject(params).createReadStream()
          .on('error', async (err, response) => {
            if (backoffAttempt > totalAllowedBackoffTries)
              return reject(err)

            try {
              await sleep(backoffSecondsToWait * 1000)
              await this.getFileStreamWithBackoff(streamToPipeTo, options, backoffAttempt + 1)
              resolve()
            } catch(e) {
              reject(e)
            }
          })
          .on('end', resolve)
          .pipe(streamToPipeTo)
        })
      },

      async getFileUrl(options) {
        return await new Promise((resolve, reject) => {
          const filename  = options.filename
          const bucket    = options.bucket || this.defaultbucket
          const params    = { Bucket: bucket, Key: filename }
          this._s3.getSignedUrl('getObject', params, (err, res) => {
            if (err) return reject(err)
            resolve(res)
          })
        })
      },

      async writeFile(options, method='putObject') {
        return await new Promise((resolve, reject) => {
          const bucket = options.bucket || this.defaultbucket
          const data = options.data
          const filename = options.filename
          const params = { Bucket: bucket, Key: filename, Body: data }
          this._s3[method](params, (err, returnedData) => {
            if (err)
              return reject(err)
            resolve({ filename, data: returnedData })
          })
        })
      },

      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listBuckets-property
      async listBuckets() {
        return await new Promise((resolve, reject) => {
          this._s3.listBuckets({}, function(err, data) {
            if (err)
              return reject(err)
            resolve(data)
          })
        })
      },

      async createBucket(bucketName) {
        return await new Promise((resolve, reject) => {
          this._s3.createBucket({ Bucket: bucketName }, (err, result) => {
            if (err)
              return reject(err)
            resolve(result)
          })
        })
      }
    }
  }
}
