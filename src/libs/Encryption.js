import crypto from 'crypto'
import fs from 'fs'
import bcrypt from 'bcrypt'
// import config from '../config'

export default class Encryption {
  static fileToHash(filePath, hashAlgo="sha256") {
    return new Promise((resolve, reject) => {
      const md5Sum = crypto.createHash(hashAlgo)

      const readStream = fs.ReadStream(filePath)
      readStream.on("data", data => md5Sum.update(data))
      readStream.on("error", err => reject(err))
      readStream.on("end", () => resolve(md5Sum.digest("hex")))
    })
  }

  static stringToHash(string, hashAlgo="sha256") {
    const md5Sum = crypto.createHash(hashAlgo)
    md5Sum.update(string)
    return md5Sum.digest("hex")
  }

  static async hashPassword(plainPassword, saltRounds=10) {
    return await bcrypt.hash(plainPassword, saltRounds)
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword)
  }
}
