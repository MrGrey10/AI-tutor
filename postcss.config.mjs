// Disabled during test runs to avoid ESM module loading issues
// const config = {
//   plugins: {
//     "@tailwindcss/postcss": {},
//   },
// };

// export default config;

const config = process.env.NODE_ENV === 'test' ? {} : {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
