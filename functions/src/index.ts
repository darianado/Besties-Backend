//const { firestore } = require("firebase-admin");
const admin = require("firebase-admin");
//const functions = require("firebase-functions");
const hashing = require("./hashing");

import * as functions from 'firebase-functions';

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
const USER_AGE_FIELD = 'age';
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
  lat: number;
  lon: number;

  constructor(lat: number, lon: number) {
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
  interests: string[];
  maxAge: number;
  minAge: number;

  constructor(interests: string[], maxAge: number, minAge: number) {
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
  uid: string;
  firstName: string;
  lastName: string;
  age: number;
  interests: string[];
  location: GeoLocation;
  preferences: Preferences;

  constructor(uid: string, firstName: string, lastName: string, age: number, interests: string[], location: GeoLocation, preferences: Preferences) {
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
  toFirestore: (user: User) => {
    return user.toDict();
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);

    const location = new GeoLocation(data.location.lat, data.location.lon);
    const preferences = new Preferences(data.preferences.interests, data.preferences.maxAge, data.preferences.minAge);
    return new User(snapshot.id, data.firstName, data.lastName, data.age, data.interests, location, preferences);
  } 
}

class Recommendations {
  numberOfRecommendations: number;
  entries: string[];

  constructor(numberOfRecommendations: number, entries: (string | User)[]) {
    this.numberOfRecommendations = numberOfRecommendations;

    if(typeof entries[0] === 'string') {
      this.entries = entries as string[]; 
    } else {
      this.entries = (entries as User[]).map((user: User) => user.uid);
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
  toFirestore: (recommendations: Recommendations) => {
    return recommendations.toDict()
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return new Recommendations(data[RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD], data[RECOMMENDATIONS_ENTRIES_ARRAY_FIELD]);
  }
}


export const createRecommendations = async function(user: User) {
  var users = await admin.firestore().collection(USERS_REF)
                                            .where(USER_AGE_FIELD, '<=', user.preferences.maxAge)
                                            .where(USER_AGE_FIELD, '>=', user.preferences.minAge)
                                            .where(USER_INTERESTS_FIELD, 'array-contains-any', user.preferences.interests)
                                            .withConverter(userConverter)
                                            .get()
                                            .then((snapshot: any) => {
                                              return snapshot.docs
                                                  .map((doc: any) => doc.data())
                                                  .filter((entry: User) => entry.uid != user.uid)
                                                  .sort((userA: User, userB: User) => {
                                                    const similarityA = hashing.compareSet(userA.interests, user.preferences.interests)
                                                    const similarityB = hashing.compareSet(userB.interests, user.preferences.interests)
                                                    return ((similarityA < similarityB) ? -1 : ((similarityA > similarityB) ? 1 : 0));
                                                  });
                                            });

  users = users.slice(0, MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE);

  const recommendations = new Recommendations(users.length, users);

  return await admin.firestore().collection(USERS_REF).doc(user.uid).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF).withConverter(recommendationConverter).set(recommendations, { 'merge': true });
}

export const removeRecommendations = async function(n: number, entries: User[], ref: any) {
  const popped = entries.slice(Math.max(entries.length - n, 0));
  await ref.set({
    [RECOMMENDATIONS_ENTRIES_ARRAY_FIELD]: entries.slice(0, entries.length - popped.length)
  }, { 'merge': true });

  return popped;
}

export const deleteAllImagesForUser = async function(userId: string) {
  const bucket = admin.storage().bucket();
  return bucket.deleteFiles({
    prefix: `${USER_AVATAR_FOLDER_REF}/${userId}`
  });
}

// ##########################################################
// # Firestore triggers
// ##########################################################

export const createUser = functions.region(DEPLOYMENT_REGION).firestore.document(`${USERS_REF}/{userId}`).onCreate((snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
  const user = userConverter.fromFirestore(snapshot, context);
  return createRecommendations(user);
});

export const deleteUser = functions.region(DEPLOYMENT_REGION).firestore.document(`${USERS_REF}/{userId}`).onDelete((snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
  deleteAllImagesForUser(snapshot.id);
  return snapshot.ref.collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF).delete();
});

export const updateUser = functions.region(DEPLOYMENT_REGION).firestore.document(`${USERS_REF}/{userId}`).onUpdate((snapshot: functions.Change<functions.firestore.QueryDocumentSnapshot>, context: functions.EventContext) => {
  const userBefore = userConverter.fromFirestore(snapshot.before, context);
  const userAfter = userConverter.fromFirestore(snapshot.after, context);

  if(userBefore.preferences == userAfter.preferences) {
    return;
  }

  return createRecommendations(userAfter);
});


// ##########################################################
// # Callable functions
// ##########################################################

export const requestRecommendations = functions.region(DEPLOYMENT_REGION).https.onRequest(async (request: functions.https.Request, response: functions.Response<any>) => {
  const userId = request.body.userId;
  const recs = request.body.recs;

  const user = await admin.firestore().collection(USERS_REF).doc(userId).withConverter(userConverter).get();

  const recommendations = await admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF).withConverter(recommendationConverter).get();

  if(recommendations.entries.length >= 1) {
    // Return entries as they are, (async append to queue with new recs).
    const result = await removeRecommendations(recs, recommendations.entries, admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF));

    if(recommendations.entries.length - result.length <= recommendations.lastNumberOfRecs * THRESHOLD_FOR_GENERATING_RECOMMENDATIONS) {
      // Add new entries to the queue, if there is less than 10% of the original users in the queue.
      createRecommendations(user);
    }

    response.send({'data': result });
  } else {
    // await append to queue, and return result, no matter what it is.
    await createRecommendations(user);
    const newRecDoc = await admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF).get();
    const result = await removeRecommendations(recs, newRecDoc.data().entries, admin.firestore().collection(USERS_REF).doc(userId).collection(USER_DERIVED_REF).doc(USER_RECOMMENDATIONS_REF));
    response.send({'data': result });
  }
})