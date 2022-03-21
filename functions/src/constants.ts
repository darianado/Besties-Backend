// Overall parameters
export const DEPLOYMENT_REGION = 'europe-west2';
export const MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE = 1000;
export const THRESHOLD_FOR_GENERATING_RECOMMENDATIONS = 0.1;

// Firestore paths
export const USERS_REF = 'users';
export const USER_DERIVED_REF = 'derived';
export const USER_RECOMMENDATIONS_REF = 'recommendations';

// Firestore field names
export const USER_DOB_FIELD = 'dob';
export const USER_INTERESTS_FIELD = 'interests';
//export const USER_PREFERENCES_FIELD = 'preferences';
//export const USER_PREFERENCES_MAX_AGE_FIELD = 'maxAge';
//export const USER_PREFERENCES_MIN_AGE_FIELD = 'minAge';
//export const USER_PREFERENCES_INTERESTS_FIELD = 'interests';

export const RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD = 'lastNumberOfRecs';
export const RECOMMENDATIONS_ENTRIES_ARRAY_FIELD = 'recommendations';

// Storage paths
export const USER_AVATAR_FOLDER_REF = 'user_avatars/';