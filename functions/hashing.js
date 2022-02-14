const jaccard = require('jaccard');

exports.hash = function(arr) {
  return arr.join("#").toUpperCase();
}

exports.unhash = function(hash) {
  return hash.split("#")
}

exports.compare = function(h1, h2) {
  const h1_unhashed = exports.unhash(h1);
  const h2_unhashed = exports.unhash(h2);
  return jaccard.index(h1_unhashed, h2_unhashed);
}