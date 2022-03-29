/* Function configuration/parameters */
export const DEPLOYMENT_REGION = 'europe-west2';
export const MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE = 1000;
export const THRESHOLD_FOR_GENERATING_RECOMMENDATIONS = 0.1;

/* Firestore paths */
export const MATCHES_REF = 'matches';
export const USERS_REF = 'users';
export const USER_DERIVED_REF = 'derived';
export const USER_RECOMMENDATIONS_REF = 'recommendations';
export const MATCH_MESSAGES_REF = 'messages';

/* Firestore fields */
export const USER_UID_FIELD = 'uid';
export const USER_BIO_FIELD = 'bio';
export const USER_FIRST_NAME_FIELD = 'firstName';
export const USER_LAST_NAME_FIELD = 'lastName';
export const USER_DOB_FIELD = 'dob';
export const USER_GENDER_FIELD = 'gender';
export const USER_CATEGORIZED_INTERESTS_FIELD = 'categorizedInterests';
export const USER_PROFILE_IMAGE_URL_FIELD = 'profileImageUrl';
export const USER_UNIVERSITY_FIELD = 'university';
export const USER_PREFERENCES_FIELD = 'preferences';
export const USER_LIKES_FIELD = 'likes';

export const PREFERENCES_CATEGORIZED_INTERESTS_FIELD = 'categorizedInterests';
export const PREFERENCES_MAX_AGE_FIELD = 'maxAge';
export const PREFERENCES_MIN_AGE_FIELD = 'minAge';

export const CATEGORY_TITLE_FIELD = 'title';
export const CATEGORY_INTERESTS_FIELD = 'interests';

export const MATCH_USER_IDS_FIELD = 'uids';
export const MATCH_TIMESTAMP_FIELD = 'timestamp';

export const RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD = 'lastNumberOfRecs';
export const RECOMMENDATIONS_ENTRIES_ARRAY_FIELD = 'recommendations';
export const RECOMMENDATIONS_QUEUE_ID_FIELD = 'queueID';

/* Storage paths */
export const USER_PROFILE_PICTURES_FOLDER = 'profile_pictures';