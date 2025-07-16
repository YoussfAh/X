const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
  // Add webpack aliases for cleaner imports
  addWebpackAlias({
    '@': path.resolve(__dirname, 'src'),
    '@components': path.resolve(__dirname, 'src/components'),
    '@pages': path.resolve(__dirname, 'src/pages'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@services': path.resolve(__dirname, 'src/services'),
    '@assets': path.resolve(__dirname, 'src/assets'),
    '@styles': path.resolve(__dirname, 'src/styles'),
  }),

  // Configure webpack for better performance
  (config) => {
    // Enable source maps in development
    if (process.env.NODE_ENV === 'development') {
      config.devtool = 'cheap-module-source-map';
    }

    // Optimize chunks
    if (config.optimization) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  }
);
