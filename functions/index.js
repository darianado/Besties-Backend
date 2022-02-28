const admin = require("firebase-admin");
const functions = require("firebase-functions");
const hashing = require("./hashing");

admin.initializeApp();

const hashesRef = 'derived/hashes';
const usersColPath = 'users';


// ###############################################
// #   Paths
// ###############################################



// ###############################################
// #   Hashing
// ###############################################



exports.getPerfectMatchHash = async function (targetHash) {
  const hashes = await this.getHashes();

  for (hash of hashes) {
    if (hashing.compareHash(targetHash, hash) == 1) {
      return hash;
    }
  }

  return null;
}

exports.createDocIfMissing = function (path) {
  const docRef = admin.firestore().doc(path);

  docRef.get().then((doc) => {
    if (doc.exists) {
      return;
    } else {
      return docRef.set({});
    }
  })
}

exports.addHashForUser = async function (hash, userId) {
  this.createDocIfMissing(hashesRef);
  const matchHash = await this.getPerfectMatchHash(hash);
  return admin.firestore().collection(`${hashesRef}/${matchHash ?? hash}`).doc(userId).set({});
}

exports.deleteHashForUser = async function (hash, userId) {
  const matchHash = await this.getPerfectMatchHash(hash);
  return admin.firestore().collection(`${hashesRef}/${matchHash ?? hash}`).doc(userId).delete();
}


exports.createHash = functions.firestore.document(`${usersColPath}/{userId}`).onCreate((snapshot, context) => {
  const data = snapshot.data();
  const hash = hashing.hash(data.interests);

  return this.addHashForUser(hash, context.params.userId);
});


exports.deleteHash = functions.firestore.document(`${usersColPath}/{userId}`).onDelete((snapshot, context) => {
  const data = snapshot.data();
  const hash = hashing.hash(data.interests);

  return this.deleteHashForUser(hash, context.params.userId);
});

exports.updateHash = functions.firestore.document(`${usersColPath}/{userId}`).onUpdate((snapshot, context) => {
  const prevData = snapshot.before.data();
  const currentData = snapshot.after.data();

  if (prevData.interests == currentData.interests) {
    return;
  }

  const prevHash = hashing.hash(prevData.interests);
  const currentHash = hashing.hash(currentData.interests);

  this.deleteHashForUser(prevHash, context.params.userId);
  return this.addHashForUser(currentHash, context.params.userId);
});






// ###############################################
// #   Recommendation Engine
// ###############################################
exports.getHashes = async function () {
  return await admin.firestore().doc(hashesRef).listCollections().then(snapshot => {
    return snapshot.map(collection => collection.id)
  });
}

exports.getAllHashesSortedBySimilarity = async function (hash) {
  const allHashes = await this.getHashes();
  return allHashes.sort((a, b) => { 
    const simA = hashing.compareHash(hash, a);
    const simB = hashing.compareHash(hash, b);

    if(simA < simB) {
      return 1;
    } else if (simA > simB) {
      return -1;
    } else {
      return 0;
    }
  });
}

exports.getUsersFromHash = async function(hash) {
  return await admin.firestore().doc(hashesRef).collection(hash).listDocuments().then(snapshot => {
    return snapshot.map(document => document.id);
  });
}

exports.getBestMatches = async function(user_id, sorted_hashes, number_of_recommendations, max_age, min_age) {
  var final_matches = [];

  while(final_matches.length < number_of_recommendations && !(sorted_hashes.length <= 0)) {
    const potential_matches = await this.getUsersFromHash(sorted_hashes.shift());
    final_matches = final_matches.concat(potential_matches);
  }

  const index = final_matches.indexOf(user_id);
  if(index > -1) {
    final_matches.splice(index, 1);
  }

  return final_matches;
}


exports.getRecHTTPs = functions.https.onRequest(async (req, res) => {
  const user_id = req.body.user_id;
  const number_of_recommendations = req.body.number_of_recommendations;
  const max_age = req.body.max_age;
  const min_age = req.body.min_age;

  const user = await admin.firestore().collection(usersColPath).doc(user_id).get();
  const data = user.data();
  const hash = hashing.hash(data.interests);

  const sorted_hashes = await this.getAllHashesSortedBySimilarity(hash);
  const matches = await this.getBestMatches(user_id, sorted_hashes, number_of_recommendations, max_age, min_age);
  
  return res.send({ "status": 200, "message": "Ready to handle recommendation request.", "data": matches })
})