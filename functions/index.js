const admin = require("firebase-admin");
const functions = require("firebase-functions");
const hashing = require("./hashing");

admin.initializeApp();

exports.getRecHTTPs = functions.https.onRequest((req, res) => {
    const userId = req.body.userId
    return res.send({ "status": 200, "message": "Ready to handle recommendation request.", "userId": userId })
})

// Listen for creations in all documents in the 'users' collection
exports.createHash = functions.firestore.document('users/{userId}').onCreate((snapshot, context) => {
      const data = snapshot.data();
      const h = hashing.hash(data.interests);

      return admin.firestore().collection(`user_hashes/${h}/users`).doc(context.params.userId).set({});
});

// Listen for deletions in all documents in the 'users' collection
exports.deleteHash = functions.firestore.document('users/{userId}').onDelete((snapshot, context) => {
  const data = snapshot.data();
  const h = hashing.hash(data.interests);

  return admin.firestore().collection(`user_hashes/${h}/users`).doc(context.params.userId).delete();
});