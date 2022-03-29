# Besties app backend

**Application title:** Backend source code

**Authors:**
* Nikolaj Banke Jensen
* Chukwudalu Esomeju
* Dariana Dorin
* Luca Brown
* Mateusz Adamski
* Jacqueline Ilie
* Petra-Theodora Safta
* Sze Wye Tham
* Yue Yu


Backend source code for the 'Besties' app developed by SEG-Djangoals.
This repository contains all configuration files and source code used for the Besties app backend. This includes utility functions written in TypeScript to handle matching users, creating recommendations for new users, etc.

## Developer setup
**This application is intended to work on macOS and Linux only.** 

In order to use this application, you must setup credentials on your machine and install dependencies. Follow this guide:

***TODO: UPDATE DEVELOPER SETUP INSTRUCTIONS***

## Using the project
To edit security rules, edit the *'firestore.rules'* and *'storage.rules'* files.

To edit Firebase Functions, follow these instructions:
1. Open a new terminal window, and navigate to the folder called *'functions'*.
2. Use your favorite IDE to edit the TypeScript files in the *'src'* folder.

To run the Firebase Emulator instance, follow these instructions:
1. Open a new terminal window, and navigate to the folder called *'functions'*.
2. Run the command `npm run build`. This will compile and translate the .ts files into .js files. You will need to re-run this command every time you make changes to any .ts files for those changes to reflected in a running Emulator environment.
3. Open another terminal window, and navigate to the root directory of this application.
4. Run the command `firebase emulators:start`. This will start an instance of the Firebase Emulator directly in the terminal, and provide instructions on how to interact with the instance in your browser.
5. ***Optional:*** If you are using the [Backend Manager](https://github.com/nikolajjensen/besties-backend-manager) tool to test your work, you can now set the run-mode on Backend Manager to emulator mode, which will mean any actions carried out on in the tool will only affect this isolated test environment. You are now ready to do manual testing of your code.

To deploy Firebase Functions, follow these instructions:
1. Open a new terminal window, and navigate to the root directory of this project.
2. Run the command `firebase deploy --only functions`. This command builds and deploys the .ts files in *'functions/src/'*. This may take upwards of 10 minutes to complete.

## Sources
* Packages and external libraries used in this application are listed in *'package.json'* and *'functions/package.json'*.