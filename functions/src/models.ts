const constants = require("./constants");


export class Category {
  title: string;
  interests: string[];

  constructor(title: string, interests: string[]) {
    this.title = title;
    this.interests = interests;
  }

  toDict() {
    return {
      "title": this.title,
      "interests": this.interests,
    }
  }

  static fromDict(dict: any) : Category {
    return new Category(dict.title, dict.interests);
  }
}

export class CategorizedInterests {
  categories: Category[];

  constructor(categories: Category[]) {
    this.categories = categories;
  }

  toList() {
    return this.categories.map(category => category.toDict());
  }

  getFlattenedInterests() {
    return this.categories.flatMap(category => category.interests);
  }

  static fromList(list: any[]) : CategorizedInterests {
    const categories = list.map(entry => Category.fromDict(entry));
    return new CategorizedInterests(categories);
  }
}

export class Preferences {
  categorizedInterests: CategorizedInterests;
  maxAge: number;
  minAge: number;

  constructor(categorizedInterests: CategorizedInterests, maxAge: number, minAge: number) {
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

  static fromDict(dict: any) : Preferences {
    const categorizedInterests = CategorizedInterests.fromList(dict.categorizedInterests);
    return new Preferences(categorizedInterests, dict.maxAge, dict.minAge);
  }
}

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

export class Recommendations {
  numberOfRecommendations: number;
  entries: string[];

  constructor(numberOfRecommendations: number, entries: (string | User)[]) {
    this.numberOfRecommendations = numberOfRecommendations;

    if (typeof entries[0] === 'string') {
      this.entries = entries as string[];
    } else {
      this.entries = (entries as User[]).map((user: User) => user.uid);
    }
  }

  toDict() {
    return {
      [constants.RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD]: this.numberOfRecommendations,
      [constants.RECOMMENDATIONS_ENTRIES_ARRAY_FIELD]: this.entries
    };
  }
}

export var userConverter = {
  toFirestore: (user: User) => {
    return user.toDict();
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);

    const categorizedInterests = CategorizedInterests.fromList(data.categorizedInterests);
    const preferences = Preferences.fromDict(data.preferences);
    return new User(snapshot.id, data.bio, data.firstName, data.lastName, data.dob, data.gender, categorizedInterests, data.profileImageUrl, data.university, preferences, data.likes);
  }
}

export var recommendationConverter = {
  toFirestore: (recommendations: Recommendations) => {
    return recommendations.toDict()
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return new Recommendations(data[constants.RECOMMENDATIONS_LAST_NUMBER_OF_RECOMMENDATIONS_FIELD], data[constants.RECOMMENDATIONS_ENTRIES_ARRAY_FIELD]);
  }
}