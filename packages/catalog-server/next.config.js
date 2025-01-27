// eslint-disable-next-line @typescript-eslint/no-var-requires
const withNx = require('@nrwl/next/plugins/with-nx');
const withAntdLess = require('next-plugin-antd-less');
const path = require('path');

const themeVariables = path.resolve(__dirname, './styles/antd-variables.less');

/**
 * @type {import('@nrwl/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    vulcanSQLHost: process.env.VULCAN_SQL_HOST || 'http://localhost:3000',
    tokenSecret: process.env.TOKEN_SECRET || 'tokenSecret',
    refreshTokenSecret:
      process.env.REFRESH_TOKEN_SECRET || 'refreshTokenSecret',
  },
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  reactStrictMode: false,
  ...withAntdLess({
    lessVarsFilePath: themeVariables,
    lessVarsFilePathAppendToEndOfContent: false,
  }),
};

module.exports = withNx(nextConfig);
