const configs = {
  js: {
    presets: [
      [
        '@babel/preset-env',
        {
          modules: false,
          useBuiltIns: 'usage',
          corejs: 2,
          targets: { browsers: ['Chrome >= 49'] }
        }
      ],
      '@babel/typescript'
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true, }],
      ['@babel/plugin-proposal-private-methods', { loose: true, }],
      ['@babel/plugin-proposal-private-property-in-object', { loose: true, }],
      ['@babel/plugin-syntax-dynamic-import'],
      ['@babel/plugin-transform-runtime', { useESModules: false, }],
    ]
  },
  es: {
    presets: [
      '@babel/typescript',
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/proposal-class-properties',
    ]
  },
  demo: {
    presets: [
      [
        '@babel/preset-env',
        {
          modules: false,
          useBuiltIns: 'usage',
          corejs: 2,
          targets: { browsers: ['Chrome >= 86'] }
        }
      ],
      ['babel-preset-react-scope-style', {}],
      '@babel/typescript',
      '@babel/preset-react'
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true, }],
      ['@babel/plugin-proposal-private-methods', { loose: true, }],
      ['@babel/plugin-proposal-private-property-in-object', { loose: true, }],
      ['@babel/plugin-syntax-dynamic-import'],
      ['@babel/plugin-transform-runtime', { useESModules: false, }],
    ]
  }
};

module.exports = configs[process.env.BUILD_ENV] || configs.js;
