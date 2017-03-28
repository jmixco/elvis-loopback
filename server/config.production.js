module.exports = {
  restApiRoot: process.env.API_ROOT || '/api',
  host: process.env.HOST,
  port: process.env.PORT,
  remoting: {
    context: false,
    rest: {
      handleErrors: false,
      normalizeHttpPath: false,
      xml: false
    },
    json: {
      strict: false,
      limit: process.env.JSON_LIMIT || '100kb'
    },
    urlencoded: {
      extended: true,
      limit: process.env.URL_LIMIT || '100kb'
    },
    cors: false
  }
}
