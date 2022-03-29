"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendationConverter = exports.userConverter = exports.Recommendations = exports.IndexedUserID = exports.User = exports.Preferences = exports.CategorizedInterests = exports.Category = void 0;
const constants = require("./constants");
/**
 * Representation of a Category and the interests in that category.
 */
class Category {
    /**
     * Constructor for Category class.
     * @param title Human-readable title for this category
     * @param interests Array of interests in this category
     */
    constructor(title, interests) {
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
        };
    }
    /**
     * Creates an object from a dictionary describing it.
     * @param dict Dictionary describing the category. Must contain 'title' and 'interests' keys.
     * @returns A Category object that is similar to the provided dictionary.
     */
    static fromDict(dict) {
        return new Category(dict.title, dict.interests);
    }
}
exports.Category = Category;
/**
 * Representation of CategorizedInterests.
 */
class CategorizedInterests {
    /**
     * Constructor for CategorizedInterests class.
     * @param categories Array of categories in this object.
     */
    constructor(categories) {
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
    static fromArray(array) {
        const categories = array.map(entry => Category.fromDict(entry));
        return new CategorizedInterests(categories);
    }
    /**
     * Compares equality between two CategorizedInterests objects.
     * @param other Object to compare with
     * @returns True if both objects have the same values for each field
     */
    equals(other) {
        const flattenedInterests1 = this.getFlattenedInterests();
        const flattenedInterests2 = other.getFlattenedInterests();
        return flattenedInterests1.sort().join(',') === flattenedInterests2.sort().join(',');
    }
}
exports.CategorizedInterests = CategorizedInterests;
/**
 * Representation of a user's Preferences.
 */
class Preferences {
    /**
     * Constructor for Preferences class.
     * @param categorizedInterests CategorizedInterests corresponding to the interests the user wants to see in others
     * @param genders Array of genders the user is interested in
     * @param maxAge Maximum age the user is interested in
     * @param minAge Minimum age the user is interested in
     */
    constructor(categorizedInterests, genders, maxAge, minAge) {
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
    static fromDict(dict) {
        const categorizedInterests = CategorizedInterests.fromArray(dict.categorizedInterests);
        return new Preferences(categorizedInterests, dict.genders, dict.maxAge, dict.minAge);
    }
    /**
     * Compares equality between two Preferences objects.
     * @param other Object to compare with
     * @returns True if both objects have the same values for each field
     */
    equals(other) {
        return this.maxAge == other.maxAge && this.minAge == other.minAge && this.genders.sort().join(',') == other.genders.sort().join(',') && this.categorizedInterests.equals(other.categorizedInterests);
    }
}
exports.Preferences = Preferences;
/**
 * Representation of a user.
 */
class User {
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
    constructor(uid, bio, firstName, lastName, dob, gender, categorizedInterests, profileImageUrl, university, preferences, likes) {
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
exports.User = User;
/**
 * Representation of a user's interests similarity with another user's interests.
 */
class IndexedUserID {
    /**
     * Constructor for IndexedUserID class.
     * @param uid The user ID of the user represented in the object
     * @param index The Jaccard index of this user's interests relative to another user's interests
     */
    constructor(uid, index) {
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
        };
    }
    /**
     * Creates an object from a dictionary describing it.
     * @param dict Dictionary describing the indexed user. Must contain 'uid' and 'index' keys.
     * @returns An IndexedUserID object that is similar to the provided dictionary.
     */
    static fromDict(dict) {
        return new IndexedUserID(dict.uid, dict.index);
    }
}
exports.IndexedUserID = IndexedUserID;
/**
 * Representation of Recommendations object.
 */
class Recommendations {
    /**
     * Constructor for Recommendations class.
     * @param queueID ID of the queue from which this recommendation object is created
     * @param lastNumberOfRecs Number of recommendations this queue contained when it was created
     * @param entries Array of IndexedUserID representing the recommendations themselves
     */
    constructor(queueID, lastNumberOfRecs, entries) {
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
exports.Recommendations = Recommendations;
/**
 * Firestore object converter for User.
 * Used to translate a Firestore snapshot into a User object (and vice versa).
 */
exports.userConverter = {
    toFirestore: (user) => {
        return user.toDict();
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        const categorizedInterests = CategorizedInterests.fromArray(data.categorizedInterests);
        const preferences = Preferences.fromDict(data.preferences);
        return new User(snapshot.id, data.bio, data.firstName, data.lastName, data.dob, data.gender, categorizedInterests, data.profileImageUrl, data.university, preferences, data.likes);
    }
};
/**
 * Firestore object converter for Recommendations.
 * Used to translate a Firestore snapshot into a Recommendations object (and vice versa).
 */
exports.recommendationConverter = {
    toFirestore: (recommendations) => {
        return recommendations.toDict();
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        const recommendations = data.recommendations.map((entry) => new IndexedUserID(entry.uid, entry.index));
        return new Recommendations(data[constants.RECOMMENDATIONS_QUEUE_ID_FIELD], data[constants.RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD], recommendations);
    }
};
//# sourceMappingURL=models.js.map