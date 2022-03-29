"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_PROFILE_PICTURES_FOLDER = exports.RECOMMENDATIONS_QUEUE_ID_FIELD = exports.RECOMMENDATIONS_ENTRIES_ARRAY_FIELD = exports.RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD = exports.MATCH_TIMESTAMP_FIELD = exports.MATCH_USER_IDS_FIELD = exports.CATEGORY_INTERESTS_FIELD = exports.CATEGORY_TITLE_FIELD = exports.PREFERENCES_MIN_AGE_FIELD = exports.PREFERENCES_MAX_AGE_FIELD = exports.PREFERENCES_CATEGORIZED_INTERESTS_FIELD = exports.USER_LIKES_FIELD = exports.USER_PREFERENCES_FIELD = exports.USER_UNIVERSITY_FIELD = exports.USER_PROFILE_IMAGE_URL_FIELD = exports.USER_CATEGORIZED_INTERESTS_FIELD = exports.USER_GENDER_FIELD = exports.USER_DOB_FIELD = exports.USER_LAST_NAME_FIELD = exports.USER_FIRST_NAME_FIELD = exports.USER_BIO_FIELD = exports.USER_UID_FIELD = exports.USER_RECOMMENDATIONS_REF = exports.USER_DERIVED_REF = exports.USERS_REF = exports.MATCHES_REF = exports.THRESHOLD_FOR_GENERATING_RECOMMENDATIONS = exports.MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE = exports.DEPLOYMENT_REGION = void 0;
/* Function configuration/parameters */
exports.DEPLOYMENT_REGION = 'europe-west2';
exports.MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE = 1000;
exports.THRESHOLD_FOR_GENERATING_RECOMMENDATIONS = 0.1;
/* Firestore paths */
exports.MATCHES_REF = 'matches';
exports.USERS_REF = 'users';
exports.USER_DERIVED_REF = 'derived';
exports.USER_RECOMMENDATIONS_REF = 'recommendations';
/* Firestore fields */
exports.USER_UID_FIELD = 'uid';
exports.USER_BIO_FIELD = 'bio';
exports.USER_FIRST_NAME_FIELD = 'firstName';
exports.USER_LAST_NAME_FIELD = 'lastName';
exports.USER_DOB_FIELD = 'dob';
exports.USER_GENDER_FIELD = 'gender';
exports.USER_CATEGORIZED_INTERESTS_FIELD = 'categorizedInterests';
exports.USER_PROFILE_IMAGE_URL_FIELD = 'profileImageUrl';
exports.USER_UNIVERSITY_FIELD = 'university';
exports.USER_PREFERENCES_FIELD = 'preferences';
exports.USER_LIKES_FIELD = 'likes';
exports.PREFERENCES_CATEGORIZED_INTERESTS_FIELD = 'categorizedInterests';
exports.PREFERENCES_MAX_AGE_FIELD = 'maxAge';
exports.PREFERENCES_MIN_AGE_FIELD = 'minAge';
exports.CATEGORY_TITLE_FIELD = 'title';
exports.CATEGORY_INTERESTS_FIELD = 'interests';
exports.MATCH_USER_IDS_FIELD = 'uids';
exports.MATCH_TIMESTAMP_FIELD = 'timestamp';
exports.RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD = 'lastNumberOfRecs';
exports.RECOMMENDATIONS_ENTRIES_ARRAY_FIELD = 'recommendations';
exports.RECOMMENDATIONS_QUEUE_ID_FIELD = 'queueID';
/* Storage paths */
exports.USER_PROFILE_PICTURES_FOLDER = 'profile_pictures';
//# sourceMappingURL=constants.js.map