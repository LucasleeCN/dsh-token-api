// Host half of the token billing panel plugin.
//
// The whole panel lives in the browser half (`./client.js`). This empty host
// apply exists only so the package is a normal Loader entry; the client-modules
// host service discovers `dsh.client` and serves the browser bundle.
export function apply() {}
