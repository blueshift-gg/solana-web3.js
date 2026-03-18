import dts from 'rollup-plugin-dts';

/** @type {import('rollup').RollupOptions[]} */
const configs = [
  {
    input: './declarations/index.d.ts',
    output: [{file: 'lib/index.d.ts', format: 'es'}],
    plugins: [dts()],
    external: ['http', 'https'],
  },
  {
    input: './declarations/compat/index.d.ts',
    output: [{file: 'lib/compat/index.d.ts', format: 'es'}],
    plugins: [dts()],
    external: ['http', 'https'],
  },
];

export default configs;
