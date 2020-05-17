// vue.config.js

module.exports = {
  runtimeCompiler: true,

  indexPath: '../views/index.html',
  outputDir: '../public',
  publicPath: '/public',

  devServer: {
    disableHostCheck: true,
    proxy: {
      ['/api']: { target: 'http://dev.chest.store:8000' },
      ['/auth/']: { target: 'http://dev.chest.store:8000' },
      ['/file/']: { target: 'http://dev.chest.store:8000' },
      ['/git/']: { target: 'http://dev.chest.store:8000' },
      ['/logout']: { target: 'http://dev.chest.store:8000' },
      ['/object']: { target: 'http://dev.chest.store:8000' },
      // ['/public']: { target: 'http://dev.chest.store:8000' },
      ['/socket.io']: {
        target: 'http://dev.chest.store:8000',
        ws: true
      }
    }
  },

  pages: {
    index: {
      entry: './src/main.js',
      template: './index.pug'
    }
  },

  pluginOptions: {
    webpackBundleAnalyzer: {
      openAnalyzer: false,
      analyzerPort: 9999
    }
  },

  configureWebpack: {
    externals: (process.env.NODE_ENV !== 'test') ? {
      jquery: 'jQuery'
    } : {},

    resolve: {
      alias: {
        // https://medium.com/js-dojo/how-to-reduce-your-vue-js-bundle-size-with-webpack-3145bf5019b7
        moment: 'moment/src/moment'
      }
    }
  }
}
