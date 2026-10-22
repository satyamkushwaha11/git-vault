// Dev-only workaround: this machine's ISP route to GitHub's India edge is broken.
// Resolve GitHub hosts to GitHub's US edge (official range 140.82.112.0/20) inside this process only.
const dns = require("node:dns");
const PIN = { "github.com": "140.82.112.3", "api.github.com": "140.82.112.5" };
const orig = dns.lookup;
function lookup(host, opts, cb) {
  if (typeof opts === "function") { cb = opts; opts = {}; }
  const ip = PIN[host];
  if (ip) {
    const rec = { address: ip, family: 4 };
    return process.nextTick(() => (opts && opts.all) ? cb(null, [rec]) : cb(null, ip, 4));
  }
  return orig.call(dns, host, opts, cb);
}
dns.lookup = lookup;
if (dns.promises) {
  const origP = dns.promises.lookup;
  dns.promises.lookup = (host, opts) => PIN[host]
    ? Promise.resolve((opts && opts.all) ? [{ address: PIN[host], family: 4 }] : { address: PIN[host], family: 4 })
    : origP.call(dns.promises, host, opts);
}
console.log("[gh-dns] pinning github.com/api.github.com to GitHub US edge");
