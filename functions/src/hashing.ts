const jaccard = require('jaccard');

exports.hash = function(arr: string[]) {
  return arr.join("#").toUpperCase();
}

exports.unhash = function(hash: string) {
  return hash.split("#")
}

exports.compareHash = function(h1: string, h2: string) {
  const h1_unhashed = exports.unhash(h1);
  const h2_unhashed = exports.unhash(h2);
  return jaccard.index(h1_unhashed, h2_unhashed);
}

exports.compareSet = function(s1: string[], s2: string[]) {
  return jaccard.index(s1, s2);
}