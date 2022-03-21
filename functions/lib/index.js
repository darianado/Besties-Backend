"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRecommendations = exports.requestRecommendationsRequest = exports.updateUser = exports.deleteUser = exports.createUser = exports.deleteAllImagesForUser = exports.removeRecommendations = exports.createRecommendations = void 0;
//const { firestore } = require("firebase-admin");
const admin = require("firebase-admin");
//const functions = require("firebase-functions");
const hashing = require("./hashing");
const functions = require("firebase-functions");
admin.initializeApp();
// Overall parameters
const DEPLOYMENT_REGION = 'europe-west2';
const MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE = 1000;
const THRESHOLD_FOR_GENERATING_RECOMMENDATIONS = 0.1;
// Firestore paths
const USERS_REF = 'users';
const USER_DERIVED_REF = 'derived';
const USER_RECOMMENDATIONS_REF = 'recommendations';
// Firestore field names
const USER_DOB_FIELD = 'dob';
const USER_INTERESTS_FIELD = 'interests';
//const USER_PREFERENCES_FIELD = 'preferences';
//const USER_PREFERENCES_MAX_AGE_FIELD = 'maxAge';
//const USER_PREFERENCES_MIN_AGE_FIELD = 'minAge';
//const USER_PREFERENCES_INTERESTS_FIELD = 'interests';
const RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD = 'lastNumberOfRecs';
const RECOMMENDATIONS_ENTRIES_ARRAY_FIELD = 'entries';
// Storage paths
const USER_AVATAR_FOLDER_REF = 'user_avatars/';
class GeoLocation {
    constructor(lat, lon) {
        this.lat = lat;
        this.lon = lon;
    }
    toDict() {
        return {
            'lat': this.lat,
            'lon': this.lon,
        };
    }
}
class Preferences {
    constructor(interests, maxAge, minAge) {
        this.interests = interests;
        this.maxAge = maxAge;
        this.minAge = minAge;
    }
    toDict() {
        return {
            'interests': this.interests,
            'maxAge': this.maxAge,
            'minAge': this.minAge,
        };
    }
}
class User {
    constructor(uid, firstName, lastName, age, interests, location, preferences) {
        this.uid = uid;
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = age;
        this.interests = interests;
        this.location = location;
        this.preferences = preferences;
    }
    toDict() {
        return {
            'uid': this.uid,
            'firstName': this.firstName,
            'lastName': this.lastName,
            'age': this.age,
            'interests': this.interests,
            'location': this.location.toDict(),
            'preferences': this.preferences.toDict(),
        };
    }
}
var userConverter = {
    toFirestore: (user) => {
        return user.toDict();
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        const location = new GeoLocation(data.location.lat, data.location.lon);
        const preferences = new Preferences(data.preferences.interests, data.preferences.maxAge, data.preferences.minAge);
        return new User(snapshot.id, data.firstName, data.lastName, data.age, data.interests, location, preferences);
    }
};
class Recommendations {
    constructor(numberOfRecommendations, entries) {
        this.numberOfRecommendations = numberOfRecommendations;
        if (typeof entries[0] === 'string') {
            this.entries = entries;
        }
        else {
            this.entries = entries.map((user) => user.uid);
        }
    }
    toDict() {
        return {
            [RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD]: this.numberOfRecommendations,
            [RECOMMENDATIONS_ENTRIES_ARRAY_FIELD]: this.entries
        };
    }
}
var recommendationConverter = {
    toFirestore: (recommendations) => {
        return recommendations.toDict();
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return new Recommendations(data[RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD], data[RECOMMENDATIONS_ENTRIES_ARRAY_FIELD]);
    }
};
const createRecommendations = async function (user) {
    var users = await admin.firestore().collection(USERS_REF)
        .where(USER_DOB_FIELD, '<=', user.preferences.maxAge)
        .where(USER_DOB_FIELD, '>=', user.preferences.minAge)
        .where(USER_INTERESTS_FIELD, 'array-contains-any', user.preferences.interests)
        .withConverter(userConverter)
        .get()
        .then((snapshot) => {
        return snapshot.docs
            .map((doc) => doc.data())
            .filter((entry) => entry.uid != user.uid)
            .sort((userA, userB) => {
            const similarityA = hashing.compareSet(userA.interests, user.preferences.interests);
            const similarityB = hashing.compareSet(userB.interests, user.preferences.interests);
            return ((similarityA < similarityB) ? -1 : ((similarityA > similarityB) ? 1 : 0));
        });
    });
    users = users.slice(0, MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE);
    console.log("users: " + users.length);
    const recommendations = new Recommendations(users.length, users);
    console.log("recommendations: " + recommendations.entries.length);
    return await admin.firestore().collection(USERS_REF).doc(user.uid).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF).withConverter(recommendationConverter).set(recommendations, { 'merge': true });
};
exports.createRecommendations = createRecommendations;
const removeRecommendations = async function (n, entries, ref) {
    const popped = entries.slice(Math.max(entries.length - n, 0));
    await ref.set({
        [RECOMMENDATIONS_ENTRIES_ARRAY_FIELD]: entries.slice(0, entries.length - popped.length)
    }, { 'merge': true });
    return popped;
};
exports.removeRecommendations = removeRecommendations;
const deleteAllImagesForUser = async function (userId) {
    const bucket = admin.storage().bucket();
    return bucket.deleteFiles({
        prefix: `${USER_AVATAR_FOLDER_REF}/${userId}`
    });
};
exports.deleteAllImagesForUser = deleteAllImagesForUser;
// ##########################################################
// # Firestore triggers
// ##########################################################
exports.createUser = functions.region(DEPLOYMENT_REGION).firestore.document(`${USERS_REF}/{userId}`).onCreate((snapshot, context) => {
    const user = userConverter.fromFirestore(snapshot, context);
    return (0, exports.createRecommendations)(user);
});
exports.deleteUser = functions.region(DEPLOYMENT_REGION).firestore.document(`${USERS_REF}/{userId}`).onDelete((snapshot, context) => {
    (0, exports.deleteAllImagesForUser)(snapshot.id);
    return snapshot.ref.collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF).delete();
});
exports.updateUser = functions.region(DEPLOYMENT_REGION).firestore.document(`${USERS_REF}/{userId}`).onUpdate((snapshot, context) => {
    const userBefore = userConverter.fromFirestore(snapshot.before, context);
    const userAfter = userConverter.fromFirestore(snapshot.after, context);
    if (userBefore.preferences == userAfter.preferences) {
        return;
    }
    return (0, exports.createRecommendations)(userAfter);
});
// ##########################################################
// # Callable functions
// ##########################################################
exports.requestRecommendationsRequest = functions.region(DEPLOYMENT_REGION).https.onRequest(async (request, response) => {
    const userId = request.body.userId;
    const recs = request.body.recs;
    const user = (await admin.firestore().collection(USERS_REF).doc(userId).withConverter(userConverter).get()).data();
    const recommendations = (await admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF).withConverter(recommendationConverter).get()).data();
    if (recommendations.entries.length >= 1) {
        // Return entries as they are, (async append to queue with new recs).
        const result = await (0, exports.removeRecommendations)(recs, recommendations.entries, admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF));
        if (recommendations.entries.length - result.length <= recommendations.lastNumberOfRecs * THRESHOLD_FOR_GENERATING_RECOMMENDATIONS) {
            // Add new entries to the queue, if there is less than 10% of the original users in the queue.
            (0, exports.createRecommendations)(user);
        }
        response.send({ 'data': result });
    }
    else {
        // await append to queue, and return result, no matter what it is.
        await (0, exports.createRecommendations)(user);
        const newRecDoc = await admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF).get();
        const result = await (0, exports.removeRecommendations)(recs, newRecDoc.data().entries, admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF));
        response.send({ 'data': result });
    }
});
exports.requestRecommendations = functions.region(DEPLOYMENT_REGION).https.onCall(async (data, context) => {
    const userId = data.userId;
    const recs = data.recs;
    const user = (await admin.firestore().collection(USERS_REF).doc(userId).withConverter(userConverter).get()).data();
    const recommendations = (await admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF).withConverter(recommendationConverter).get()).data();
    if (recommendations.entries.length >= 1) {
        // Return entries as they are, (async append to queue with new recs).
        const result = await (0, exports.removeRecommendations)(recs, recommendations.entries, admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF));
        if (recommendations.entries.length - result.length <= recommendations.lastNumberOfRecs * THRESHOLD_FOR_GENERATING_RECOMMENDATIONS) {
            // Add new entries to the queue, if there is less than 10% of the original users in the queue.
            (0, exports.createRecommendations)(user);
        }
        return { 'data': result };
    }
    else {
        // await append to queue, and return result, no matter what it is.
        await (0, exports.createRecommendations)(user);
        const newRecDoc = await admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF).get();
        const result = await (0, exports.removeRecommendations)(recs, newRecDoc.data().entries, admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF));
        return { 'data': result };
    }
});
/*
// Test functions for Flutter testing.

export const testNoParam = functions.region(DEPLOYMENT_REGION).https.onCall((data: any, context: CallableContext) => {
  return {"hello": "world"};
});

export const testUserIDfromAuth = functions.region(DEPLOYMENT_REGION).https.onCall((data: any, context: CallableContext) => {
  return {"hello": context.auth?.uid};
});

export const testParamString = functions.region(DEPLOYMENT_REGION).https.onCall((data: any, context: CallableContext) => {
  return {"hello": data.text};
});

export const testParamNumber = functions.region(DEPLOYMENT_REGION).https.onCall((data: any, context: CallableContext) => {
  return {"hello": data.num};
});
*/ 
//# sourceMappingURL=index.js.map