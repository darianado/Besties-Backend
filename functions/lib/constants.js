"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_AVATAR_FOLDER_REF = exports.RECOMMENDATIONS_ENTRIES_ARRAY_FIELD = exports.RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD = exports.USER_INTERESTS_FIELD = exports.USER_DOB_FIELD = exports.USER_RECOMMENDATIONS_REF = exports.USER_DERIVED_REF = exports.USERS_REF = exports.THRESHOLD_FOR_GENERATING_RECOMMENDATIONS = exports.MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE = exports.DEPLOYMENT_REGION = void 0;
// Overall parameters
exports.DEPLOYMENT_REGION = 'europe-west2';
exports.MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE = 1000;
exports.THRESHOLD_FOR_GENERATING_RECOMMENDATIONS = 0.1;
// Firestore paths
exports.USERS_REF = 'users';
exports.USER_DERIVED_REF = 'derived';
exports.USER_RECOMMENDATIONS_REF = 'recommendations';
// Firestore field names
exports.USER_DOB_FIELD = 'dob';
exports.USER_INTERESTS_FIELD = 'interests';
//export const USER_PREFERENCES_FIELD = 'preferences';
//export const USER_PREFERENCES_MAX_AGE_FIELD = 'maxAge';
//export const USER_PREFERENCES_MIN_AGE_FIELD = 'minAge';
//export const USER_PREFERENCES_INTERESTS_FIELD = 'interests';
exports.RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD = 'lastNumberOfRecs';
exports.RECOMMENDATIONS_ENTRIES_ARRAY_FIELD = 'entries';
// Storage paths
exports.USER_AVATAR_FOLDER_REF = 'user_avatars/';
//# sourceMappingURL=constants.js.map