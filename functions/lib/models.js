"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendationConverter = exports.userConverter = exports.Recommendations = exports.User = exports.Preferences = exports.CategorizedInterests = exports.Category = void 0;
const constants = require("./constants");
class Category {
    constructor(title, interests) {
        this.title = title;
        this.interests = interests;
    }
    toDict() {
        return {
            "title": this.title,
            "interests": this.interests,
        };
    }
    static fromDict(dict) {
        return new Category(dict.title, dict.interests);
    }
}
exports.Category = Category;
class CategorizedInterests {
    constructor(categories) {
        this.categories = categories;
    }
    toList() {
        return this.categories.map(category => category.toDict());
    }
    getFlattenedInterests() {
        return this.categories.flatMap(category => category.interests);
    }
    static fromList(list) {
        const categories = list.map(entry => Category.fromDict(entry));
        return new CategorizedInterests(categories);
    }
}
exports.CategorizedInterests = CategorizedInterests;
class Preferences {
    constructor(categorizedInterests, maxAge, minAge) {
        this.categorizedInterests = categorizedInterests;
        this.maxAge = maxAge;
        this.minAge = minAge;
    }
    toDict() {
        return {
            'categorizedInterests': this.categorizedInterests.toList(),
            'maxAge': this.maxAge,
            'minAge': this.minAge,
        };
    }
    static fromDict(dict) {
        const categorizedInterests = CategorizedInterests.fromList(dict.categorizedInterests);
        return new Preferences(categorizedInterests, dict.maxAge, dict.minAge);
    }
}
exports.Preferences = Preferences;
class User {
    constructor(uid, bio, firstName, lastName, dob, gender, categorizedInterests, profileImageUrl, university, preferences) {
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
    }
    toDict() {
        return {
            'uid': this.uid,
            'bio': this.bio,
            'firstName': this.firstName,
            'lastName': this.lastName,
            'dob': this.dob,
            'gender': this.gender,
            'categorizedInterests': this.categorizedInterests.toList(),
            'profileImageUrl': this.profileImageUrl,
            'university': this.university,
            'preferences': this.preferences.toDict(),
        };
    }
}
exports.User = User;
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
            [constants.RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD]: this.numberOfRecommendations,
            [constants.RECOMMENDATIONS_ENTRIES_ARRAY_FIELD]: this.entries
        };
    }
}
exports.Recommendations = Recommendations;
exports.userConverter = {
    toFirestore: (user) => {
        return user.toDict();
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        const categorizedInterests = CategorizedInterests.fromList(data.categorizedInterests);
        const preferences = Preferences.fromDict(data.preferences);
        return new User(snapshot.id, data.bio, data.firstName, data.lastName, data.dob, data.gender, categorizedInterests, data.profileImageUrl, data.university, preferences);
    }
};
exports.recommendationConverter = {
    toFirestore: (recommendations) => {
        return recommendations.toDict();
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return new Recommendations(data[constants.RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD], data[constants.RECOMMENDATIONS_ENTRIES_ARRAY_FIELD]);
    }
};
//# sourceMappingURL=models.js.map