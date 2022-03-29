const constants = require("./constants");

/**
 * Representation of a Category and the interests in that category.
 */
export class Category {
  title: string;
  interests: string[];

  /**
   * Constructor for Category class.
   * @param title Human-readable title for this category
   * @param interests Array of interests in this category
   */
  constructor(title: string, interests: string[]) {
    this.title = title;
    this.interests = interests;
  }

  /**
   * Creates a description of the object. Intended for use in conversion to Firestore.
   * @returns An object/dictionary describing the object.
   */
  toDict() {
    return {
      [constants.CATEGORY_TITLE_FIELD]: this.title,
      [constants.CATEGORY_INTERESTS_FIELD]: this.interests,
    }
  }

  /**
   * Creates an object from a dictionary describing it.
   * @param dict Dictionary describing the category. Must contain 'title' and 'interests' keys.
   * @returns A Category object that is similar to the provided dictionary.
   */
  static fromDict(dict: any) : Category {
    return new Category(dict.title, dict.interests);
  }
}

/**
 * Representation of CategorizedInterests.
 */
export class CategorizedInterests {
  categories: Category[];

  /**
   * Constructor for CategorizedInterests class.
   * @param categories Array of categories in this object.
   */
  constructor(categories: Category[]) {
    this.categories = categories;
  }

  /**
   * Creates a description of the object. Intended for use in conversion to Firestore.
   * @returns An array describing the object.
   */
  toArray() {
    return this.categories.map(category => category.toDict());
  }

  /**
   * Creates a flattened representation of the interests from every category in this object.
   * @returns Array of interests containing elements from every category in this object.
   */
  getFlattenedInterests() {
    return this.categories.flatMap(category => category.interests);
  }

  /**
   * Creates an object from an array describing the categories in it.
   * @param array Array of objects/dictionaries describing the categories contained in the CategorizedInterests object.
   * @returns A CategorizedInterests object that is similar to the provided array.
   */
  static fromArray(array: any[]) : CategorizedInterests {
    const categories = array.map(entry => Category.fromDict(entry));
    return new CategorizedInterests(categories);
  }

  /**
   * Compares equality between two CategorizedInterests objects.
   * @param other Object to compare with
   * @returns True if both objects have the same values for each field
   */
  equals(other: CategorizedInterests) {
    const flattenedInterests1 = this.getFlattenedInterests()
    const flattenedInterests2 = other.getFlattenedInterests()
    return flattenedInterests1.sort().join(',') === flattenedInterests2.sort().join(',');
  }
}

/**
 * Representation of a user's Preferences.
 */
export class Preferences {
  categorizedInterests: CategorizedInterests;
  genders: string[];
  maxAge: number;
  minAge: number;

  /**
   * Constructor for Preferences class.
   * @param categorizedInterests CategorizedInterests corresponding to the interests the user wants to see in others
   * @param genders Array of genders the user is interested in
   * @param maxAge Maximum age the user is interested in
   * @param minAge Minimum age the user is interested in
   */
  constructor(categorizedInterests: CategorizedInterests, genders: string[], maxAge: number, minAge: number) {
    this.categorizedInterests = categorizedInterests;
    this.genders = genders;
    this.maxAge = maxAge;
    this.minAge = minAge;
  }

  /**
   * Creates a description of the object. Intended for use in conversion to Firestore.
   * @returns An object/dictionary describing the object.
   */
  toDict() {
    return {
      [constants.PREFERENCES_CATEGORIZED_INTERESTS_FIELD]: this.categorizedInterests.toArray(),
      [constants.PREFERENCES_MAX_AGE_FIELD]: this.maxAge,
      [constants.PREFERENCES_MIN_AGE_FIELD]: this.minAge,
    };
  }

  /**
   * Creates an object from a dictionary describing it.
   * @param dict Dictionary describing the indexed user. Must contain 'categorizedInterests', 'genders', 'maxAge' and 'minAge' keys.
   * @returns A Preferences object that is similar to the provided dictionary.
   */
  static fromDict(dict: any) : Preferences {
    const categorizedInterests = CategorizedInterests.fromArray(dict.categorizedInterests);
    return new Preferences(categorizedInterests, dict.genders, dict.maxAge, dict.minAge);
  }

  /**
   * Compares equality between two Preferences objects.
   * @param other Object to compare with
   * @returns True if both objects have the same values for each field
   */
  equals(other: Preferences) {
    return this.maxAge == other.maxAge && this.minAge == other.minAge && this.genders.sort().join(',') == other.genders.sort().join(',') && this.categorizedInterests.equals(other.categorizedInterests);
  }
}

/**
 * Representation of a user.
 */
export class User {
  uid: string;
  bio: string;
  firstName: string;
  lastName: string;
  dob: Date;
  gender: string;
  categorizedInterests: CategorizedInterests;
  profileImageUrl: string;
  university: string;
  preferences: Preferences;
  likes: string[];

