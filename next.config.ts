import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'public/sw.ts',
  swDest: 'public/sw.js',
  disable:
    process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
};
export default withSerwist(nextConfig);