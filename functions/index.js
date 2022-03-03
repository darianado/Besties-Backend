const { firestore } = require("firebase-admin");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const hashing = require("./hashing");

admin.initializeApp();

const usersRef = 'users';

exports.createRecommendations = async function(preferences, userId) {
  var users = await admin.firestore().collection(usersRef)
                                            .where('age', '<=', preferences.maxAge)
                                            .where('age', '>=', preferences.minAge)
                                            .where('interests', 'array-contains-any', preferences.interests)
                                            .get().then(snapshot => {
                                              return snapshot.docs.map(doc => {
                                                return { 'id': doc.id, 'index': hashing.compareSet(doc.data().interests, preferences.interests) }
                                              }).filter(e => e.id != userId);
                                            });

  users.sort((a, b) => ((a.index < b.index) ? -1 : ((a.index > b.index) ? 1 : 0)));

  users = users.slice(0, 1000);

  return await admin.firestore().collection(usersRef).doc(userId).collection("meta").doc("recommendations").set({
    'lastNumberOfRecs': users.length,
    'entries': users,
  }, { 'merge': true });
}

exports.createUser = functions.firestore.document(`${usersRef}/{userId}`).onCreate((snapshot, context) => {
  return this.createRecommendations(snapshot.data().preferences, snapshot.id);
});

exports.deleteUser = functions.firestore.document(`${usersRef}/{userId}`).onDelete((snapshot, context) => {
  return snapshot.ref.collection("meta").doc("recommendations").delete();
});

exports.updateUser = functions.firestore.document(`${usersRef}/{userId}`).onUpdate((snapshot, context) => {
  const preferencesBefore = snapshot.before.data().preferences;
  const preferencesAfter = snapshot.after.data().preferences;

  if(preferencesAfter == preferencesBefore) {
    return;
  }

  return this.createRecommendations(snapshot.after.data().preferences, snapshot.after.id);
});

exports.requestRecommendations = functions.https.onRequest(async (req, res) => {
  const userId = req.body.userId;
  const recs = req.body.recs;

  const userDoc = await admin.firestore().collection(usersRef).doc(userId).get();
  const recommendationDoc = await admin.firestore().collection(usersRef).doc(userId).collection("meta").doc("recommendations").get();
  const entries = recommendationDoc.data().entries;
  const lastNumberOfRecs = recommendationDoc.data().lastNumberOfRecs;

  if(entries.length >= 1) {
    // Return entries as they are, (async append to queue with new recs).
    const result = await this.removeRecommendations(recs, entries, admin.firestore().collection(usersRef).doc(userId).collection("meta").doc("recommendations"));

    if(entries.length - result.length <= lastNumberOfRecs * 0.1) {
      // Add new entries to the queue, if there is less than 10% of the original users in the queue.
      this.createRecommendations(userDoc.data().preferences, userId);
    }

    return res.send({'data': result });
  } else {
    // await append to queue, and return result, no matter what it is.
    await this.createRecommendations(userDoc.data().preferences, userId);
    const newRecDoc = await admin.firestore().collection(usersRef).doc(userId).collection("meta").doc("recommendations").get();
    const result = await this.removeRecommendations(recs, newRecDoc.data().entries, admin.firestore().collection(usersRef).doc(userId).collection("meta").doc("recommendations"));
    return res.send({'data': result });
  }
});

exports.removeRecommendations = async function(n, entries, ref) {
  const popped = entries.slice(Math.max(entries.length - n, 0));
  await ref.set({
    'entries': entries.slice(0, entries.length - popped.length)
  }, { 'merge': true });

  return popped;
}