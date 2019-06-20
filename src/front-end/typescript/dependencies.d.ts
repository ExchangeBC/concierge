/**
 * Created this module to workaround declaration file for
 * react-select/creatable that lags behind the module's structure.
 *
 * Related GitHub Issue: https://github.com/JedWatson/react-select/issues/3592#issuecomment-498458451
 *
 * TODO upgrade @types/react-select once available.
 */

declare module 'react-select/creatable' {
  import Creatable from 'react-select/lib/Creatable';
  export * from 'react-select/lib/Creatable';
  export default Creatable;
}