  /**
   * Constructor for the User class.
   * @param uid User ID of the user
   * @param bio Bio of the user
   * @param firstName First name of the user
   * @param lastName Last name of the user
   * @param dob Date of birth of the user
   * @param gender Gender of the user
   * @param categorizedInterests CategorizedInterests of the user
   * @param profileImageUrl URL for profile image of the user
   * @param university University of the user
   * @param preferences Preferences of the user
   * @param likes Array of user IDs the the user has liked.
   */
  constructor(uid: string,
              bio: string,
              firstName: string,
              lastName: string,
              dob: Date,
              gender: string,
              categorizedInterests: CategorizedInterests,
              profileImageUrl: string,
              university: string,
              preferences: Preferences,
              likes : string[]) {
    this.uid = uid;
    this.bio = bio;
    this.firstName = firstName;
    this.lastName = lastName;
    this.dob = dob;
    this.gender = gender;
    this.categorizedInterests = categorizedInterests;
    this.profileImageUrl = profileImageUrl;
    this.university = university;
    this.preferences = preferences;
    this.likes = likes;
  }

  /**
   * Creates a description of the object. Intended for use in conversion to Firestore.
   * @returns An object/dictionary describing the object.
   */
  toDict() {
    return {
      [constants.USER_UID_FIELD]: this.uid,
      [constants.USER_BIO_FIELD]: this.bio,
      [constants.USER_FIRST_NAME_FIELD]: this.firstName,
      [constants.USER_LAST_NAME_FIELD]: this.lastName,
      [constants.USER_DOB_FIELD]: this.dob,
      [constants.USER_GENDER_FIELD]: this.gender,
      [constants.USER_CATEGORIZED_INTERESTS_FIELD]: this.categorizedInterests.toArray(),
      [constants.USER_PROFILE_IMAGE_URL_FIELD]: this.profileImageUrl,
      [constants.USER_UNIVERSITY_FIELD]: this.university,
      [constants.USER_PREFERENCES_FIELD]: this.preferences.toDict(),
      [constants.USER_LIKES_FIELD]: this.likes,
    };
  }
}

/**
 * Representation of a user's interests similarity with another user's interests.
 */
export class IndexedUserID {
  uid: string;
  index: number;

  /**
   * Constructor for IndexedUserID class.
   * @param uid The user ID of the user represented in the object
   * @param index The Jaccard index of this user's interests relative to another user's interests
   */
  constructor(uid: string, index: number) {
    this.uid = uid;
    this.index = index;
  }

  /**
   * Creates a description of the object. Intended for use in conversion to Firestore.
   * @returns An object/dictionary describing the object.
   */
  toDict() {
    return {
      "uid": this.uid,
      "index": this.index,
    }
  }

  /**
   * Creates an object from a dictionary describing it.
   * @param dict Dictionary describing the indexed user. Must contain 'uid' and 'index' keys.
   * @returns An IndexedUserID object that is similar to the provided dictionary.
   */
  static fromDict(dict: any) {
    return new IndexedUserID(dict.uid, dict.index);
  }
}

/**
 * Representation of Recommendations object.
 */
export class Recommendations {
  lastNumberOfRecs: number;
  queueID: string;
  recommendations: IndexedUserID[];

  /**
   * Constructor for Recommendations class.
   * @param queueID ID of the queue from which this recommendation object is created
   * @param lastNumberOfRecs Number of recommendations this queue contained when it was created
   * @param entries Array of IndexedUserID representing the recommendations themselves
   */
  constructor(queueID: string, lastNumberOfRecs: number, entries: IndexedUserID[]) {
    this.queueID = queueID;
    this.lastNumberOfRecs = lastNumberOfRecs;
    this.recommendations = entries;
  }

  /**
   * Creates a description of the object. Intended for use in conversion to Firestore.
   * @returns An object/dictionary describing the object.
   */
  toDict() {
    return {
      [constants.RECOMMENDATIONS_QUEUE_ID_FIELD]: this.queueID,
      [constants.RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD]: this.lastNumberOfRecs,
      [constants.RECOMMENDATIONS_ENTRIES_ARRAY_FIELD]: this.recommendations.map(entry => entry.toDict())
    };
  }
}

/**
 * Firestore object converter for User.
 * Used to translate a Firestore snapshot into a User object (and vice versa).
 */
export var userConverter = {
  toFirestore: (user: User) => {
    return user.toDict();
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);

    const categorizedInterests = CategorizedInterests.fromArray(data.categorizedInterests);
    const preferences = Preferences.fromDict(data.preferences);
    return new User(snapshot.id, data.bio, data.firstName, data.lastName, data.dob, data.gender, categorizedInterests, data.profileImageUrl, data.university, preferences, data.likes);
  }
}

/**
 * Firestore object converter for Recommendations.
 * Used to translate a Firestore snapshot into a Recommendations object (and vice versa).
 */
export var recommendationConverter = {
  toFirestore: (recommendations: Recommendations) => {
    return recommendations.toDict()
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    const recommendations = data.recommendations.map((entry: any) => new IndexedUserID(entry.uid, entry.index));
    return new Recommendations(data[constants.RECOMMENDATIONS_QUEUE_ID_FIELD], data[constants.RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD], recommendations);
  }
}